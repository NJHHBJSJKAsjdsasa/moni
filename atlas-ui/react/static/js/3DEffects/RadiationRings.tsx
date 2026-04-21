// atlas-ui/react/static/js/3DEffects/RadiationRings.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

const PROCEDURAL_RANGES = {
  RING_COUNT: { min: 16, max: 256 },
  EXPANSION_SPEED: { min: 1.5, max: 5 },
  WAVE_INTENSITY: { min: 0.6, max: 2.0 },
  MAX_RADIUS_MULTIPLIER: { min: 1.5, max: 10 },
  GLOW_INTENSITY: { min: 0.5, max: 2.0 },
  TIME_SPEED: { min: 0.8, max: 1.3 },
};

export interface RadiationRingsParams {
  color?: number[] | THREE.Color;
  ringCount?: number;
  expansionSpeed?: number;
  waveIntensity?: number;
  maxRadius?: number;
  glowIntensity?: number;
  seed?: number;
  cosmicOriginTime?: number;
  timeSpeed?: number;
}

export class RadiationRingsEffect {
  private group: THREE.Group;
  private concentricRings: THREE.Mesh[] = [];
  private params: RadiationRingsParams;
  private rng: SeededRandom;
  private planetRadius: number;
  private cosmicOffset: number;

  constructor(planetRadius: number, params: RadiationRingsParams = {}) {
    this.planetRadius = planetRadius;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    this.rng = new SeededRandom(seed);

    this.params = {
      color: params.color || [0.3, 1.0, 0.2],
      ringCount: params.ringCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.RING_COUNT.max - PROCEDURAL_RANGES.RING_COUNT.min) + PROCEDURAL_RANGES.RING_COUNT.min),
      expansionSpeed: params.expansionSpeed || this.rng.random() * (PROCEDURAL_RANGES.EXPANSION_SPEED.max - PROCEDURAL_RANGES.EXPANSION_SPEED.min) + PROCEDURAL_RANGES.EXPANSION_SPEED.min,
      waveIntensity: params.waveIntensity || this.rng.random() * (PROCEDURAL_RANGES.WAVE_INTENSITY.max - PROCEDURAL_RANGES.WAVE_INTENSITY.min) + PROCEDURAL_RANGES.WAVE_INTENSITY.min,
      maxRadius: params.maxRadius || planetRadius * (this.rng.random() * (PROCEDURAL_RANGES.MAX_RADIUS_MULTIPLIER.max - PROCEDURAL_RANGES.MAX_RADIUS_MULTIPLIER.min) + PROCEDURAL_RANGES.MAX_RADIUS_MULTIPLIER.min),
      glowIntensity: params.glowIntensity || this.rng.random() * (PROCEDURAL_RANGES.GLOW_INTENSITY.max - PROCEDURAL_RANGES.GLOW_INTENSITY.min) + PROCEDURAL_RANGES.GLOW_INTENSITY.min,
      cosmicOriginTime: params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME,
      timeSpeed: params.timeSpeed || this.rng.random() * (PROCEDURAL_RANGES.TIME_SPEED.max - PROCEDURAL_RANGES.TIME_SPEED.min) + PROCEDURAL_RANGES.TIME_SPEED.min,
      seed,
    };

    this.cosmicOffset = (seed % 100) * 0.1;

    this.group = new THREE.Group();
    this.createConcentricRings();
  }

  private createConcentricRings(): void {
    const ringCount = this.params.ringCount!;
    const maxRingRadius = this.params.maxRadius!;

    for (let i = 0; i < ringCount; i++) {
      const t = i / (ringCount - 1);
      const ringRadius = this.planetRadius * 1.02 + (maxRingRadius - this.planetRadius * 1.02) * Math.pow(t, 0.8);

      const segments = 64;
      const points = [];

      for (let j = 0; j < segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        const x = Math.cos(angle) * ringRadius;
        const z = Math.sin(angle) * ringRadius;

        const baseHeight = this.planetRadius * 0.005;
        const variation = Math.sin(angle * 7 + i * 2) * 0.5 * 0.01 * this.planetRadius;
        const y = baseHeight + variation;
        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points, true);

      const tubeRadius = this.planetRadius * 0.006;
      const radialSegments = 4;
      const tubularSegments = segments;

      const geometry = new THREE.TubeGeometry(curve, tubularSegments, tubeRadius, radialSegments, true);

      const positions = geometry.attributes.position.array;
      const uvs = geometry.attributes.uv.array;
      const vertexCount = positions.length / 3;

      const phases = new Float32Array(vertexCount);
      const distances = new Float32Array(vertexCount);
      const randomOffsets = new Float32Array(vertexCount);

      for (let j = 0; j < vertexCount; j++) {
        const uvX = uvs[j * 2];
        phases[j] = i * 0.6 + uvX * Math.PI * 4;
        distances[j] = (ringRadius - this.planetRadius * 1.02) / (maxRingRadius - this.planetRadius * 1.02);
        randomOffsets[j] = ((i * 7 + j * 3) % 100) / 100.0;
      }

      geometry.setAttribute("phase", new THREE.BufferAttribute(phases, 1));
      geometry.setAttribute("distance", new THREE.BufferAttribute(distances, 1));
      geometry.setAttribute("randomOffset", new THREE.BufferAttribute(randomOffsets, 1));

      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,

        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(this.params.color![0], this.params.color![1], this.params.color![2]) },
          expansionSpeed: { value: this.params.expansionSpeed },
          waveIntensity: { value: this.params.waveIntensity },
          glowIntensity: { value: this.params.glowIntensity },
          ringIndex: { value: i },
          totalRings: { value: ringCount },
        },

        vertexShader: `
          attribute float phase;
          attribute float distance;
          attribute float randomOffset;
          
          uniform float time;
          uniform float expansionSpeed;
          uniform float waveIntensity;
          uniform float ringIndex;
          uniform float totalRings;
          
          varying vec2 vUv;
          varying float vIntensity;
          varying float vDistance;
          
          void main() {
            vUv = uv;
            vDistance = distance;

            float wave1 = sin(phase + time * expansionSpeed) * 0.5 + 0.5;
            float wave2 = sin(phase * 2.0 - time * expansionSpeed * 1.3 + ringIndex * 0.8) * 0.3 + 0.7;
            float wave3 = cos(phase * 0.5 + time * expansionSpeed * 0.7 - ringIndex * 1.2) * 0.2 + 0.8;

            float expansionWave = sin(distance * 15.0 - time * expansionSpeed * 2.0) * 0.4 + 0.6;

            float globalPulse = sin(time * expansionSpeed * 0.5 + ringIndex * 0.3) * 0.2 + 0.8;

            vIntensity = wave1 * wave2 * wave3 * expansionWave * globalPulse * waveIntensity;

            float distanceFalloff = 1.0 - pow(distance, 1.2);
            vIntensity *= distanceFalloff;

            vIntensity *= (0.8 + randomOffset * 0.4);

            vec3 pos = position;
            pos.y += sin(phase + time * expansionSpeed * 0.5) * 2.0 * (1.0 - distance);
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,

        fragmentShader: `
          uniform vec3 color;
          uniform float glowIntensity;
          uniform float time;
          uniform float expansionSpeed;
          
          varying vec2 vUv;
          varying float vIntensity;
          varying float vDistance;
          
          void main() {
            float centerDistance = abs(vUv.y - 0.5) * 2.0;
            float tubeFalloff = 1.0 - smoothstep(0.0, 1.0, centerDistance);

            float fragmentPulse = sin(time * expansionSpeed * 1.5) * 0.1 + 0.9;

            float finalIntensity = vIntensity * glowIntensity * fragmentPulse * tubeFalloff;

            vec3 finalColor = color;

            if (finalIntensity > 0.7) {
              finalColor = mix(color, vec3(0.5, 1.0, 0.1), (finalIntensity - 0.7) * 2.0);
            }

            finalColor *= finalIntensity;

            float alpha = max(finalIntensity * 0.7, finalIntensity * vDistance * 0.3);
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
      });

      const ring = new THREE.Mesh(geometry, material);
      ring.renderOrder = 1000 + i;
      this.concentricRings.push(ring);
      this.group.add(ring);
    }
  }

  public update(_deltaTime?: number): void {
    const timeSinceCosmicOrigin = getUniverseTime(this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME);

    const animTime = (timeSinceCosmicOrigin + this.cosmicOffset) * (this.params.timeSpeed || 1.0);

    const shaderTime = animTime % 10000;

    this.concentricRings.forEach((ring) => {
      const material = ring.material as THREE.ShaderMaterial;
      material.uniforms.time.value = shaderTime;
    });

    this.group.rotation.y = shaderTime * 0.05;
  }

  public getObject3D(): THREE.Object3D {
    return this.group;
  }

  public addToScene(scene: THREE.Scene, position?: THREE.Vector3): void {
    if (position) {
      this.group.position.copy(position);
    }
    scene.add(this.group);
  }

  public removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.group);
  }

  public dispose(): void {
    this.concentricRings.forEach((ring) => {
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
    });

    this.group.clear();
  }

  public setEnabled(enabled: boolean): void {
    this.group.visible = enabled;
  }

  public updateParams(newParams: Partial<RadiationRingsParams>): void {
    Object.assign(this.params, newParams);

    if (newParams.color) {
      const color = new THREE.Color(newParams.color[0], newParams.color[1], newParams.color[2]);
      this.concentricRings.forEach((ring) => {
        const material = ring.material as THREE.ShaderMaterial;
        material.uniforms.color.value = color;
      });
    }

    if (newParams.expansionSpeed !== undefined) {
      this.concentricRings.forEach((ring) => {
        const material = ring.material as THREE.ShaderMaterial;
        material.uniforms.expansionSpeed.value = newParams.expansionSpeed;
      });
    }

    if (newParams.waveIntensity !== undefined) {
      this.concentricRings.forEach((ring) => {
        const material = ring.material as THREE.ShaderMaterial;
        material.uniforms.waveIntensity.value = newParams.waveIntensity;
      });
    }

    if (newParams.glowIntensity !== undefined) {
      this.concentricRings.forEach((ring) => {
        const material = ring.material as THREE.ShaderMaterial;
        material.uniforms.glowIntensity.value = newParams.glowIntensity;
      });
    }
  }
}

export function createRadiationRingsFromPythonData(planetRadius: number, pythonData: any, globalSeed?: number): RadiationRingsEffect {
  const seed = globalSeed || Math.floor(Math.random() * 1000000);

  const params: RadiationRingsParams = {
    seed: seed + 42424,
    color: pythonData.color || [0.3, 1.0, 0.2],
    cosmicOriginTime: pythonData?.timing?.cosmic_origin_time || pythonData?.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME,
  };

  return new RadiationRingsEffect(planetRadius, params);
}
