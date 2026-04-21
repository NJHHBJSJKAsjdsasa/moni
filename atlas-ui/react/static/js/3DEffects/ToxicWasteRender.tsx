// atlas-ui/react/static/js/3DEffects/ToxicWasteRender.tsx

import * as THREE from "three";
import { getAnimatedUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";
import { SeededRandom } from "../Utils/SeededRandom.tsx";

export interface ToxicWasteRenderParams {
  spotCount?: number;
  spotSize?: number;
  moveSpeed?: number;
  innerRotationSpeed?: number;
  toxicColor?: THREE.Color;
  debrisColor?: THREE.Color;
  seed?: number;
  timeSpeed?: number;
  cosmicOriginTime?: number;
}

const PROCEDURAL_RANGES = {
  OBJECT_COUNT: { min: 16, max: 32 },
  SPOT_SIZE: { min: 0.4, max: 1.2 },
  SPOT_SIZE_SPECIAL: { min: 3.2, max: 4.2 },
  MOVE_SPEED: { min: 0.01, max: 0.1 },
  INNER_ROTATION_SPEED: { min: -300.0, max: 300.0 },
  PULSE_AMPLITUDE: { min: 0.1, max: 2.5 },
  TIME_SPEED: { min: 0.1, max: 3.0 },
};

const SWITCH_EFFECT = 0.04;

function createToxicSpotMaterial(toxicColor: THREE.Color, size: number, seed: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uToxicColor: { value: toxicColor },
      uSize: { value: size },
      uSeed: { value: seed },
      uPulseAmplitude: { value: 0.2 },
    },

    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      uniform float uTime;
      uniform vec3 uToxicColor;
      uniform float uSize;
      uniform float uSeed;
      uniform float uPulseAmplitude;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453);
      }

      float polygonShape(vec2 p, int vertices) {
        vec2 center = vec2(0.5);
        vec2 dir = p - center;
        float angle = atan(dir.y, dir.x);
        float radius = length(dir);
        
        float angleStep = 6.28318 / float(vertices);
        float minDist = uSize;
        
        for (int i = 0; i < 8; i++) {
          if (i >= vertices) break;
          float vertexAngle = float(i) * angleStep;
          
            float vertexHash = hash(vec2(float(i) * 17.3, uSeed));
          float vertexRadius = uSize * 0.3 * (0.7 + 0.6 * vertexHash);
          
          vec2 vertex = center + vec2(cos(vertexAngle), sin(vertexAngle)) * vertexRadius;
          float distToVertex = length(p - vertex);
          minDist = min(minDist, distToVertex);
        }
        
        return 1.0 - smoothstep(0.0, uSize * 0.1, minDist);
      }

      void main() {
        int vertices = 5 + int(hash(vec2(uSeed + 10.0, 0.0)) * 2.0);
        float polygon = polygonShape(vUv, vertices);
        
        if (polygon < 0.1) {
          discard;
        }
        
        float pulse = sin(uTime * 2.0 + uSeed) * uPulseAmplitude + (1.0 - uPulseAmplitude * 0.5);
        
        vec3 finalColor = uToxicColor * pulse;
        float alpha = polygon * 0.8;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,

    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

class ToxicSpot {
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private initialAngle: number;
  private initialPhi: number;
  private angleSpeed: number;
  private phiSpeed: number;
  private rotationSpeed: number;
  private size: number;
  private pulseAmplitude: number;
  private planetRadius: number;

  constructor(planetRadius: number, toxicColor: THREE.Color, seed: number, globalMoveSpeed?: number, globalInnerRotationSpeed?: number, useSpecialEffect?: boolean) {
    this.planetRadius = planetRadius;

    const rng = new SeededRandom(seed);

    if (useSpecialEffect) {
      this.size = rng.uniform(PROCEDURAL_RANGES.SPOT_SIZE_SPECIAL.min, PROCEDURAL_RANGES.SPOT_SIZE_SPECIAL.max);
    } else {
      this.size = rng.uniform(PROCEDURAL_RANGES.SPOT_SIZE.min, PROCEDURAL_RANGES.SPOT_SIZE.max);
    }
    this.pulseAmplitude = rng.uniform(PROCEDURAL_RANGES.PULSE_AMPLITUDE.min, PROCEDURAL_RANGES.PULSE_AMPLITUDE.max);

    const baseMoveSpeed = globalMoveSpeed !== undefined ? globalMoveSpeed : rng.uniform(PROCEDURAL_RANGES.MOVE_SPEED.min, PROCEDURAL_RANGES.MOVE_SPEED.max);
    const baseInnerRotationSpeed = globalInnerRotationSpeed !== undefined ? globalInnerRotationSpeed : rng.uniform(PROCEDURAL_RANGES.INNER_ROTATION_SPEED.min, PROCEDURAL_RANGES.INNER_ROTATION_SPEED.max);

    this.angleSpeed = rng.uniform(0.5, 1.5) * baseMoveSpeed;
    this.phiSpeed = rng.uniform(-0.3, 0.3) * baseMoveSpeed;
    this.rotationSpeed = baseInnerRotationSpeed * rng.uniform(0.8, 1.2);

    const geometry = new THREE.PlaneGeometry(this.size * 2, this.size * 2, 8, 8);

    const positions = geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];

      const vertex = new THREE.Vector3(x, y, 0);

      const surfaceRadius = this.planetRadius * 1.001;
      vertex.normalize().multiplyScalar(surfaceRadius);

      const sphericalZ = Math.sqrt(Math.max(0, surfaceRadius * surfaceRadius - x * x - y * y));
      const heightOffset = sphericalZ - surfaceRadius;

      positions[i + 2] = heightOffset;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    this.material = createToxicSpotMaterial(toxicColor, this.size, seed);
    this.material.uniforms.uPulseAmplitude.value = this.pulseAmplitude;
    this.mesh = new THREE.Mesh(geometry, this.material);

    this.initialAngle = rng.uniform(0, Math.PI * 2);
    this.initialPhi = rng.uniform(0.2, Math.PI - 0.2);
  }

  private updatePosition(time: number): void {
    const currentAngle = this.initialAngle + this.angleSpeed * time;
    let currentPhi = this.initialPhi + this.phiSpeed * time;

    currentPhi = Math.abs(currentPhi % (Math.PI * 2));
    if (currentPhi > Math.PI) {
      currentPhi = Math.PI * 2 - currentPhi;
    }

    const radius = this.planetRadius * 1.005;
    const x = radius * Math.sin(currentPhi) * Math.cos(currentAngle);
    const y = radius * Math.cos(currentPhi);
    const z = radius * Math.sin(currentPhi) * Math.sin(currentAngle);

    this.mesh.position.set(x, y, z);

    const normal = new THREE.Vector3(x, y, z).normalize();
    this.mesh.lookAt(this.mesh.position.x + normal.x, this.mesh.position.y + normal.y, this.mesh.position.z + normal.z);

    const selfRotationAngle = time * this.rotationSpeed * 0.01;
    this.mesh.rotateZ(selfRotationAngle);
  }

  update(_deltaTime: number, time: number): void {
    this.updatePosition(time);

    this.material.uniforms.uTime.value = time;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  dispose(): void {
    this.material.dispose();
    this.mesh.geometry.dispose();
  }
}

export class ToxicWasteRenderEffect {
  private spots: ToxicSpot[] = [];
  private planetRadius: number;
  private rng: SeededRandom;
  private startTime: number;
  private proceduralParams: {
    objectCount: number;
    timeSpeed: number;
    moveSpeed?: number;
    innerRotationSpeed?: number;
  };
  private toxicColor: THREE.Color;
  private cosmicOriginTime: number;
  private useSpecialEffect: boolean;
  private group: THREE.Group;

  constructor(planetRadius: number, params: ToxicWasteRenderParams = {}) {
    this.planetRadius = planetRadius;
    this.group = new THREE.Group();

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    this.rng = new SeededRandom(seed);

    this.useSpecialEffect = this.rng.random() < SWITCH_EFFECT;

    this.startTime = (seed % 10000) / 1000;
    this.cosmicOriginTime = params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME;

    this.proceduralParams = {
      objectCount: Math.floor(this.rng.uniform(PROCEDURAL_RANGES.OBJECT_COUNT.min, PROCEDURAL_RANGES.OBJECT_COUNT.max)),
      timeSpeed: params.timeSpeed || this.rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),
      moveSpeed: params.moveSpeed,
      innerRotationSpeed: params.innerRotationSpeed,
    };

    const toxicHue = this.rng.uniform(0.7, 0.95);
    const toxicSaturation = this.rng.uniform(0.8, 1.0);
    const toxicBrightness = this.rng.uniform(0.5, 0.9);
    this.toxicColor = params.toxicColor || new THREE.Color().setHSL(toxicHue, toxicSaturation, toxicBrightness);

    this.createSpots();
  }

  private createSpots(): void {
    for (let i = 0; i < this.proceduralParams.objectCount; i++) {
      const spotSeed = this.rng.random() * 1000000;

      const hueVariation = this.rng.uniform(-0.05, 0.05);
      const spotColor = this.toxicColor.clone();
      const hsl = {} as any;
      spotColor.getHSL(hsl);
      spotColor.setHSL((hsl.h + hueVariation) % 1.0, hsl.s, hsl.l);

      const spot = new ToxicSpot(this.planetRadius, spotColor, spotSeed, this.proceduralParams.moveSpeed, this.proceduralParams.innerRotationSpeed, this.useSpecialEffect);
      this.spots.push(spot);
      this.group.add(spot.getMesh());
    }
  }

  update(_deltaTime: number = 0.016): void {
    const currentTime = getAnimatedUniverseTime(this.cosmicOriginTime, this.proceduralParams.timeSpeed, this.startTime);

    this.spots.forEach((spot) => {
      spot.update(_deltaTime, currentTime);
    });
  }

  addToScene(scene: THREE.Scene, position: THREE.Vector3): void {
    this.group.position.copy(position);
    scene.add(this.group);
  }

  getObject3D(): THREE.Group {
    return this.group;
  }

  dispose(): void {
    this.spots.forEach((spot) => spot.dispose());
    this.spots = [];
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}

export function createToxicWasteFromPythonData(planetRadius: number, surfaceData: any, globalSeed?: number, params?: Partial<ToxicWasteRenderParams>): ToxicWasteRenderEffect | null {
  if (!surfaceData || !surfaceData.type || surfaceData.type.toLowerCase() !== "toxic") {
    return null;
  }

  const seed = globalSeed || Math.floor(Math.random() * 1000000);

  return new ToxicWasteRenderEffect(planetRadius, {
    seed: seed + 30000,
    moveSpeed: params?.moveSpeed,
    innerRotationSpeed: params?.innerRotationSpeed,
    timeSpeed: params?.timeSpeed,
    toxicColor: params?.toxicColor,
    ...params,
  });
}
