// atlas-ui/react/static/js/3DEffects/TundraSnowflakes.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getAnimatedUniverseTime, getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

export interface TundraSnowflakesParams {
  particleCount?: number;
  windSpeed?: number;
  size?: number;
  opacity?: number;
  colors?: THREE.Color[];
  seed?: number;
  cosmicOriginTime?: number;
}

export class TundraSnowflakesEffect {
  private snowflakeGroup: THREE.Group;
  private planetRadius: number;
  private materials: THREE.MeshBasicMaterial[] = [];
  private particleSystems: THREE.Mesh[] = [];
  private trailPositions: Float32Array[] = [];
  private trailColors: Float32Array[] = [];
  private globalWindDirection: number;
  private rng: SeededRandom;
  private startTime: number;
  private timeSpeed: number;

  private trailLength: number = 15;
  private particleCount: number;

  private rotationSpeed: number;
  private particleOpacity: number;
  private windSpeedMultiplier: number;
  private verticalOscillation: number;

  private gustCycles: number[];
  private gustPhases: number[];
  private gustZones: { start: number; end: number }[];

  private burstZone: { lat: number; lon: number; radius: number };
  private burstCycleDuration: number;
  private burstDuration: number;
  private burstStartOffset: number;

  constructor(planetRadius: number, params: TundraSnowflakesParams = {}) {
    this.snowflakeGroup = new THREE.Group();
    this.planetRadius = planetRadius;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    this.rng = new SeededRandom(seed);

    this.particleCount = params.particleCount || 10;
    const windSpeed = params.windSpeed || 3.0;
    const baseSize = (params.size || 1.0) * (planetRadius * 0.2);
    const opacity = params.opacity || 1.0;

    this.globalWindDirection = this.rng.uniform(0, Math.PI * 2);

    this.startTime = this.rng.uniform(0, 1000);
    this.timeSpeed = this.rng.uniform(2.0, 4.0);

    this.rotationSpeed = this.rng.uniform(0.2, 0.8);
    this.particleOpacity = this.rng.uniform(0.05, 0.25);
    this.windSpeedMultiplier = this.rng.uniform(1.1, 2.5);
    this.verticalOscillation = this.rng.uniform(0.1, 0.4);

    this.gustCycles = [];
    this.gustPhases = [];
    this.gustZones = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.gustCycles.push(this.rng.uniform(15, 30));
      this.gustPhases.push(this.rng.uniform(0, 1));

      const zoneStart = this.rng.uniform(0, Math.PI * 2);
      const zoneWidth = this.rng.uniform(Math.PI * 0.3, Math.PI * 0.6);
      this.gustZones.push({
        start: zoneStart,
        end: (zoneStart + zoneWidth) % (Math.PI * 2),
      });
    }

    this.burstZone = {
      lat: this.rng.uniform(-Math.PI / 3, Math.PI / 3),
      lon: this.rng.uniform(0, Math.PI * 2),
      radius: this.rng.uniform(1.2, 2.0),
    };

    this.burstCycleDuration = this.rng.uniform(45, 75);
    this.burstDuration = this.rng.uniform(8, 15);
    this.burstStartOffset = this.rng.uniform(0, this.burstCycleDuration);

    const colors = params.colors || [new THREE.Color(1.0, 1.0, 1.0), new THREE.Color(0.9, 0.9, 0.9), new THREE.Color(0.7, 0.7, 0.7), new THREE.Color(0.5, 0.5, 0.5), new THREE.Color(0.3, 0.3, 0.3)];

    this.createSnowflakeSystem(this.particleCount, baseSize, opacity, colors);
  }

  private createSnowflakeSystem(particleCount: number, baseSize: number, opacity: number, colors: THREE.Color[]): void {
    const vertices: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      let phi: number, theta: number, distanceFromCenter: number;
      let attempts = 0;

      do {
        const latOffset = (this.rng.uniform(-1, 1) + this.rng.uniform(-1, 1)) * 0.2;
        const lonOffset = this.rng.uniform(-1, 1) * this.burstZone.radius;

        phi = Math.max(0, Math.min(Math.PI, this.burstZone.lat + Math.PI / 2 + latOffset));
        theta = (this.burstZone.lon + lonOffset) % (Math.PI * 2);

        const latDistance = Math.abs(phi - (this.burstZone.lat + Math.PI / 2));
        const lonDistance = Math.min(Math.abs(theta - this.burstZone.lon), Math.PI * 2 - Math.abs(theta - this.burstZone.lon));

        distanceFromCenter = Math.max(latDistance / 0.3, lonDistance / this.burstZone.radius);

        attempts++;
      } while (distanceFromCenter > 1.0 && attempts < 10);

      if (distanceFromCenter > 1.0) {
        phi = this.burstZone.lat + Math.PI / 2 + this.rng.uniform(-0.1, 0.1);
        theta = this.burstZone.lon + this.rng.uniform(-this.burstZone.radius, this.burstZone.radius);
      }

      const surfaceHeight = this.planetRadius * this.rng.uniform(1.001, 1.005);

      const x = surfaceHeight * Math.sin(phi) * Math.cos(theta);
      const y = surfaceHeight * Math.cos(phi);
      const z = surfaceHeight * Math.sin(phi) * Math.sin(theta);

      vertices.push(x, y, z);
    }

    const trailColors: number[] = [];
    const baseColor = new THREE.Color();

    for (let i = 0; i < this.trailLength; i++) {
      const intensity = Math.pow(1 - i / (this.trailLength - 1), 1.5);
      baseColor.setRGB(intensity, intensity, intensity);
      trailColors.push(baseColor.r, baseColor.g, baseColor.b);
    }

    for (let particleIndex = 0; particleIndex < particleCount; particleIndex++) {
      const baseIndex = particleIndex * 3;
      const startX = vertices[baseIndex];
      const startY = vertices[baseIndex + 1];
      const startZ = vertices[baseIndex + 2];

      const positions = new Float32Array(this.trailLength * 3);
      const points: THREE.Vector3[] = [];

      for (let i = 0; i < this.trailLength; i++) {
        const offsetScale = i * 0.1;
        const x = startX + this.rng.uniform(-1, 1) * offsetScale * this.planetRadius * 0.01;
        const y = startY + this.rng.uniform(-1, 1) * offsetScale * this.planetRadius * 0.01;
        const z = startZ + this.rng.uniform(-1, 1) * offsetScale * this.planetRadius * 0.01;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points, false);

      const tubeRadius = this.planetRadius * 0.003;
      const radialSegments = 3;
      const tubularSegments = Math.max(8, this.trailLength - 1);

      const geometry = new THREE.TubeGeometry(curve, tubularSegments, tubeRadius, radialSegments, false);

      const colors = new Float32Array(geometry.attributes.position.count * 3);
      const uvArray = geometry.attributes.uv.array as Float32Array;

      for (let i = 0; i < colors.length / 3; i++) {
        const uvX = uvArray[i * 2];
        const intensity = Math.pow(1 - uvX, 1.5);
        colors[i * 3] = intensity;
        colors[i * 3 + 1] = intensity;
        colors[i * 3 + 2] = intensity;
      }

      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: this.particleOpacity,
        blending: THREE.NormalBlending,
        depthTest: true,
      });

      const mesh = new THREE.Mesh(geometry, material);

      this.materials.push(material);
      this.particleSystems.push(mesh);
      this.trailPositions.push(positions);
      this.trailColors.push(new Float32Array(trailColors));

      (mesh as any).rnd = this.rng.uniform(0, 1);
      (mesh as any).particleIndex = particleIndex;
      (mesh as any).tubeRadius = tubeRadius;
      (mesh as any).tubularSegments = tubularSegments;
      (mesh as any).radialSegments = radialSegments;

      this.snowflakeGroup.add(mesh);
    }
  }

  update(_deltaTime: number = 0.016): void {
    const cosmicOriginTime = DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.timeSpeed, this.startTime);

    const realTime = getUniverseTime(DEFAULT_COSMIC_ORIGIN_TIME);
    const burstTime = (realTime + this.burstStartOffset) % this.burstCycleDuration;
    let burstIntensity = 0;

    if (burstTime < this.burstDuration) {
      const burstProgress = burstTime / this.burstDuration;
      if (burstProgress < 0.2) {
        burstIntensity = burstProgress / 0.2;
      } else if (burstProgress > 0.8) {
        burstIntensity = (1 - burstProgress) / 0.2;
      } else {
        burstIntensity = 1;
      }
    }

    this.snowflakeGroup.visible = true;

    this.particleSystems.forEach((mesh, index) => {
      const rnd = (mesh as any).rnd;
      const particleIndex = (mesh as any).particleIndex;
      const tubeRadius = (mesh as any).tubeRadius;
      const tubularSegments = (mesh as any).tubularSegments;
      const radialSegments = (mesh as any).radialSegments;

      const newPos = this.calculateTrailPath(currentTime, particleIndex, rnd);
      const trailPositions = this.trailPositions[index];

      for (let i = this.trailLength - 1; i > 0; i--) {
        const currentIndex = i * 3;
        const previousIndex = (i - 1) * 3;

        trailPositions[currentIndex] = trailPositions[previousIndex];
        trailPositions[currentIndex + 1] = trailPositions[previousIndex + 1];
        trailPositions[currentIndex + 2] = trailPositions[previousIndex + 2];
      }

      trailPositions[0] = newPos.x;
      trailPositions[1] = newPos.y;
      trailPositions[2] = newPos.z;

      const points: THREE.Vector3[] = [];
      for (let i = 0; i < this.trailLength; i++) {
        points.push(new THREE.Vector3(trailPositions[i * 3], trailPositions[i * 3 + 1], trailPositions[i * 3 + 2]));
      }

      const newCurve = new THREE.CatmullRomCurve3(points, false);
      mesh.geometry.dispose();
      mesh.geometry = new THREE.TubeGeometry(newCurve, tubularSegments, tubeRadius, radialSegments, false);

      const colors = new Float32Array(mesh.geometry.attributes.position.count * 3);
      const uvArray = mesh.geometry.attributes.uv.array as Float32Array;

      for (let i = 0; i < colors.length / 3; i++) {
        const uvX = uvArray[i * 2];
        const intensity = Math.pow(1 - uvX, 1.5);
        colors[i * 3] = intensity;
        colors[i * 3 + 1] = intensity;
        colors[i * 3 + 2] = intensity;
      }

      mesh.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const gustTime = getUniverseTime(DEFAULT_COSMIC_ORIGIN_TIME);
      const gustCycle = this.gustCycles[index];
      const gustPhase = this.gustPhases[index];
      const gustProgress = (gustTime / gustCycle + gustPhase) % 1;

      let gustIntensity = 0;
      if (gustProgress < 0.3) {
        gustIntensity = gustProgress / 0.3;
      } else if (gustProgress < 0.7) {
        gustIntensity = 1;
      } else {
        gustIntensity = (1 - gustProgress) / 0.3;
      }

      const headPos = new THREE.Vector3(trailPositions[0], trailPositions[1], trailPositions[2]);
      const theta = Math.atan2(headPos.z, headPos.x);
      const normalizedTheta = theta < 0 ? theta + Math.PI * 2 : theta;
      const zone = this.gustZones[index];

      let inZone = false;
      if (zone.start < zone.end) {
        inZone = normalizedTheta >= zone.start && normalizedTheta <= zone.end;
      } else {
        inZone = normalizedTheta >= zone.start || normalizedTheta <= zone.end;
      }

      this.materials[index].opacity = inZone ? this.particleOpacity * gustIntensity : 0;
    });
  }

  private calculateTrailPath(t: number, particleIndex: number, rnd: number): { x: number; y: number; z: number } {
    t += 10 * rnd + particleIndex * 0.1;

    const initialTheta = this.burstZone.lon + (rnd - 0.5) * this.burstZone.radius;
    const initialPhi = this.burstZone.lat + Math.PI / 2 + (rnd - 0.5) * 0.2;

    const windSpeed = this.windSpeedMultiplier;
    const surfaceMovement = t * windSpeed;

    const newTheta = initialTheta + Math.cos(this.globalWindDirection) * surfaceMovement;
    const newPhi = initialPhi + this.verticalOscillation * Math.sin(t * 0.5 + rnd);

    const heightOscillation = 0.015 * Math.sin(t * 2 + rnd * 10);

    const surfaceDistance = this.planetRadius * (1.005 + heightOscillation);

    const x = surfaceDistance * Math.sin(newPhi) * Math.cos(newTheta);
    const y = surfaceDistance * Math.cos(newPhi);
    const z = surfaceDistance * Math.sin(newPhi) * Math.sin(newTheta);

    return { x, y, z };
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.snowflakeGroup.position.copy(planetPosition);
    }
    scene.add(this.snowflakeGroup);
  }

  getObject3D(): THREE.Group {
    return this.snowflakeGroup;
  }

  dispose(): void {
    this.materials.forEach((material) => material.dispose());
    this.particleSystems.forEach((mesh) => mesh.geometry.dispose());
    this.materials = [];
    this.particleSystems = [];
    this.trailPositions = [];
    this.trailColors = [];
    this.snowflakeGroup.clear();
  }
}

export function createTundraSnowflakesFromPythonData(planetRadius: number, surfaceData: any, globalSeed?: number): TundraSnowflakesEffect | null {
  if (surfaceData.type !== "tundra") {
    return null;
  }

  const seed = globalSeed || Math.floor(Math.random() * 1000000);
  const snowIntensity = surfaceData.snow_intensity || 0.7;
  const windStrength = surfaceData.wind_strength || 1.0;

  const particleCount = Math.floor(snowIntensity * 200 + 50);
  const windSpeed = windStrength * 5.0;

  return new TundraSnowflakesEffect(planetRadius, {
    particleCount,
    windSpeed,
    size: 1.2,
    opacity: 0.9,
    seed: seed + 15000,
  });
}

export function createCarbonDustParticlesFromPythonData(planetRadius: number, surfaceData: any, globalSeed?: number): TundraSnowflakesEffect | null {
  const seed = globalSeed || Math.floor(Math.random() * 1000000);

  const carbonDustColors = [new THREE.Color(0.8, 0.7, 0.6), new THREE.Color(0.9, 0.8, 0.7), new THREE.Color(0.6, 0.5, 0.4), new THREE.Color(1.0, 0.9, 0.8), new THREE.Color(0.7, 0.6, 0.5)];

  const particleCount = 15;
  const windSpeed = 2.5;

  return new TundraSnowflakesEffect(planetRadius, {
    particleCount,
    windSpeed,
    size: 1.5,
    opacity: 1.0,
    colors: carbonDustColors,
    seed: seed + 15000,
  });
}

export function createDesertSandstormsFromPythonData(planetRadius: number, surfaceData: any, globalSeed?: number): TundraSnowflakesEffect | null {
  const seed = globalSeed || Math.floor(Math.random() * 1000000);

  const sandColors = [new THREE.Color(0.9, 0.8, 0.6), new THREE.Color(0.8, 0.7, 0.5), new THREE.Color(0.7, 0.6, 0.4), new THREE.Color(1.0, 0.9, 0.7), new THREE.Color(0.6, 0.5, 0.3)];

  const particleCount = 12;
  const windSpeed = 3.5;

  return new TundraSnowflakesEffect(planetRadius, {
    particleCount,
    windSpeed,
    size: 1.3,
    opacity: 0.8,
    colors: sandColors,
    seed: seed + 15000,
  });
}

export function createToxicParticlesFromPythonData(planetRadius: number, surfaceData: any, globalSeed?: number): TundraSnowflakesEffect | null {
  const seed = globalSeed || Math.floor(Math.random() * 1000000);

  const toxicColors = [new THREE.Color(0.5, 0.0, 0.8), new THREE.Color(0.7, 0.2, 0.7), new THREE.Color(0.4, 0.0, 0.6), new THREE.Color(0.8, 0.0, 0.8), new THREE.Color(0.3, 0.6, 0.3)];

  const particleCount = 18;
  const windSpeed = 2.8;

  return new TundraSnowflakesEffect(planetRadius, {
    particleCount,
    windSpeed,
    size: 1.1,
    opacity: 0.7,
    colors: toxicColors,
    seed: seed + 15000,
  });
}
