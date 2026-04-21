// atlas-ui/react/static/js/3DEffects/PlanetRays.tsx

import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getAnimatedUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

export interface PlanetRaysParams {
  rayCount?: number;
  rayIntensity?: number;
  pulseSpeed?: number;
  rayLength?: number;
  rayThickness?: number;
  seed?: number;
  timeSpeed?: number;
  startTime?: number;
  colorVariation?: number;
  cosmicOriginTime?: number;
}

const PROCEDURAL_RANGES = {
  RAY_COUNT: { min: 8, max: 33 },
  RAY_INTENSITY: { min: 0.5, max: 2 },
  PULSE_SPEED: { min: 1.0, max: 6.0 },
  RAY_LENGTH: { min: 0.5, max: 2.5 },
  RAY_THICKNESS: { min: 0.02, max: 0.15 },
  TIME_SPEED: { min: 0.8, max: 1.5 },
  COLOR_VARIATION: { min: 0.2, max: 0.6 },
};

export class PlanetRaysEffect {
  private rays: THREE.Mesh[];
  private group: THREE.Group;
  private params: PlanetRaysParams;
  private startTime: number;
  private rayMaterials: THREE.MeshBasicMaterial[];
  private rayData: Array<{
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    phase: number;
    frequency: number;
    color: THREE.Color;
    activationOffset: number;
  }>;

  private stormFreq1: number;
  private stormFreq2: number;
  private stormThreshold: number;

  constructor(planetRadius: number, params: PlanetRaysParams = {}) {
    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    this.startTime = params.startTime || (seed % 10000) / 1000;

    this.params = {
      rayCount: params.rayCount || Math.floor(rng.uniform(PROCEDURAL_RANGES.RAY_COUNT.min, PROCEDURAL_RANGES.RAY_COUNT.max)),
      rayIntensity: params.rayIntensity || rng.uniform(PROCEDURAL_RANGES.RAY_INTENSITY.min, PROCEDURAL_RANGES.RAY_INTENSITY.max),
      pulseSpeed: params.pulseSpeed || rng.uniform(PROCEDURAL_RANGES.PULSE_SPEED.min, PROCEDURAL_RANGES.PULSE_SPEED.max),
      rayLength: params.rayLength || rng.uniform(PROCEDURAL_RANGES.RAY_LENGTH.min, PROCEDURAL_RANGES.RAY_LENGTH.max),
      rayThickness: params.rayThickness || rng.uniform(PROCEDURAL_RANGES.RAY_THICKNESS.min, PROCEDURAL_RANGES.RAY_THICKNESS.max),
      timeSpeed: params.timeSpeed || rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),
      colorVariation: params.colorVariation || rng.uniform(PROCEDURAL_RANGES.COLOR_VARIATION.min, PROCEDURAL_RANGES.COLOR_VARIATION.max),
      seed: seed,
      startTime: this.startTime,
    };

    const seedOffset = (seed % 1000) / 1000;
    this.stormFreq1 = 0.01 + seedOffset * 0.005;
    this.stormFreq2 = 0.003 + seedOffset * 0.002;
    this.stormThreshold = 0.75 + seedOffset * 0.15;

    this.group = new THREE.Group();
    this.rays = [];
    this.rayMaterials = [];
    this.rayData = [];

    this.generateRays(planetRadius, rng);
  }

  private generateRays(planetRadius: number, rng: SeededRandom): void {
    const rayCount = this.params.rayCount!;

    for (let i = 0; i < rayCount; i++) {
      const points: THREE.Vector3[] = [];

      const startPosData = rng.spherePosition(planetRadius * 1.05);
      const startPos = new THREE.Vector3(startPosData.x, startPosData.y, startPosData.z);

      const endDistance = planetRadius * (2.0 + this.params.rayLength! * rng.uniform(0.8, 1.2));
      const endDirection = startPos.clone().normalize();
      const endPos = endDirection.multiplyScalar(endDistance);

      const segments = 8 + Math.floor(rng.uniform(0, 5));

      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const pos = new THREE.Vector3().lerpVectors(startPos, endPos, t);

        if (j > 0 && j < segments) {
          const offsetData = rng.spherePosition(planetRadius * 0.05 * (1.0 - t));
          const offset = new THREE.Vector3(offsetData.x, offsetData.y, offsetData.z);
          pos.add(offset);
        }

        points.push(pos);
      }

      const path = new THREE.CatmullRomCurve3(points);
      const tubeRadius = planetRadius * this.params.rayThickness! * 0.08;
      const geometry = new THREE.TubeGeometry(path, segments * 2, tubeRadius, 8, false);

      const baseHue = 200 + rng.uniform(-30, 30);
      const saturation = 0.8 + rng.uniform(-0.2, 0.2);
      const lightness = 0.6 + rng.uniform(-0.1, 0.1);

      const color = new THREE.Color();
      color.setHSL(baseHue / 360, saturation, lightness);

      const colorShift = this.params.colorVariation!;
      color.r = Math.min(1.0, color.r + rng.uniform(-colorShift, colorShift));
      color.g = Math.min(1.0, color.g + rng.uniform(-colorShift, colorShift));
      color.b = Math.min(1.0, color.b + rng.uniform(-colorShift, colorShift));

      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });

      const ray = new THREE.Mesh(geometry, material);

      this.rayData.push({
        startPos: startPos,
        endPos: endPos,
        phase: rng.uniform(0, Math.PI * 2),
        frequency: this.params.pulseSpeed! * rng.uniform(0.8, 1.2),
        color: color,
        activationOffset: rng.uniform(0, 100),
      });

      this.rays.push(ray);
      this.rayMaterials.push(material);
      this.group.add(ray);
    }

    const detailRayCount = Math.floor(rayCount * 0.5);

    for (let i = 0; i < detailRayCount; i++) {
      const points: THREE.Vector3[] = [];

      const startPosData = rng.spherePosition(planetRadius * 1.02);
      const startPos = new THREE.Vector3(startPosData.x, startPosData.y, startPosData.z);

      const endDistance = planetRadius * (1.5 + this.params.rayLength! * 0.5 * rng.uniform(0.6, 1.0));
      const endDirection = startPos.clone().normalize();
      const deviationData = rng.spherePosition(0.2);
      const deviation = new THREE.Vector3(deviationData.x, deviationData.y, deviationData.z);
      endDirection.add(deviation).normalize();
      const endPos = endDirection.multiplyScalar(endDistance);

      const segments = 4 + Math.floor(rng.uniform(0, 3));

      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const pos = new THREE.Vector3().lerpVectors(startPos, endPos, t);

        if (j > 0 && j < segments) {
          const offsetData = rng.spherePosition(planetRadius * 0.02 * (1.0 - t));
          const offset = new THREE.Vector3(offsetData.x, offsetData.y, offsetData.z);
          pos.add(offset);
        }

        points.push(pos);
      }

      const path = new THREE.CatmullRomCurve3(points);
      const tubeRadius = planetRadius * this.params.rayThickness! * 0.03;
      const geometry = new THREE.TubeGeometry(path, segments * 2, tubeRadius, 6, false);

      const baseHue = 200 + rng.uniform(-30, 30);
      const saturation = 0.6 + rng.uniform(-0.2, 0.2);
      const lightness = 0.4 + rng.uniform(-0.1, 0.1);

      const color = new THREE.Color();
      color.setHSL(baseHue / 360, saturation, lightness);

      const colorShift = this.params.colorVariation! * 0.7;
      color.r = Math.min(1.0, color.r + rng.uniform(-colorShift, colorShift));
      color.g = Math.min(1.0, color.g + rng.uniform(-colorShift, colorShift));
      color.b = Math.min(1.0, color.b + rng.uniform(-colorShift, colorShift));

      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });

      const ray = new THREE.Mesh(geometry, material);

      this.rayData.push({
        startPos: startPos,
        endPos: endPos,
        phase: rng.uniform(0, Math.PI * 2),
        frequency: this.params.pulseSpeed! * rng.uniform(1.5, 2.5),
        color: color,
        activationOffset: rng.uniform(0, 150),
      });

      this.rays.push(ray);
      this.rayMaterials.push(material);
      this.group.add(ray);
    }
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.group.position.copy(planetPosition);
    }
    scene.add(this.group);
  }

  update(): void {
    const cosmicOriginTime = DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.params.timeSpeed!, this.startTime);

    this.rayMaterials.forEach((material, index) => {
      const data = this.rayData[index];

      const phase = currentTime * data.frequency + data.phase;
      const rayTime = (currentTime + data.activationOffset) * 0.1;

      const activationPattern = Math.sin(rayTime) * Math.sin(rayTime * 0.3) * Math.sin(rayTime * 0.7);
      const isActive = activationPattern > 0.2;

      if (isActive) {
        const baseIntensity = Math.max(0, (activationPattern - 0.2) / 0.8);

        const mainPulse = Math.sin(phase) * 0.3 + 0.7;
        const flicker = Math.sin(phase * 12.0) > 0.9 ? 1.5 : 1.0;

        const stormPattern = Math.sin(currentTime * this.stormFreq1) * Math.sin(currentTime * this.stormFreq2);
        const isStormTime = stormPattern > this.stormThreshold;
        const stormBoost = isStormTime ? 1.5 : 1.0;

        let intensity = baseIntensity * mainPulse * flicker * stormBoost * this.params.rayIntensity!;
        intensity = Math.min(1.0, intensity);

        material.opacity = intensity;

        if (flicker > 1.2 || stormBoost > 1.2) {
          material.color.setRGB(Math.min(1.0, data.color.r + 0.3), Math.min(1.0, data.color.g + 0.3), Math.min(1.0, data.color.b + 0.3));
        } else {
          material.color.copy(data.color);
        }
      } else {
        material.opacity = 0;
      }
    });

    this.group.rotation.y = currentTime * 0.005;
    this.group.rotation.x = Math.sin(currentTime * 0.002) * 0.1;
  }

  getObject3D(): THREE.Group {
    return this.group;
  }

  dispose(): void {
    this.rays.forEach((ray) => {
      (ray.geometry as THREE.BufferGeometry).dispose();
      (ray.material as THREE.Material).dispose();
    });
  }
}

export function createPlanetRaysFromPythonData(planetRadius: number, _rayData: any, globalSeed?: number): PlanetRaysEffect {
  const seed = globalSeed || Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed + 7777);

  const timeSpeed = rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max);

  const startTime = (seed % 10000) / 1000;

  const params: PlanetRaysParams = {
    rayCount: Math.floor(rng.uniform(PROCEDURAL_RANGES.RAY_COUNT.min, PROCEDURAL_RANGES.RAY_COUNT.max)),
    rayIntensity: rng.uniform(PROCEDURAL_RANGES.RAY_INTENSITY.min, PROCEDURAL_RANGES.RAY_INTENSITY.max),
    pulseSpeed: rng.uniform(PROCEDURAL_RANGES.PULSE_SPEED.min, PROCEDURAL_RANGES.PULSE_SPEED.max),
    rayLength: rng.uniform(PROCEDURAL_RANGES.RAY_LENGTH.min, PROCEDURAL_RANGES.RAY_LENGTH.max),
    rayThickness: rng.uniform(PROCEDURAL_RANGES.RAY_THICKNESS.min, PROCEDURAL_RANGES.RAY_THICKNESS.max),
    timeSpeed: timeSpeed,
    colorVariation: rng.uniform(PROCEDURAL_RANGES.COLOR_VARIATION.min, PROCEDURAL_RANGES.COLOR_VARIATION.max),
    seed,
    startTime: startTime,
  };

  return new PlanetRaysEffect(planetRadius, params);
}
