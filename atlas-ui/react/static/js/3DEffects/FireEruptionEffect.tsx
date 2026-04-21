// atlas-ui/react/static/js/3DEffects/FireEruptionEffect.tsx

import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getAnimatedUniverseTime, getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

export interface FireEruptionParams {
  eruptionCount?: number;
  eruptionFrequency?: number;
  eruptionDuration?: number;
  eruptionHeight?: number;
  eruptionSpread?: number;

  particlesPerEruption?: number;
  particleSize?: number;
  particleLifetime?: number;
  particleSpeed?: number;
  particleGravity?: number;

  fireColorHot?: THREE.Color | number[];
  fireColorMid?: THREE.Color | number[];
  fireColorCool?: THREE.Color | number[];
  smokeColor?: THREE.Color | number[];

  emissiveIntensity?: number;
  glowIntensity?: number;
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
  ERUPTION_COUNT: { min: 15, max: 35 },
  ERUPTION_FREQUENCY: { min: 0.2, max: 0.8 },
  ERUPTION_DURATION: { min: 2.0, max: 5.0 },
  ERUPTION_HEIGHT: { min: 0.05, max: 0.15 },
  ERUPTION_SPREAD: { min: 0.6, max: 1.9 },
  PARTICLES_PER_ERUPTION: { min: 50, max: 150 },
  PARTICLE_SIZE: { min: 0.07, max: 0.09 },
  PARTICLE_LIFETIME: { min: 1.5, max: 3.5 },
  PARTICLE_SPEED: { min: 0.1, max: 0.4 },
  EMISSIVE_INTENSITY: { min: 2.0, max: 4.0 },
  TURBULENCE: { min: 0.5, max: 1.5 },
};

class FireEruption {
  public position: THREE.Vector3;
  public direction: THREE.Vector3;
  public lastEruptionTime: number = 0;
  public isActive: boolean = false;
  public eruptionStartTime: number = 0;
  private rng: SeededRandom;

  public particleDirections: THREE.Vector3[] = [];
  public particleSpeeds: number[] = [];
  public particleSizes: number[] = [];
  public particleLifetimes: number[] = [];

  public particleBirthTimes: number[] = [];
  public particleActive: boolean[] = [];

  constructor(position: THREE.Vector3, seed: number, frequency: number, duration: number, particlesPerEruption: number, spreadAngle: number, particleSpeed: number, particleSize: number, particleLifetime: number, planetRadius: number) {
    this.position = position;
    this.direction = position.clone().normalize();
    this.rng = new SeededRandom(seed);

    for (let i = 0; i < particlesPerEruption; i++) {
      this.particleDirections.push(this.getRandomDirection(spreadAngle));

      this.particleSpeeds.push(particleSpeed * (0.7 + this.rng.random() * 0.6));

      this.particleSizes.push(particleSize * planetRadius * (0.5 + this.rng.random()));

      this.particleLifetimes.push(particleLifetime * (0.8 + this.rng.random() * 0.4));

      this.particleBirthTimes.push(-1);
      this.particleActive.push(false);
    }

    this.isActive = false;
    this.eruptionStartTime = 0;
    this.lastEruptionTime = 0;
  }

  initializeStateFromAbsoluteTime(currentTime: number, frequency: number, duration: number, eruptionIndex: number): void {
    const waitTime = 1.0 / frequency;
    const totalCycleDuration = duration + waitTime;

    const seedOffset = (eruptionIndex * totalCycleDuration * 0.37) % totalCycleDuration;

    const cycleTime = (currentTime + seedOffset) % totalCycleDuration;

    if (cycleTime < duration) {
      this.isActive = true;
      this.eruptionStartTime = currentTime - cycleTime;
      this.lastEruptionTime = this.eruptionStartTime - waitTime;

      const eruptionAge = currentTime - this.eruptionStartTime;
      const eruptionProgress = Math.min(eruptionAge / duration, 1.0);

      for (let i = 0; i < this.particleDirections.length; i++) {
        const particleDelay = (i / this.particleDirections.length) * 0.7;

        if (eruptionProgress > particleDelay) {
          this.particleActive[i] = true;
          this.particleBirthTimes[i] = this.eruptionStartTime + particleDelay * duration;

          const particleAge = currentTime - this.particleBirthTimes[i];
          if (particleAge > this.particleLifetimes[i]) {
            this.particleActive[i] = false;
          }
        }
      }
    } else {
      this.isActive = false;
      this.lastEruptionTime = currentTime - cycleTime + duration - waitTime;
      this.eruptionStartTime = 0;

      const lastEruptionStart = currentTime - cycleTime;
      const lastEruptionEnd = lastEruptionStart + duration;

      for (let i = 0; i < this.particleDirections.length; i++) {
        const particleDelay = (i / this.particleDirections.length) * 0.7;
        const particleBirthTime = lastEruptionStart + particleDelay * duration;

        if (particleBirthTime < lastEruptionEnd) {
          const particleAge = currentTime - particleBirthTime;

          if (particleAge > 0 && particleAge <= this.particleLifetimes[i]) {
            this.particleActive[i] = true;
            this.particleBirthTimes[i] = particleBirthTime;
          }
        }
      }
    }
  }

  shouldErupt(currentTime: number, frequency: number, duration: number): boolean {
    const cycleDuration = 1.0 / frequency + duration;
    const timeSinceLastCycle = (currentTime - this.lastEruptionTime) % cycleDuration;
    const shouldBeActive = timeSinceLastCycle < duration;

    if (shouldBeActive && !this.isActive) {
      return true;
    }

    if (!shouldBeActive && this.isActive) {
      this.stopEruption();
    }

    return false;
  }

  startEruption(currentTime: number): void {
    this.isActive = true;
    this.eruptionStartTime = currentTime;
    this.lastEruptionTime = currentTime;
  }

  stopEruption(): void {
    this.isActive = false;
  }

  getRandomDirection(spread: number): THREE.Vector3 {
    const theta = this.rng.uniform(0, Math.PI * 2);
    const phi = this.rng.uniform(0, spread);

    const localDir = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi));

    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.direction);
    localDir.applyQuaternion(quaternion);

    return localDir;
  }
}

export class FireEruptionEffect {
  private fireGroup: THREE.Group;
  private eruptions: FireEruption[] = [];
  private particleSystem: THREE.Points;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.ShaderMaterial;
  private params: FireEruptionParams;
  private startTime: number;
  private planetRadius: number;
  private maxParticles: number = 5000;
  private orbitalVisibilityFactor: number;
  private temperatureActivationFactor: number;

  private static readonly vertexShader = `
    attribute float size;
    attribute float temperature;
    attribute float opacity;
    
    varying float vTemperature;
    varying float vOpacity;
    
    void main() {
      vTemperature = temperature;
      vOpacity = opacity;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  private static readonly fragmentShader = `
    uniform vec3 fireColorHot;
    uniform vec3 fireColorMid;
    uniform vec3 fireColorCool;
    uniform vec3 smokeColor;
    uniform float emissiveIntensity;
    
    varying float vTemperature;
    varying float vOpacity;
    
    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      
      float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
      alpha *= vOpacity;
      
      alpha *= smoothstep(0.0, 0.3, vOpacity);
      
      if (alpha < 0.01) discard;
      
      vec3 color;
      if (vTemperature > 0.7) {
        color = mix(fireColorMid, fireColorHot, (vTemperature - 0.7) / 0.3);
      } else if (vTemperature > 0.3) {
        color = mix(fireColorCool, fireColorMid, (vTemperature - 0.3) / 0.4);
      } else {
        color = mix(smokeColor, fireColorCool, vTemperature / 0.3);
      }
      
      color *= emissiveIntensity * (0.5 + vTemperature * 0.5);
      
      float glow = 1.0 - dist * 2.0;
      color += vec3(1.0, 0.8, 0.3) * glow * vTemperature * 0.5;
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  constructor(planetRadius: number, params: FireEruptionParams = {}) {
    this.planetRadius = planetRadius;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    this.startTime = params.startTime || (seed % 10000) / 1000;

    const fireColorHot = params.fireColorHot instanceof THREE.Color ? params.fireColorHot : new THREE.Color(1.0, 0.95, 0.8);
    const fireColorMid = params.fireColorMid instanceof THREE.Color ? params.fireColorMid : new THREE.Color(1.0, 0.5, 0.1);
    const fireColorCool = params.fireColorCool instanceof THREE.Color ? params.fireColorCool : new THREE.Color(0.8, 0.2, 0.0);
    const smokeColor = params.smokeColor instanceof THREE.Color ? params.smokeColor : new THREE.Color(0.2, 0.1, 0.05);

    this.params = {
      eruptionCount: params.eruptionCount || Math.floor(rng.uniform(PROCEDURAL_RANGES.ERUPTION_COUNT.min, PROCEDURAL_RANGES.ERUPTION_COUNT.max)),
      eruptionFrequency: params.eruptionFrequency || rng.uniform(PROCEDURAL_RANGES.ERUPTION_FREQUENCY.min, PROCEDURAL_RANGES.ERUPTION_FREQUENCY.max),
      eruptionDuration: params.eruptionDuration || rng.uniform(PROCEDURAL_RANGES.ERUPTION_DURATION.min, PROCEDURAL_RANGES.ERUPTION_DURATION.max),
      eruptionHeight: params.eruptionHeight || rng.uniform(PROCEDURAL_RANGES.ERUPTION_HEIGHT.min, PROCEDURAL_RANGES.ERUPTION_HEIGHT.max),
      eruptionSpread: params.eruptionSpread || rng.uniform(PROCEDURAL_RANGES.ERUPTION_SPREAD.min, PROCEDURAL_RANGES.ERUPTION_SPREAD.max),
      particlesPerEruption: params.particlesPerEruption || Math.floor(rng.uniform(PROCEDURAL_RANGES.PARTICLES_PER_ERUPTION.min, PROCEDURAL_RANGES.PARTICLES_PER_ERUPTION.max)),
      particleSize: params.particleSize || rng.uniform(PROCEDURAL_RANGES.PARTICLE_SIZE.min, PROCEDURAL_RANGES.PARTICLE_SIZE.max),
      particleLifetime: params.particleLifetime || rng.uniform(PROCEDURAL_RANGES.PARTICLE_LIFETIME.min, PROCEDURAL_RANGES.PARTICLE_LIFETIME.max),
      particleSpeed: params.particleSpeed || rng.uniform(PROCEDURAL_RANGES.PARTICLE_SPEED.min, PROCEDURAL_RANGES.PARTICLE_SPEED.max),
      particleGravity: params.particleGravity || 0.05,
      fireColorHot,
      fireColorMid,
      fireColorCool,
      smokeColor,
      emissiveIntensity: params.emissiveIntensity || rng.uniform(PROCEDURAL_RANGES.EMISSIVE_INTENSITY.min, PROCEDURAL_RANGES.EMISSIVE_INTENSITY.max),
      glowIntensity: params.glowIntensity || 2.0,
      turbulenceStrength: params.turbulenceStrength || rng.uniform(PROCEDURAL_RANGES.TURBULENCE.min, PROCEDURAL_RANGES.TURBULENCE.max),
      windStrength: params.windStrength || 0.1,
      seed,
      startTime: this.startTime,
      timeSpeed: params.timeSpeed || rng.uniform(0.1, 2.0),
      orbitalData: params.orbitalData,
      currentTime: params.currentTime || 0,
      planetTemperature: params.planetTemperature || 0,
    };

    this.temperatureActivationFactor = this.calculateTemperatureActivation();
    this.orbitalVisibilityFactor = this.calculateOrbitalVisibility();

    this.fireGroup = new THREE.Group();

    this.createEruptionPoints(rng);

    this.initializeStateFromAbsoluteTime();

    this.createParticleSystem();

    this.initializeActiveEruptions();

    const cosmicOriginTime = this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.params.timeSpeed, this.startTime);
    this.updateParticleGeometry(currentTime);
  }

  private initializeStateFromAbsoluteTime(): void {
    const cosmicOriginTime = this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.params.timeSpeed, this.startTime);

    for (let i = 0; i < this.eruptions.length; i++) {
      this.eruptions[i].initializeStateFromAbsoluteTime(currentTime, this.params.eruptionFrequency!, this.params.eruptionDuration!, i);
    }
  }

  private createEruptionPoints(rng: SeededRandom): void {
    const count = this.params.eruptionCount!;

    for (let i = 0; i < count; i++) {
      const phi = rng.uniform(0, Math.PI * 2);
      const theta = Math.acos(rng.uniform(-1, 1));

      const position = new THREE.Vector3(Math.sin(theta) * Math.cos(phi) * this.planetRadius, Math.sin(theta) * Math.sin(phi) * this.planetRadius, Math.cos(theta) * this.planetRadius);

      const eruption = new FireEruption(position, Math.floor(rng.random() * 1000000), this.params.eruptionFrequency!, this.params.eruptionDuration!, 150, this.params.eruptionSpread!, this.params.particleSpeed!, this.params.particleSize!, this.params.particleLifetime!, this.planetRadius);

      this.eruptions.push(eruption);
    }
  }

  private createParticleSystem(): void {
    this.particleGeometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.maxParticles * 3);
    const sizes = new Float32Array(this.maxParticles);
    const temperatures = new Float32Array(this.maxParticles);
    const opacities = new Float32Array(this.maxParticles);

    this.particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    this.particleGeometry.setAttribute("temperature", new THREE.BufferAttribute(temperatures, 1));
    this.particleGeometry.setAttribute("opacity", new THREE.BufferAttribute(opacities, 1));

    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader: FireEruptionEffect.vertexShader,
      fragmentShader: FireEruptionEffect.fragmentShader,
      uniforms: {
        fireColorHot: { value: this.params.fireColorHot },
        fireColorMid: { value: this.params.fireColorMid },
        fireColorCool: { value: this.params.fireColorCool },
        smokeColor: { value: this.params.smokeColor },
        emissiveIntensity: { value: this.params.emissiveIntensity },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: false,
    });

    this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.particleSystem.renderOrder = 4;
    this.fireGroup.add(this.particleSystem);
  }

  private initializeActiveEruptions(): void {
    const cosmicOriginTime = this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.params.timeSpeed, this.startTime);

    for (let eruptionIndex = 0; eruptionIndex < this.eruptions.length; eruptionIndex++) {
      const eruption = this.eruptions[eruptionIndex];

      const waitTime = 1.0 / this.params.eruptionFrequency!;
      const totalCycleDuration = this.params.eruptionDuration! + waitTime;
      const seedOffset = (eruptionIndex * totalCycleDuration * 0.37) % totalCycleDuration;

      const maxParticleLifetime = Math.max(...eruption.particleLifetimes);

      const cyclesToCheck = Math.ceil(maxParticleLifetime / totalCycleDuration) + 1;

      for (let cycleBack = 0; cycleBack < cyclesToCheck; cycleBack++) {
        const pastTime = currentTime - cycleBack * totalCycleDuration;
        const cycleTime = (pastTime + seedOffset) % totalCycleDuration;

        if (cycleTime < this.params.eruptionDuration!) {
          const eruptionStartTime = pastTime - cycleTime;

          for (let i = 0; i < 150; i++) {
            const particleDelay = (i / 150) * 0.7;
            const particleBirthTime = eruptionStartTime + particleDelay * this.params.eruptionDuration!;
            const particleAge = currentTime - particleBirthTime;

            if (particleAge > 0 && particleAge <= eruption.particleLifetimes[i]) {
              if (!eruption.particleActive[i]) {
                eruption.particleActive[i] = true;
                eruption.particleBirthTimes[i] = particleBirthTime;
              }
            }
          }
        }
      }
    }
  }

  private calculateTemperatureActivation(): number {
    const temperature = this.params.planetTemperature || 0;

    if (temperature < 1500) {
      return 0;
    }

    if (temperature >= 3000) {
      return 1;
    }

    const activationRange = 3000 - 1500;
    const temperatureInRange = temperature - 1500;
    return temperatureInRange / activationRange;
  }

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

      if (visibleProgress < 0.1) {
        visibility = visibleProgress / 0.1;
      } else if (visibleProgress > 0.9) {
        visibility = (1.0 - visibleProgress) / 0.1;
      } else {
        visibility = 1.0;
      }
    }

    return visibility;
  }

  private updateParticleGeometry(currentTime: number): void {
    const positions = this.particleGeometry.attributes.position as THREE.BufferAttribute;
    const sizes = this.particleGeometry.attributes.size as THREE.BufferAttribute;
    const temperatures = this.particleGeometry.attributes.temperature as THREE.BufferAttribute;
    const opacities = this.particleGeometry.attributes.opacity as THREE.BufferAttribute;

    let particleIndex = 0;
    const particlesPerEruption = 150;

    for (let eruptionIndex = 0; eruptionIndex < this.eruptions.length; eruptionIndex++) {
      const eruption = this.eruptions[eruptionIndex];

      const waitTime = 1.0 / this.params.eruptionFrequency!;
      const totalCycleDuration = this.params.eruptionDuration! + waitTime;
      const seedOffset = (eruptionIndex * totalCycleDuration * 0.37) % totalCycleDuration;
      const cycleTime = (currentTime + seedOffset) % totalCycleDuration;

      const isCurrentlyActive = cycleTime < this.params.eruptionDuration!;

      if (isCurrentlyActive && !eruption.isActive) {
        eruption.isActive = true;
        eruption.eruptionStartTime = currentTime - cycleTime;
      } else if (!isCurrentlyActive && eruption.isActive) {
        eruption.isActive = false;
      }

      if (isCurrentlyActive) {
        const eruptionAge = currentTime - eruption.eruptionStartTime;
        const eruptionProgress = Math.min(eruptionAge / this.params.eruptionDuration!, 1.0);

        for (let i = 0; i < particlesPerEruption; i++) {
          const particleDelay = (i / particlesPerEruption) * 0.7;
          const shouldBeActive = eruptionProgress > particleDelay;

          if (shouldBeActive && !eruption.particleActive[i]) {
            eruption.particleActive[i] = true;
            eruption.particleBirthTimes[i] = currentTime - (eruptionProgress - particleDelay) * this.params.eruptionDuration!;
          }
        }
      }

      for (let i = 0; i < particlesPerEruption && particleIndex < this.maxParticles; i++) {
        if (eruption.particleActive[i]) {
          const particleAge = currentTime - eruption.particleBirthTimes[i];
          const particleLifetime = eruption.particleLifetimes[i];

          if (particleAge > particleLifetime) {
            eruption.particleActive[i] = false;
            continue;
          }

          const direction = eruption.particleDirections[i].clone();
          const speed = eruption.particleSpeeds[i];

          const distance = speed * particleAge;
          const position = eruption.position.clone().add(direction.multiplyScalar(distance));

          const gravityEffect = this.params.particleGravity! * particleAge * particleAge * 0.5;
          position.y -= gravityEffect;

          const turbulence = new THREE.Vector3(Math.sin(currentTime * 0.5 + i * 0.1) * 0.01, Math.cos(currentTime * 0.3 + i * 0.1) * 0.005, Math.sin(currentTime * 0.7 + i * 0.1) * 0.01);
          position.add(turbulence);

          const particleProgress = particleAge / particleLifetime;
          const temperature = Math.max(0, 1.0 - particleProgress * 0.9);

          const fadeIn = this.smoothstep(0, 0.1, particleProgress);
          const fadeOut = this.smoothstep(1.0, 0.7, particleProgress);
          const opacity = fadeIn * fadeOut;

          const size = eruption.particleSizes[i];

          if (opacity > 0.01) {
            positions.setXYZ(particleIndex, position.x, position.y, position.z);
            sizes.setX(particleIndex, size);
            temperatures.setX(particleIndex, temperature);
            opacities.setX(particleIndex, opacity);

            particleIndex++;
          }
        }
      }
    }

    for (let i = particleIndex; i < this.maxParticles; i++) {
      positions.setXYZ(i, 0, 0, 0);
      sizes.setX(i, 0);
      opacities.setX(i, 0);
      temperatures.setX(i, 0);
    }

    positions.needsUpdate = true;
    sizes.needsUpdate = true;
    temperatures.needsUpdate = true;
    opacities.needsUpdate = true;

    this.particleGeometry.setDrawRange(0, particleIndex);
  }

  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  update(_deltaTime: number): void {
    const cosmicOriginTime = this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.params.timeSpeed, this.startTime);

    this.orbitalVisibilityFactor = this.calculateOrbitalVisibility();

    const totalActivationFactor = this.temperatureActivationFactor * this.orbitalVisibilityFactor;

    if (totalActivationFactor > 0) {
      this.updateParticleGeometry(currentTime);

      if (this.particleMaterial && this.particleMaterial.uniforms) {
        const baseEmissive = this.params.emissiveIntensity || 1.0;
        this.particleMaterial.uniforms.emissiveIntensity.value = baseEmissive * totalActivationFactor;
      }
    } else {
      this.hideAllParticles();
    }
  }

  private hideAllParticles(): void {
    const positions = this.particleGeometry.attributes.position as THREE.BufferAttribute;
    const sizes = this.particleGeometry.attributes.size as THREE.BufferAttribute;
    const opacities = this.particleGeometry.attributes.opacity as THREE.BufferAttribute;
    const temperatures = this.particleGeometry.attributes.temperature as THREE.BufferAttribute;

    for (let i = 0; i < this.maxParticles; i++) {
      positions.setXYZ(i, 0, 0, 0);
      sizes.setX(i, 0);
      opacities.setX(i, 0);
      temperatures.setX(i, 0);
    }

    positions.needsUpdate = true;
    sizes.needsUpdate = true;
    temperatures.needsUpdate = true;
    opacities.needsUpdate = true;

    this.particleGeometry.setDrawRange(0, 0);
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.fireGroup.position.copy(planetPosition);
    }
    scene.add(this.fireGroup);
  }

  getObject3D(): THREE.Group {
    return this.fireGroup;
  }

  dispose(): void {
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.fireGroup.clear();
    this.eruptions = [];
  }
}

export function createFireEruptionFromPythonData(pythonData: any, planetRadius: number, _layerSystem?: any): FireEruptionEffect {
  const seed = pythonData?.seeds?.planet_seed || Math.floor(Math.random() * 1000000);

  const planetTemperature = pythonData?.original_planet_data?.surface_temperature || 0;

  const currentTimeYears = pythonData?.timing?.elapsed_time ? pythonData.timing.elapsed_time / (365.25 * 24 * 3600) : 0;

  const orbitalPeriodYears = pythonData?.original_planet_data?.orbital_period_seconds ? pythonData.original_planet_data.orbital_period_seconds / (365.25 * 24 * 3600) : 1.0;

  const fireData = pythonData?.fire_eruption_data || {};
  const rng = new SeededRandom(seed + 9001);

  const cycleDuration = fireData.cycle_duration_years || rng.uniform(orbitalPeriodYears * 0.3, orbitalPeriodYears * 0.5);

  const orbitalData = {
    enabled: fireData.enabled !== undefined ? fireData.enabled : true,
    cycle_duration_years: cycleDuration,
    visible_duration_years: fireData.visible_duration_years || rng.uniform(cycleDuration * 0.4, cycleDuration * 0.55),
  };

  const params: FireEruptionParams = {
    seed: seed + 9000,
    planetTemperature: planetTemperature,
    orbitalData: orbitalData,
    currentTime: currentTimeYears,
    cosmicOriginTime: pythonData?.timing?.cosmic_origin_time,
  };

  return new FireEruptionEffect(planetRadius, params);
}
