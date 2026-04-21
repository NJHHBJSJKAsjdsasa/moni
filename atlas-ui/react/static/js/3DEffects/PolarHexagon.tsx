// atlas-ui/react/static/js/3DEffects/PolarHexagon.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getAnimatedUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

const PROCEDURAL_RANGES = {
  SIZE: { min: 0.12, max: 0.2 },
  ROTATION_SPEED: { min: 0.05, max: 0.1 },
  OPACITY: { min: 0.15, max: 0.35 },
  TIME_SPEED: { min: 0.8, max: 1.5 },
};

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    // World position for curved surface calculations
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  uniform vec3 planetColor;
  uniform vec3 hexagonColor;
  uniform float darkenFactor;
  uniform float opacity;
  uniform float hexagonRadius;
  uniform float rotationSpeed;
  uniform float pole;
  uniform float visibility;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  #define PI 3.14159265359
  
  vec2 toPolar(vec2 uv) {
    vec2 centered = uv - 0.5;
    float r = length(centered);
    float theta = atan(centered.y, centered.x);
    return vec2(r, theta);
  }
  
  float hexagon(vec2 p, float radius) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z * radius, k.z * radius), radius);
    return length(p) * sign(p.y);
  }
  
  void main() {
    vec2 polar = toPolar(vUv);
    
    float rotation = time * rotationSpeed;
    vec2 rotatedUV = vUv - 0.5;
    float cosR = cos(rotation);
    float sinR = sin(rotation);
    rotatedUV = vec2(
      rotatedUV.x * cosR - rotatedUV.y * sinR,
      rotatedUV.x * sinR + rotatedUV.y * cosR
    );
    
    float hex = hexagon(rotatedUV, hexagonRadius);
    
    float lineWidth = 0.03;
    float hexagonEdge = abs(hex);
    
    if (hexagonEdge > lineWidth) {
      discard;
    }
    
    if (hex > lineWidth) {
      discard;
    }
    
    float edgeIntensity = 1.0 - smoothstep(0.0, lineWidth, hexagonEdge);
    
    vec3 finalColor = planetColor * (1.0 - darkenFactor);
    
    finalColor *= 0.6;
    
    float finalOpacity = opacity * visibility * edgeIntensity * 0.25;
    
    finalColor += vec3(0.1) * edgeIntensity;
    
    gl_FragColor = vec4(finalColor, finalOpacity);
  }
`;

export interface PolarHexagonParams {
  planetColor: THREE.Color | string;
  hexagonData: {
    enabled: boolean;
    pole: "north" | "south";
    radius: number;
    rotation_speed: number;
    color_darken_factor: number;
    cycle_duration_years: number;
    visible_duration_years: number;
    opacity: number;
    nebula_blend?: boolean;
  };
  planetRadius: number;
  currentTime?: number; // Current time in years for visibility cycles
  seed?: number; // Seed for procedural generation
  startTime?: number; // Deterministic start time
  timeSpeed?: number; // Speed multiplier for time
  cosmicOriginTime?: number;
}

export class PolarHexagonEffect {
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private params: PolarHexagonParams;
  private startTime: number;
  private proceduralParams: {
    size: number;
    rotationSpeed: number;
    opacity: number;
    timeSpeed: number;
  };

  constructor(params: PolarHexagonParams) {
    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    this.startTime = params.startTime || (seed % 10000) / 1000;

    this.proceduralParams = {
      size: rng.uniform(PROCEDURAL_RANGES.SIZE.min, PROCEDURAL_RANGES.SIZE.max),
      rotationSpeed: rng.uniform(PROCEDURAL_RANGES.ROTATION_SPEED.min, PROCEDURAL_RANGES.ROTATION_SPEED.max),
      opacity: rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max),
      timeSpeed: rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),
    };

    this.params = params;

    const color = new THREE.Color(params.planetColor);

    const hexColor = color.clone();
    hexColor.multiplyScalar(1 - params.hexagonData.color_darken_factor);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        planetColor: { value: color },
        hexagonColor: { value: hexColor },
        darkenFactor: { value: params.hexagonData.color_darken_factor },
        opacity: { value: this.proceduralParams.opacity },
        hexagonRadius: { value: this.proceduralParams.size },
        rotationSpeed: { value: this.proceduralParams.rotationSpeed },
        pole: { value: params.hexagonData.pole === "north" ? 1.0 : -1.0 },
        visibility: { value: 1.0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      blending: params.hexagonData.nebula_blend ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const geometry = this.createCurvedHexagonGeometry(params.hexagonData.pole, params.hexagonData.radius);

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.scale.set(params.planetRadius, params.planetRadius, params.planetRadius);

    this.updateVisibility();
  }

  private updateVisibility(): void {
    if (!this.params.hexagonData.enabled) {
      this.material.uniforms.visibility.value = 0;
      return;
    }

    const currentTime = this.params.currentTime || 0;
    const cycleProgress = (currentTime % this.params.hexagonData.cycle_duration_years) / this.params.hexagonData.cycle_duration_years;
    const visibleFraction = this.params.hexagonData.visible_duration_years / this.params.hexagonData.cycle_duration_years;

    if (cycleProgress < visibleFraction) {
      const localProgress = cycleProgress / visibleFraction;
      if (localProgress < 0.1) {
        this.material.uniforms.visibility.value = localProgress / 0.1;
      } else if (localProgress > 0.9) {
        this.material.uniforms.visibility.value = (1 - localProgress) / 0.1;
      } else {
        this.material.uniforms.visibility.value = 1.0;
      }
    } else {
      this.material.uniforms.visibility.value = 0.0;
    }
  }

  setCosmicTime(cosmicTimeSeconds: number): void {
    const cosmicTimeYears = cosmicTimeSeconds / (365.25 * 24 * 3600);
    this.params.currentTime = cosmicTimeYears;
  }

  update(deltaTime: number): void {
    const cosmicOriginTime = DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.proceduralParams.timeSpeed, this.startTime);

    this.material.uniforms.time.value = currentTime;

    this.updateVisibility();
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.mesh);
  }

  removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.mesh);
  }

  dispose(): void {
    this.material.dispose();
    this.mesh.geometry.dispose();
  }

  private createCurvedHexagonGeometry(pole: "north" | "south", hexRadius: number): THREE.BufferGeometry {
    const poleDirection = pole === "north" ? 1 : -1;

    const segments = 64;
    const size = 1.0;

    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);

    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);

      const x = vertex.x;
      const z = vertex.y;

      const distance = Math.sqrt(x * x + z * z);

      if (distance <= size / 2) {
        const sphereRadius = 1.02;
        const angle = distance * Math.PI * 0.5;

        const sphereY = poleDirection * Math.cos(angle) * sphereRadius;
        const radialDistance = Math.sin(angle) * sphereRadius;

        if (distance > 0) {
          const normalizedX = x / distance;
          const normalizedZ = z / distance;

          vertex.x = normalizedX * radialDistance;
          vertex.y = sphereY;
          vertex.z = normalizedZ * radialDistance;
        } else {
          vertex.x = 0;
          vertex.y = poleDirection * sphereRadius;
          vertex.z = 0;
        }
      }

      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();

    return geometry;
  }

  setEnabled(enabled: boolean): void {
    this.mesh.visible = enabled;
  }
}

export function createPolarHexagonFromPythonData(pythonData: any, planetRadius: number): PolarHexagonEffect | null {
  const surface = pythonData.surface_elements;

  if (!surface?.polar_hexagon?.enabled) {
    return null;
  }

  const baseColor = pythonData.planet_info?.base_color || "#FFFFFF";
  const currentTimeYears = pythonData.timing?.elapsed_time ? pythonData.timing.elapsed_time / (365.25 * 24 * 3600) : 0;

  const seed = pythonData.seeds?.planet_seed || pythonData.seeds?.shape_seed || Math.floor(Math.random() * 1000000);

  const params: PolarHexagonParams = {
    planetColor: baseColor,
    hexagonData: surface.polar_hexagon,
    planetRadius: planetRadius,
    currentTime: currentTimeYears,
    seed: seed + 5000,
    startTime: (seed % 10000) / 1000,
  };

  return new PolarHexagonEffect(params);
}
