// atlas-ui/react/static/js/3DEffects/OceanWaves.tsx

import * as THREE from "three";
import { getPlanetBaseColor } from "./PlanetColorBase";

export interface OceanWavesParams {
  waveIntensity?: number;
  waveSpeed?: number;
  waveScale?: number;

  landmassThreshold?: number;
  landmassColor?: THREE.Color | number[];

  deepOceanThreshold?: number;
  deepOceanMultiplier?: number;

  foamThreshold?: number;
  foamColor?: THREE.Color | number[];
  foamIntensity?: number;

  oceanColor?: THREE.Color | number[];
}

export class OceanWavesEffect {
  private material: THREE.ShaderMaterial;
  private params: OceanWavesParams;
  private oceanLayerMesh?: THREE.Mesh;

  private static readonly vertexShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  private static readonly fragmentShader = `
    uniform float time;
    uniform vec3 baseColor;
    
    uniform float waveIntensity;
    uniform float waveSpeed;
    uniform float waveScale;
    
    uniform float landmassThreshold;
    uniform vec3 landmassColor;
    
    uniform float deepOceanThreshold;
    uniform float deepOceanMultiplier;
    
    uniform float foamThreshold;
    uniform vec3 foamColor;
    uniform float foamIntensity;
    
    uniform vec3 oceanColor;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }
    
    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float n = i.x + i.y * 57.0 + 113.0 * i.z;
      return mix(
        mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
            mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
            mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
    }
    
    float fractalNoise(vec3 p, int octaves) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for(int i = 0; i < 6; i++) {
        if(i >= octaves) break;
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      
      return value;
    }
    
    void main() {
      vec3 pos = normalize(vPosition);
      vec3 color = oceanColor;
      
      float waves1 = sin(pos.x * waveScale + time * waveSpeed) * sin(pos.z * waveScale + time * waveSpeed * 1.5);
      float waves2 = sin(pos.x * waveScale * 1.5 - time * waveSpeed * 1.8) * sin(pos.z * waveScale * 1.2 + time * waveSpeed * 2.2);
      float waves3 = sin(pos.x * waveScale * 2.0 + time * waveSpeed * 0.7) * sin(pos.z * waveScale * 2.5 - time * waveSpeed * 1.3);
      
      float totalWaves = (waves1 + waves2 * 0.5 + waves3 * 0.3) * waveIntensity;
      
      vec3 waveColor = vec3(0.0, 0.2, 0.4);
      color += waveColor * totalWaves;
      
      float landmass = fractalNoise(pos * 3.0, 4);
      if(landmass > landmassThreshold) {
        float landIntensity = smoothstep(landmassThreshold, 0.7, landmass);
        color = mix(color, landmassColor, landIntensity);
      }
      
      float depth = fractalNoise(pos * 6.0 + vec3(time * 0.1), 3);
      if(depth < deepOceanThreshold) {
        color *= deepOceanMultiplier;
      }
      
      float foam = fractalNoise(pos * 20.0 + vec3(time * 3.0), 2);
      if(foam > foamThreshold) {
        float foamMix = smoothstep(foamThreshold, 1.0, foam) * foamIntensity;
        color = mix(color, foamColor, foamMix);
      }
      
      float caustics = sin(pos.x * 30.0 + time * 4.0) * sin(pos.z * 25.0 + time * 3.5);
      caustics = pow(max(caustics, 0.0), 3.0);
      color += vec3(0.1, 0.3, 0.5) * caustics * 0.2;
      
      float fresnel = pow(1.0 - abs(dot(vNormal, normalize(vWorldPosition))), 2.0);
      vec3 reflectionColor = vec3(0.8, 0.9, 1.0);
      color = mix(color, reflectionColor, fresnel * 0.3);
      
      vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
      float lighting = dot(vNormal, lightDirection) * 0.5 + 0.5;
      
      float waterAttenuation = 0.7 + 0.3 * lighting;
      color *= waterAttenuation;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  constructor(params: OceanWavesParams = {}) {
    this.params = {
      waveIntensity: params.waveIntensity || 0.3,
      waveSpeed: params.waveSpeed || 2.0,
      waveScale: params.waveScale || 8.0,
      landmassThreshold: params.landmassThreshold || 0.3,
      landmassColor: params.landmassColor || new THREE.Color(0.4, 0.6, 0.2),
      deepOceanThreshold: params.deepOceanThreshold || 0.2,
      deepOceanMultiplier: params.deepOceanMultiplier || 0.5,
      foamThreshold: params.foamThreshold || 0.8,
      foamColor: params.foamColor || new THREE.Color(0.9, 0.9, 1.0),
      foamIntensity: params.foamIntensity || 0.4,
      oceanColor: params.oceanColor || new THREE.Color(0.1, 0.3, 0.6),
      ...params,
    };

    this.material = this.createMaterial();
  }

  private createMaterial(): THREE.ShaderMaterial {
    const landmassColor = this.params.landmassColor instanceof THREE.Color ? this.params.landmassColor : new THREE.Color(this.params.landmassColor as any);
    const foamColor = this.params.foamColor instanceof THREE.Color ? this.params.foamColor : new THREE.Color(this.params.foamColor as any);
    const oceanColor = this.params.oceanColor instanceof THREE.Color ? this.params.oceanColor : new THREE.Color(this.params.oceanColor as any);

    return new THREE.ShaderMaterial({
      vertexShader: OceanWavesEffect.vertexShader,
      fragmentShader: OceanWavesEffect.fragmentShader,
      uniforms: {
        time: { value: 0 },
        baseColor: { value: oceanColor },

        waveIntensity: { value: this.params.waveIntensity },
        waveSpeed: { value: this.params.waveSpeed },
        waveScale: { value: this.params.waveScale },

        landmassThreshold: { value: this.params.landmassThreshold },
        landmassColor: { value: landmassColor },

        deepOceanThreshold: { value: this.params.deepOceanThreshold },
        deepOceanMultiplier: { value: this.params.deepOceanMultiplier },

        foamThreshold: { value: this.params.foamThreshold },
        foamColor: { value: foamColor },
        foamIntensity: { value: this.params.foamIntensity },

        oceanColor: { value: oceanColor },
      },
    });
  }

  apply(mesh: THREE.Mesh): void {
    this.createOceanLayer(mesh);
  }

  private createOceanLayer(baseMesh: THREE.Mesh): void {
    const geometry = baseMesh.geometry.clone();

    geometry.scale(1.002, 1.002, 1.002);

    const oceanMesh = new THREE.Mesh(geometry, this.material);

    oceanMesh.position.copy(baseMesh.position);
    oceanMesh.rotation.copy(baseMesh.rotation);

    this.oceanLayerMesh = oceanMesh;
  }

  update(deltaTime: number, planetRotation?: number): void {
    this.material.uniforms.time.value += deltaTime;

    if (this.oceanLayerMesh && planetRotation !== undefined) {
      this.oceanLayerMesh.rotation.y = planetRotation;
    }
  }

  updateParams(newParams: Partial<OceanWavesParams>): void {
    this.params = { ...this.params, ...newParams };

    Object.keys(newParams).forEach((key) => {
      const value = newParams[key as keyof OceanWavesParams];
      if (value !== undefined && this.material.uniforms[key]) {
        if (value instanceof THREE.Color || Array.isArray(value)) {
          const color = value instanceof THREE.Color ? value : new THREE.Color(value as any);
          this.material.uniforms[key].value = color;
        } else {
          this.material.uniforms[key].value = value;
        }
      }
    });
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (this.oceanLayerMesh) {
      if (planetPosition) {
        this.oceanLayerMesh.position.copy(planetPosition);
      }
      scene.add(this.oceanLayerMesh);
    }
  }

  getMaterial(): THREE.ShaderMaterial {
    return this.material;
  }

  dispose(): void {
    this.material.dispose();
    if (this.oceanLayerMesh) {
      if (this.oceanLayerMesh.geometry) {
        this.oceanLayerMesh.geometry.dispose();
      }
      this.oceanLayerMesh = undefined;
    }
  }
}

export function createOceanWavesFromPythonData(pythonData: any): OceanWavesEffect {
  const baseColor = getPlanetBaseColor(pythonData);
  const oceanColor = [baseColor.r, baseColor.g, baseColor.b];

  let waveIntensity = 0.3;
  let waveSpeed = 2.0;
  let waveScale = 8.0;
  let landmassThreshold = 0.3;
  let deepOceanThreshold = 0.2;

  if (pythonData.seeds) {
    const seed = pythonData.seeds.shape_seed;
    const rng = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
      };
    };

    const random = rng(seed);
    waveIntensity = 0.2 + random() * 0.3;
    waveSpeed = 1.5 + random() * 1.5;
    waveScale = 6.0 + random() * 6.0;
    landmassThreshold = 0.25 + random() * 0.15;
    deepOceanThreshold = 0.15 + random() * 0.1;
  }

  const params: OceanWavesParams = {
    waveIntensity,
    waveSpeed,
    waveScale,
    landmassThreshold,
    deepOceanThreshold,
    deepOceanMultiplier: 0.5,
    foamThreshold: 0.8,
    foamColor: new THREE.Color(0.9, 0.9, 1.0),
    foamIntensity: 0.4,
    oceanColor: oceanColor,
  };

  return new OceanWavesEffect(params);
}
