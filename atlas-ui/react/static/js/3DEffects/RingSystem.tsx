// atlas-ui/react/static/js/3DEffects/RingSystem.tsx

import * as THREE from "three";
import { getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

export interface RingBand {
  inner: number;
  outer: number;
}

export interface RingSystemParams {
  inner_radius?: number;
  outer_radius?: number;
  tilt_factor?: number;
  planet_radius?: number;
  shape_seed?: number;
  num_particles_per_band?: number;
  bands?: RingBand[];
}

class VisualRNG {
  private seed: number;

  constructor(baseSeed: number) {
    this.seed = baseSeed;
  }

  private next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  uniform(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  choice<T>(items: T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }
}

export class RingSystemEffect {
  private ringSystem: THREE.Points;
  private concentricLines: THREE.Group;
  private material: THREE.ShaderMaterial;
  private linesMaterial: THREE.ShaderMaterial;
  private params: RingSystemParams;
  private planetRadius: number;
  private actualInnerRadius: number = 0;
  private actualOuterRadius: number = 0;
  private scale: number = 1;
  private tiltAngle: number = 0;

  constructor(planetRadius: number, params: RingSystemParams) {
    this.planetRadius = planetRadius;
    this.params = params;

    this.createRingSystemFromAPI(params);
    this.createConcentricLines();
  }

  private weightedChoice(options: number[], weights: number[], rng: VisualRNG): number {
    const r = rng.uniform(0, 1);
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (r < cumulative) return options[i];
    }
    return options[options.length - 1];
  }

  private createRingSystemFromAPI(ringsData: RingSystemParams): void {
    const { inner_radius, outer_radius, tilt_factor, planet_radius, shape_seed, num_particles_per_band, bands } = ringsData;

    if (!bands || bands.length === 0) {
      return;
    }

    this.scale = this.planetRadius / (planet_radius || 200);
    this.tiltAngle = Math.asin((tilt_factor || 0.2) * 0.5);
    this.actualInnerRadius = (inner_radius || 200) * this.scale;
    this.actualOuterRadius = (outer_radius || 400) * this.scale;

    const rng = new VisualRNG(shape_seed || 12345);
    const numPerBand = Math.floor((num_particles_per_band || 800) * 1.5);
    const totalParticles = bands.length * numPerBand * 2; // full_ring + ontop_ring

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);
    const sizes = new Float32Array(totalParticles);

    const sizeWeights = [0.4, 0.3, 0.2, 0.1];
    const sizeOptions = [0.5, 1.0, 1.5, 2.0];

    let idx = 0;
    for (const band of bands) {
      for (let i = 0; i < numPerBand; i++) {
        const angle = rng.uniform(Math.PI, 2 * Math.PI);
        const distance = rng.uniform(band.inner, band.outer) * this.scale;
        const grayValue = rng.uniform(20, 50) / 255;
        const size = this.weightedChoice(sizeOptions, sizeWeights, rng);

        positions[idx * 3] = distance * Math.cos(angle);
        positions[idx * 3 + 1] = distance * Math.sin(this.tiltAngle) * Math.sin(angle) - this.planetRadius * 0.07;
        positions[idx * 3 + 2] = distance * Math.cos(this.tiltAngle) * Math.sin(angle);

        colors[idx * 3] = grayValue;
        colors[idx * 3 + 1] = grayValue;
        colors[idx * 3 + 2] = grayValue;
        sizes[idx] = size * 0.25;
        idx++;
      }

      for (let i = 0; i < numPerBand; i++) {
        const angle = rng.uniform(0, Math.PI);
        const distance = rng.uniform(band.inner, band.outer) * this.scale;
        const grayValue = rng.uniform(20, 50) / 255;
        const size = this.weightedChoice(sizeOptions, sizeWeights, rng);

        positions[idx * 3] = distance * Math.cos(angle);
        positions[idx * 3 + 1] = distance * Math.sin(this.tiltAngle) * Math.sin(angle) - this.planetRadius * 0.07;
        positions[idx * 3 + 2] = distance * Math.cos(this.tiltAngle) * Math.sin(angle);

        colors[idx * 3] = grayValue;
        colors[idx * 3 + 1] = grayValue;
        colors[idx * 3 + 2] = grayValue;
        sizes[idx] = size * 0.25;
        idx++;
      }
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        brightness: { value: 4.4 },
        lightDirection: { value: new THREE.Vector3(1, 0, 0) },
        ambientLight: { value: 0.15 },
        planetRadius: { value: this.planetRadius },
        planetWorldPos: { value: new THREE.Vector3(0, 0, 0) },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vDistance;
        varying vec3 vWorldPosition;

        void main() {
          vColor = color;

          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vDistance = -mvPosition.z;

          gl_PointSize = size * (120.0 / vDistance);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float brightness;
        uniform vec3 lightDirection;
        uniform float ambientLight;
        uniform float planetRadius;
        uniform vec3 planetWorldPos;
        varying vec3 vColor;
        varying float vDistance;
        varying vec3 vWorldPosition;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          if (dist > 0.5) discard;

          float alpha = (1.0 - dist * 2.0);
          alpha = smoothstep(0.0, 1.0, alpha);

          float glow = 1.0 - dist;
          glow = pow(glow, 1.5);

          vec3 toLight = normalize(lightDirection);

          vec3 relPos = vWorldPosition - planetWorldPos;

          float behindPlanet = -dot(relPos, toLight);

          vec3 onAxis = -toLight * behindPlanet;
          float distFromAxis = length(relPos - onAxis);

          float isBehind = step(0.0, behindPlanet);

          float coneExpansion = 0.4;
          float shadowRadius = planetRadius + behindPlanet * coneExpansion;

          float gradientStart = shadowRadius * 1.5;
          float gradientEnd = shadowRadius;

          float shadow = smoothstep(gradientEnd, gradientStart, distFromAxis);

          shadow = mix(1.0, shadow, isBehind);

          float ambientInShadow = 0.35;
          float totalLight = mix(ambientInShadow, 1.0, shadow);

          vec3 finalColor = vColor * brightness * glow * totalLight;

          float depthAlpha = clamp(200.0 / vDistance, 0.3, 1.0);

          gl_FragColor = vec4(finalColor, alpha * depthAlpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.ringSystem = new THREE.Points(geometry, this.material);

    this.ringSystem.position.set(0, 0, 0);

    this.ringSystem.renderOrder = 1;
  }

  private createConcentricLines(): void {
    if (this.actualInnerRadius === 0 || this.actualOuterRadius === 0) return;

    this.concentricLines = new THREE.Group();

    const shapeSeed = this.params.shape_seed || 12345;
    const numLines = 25;
    const segments = 128;

    this.linesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        brightness: { value: 3.0 },
        intensity: { value: 1.0 },
        lightDirection: { value: new THREE.Vector3(1, 0, 0) },
        planetRadius: { value: this.planetRadius },
        planetWorldPos: { value: new THREE.Vector3(0, 0, 0) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;

        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float brightness;
        uniform float intensity;
        uniform vec3 lightDirection;
        uniform float planetRadius;
        uniform vec3 planetWorldPos;
        varying vec3 vWorldPosition;

        void main() {
          vec3 toLight = normalize(lightDirection);

          vec3 relPos = vWorldPosition - planetWorldPos;
          float behindPlanet = -dot(relPos, toLight);
          vec3 onAxis = -toLight * behindPlanet;
          float distFromAxis = length(relPos - onAxis);
          float isBehind = step(0.0, behindPlanet);

          float coneExpansion = 0.4;
          float shadowRadius = planetRadius + behindPlanet * coneExpansion;
          float gradientStart = shadowRadius * 1.5;
          float gradientEnd = shadowRadius;

          float shadow = smoothstep(gradientEnd, gradientStart, distFromAxis);
          shadow = mix(1.0, shadow, isBehind);

          float ambientInShadow = 0.35;
          float totalLight = mix(ambientInShadow, 1.0, shadow);

          vec3 lineColor = vec3(0.2) * intensity * brightness * totalLight;
          gl_FragColor = vec4(lineColor, 0.6 * intensity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    for (let i = 0; i < numLines; i++) {
      const lineRng = new VisualRNG(shapeSeed + i * 31);

      if (lineRng.uniform(0, 1) < 0.1) continue;

      const t = i / (numLines - 1);
      const radius = this.actualInnerRadius + (this.actualOuterRadius - this.actualInnerRadius) * t;

      const positions: number[] = [];
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        const tiltedY = z * Math.sin(this.tiltAngle) - this.planetRadius * 0.07;
        const tiltedZ = z * Math.cos(this.tiltAngle);
        positions.push(x, tiltedY, tiltedZ);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

      const mat = this.linesMaterial.clone();
      mat.uniforms.intensity = { value: lineRng.uniform(0.4, 1.0) };

      const line = new THREE.LineLoop(geometry, mat);
      this.concentricLines.add(line);
    }
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (!this.ringSystem) return;

    const pos = planetPosition || new THREE.Vector3(0, 0, 0);

    this.ringSystem.position.copy(pos);
    if (this.material?.uniforms.planetWorldPos) {
      this.material.uniforms.planetWorldPos.value.copy(pos);
    }

    if (this.concentricLines) {
      this.concentricLines.position.copy(pos);
      this.concentricLines.children.forEach((child) => {
        if (child instanceof THREE.LineLoop) {
          const mat = child.material as THREE.ShaderMaterial;
          if (mat.uniforms?.planetWorldPos) {
            mat.uniforms.planetWorldPos.value.copy(pos);
          }
        }
      });
    }

    scene.add(this.ringSystem);
    if (this.concentricLines) {
      scene.add(this.concentricLines);
    }
  }

  update(deltaTime: number, planetData?: any): void {
    if (!this.ringSystem || !planetData) return;

    const rotationPeriod = planetData.rotation_period_seconds || 86400;
    const cosmicOriginTime = planetData.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME;
    const initialAngleRotation = planetData.initialAngleRotation || 0;

    const timeElapsedSeconds = getUniverseTime(cosmicOriginTime);
    const angleVelocityRotation = (2 * Math.PI) / rotationPeriod;
    const angleRotation = (initialAngleRotation + timeElapsedSeconds * angleVelocityRotation) % (2 * Math.PI);

    this.ringSystem.rotation.y = angleRotation;
    if (this.concentricLines) {
      this.concentricLines.rotation.y = angleRotation;
    }
  }

  getObject3D(): THREE.Points {
    return this.ringSystem;
  }

  updateLightDirection(lightDir: THREE.Vector3): void {
    const normalizedDir = lightDir.clone().normalize();
    if (this.material?.uniforms.lightDirection) {
      this.material.uniforms.lightDirection.value.copy(normalizedDir);
    }
    if (this.concentricLines) {
      this.concentricLines.children.forEach((child) => {
        if (child instanceof THREE.LineLoop) {
          const mat = child.material as THREE.ShaderMaterial;
          if (mat.uniforms?.lightDirection) {
            mat.uniforms.lightDirection.value.copy(normalizedDir);
          }
        }
      });
    }
  }

  updateFromThreeLight(light: THREE.DirectionalLight): void {
    const lightDir = new THREE.Vector3().subVectors(light.position, light.target.position).normalize();

    if (this.material?.uniforms.lightDirection) {
      this.material.uniforms.lightDirection.value.copy(lightDir);
    }
    if (this.concentricLines) {
      this.concentricLines.children.forEach((child) => {
        if (child instanceof THREE.LineLoop) {
          const mat = child.material as THREE.ShaderMaterial;
          if (mat.uniforms?.lightDirection) {
            mat.uniforms.lightDirection.value.copy(lightDir);
          }
        }
      });
    }
  }

  dispose(): void {
    if (this.material) {
      this.material.dispose();
    }
    if (this.linesMaterial) {
      this.linesMaterial.dispose();
    }
    if (this.concentricLines) {
      this.concentricLines.children.forEach((child) => {
        if (child instanceof THREE.LineLoop) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    }
  }
}

export function createRingSystemFromPythonData(ringsData: any, planetRadius: number): RingSystemEffect {
  const params: RingSystemParams = {
    inner_radius: ringsData.inner_radius,
    outer_radius: ringsData.outer_radius,
    tilt_factor: ringsData.tilt_factor,
    planet_radius: ringsData.planet_radius,
    shape_seed: ringsData.shape_seed,
    num_particles_per_band: ringsData.num_particles_per_band,
    bands: ringsData.bands,
  };

  return new RingSystemEffect(planetRadius, params);
}
