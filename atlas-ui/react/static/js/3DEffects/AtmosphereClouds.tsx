// atlas-ui/react/static/js/3DEffects/AtmosphereClouds.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getUniverseTime } from "../Utils/UniverseTime";

export interface AtmosphereCloudsParams {
  color?: THREE.Color | number;
  cloudCount?: number;
  size?: number;
  opacity?: number;
  density?: number;
  seed?: number;
  rotationSpeed?: number;
  movementAmplitude?: number;
  puffiness?: number;
  cloudsFromPython?: any[];
  cosmicOriginTime?: number;
  timeSpeed?: number;
}

const PROCEDURAL_RANGES = {
  CLOUD_COUNT: { min: 15, max: 30 },
  SIZE: { min: 3.8, max: 5.5 },
  OPACITY: { min: 0.4, max: 0.9 },
  DENSITY: { min: 0.5, max: 2 },
  ROTATION_SPEED: { min: 0.002, max: 0.008 },
  MOVEMENT_AMPLITUDE: { min: 0.003, max: 0.02 },
  PUFFINESS: { min: 1.0, max: 1.4 },
  TIME_SPEED: { min: 0.1, max: 3.0 },
};

export class AtmosphereCloudsEffect {
  private cloudSystem: THREE.Group;
  private material: THREE.ShaderMaterial;
  private params: AtmosphereCloudsParams;
  private cloudCount: number;
  private clouds: THREE.Mesh[] = [];
  private cosmicOriginTime: number;
  private cosmicOffset: number;

  private static readonly vertexShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    uniform float time;
    uniform float movementAmplitude;
    
    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;

      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;

      vec3 pos = position;

      float slowTime = time * 0.01;
      pos += sin(slowTime + worldPosition.x * 0.01) * movementAmplitude * 0.1;
      pos += cos(slowTime * 0.8 + worldPosition.z * 0.01) * movementAmplitude * 0.1;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  private static readonly fragmentShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    uniform float time;
    uniform float opacity;
    uniform vec3 cloudColor;
    uniform float density;
    uniform vec2 noiseOffset;
    uniform float shapeVariation;
    uniform vec3 lightDirection;
    uniform vec3 lightPosition;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 0.0;
      
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    
    void main() {

      vec2 center = vec2(0.5);
      float distFromCenter = length(vUv - center);

      float circularMask = 1.0 - smoothstep(0.1, 0.5, distFromCenter);

      float animSpeed1 = time * 0.002;
      float animSpeed2 = time * 0.001;
      float animSpeed3 = time * 0.0005;
      
      vec2 noiseUv1 = vUv * 4.0 + noiseOffset + vec2(animSpeed1, animSpeed1 * 0.7);
      float noise1 = fbm(noiseUv1) * 0.7;
      
      vec2 noiseUv2 = vUv * 8.0 + noiseOffset * 1.3 + vec2(animSpeed2, animSpeed2 * 0.8);
      float noise2 = fbm(noiseUv2) * 0.5;
      
      vec2 noiseUv3 = vUv * 16.0 + noiseOffset * 2.1 + vec2(animSpeed3, animSpeed3 * 0.9);
      float noise3 = fbm(noiseUv3) * 0.3;

      float cloudNoise = noise1 + noise2 + noise3;
      cloudNoise = smoothstep(0.2, 1.0, cloudNoise);

      float baseCloud = cloudNoise * circularMask * density;

      float densityFalloff = pow(circularMask, 1.5);

      float finalCloud = baseCloud * densityFalloff;

      finalCloud = pow(finalCloud, 0.8);

      vec3 finalColor = cloudColor;

      float colorVariation = 1.0 - distFromCenter * 0.3;
      finalColor *= colorVariation;

      float lightIntensity = dot(vNormal, normalize(vec3(0.8, 1.0, 0.6))) * 0.15 + 0.85;
      finalColor *= lightIntensity;

      float alpha = finalCloud * opacity;
      alpha *= (1.0 - distFromCenter * 0.5);

      vec3 lightDir;
      if (length(lightPosition) > 0.0) {
        lightDir = normalize(lightPosition - vWorldPosition);
      } else {
        lightDir = normalize(-lightDirection);
      }

      vec3 planetNormal = normalize(vWorldPosition);
      float dotNL = dot(planetNormal, lightDir);

      float lightFactor = smoothstep(-0.2, 0.2, dotNL);
      alpha *= mix(0.3, 1.0, lightFactor);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  constructor(planetRadius: number, params: AtmosphereCloudsParams = {}) {
    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    this.cosmicOriginTime = params.cosmicOriginTime || 514080000;

    this.cosmicOffset = (seed % 3600) * 10;

    this.params = {
      color: params.color || new THREE.Color(0xffffff),
      cloudCount: params.cloudCount || Math.floor(rng.uniform(PROCEDURAL_RANGES.CLOUD_COUNT.min, PROCEDURAL_RANGES.CLOUD_COUNT.max)),
      size: params.size || rng.uniform(PROCEDURAL_RANGES.SIZE.min, PROCEDURAL_RANGES.SIZE.max),
      opacity: params.opacity || rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max),
      density: params.density || rng.uniform(PROCEDURAL_RANGES.DENSITY.min, PROCEDURAL_RANGES.DENSITY.max),
      rotationSpeed: params.rotationSpeed || rng.uniform(PROCEDURAL_RANGES.ROTATION_SPEED.min, PROCEDURAL_RANGES.ROTATION_SPEED.max),
      movementAmplitude: params.movementAmplitude || rng.uniform(PROCEDURAL_RANGES.MOVEMENT_AMPLITUDE.min, PROCEDURAL_RANGES.MOVEMENT_AMPLITUDE.max),
      puffiness: params.puffiness || rng.uniform(PROCEDURAL_RANGES.PUFFINESS.min, PROCEDURAL_RANGES.PUFFINESS.max),
      timeSpeed: params.timeSpeed || rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),
      seed: seed,
      cosmicOriginTime: this.cosmicOriginTime,
    };

    this.cloudCount = this.params.cloudCount!;
    this.cloudSystem = new THREE.Group();
    this.material = this.createMaterial();

    this.generateClouds(planetRadius);
  }

  private generateClouds(planetRadius: number): void {
    const baseColor = this.params.color instanceof THREE.Color ? this.params.color : new THREE.Color(this.params.color as any);
    const seed = this.params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    const cosmicOffsetBase = this.cosmicOriginTime + this.cosmicOffset;

    const cloudsFromPython = this.params.cloudsFromPython;

    for (let i = 0; i < this.cloudCount; i++) {
      let x, y, z;
      let cloudColor = baseColor;
      let cloudSize = this.params.size! * rng.uniform(0.8, 1.2);

      if (cloudsFromPython && i < cloudsFromPython.length) {
        const cloudData = cloudsFromPython[i];

        x = cloudData.position[0] * planetRadius * 1.05;
        y = cloudData.position[1] * planetRadius * 1.05;
        z = cloudData.position[2] * planetRadius * 1.05;

        if (cloudData.color) {
          cloudColor = new THREE.Color().setRGB(cloudData.color[0], cloudData.color[1], cloudData.color[2]);
        }

        cloudSize = cloudData.radius * planetRadius * 0.8;
      } else {
        const phi = rng.uniform(0, 2 * Math.PI);
        const cosTheta = rng.uniform(-1, 1);
        const theta = Math.acos(cosTheta);
        const surfaceRadius = planetRadius * rng.uniform(1.03, 1.07);

        x = surfaceRadius * Math.sin(theta) * Math.cos(phi);
        y = surfaceRadius * Math.sin(theta) * Math.sin(phi);
        z = surfaceRadius * Math.cos(theta);
      }

      const baseRadius = cloudSize * rng.uniform(0.3, 0.8);

      const segments = Math.max(8, Math.floor(baseRadius * 15));
      const cloudGeometry = new THREE.PlaneGeometry(baseRadius * 2, baseRadius * 2, segments, segments);

      const cloudPosition = new THREE.Vector3(x, y, z);
      const planetCenter = new THREE.Vector3(0, 0, 0);
      const normalFromPlanet = cloudPosition.clone().normalize();

      const tangent1 = new THREE.Vector3();
      const tangent2 = new THREE.Vector3();

      if (Math.abs(normalFromPlanet.y) < 0.99) {
        tangent1.crossVectors(normalFromPlanet, new THREE.Vector3(0, 1, 0)).normalize();
      } else {
        tangent1.crossVectors(normalFromPlanet, new THREE.Vector3(1, 0, 0)).normalize();
      }

      tangent2.crossVectors(normalFromPlanet, tangent1).normalize();

      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeBasis(tangent1, tangent2, normalFromPlanet);

      const positions = cloudGeometry.attributes.position;
      const vertex = new THREE.Vector3();
      const cloudRadius = Math.sqrt(x * x + y * y + z * z);

      cloudGeometry.applyMatrix4(rotationMatrix);

      for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);

        const worldVertex = vertex.clone().add(cloudPosition);

        const direction = worldVertex.clone().normalize();
        const projectedVertex = direction.multiplyScalar(cloudRadius);

        const localVertex = projectedVertex.sub(cloudPosition);

        positions.setXYZ(i, localVertex.x, localVertex.y, localVertex.z);
      }

      positions.needsUpdate = true;
      cloudGeometry.computeVertexNormals();

      cloudGeometry.translate(x, y, z);

      const cloudMaterial = this.material.clone();
      cloudMaterial.uniforms.cloudColor.value = cloudColor;
      cloudMaterial.uniforms.density.value = this.params.density! * rng.uniform(0.8, 1.2);

      cloudMaterial.uniforms.noiseOffset.value = new THREE.Vector2((cosmicOffsetBase + rng.uniform(0, 100)) % 100, (cosmicOffsetBase + rng.uniform(0, 100)) % 100);

      cloudMaterial.uniforms.shapeVariation.value = rng.uniform(-1.0, 1.0);

      cloudMaterial.uniforms.lightDirection.value = this.material.uniforms.lightDirection.value.clone();
      cloudMaterial.uniforms.lightPosition.value = this.material.uniforms.lightPosition.value.clone();

      const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);

      cloudMesh.renderOrder = 2;

      cloudMesh.userData.isAtmosphericCloud = true;
      cloudMesh.userData.planetNormal = normalFromPlanet.clone();

      this.clouds.push(cloudMesh);
      this.cloudSystem.add(cloudMesh);
    }
  }

  private createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: AtmosphereCloudsEffect.vertexShader,
      fragmentShader: AtmosphereCloudsEffect.fragmentShader,
      uniforms: {
        time: { value: 0 },
        opacity: { value: this.params.opacity },
        movementAmplitude: { value: this.params.movementAmplitude },
        cloudColor: { value: new THREE.Color(0xffffff) },
        density: { value: this.params.density },
        noiseOffset: { value: new THREE.Vector2(0, 0) },
        shapeVariation: { value: 0.0 },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
      },
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.cloudSystem.position.copy(planetPosition);
    }
    scene.add(this.cloudSystem);
  }

  update(deltaTime: number, camera?: THREE.Camera): void {
    const timeSinceCosmicOrigin = getUniverseTime(this.cosmicOriginTime);
    const animTime = (timeSinceCosmicOrigin + this.cosmicOffset) * this.params.timeSpeed!;

    const windowedTime = animTime % 10000;

    this.clouds.forEach((cloud) => {
      const material = cloud.material as THREE.ShaderMaterial;

      material.uniforms.time.value = windowedTime;
    });

    this.cloudSystem.rotation.y = animTime * this.params.rotationSpeed!;
  }

  updateParams(newParams: Partial<AtmosphereCloudsParams>): void {
    this.params = { ...this.params, ...newParams };

    this.clouds.forEach((cloud) => {
      const material = cloud.material as THREE.ShaderMaterial;

      if (newParams.opacity !== undefined) {
        material.uniforms.opacity.value = newParams.opacity;
      }

      if (newParams.movementAmplitude !== undefined) {
        material.uniforms.movementAmplitude.value = newParams.movementAmplitude;
      }
    });
  }

  updateLightPosition(position: THREE.Vector3): void {
    this.clouds.forEach((cloud) => {
      const material = cloud.material as THREE.ShaderMaterial;
      if (material.uniforms.lightPosition) {
        material.uniforms.lightPosition.value.copy(position);
      }
    });
  }

  updateLightDirection(direction: THREE.Vector3): void {
    this.clouds.forEach((cloud) => {
      const material = cloud.material as THREE.ShaderMaterial;
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

  getObject3D(): THREE.Group {
    return this.cloudSystem;
  }

  dispose(): void {
    this.clouds.forEach((cloud) => {
      cloud.geometry.dispose();
      (cloud.material as THREE.ShaderMaterial).dispose();
    });
    this.clouds = [];

    this.cloudSystem.clear();
  }
}

export function createAtmosphereCloudsFromPythonData(planetRadius: number, surfaceData: any, globalSeed?: number, cosmicOriginTime?: number): AtmosphereCloudsEffect {
  const cloudsArray = surfaceData.clouds || [];

  if (cloudsArray.length === 0) {
    const seed = globalSeed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed + 4000);

    const params: AtmosphereCloudsParams = {
      color: new THREE.Color(1, 1, 1.0),
      cloudCount: 15,
      size: 0.6,
      opacity: 0.7,
      density: 0.8,
      seed,
      rotationSpeed: 0.005,
      movementAmplitude: 0.02,
      puffiness: 1.5,
      timeSpeed: rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),
      cosmicOriginTime: cosmicOriginTime,
    };

    return new AtmosphereCloudsEffect(planetRadius, params);
  }

  const seed = globalSeed || Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed + 4000);

  const params: AtmosphereCloudsParams = {
    color: new THREE.Color(0xffffff),
    cloudCount: cloudsArray.length,
    size: rng.uniform(PROCEDURAL_RANGES.SIZE.min, PROCEDURAL_RANGES.SIZE.max),
    opacity: rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max),
    density: rng.uniform(PROCEDURAL_RANGES.DENSITY.min, PROCEDURAL_RANGES.DENSITY.max),
    seed,
    rotationSpeed: rng.uniform(PROCEDURAL_RANGES.ROTATION_SPEED.min, PROCEDURAL_RANGES.ROTATION_SPEED.max),
    movementAmplitude: rng.uniform(PROCEDURAL_RANGES.MOVEMENT_AMPLITUDE.min, PROCEDURAL_RANGES.MOVEMENT_AMPLITUDE.max),
    puffiness: rng.uniform(PROCEDURAL_RANGES.PUFFINESS.min, PROCEDURAL_RANGES.PUFFINESS.max),
    timeSpeed: rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),
    cosmicOriginTime: cosmicOriginTime,
    cloudsFromPython: cloudsArray,
  };

  return new AtmosphereCloudsEffect(planetRadius, params);
}
