// atlas-ui/react/static/js/3DEffects/MagmaEruptionsEffect.tsx

import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime";

export interface MagmaEruptionParams {
  magmaLakes?: any[];
  seed?: number;
  eruptionIntensity?: number;
  eruptionFrequency?: number;
  projectileCount?: number;
  projectileSize?: number;
  arcHeight?: number;
  cosmicOriginTime?: number;
  timeSpeed?: number;
}

const PROCEDURAL_RANGES = {
  ERUPTION_INTENSITY: { min: 0.5, max: 1.5 },
  ERUPTION_FREQUENCY: { min: 3, max: 8 },
  PROJECTILE_COUNT: { min: 3, max: 8 },
  PROJECTILE_SIZE: { min: 0.001, max: 0.004 },
  ARC_HEIGHT: { min: 0.01, max: 0.04 },
  FLARE_LENGTH: { min: 0.08, max: 0.25 },
  TIME_SPEED: { min: 0.8, max: 1.2 },
};

interface Projectile {
  mesh: THREE.Mesh;
  origin: THREE.Vector3;
  target: THREE.Vector3;
  currentPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  progress: number;
  totalTime: number;
  size: number;
  temperature: number;
  trail: THREE.Mesh[];
}

interface EruptionPattern {
  id: number;
  position: THREE.Vector3;
  intervalSeconds: number;
  phaseOffset: number;
  intensity: number;
}

export class MagmaEruptionsEffect {
  private eruptionsGroup: THREE.Group;
  private projectilesGroup: THREE.Group;
  private trailsGroup: THREE.Group;
  private splashGroup: THREE.Group;
  private eruptionPatterns: EruptionPattern[] = [];
  private params: MagmaEruptionParams;
  private planetRadius: number;
  private cosmicOriginTime: number;
  private cosmicOffset: number;
  private rng: SeededRandom;

  private projectilePool: THREE.Mesh[] = [];
  private trailPool: THREE.Mesh[] = [];
  private splashPool: THREE.Mesh[] = [];

  private static readonly projectileVertexShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    
    uniform float time;
    uniform float temperature;
    
    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      
      vec3 pos = position;
      float deform = sin(time * 10.0 + position.x * 5.0) * 0.02;
      pos += normal * deform;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  private static readonly projectileFragmentShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    
    uniform float time;
    uniform float temperature;
    uniform vec3 baseColor;
    uniform vec3 lightDirection;
    uniform vec3 lightPosition;
    uniform float glowIntensity;
    
    void main() {
      vec3 coolColor = vec3(0.4, 0.08, 0.0);
      vec3 warmColor = vec3(0.9, 0.3, 0.05);
      vec3 hotColor = vec3(1.0, 0.8, 0.3);
      vec3 veryHotColor = vec3(1.2, 1.0, 0.8);
      
      vec3 color;
      if (temperature > 0.75) {
        color = mix(hotColor, veryHotColor, (temperature - 0.75) * 4.0);
      } else if (temperature > 0.5) {
        color = mix(warmColor, hotColor, (temperature - 0.5) * 4.0);
      } else if (temperature > 0.25) {
        color = mix(coolColor, warmColor, (temperature - 0.25) * 4.0);
      } else {
        color = coolColor;
      }
      
      vec3 lightDir;
      if (length(lightPosition) > 0.0) {
        lightDir = normalize(lightPosition - vWorldPosition);
      } else {
        lightDir = normalize(-lightDirection);
      }
      
      vec3 normal = normalize(vWorldNormal);
      float dotNL = dot(normal, lightDir);
      float lighting = smoothstep(-0.3, 0.1, dotNL) * 0.3 + 0.7;
      
      float emission = glowIntensity * (0.8 + temperature * 0.4);
      color *= lighting;
      color += color * emission;
      
      float fresnel = pow(1.0 - abs(dot(normalize(vPosition), vNormal)), 2.0);
      color += veryHotColor * fresnel * 0.3 * temperature;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  private static readonly trailVertexShader = `
    varying vec2 vUv;
    varying float vAlpha;
    attribute float alpha;
    
    void main() {
      vUv = uv;
      vAlpha = alpha;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  private static readonly trailFragmentShader = `
    varying vec2 vUv;
    varying float vAlpha;
    
    uniform vec3 color;
    uniform float time;
    
    void main() {
      float fade = 1.0 - vUv.y;
      float alpha = fade * vAlpha * 0.6;
      
      vec3 finalColor = color * (0.5 + fade * 0.5);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  constructor(planetRadius: number, params: MagmaEruptionParams = {}) {
    this.planetRadius = planetRadius;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    this.cosmicOriginTime = params.cosmicOriginTime || 514080000;
    this.cosmicOffset = (seed % 3600) * 10;
    this.rng = new SeededRandom(seed);

    this.params = {
      eruptionIntensity: params.eruptionIntensity || this.rng.uniform(PROCEDURAL_RANGES.ERUPTION_INTENSITY.min, PROCEDURAL_RANGES.ERUPTION_INTENSITY.max),
      eruptionFrequency: params.eruptionFrequency || this.rng.uniform(PROCEDURAL_RANGES.ERUPTION_FREQUENCY.min, PROCEDURAL_RANGES.ERUPTION_FREQUENCY.max),
      projectileCount: params.projectileCount || Math.floor(this.rng.uniform(PROCEDURAL_RANGES.PROJECTILE_COUNT.min, PROCEDURAL_RANGES.PROJECTILE_COUNT.max)),
      projectileSize: params.projectileSize || this.rng.uniform(PROCEDURAL_RANGES.PROJECTILE_SIZE.min, PROCEDURAL_RANGES.PROJECTILE_SIZE.max),
      arcHeight: params.arcHeight || this.rng.uniform(PROCEDURAL_RANGES.ARC_HEIGHT.min, PROCEDURAL_RANGES.ARC_HEIGHT.max),
      timeSpeed: params.timeSpeed || this.rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),
      seed,
      cosmicOriginTime: this.cosmicOriginTime,
      magmaLakes: params.magmaLakes || [],
    };

    this.eruptionsGroup = new THREE.Group();
    this.projectilesGroup = new THREE.Group();
    this.trailsGroup = new THREE.Group();
    this.splashGroup = new THREE.Group();

    this.eruptionsGroup.add(this.projectilesGroup);
    this.eruptionsGroup.add(this.trailsGroup);
    this.eruptionsGroup.add(this.splashGroup);

    this.generateEruptionPatterns();

    this.initializeObjectPools();
  }

  private generateEruptionPatterns(): void {
    let eruptionPoints: THREE.Vector3[] = [];

    if (this.params.magmaLakes && this.params.magmaLakes.length > 0) {
      eruptionPoints = this.params.magmaLakes.map((lake) => {
        const pos = lake.position_3d || [0, 0, 1];
        return new THREE.Vector3(pos[0], pos[1], pos[2]).normalize().multiplyScalar(this.planetRadius * 1.002);
      });
    } else {
      const numPoints = Math.floor(this.rng.uniform(3, 8));
      for (let i = 0; i < numPoints; i++) {
        const phi = this.rng.uniform(0, 2 * Math.PI);
        const cosTheta = this.rng.uniform(-1, 1);
        const theta = Math.acos(cosTheta);

        eruptionPoints.push(new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta)).multiplyScalar(this.planetRadius * 1.002));
      }
    }

    this.eruptionPatterns = eruptionPoints.map((position, index) => ({
      id: index,
      position: position.clone(),
      intervalSeconds: this.rng.uniform(12, 35),
      phaseOffset: this.rng.uniform(0, Math.PI * 2),
      intensity: this.rng.uniform(0.7, 1.3),
    }));
  }

  private initializeObjectPools(): void {
    for (let i = 0; i < 50; i++) {
      const geometry = new THREE.SphereGeometry(this.params.projectileSize! * this.planetRadius, 8, 6);

      const material = new THREE.ShaderMaterial({
        vertexShader: MagmaEruptionsEffect.projectileVertexShader,
        fragmentShader: MagmaEruptionsEffect.projectileFragmentShader,
        uniforms: {
          time: { value: 0 },
          temperature: { value: 1.0 },
          baseColor: { value: new THREE.Color(1.0, 0.5, 0.1) },
          lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
          lightPosition: { value: new THREE.Vector3(0, 0, 0) },
          glowIntensity: { value: 1.0 },
        },
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      this.projectilePool.push(mesh);
      this.projectilesGroup.add(mesh);
    }
  }

  private createTrailSegment(position: THREE.Vector3, temperature: number): void {}

  private createSplash(position: THREE.Vector3, size: number): void {}

  update(deltaTime?: number, planetRotation?: number): void {
    const timeSinceCosmicOrigin = getUniverseTime(this.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME);
    const animTime = (timeSinceCosmicOrigin + this.cosmicOffset) * this.params.timeSpeed!;
    const windowedTime = animTime % 10000;

    this.calculateCurrentProjectiles(animTime);

    this.projectilePool.forEach((mesh) => {
      const material = mesh.material as THREE.ShaderMaterial;
      material.uniforms.time.value = windowedTime;
    });

    if (planetRotation !== undefined) {
      this.eruptionsGroup.rotation.y = planetRotation;
    }
  }

  private calculateCurrentProjectiles(animTime: number): void {
    this.projectilePool.forEach((mesh) => {
      mesh.visible = false;
    });

    let projectileIndex = 0;

    for (const pattern of this.eruptionPatterns) {
      const eruptionInterval = pattern.intervalSeconds;
      const phaseOffset = (pattern.phaseOffset / (Math.PI * 2)) * eruptionInterval;

      const effectiveTime = animTime - phaseOffset;

      if (effectiveTime < 0) continue;

      const eruptionNumber = Math.floor(effectiveTime / eruptionInterval);

      const lookbackEruptions = 3;

      for (let i = Math.max(0, eruptionNumber - lookbackEruptions); i <= eruptionNumber; i++) {
        const eruptionStartTime = i * eruptionInterval + phaseOffset;

        const eruptionSeed = this.params.seed! + pattern.id * 1000 + i * 13;
        const eruptionRng = new SeededRandom(eruptionSeed);

        const projectileCount = Math.floor(this.params.projectileCount! * pattern.intensity * eruptionRng.uniform(0.8, 1.2));

        for (let j = 0; j < projectileCount; j++) {
          const projectileStartTime = eruptionStartTime + eruptionRng.uniform(0, 1.0);
          const flightTime = eruptionRng.uniform(4, 8) * pattern.intensity;
          const projectileEndTime = projectileStartTime + flightTime;

          if (animTime >= projectileStartTime && animTime <= projectileEndTime) {
            if (projectileIndex < this.projectilePool.length) {
              const mesh = this.projectilePool[projectileIndex];
              projectileIndex++;

              this.renderProjectileAtTime(mesh, pattern, eruptionRng, animTime, projectileStartTime, flightTime, j);
            }
          }
        }
      }
    }
  }

  private renderProjectileAtTime(mesh: THREE.Mesh, pattern: EruptionPattern, rng: SeededRandom, currentTime: number, startTime: number, flightTime: number, projectileIndex: number): void {
    const flareAngle = rng.uniform(0, Math.PI * 2);
    const flareLength = rng.uniform(PROCEDURAL_RANGES.FLARE_LENGTH.min, PROCEDURAL_RANGES.FLARE_LENGTH.max);

    const up = pattern.position.clone().normalize();
    const right = new THREE.Vector3();
    const forward = new THREE.Vector3();

    if (Math.abs(up.z) < 0.9) {
      right.crossVectors(up, new THREE.Vector3(0, 0, 1)).normalize();
    } else {
      right.crossVectors(up, new THREE.Vector3(1, 0, 0)).normalize();
    }
    forward.crossVectors(right, up).normalize();

    const t = (currentTime - startTime) / flightTime;
    const clampedT = Math.max(0, Math.min(1, t));

    const tangentDirection = new THREE.Vector3().addScaledVector(right, Math.cos(flareAngle)).addScaledVector(forward, Math.sin(flareAngle));

    const distanceAlongSurface = flareLength * this.planetRadius * clampedT;
    const surfaceMovement = tangentDirection.clone().multiplyScalar(distanceAlongSurface);

    const currentSurfacePos = pattern.position.clone().add(surfaceMovement).normalize().multiplyScalar(this.planetRadius);

    const maxHeight = this.params.arcHeight! * this.planetRadius * pattern.intensity * rng.uniform(0.8, 1.2);

    let heightFactor;
    if (clampedT < 0.3) {
      heightFactor = Math.sin((clampedT * Math.PI) / 0.3) * (clampedT / 0.3);
    } else {
      heightFactor = Math.exp(-(clampedT - 0.3) * 3) * Math.sin(clampedT * Math.PI);
    }

    const serpentineFreq = 2 + rng.uniform(0, 3);
    const serpentineAmp = maxHeight * 0.3;
    const serpentineOffset = rng.uniform(0, Math.PI * 2);

    const serpentineX = Math.sin(clampedT * serpentineFreq * Math.PI + serpentineOffset) * serpentineAmp * clampedT;
    const serpentineY = Math.cos(clampedT * serpentineFreq * Math.PI * 1.3 + serpentineOffset) * serpentineAmp * 0.5 * clampedT;

    const surfaceUp = currentSurfacePos.clone().normalize();
    const serpentineRight = right.clone().multiplyScalar(serpentineX);
    const serpentineForward = forward.clone().multiplyScalar(serpentineY);

    const heightOffset = surfaceUp.clone().multiplyScalar(maxHeight * heightFactor);
    const finalPosition = currentSurfacePos.clone().add(heightOffset).add(serpentineRight).add(serpentineForward);

    mesh.position.copy(finalPosition);
    mesh.visible = true;

    const size = this.params.projectileSize! * rng.uniform(0.7, 1.3) * Math.sqrt(pattern.intensity);
    mesh.scale.setScalar(size / this.params.projectileSize!);

    const initialTemp = rng.uniform(0.8, 1.0) * pattern.intensity;
    const currentTemp = Math.max(0.4, initialTemp - (currentTime - startTime) * 0.05);

    const material = mesh.material as THREE.ShaderMaterial;
    material.uniforms.temperature.value = currentTemp;

    if (clampedT > 0.01) {
      const prevT = Math.max(0, clampedT - 0.01);
      const prevPos = this.calculateFlarePosition(pattern, rng, prevT, flightTime, projectileIndex);
      const direction = finalPosition.clone().sub(prevPos).normalize();
      mesh.lookAt(finalPosition.clone().add(direction));
    }
  }

  private calculateFlarePosition(pattern: EruptionPattern, rng: SeededRandom, t: number, flightTime: number, projectileIndex: number): THREE.Vector3 {
    const flareAngle = rng.uniform(0, Math.PI * 2);
    const flareLength = rng.uniform(PROCEDURAL_RANGES.FLARE_LENGTH.min, PROCEDURAL_RANGES.FLARE_LENGTH.max);

    const up = pattern.position.clone().normalize();
    const right = new THREE.Vector3();
    const forward = new THREE.Vector3();

    if (Math.abs(up.z) < 0.9) {
      right.crossVectors(up, new THREE.Vector3(0, 0, 1)).normalize();
    } else {
      right.crossVectors(up, new THREE.Vector3(1, 0, 0)).normalize();
    }
    forward.crossVectors(right, up).normalize();

    const tangentDirection = new THREE.Vector3().addScaledVector(right, Math.cos(flareAngle)).addScaledVector(forward, Math.sin(flareAngle));

    const distanceAlongSurface = flareLength * this.planetRadius * t;
    const surfaceMovement = tangentDirection.clone().multiplyScalar(distanceAlongSurface);
    const currentSurfacePos = pattern.position.clone().add(surfaceMovement).normalize().multiplyScalar(this.planetRadius);

    const maxHeight = this.params.arcHeight! * this.planetRadius * pattern.intensity * rng.uniform(0.8, 1.2);

    let heightFactor;
    if (t < 0.3) {
      heightFactor = Math.sin((t * Math.PI) / 0.3) * (t / 0.3);
    } else {
      heightFactor = Math.exp(-(t - 0.3) * 3) * Math.sin(t * Math.PI);
    }

    const surfaceUp = currentSurfacePos.clone().normalize();
    const heightOffset = surfaceUp.clone().multiplyScalar(maxHeight * heightFactor);

    return currentSurfacePos.clone().add(heightOffset);
  }

  updateLightPosition(position: THREE.Vector3): void {
    this.projectilePool.forEach((mesh) => {
      const material = mesh.material as THREE.ShaderMaterial;
      if (material.uniforms.lightPosition) {
        material.uniforms.lightPosition.value.copy(position);
      }
    });
  }

  updateLightDirection(direction: THREE.Vector3): void {
    this.projectilePool.forEach((mesh) => {
      const material = mesh.material as THREE.ShaderMaterial;
      if (material.uniforms.lightDirection) {
        material.uniforms.lightDirection.value.copy(direction);
      }
    });
  }

  updateFromThreeLight(light: THREE.DirectionalLight): void {
    this.updateLightPosition(light.position);
    const direction = light.target.position.clone().sub(light.position).normalize();
    this.updateLightDirection(direction);
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.eruptionsGroup.position.copy(planetPosition);
    }
    scene.add(this.eruptionsGroup);
  }

  getObject3D(): THREE.Group {
    return this.eruptionsGroup;
  }

  dispose(): void {
    this.projectilePool.forEach((mesh) => {
      mesh.geometry.dispose();
      (mesh.material as THREE.ShaderMaterial).dispose();
    });

    this.projectilePool = [];
    this.eruptionsGroup.clear();
  }
}

export function createMagmaEruptionsFromPythonData(planetRadius: number, surfaceData: any, globalSeed?: number, cosmicOriginTime?: number): MagmaEruptionsEffect | null {
  const magmaLakes = surfaceData.magma_lakes;

  if (!magmaLakes || magmaLakes.length === 0) {
    return null;
  }

  const seed = globalSeed || Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed + 10000);

  const params: MagmaEruptionParams = {
    eruptionIntensity: rng.uniform(PROCEDURAL_RANGES.ERUPTION_INTENSITY.min, PROCEDURAL_RANGES.ERUPTION_INTENSITY.max),
    eruptionFrequency: rng.uniform(PROCEDURAL_RANGES.ERUPTION_FREQUENCY.min, PROCEDURAL_RANGES.ERUPTION_FREQUENCY.max),
    projectileCount: Math.floor(rng.uniform(PROCEDURAL_RANGES.PROJECTILE_COUNT.min, PROCEDURAL_RANGES.PROJECTILE_COUNT.max)),
    projectileSize: rng.uniform(PROCEDURAL_RANGES.PROJECTILE_SIZE.min, PROCEDURAL_RANGES.PROJECTILE_SIZE.max),
    arcHeight: rng.uniform(PROCEDURAL_RANGES.ARC_HEIGHT.min, PROCEDURAL_RANGES.ARC_HEIGHT.max),
    timeSpeed: rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),
    seed: seed + 10000,
    cosmicOriginTime: cosmicOriginTime,
    magmaLakes: magmaLakes,
  };

  return new MagmaEruptionsEffect(planetRadius, params);
}
