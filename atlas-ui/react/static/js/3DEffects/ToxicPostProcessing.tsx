// atlas-ui/react/static/js/3DEffects/ToxicPostProcessing.tsx

import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { getAnimatedUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";
import { SeededRandom } from "../Utils/SeededRandom.tsx";

export interface ToxicPostProcessingParams {
  bloomStrength?: number;
  bloomRadius?: number;
  bloomThreshold?: number;
  chromaticAberrationIntensity?: number;
  godrayIntensity?: number;
  toxicTint?: THREE.Color;
  seed?: number;
  cosmicOriginTime?: number;
}

const PROCEDURAL_RANGES = {
  bloomStrength: {
    min: 0.3,
    max: 0.6,
  },
  bloomRadius: {
    min: 0.4,
    max: 0.8,
  },
  bloomThreshold: {
    min: 0.2,
    max: 0.5,
  },
  godrayIntensity: {
    min: 0.05,
    max: 0.16,
  },
  chromaticAberrationIntensity: {
    min: 0.001,
    max: 0.004,
  },
  timeSpeed: {
    min: 0.6,
    max: 1.8,
  },
  breathingAmplitude: {
    min: 0.05,
    max: 0.2,
  },
  pulseAmplitude: {
    min: 0.02,
    max: 0.1,
  },
} as const;

const ToxicChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    uIntensity: { value: 0.005 },
    uToxicTint: { value: new THREE.Color(0.5, 0.0, 0.8) },
    uTime: { value: 0.0 },
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    uniform vec3 uToxicTint;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      vec2 direction = normalize(vUv - center);
      float distance = length(vUv - center);
      
      float aberration = uIntensity * distance * distance;
      
      float pulse = sin(uTime * 0.5) * 0.3 + 0.7;
      aberration *= pulse;
      
      vec2 offsetR = direction * aberration * 1.2;
      vec2 offsetG = direction * aberration * 0.8;
      vec2 offsetB = direction * aberration * 1.5;
      
      float r = texture2D(tDiffuse, vUv + offsetR).r;
      float g = texture2D(tDiffuse, vUv + offsetG).g;
      float b = texture2D(tDiffuse, vUv + offsetB).b;
      
      vec3 color = vec3(r, g, b);
      
      float brightness = dot(color, vec3(0.299, 0.587, 0.114));
      float toxicMix = smoothstep(0.3, 0.8, brightness) * 0.15;
      color = mix(color, color * uToxicTint, toxicMix);
      
      float breathing = sin(uTime * 1.2) * 0.05 + 1.0;
      color *= breathing;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

const ToxicGodrayShader = {
  uniforms: {
    tDiffuse: { value: null },
    uLightPosition: { value: new THREE.Vector2(0.5, 0.5) },
    uIntensity: { value: 0.3 },
    uSamples: { value: 64 },
    uDecay: { value: 0.96 },
    uWeight: { value: 0.4 },
    uToxicColor: { value: new THREE.Color(0.6, 0.0, 0.8) },
    uTime: { value: 0.0 },
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uLightPosition;
    uniform float uIntensity;
    uniform int uSamples;
    uniform float uDecay;
    uniform float uWeight;
    uniform vec3 uToxicColor;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      
      vec2 deltaTextCoord = (vUv - uLightPosition);
      deltaTextCoord *= 1.0 / float(uSamples) * 0.5;
      
      float illuminationDecay = 1.0;
      vec2 textCord = vUv;
      
      vec3 godrayColor = vec3(0.0);
      for (int i = 0; i < 64; i++) {
        if (i >= uSamples) break;
        
        textCord -= deltaTextCoord;
        vec4 texSample = texture2D(tDiffuse, textCord);
        
        float brightness = dot(texSample.rgb, vec3(0.299, 0.587, 0.114));
        brightness = smoothstep(0.4, 1.0, brightness);
        
        texSample.rgb *= illuminationDecay * uWeight * brightness;
        godrayColor += texSample.rgb;
        illuminationDecay *= uDecay;
      }
      
      float pulse = sin(uTime * 0.8) * 0.2 + 0.8;
      godrayColor *= uIntensity * pulse;
      
      godrayColor = mix(godrayColor, godrayColor * uToxicColor, 0.6);
      
      gl_FragColor = vec4(color.rgb + godrayColor, color.a);
    }
  `,
};

export class ToxicPostProcessingEffect {
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private chromaticAberrationPass: ShaderPass;
  private godrayPass: ShaderPass;
  private renderPass: RenderPass;
  private planetRadius: number;
  private rng: SeededRandom;
  private startTime: number;
  private timeSpeed: number;

  private proceduralParams: {
    bloomStrength: number;
    bloomRadius: number;
    bloomThreshold: number;
    godrayIntensity: number;
    chromaticAberrationIntensity: number;
    timeSpeed: number;
    breathingAmplitude: number;
    pulseAmplitude: number;
  };
  private toxicTint: THREE.Color;

  constructor(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGL2Renderer, planetRadius: number, params: ToxicPostProcessingParams = {}) {
    this.planetRadius = planetRadius;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    this.rng = new SeededRandom(seed);

    this.startTime = this.rng.uniform(0, 1000);

    this.proceduralParams = {
      bloomStrength: this.rng.uniform(PROCEDURAL_RANGES.bloomStrength.min, PROCEDURAL_RANGES.bloomStrength.max),
      bloomRadius: this.rng.uniform(PROCEDURAL_RANGES.bloomRadius.min, PROCEDURAL_RANGES.bloomRadius.max),
      bloomThreshold: this.rng.uniform(PROCEDURAL_RANGES.bloomThreshold.min, PROCEDURAL_RANGES.bloomThreshold.max),
      godrayIntensity: this.rng.uniform(PROCEDURAL_RANGES.godrayIntensity.min, PROCEDURAL_RANGES.godrayIntensity.max),
      chromaticAberrationIntensity: this.rng.uniform(PROCEDURAL_RANGES.chromaticAberrationIntensity.min, PROCEDURAL_RANGES.chromaticAberrationIntensity.max),
      timeSpeed: this.rng.uniform(PROCEDURAL_RANGES.timeSpeed.min, PROCEDURAL_RANGES.timeSpeed.max),
      breathingAmplitude: this.rng.uniform(PROCEDURAL_RANGES.breathingAmplitude.min, PROCEDURAL_RANGES.breathingAmplitude.max),
      pulseAmplitude: this.rng.uniform(PROCEDURAL_RANGES.pulseAmplitude.min, PROCEDURAL_RANGES.pulseAmplitude.max),
    };

    const toxicHue = this.rng.uniform(0.65, 0.95);
    const toxicSaturation = this.rng.uniform(0.7, 1.0);
    const toxicBrightness = this.rng.uniform(0.25, 0.7);
    this.toxicTint = new THREE.Color().setHSL(toxicHue, toxicSaturation, toxicBrightness);

    this.composer = new EffectComposer(renderer);

    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    const bloomStrength = params.bloomStrength || this.proceduralParams.bloomStrength;
    const bloomRadius = params.bloomRadius || this.proceduralParams.bloomRadius;
    const bloomThreshold = params.bloomThreshold || this.proceduralParams.bloomThreshold;

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), bloomStrength, bloomRadius, bloomThreshold);
    this.composer.addPass(this.bloomPass);

    this.godrayPass = new ShaderPass(ToxicGodrayShader);
    this.godrayPass.uniforms.uIntensity.value = params.godrayIntensity || this.proceduralParams.godrayIntensity;
    this.godrayPass.uniforms.uToxicColor.value = this.toxicTint;
    this.composer.addPass(this.godrayPass);

    this.chromaticAberrationPass = new ShaderPass(ToxicChromaticAberrationShader);
    this.chromaticAberrationPass.uniforms.uIntensity.value = params.chromaticAberrationIntensity || this.proceduralParams.chromaticAberrationIntensity;
    this.chromaticAberrationPass.uniforms.uToxicTint.value = this.toxicTint;
    this.composer.addPass(this.chromaticAberrationPass);

    this.chromaticAberrationPass.renderToScreen = true;
  }

  update(_deltaTime: number = 0.016): void {
    const cosmicOriginTime = DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.proceduralParams.timeSpeed, this.startTime);

    this.chromaticAberrationPass.uniforms.uTime.value = currentTime;
    this.godrayPass.uniforms.uTime.value = currentTime;

    const breathingCycle = Math.sin(currentTime * 0.3) * this.proceduralParams.breathingAmplitude + 1.0;
    const pulseCycle = Math.sin(currentTime * 0.7) * this.proceduralParams.pulseAmplitude + 1.0;

    this.bloomPass.strength = this.proceduralParams.bloomStrength * breathingCycle;

    this.chromaticAberrationPass.uniforms.uIntensity.value = this.proceduralParams.chromaticAberrationIntensity * pulseCycle;
  }

  updateLightPosition(lightPosition: THREE.Vector3, camera: THREE.Camera): void {
    const screenPosition = lightPosition.clone().project(camera);

    const uv = new THREE.Vector2((screenPosition.x + 1) / 2, (screenPosition.y + 1) / 2);

    this.godrayPass.uniforms.uLightPosition.value = uv;
  }

  render(): void {
    this.composer.render();
  }

  setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }

  dispose(): void {
    this.composer.dispose();
    this.bloomPass.dispose();
    this.chromaticAberrationPass.dispose();
    this.godrayPass.dispose();
  }
}

export function createToxicPostProcessingFromPythonData(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGL2Renderer, planetRadius: number, surfaceData: any, globalSeed?: number): ToxicPostProcessingEffect | null {
  if (!surfaceData || !surfaceData.planet_type || surfaceData.planet_type !== "toxic") {
    return null;
  }

  const seed = globalSeed || Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed + 20000);

  const toxicIntensity = surfaceData.toxic_intensity || rng.uniform(0.4, 1.0);
  const atmosphereThickness = surfaceData.atmosphere_thickness || rng.uniform(0.3, 0.8);

  const intensityMultiplier = 0.7 + toxicIntensity * 0.6;
  const atmosphereMultiplier = 0.8 + atmosphereThickness * 0.4;

  const bloomStrength = rng.uniform(PROCEDURAL_RANGES.bloomStrength.min * intensityMultiplier, PROCEDURAL_RANGES.bloomStrength.max * intensityMultiplier);

  const bloomRadius = rng.uniform(PROCEDURAL_RANGES.bloomRadius.min, PROCEDURAL_RANGES.bloomRadius.max);

  const bloomThreshold = rng.uniform(PROCEDURAL_RANGES.bloomThreshold.min, PROCEDURAL_RANGES.bloomThreshold.max);

  const chromaticIntensity = rng.uniform(PROCEDURAL_RANGES.chromaticAberrationIntensity.min * intensityMultiplier, PROCEDURAL_RANGES.chromaticAberrationIntensity.max * intensityMultiplier);

  const godrayIntensity = rng.uniform(PROCEDURAL_RANGES.godrayIntensity.min * atmosphereMultiplier, PROCEDURAL_RANGES.godrayIntensity.max * atmosphereMultiplier);

  return new ToxicPostProcessingEffect(scene, camera, renderer, planetRadius, {
    bloomStrength,
    bloomRadius,
    bloomThreshold,
    chromaticAberrationIntensity: chromaticIntensity,
    godrayIntensity: godrayIntensity,
    seed: seed + 20000,
  });
}
