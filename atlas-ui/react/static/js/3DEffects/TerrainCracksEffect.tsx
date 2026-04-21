// atlas-ui/react/static/js/3DEffects/TerrainCracksEffect.tsx

import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";

export interface TerrainCracksParams {
  crackDensity?: number;
  crackDepth?: number;
  crackComplexity?: number;
  crackScale?: number;
  crackSharpness?: number;
  crackColor?: THREE.Color | number;
  crackOpacity?: number;
  internalReflections?: number;
  animationSpeed?: number;
  seed?: number;
  radius?: number;
  lineDrawPercentage?: number;
}

const PROCEDURAL_RANGES = {
  CRACK_DENSITY: { min: 0.3, max: 0.6 },
  CRACK_DEPTH: { min: 0.5, max: 0.9 },
  CRACK_COMPLEXITY: { min: 3, max: 5 },
  CRACK_SCALE: { min: 3.0, max: 8.0 },
  CRACK_SHARPNESS: { min: 0.7, max: 1.0 },
  CRACK_OPACITY: { min: 0.6, max: 0.9 },
  INTERNAL_REFLECTIONS: { min: 0.5, max: 0.9 },
  ANIMATION_SPEED: { min: 0.05, max: 0.15 },
};

export class TerrainCracksEffect {
  private crackMesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private params: TerrainCracksParams;

  constructor(params: TerrainCracksParams = {}) {
    const seed = params.seed !== undefined ? params.seed : 123456;

    const visualRng = new SeededRandom(seed + 10000);

    const hue = visualRng.uniform(0, 360);
    const saturation = visualRng.uniform(0.3, 0.8);
    const lightness = visualRng.uniform(0.7, 1.0);
    const crackColor = new THREE.Color().setHSL(hue / 360, saturation, lightness);

    this.params = {
      crackDensity: visualRng.uniform(PROCEDURAL_RANGES.CRACK_DENSITY.min, PROCEDURAL_RANGES.CRACK_DENSITY.max),
      crackDepth: visualRng.uniform(PROCEDURAL_RANGES.CRACK_DEPTH.min, PROCEDURAL_RANGES.CRACK_DEPTH.max),
      crackComplexity: Math.floor(visualRng.uniform(PROCEDURAL_RANGES.CRACK_COMPLEXITY.min, PROCEDURAL_RANGES.CRACK_COMPLEXITY.max)),
      crackScale: visualRng.uniform(PROCEDURAL_RANGES.CRACK_SCALE.min, PROCEDURAL_RANGES.CRACK_SCALE.max),
      crackSharpness: visualRng.uniform(PROCEDURAL_RANGES.CRACK_SHARPNESS.min, PROCEDURAL_RANGES.CRACK_SHARPNESS.max),
      crackColor,
      crackOpacity: visualRng.uniform(PROCEDURAL_RANGES.CRACK_OPACITY.min, PROCEDURAL_RANGES.CRACK_OPACITY.max),
      internalReflections: visualRng.uniform(PROCEDURAL_RANGES.INTERNAL_REFLECTIONS.min, PROCEDURAL_RANGES.INTERNAL_REFLECTIONS.max),
      animationSpeed: visualRng.uniform(PROCEDURAL_RANGES.ANIMATION_SPEED.min, PROCEDURAL_RANGES.ANIMATION_SPEED.max),
      seed,
      radius: params.radius || 2.5,
      lineDrawPercentage: params.lineDrawPercentage !== undefined ? params.lineDrawPercentage : 0.66,
    };

    const geometry = new THREE.SphereGeometry(this.params.radius! * 1.02, 32, 32);

    this.material = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float rotationAngle;

        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;

        vec3 rotateY(vec3 p, float angle) {
          float c = cos(angle);
          float s = sin(angle);
          return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
        }

        void main() {
          vec3 rotatedPos = rotateY(position, -rotationAngle);

          float theta = atan(rotatedPos.x, rotatedPos.z);
          float phi = acos(rotatedPos.y / length(rotatedPos));
          vUv = vec2((theta + 3.14159) / (2.0 * 3.14159), phi / 3.14159);

          vPosition = rotatedPos;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        uniform float time;
        uniform vec3 crackColor;
        uniform float crackIntensity;
        uniform float crackGlow;
        uniform float planetSeed;
        uniform float lineDrawPercentage;
        
        vec2 random2(vec2 st, float seed) {
          st = vec2(dot(st, vec2(127.1 + seed, 311.7 + seed * 0.5)),
                    dot(st, vec2(269.5 + seed * 0.3, 183.3 + seed * 0.7)));
          vec2 result = fract(sin(st) * (43758.5453123 + seed));
          result = clamp(result, 0.0, 1.0);
          return -1.0 + 2.0 * result;
        }
        
        float shouldDrawLine(vec2 position, float planetSeed, float percentage) {
          vec2 cellPos = floor(position * 2.0);
          
          float cellHash = dot(cellPos, vec2(127.1, 311.7));
          cellHash = fract(sin(cellHash + planetSeed * 0.001) * 43758.5453);
          
          cellHash = clamp(fract(cellHash + planetSeed * 0.0001), 0.0, 1.0);
          
          return step(cellHash, percentage);
        }
        
        float voronoiCracks(vec2 st, float planetSeed) {
          vec2 i_st = floor(st);
          vec2 f_st = fract(st);
          
          float min_dist = 10.0;
          float min_dist2 = 10.0;
          
          for(int y = -2; y <= 2; y++) {
            for(int x = -2; x <= 2; x++) {
              vec2 neighbor = vec2(float(x), float(y));
              vec2 point = random2(i_st + neighbor, planetSeed);
              point = 0.5 + 0.35 * point;
              vec2 diff = neighbor + point - f_st;
              float dist = length(diff);
              
              if(dist < min_dist) {
                min_dist2 = min_dist;
                min_dist = dist;
              } else if(dist < min_dist2) {
                min_dist2 = dist;
              }
            }
          }
          
          float edge = min_dist2 - min_dist;
          return smoothstep(0.0, 0.1, edge);
        }
        
        void main() {
          vec2 st = clamp(vUv, 0.0, 1.0) * (6.0 + mod(planetSeed, 4.0));
          
          float drawChance1 = shouldDrawLine(st, planetSeed, lineDrawPercentage);
          float drawChance2 = shouldDrawLine(st * 1.5, planetSeed + 1000.0, lineDrawPercentage);
          
          if(drawChance1 < 0.5 && drawChance2 < 0.5) {
            discard;
          }
          
          vec2 offset1 = vec2(mod(planetSeed, 17.0), mod(planetSeed * 1.3, 19.0));
          vec2 offset2 = vec2(mod(planetSeed * 2.1, 23.0), mod(planetSeed * 0.7, 29.0));
          
          float edge1 = voronoiCracks(st, planetSeed);
          float edge2 = voronoiCracks(st * (1.3 + mod(planetSeed * 0.1, 0.4)) + offset2, planetSeed + 1000.0);
          
          float lineWidth = 0.02 + mod(planetSeed * 0.001, 0.01);
          float crack1 = (1.0 - smoothstep(0.0, lineWidth, edge1)) * drawChance1;
          float crack2 = (1.0 - smoothstep(0.0, lineWidth * 0.8, edge2)) * drawChance2;
          
          float weight = 0.5 + mod(planetSeed * 0.01, 0.3);
          float crack = max(crack1, crack2 * weight);
          
          if(crack < 0.1) {
            discard;
          }
          
          float depthVariation = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          crack *= 0.7 + 0.3 * depthVariation;
          
          float pulseSpeed = 1.0 + mod(planetSeed * 0.001, 1.0);
          float pulse = 1.0 + 0.05 * sin(time * pulseSpeed + st.x * 3.0 + planetSeed);
          crack *= pulse;
          
          vec3 baseColor = crackColor * crackIntensity;
          vec3 glowColor = baseColor * (1.0 + crackGlow * crack * 0.5);
          
          float alpha = crack * 0.11;
          
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      uniforms: {
        time: { value: 0.0 },
        crackColor: { value: this.params.crackColor || new THREE.Color(0x00ffff) },
        crackIntensity: { value: (this.params.crackOpacity || 0.7) * 2.0 },
        crackGlow: { value: (this.params.internalReflections || 0.7) * 3.0 },
        planetSeed: { value: this.params.seed || 123456 },
        lineDrawPercentage: { value: this.params.lineDrawPercentage || 0.66 },
        rotationAngle: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    this.crackMesh = new THREE.Mesh(geometry, this.material);
  }

  addToScene(scene: THREE.Scene, planetPosition: THREE.Vector3): void {
    this.crackMesh.position.copy(planetPosition);
    this.crackMesh.visible = true;
    scene.add(this.crackMesh);
  }

  removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.crackMesh);
  }

  update(deltaTime: number, planetRotation?: number): void {
    if (this.material.uniforms.time) {
      this.material.uniforms.time.value += deltaTime * this.params.animationSpeed!;
    }
    if (planetRotation !== undefined && this.material.uniforms.rotationAngle) {
      this.material.uniforms.rotationAngle.value = planetRotation;
    }
  }

  updateFromThreeLight(_light: THREE.DirectionalLight): void {}

  getObject3D(): THREE.Mesh {
    return this.crackMesh;
  }

  dispose(): void {
    if (this.crackMesh) {
      this.crackMesh.geometry.dispose();
      this.material.dispose();
    }
  }
}

export function createTerrainCracksFromPythonData(_data: any, radius: number, globalSeed?: number): TerrainCracksEffect {
  const seedOffset = 5000;
  const seed = globalSeed ? (globalSeed + seedOffset) % 1000000 : Math.floor(Math.random() * 1000000);

  return new TerrainCracksEffect({
    radius,
    seed,
    lineDrawPercentage: 0.66,
  });
}
