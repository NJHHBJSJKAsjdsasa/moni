// atlas-ui/react/static/js/3DEffects/RockyTerrainLayer.tsx
import * as THREE from "three";
import { PlanetLayerSystem } from "../3DComponents/PlanetLayerSystem";
import { SeededRandom } from "../Utils/SeededRandom.tsx";

export interface RockyTerrainLayerParams {
  color?: THREE.Color | number[];
  roughness?: number;
  rockDensity?: number;
  craterCount?: number;
  opacity?: number;
  seed?: number;
  planetType?: "ROCKY" | "CAVE" | "DEFAULT";
}

const PROCEDURAL_RANGES = {
  DEFAULT: {
    ROUGHNESS: { min: 0.6, max: 0.9 },
    ROCK_DENSITY: { min: 0.4, max: 0.8 },
    CRATER_COUNT: { min: 0.2, max: 0.6 },
    OPACITY: { min: 0.7, max: 0.95 },
  },
  ROCKY: {
    ROUGHNESS: { min: 1, max: 2 },
    ROCK_DENSITY: { min: 1.0, max: 3.0 },
    CRATER_COUNT: { min: 0.4, max: 0.8 },
    OPACITY: { min: 0.8, max: 1.0 },
  },
  CAVE: {
    ROUGHNESS: { min: 0.5, max: 0.7 },
    ROCK_DENSITY: { min: 0.5, max: 1 },
    CRATER_COUNT: { min: 0.1, max: 0.4 },
    OPACITY: { min: 0.02, max: 0.05 },
  },
};

export class RockyTerrainLayer {
  private layerMesh?: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private params: RockyTerrainLayerParams;
  private layerSystem: PlanetLayerSystem;

  private static readonly vertexShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    float noise(vec3 p) {
      return sin(p.x * 4.0) * sin(p.y * 4.0) * sin(p.z * 4.0);
    }

    void main() {
      vPosition = position;
      vNormal = normal;
      vUv = uv;

      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;

      vec3 deformed = position;
      float noiseValue = noise(position * 3.0);
      deformed += normal * noiseValue * 0.02;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(deformed, 1.0);
    }
  `;

  private static readonly fragmentShader = `
    uniform vec3 rockColor;
    uniform float roughness;
    uniform float rockDensity;
    uniform float craterCount;
    uniform float opacity;
    uniform vec3 lightDirection;
    uniform vec3 lightPosition;

    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float n = i.x + i.y * 57.0 + 113.0 * i.z;
      return mix(
        mix(mix(fract(sin(n) * 43758.5453), fract(sin(n + 1.0) * 43758.5453), f.x),
            mix(fract(sin(n + 57.0) * 43758.5453), fract(sin(n + 58.0) * 43758.5453), f.x), f.y),
        mix(mix(fract(sin(n + 113.0) * 43758.5453), fract(sin(n + 114.0) * 43758.5453), f.x),
            mix(fract(sin(n + 170.0) * 43758.5453), fract(sin(n + 171.0) * 43758.5453), f.x), f.y), f.z);
    }

    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      
      for(int i = 0; i < 4; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      
      return value;
    }

    float craterPattern(vec3 p, float count) {
      float craters = 0.0;
      float scale = count * 8.0;

      for(int i = 0; i < 3; i++) {
        float layerScale = scale * pow(2.0, float(i));
        vec3 cellPos = p * layerScale;
        vec3 cellId = floor(cellPos);
        vec3 cellLocal = fract(cellPos);

        float hash = fract(sin(dot(cellId, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
        
        if(hash > 0.7) {
          vec2 craterCenter = vec2(0.5) + 0.3 * (vec2(hash, fract(hash * 73.0)) - 0.5);
          float dist = distance(cellLocal.xy, craterCenter);
          float craterSize = 0.2 + 0.3 * fract(hash * 127.0);
          
          if(dist < craterSize) {
            float craterDepth = smoothstep(craterSize, craterSize * 0.3, dist);
            craters += craterDepth * (0.8 - float(i) * 0.2);
          }
        }
      }
      
      return clamp(craters, 0.0, 1.0);
    }
    
    void main() {
      vec3 pos = normalize(vPosition);
      vec3 normal = normalize(vNormal);

      vec3 lightDir;
      if (length(lightPosition) > 0.0) {
        lightDir = normalize(lightPosition - vWorldPosition);
      } else {
        lightDir = normalize(-lightDirection);
      }

      float rockTexture = fbm(pos * rockDensity);
      rockTexture = pow(rockTexture, roughness);

      float craters = craterPattern(pos, craterCount);

      float combinedTexture = rockTexture * (1.0 - craters * 0.5) + craters * 0.3;

      float dotNL = dot(normal, lightDir);
      float lightInfluence = smoothstep(-0.2, 0.2, dotNL);

      vec3 baseColor = rockColor;

      baseColor = mix(baseColor, baseColor * 0.6, craters);

      vec3 color = baseColor * (0.6 + 0.4 * combinedTexture);

      color *= (0.7 + 0.3 * lightInfluence);

      vec3 planetNormal = normalize(vWorldPosition);
      float planetDotNL = dot(planetNormal, lightDir);

      float shadowDarkness = smoothstep(0.1, -0.2, planetDotNL) * 0.6;
      color *= (1.0 - shadowDarkness);

      float alpha = combinedTexture * opacity;
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  constructor(layerSystem: PlanetLayerSystem, params: RockyTerrainLayerParams = {}) {
    this.layerSystem = layerSystem;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    const baseColor = params.color instanceof THREE.Color ? params.color : params.color ? new THREE.Color(params.color as any) : new THREE.Color(0x8b4513);

    const planetType = params.planetType || "DEFAULT";
    const ranges = PROCEDURAL_RANGES[planetType];

    this.params = {
      color: baseColor,
      roughness: params.roughness || rng.uniform(ranges.ROUGHNESS.min, ranges.ROUGHNESS.max),
      rockDensity: params.rockDensity || rng.uniform(ranges.ROCK_DENSITY.min, ranges.ROCK_DENSITY.max) * 10,
      craterCount: params.craterCount || rng.uniform(ranges.CRATER_COUNT.min, ranges.CRATER_COUNT.max),
      opacity: params.opacity || rng.uniform(ranges.OPACITY.min, ranges.OPACITY.max),
      seed,
      planetType,
    };

    this.material = new THREE.ShaderMaterial({
      vertexShader: RockyTerrainLayer.vertexShader,
      fragmentShader: RockyTerrainLayer.fragmentShader,
      uniforms: {
        rockColor: { value: baseColor },
        roughness: { value: this.params.roughness },
        rockDensity: { value: this.params.rockDensity },
        craterCount: { value: this.params.craterCount },
        opacity: { value: this.params.opacity },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
      },
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    });

    this.layerMesh = this.layerSystem.addEffectLayer("rockyTerrain", this.material, this.layerSystem.getNextScaleFactor());
  }

  update(deltaTime: number): void {}

  updateFromThreeLight(light: THREE.DirectionalLight): void {
    if (this.material.uniforms.lightPosition) {
      this.material.uniforms.lightPosition.value.copy(light.position);
    }

    const direction = light.target.position.clone().sub(light.position).normalize();
    if (this.material.uniforms.lightDirection) {
      this.material.uniforms.lightDirection.value = direction;
    }
  }

  dispose(): void {}
}

export function createRockyTerrainLayerFromPythonData(layerSystem: PlanetLayerSystem, data: any, globalSeed?: number, planetType: "ROCKY" | "CAVE" | "DEFAULT" = "DEFAULT"): RockyTerrainLayer {
  const surface = data.surface || {};
  const baseColor = data.planet_info?.base_color || surface.base_color;

  const seed = globalSeed || Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed + 8000);

  let detectedPlanetType = planetType;
  if (planetType === "DEFAULT" && data.surface_elements?.type) {
    const surfaceType = data.surface_elements.type.toLowerCase();
    if (surfaceType === "rocky") {
      detectedPlanetType = "ROCKY";
    } else if (surfaceType === "cave") {
      detectedPlanetType = "CAVE";
    }
  }

  const ranges = PROCEDURAL_RANGES[detectedPlanetType];

  return new RockyTerrainLayer(layerSystem, {
    color: baseColor ? new THREE.Color(baseColor) : new THREE.Color(0x8b4513),
    roughness: surface.roughness || rng.uniform(ranges.ROUGHNESS.min, ranges.ROUGHNESS.max),
    rockDensity: surface.rock_density || rng.uniform(ranges.ROCK_DENSITY.min, ranges.ROCK_DENSITY.max) * 10,
    craterCount: surface.crater_count || rng.uniform(ranges.CRATER_COUNT.min, ranges.CRATER_COUNT.max),
    opacity: rng.uniform(ranges.OPACITY.min, ranges.OPACITY.max),
    seed,
    planetType: detectedPlanetType,
  });
}
