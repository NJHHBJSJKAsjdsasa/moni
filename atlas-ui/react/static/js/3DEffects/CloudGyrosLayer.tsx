// atlas-ui/react/static/js/3DEffects/CloudGyrosLayer.tsx
import * as THREE from "three";
import { PlanetLayerSystem } from "../3DComponents/PlanetLayerSystem";
import { SeededRandom } from "../Utils/SeededRandom.tsx";

export interface StormData {
  x: number;
  y: number;
  z: number;
  size: number;
  intensity: number;
  spiralSpeed: number;
  animationSpeed: number;
}

export interface CloudGyrosLayerParams {
  stormCenters?: Array<StormData>;
  stormColor?: THREE.Color | number[];
  stormIntensity?: number;
  spiralSpeed?: number;
  animationSpeed?: number;
  opacity?: number;
  seed?: number;
}

const PROCEDURAL_RANGES = {
  STORM_COUNT: { min: 1, max: 4 },
  STORM_CENTERS: { min: -1.2, max: 1.2 },
  STORM_SIZE: { min: 0.15, max: 0.3 },
  STORM_INTENSITY: { min: 0.6, max: 1.2 },
  SPIRAL_SPEED: { min: 0.5, max: 1.5 },
  ANIMATION_SPEED: { min: 0.1, max: 0.5 },
  OPACITY: { min: 0.1, max: 0.3 },
};

export class CloudGyrosLayer {
  private layerMesh?: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private params: CloudGyrosLayerParams;
  private layerSystem: PlanetLayerSystem;

  private static readonly vertexShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec2 vUv;
    
    void main() {
      vPosition = position;
      vNormal = normalMatrix * normal;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  private static readonly fragmentShader = `
    uniform float time;
    uniform vec3 stormColor;
    uniform vec3 stormCenters3D[30];
    uniform float stormSizes[30];
    uniform float stormIntensities[30];
    uniform float spiralSpeeds[30];
    uniform float animationSpeeds[30];
    uniform int numStorms;
    uniform vec3 lightDirection;
    uniform vec3 lightPosition;
    uniform float ambientStrength;
    uniform float lightIntensity;
    uniform float opacity;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec2 vUv;
    
    float createGyroSpirals(vec3 pos) {
      float storms = 0.0;
      
      for(int i = 0; i < 30; i++) {
        if(i >= numStorms) break;
        
        vec3 stormCenter3D = normalize(stormCenters3D[i]);
        float stormSize = stormSizes[i];
        float stormIntensity = stormIntensities[i];
        float spiralSpeed = spiralSpeeds[i];
        float animationSpeed = animationSpeeds[i];

        float dotProduct = dot(pos, stormCenter3D);
        float angularDist = acos(clamp(dotProduct, -1.0, 1.0));
        
        if(angularDist < stormSize) {

          vec3 tangent = normalize(cross(stormCenter3D, vec3(0.0, 0.0, 1.0)));
          if(length(cross(stormCenter3D, vec3(0.0, 0.0, 1.0))) < 0.1) {
            tangent = normalize(cross(stormCenter3D, vec3(1.0, 0.0, 0.0)));
          }
          
          vec3 toPoint = pos - stormCenter3D * dot(pos, stormCenter3D);
          float angle = atan(dot(toPoint, cross(stormCenter3D, tangent)), dot(toPoint, tangent));

          float spiralFreq = 2.0 + spiralSpeed * 8.0;
          float radialFreq = 5.0 + spiralSpeed * 15.0;
          float spiral = sin(angle * spiralFreq + angularDist * radialFreq - time * animationSpeed * 2.0);

          spiral = smoothstep(-0.4, 1.2, spiral + 0.5);

          float cloudNoise = sin(angularDist * 25.0 + time * animationSpeed) * 0.3;
          spiral = spiral * (0.7 + cloudNoise * 0.3);

          spiral = spiral * (0.3 + stormIntensity * 0.7);

          float falloffStart = stormSize * 0.3;
          float falloffRange = stormSize - falloffStart;
          float falloff = 1.0;
          
          if(angularDist > falloffStart) {
            falloff = 1.0 - ((angularDist - falloffStart) / falloffRange);

            falloff = smoothstep(0.0, 1.0, falloff);
            falloff = smoothstep(0.0, 1.0, falloff);
            falloff = pow(falloff, 0.7);
          }

          float stormIntensityValue = falloff * spiral * stormIntensity * 0.3;
          storms += stormIntensityValue;
        }
      }

      return storms;
    }
    
    void main() {
      vec3 pos = normalize(vPosition);

      vec3 normal = normalize(vWorldNormal);
      vec3 lightDir = normalize(lightPosition - vWorldPosition);
      float dotNL = dot(normal, lightDir);

      float dayNight = smoothstep(-0.3, 0.1, dotNL);

      float rimLight = 1.0 - abs(dotNL);
      rimLight = pow(rimLight, 3.0) * 0.1;

      float totalLight = ambientStrength + (lightIntensity * dayNight) + rimLight;

      float storms = createGyroSpirals(pos);

      vec3 color = stormColor * totalLight;
      float alpha = clamp(storms * opacity * 3.0, 0.0, 0.8);
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  constructor(layerSystem: PlanetLayerSystem, params: CloudGyrosLayerParams = {}) {
    this.layerSystem = layerSystem;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    this.params = {
      stormCenters: params.stormCenters || this.generateStormCenters(seed),
      stormColor: params.stormColor || new THREE.Color(0xff3030),
      stormIntensity: params.stormIntensity || rng.uniform(PROCEDURAL_RANGES.STORM_INTENSITY.min, PROCEDURAL_RANGES.STORM_INTENSITY.max),
      spiralSpeed: params.spiralSpeed || rng.uniform(PROCEDURAL_RANGES.SPIRAL_SPEED.min, PROCEDURAL_RANGES.SPIRAL_SPEED.max),
      animationSpeed: params.animationSpeed || rng.uniform(PROCEDURAL_RANGES.ANIMATION_SPEED.min, PROCEDURAL_RANGES.ANIMATION_SPEED.max),
      opacity: params.opacity || rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max),
      seed,
    };

    this.material = this.createShaderMaterial();

    this.layerMesh = this.layerSystem.addEffectLayer("cloudGyros", this.material, 1.002, this);
  }

  private createShaderMaterial(): THREE.ShaderMaterial {
    const centers3DArray = new Array(90).fill(0);
    const sizesArray = new Array(30).fill(0.25);
    const intensitiesArray = new Array(30).fill(1.0);
    const spiralSpeedsArray = new Array(30).fill(1.0);
    const animationSpeedsArray = new Array(30).fill(1.0);

    if (this.params.stormCenters) {
      this.params.stormCenters.forEach((storm: StormData, i: number) => {
        if (i < 30) {
          centers3DArray[i * 3] = storm.x;
          centers3DArray[i * 3 + 1] = storm.y;
          centers3DArray[i * 3 + 2] = storm.z;

          sizesArray[i] = storm.size;
          intensitiesArray[i] = storm.intensity;
          spiralSpeedsArray[i] = storm.spiralSpeed;
          animationSpeedsArray[i] = storm.animationSpeed;
        }
      });
    }

    return new THREE.ShaderMaterial({
      vertexShader: CloudGyrosLayer.vertexShader,
      fragmentShader: CloudGyrosLayer.fragmentShader,
      uniforms: {
        time: { value: 0 },
        stormColor: { value: this.params.stormColor || new THREE.Color(0xff3030) },
        opacity: { value: this.params.opacity || PROCEDURAL_RANGES.OPACITY.max },
        stormCenters3D: { value: centers3DArray },
        stormSizes: { value: sizesArray },
        stormIntensities: { value: intensitiesArray },
        spiralSpeeds: { value: spiralSpeedsArray },
        animationSpeeds: { value: animationSpeedsArray },
        numStorms: { value: this.params.stormCenters ? Math.min(this.params.stormCenters.length, 30) : 30 },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        lightPosition: { value: new THREE.Vector3(1, 1, 1) },
        ambientStrength: { value: 0.2 },
        lightIntensity: { value: 1.0 },
      },
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  private generateStormCenters(seed: number): Array<StormData> {
    const normalizedSeed = Math.abs(seed % 1000000);

    const storms: Array<StormData> = [];

    const stormRng = new SeededRandom(normalizedSeed);
    const stormCount = Math.floor(stormRng.uniform(PROCEDURAL_RANGES.STORM_COUNT.min, PROCEDURAL_RANGES.STORM_COUNT.max + 1));

    for (let i = 0; i < stormCount; i++) {
      const stormSeed = normalizedSeed + i * 7919;
      const stormRng = new SeededRandom(stormSeed);

      const phi = stormRng.uniform(0, Math.PI * 2);
      const theta = Math.acos(stormRng.uniform(-1, 1));

      const x = Math.sin(theta) * Math.cos(phi);
      const y = Math.sin(theta) * Math.sin(phi);
      const z = Math.cos(theta);

      const size = stormRng.uniform(PROCEDURAL_RANGES.STORM_SIZE.min, PROCEDURAL_RANGES.STORM_SIZE.max);
      const intensity = stormRng.uniform(PROCEDURAL_RANGES.STORM_INTENSITY.min, PROCEDURAL_RANGES.STORM_INTENSITY.max);
      const spiralSpeed = stormRng.uniform(PROCEDURAL_RANGES.SPIRAL_SPEED.min, PROCEDURAL_RANGES.SPIRAL_SPEED.max);
      const animationSpeed = stormRng.uniform(PROCEDURAL_RANGES.ANIMATION_SPEED.min, PROCEDURAL_RANGES.ANIMATION_SPEED.max);

      storms.push({
        x,
        y,
        z,
        size,
        intensity,
        spiralSpeed,
        animationSpeed,
      });
    }

    return storms;
  }

  update(deltaTime: number): void {
    if (this.material.uniforms.time) {
      this.material.uniforms.time.value += deltaTime;
    }
  }

  updateParams(newParams: Partial<CloudGyrosLayerParams>): void {
    this.params = { ...this.params, ...newParams };

    if (newParams.stormIntensity !== undefined) {
      const intensities = this.material.uniforms.stormIntensities.value;
      for (let i = 0; i < intensities.length; i++) {
        intensities[i] = newParams.stormIntensity;
      }
    }
    if (newParams.spiralSpeed !== undefined) {
      const spiralSpeeds = this.material.uniforms.spiralSpeeds.value;
      for (let i = 0; i < spiralSpeeds.length; i++) {
        spiralSpeeds[i] = newParams.spiralSpeed;
      }
    }
    if (newParams.animationSpeed !== undefined) {
      const animationSpeeds = this.material.uniforms.animationSpeeds.value;
      for (let i = 0; i < animationSpeeds.length; i++) {
        animationSpeeds[i] = newParams.animationSpeed;
      }
    }
    if (newParams.opacity !== undefined) {
      this.material.uniforms.opacity.value = newParams.opacity;
    }
  }

  dispose(): void {}
}

export function createCloudGyrosLayerFromPythonData(layerSystem: PlanetLayerSystem, gasGiantData: any, globalSeed?: number): CloudGyrosLayer {
  const storms = gasGiantData.storms || {};

  const seed = globalSeed || Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed + 5000);

  const params: CloudGyrosLayerParams = {
    stormCenters: storms.centers || undefined,
    stormColor: new THREE.Color(0xff3030),
    stormIntensity: storms.intensity || gasGiantData.storm_intensity || rng.uniform(PROCEDURAL_RANGES.STORM_INTENSITY.min, PROCEDURAL_RANGES.STORM_INTENSITY.max),
    spiralSpeed: storms.spiral_speed || rng.uniform(PROCEDURAL_RANGES.SPIRAL_SPEED.min, PROCEDURAL_RANGES.SPIRAL_SPEED.max),
    animationSpeed: rng.uniform(PROCEDURAL_RANGES.ANIMATION_SPEED.min, PROCEDURAL_RANGES.ANIMATION_SPEED.max),
    opacity: rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max),
    seed,
  };

  return new CloudGyrosLayer(layerSystem, params);
}
