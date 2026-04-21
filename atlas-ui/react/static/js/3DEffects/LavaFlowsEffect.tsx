// atlas-ui/react/static/js/3DEffects/LavaFlowsEffect.tsx

import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime";

export interface LavaFlowsParams {
  flowCount?: number;
  flowLength?: number;
  flowWidth?: number;
  flowIntensity?: number;

  flowSpeed?: number;
  pulseSpeed?: number;
  turbulence?: number;
  emergenceHeight?: number;

  coreColor?: THREE.Color | number[];
  hotColor?: THREE.Color | number[];
  coolColor?: THREE.Color | number[];

  emissiveIntensity?: number;
  glowRadius?: number;
  sparkleIntensity?: number;

  seed?: number;
  startTime?: number;
  timeSpeed?: number;
  cosmicOriginTime?: number;
}

const PROCEDURAL_RANGES = {
  FLOW_COUNT: { min: 20, max: 35 },
  FLOW_LENGTH: { min: 0.4, max: 1.2 },
  FLOW_WIDTH: { min: 0.015, max: 0.08 },
  FLOW_INTENSITY: { min: 1.5, max: 3.0 },
  FLOW_SPEED: { min: 0.05, max: 0.3 },
  PULSE_SPEED: { min: 0.5, max: 1.2 },
  TURBULENCE: { min: 0.8, max: 2.0 },
  EMISSIVE_INTENSITY: { min: 3.0, max: 5.0 },
  GLOW_RADIUS: { min: 1.1, max: 1.3 },
  TIME_SPEED: { min: 0.1, max: 2.0 },
  EMERGENCE_HEIGHT: { min: 0.01, max: 0.03 },
};

export class LavaFlowsEffect {
  private lavaGroup: THREE.Group;
  private lavaFlows: THREE.Mesh[] = [];
  private material: THREE.ShaderMaterial;
  private params: LavaFlowsParams;
  private startTime: number;

  private static readonly vertexShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying float vEmergence;
    
    uniform float time;
    uniform float flowSpeed;
    uniform float turbulence;
    uniform float emergenceHeight;
    
    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      
      vec3 pos = position;
      
      float flowProgress = vUv.x;
      
      float emergenceWave = sin((flowProgress * 3.14159 * 2.0) - time * flowSpeed * 2.0);
      
      emergenceWave += sin((flowProgress * 6.28318) + time * flowSpeed) * 0.3;
      
      float edgeFade = smoothstep(0.0, 0.1, flowProgress) * smoothstep(1.0, 0.9, flowProgress);
      emergenceWave *= edgeFade;
      
      float maxEmergence = emergenceHeight * (1.0 + sin(worldPosition.x * 10.0) * 0.5);
      
      float emergence = emergenceWave * maxEmergence;
      vEmergence = emergence;
      
      float flowNoise = sin(time * flowSpeed + worldPosition.x * 2.0) * 0.05;
      flowNoise += cos(time * flowSpeed * 1.3 + worldPosition.z * 1.5) * 0.03;
      
      float turbulentMotion = sin(time * turbulence + worldPosition.y * 3.0) * 0.02;
      turbulentMotion += cos(time * turbulence * 0.7 + length(worldPosition.xz) * 4.0) * 0.015;
      
      pos += normal * (emergence + flowNoise + turbulentMotion);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  private static readonly fragmentShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying float vEmergence;
    
    uniform float time;
    uniform float flowIntensity;
    uniform float pulseSpeed;
    uniform vec3 coreColor;
    uniform vec3 hotColor;
    uniform vec3 coolColor;
    uniform float emissiveIntensity;
    uniform float glowRadius;
    uniform vec3 lightDirection;
    uniform vec3 lightPosition;
    
    float random3D(vec3 st) {
      return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 54.321))) * 43758.5453123);
    }

    float noise3D(vec3 st) {
      vec3 i = floor(st);
      vec3 f = fract(st);

      f = f * f * (3.0 - 2.0 * f);

      float a = random3D(i);
      float b = random3D(i + vec3(1.0, 0.0, 0.0));
      float c = random3D(i + vec3(0.0, 1.0, 0.0));
      float d = random3D(i + vec3(1.0, 1.0, 0.0));
      float e = random3D(i + vec3(0.0, 0.0, 1.0));
      float f2 = random3D(i + vec3(1.0, 0.0, 1.0));
      float g = random3D(i + vec3(0.0, 1.0, 1.0));
      float h = random3D(i + vec3(1.0, 1.0, 1.0));

      return mix(
        mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
        mix(mix(e, f2, f.x), mix(g, h, f.x), f.y),
        f.z
      );
    }

    float fbm3D(vec3 st, int octaves) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;

      for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * noise3D(st * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    float voronoi(vec3 p) {
      vec3 n = floor(p);
      vec3 f = fract(p);

      float minDist = 1.0;

      for(int i = -1; i <= 1; i++) {
        for(int j = -1; j <= 1; j++) {
          for(int k = -1; k <= 1; k++) {
            vec3 neighbor = vec3(float(i), float(j), float(k));
            vec3 point = neighbor + random3D(n + neighbor) - f;
            float dist = length(point);
            minDist = min(minDist, dist);
          }
        }
      }

      return minDist;
    }
    
    void main() {
      vec3 flowPos = vWorldPosition;
      vec3 flowDirection = vec3(time * 0.1, time * 0.05, 0.0);

      float lavaTexture1 = fbm3D(flowPos * 6.0 + flowDirection, 6);
      float lavaTexture2 = fbm3D(flowPos * 12.0 + flowDirection * 1.5, 5);
      float lavaTexture3 = fbm3D(flowPos * 24.0 + flowDirection * 2.0, 4);
      float lavaTexture4 = fbm3D(flowPos * 48.0 + flowDirection * 2.5, 3);

      float combinedTexture = lavaTexture1 * 0.4 + lavaTexture2 * 0.3 + lavaTexture3 * 0.2 + lavaTexture4 * 0.1;

      float cracks = voronoi(flowPos * 20.0);
      cracks = smoothstep(0.05, 0.15, cracks);

      float temperaturePulse = sin(time * pulseSpeed + flowPos.x * 2.0) * 0.3 + 0.7;
      temperaturePulse *= sin(time * pulseSpeed * 0.7 + flowPos.y * 1.5) * 0.2 + 0.8;

      float hotspots = smoothstep(0.85, 0.95, noise3D(flowPos * 10.0 + vec3(time * 0.05)));

      float emergenceGlow = abs(vEmergence) * 8.0;

      float heatIntensity = combinedTexture + temperaturePulse * 0.2 + emergenceGlow + hotspots * 0.3;

      float crackGlow = (1.0 - cracks) * 0.6;
      heatIntensity += crackGlow;

      vec3 baseColor;
      float coolToHot = smoothstep(0.3, 0.5, heatIntensity);
      float hotToCore = smoothstep(0.65, 0.85, heatIntensity);

      vec3 coolToHotMix = mix(coolColor, hotColor, coolToHot);
      baseColor = mix(coolToHotMix, coreColor, hotToCore);

      float crustTexture = fbm3D(flowPos * 40.0, 6);
      vec3 crustColor = coolColor * (0.4 + crustTexture * 0.3);
      float crustFactor = smoothstep(0.5, 0.3, heatIntensity);
      baseColor = mix(baseColor, crustColor, crustFactor * cracks);

      vec3 lightDir;
      if (length(lightPosition) > 0.0) {
        lightDir = normalize(lightPosition - vWorldPosition);
      } else {
        lightDir = normalize(-lightDirection);
      }

      float lambertian = max(dot(vNormal, lightDir), 0.0);
      float dayNight = smoothstep(-0.3, 0.1, lambertian);

      vec3 diffuse = baseColor * (0.2 + lambertian * 0.8);

      float emissiveStrength = smoothstep(0.4, 0.8, heatIntensity);
      vec3 emissive = baseColor * emissiveIntensity * emissiveStrength * (0.7 + temperaturePulse * 0.3);

      float emissiveFactor = mix(0.4, 1.0, dayNight);
      emissiveFactor += emergenceGlow * 0.15;
      emissiveFactor += crackGlow * 0.2;
      emissiveFactor = min(1.0, emissiveFactor);

      vec3 result = diffuse + (emissive * emissiveFactor);

      vec2 center = vec2(0.5);
      float distFromCenter = length(vUv - center);
      float edgeFade = smoothstep(0.5, 0.2, distFromCenter);
      float alpha = heatIntensity * flowIntensity * edgeFade * (0.7 + emissiveStrength * 0.3);

      gl_FragColor = vec4(result, alpha);
    }
  `;

  constructor(planetRadius: number, params: LavaFlowsParams = {}) {
    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    this.startTime = params.startTime || (seed % 10000) / 1000;

    const moltenCoreColor = new THREE.Color(0xff8c00);
    const hsl = { h: 0, s: 0, l: 0 };
    moltenCoreColor.getHSL(hsl);

    this.params = {
      flowCount: params.flowCount || Math.floor(rng.uniform(PROCEDURAL_RANGES.FLOW_COUNT.min, PROCEDURAL_RANGES.FLOW_COUNT.max)),
      flowLength: params.flowLength || rng.uniform(PROCEDURAL_RANGES.FLOW_LENGTH.min, PROCEDURAL_RANGES.FLOW_LENGTH.max),
      flowWidth: params.flowWidth || rng.uniform(PROCEDURAL_RANGES.FLOW_WIDTH.min, PROCEDURAL_RANGES.FLOW_WIDTH.max),
      flowIntensity: params.flowIntensity || rng.uniform(PROCEDURAL_RANGES.FLOW_INTENSITY.min, PROCEDURAL_RANGES.FLOW_INTENSITY.max),
      flowSpeed: params.flowSpeed || rng.uniform(PROCEDURAL_RANGES.FLOW_SPEED.min, PROCEDURAL_RANGES.FLOW_SPEED.max),
      pulseSpeed: params.pulseSpeed || rng.uniform(PROCEDURAL_RANGES.PULSE_SPEED.min, PROCEDURAL_RANGES.PULSE_SPEED.max),
      turbulence: params.turbulence || rng.uniform(PROCEDURAL_RANGES.TURBULENCE.min, PROCEDURAL_RANGES.TURBULENCE.max),

      coreColor: params.coreColor instanceof THREE.Color ? params.coreColor : new THREE.Color().setHSL(hsl.h, 1.0, 0.6),
      hotColor: params.hotColor instanceof THREE.Color ? params.hotColor : new THREE.Color().setHSL(hsl.h + 0.05, 0.9, 0.5),
      coolColor: params.coolColor instanceof THREE.Color ? params.coolColor : new THREE.Color().setHSL(hsl.h - 0.05, 0.8, 0.3),

      emissiveIntensity: params.emissiveIntensity || rng.uniform(PROCEDURAL_RANGES.EMISSIVE_INTENSITY.min, PROCEDURAL_RANGES.EMISSIVE_INTENSITY.max),
      glowRadius: params.glowRadius || rng.uniform(PROCEDURAL_RANGES.GLOW_RADIUS.min, PROCEDURAL_RANGES.GLOW_RADIUS.max),
      sparkleIntensity: params.sparkleIntensity || 1.0,
      emergenceHeight: params.emergenceHeight || rng.uniform(PROCEDURAL_RANGES.EMERGENCE_HEIGHT.min, PROCEDURAL_RANGES.EMERGENCE_HEIGHT.max),

      seed,
      startTime: this.startTime,
      timeSpeed: params.timeSpeed || rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),
    };

    this.lavaGroup = new THREE.Group();
    this.material = this.createMaterial();

    this.generateLavaFlows(planetRadius, rng);
  }

  private generateLavaFlows(planetRadius: number, rng: SeededRandom): void {
    const flowCount = this.params.flowCount!;

    for (let i = 0; i < flowCount; i++) {
      const phi = rng.uniform(0, 2 * Math.PI);
      const cosTheta = rng.uniform(-1, 1);
      const theta = Math.acos(cosTheta);

      const startPosition = new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta));

      const flowLength = this.params.flowLength! * rng.uniform(0.7, 1.3);
      const flowWidth = this.params.flowWidth! * rng.uniform(0.8, 1.2);

      const segments = Math.max(16, Math.floor(flowLength * 32));
      const geometry = new THREE.PlaneGeometry(flowLength * planetRadius * 2, flowWidth * planetRadius * 2, segments, 8);

      const normal = startPosition.clone().normalize();
      const tangent1 = new THREE.Vector3();
      const tangent2 = new THREE.Vector3();

      if (Math.abs(normal.y) < 0.99) {
        tangent1.crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize();
      } else {
        tangent1.crossVectors(normal, new THREE.Vector3(1, 0, 0)).normalize();
      }
      tangent2.crossVectors(normal, tangent1).normalize();

      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeBasis(tangent1, tangent2, normal);

      geometry.applyMatrix4(rotationMatrix);

      const positions = geometry.attributes.position;
      const vertex = new THREE.Vector3();
      const surfacePosition = startPosition.clone().multiplyScalar(planetRadius);

      for (let j = 0; j < positions.count; j++) {
        vertex.fromBufferAttribute(positions, j);
        const worldVertex = vertex.clone().add(surfacePosition);

        const direction = worldVertex.clone().normalize();
        const baseElevation = rng.uniform(-0.002, 0.008) * planetRadius;
        const projectedVertex = direction.multiplyScalar(planetRadius + baseElevation);

        const localVertex = projectedVertex.sub(surfacePosition);
        positions.setXYZ(j, localVertex.x, localVertex.y, localVertex.z);
      }

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.translate(surfacePosition.x, surfacePosition.y, surfacePosition.z);

      const flowMaterial = this.material.clone();

      const flowMesh = new THREE.Mesh(geometry, flowMaterial);
      flowMesh.renderOrder = 3;

      this.lavaFlows.push(flowMesh);
      this.lavaGroup.add(flowMesh);
    }
  }

  private createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: LavaFlowsEffect.vertexShader,
      fragmentShader: LavaFlowsEffect.fragmentShader,
      uniforms: {
        time: { value: 0 },
        flowSpeed: { value: this.params.flowSpeed },
        pulseSpeed: { value: this.params.pulseSpeed },
        turbulence: { value: this.params.turbulence },
        flowIntensity: { value: this.params.flowIntensity },
        emergenceHeight: { value: this.params.emergenceHeight },
        coreColor: { value: this.params.coreColor },
        hotColor: { value: this.params.hotColor },
        coolColor: { value: this.params.coolColor },
        emissiveIntensity: { value: this.params.emissiveIntensity },
        glowRadius: { value: this.params.glowRadius },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.lavaGroup.position.copy(planetPosition);
    }
    scene.add(this.lavaGroup);
  }

  update(deltaTime: number): void {
    const rawTime = this.startTime + getUniverseTime(DEFAULT_COSMIC_ORIGIN_TIME) * this.params.timeSpeed!;
    const currentTime = rawTime % 1000;

    this.lavaFlows.forEach((flow) => {
      const material = flow.material as THREE.ShaderMaterial;
      material.uniforms.time.value = currentTime;
    });
  }

  updateLightPosition(position: THREE.Vector3): void {
    this.lavaFlows.forEach((flow) => {
      const material = flow.material as THREE.ShaderMaterial;
      if (material.uniforms.lightPosition) {
        material.uniforms.lightPosition.value.copy(position);
      }
    });
  }

  updateLightDirection(direction: THREE.Vector3): void {
    this.lavaFlows.forEach((flow) => {
      const material = flow.material as THREE.ShaderMaterial;
      if (material.uniforms.lightDirection) {
        material.uniforms.lightDirection.value.copy(direction);
      }
    });
  }

  updateFromThreeLight(light: THREE.DirectionalLight): void {
    this.updateLightPosition(light.position);
    const direction = light.target.position.clone().sub(light.position).normalize();
    this.updateLightDirection(direction);
  }

  getObject3D(): THREE.Group {
    return this.lavaGroup;
  }

  dispose(): void {
    this.lavaFlows.forEach((flow) => {
      flow.geometry.dispose();
      if (flow.material instanceof THREE.Material) {
        flow.material.dispose();
      }
    });
    this.lavaFlows = [];
    this.lavaGroup.clear();
  }
}

export function createLavaFlowsFromPythonData(planetRadius: number, surfaceData: any, globalSeed?: number): LavaFlowsEffect {
  const seed = globalSeed || Math.floor(Math.random() * 1000000);

  const params: LavaFlowsParams = {
    flowCount: 28,
    flowLength: 0.8,
    flowWidth: 0.04,
    flowIntensity: 2.5,
    flowSpeed: 0.15,
    turbulence: 1.5,
    emergenceHeight: 0.02,
    emissiveIntensity: 4.0,
    seed: seed + 7000,
  };

  return new LavaFlowsEffect(planetRadius, params);
}
