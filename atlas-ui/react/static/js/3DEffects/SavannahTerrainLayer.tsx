// atlas-ui/react/static/js/3DEffects/SavannahTerrainLayer.tsx

import * as THREE from "three";
import { PlanetLayerSystem } from "../3DComponents/PlanetLayerSystem";
import { SeededRandom } from "../Utils/SeededRandom.tsx";

export interface SavannahTerrainLayerParams {
  color?: THREE.Color | number[];
  terrainHeight?: number;
  terrainComplexity?: number;
  erosionStrength?: number;
  opacity?: number;
  seed?: number;
  planetType?: "SAVANNAH" | "DEFAULT";
}

const PROCEDURAL_RANGES = {
  DEFAULT: {
    TERRAIN_HEIGHT: { min: 0.02, max: 0.05 },
    TERRAIN_COMPLEXITY: { min: 2, max: 4 },
    EROSION_STRENGTH: { min: 0.4, max: 0.7 },
    OPACITY: { min: 0.6, max: 0.8 },
  },
  SAVANNAH: {
    TERRAIN_HEIGHT: { min: 0.03, max: 0.08 },
    TERRAIN_COMPLEXITY: { min: 3, max: 6 },
    EROSION_STRENGTH: { min: 0.6, max: 0.9 },
    OPACITY: { min: 0.5, max: 0.7 },
  },
};

export class SavannahTerrainLayer {
  private layerMesh?: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private params: SavannahTerrainLayerParams;
  private layerSystem: PlanetLayerSystem;

  private static readonly vertexShader = `
    uniform float terrainHeight;
    uniform float terrainComplexity;
    uniform float erosionStrength;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    varying float vElevation;
    
    float hash(vec3 p) {
      p = fract(p * vec3(443.8975, 397.2973, 491.1871));
      p += dot(p, p.yxz + 19.19);
      return fract((p.x + p.y) * p.z);
    }
    
    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      return mix(
        mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
      );
    }
    
    float terrainFBM(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = terrainComplexity;
      
      for(int i = 0; i < 5; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.2;
      }
      
      float erosion = noise(p * 8.0) * erosionStrength;
      value = mix(value, smoothstep(0.3, 0.7, value), erosion);
      
      return value;
    }
    
    void main() {
      vPosition = position;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vUv = uv;
      
      vec3 pos = normalize(position);
      float height = terrainFBM(pos * 4.0);
      
      float erosionPattern = noise(pos * 12.0) * erosionStrength;
      height = mix(height, height * 0.7, erosionPattern * 0.5);
      
      vec3 displaced = position + normal * height * terrainHeight;
      
      float delta = 0.001;
      vec3 neighborPos = normalize(position + vec3(delta, 0, 0));
      float neighborHeight = terrainFBM(neighborPos * 4.0);
      vec3 tangent = normalize(vec3(delta, neighborHeight - height, 0));
      vNormal = normalize(cross(tangent, vec3(0, 0, 1)));
      
      vElevation = height;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `;

  private static readonly fragmentShader = `
    uniform vec3 terrainColor;
    uniform float opacity;
    uniform vec3 lightDirection;
    uniform vec3 lightPosition;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    varying float vElevation;
    
    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float n = i.x + i.y * 57.0 + 113.0 * i.z;
      return fract(sin(n + dot(i, vec3(1.0, 57.0, 113.0))) * 43758.5453);
    }
    
    void main() {
      vec3 normal = normalize(vNormal);
      
      vec3 lowColor = terrainColor * 0.6;
      vec3 midColor = terrainColor;
      vec3 highColor = terrainColor * 1.3;
      
      vec3 color;
      if (vElevation < 0.3) {
        color = mix(lowColor, midColor, vElevation / 0.3);
      } else if (vElevation < 0.7) {
        color = mix(midColor, highColor, (vElevation - 0.3) / 0.4);
      } else {
        vec3 peakColor = vec3(0.9, 0.85, 0.7);
        color = mix(highColor, peakColor, (vElevation - 0.7) / 0.3);
      }
      
      vec3 pos = normalize(vPosition);
      float textureNoise = noise(pos * 50.0);
      color *= (0.9 + 0.1 * textureNoise);
      
      float erosionLines = noise(pos * 100.0 + vec3(vElevation * 10.0));
      if (erosionLines > 0.8) {
        color *= 0.8;
      }
      
      vec3 lightDir;
      if (length(lightPosition) > 0.0) {
        lightDir = normalize(lightPosition - vWorldPosition);
      } else {
        lightDir = normalize(-lightDirection);
      }
      
      float dotNL = dot(normal, lightDir);
      float lighting = max(0.0, dotNL);

      color *= 0.25 + 0.75 * lighting;

      vec3 planetNormal = normalize(vWorldPosition);
      float planetDotNL = dot(planetNormal, lightDir);

      float shadowDarkness = smoothstep(0.1, -0.2, planetDotNL) * 0.6;
      color *= (1.0 - shadowDarkness);
      
      float viewDistance = length(vPosition);
      vec3 atmosphereColor = vec3(0.7, 0.75, 0.85);
      color = mix(color, atmosphereColor, min(0.3, viewDistance * 0.0001));
      
      float alpha = (0.5 + 0.5 * vElevation) * opacity;
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  constructor(layerSystem: PlanetLayerSystem, params: SavannahTerrainLayerParams = {}) {
    this.layerSystem = layerSystem;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    const baseColor = params.color instanceof THREE.Color ? params.color : params.color ? new THREE.Color(params.color as any) : new THREE.Color(0xd4a373);

    const planetType = params.planetType || "SAVANNAH";
    const ranges = PROCEDURAL_RANGES[planetType];

    this.params = {
      color: baseColor,
      terrainHeight: params.terrainHeight || rng.uniform(ranges.TERRAIN_HEIGHT.min, ranges.TERRAIN_HEIGHT.max),
      terrainComplexity: params.terrainComplexity || rng.uniform(ranges.TERRAIN_COMPLEXITY.min, ranges.TERRAIN_COMPLEXITY.max),
      erosionStrength: params.erosionStrength || rng.uniform(ranges.EROSION_STRENGTH.min, ranges.EROSION_STRENGTH.max),
      opacity: params.opacity || rng.uniform(ranges.OPACITY.min, ranges.OPACITY.max),
      seed,
      planetType,
    };

    this.material = new THREE.ShaderMaterial({
      vertexShader: SavannahTerrainLayer.vertexShader,
      fragmentShader: SavannahTerrainLayer.fragmentShader,
      uniforms: {
        terrainColor: { value: baseColor },
        terrainHeight: { value: this.params.terrainHeight },
        terrainComplexity: { value: this.params.terrainComplexity },
        erosionStrength: { value: this.params.erosionStrength },
        opacity: { value: this.params.opacity },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        lightPosition: { value: new THREE.Vector3(10, 10, 10) },
      },
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    });

    this.layerMesh = this.layerSystem.addEffectLayer("savannahTerrain", this.material, this.layerSystem.getNextScaleFactor(), this);
  }

  update(deltaTime: number): void {}

  updateLightDirection(direction: THREE.Vector3): void {
    if (this.material.uniforms.lightDirection) {
      this.material.uniforms.lightDirection.value = direction.clone().normalize();
    }
  }

  getObject3D(): THREE.Mesh | undefined {
    return this.layerMesh;
  }

  dispose(): void {}
}

export function createSavannahTerrainLayerFromPythonData(layerSystem: PlanetLayerSystem, data: any, globalSeed?: number, planetType: "SAVANNAH" | "DEFAULT" = "DEFAULT"): SavannahTerrainLayer {
  const surface = data.surface || {};
  const baseColor = data.planet_info?.base_color || surface.base_color;

  const seed = globalSeed || Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed + 9000);

  let detectedPlanetType = planetType;
  if (planetType === "DEFAULT" && data.surface_elements?.type) {
    const surfaceType = data.surface_elements.type.toLowerCase();
    if (surfaceType === "savannah") {
      detectedPlanetType = "SAVANNAH";
    }
  }

  const ranges = PROCEDURAL_RANGES[detectedPlanetType];

  return new SavannahTerrainLayer(layerSystem, {
    color: baseColor ? new THREE.Color(baseColor) : new THREE.Color(0xd4a373),
    terrainHeight: surface.terrain_height || rng.uniform(ranges.TERRAIN_HEIGHT.min, ranges.TERRAIN_HEIGHT.max),
    terrainComplexity: surface.terrain_complexity || rng.uniform(ranges.TERRAIN_COMPLEXITY.min, ranges.TERRAIN_COMPLEXITY.max),
    erosionStrength: surface.erosion_strength || rng.uniform(ranges.EROSION_STRENGTH.min, ranges.EROSION_STRENGTH.max),
    opacity: rng.uniform(ranges.OPACITY.min, ranges.OPACITY.max),
    seed,
    planetType: detectedPlanetType,
  });
}
