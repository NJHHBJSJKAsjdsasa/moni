// atlas-ui/react/static/js/3DEffects/AtmosphereGlow.tsx

import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getAnimatedUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

export interface AtmosphereGlowParams {
  color?: THREE.Color | number;
  particleCount?: number;
  speed?: number;
  size?: number;
  opacity?: number;
  turbulence?: number;
  seed?: number;
  rotationSpeed?: number;
  movementAmplitude?: number;
  startTime?: number;
  timeSpeed?: number;
  cosmicOriginTime?: number;
}

const PROCEDURAL_RANGES = {
  PARTICLE_COUNT: { min: 25, max: 150 },
  SPEED: { min: 0.05, max: 0.5 },
  SIZE: { min: 0.3, max: 1.5 },
  OPACITY: { min: 0.1, max: 0.3 },
  TURBULENCE: { min: 0.1, max: 0.5 },
  ROTATION_SPEED: { min: 0.01, max: 0.05 },
  MOVEMENT_AMPLITUDE: { min: 0.005, max: 0.05 },
  TIME_SPEED: { min: 0.1, max: 3.0 },
};

export class AtmosphereGlowEffect {
  private particleSystem: THREE.Points;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.BufferGeometry;
  private params: AtmosphereGlowParams;
  private particleCount: number;
  private startTime: number;

  private static readonly vertexShader = `
    attribute float size;
    attribute vec3 customColor;
    attribute float speed;
    attribute float phase;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vSize;
    
    uniform float time;
    uniform float turbulence;
    uniform float movementAmplitude;
    
    void main() {
      vColor = customColor;
      vSize = size;
      
      vec3 pos = position;
      float timeWithPhase = time * speed + phase;
      
      pos.x += sin(timeWithPhase) * movementAmplitude * turbulence;
      pos.y += cos(timeWithPhase * 0.7) * (movementAmplitude * 0.5) * turbulence;
      pos.z += sin(timeWithPhase * 0.5) * (movementAmplitude * 0.8) * turbulence;
      
      float distanceFromCenter = length(pos.xy) / 2.0;
      vAlpha = (1.0 - distanceFromCenter) * (0.5 + 0.5 * sin(timeWithPhase * 2.0));
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  private static readonly fragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;
    varying float vSize;
    
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float dist = length(uv);
      
      float streak = 1.0 - smoothstep(0.0, 0.5, dist);
      float elongation = 1.0 - smoothstep(0.0, 0.3, abs(uv.x));
      streak *= elongation;
      
      float sizeVariation = vSize > 1.5 ? 1.2 : 0.8;
      streak *= sizeVariation;
      
      gl_FragColor = vec4(vColor, streak * vAlpha);
    }
  `;

  constructor(planetRadius: number, params: AtmosphereGlowParams = {}) {
    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    this.startTime = params.startTime || (seed % 10000) / 1000;

    this.params = {
      color: params.color || new THREE.Color(0xffffff),
      particleCount: params.particleCount || Math.floor(rng.uniform(PROCEDURAL_RANGES.PARTICLE_COUNT.min, PROCEDURAL_RANGES.PARTICLE_COUNT.max)),
      speed: params.speed || rng.uniform(PROCEDURAL_RANGES.SPEED.min, PROCEDURAL_RANGES.SPEED.max),
      size: params.size || rng.uniform(PROCEDURAL_RANGES.SIZE.min, PROCEDURAL_RANGES.SIZE.max),
      opacity: params.opacity || rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max),
      turbulence: params.turbulence || rng.uniform(PROCEDURAL_RANGES.TURBULENCE.min, PROCEDURAL_RANGES.TURBULENCE.max),
      rotationSpeed: params.rotationSpeed || rng.uniform(PROCEDURAL_RANGES.ROTATION_SPEED.min, PROCEDURAL_RANGES.ROTATION_SPEED.max),
      movementAmplitude: params.movementAmplitude || rng.uniform(PROCEDURAL_RANGES.MOVEMENT_AMPLITUDE.min, PROCEDURAL_RANGES.MOVEMENT_AMPLITUDE.max),
      timeSpeed: params.timeSpeed || rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),
      seed: seed,
      startTime: this.startTime,
    };

    this.particleCount = this.params.particleCount!;
    this.geometry = new THREE.BufferGeometry();
    this.material = this.createMaterial();

    this.generateParticles(planetRadius);
    this.particleSystem = new THREE.Points(this.geometry, this.material);
  }

  private generateParticles(planetRadius: number): void {
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    const speeds = new Float32Array(this.particleCount);
    const phases = new Float32Array(this.particleCount);

    const color = this.params.color instanceof THREE.Color ? this.params.color : new THREE.Color(this.params.color as any);

    const seed = this.params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    for (let i = 0; i < this.particleCount; i++) {
      const pos = rng.spherePosition(planetRadius * rng.uniform(1.0, 1.1));
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const colorVar = rng.colorVariation({ r: color.r, g: color.g, b: color.b });
      colors[i * 3] = colorVar.r;
      colors[i * 3 + 1] = colorVar.g;
      colors[i * 3 + 2] = colorVar.b;

      sizes[i] = this.params.size! * rng.uniform(0.75, 1.25);
      speeds[i] = this.params.speed! * rng.uniform(0.6, 1.4);
      phases[i] = rng.random() * Math.PI * 2;
    }

    this.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute("customColor", new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute("speed", new THREE.BufferAttribute(speeds, 1));
    this.geometry.setAttribute("phase", new THREE.BufferAttribute(phases, 1));
  }

  private createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: AtmosphereGlowEffect.vertexShader,
      fragmentShader: AtmosphereGlowEffect.fragmentShader,
      uniforms: {
        time: { value: 0 },
        turbulence: { value: this.params.turbulence },
        movementAmplitude: { value: this.params.movementAmplitude },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.particleSystem.position.copy(planetPosition);
    }
    scene.add(this.particleSystem);
  }

  update(deltaTime: number): void {
    const cosmicOriginTime = DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.params.timeSpeed!, this.startTime);

    this.material.uniforms.time.value = currentTime;

    this.particleSystem.rotation.y = currentTime * this.params.rotationSpeed!;
  }

  updateParams(newParams: Partial<AtmosphereGlowParams>): void {
    this.params = { ...this.params, ...newParams };

    if (newParams.turbulence !== undefined) {
      this.material.uniforms.turbulence.value = newParams.turbulence;
    }
  }

  getObject3D(): THREE.Points {
    return this.particleSystem;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

export function createAtmosphereGlowFromPythonData(planetRadius: number, atmosphereData: any, globalSeed?: number): AtmosphereGlowEffect {
  const streaksData = atmosphereData.streaks || {};

  const seed = globalSeed || Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed + 3000);

  const particleCount = streaksData.count || Math.floor(rng.uniform(PROCEDURAL_RANGES.PARTICLE_COUNT.min, PROCEDURAL_RANGES.PARTICLE_COUNT.max));
  const speed = streaksData.speed || rng.uniform(PROCEDURAL_RANGES.SPEED.min, PROCEDURAL_RANGES.SPEED.max);
  const size = rng.uniform(PROCEDURAL_RANGES.SIZE.min, PROCEDURAL_RANGES.SIZE.max);
  const opacity = rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max);
  const turbulence = rng.uniform(PROCEDURAL_RANGES.TURBULENCE.min, PROCEDURAL_RANGES.TURBULENCE.max);
  const rotationSpeed = rng.uniform(PROCEDURAL_RANGES.ROTATION_SPEED.min, PROCEDURAL_RANGES.ROTATION_SPEED.max);
  const movementAmplitude = rng.uniform(PROCEDURAL_RANGES.MOVEMENT_AMPLITUDE.min, PROCEDURAL_RANGES.MOVEMENT_AMPLITUDE.max);
  const timeSpeed = rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max);

  const params: AtmosphereGlowParams = {
    color: streaksData.color ? new THREE.Color().setRGB(streaksData.color[0], streaksData.color[1], streaksData.color[2]) : new THREE.Color(0xffffff),
    particleCount,
    speed,
    size,
    opacity,
    turbulence,
    seed,
    rotationSpeed,
    movementAmplitude,
    timeSpeed,
  };

  return new AtmosphereGlowEffect(planetRadius, params);
}
