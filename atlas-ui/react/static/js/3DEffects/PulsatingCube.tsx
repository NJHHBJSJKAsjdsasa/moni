// atlas-ui/react/static/js/3DEffects/PulsatingCube.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry";
import { getAnimatedUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

export interface PulsatingCubeParams {
  color?: THREE.Color | number;
  opacity?: number;
  size?: number;
  seed?: number;
  pulseInterval?: [number, number];
  fadeInDuration?: number;
  fadeOutDuration?: number;
  visibleDuration?: number;
  cornerRadius?: number;
  emissiveIntensity?: number;
  startTime?: number;
  timeSpeed?: number;

  orbitalData?: {
    enabled: boolean;
    cycle_duration_years: number;
    visible_duration_years: number;
  };
  currentTime?: number;
  cosmicOriginTime?: number;
}

const PROCEDURAL_RANGES = {
  OPACITY: { min: 0.5, max: 0.95 },
  SIZE: { min: 1.0, max: 1.0 },
  PULSE_INTERVAL: { min: 3, max: 6 },
  FADE_IN_DURATION: { min: 1.5, max: 3.0 },
  FADE_OUT_DURATION: { min: 2.0, max: 4.0 },
  VISIBLE_DURATION: { min: 3.0, max: 6.0 },
  CORNER_RADIUS: { min: 0.3, max: 1.5 },
  EMISSIVE_INTENSITY: { min: 0.08, max: 0.15 },
  TIME_SPEED: { min: 0.1, max: 3.0 },
};

export class PulsatingCubeEffect {
  private cubeGroup: THREE.Group;
  private cube: THREE.Mesh;
  private material: THREE.MeshPhysicalMaterial;
  private geometry: THREE.BufferGeometry;
  private params: PulsatingCubeParams;
  private planetRadius: number;
  private startTime: number;
  private nextPulseTime: number;
  private currentState: "hidden" | "fading_in" | "visible" | "fading_out";
  private stateStartTime: number;
  private rng: SeededRandom;
  private orbitalVisibilityFactor: number;

  private particleSystem: THREE.Points;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.PointsMaterial;
  private particleCount: number = 800;
  private particlePositions: Float32Array;
  private particleVelocities: Float32Array;
  private particleTargets: Float32Array;
  private particleOrigins: Float32Array;
  private particleProgress: Float32Array;
  private particleSurfacePoints: Float32Array;
  private planetPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(planetRadius: number, params: PulsatingCubeParams = {}) {
    this.planetRadius = planetRadius;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    this.rng = new SeededRandom(seed);

    this.startTime = params.startTime || (seed % 10000) / 1000;

    this.params = {
      color: params.color || new THREE.Color(0xff6b35),
      opacity: params.opacity || this.rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max),
      size: params.size || this.rng.uniform(PROCEDURAL_RANGES.SIZE.min, PROCEDURAL_RANGES.SIZE.max),
      seed: seed,
      pulseInterval: params.pulseInterval || [this.rng.uniform(PROCEDURAL_RANGES.PULSE_INTERVAL.min, PROCEDURAL_RANGES.PULSE_INTERVAL.max), this.rng.uniform(PROCEDURAL_RANGES.PULSE_INTERVAL.min, PROCEDURAL_RANGES.PULSE_INTERVAL.max)],
      fadeInDuration: params.fadeInDuration || this.rng.uniform(PROCEDURAL_RANGES.FADE_IN_DURATION.min, PROCEDURAL_RANGES.FADE_IN_DURATION.max),
      fadeOutDuration: params.fadeOutDuration || this.rng.uniform(PROCEDURAL_RANGES.FADE_OUT_DURATION.min, PROCEDURAL_RANGES.FADE_OUT_DURATION.max),
      visibleDuration: params.visibleDuration || this.rng.uniform(PROCEDURAL_RANGES.VISIBLE_DURATION.min, PROCEDURAL_RANGES.VISIBLE_DURATION.max),
      cornerRadius: params.cornerRadius || this.rng.uniform(PROCEDURAL_RANGES.CORNER_RADIUS.min, PROCEDURAL_RANGES.CORNER_RADIUS.max),
      emissiveIntensity: params.emissiveIntensity || this.rng.uniform(PROCEDURAL_RANGES.EMISSIVE_INTENSITY.min, PROCEDURAL_RANGES.EMISSIVE_INTENSITY.max),
      startTime: this.startTime,
      timeSpeed: params.timeSpeed || this.rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),

      orbitalData: params.orbitalData,
      currentTime: params.currentTime || 0,
    };

    this.initializeStateFromAbsoluteTime();

    this.orbitalVisibilityFactor = this.calculateOrbitalVisibility();

    this.cubeGroup = new THREE.Group();

    this.initParticleSystem();

    const cubeSize = planetRadius * 2.35;

    const cornerRadiusAbsolute = cubeSize * this.params.cornerRadius! * 0.2;
    this.geometry = new RoundedBoxGeometry(cubeSize, cubeSize, cubeSize, 8, cornerRadiusAbsolute);

    this.geometry.computeVertexNormals();
    this.geometry.normalizeNormals();

    const color = this.params.color instanceof THREE.Color ? this.params.color : new THREE.Color(this.params.color as any);
    this.material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0.99, 0.99, 0.99),
      transparent: true,
      opacity: 0,

      metalness: 0.0,
      roughness: 0.0,
      transmission: 0.99,
      ior: 1.33,
      thickness: 1.5,

      clearcoat: 0.5,
      clearcoatRoughness: 0.0,

      emissive: new THREE.Color(0.02, 0.02, 0.02),
      emissiveIntensity: 1.0,

      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,

      alphaTest: 0,

      flatShading: false,
      vertexColors: false,
      fog: false,
    });

    this.cube = new THREE.Mesh(this.geometry, this.material);

    this.cube.renderOrder = 999;
    this.cubeGroup.add(this.cube);

    this.cubeGroup.visible = true;
  }

  private initializeStateFromAbsoluteTime(): void {
    const cosmicOriginTime = this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.params.timeSpeed!, this.startTime);

    const avgPulseInterval = (this.params.pulseInterval![0] + this.params.pulseInterval![1]) / 2;
    const totalCycleDuration = this.params.fadeInDuration! + this.params.visibleDuration! + this.params.fadeOutDuration! + avgPulseInterval;

    const cycleTime = currentTime % totalCycleDuration;

    const fadeInEnd = this.params.fadeInDuration!;
    const visibleEnd = fadeInEnd + this.params.visibleDuration!;
    const fadeOutEnd = visibleEnd + this.params.fadeOutDuration!;

    if (cycleTime < fadeInEnd) {
      this.currentState = "fading_in";
      this.stateStartTime = currentTime - cycleTime;
      this.nextPulseTime = currentTime - cycleTime;
    } else if (cycleTime < visibleEnd) {
      this.currentState = "visible";
      this.stateStartTime = currentTime - (cycleTime - fadeInEnd);
      this.nextPulseTime = currentTime - cycleTime;
    } else if (cycleTime < fadeOutEnd) {
      this.currentState = "fading_out";
      this.stateStartTime = currentTime - (cycleTime - visibleEnd);
      this.nextPulseTime = currentTime - cycleTime;
    } else {
      this.currentState = "hidden";
      this.stateStartTime = currentTime - (cycleTime - fadeOutEnd);
      this.nextPulseTime = currentTime + (totalCycleDuration - cycleTime);
    }
  }

  /**
   * Calcular factor de visibilidad basado en datos orbitales (como PolarHexagon)
   */
  private calculateOrbitalVisibility(): number {
    if (!this.params.orbitalData || !this.params.orbitalData.enabled) {
      return 1.0;
    }

    const currentTime = this.params.currentTime || 0;
    const cycleProgress = (currentTime % this.params.orbitalData.cycle_duration_years) / this.params.orbitalData.cycle_duration_years;
    const visibleFraction = this.params.orbitalData.visible_duration_years / this.params.orbitalData.cycle_duration_years;

    if (cycleProgress < visibleFraction) {
      const localProgress = cycleProgress / visibleFraction;
      if (localProgress < 0.1) {
        return localProgress / 0.1;
      } else if (localProgress > 0.9) {
        return (1 - localProgress) / 0.1;
      } else {
        return 1.0;
      }
    } else {
      return 0.0;
    }
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.cubeGroup.position.copy(planetPosition);
      this.planetPosition.copy(planetPosition);
    }
    scene.add(this.cubeGroup);
  }

  update(_deltaTime: number): void {
    const cosmicOriginTime = this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.params.timeSpeed!, this.startTime);
    const timeSinceStart = currentTime - this.stateStartTime;

    this.orbitalVisibilityFactor = this.calculateOrbitalVisibility();

    if (this.orbitalVisibilityFactor <= 0.001) {
      this.currentState = "hidden";
      this.material.opacity = 0;
      this.cubeGroup.visible = false;
      return;
    }

    this.cube.rotation.x = currentTime * 0.1;
    this.cube.rotation.y = currentTime * 0.15;
    this.cube.rotation.z = currentTime * 0.05;

    this.updateParticles(currentTime);

    switch (this.currentState) {
      case "hidden":
        this.material.opacity = 0;
        if (currentTime >= this.nextPulseTime) {
          this.currentState = "fading_in";
          this.stateStartTime = currentTime;
        }
        break;

      case "fading_in":
        const fadeInProgress = Math.min(timeSinceStart / this.params.fadeInDuration!, 1.0);

        const delayedProgress = Math.max(0, (fadeInProgress - 0.3) / 0.7);
        const fadeInOpacity = this.smoothstep(0, 1, delayedProgress) * this.params.opacity! * this.orbitalVisibilityFactor;
        this.material.opacity = fadeInOpacity;

        if (fadeInProgress >= 1.0) {
          this.currentState = "visible";
          this.stateStartTime = currentTime;
        }
        break;

      case "visible":
        this.material.opacity = this.params.opacity! * this.orbitalVisibilityFactor;

        if (timeSinceStart >= this.params.visibleDuration!) {
          this.currentState = "fading_out";
          this.stateStartTime = currentTime;
        }
        break;

      case "fading_out":
        const fadeOutProgress = Math.min(timeSinceStart / this.params.fadeOutDuration!, 1.0);

        const acceleratedProgress = Math.min(1, fadeOutProgress * 1.3);
        const fadeOutOpacity = (1.0 - this.smoothstep(0, 1, acceleratedProgress)) * this.params.opacity! * this.orbitalVisibilityFactor;
        this.material.opacity = fadeOutOpacity;

        if (fadeOutProgress >= 1.0) {
          this.currentState = "hidden";
          this.stateStartTime = currentTime;

          const nextInterval = this.rng.uniform(this.params.pulseInterval![0], this.params.pulseInterval![1]);
          this.nextPulseTime = currentTime + nextInterval;
        }
        break;
    }

    this.cubeGroup.visible = this.material.opacity > 0.001;
  }

  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  updateParams(newParams: Partial<PulsatingCubeParams>): void {
    this.params = { ...this.params, ...newParams };

    if (newParams.color !== undefined) {
      const color = newParams.color instanceof THREE.Color ? newParams.color : new THREE.Color(newParams.color as any);
      this.material.color = color;
    }
    if (newParams.opacity !== undefined) {
      this.material.opacity = newParams.opacity;
    }
  }

  getObject3D(): THREE.Group {
    return this.cubeGroup;
  }

  private initParticleSystem(): void {
    this.particlePositions = new Float32Array(this.particleCount * 3);
    this.particleVelocities = new Float32Array(this.particleCount * 3);
    this.particleTargets = new Float32Array(this.particleCount * 3);
    this.particleOrigins = new Float32Array(this.particleCount * 3);
    this.particleProgress = new Float32Array(this.particleCount);
    this.particleSurfacePoints = new Float32Array(this.particleCount * 3);

    const cubeSize = this.planetRadius * 2.35;
    const halfSize = cubeSize / 2;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      this.particleOrigins[i3] = 0;
      this.particleOrigins[i3 + 1] = 0;
      this.particleOrigins[i3 + 2] = 0;

      this.particlePositions[i3] = 0;
      this.particlePositions[i3 + 1] = 0;
      this.particlePositions[i3 + 2] = 0;

      const theta = this.rng.uniform(0, Math.PI * 2);
      const phi = Math.acos(this.rng.uniform(-1, 1));

      this.particleSurfacePoints[i3] = this.planetRadius * Math.sin(phi) * Math.cos(theta);
      this.particleSurfacePoints[i3 + 1] = this.planetRadius * Math.sin(phi) * Math.sin(theta);
      this.particleSurfacePoints[i3 + 2] = this.planetRadius * Math.cos(phi);

      const targetType = this.rng.uniform(0, 1);
      let tx: number, ty: number, tz: number;

      if (targetType < 0.7) {
        const face = Math.floor(this.rng.uniform(0, 6));
        const u = this.rng.uniform(-0.9, 0.9);
        const v = this.rng.uniform(-0.9, 0.9);

        switch (face) {
          case 0:
            tx = halfSize;
            ty = u * halfSize;
            tz = v * halfSize;
            break;
          case 1:
            tx = -halfSize;
            ty = u * halfSize;
            tz = v * halfSize;
            break;
          case 2:
            tx = u * halfSize;
            ty = halfSize;
            tz = v * halfSize;
            break;
          case 3:
            tx = u * halfSize;
            ty = -halfSize;
            tz = v * halfSize;
            break;
          case 4:
            tx = u * halfSize;
            ty = v * halfSize;
            tz = halfSize;
            break;
          case 5:
            tx = u * halfSize;
            ty = v * halfSize;
            tz = -halfSize;
            break;
          default:
            tx = 0;
            ty = 0;
            tz = 0;
        }
      } else {
        const edge = Math.floor(this.rng.uniform(0, 12));
        const t = this.rng.uniform(-0.95, 0.95);

        switch (edge) {
          case 0:
            tx = t * halfSize;
            ty = halfSize;
            tz = halfSize;
            break;
          case 1:
            tx = t * halfSize;
            ty = -halfSize;
            tz = halfSize;
            break;
          case 2:
            tx = t * halfSize;
            ty = halfSize;
            tz = -halfSize;
            break;
          case 3:
            tx = t * halfSize;
            ty = -halfSize;
            tz = -halfSize;
            break;

          case 4:
            tx = halfSize;
            ty = t * halfSize;
            tz = halfSize;
            break;
          case 5:
            tx = -halfSize;
            ty = t * halfSize;
            tz = halfSize;
            break;
          case 6:
            tx = halfSize;
            ty = t * halfSize;
            tz = -halfSize;
            break;
          case 7:
            tx = -halfSize;
            ty = t * halfSize;
            tz = -halfSize;
            break;

          case 8:
            tx = halfSize;
            ty = halfSize;
            tz = t * halfSize;
            break;
          case 9:
            tx = -halfSize;
            ty = halfSize;
            tz = t * halfSize;
            break;
          case 10:
            tx = halfSize;
            ty = -halfSize;
            tz = t * halfSize;
            break;
          case 11:
            tx = -halfSize;
            ty = -halfSize;
            tz = t * halfSize;
            break;
          default:
            tx = 0;
            ty = 0;
            tz = 0;
        }
      }

      this.particleTargets[i3] = tx;
      this.particleTargets[i3 + 1] = ty;
      this.particleTargets[i3 + 2] = tz;

      this.particleVelocities[i3] = this.rng.uniform(-0.3, 0.3);
      this.particleVelocities[i3 + 1] = this.rng.uniform(-0.3, 0.3);
      this.particleVelocities[i3 + 2] = this.rng.uniform(-0.3, 0.3);

      this.particleProgress[i] = 0;
    }

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute("position", new THREE.BufferAttribute(this.particlePositions, 3));

    this.particleMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(1, 1, 1),
      size: this.planetRadius * 0.008,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      vertexColors: false,
    });

    (this.particleMaterial as any).isPulsatingCubeParticle = true;

    this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.particleSystem.renderOrder = 998;
    this.cubeGroup.add(this.particleSystem);
  }

  private updateParticles(currentTime: number): void {
    const positions = this.particleGeometry.attributes.position.array as Float32Array;
    let particleOpacity = 0;
    let particleProgress = 0;

    switch (this.currentState) {
      case "hidden":
        particleOpacity = 0;
        particleProgress = -0.1;
        break;

      case "fading_in":
        const fadeInTime = currentTime - this.stateStartTime;
        particleProgress = Math.min(fadeInTime / this.params.fadeInDuration!, 1.0);

        particleOpacity = this.smoothstep(0, 1, particleProgress);
        break;

      case "visible":
        particleOpacity = 1.0;
        particleProgress = 1;
        break;

      case "fading_out":
        const fadeOutTime = currentTime - this.stateStartTime;
        const fadeOutProg = Math.min(fadeOutTime / this.params.fadeOutDuration!, 1.0);
        particleProgress = 1.0 - fadeOutProg;

        particleOpacity = this.smoothstep(0, 1, particleProgress);
        break;
    }

    const time = currentTime;

    const cubeMatrix = this.cube.matrixWorld;
    const rotationMatrix = new THREE.Matrix4().extractRotation(cubeMatrix);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const particleDelay = (i / this.particleCount) * 0.4;
      const delayedProgress = Math.max(-0.1, Math.min(1, particleProgress * 1.3 - particleDelay));

      const clampedProgress = Math.max(0, delayedProgress);

      let finalX: number, finalY: number, finalZ: number;

      if (clampedProgress < 0.3) {
        const surfaceProgress = clampedProgress / 0.3;
        const easedSurfaceProgress = this.smoothstep(0, 1, surfaceProgress);

        const surfaceX = this.particleSurfacePoints[i3];
        const surfaceY = this.particleSurfacePoints[i3 + 1];
        const surfaceZ = this.particleSurfacePoints[i3 + 2];

        finalX = surfaceX * easedSurfaceProgress;
        finalY = surfaceY * easedSurfaceProgress;
        finalZ = surfaceZ * easedSurfaceProgress;
      } else {
        const cubeProgress = (clampedProgress - 0.3) / 0.7;
        const easedCubeProgress = this.smoothstep(0, 1, cubeProgress);

        const targetVector = new THREE.Vector3(this.particleTargets[i3], this.particleTargets[i3 + 1], this.particleTargets[i3 + 2]);
        targetVector.applyMatrix4(rotationMatrix);

        const surfaceX = this.particleSurfacePoints[i3];
        const surfaceY = this.particleSurfacePoints[i3 + 1];
        const surfaceZ = this.particleSurfacePoints[i3 + 2];

        finalX = surfaceX + (targetVector.x - surfaceX) * easedCubeProgress;
        finalY = surfaceY + (targetVector.y - surfaceY) * easedCubeProgress;
        finalZ = surfaceZ + (targetVector.z - surfaceZ) * easedCubeProgress;

        if (cubeProgress < 0.5) {
          const burst = Math.sin(cubeProgress * Math.PI * 2) * this.planetRadius * 0.1;
          finalX *= 1 + burst * 0.1;
          finalY *= 1 + burst * 0.1;
          finalZ *= 1 + burst * 0.1;
        }
      }

      const waveOffset = Math.sin(time * 2 + i * 0.1) * 0.01 * this.planetRadius;

      positions[i3] = finalX + this.particleVelocities[i3] * waveOffset;
      positions[i3 + 1] = finalY + this.particleVelocities[i3 + 1] * waveOffset;
      positions[i3 + 2] = finalZ + this.particleVelocities[i3 + 2] * waveOffset;
    }

    this.particleMaterial.opacity = particleOpacity * this.orbitalVisibilityFactor;

    this.particleMaterial.size = this.planetRadius * 0.012 * (0.5 + particleOpacity) * this.orbitalVisibilityFactor;

    this.particleGeometry.attributes.position.needsUpdate = true;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
  }
}

export function createPulsatingCubeFromPythonData(planetRadius: number, _anomalyData: any, globalSeed?: number, planetColor?: THREE.Color, pythonData?: any): PulsatingCubeEffect | null {
  const cubeData = pythonData?.surface_elements?.pulsating_cube;

  if (!cubeData?.enabled) {
    return null;
  }

  const seed = globalSeed || Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed + 4000);

  const timeSpeed = rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max);

  const startTime = (seed % 10000) / 1000;

  const currentTimeYears = pythonData?.timing?.elapsed_time ? pythonData.timing.elapsed_time / (365.25 * 24 * 3600) : 0;

  const params: PulsatingCubeParams = {
    color: planetColor || new THREE.Color(0xff6b35),
    opacity: rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max),
    size: rng.uniform(PROCEDURAL_RANGES.SIZE.min, PROCEDURAL_RANGES.SIZE.max),
    seed,
    pulseInterval: [rng.uniform(PROCEDURAL_RANGES.PULSE_INTERVAL.min, PROCEDURAL_RANGES.PULSE_INTERVAL.max), rng.uniform(PROCEDURAL_RANGES.PULSE_INTERVAL.min, PROCEDURAL_RANGES.PULSE_INTERVAL.max)],
    fadeInDuration: rng.uniform(PROCEDURAL_RANGES.FADE_IN_DURATION.min, PROCEDURAL_RANGES.FADE_IN_DURATION.max),
    fadeOutDuration: rng.uniform(PROCEDURAL_RANGES.FADE_OUT_DURATION.min, PROCEDURAL_RANGES.FADE_OUT_DURATION.max),
    visibleDuration: rng.uniform(PROCEDURAL_RANGES.VISIBLE_DURATION.min, PROCEDURAL_RANGES.VISIBLE_DURATION.max),
    cornerRadius: rng.uniform(PROCEDURAL_RANGES.CORNER_RADIUS.min, PROCEDURAL_RANGES.CORNER_RADIUS.max),
    emissiveIntensity: rng.uniform(PROCEDURAL_RANGES.EMISSIVE_INTENSITY.min, PROCEDURAL_RANGES.EMISSIVE_INTENSITY.max),
    startTime: startTime,
    timeSpeed: timeSpeed,

    orbitalData: cubeData,
    currentTime: currentTimeYears,
  };

  return new PulsatingCubeEffect(planetRadius, params);
}
