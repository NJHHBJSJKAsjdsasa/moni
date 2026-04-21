// atlas-ui/react/static/js/3DEffects/CarbonTrails.tsx

import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getAnimatedUniverseTime, getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

export interface CarbonTrailsParams {
  trailCount?: number;
  emissionFrequency?: number;
  trailHeight?: number;
  trailSpread?: number;

  particlesPerTrail?: number;
  particleSize?: number;
  particleLifetime?: number;
  particleSpeed?: number;
  particleDrag?: number;

  baseColor?: THREE.Color | number[];
  atmosphereColor?: THREE.Color | number[];
  opacity?: number;

  atmosphereHeight?: number;
  fadeDistance?: number;

  turbulenceStrength?: number;
  windStrength?: number;

  seed?: number;
  startTime?: number;
  timeSpeed?: number;
  cosmicOriginTime?: number;

  orbitalData?: {
    enabled: boolean;
    cycle_duration_years: number;
    visible_duration_years: number;
  };
  currentTime?: number;
  planetTemperature?: number;
}

const PROCEDURAL_RANGES = {
  TRAIL_COUNT: { min: 8, max: 15 },
  EMISSION_FREQUENCY: { min: 0.3, max: 1.2 },
  TRAIL_HEIGHT: { min: 0.3, max: 0.8 },
  TRAIL_SPREAD: { min: 0.4, max: 1.4 },
  PARTICLES_PER_TRAIL: { min: 20, max: 40 },
  PARTICLE_SIZE: { min: 0.08, max: 0.22 },
  PARTICLE_LIFETIME: { min: 1.5, max: 5.0 },
  PARTICLE_SPEED: { min: 0.08, max: 0.35 },
  PARTICLE_DRAG: { min: 0.85, max: 0.98 },
  ATMOSPHERE_HEIGHT: { min: 4.0, max: 10.0 },
  OPACITY: { min: 0.15, max: 0.45 },
  TURBULENCE: { min: 0.3, max: 1.8 },
  WIND_STRENGTH: { min: 0.05, max: 0.25 },
};

class CarbonTrail {
  public position: THREE.Vector3;
  public direction: THREE.Vector3;
  public lastEmissionTime: number = 0;
  public isActive: boolean = false;
  private rng: SeededRandom;

  public particleDirections: THREE.Vector3[] = [];
  public particleSpeeds: number[] = [];
  public particleSizes: number[] = [];
  public particleLifetimes: number[] = [];
  public particleBirthTimes: number[] = [];
  public particleActive: boolean[] = [];

  constructor(position: THREE.Vector3, seed: number, particlesPerTrail: number, spreadAngle: number, particleSpeed: number, particleSize: number, particleLifetime: number, planetRadius: number) {
    this.position = position;
    this.direction = position.clone().normalize();
    this.rng = new SeededRandom(seed);

    for (let i = 0; i < particlesPerTrail; i++) {
      this.particleDirections.push(this.getRandomDirection(spreadAngle));

      this.particleSpeeds.push(particleSpeed * (0.6 + this.rng.random() * 0.8));

      this.particleSizes.push(particleSize * planetRadius * (0.7 + this.rng.random() * 0.6));

      this.particleLifetimes.push(particleLifetime * (0.8 + this.rng.random() * 0.4));

      this.particleBirthTimes.push(-1);
      this.particleActive.push(false);
    }
  }

  initializeStateFromAbsoluteTime(currentTime: number, frequency: number, trailIndex: number): void {
    const emissionInterval = 1.0 / frequency;

    const phaseOffset = (trailIndex * 0.618) % 1.0;

    this.lastEmissionTime = currentTime - phaseOffset * emissionInterval;

    const particlesToActivate = Math.min(10, this.particleLifetimes.length);
    for (let i = 0; i < particlesToActivate; i++) {
      const emissionTime = this.lastEmissionTime - i * emissionInterval;
      const age = currentTime - emissionTime;

      if (age >= 0 && age < this.particleLifetimes[i]) {
        this.particleActive[i] = true;
        this.particleBirthTimes[i] = emissionTime;
      }
    }

    this.isActive = true;
  }

  shouldEmit(currentTime: number, frequency: number): boolean {
    const timeSinceLastEmission = currentTime - this.lastEmissionTime;
    return timeSinceLastEmission >= 1.0 / frequency;
  }

  startEmission(currentTime: number): void {
    this.lastEmissionTime = currentTime;
    this.isActive = true;
  }

  getRandomDirection(spread: number): THREE.Vector3 {
    const theta = this.rng.uniform(0, Math.PI * 2);
    const phi = this.rng.uniform(0, spread * 0.7);

    const upwardBias = 0.3;
    const adjustedPhi = phi * (1 - upwardBias);

    const localDir = new THREE.Vector3(Math.sin(adjustedPhi) * Math.cos(theta), Math.sin(adjustedPhi) * Math.sin(theta), Math.cos(adjustedPhi) + upwardBias).normalize();

    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.direction);
    localDir.applyQuaternion(quaternion);

    return localDir;
  }
}

export class CarbonTrailsEffect {
  private trailGroup: THREE.Group;
  private trails: CarbonTrail[] = [];
  private particleSystem: THREE.Points;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.ShaderMaterial;
  private params: CarbonTrailsParams;
  private startTime: number;
  private planetRadius: number;
  private maxParticles: number = 1200;
  private orbitalVisibilityFactor: number;

  private static readonly vertexShader = `
    attribute float size;
    attribute float opacity;
    attribute float atmosphereFade;
    
    varying float vOpacity;
    varying float vAtmosphereFade;
    
    void main() {
      vOpacity = opacity;
      vAtmosphereFade = atmosphereFade;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  private static readonly fragmentShader = `
    uniform vec3 baseColor;
    uniform vec3 atmosphereColor;
    uniform float globalOpacity;
    
    varying float vOpacity;
    varying float vAtmosphereFade;
    
    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      
      float alpha = 1.0 - smoothstep(0.1, 0.5, dist);
      alpha *= vOpacity * globalOpacity;
      
      if (alpha < 0.02) discard;
      
      vec3 color = mix(baseColor, atmosphereColor, vAtmosphereFade);
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  constructor(planetRadius: number, params: CarbonTrailsParams = {}) {
    this.planetRadius = planetRadius;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    this.startTime = params.startTime || (seed % 10000) / 1000;

    const baseColor = params.baseColor instanceof THREE.Color ? params.baseColor : new THREE.Color(0.25, 0.25, 0.28);
    const atmosphereColor = params.atmosphereColor instanceof THREE.Color ? params.atmosphereColor : new THREE.Color(0.35, 0.35, 0.38);

    this.params = {
      trailCount: params.trailCount || Math.floor(rng.uniform(PROCEDURAL_RANGES.TRAIL_COUNT.min, PROCEDURAL_RANGES.TRAIL_COUNT.max)),
      emissionFrequency: params.emissionFrequency || rng.uniform(PROCEDURAL_RANGES.EMISSION_FREQUENCY.min, PROCEDURAL_RANGES.EMISSION_FREQUENCY.max),
      trailHeight: params.trailHeight || rng.uniform(PROCEDURAL_RANGES.TRAIL_HEIGHT.min, PROCEDURAL_RANGES.TRAIL_HEIGHT.max),
      trailSpread: params.trailSpread || rng.uniform(PROCEDURAL_RANGES.TRAIL_SPREAD.min, PROCEDURAL_RANGES.TRAIL_SPREAD.max),
      particlesPerTrail: params.particlesPerTrail || Math.floor(rng.uniform(PROCEDURAL_RANGES.PARTICLES_PER_TRAIL.min, PROCEDURAL_RANGES.PARTICLES_PER_TRAIL.max)),
      particleSize: params.particleSize || rng.uniform(PROCEDURAL_RANGES.PARTICLE_SIZE.min, PROCEDURAL_RANGES.PARTICLE_SIZE.max),
      particleLifetime: params.particleLifetime || rng.uniform(PROCEDURAL_RANGES.PARTICLE_LIFETIME.min, PROCEDURAL_RANGES.PARTICLE_LIFETIME.max),
      particleSpeed: params.particleSpeed || rng.uniform(PROCEDURAL_RANGES.PARTICLE_SPEED.min, PROCEDURAL_RANGES.PARTICLE_SPEED.max),
      particleDrag: params.particleDrag || rng.uniform(PROCEDURAL_RANGES.PARTICLE_DRAG.min, PROCEDURAL_RANGES.PARTICLE_DRAG.max),
      baseColor,
      atmosphereColor,
      opacity: params.opacity || rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max),
      atmosphereHeight: params.atmosphereHeight || rng.uniform(PROCEDURAL_RANGES.ATMOSPHERE_HEIGHT.min, PROCEDURAL_RANGES.ATMOSPHERE_HEIGHT.max),
      fadeDistance: params.fadeDistance || rng.uniform(0.3, 0.8),
      turbulenceStrength: params.turbulenceStrength || rng.uniform(PROCEDURAL_RANGES.TURBULENCE.min, PROCEDURAL_RANGES.TURBULENCE.max),
      windStrength: params.windStrength || rng.uniform(PROCEDURAL_RANGES.WIND_STRENGTH.min, PROCEDURAL_RANGES.WIND_STRENGTH.max),
      seed,
      startTime: this.startTime,
      timeSpeed: params.timeSpeed || rng.uniform(0.3, 1.5),
      orbitalData: params.orbitalData,
      currentTime: params.currentTime || 0,
      planetTemperature: params.planetTemperature || 0,
    };

    this.orbitalVisibilityFactor = this.calculateOrbitalVisibility();

    this.trailGroup = new THREE.Group();

    this.createTrailPoints(rng);

    this.initializeStateFromAbsoluteTime();

    this.createParticleSystem();

    this.initializeActiveTrails();

    const cosmicOriginTime = this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.params.timeSpeed!, this.startTime);
    this.updateParticleGeometry(currentTime);
  }

  private initializeStateFromAbsoluteTime(): void {
    const cosmicOriginTime = this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.params.timeSpeed!, this.startTime);

    for (let i = 0; i < this.trails.length; i++) {
      this.trails[i].initializeStateFromAbsoluteTime(currentTime, this.params.emissionFrequency!, i);
    }
  }

  private createTrailPoints(rng: SeededRandom): void {
    const count = this.params.trailCount!;
    for (let i = 0; i < count; i++) {
      const phi = rng.uniform(0, Math.PI * 2);
      const theta = Math.acos(rng.uniform(-1, 1));

      const position = new THREE.Vector3(Math.sin(theta) * Math.cos(phi) * this.planetRadius, Math.sin(theta) * Math.sin(phi) * this.planetRadius, Math.cos(theta) * this.planetRadius);

      const trail = new CarbonTrail(position, Math.floor(rng.random() * 1000000), this.params.particlesPerTrail!, this.params.trailSpread!, this.params.particleSpeed!, this.params.particleSize!, this.params.particleLifetime!, this.planetRadius);

      trail.isActive = true;
      trail.lastEmissionTime = -10;

      this.trails.push(trail);
    }
  }

  private createParticleSystem(): void {
    this.particleGeometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.maxParticles * 3);
    const sizes = new Float32Array(this.maxParticles);
    const opacities = new Float32Array(this.maxParticles);
    const atmosphereFades = new Float32Array(this.maxParticles);

    this.particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    this.particleGeometry.setAttribute("opacity", new THREE.BufferAttribute(opacities, 1));
    this.particleGeometry.setAttribute("atmosphereFade", new THREE.BufferAttribute(atmosphereFades, 1));

    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader: CarbonTrailsEffect.vertexShader,
      fragmentShader: CarbonTrailsEffect.fragmentShader,
      uniforms: {
        baseColor: { value: this.params.baseColor },
        atmosphereColor: { value: this.params.atmosphereColor },
        globalOpacity: { value: this.params.opacity },
      },
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      vertexColors: false,
    });

    this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.particleSystem.renderOrder = 10;
    this.trailGroup.add(this.particleSystem);
  }

  private initializeActiveTrails(): void {}

  private calculateOrbitalVisibility(): number {
    if (!this.params.orbitalData || !this.params.orbitalData.enabled) {
      return 1;
    }

    const cosmicOriginTime = this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTimeSeconds = getUniverseTime(cosmicOriginTime);
    const currentTime = currentTimeSeconds / (365.25 * 24 * 3600);

    const cycleProgress = (currentTime % this.params.orbitalData.cycle_duration_years) / this.params.orbitalData.cycle_duration_years;
    const visibleFraction = this.params.orbitalData.visible_duration_years / this.params.orbitalData.cycle_duration_years;

    const isInVisiblePeriod = cycleProgress <= visibleFraction;
    let visibility = 0;

    if (isInVisiblePeriod) {
      const visibleProgress = cycleProgress / visibleFraction;

      if (visibleProgress < 0.15) {
        visibility = visibleProgress / 0.15;
      } else if (visibleProgress > 0.85) {
        visibility = (1.0 - visibleProgress) / 0.15;
      } else {
        visibility = 1.0;
      }
    }

    return visibility;
  }

  private updateParticleGeometry(currentTime: number): void {
    const positions = this.particleGeometry.attributes.position as THREE.BufferAttribute;
    const sizes = this.particleGeometry.attributes.size as THREE.BufferAttribute;
    const opacities = this.particleGeometry.attributes.opacity as THREE.BufferAttribute;
    const atmosphereFades = this.particleGeometry.attributes.atmosphereFade as THREE.BufferAttribute;

    let particleIndex = 0;

    const maxDistance = this.planetRadius * this.params.atmosphereHeight!;

    for (let trailIndex = 0; trailIndex < this.trails.length; trailIndex++) {
      const trail = this.trails[trailIndex];

      for (let i = 0; i < this.params.particlesPerTrail! && particleIndex < this.maxParticles; i++) {
        const particleDelay = (i / this.params.particlesPerTrail!) * 0.8;
        const trailPhase = (trailIndex * 0.5) % 2.0;
        const particleAge = currentTime + trailPhase - particleDelay;

        const cycleTime = Math.abs(particleAge % trail.particleLifetimes[i]);

        if (cycleTime >= 0 && cycleTime < trail.particleLifetimes[i]) {
          const direction = trail.particleDirections[i].clone();
          let speed = trail.particleSpeeds[i];

          speed *= Math.pow(this.params.particleDrag!, cycleTime);
          const distance = speed * cycleTime;
          let position = trail.position.clone().add(direction.multiplyScalar(distance));

          const buoyancy = 0.1 * cycleTime;
          position.y += buoyancy;

          const expansionFactor = cycleTime * 0.08;
          const radialDir = new THREE.Vector3(direction.x, 0, direction.z).normalize();
          position.add(radialDir.multiplyScalar(expansionFactor));

          const turbulenceStrength = this.params.turbulenceStrength! * 0.08;
          const timePhase = currentTime * 2.0 + i * 0.3;
          position.x += Math.sin(timePhase) * turbulenceStrength;
          position.y += Math.cos(timePhase * 0.7) * turbulenceStrength * 0.8;
          position.z += Math.sin(timePhase * 1.4) * turbulenceStrength;

          const distanceFromCenter = position.length();

          if (distanceFromCenter > maxDistance) {
            continue;
          }

          const ageProgress = cycleTime / trail.particleLifetimes[i];
          const fadeIn = this.smoothstep(0, 0.1, ageProgress);
          const fadeOut = this.smoothstep(1.0, 0.7, ageProgress);
          const opacity = fadeIn * fadeOut;
          let atmosphereFade = 0;

          const size = trail.particleSizes[i] * (1 - ageProgress * 0.2);

          if (opacity > 0.01) {
            positions.setXYZ(particleIndex, position.x, position.y, position.z);
            sizes.setX(particleIndex, size);
            opacities.setX(particleIndex, opacity);
            atmosphereFades.setX(particleIndex, atmosphereFade);
            particleIndex++;
          }
        }
      }
    }

    for (let i = particleIndex; i < this.maxParticles; i++) {
      positions.setXYZ(i, 0, 0, 0);
      sizes.setX(i, 0);
      opacities.setX(i, 0);
      atmosphereFades.setX(i, 0);
    }

    positions.needsUpdate = true;
    sizes.needsUpdate = true;
    opacities.needsUpdate = true;
    atmosphereFades.needsUpdate = true;

    this.particleGeometry.setDrawRange(0, particleIndex);
  }

  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  update(_deltaTime: number): void {
    const cosmicOriginTime = this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.params.timeSpeed!, this.startTime);

    this.orbitalVisibilityFactor = this.calculateOrbitalVisibility();

    if (this.orbitalVisibilityFactor > 0) {
      this.updateParticleGeometry(currentTime);

      if (this.particleMaterial && this.particleMaterial.uniforms) {
        const baseOpacity = this.params.opacity || 1.0;
        this.particleMaterial.uniforms.globalOpacity.value = baseOpacity * this.orbitalVisibilityFactor;
      }
    } else {
      this.hideAllParticles();
    }
  }

  private hideAllParticles(): void {
    const positions = this.particleGeometry.attributes.position as THREE.BufferAttribute;
    const sizes = this.particleGeometry.attributes.size as THREE.BufferAttribute;
    const opacities = this.particleGeometry.attributes.opacity as THREE.BufferAttribute;
    const atmosphereFades = this.particleGeometry.attributes.atmosphereFade as THREE.BufferAttribute;

    for (let i = 0; i < this.maxParticles; i++) {
      positions.setXYZ(i, 0, 0, 0);
      sizes.setX(i, 0);
      opacities.setX(i, 0);
      atmosphereFades.setX(i, 0);
    }

    positions.needsUpdate = true;
    sizes.needsUpdate = true;
    opacities.needsUpdate = true;
    atmosphereFades.needsUpdate = true;

    this.particleGeometry.setDrawRange(0, 0);
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.trailGroup.position.copy(planetPosition);
    }
    scene.add(this.trailGroup);
  }

  getObject3D(): THREE.Group {
    return this.trailGroup;
  }

  dispose(): void {
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.trailGroup.clear();
    this.trails = [];
  }
}

export function createCarbonTrailsFromPythonData(pythonData: any, planetRadius: number, _layerSystem?: any): CarbonTrailsEffect | null {
  const carbonData = pythonData?.surface_elements?.carbon_trails_data;

  if (!carbonData?.enabled) {
    return null;
  }

  const seed = pythonData?.seeds?.planet_seed || Math.floor(Math.random() * 1000000);
  const planetTemperature = pythonData?.original_planet_data?.surface_temperature || 0;
  const currentTimeYears = pythonData?.timing?.elapsed_time ? pythonData.timing.elapsed_time / (365.25 * 24 * 3600) : 0;

  const orbitalData = {
    enabled: true,
    cycle_duration_years: carbonData.cycle_duration_years,
    visible_duration_years: carbonData.visible_duration_years,
  };

  const params: CarbonTrailsParams = {
    seed: seed + 11000,
    planetTemperature: planetTemperature,
    orbitalData: orbitalData,
    currentTime: currentTimeYears,
    cosmicOriginTime: pythonData?.timing?.cosmic_origin_time,
  };

  return new CarbonTrailsEffect(planetRadius, params);
}
