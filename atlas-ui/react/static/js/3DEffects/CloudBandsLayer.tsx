// atlas-ui/react/static/js/3DEffects/CloudBandsLayer.tsx
import * as THREE from "three";
import { PlanetLayerSystem } from "../3DComponents/PlanetLayerSystem";
import { SeededRandom } from "../Utils/SeededRandom.tsx";

export interface CloudBandsLayerParams extends Record<string, unknown> {
  numBands?: number;
  bandPositions?: number[];
  bandWidths?: number[];
  rotationAngle?: number;
  baseColor?: THREE.Color | number[];
  bandColor?: THREE.Color | number[];
  animationSpeed?: number;
  turbulence?: number;
  noiseScale?: number;
  opacity?: number;
  seed?: number;
}

const PROCEDURAL_RANGES = {
  NUM_BANDS: { min: 6, max: 12 },
  BAND_POSITIONS: { min: -0.8, max: 0.8 },
  BAND_WIDTHS: { min: 0.08, max: 0.15 },
  ROTATION_ANGLE: { min: 0, max: Math.PI * 2 },
  ANIMATION_SPEED: { min: 0.5, max: 2.0 },
  TURBULENCE: { min: 0.3, max: 0.8 },
  NOISE_SCALE: { min: 2.0, max: 4.0 },
  OPACITY: { min: 0.3, max: 0.5 },
};

export class CloudBandsLayer {
  private layerMesh?: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private params: CloudBandsLayerParams;
  private layerSystem: PlanetLayerSystem;

  constructor(layerSystem: PlanetLayerSystem, params: CloudBandsLayerParams = {}) {
    this.layerSystem = layerSystem;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    const numBands = params.numBands || Math.floor(rng.uniform(PROCEDURAL_RANGES.NUM_BANDS.min, PROCEDURAL_RANGES.NUM_BANDS.max));

    this.params = {
      numBands,
      bandPositions: params.bandPositions || this.generateDefaultBandPositions(numBands, seed),
      bandWidths: params.bandWidths || this.generateDefaultBandWidths(numBands, seed),
      rotationAngle: params.rotationAngle || rng.uniform(PROCEDURAL_RANGES.ROTATION_ANGLE.min, PROCEDURAL_RANGES.ROTATION_ANGLE.max),
      baseColor: params.baseColor || new THREE.Color(0xffa500),
      bandColor: params.bandColor || new THREE.Color(0xff8c00),
      animationSpeed: params.animationSpeed || rng.uniform(PROCEDURAL_RANGES.ANIMATION_SPEED.min, PROCEDURAL_RANGES.ANIMATION_SPEED.max),
      turbulence: params.turbulence || rng.uniform(PROCEDURAL_RANGES.TURBULENCE.min, PROCEDURAL_RANGES.TURBULENCE.max),
      noiseScale: params.noiseScale || rng.uniform(PROCEDURAL_RANGES.NOISE_SCALE.min, PROCEDURAL_RANGES.NOISE_SCALE.max),
      opacity: params.opacity || 0.4,
      seed,
    };

    this.material = this.layerSystem.createCloudBandsLayerMaterial(this.params);

    this.layerMesh = this.layerSystem.addEffectLayer("cloudBands", this.material, 1.001, this);
  }

  private generateDefaultBandPositions(numBands: number, seed: number): number[] {
    const positions = new Array(20).fill(0);
    const rng = new SeededRandom(seed + 12345);

    for (let i = 0; i < numBands && i < 20; i++) {
      positions[i] = rng.uniform(PROCEDURAL_RANGES.BAND_POSITIONS.min, PROCEDURAL_RANGES.BAND_POSITIONS.max);
    }

    return positions;
  }

  private generateDefaultBandWidths(numBands: number, seed: number): number[] {
    const widths = new Array(20).fill(0);
    const rng = new SeededRandom(seed + 67890);

    for (let i = 0; i < numBands && i < 20; i++) {
      widths[i] = rng.uniform(PROCEDURAL_RANGES.BAND_WIDTHS.min, PROCEDURAL_RANGES.BAND_WIDTHS.max);
    }

    return widths;
  }

  update(deltaTime: number, planetRotation?: number): void {
    if (this.material.uniforms.time) {
      this.material.uniforms.time.value += deltaTime;
    }

    if (planetRotation !== undefined && this.material.uniforms.rotationAngle) {
      this.material.uniforms.rotationAngle.value = planetRotation;
    }
  }

  updateParams(newParams: Partial<CloudBandsLayerParams>): void {
    this.params = { ...this.params, ...newParams };

    if (newParams.numBands !== undefined) {
      this.material.uniforms.numBands.value = newParams.numBands;
    }
    if (newParams.bandPositions) {
      this.material.uniforms.bandPositions.value = newParams.bandPositions;
    }
    if (newParams.bandWidths) {
      this.material.uniforms.bandWidths.value = newParams.bandWidths;
    }
    if (newParams.animationSpeed !== undefined) {
      this.material.uniforms.animationSpeed.value = newParams.animationSpeed;
    }
    if (newParams.turbulence !== undefined) {
      this.material.uniforms.turbulence.value = newParams.turbulence;
    }
    if (newParams.opacity !== undefined) {
      this.material.uniforms.opacity.value = newParams.opacity;
    }
  }

  dispose(): void {}
}

export function createCloudBandsLayerFromPythonData(layerSystem: PlanetLayerSystem, gasGiantData: any, globalSeed?: number): CloudBandsLayer {
  const cloudBands = gasGiantData.cloud_bands || {};

  const seed = globalSeed || Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed + 4000);

  const params: CloudBandsLayerParams = {
    numBands: cloudBands.num_bands || Math.floor(rng.uniform(PROCEDURAL_RANGES.NUM_BANDS.min, PROCEDURAL_RANGES.NUM_BANDS.max)),
    bandPositions: cloudBands.positions || undefined,
    bandWidths: cloudBands.widths || undefined,
    rotationAngle: cloudBands.rotation || rng.uniform(PROCEDURAL_RANGES.ROTATION_ANGLE.min, PROCEDURAL_RANGES.ROTATION_ANGLE.max),
    baseColor: gasGiantData.base_color ? new THREE.Color().setRGB(gasGiantData.base_color.r || gasGiantData.base_color[0], gasGiantData.base_color.g || gasGiantData.base_color[1], gasGiantData.base_color.b || gasGiantData.base_color[2]) : new THREE.Color(0xffa500),
    bandColor: new THREE.Color(0xffffff),
    animationSpeed: rng.uniform(PROCEDURAL_RANGES.ANIMATION_SPEED.min, PROCEDURAL_RANGES.ANIMATION_SPEED.max),
    turbulence: gasGiantData.turbulence || rng.uniform(PROCEDURAL_RANGES.TURBULENCE.min, PROCEDURAL_RANGES.TURBULENCE.max),
    noiseScale: rng.uniform(PROCEDURAL_RANGES.NOISE_SCALE.min, PROCEDURAL_RANGES.NOISE_SCALE.max),
    opacity: 0.4,
    seed,
  };

  return new CloudBandsLayer(layerSystem, params);
}
