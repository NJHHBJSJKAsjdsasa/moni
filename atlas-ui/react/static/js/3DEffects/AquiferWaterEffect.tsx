// atlas-ui/react/static/js/3DEffects/AquiferWaterEffect.tsx
import * as THREE from "three";
import { PlanetLayerSystem } from "../3DComponents/PlanetLayerSystem";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime";

export interface AquiferWaterParams extends Record<string, unknown> {
  waveHeight?: number;
  waveFrequency?: number;
  waveSpeed?: number;

  secondaryWaveHeight?: number;
  secondaryWaveFrequency?: number;
  secondaryWaveSpeed?: number;

  distortionScale?: number;
  distortionSpeed?: number;

  waterColor?: THREE.Color | number[];
  deepWaterColor?: THREE.Color | number[];
  foamColor?: THREE.Color | number[];

  specularIntensity?: number;
  reflectivity?: number;
  transparency?: number;
  roughness?: number;
  metalness?: number;

  normalScale?: number;
  normalSpeed?: number;
  seed?: number;
  startTime?: number;
  timeSpeed?: number;
}

const PROCEDURAL_RANGES = {
  WAVE_HEIGHT: { min: 0.05, max: 0.12 },
  WAVE_FREQUENCY: { min: 2.0, max: 5.0 },
  WAVE_SPEED: { min: 0.2, max: 0.8 },
  SPECULAR_INTENSITY: { min: 2.0, max: 6.0 },
  TRANSPARENCY: { min: 0.2, max: 0.5 },
  TIME_SPEED: { min: 0.1, max: 1.0 },
};

export class AquiferWaterEffect {
  private layerMesh?: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private params: AquiferWaterParams;
  private layerSystem: PlanetLayerSystem;
  private startTime: number;

  constructor(layerSystem: PlanetLayerSystem, params: AquiferWaterParams = {}) {
    this.layerSystem = layerSystem;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    this.startTime = params.startTime || (seed % 10000) / 1000;

    const waterColor = params.waterColor instanceof THREE.Color ? params.waterColor : params.waterColor ? new THREE.Color(params.waterColor as any) : new THREE.Color(0x2e8b8b);
    const deepWaterColor = params.deepWaterColor instanceof THREE.Color ? params.deepWaterColor : params.deepWaterColor ? new THREE.Color(params.deepWaterColor as any) : new THREE.Color(0x003366);
    const foamColor = params.foamColor instanceof THREE.Color ? params.foamColor : params.foamColor ? new THREE.Color(params.foamColor as any) : new THREE.Color(0xffffff);

    this.params = {
      waterColor,
      deepWaterColor,
      foamColor,
      waveHeight: params.waveHeight || rng.uniform(PROCEDURAL_RANGES.WAVE_HEIGHT.min, PROCEDURAL_RANGES.WAVE_HEIGHT.max),
      waveFrequency: params.waveFrequency || rng.uniform(PROCEDURAL_RANGES.WAVE_FREQUENCY.min, PROCEDURAL_RANGES.WAVE_FREQUENCY.max),
      waveSpeed: params.waveSpeed || rng.uniform(PROCEDURAL_RANGES.WAVE_SPEED.min, PROCEDURAL_RANGES.WAVE_SPEED.max),
      secondaryWaveHeight: params.secondaryWaveHeight || rng.uniform(PROCEDURAL_RANGES.WAVE_HEIGHT.min * 0.6, PROCEDURAL_RANGES.WAVE_HEIGHT.max * 0.6),
      secondaryWaveFrequency: params.secondaryWaveFrequency || rng.uniform(PROCEDURAL_RANGES.WAVE_FREQUENCY.min * 1.2, PROCEDURAL_RANGES.WAVE_FREQUENCY.max * 1.2),
      secondaryWaveSpeed: params.secondaryWaveSpeed || rng.uniform(PROCEDURAL_RANGES.WAVE_SPEED.min * 1.1, PROCEDURAL_RANGES.WAVE_SPEED.max * 1.1),
      distortionScale: params.distortionScale || 3.0,
      distortionSpeed: params.distortionSpeed || 0.5,
      specularIntensity: params.specularIntensity || rng.uniform(PROCEDURAL_RANGES.SPECULAR_INTENSITY.min, PROCEDURAL_RANGES.SPECULAR_INTENSITY.max),
      reflectivity: params.reflectivity || 0.3,
      transparency: params.transparency || rng.uniform(PROCEDURAL_RANGES.TRANSPARENCY.min, PROCEDURAL_RANGES.TRANSPARENCY.max),
      roughness: params.roughness || 0.1,
      metalness: params.metalness || 0.2,
      normalScale: params.normalScale || 0.05,
      normalSpeed: params.normalSpeed || 0.5,
      seed,
      startTime: this.startTime,
      timeSpeed: params.timeSpeed || rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),
    };

    this.material = this.layerSystem.createAquiferWaterLayerMaterial(this.params);

    this.layerMesh = this.layerSystem.addEffectLayer("aquiferWater", this.material, this.layerSystem.getNextScaleFactor(), this);
  }

  update(_deltaTime: number): void {
    const rawTime = this.startTime + getUniverseTime(DEFAULT_COSMIC_ORIGIN_TIME) * this.params.timeSpeed!;
    const currentTime = rawTime % 1000;

    if (this.material.uniforms.time) {
      this.material.uniforms.time.value = currentTime;
    }
  }

  dispose(): void {}
}

export function createAquiferWaterFromPythonData(layerSystem: PlanetLayerSystem, pythonData: any, globalSeed?: number): AquiferWaterEffect {
  const planetInfo = pythonData.planet_info || {};
  const baseColor = planetInfo.base_color ? (typeof planetInfo.base_color === "string" ? new THREE.Color(planetInfo.base_color) : new THREE.Color().fromArray(planetInfo.base_color)) : new THREE.Color(0x4a90e2);

  const hsl = { h: 0, s: 0, l: 0 };
  baseColor.getHSL(hsl);

  const waterColor = new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 1.2), Math.min(1, hsl.l * 0.8));

  const deepWaterColor = new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 1.3), Math.max(0, hsl.l * 0.4));

  const seed = globalSeed || 12345;
  const rng = new SeededRandom(seed + 5000);

  const params: AquiferWaterParams = {
    waterColor,
    deepWaterColor,
    foamColor: new THREE.Color(0.9, 0.95, 1.0),
    specularIntensity: rng.uniform(PROCEDURAL_RANGES.SPECULAR_INTENSITY.min, PROCEDURAL_RANGES.SPECULAR_INTENSITY.max),
    reflectivity: 0.3,
    transparency: rng.uniform(PROCEDURAL_RANGES.TRANSPARENCY.min, PROCEDURAL_RANGES.TRANSPARENCY.max),
    roughness: 0.05,
    metalness: 0.1,
    normalScale: 0.02,
    normalSpeed: 0.6,
    seed,
  };

  return new AquiferWaterEffect(layerSystem, params);
}
