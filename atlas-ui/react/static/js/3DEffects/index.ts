// atlas-ui/react/static/js/3DEffects/index.ts

import type { EffectCreationData } from "./EffectRegistry";

export { RingSystemEffect, createRingSystemFromPythonData } from "./RingSystem";
export type { RingSystemParams } from "./RingSystem";

export { CloudBandsLayer, createCloudBandsLayerFromPythonData } from "./CloudBandsLayer";
export type { CloudBandsLayerParams } from "./CloudBandsLayer";

export { AtmosphereGlowEffect, createAtmosphereGlowFromPythonData } from "./AtmosphereGlow";
export type { AtmosphereGlowParams } from "./AtmosphereGlow";

export { AtmosphereCloudsEffect, createAtmosphereCloudsFromPythonData } from "./AtmosphereClouds";
export type { AtmosphereCloudsParams } from "./AtmosphereClouds";

export { AtmosphereEffect, createAtmosphereFromPythonData } from "./Atmosphere";
export type { AtmosphereParams } from "./Atmosphere";

export { CloudGyrosLayer, createCloudGyrosLayerFromPythonData } from "./CloudGyrosLayer";
export type { CloudGyrosLayerParams } from "./CloudGyrosLayer";

export { AtmosphericStreaksEffect, createAtmosphericStreaksFromPythonData } from "./AtmosphericStreaks";
export type { AtmosphericStreaksParams } from "./AtmosphericStreaks";

export { MetallicSurfaceLayer, createMetallicSurfaceLayerFromPythonData } from "./MetallicSurfaceLayer";
export type { MetallicSurfaceLayerParams } from "./MetallicSurfaceLayer";

export { FragmentationEffect } from "./FragmentationEffect";
export type { FragmentationParams } from "./FragmentationEffect";

export { RockyTerrainLayer, createRockyTerrainLayerFromPythonData } from "./RockyTerrainLayer";
export type { RockyTerrainLayerParams } from "./RockyTerrainLayer";

export { IcyTerrainLayer, createIcyTerrainLayerFromPythonData } from "./IcyTerrainLayer";
export type { IcyTerrainLayerParams } from "./IcyTerrainLayer";

export { LandMassesEffect, createLandMassesFromPythonData } from "./LandMasses";
export type { LandMassesParams } from "./LandMasses";

export { TundraSnowflakesEffect, createTundraSnowflakesFromPythonData, createDesertSandstormsFromPythonData, createToxicParticlesFromPythonData } from "./TundraSnowflakes";
export type { TundraSnowflakesParams } from "./TundraSnowflakes";

export { ToxicPostProcessingEffect, createToxicPostProcessingFromPythonData } from "./ToxicPostProcessing";
export type { ToxicPostProcessingParams } from "./ToxicPostProcessing";

export { RiverLinesEffect, createRiverLinesFromPythonData, createRiverLinesWithPreset } from "./RiverLines";
export type { RiverLinesParams } from "./RiverLines";

export { CaveSurfaceHolesEffect, createCaveSurfaceHolesFromPythonData } from "./CaveSurfaceHoles";
export type { CaveSurfaceHolesParams } from "./CaveSurfaceHoles";

export { AnomalyPhaseMatterEffect, createAnomalyPhaseMatterFromPythonData } from "./AnomalyPhaseMatter";
export type { AnomalyPhaseMatterParams } from "./AnomalyPhaseMatter";

export { PulsatingCubeEffect, createPulsatingCubeFromPythonData } from "./PulsatingCube";
export type { PulsatingCubeParams } from "./PulsatingCube";

export { PlanetRaysEffect, createPlanetRaysFromPythonData } from "./PlanetRays";
export type { PlanetRaysParams } from "./PlanetRays";

export { FireEruptionEffect, createFireEruptionFromPythonData } from "./FireEruptionEffect";
export type { FireEruptionParams } from "./FireEruptionEffect";

export { LavaRiversEffect, createLavaRiversFromPythonData } from "./LavaRiversEffect";
export type { LavaRiverParams } from "./LavaRiversEffect";

export { CarbonTrailsEffect, createCarbonTrailsFromPythonData } from "./CarbonTrails";
export type { CarbonTrailsParams } from "./CarbonTrails";

export { RadiationRingsEffect, createRadiationRingsFromPythonData } from "./RadiationRings";
export type { RadiationRingsParams } from "./RadiationRings";

export { SuperEarthWaterFeaturesEffect, createSuperEarthWaterFeaturesFromPythonData } from "./SuperEarthWaterFeatures";
export type { SuperEarthWaterFeaturesParams } from "./SuperEarthWaterFeatures";

export { EffectRegistry, EffectType } from "./EffectRegistry";
export type { EffectInstance, EffectCreationData, EffectCreator } from "./EffectRegistry";

export const AVAILABLE_EFFECTS = ["cloud_bands", "cloud_gyros", "atmosphere", "atmosphere_glow", "atmosphere_clouds", "atmospheric_streaks", "ring_system", "fragmentation", "rocky_terrain", "icy_terrain", "lava_flows", "lava_rivers", "crystal_formations", "cloud_layers", "storm_systems", "volcanic_activity", "aurora", "magnetic_field", "city_lights", "bioluminescence", "thermal_emissions", "tundra_snowflakes", "toxic_post_processing", "river_lines", "cave_surface_holes", "radiation_pulse", "radiation_rings", "super_earth_water_features", "anomaly_phase_matter", "pulsating_cube", "planet_rays"] as const;

export type AvailableEffectType = (typeof AVAILABLE_EFFECTS)[number];

export const DEFAULT_EFFECT_CONFIGS = {
  atmosphere: {
    type: "Thin",
    width: 12,
    opacity: 0.2,
    density: 1.0,
  },

  ring_system: {
    particleCount: 1000,
    grayVariation: "medium" as const,
    ringThickness: 0.1,
    sparkleIntensity: 0.03,
    brightness: 2.2,
  },

  cloud_bands: {
    numBands: 8,
    animationSpeed: 1.0,
    turbulence: 0.5,
  },

  cloud_gyros: {
    stormIntensity: 0.8,
    spiralSpeed: 2.0,
    animationSpeed: 1.0,
  },

  atmosphere_glow: {
    particleCount: 500,
    speed: 0.4,
    size: 1.0,
    opacity: 1.0,
  },

  fragmentation: {
    fragmentCount: 20,
    size: 0.05,
    distribution: "edge" as const,
    animationSpeed: 1.0,
  },

  rocky_terrain: {
    baseTextureIntensity: 0.4,
    mountainColor: [0.8, 0.8, 0.8],
    cloudColor: [0.7, 0.7, 0.7],
    craterColor: [0.1, 0.1, 0.1],
  },

  icy_terrain: {
    baseTextureIntensity: 0.3,
    crystalColor: [0.675, 0.843, 0.902],
    crackColor: [0.2, 0.2, 0.2],
    iceCapColor: [0.678, 0.847, 1.0],
  },

  river_lines: {
    riverCount: 12,
    segmentsPerRiver: 8,
    lineWidth: 2.0,
    color: [0.4, 0.3, 0.2],
    opacity: 0.7,
    curviness: 0.8,
    branching: 0.3,
    density: 1.0,
  },

  cave_surface_holes: {
    baseColor: "#4a3f36",
    holeColor: "#1a1512",
    enableShadows: true,
  },
} as const;

export function getEffectDefaultConfig(effectType: string): any {
  return DEFAULT_EFFECT_CONFIGS[effectType as keyof typeof DEFAULT_EFFECT_CONFIGS] || {};
}

export function isEffectAvailable(effectType: string): boolean {
  return AVAILABLE_EFFECTS.includes(effectType as any);
}

export function createPlanetEffectConfig(planetType: string): EffectCreationData[] {
  const effects: EffectCreationData[] = [];

  switch (planetType.toLowerCase()) {
    case "metallic":
      effects.push(
        {
          type: "atmosphere",
          params: {
            ...DEFAULT_EFFECT_CONFIGS.atmosphere,
            color: [0.6, 0.1, 0.9, 0.2],
          },
          priority: 10,
        },
        {
          type: "atmospheric_streaks",
          params: {
            color: [0.95, 0.95, 1.0],
            particleCount: 100,
          },
          priority: 20,
        },
      );
      break;

    case "gas giant":
      effects.push(
        {
          type: "cloud_bands",
          params: DEFAULT_EFFECT_CONFIGS.cloud_bands,
          priority: 0,
        },
        {
          type: "cloud_gyros",
          params: DEFAULT_EFFECT_CONFIGS.cloud_gyros,
          priority: 1,
        },
        {
          type: "atmosphere",
          params: {
            ...DEFAULT_EFFECT_CONFIGS.atmosphere,
            color: [1.0, 0.6, 0.2, 0.2],
          },
          priority: 10,
        },
        {
          type: "atmosphere_glow",
          params: DEFAULT_EFFECT_CONFIGS.atmosphere_glow,
          priority: 20,
        },
      );
      break;

    case "icy":
      effects.push({
        type: "atmosphere",
        params: {
          ...DEFAULT_EFFECT_CONFIGS.atmosphere,
          color: [0.5, 0.8, 1.0, 0.15],
        },
        priority: 10,
      });
      break;

    default:
      effects.push({
        type: "atmosphere",
        params: {
          color: [0.5, 0.5, 0.8, 0.15],
        },
        priority: 10,
      });
      break;
  }

  return effects;
}

export function validateEffectConfig(effectType: string, params: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isEffectAvailable(effectType)) {
    errors.push(`Effect type '${effectType}' is not available`);
  }

  switch (effectType) {
    case "ring_system":
      if (params.particleCount !== undefined && params.particleCount < 1) {
        errors.push("Particle count must be positive");
      }
      break;

    case "fragmentation":
      if (params.fragmentCount !== undefined && params.fragmentCount < 1) {
        errors.push("Fragment count must be positive");
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const EffectsLogger = {
  log: (message: string, data?: any) => {},

  warn: (message: string, data?: any) => {},

  error: (message: string, error?: any) => {},

  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
    }
  },
};

export const EFFECTS_LIBRARY_VERSION = "1.0.0";
export const EFFECTS_LIBRARY_NAME = "Atlas Planet Effects Library";

export const EFFECTS_METADATA = {
  version: EFFECTS_LIBRARY_VERSION,
  name: EFFECTS_LIBRARY_NAME,
  totalEffects: AVAILABLE_EFFECTS.length,
  lastUpdated: new Date().toISOString(),
  author: "Atlas Universal Planet Renderer",
  description: "Modular 3D effects library for procedural planet rendering",
};
