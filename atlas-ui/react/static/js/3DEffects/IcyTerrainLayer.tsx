// atlas-ui/react/static/js/3DEffects/IcyTerrainLayer.tsx
import * as THREE from "three";
import { PlanetLayerSystem } from "../3DComponents/PlanetLayerSystem";
import { SeededRandom } from "../Utils/SeededRandom";

export interface IcyTerrainLayerParams {
  color?: THREE.Color | number[];
  iceReflectivity?: number;
  frostDensity?: number;
  crackIntensity?: number;
  opacity?: number;
  crystalScale?: number;
  crystalDensity?: number;
  crystalSharpness?: number;
  frostPattern?: number;
  seed?: number;
  [key: string]: unknown;
}

const PROCEDURAL_RANGES = {
  ICE_REFLECTIVITY: { min: 0.7, max: 0.95 },
  FROST_DENSITY: { min: 0.3, max: 0.8 },
  CRACK_INTENSITY: { min: 0.2, max: 0.7 },
  OPACITY: { min: 0.6, max: 0.9 },
  CRYSTAL_SCALE: { min: 15.0, max: 35.0 },
  CRYSTAL_DENSITY: { min: 0.4, max: 0.8 },
  CRYSTAL_SHARPNESS: { min: 100.0, max: 250.0 },
  FROST_PATTERN: { min: 8.0, max: 16.0 },
};

export class IcyTerrainLayer {
  private layerMesh?: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private params: IcyTerrainLayerParams;
  private layerSystem: PlanetLayerSystem;

  constructor(layerSystem: PlanetLayerSystem, params: IcyTerrainLayerParams = {}) {
    this.layerSystem = layerSystem;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    const baseColor = params.color instanceof THREE.Color 
      ? params.color 
      : params.color 
        ? Array.isArray(params.color) 
          ? new THREE.Color(params.color[0], params.color[1], params.color[2])
          : new THREE.Color(params.color)
        : new THREE.Color(0xb0e0e6);

    this.params = {
      color: baseColor,
      iceReflectivity: params.iceReflectivity || rng.uniform(PROCEDURAL_RANGES.ICE_REFLECTIVITY.min, PROCEDURAL_RANGES.ICE_REFLECTIVITY.max),
      frostDensity: params.frostDensity || rng.uniform(PROCEDURAL_RANGES.FROST_DENSITY.min, PROCEDURAL_RANGES.FROST_DENSITY.max),
      crackIntensity: params.crackIntensity || rng.uniform(PROCEDURAL_RANGES.CRACK_INTENSITY.min, PROCEDURAL_RANGES.CRACK_INTENSITY.max),
      opacity: params.opacity || rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max),
      crystalScale: params.crystalScale || rng.uniform(PROCEDURAL_RANGES.CRYSTAL_SCALE.min, PROCEDURAL_RANGES.CRYSTAL_SCALE.max),
      crystalDensity: params.crystalDensity || rng.uniform(PROCEDURAL_RANGES.CRYSTAL_DENSITY.min, PROCEDURAL_RANGES.CRYSTAL_DENSITY.max),
      crystalSharpness: params.crystalSharpness || rng.uniform(PROCEDURAL_RANGES.CRYSTAL_SHARPNESS.min, PROCEDURAL_RANGES.CRYSTAL_SHARPNESS.max),
      frostPattern: params.frostPattern || rng.uniform(PROCEDURAL_RANGES.FROST_PATTERN.min, PROCEDURAL_RANGES.FROST_PATTERN.max),
      seed,
    };

    this.material = this.layerSystem.createIcyTerrainLayerMaterial(this.params);

    this.layerMesh = this.layerSystem.addEffectLayer("icyTerrain", this.material, this.layerSystem.getNextScaleFactor(), this);
  }

  update(deltaTime: number): void {
    if (this.material.uniforms.time) {
      this.material.uniforms.time.value += deltaTime;
    }
  }

  getObject3D(): THREE.Object3D | undefined {
    return this.layerMesh;
  }

  dispose(): void {}
}

export function createIcyTerrainLayerFromPythonData(layerSystem: PlanetLayerSystem, data: any, globalSeed?: number): IcyTerrainLayer {
  const surface = data.surface || {};
  const baseColor = data.planet_info?.base_color || surface.base_color;

  const seed = globalSeed || Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed + 6000);

  return new IcyTerrainLayer(layerSystem, {
    color: baseColor ? new THREE.Color(baseColor) : new THREE.Color(0xb0e0e6),
    iceReflectivity: surface.ice_reflectivity || rng.uniform(PROCEDURAL_RANGES.ICE_REFLECTIVITY.min, PROCEDURAL_RANGES.ICE_REFLECTIVITY.max),
    frostDensity: surface.frost_density || rng.uniform(PROCEDURAL_RANGES.FROST_DENSITY.min, PROCEDURAL_RANGES.FROST_DENSITY.max),
    crackIntensity: surface.crack_intensity || rng.uniform(PROCEDURAL_RANGES.CRACK_INTENSITY.min, PROCEDURAL_RANGES.CRACK_INTENSITY.max),
    opacity: rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max),
    crystalScale: surface.crystal_scale || rng.uniform(PROCEDURAL_RANGES.CRYSTAL_SCALE.min, PROCEDURAL_RANGES.CRYSTAL_SCALE.max),
    crystalDensity: surface.crystal_density || rng.uniform(PROCEDURAL_RANGES.CRYSTAL_DENSITY.min, PROCEDURAL_RANGES.CRYSTAL_DENSITY.max),
    crystalSharpness: surface.crystal_sharpness || rng.uniform(PROCEDURAL_RANGES.CRYSTAL_SHARPNESS.min, PROCEDURAL_RANGES.CRYSTAL_SHARPNESS.max),
    frostPattern: surface.frost_pattern || rng.uniform(PROCEDURAL_RANGES.FROST_PATTERN.min, PROCEDURAL_RANGES.FROST_PATTERN.max),
    seed,
  });
}
