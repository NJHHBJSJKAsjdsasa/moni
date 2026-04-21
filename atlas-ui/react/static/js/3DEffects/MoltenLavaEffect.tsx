// atlas-ui/react/static/js/3DEffects/MoltenLavaEffect.tsx
import * as THREE from "three";
import { PlanetLayerSystem } from "../3DComponents/PlanetLayerSystem";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime";

export interface MoltenLavaParams {
  lavaWaveHeight?: number;
  lavaWaveFrequency?: number;
  lavaWaveSpeed?: number;

  secondaryLavaWaveHeight?: number;
  secondaryLavaWaveFrequency?: number;
  secondaryLavaWaveSpeed?: number;

  lavaDistortionScale?: number;
  lavaDistortionSpeed?: number;

  moltenColor?: THREE.Color | number[];
  coreColor?: THREE.Color | number[];
  coolingColor?: THREE.Color | number[];

  emissiveIntensity?: number;
  glowIntensity?: number;
  viscosity?: number;
  temperature?: number;

  lavaRoughness?: number;
  lavaMetalness?: number;
  lavaNormalScale?: number;
  lavaNormalSpeed?: number;

  seed?: number;
  startTime?: number;
  timeSpeed?: number;
  cosmicOriginTime?: number;
}

const LAVA_PROCEDURAL_RANGES = {
  LAVA_WAVE_HEIGHT: { min: 0.02, max: 0.06 },
  LAVA_WAVE_FREQUENCY: { min: 1.0, max: 2.5 },
  LAVA_WAVE_SPEED: { min: 0.02, max: 0.1 },
  EMISSIVE_INTENSITY: { min: 3.0, max: 6.0 },
  GLOW_INTENSITY: { min: 2.0, max: 4.0 },
  TEMPERATURE: { min: 0.8, max: 1.0 },
  TIME_SPEED: { min: 0.05, max: 0.5 },
};

export class MoltenLavaEffect {
  private _layerMesh?: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private params: MoltenLavaParams;
  private layerSystem: PlanetLayerSystem;
  private startTime: number;

  constructor(layerSystem: PlanetLayerSystem, params: MoltenLavaParams = {}) {
    this.layerSystem = layerSystem;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    this.startTime = params.startTime || (seed % 10000) / 1000;

    const moltenCoreColor = new THREE.Color(0xff8c00);
    const hsl = { h: 0, s: 0, l: 0 };
    moltenCoreColor.getHSL(hsl);

    const moltenColor = params.moltenColor instanceof THREE.Color ? params.moltenColor : new THREE.Color().setHSL(hsl.h, 1.0, 0.5);
    const coreColor = params.coreColor instanceof THREE.Color ? params.coreColor : new THREE.Color().setHSL(hsl.h + 0.05, 0.9, 0.6);
    const coolingColor = params.coolingColor instanceof THREE.Color ? params.coolingColor : new THREE.Color().setHSL(hsl.h - 0.05, 0.8, 0.3);

    this.params = {
      moltenColor,
      coreColor,
      coolingColor,
      lavaWaveHeight: params.lavaWaveHeight || rng.uniform(LAVA_PROCEDURAL_RANGES.LAVA_WAVE_HEIGHT.min, LAVA_PROCEDURAL_RANGES.LAVA_WAVE_HEIGHT.max),
      lavaWaveFrequency: params.lavaWaveFrequency || rng.uniform(LAVA_PROCEDURAL_RANGES.LAVA_WAVE_FREQUENCY.min, LAVA_PROCEDURAL_RANGES.LAVA_WAVE_FREQUENCY.max),
      lavaWaveSpeed: params.lavaWaveSpeed || rng.uniform(LAVA_PROCEDURAL_RANGES.LAVA_WAVE_SPEED.min, LAVA_PROCEDURAL_RANGES.LAVA_WAVE_SPEED.max),
      secondaryLavaWaveHeight: params.secondaryLavaWaveHeight || rng.uniform(LAVA_PROCEDURAL_RANGES.LAVA_WAVE_HEIGHT.min * 0.7, LAVA_PROCEDURAL_RANGES.LAVA_WAVE_HEIGHT.max * 0.7),
      secondaryLavaWaveFrequency: params.secondaryLavaWaveFrequency || rng.uniform(LAVA_PROCEDURAL_RANGES.LAVA_WAVE_FREQUENCY.min * 1.3, LAVA_PROCEDURAL_RANGES.LAVA_WAVE_FREQUENCY.max * 1.3),
      secondaryLavaWaveSpeed: params.secondaryLavaWaveSpeed || rng.uniform(LAVA_PROCEDURAL_RANGES.LAVA_WAVE_SPEED.min * 1.2, LAVA_PROCEDURAL_RANGES.LAVA_WAVE_SPEED.max * 1.2),
      lavaDistortionScale: params.lavaDistortionScale || 2.0,
      lavaDistortionSpeed: params.lavaDistortionSpeed || 0.2,
      emissiveIntensity: params.emissiveIntensity || rng.uniform(LAVA_PROCEDURAL_RANGES.EMISSIVE_INTENSITY.min, LAVA_PROCEDURAL_RANGES.EMISSIVE_INTENSITY.max),
      glowIntensity: params.glowIntensity || rng.uniform(LAVA_PROCEDURAL_RANGES.GLOW_INTENSITY.min, LAVA_PROCEDURAL_RANGES.GLOW_INTENSITY.max),
      viscosity: params.viscosity || 0.8,
      temperature: params.temperature || rng.uniform(LAVA_PROCEDURAL_RANGES.TEMPERATURE.min, LAVA_PROCEDURAL_RANGES.TEMPERATURE.max),
      lavaRoughness: params.lavaRoughness || 0.9,
      lavaMetalness: params.lavaMetalness || 0.1,
      lavaNormalScale: params.lavaNormalScale || 0.08,
      lavaNormalSpeed: params.lavaNormalSpeed || 0.1,
      seed,
      startTime: this.startTime,
      timeSpeed: params.timeSpeed || rng.uniform(LAVA_PROCEDURAL_RANGES.TIME_SPEED.min, LAVA_PROCEDURAL_RANGES.TIME_SPEED.max),
    };

    this.material = this.layerSystem.createMoltenLavaLayerMaterial(this.params as Record<string, unknown>);

    this._layerMesh = this.layerSystem.addEffectLayer("moltenLava", this.material, this.layerSystem.getNextScaleFactor(), this);
  }

  update(deltaTime: number): void {
    const rawTime = this.startTime + getUniverseTime(DEFAULT_COSMIC_ORIGIN_TIME) * this.params.timeSpeed!;
    const currentTime = rawTime % 1000;

    if (this.material.uniforms.time) {
      this.material.uniforms.time.value = currentTime;
    }
  }

  dispose(): void {}
}

export function createMoltenLavaFromPythonData(layerSystem: PlanetLayerSystem, pythonData: any, globalSeed?: number): MoltenLavaEffect {
  const seed = globalSeed || 12345;
  const rng = new SeededRandom(seed + 8000);

  const params: MoltenLavaParams = {
    emissiveIntensity: rng.uniform(LAVA_PROCEDURAL_RANGES.EMISSIVE_INTENSITY.min, LAVA_PROCEDURAL_RANGES.EMISSIVE_INTENSITY.max),
    glowIntensity: rng.uniform(LAVA_PROCEDURAL_RANGES.GLOW_INTENSITY.min, LAVA_PROCEDURAL_RANGES.GLOW_INTENSITY.max),
    temperature: rng.uniform(LAVA_PROCEDURAL_RANGES.TEMPERATURE.min, LAVA_PROCEDURAL_RANGES.TEMPERATURE.max),
    viscosity: 0.9,
    lavaRoughness: 0.8,
    lavaMetalness: 0.1,
    lavaNormalScale: 0.06,
    lavaNormalSpeed: 0.08,
    seed,
  };

  return new MoltenLavaEffect(layerSystem, params);
}
