// atlas-ui/react/static/js/3DEffects/MetallicSurfaceLayer.tsx
import * as THREE from "three";
import { PlanetLayerSystem } from "../3DComponents/PlanetLayerSystem";
import { SeededRandom } from "../Utils/SeededRandom.tsx";

export interface MetallicSurfaceLayerParams {
  color?: THREE.Color | number[];
  metalness?: number;
  roughness?: number;
  fragmentationIntensity?: number;
  opacity?: number;
  seed?: number;
  noiseScale?: number;
  noiseIntensity?: number;
  crystalScale?: number;
}

const PROCEDURAL_RANGES = {
  METALNESS: { min: 0.5, max: 5 },
  ROUGHNESS: { min: 0.1, max: 0.6 },
  FRAGMENTATION_INTENSITY: { min: 0.3, max: 0.8 },
  OPACITY: { min: 0.2, max: 0.9 },
  CRYSTAL_SCALE: { min: 17.0, max: 230.0 },
};

export class MetallicSurfaceLayer {
  private material: THREE.ShaderMaterial;
  private params: MetallicSurfaceLayerParams;
  private layerSystem: PlanetLayerSystem;

  constructor(layerSystem: PlanetLayerSystem, params: MetallicSurfaceLayerParams = {}) {
    this.layerSystem = layerSystem;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    const baseColor = params.color instanceof THREE.Color ? params.color : params.color ? new THREE.Color(params.color as any) : new THREE.Color(0x808080);

    this.params = {
      color: baseColor,
      metalness: params.metalness || rng.uniform(PROCEDURAL_RANGES.METALNESS.min, PROCEDURAL_RANGES.METALNESS.max),
      roughness: params.roughness || rng.uniform(PROCEDURAL_RANGES.ROUGHNESS.min, PROCEDURAL_RANGES.ROUGHNESS.max),
      fragmentationIntensity: params.fragmentationIntensity || rng.uniform(PROCEDURAL_RANGES.FRAGMENTATION_INTENSITY.min, PROCEDURAL_RANGES.FRAGMENTATION_INTENSITY.max),
      opacity: params.opacity || rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max),
      seed,
      noiseScale: params.noiseScale || 8.0,
      noiseIntensity: params.noiseIntensity || 0.3,
      crystalScale: params.crystalScale || rng.uniform(PROCEDURAL_RANGES.CRYSTAL_SCALE.min, PROCEDURAL_RANGES.CRYSTAL_SCALE.max),
    };

    this.material = this.layerSystem.createMetallicSurfaceLayerMaterial(this.params as Record<string, unknown>);

    this.layerSystem.addEffectLayer("metallicSurface", this.material, this.layerSystem.getNextScaleFactor(), this);
  }

  update(deltaTime: number): void {
    if (this.material.uniforms.time) {
      this.material.uniforms.time.value += deltaTime;
    }
  }

  dispose(): void {}
}

export function createMetallicSurfaceLayerFromPythonData(layerSystem: PlanetLayerSystem, data: any, globalSeed?: number): MetallicSurfaceLayer {
  const surface = data.surface || {};
  const baseColor = data.planet_info?.base_color || surface.base_color;

  const seed = globalSeed || Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed + 7000);

  const subtleVariation = rng.uniform(0.8, 1.2);

  return new MetallicSurfaceLayer(layerSystem, {
    color: baseColor ? new THREE.Color(baseColor) : new THREE.Color(0x808080),
    metalness: surface.metalness || rng.uniform(PROCEDURAL_RANGES.METALNESS.min, PROCEDURAL_RANGES.METALNESS.max),
    roughness: surface.roughness || rng.uniform(PROCEDURAL_RANGES.ROUGHNESS.min, PROCEDURAL_RANGES.ROUGHNESS.max),
    fragmentationIntensity: surface.fragmentation || rng.uniform(PROCEDURAL_RANGES.FRAGMENTATION_INTENSITY.min, PROCEDURAL_RANGES.FRAGMENTATION_INTENSITY.max),
    opacity: rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max),
    seed,
    noiseScale: 4.0 * subtleVariation,
    noiseIntensity: 0.3,
    crystalScale: rng.uniform(PROCEDURAL_RANGES.CRYSTAL_SCALE.min, PROCEDURAL_RANGES.CRYSTAL_SCALE.max),
  });
}
