// atlas-ui/react/static/js/3DEffects/StarField.tsx

import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getAnimatedUniverseTime, getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

export interface StarFieldParams {
  color?: THREE.Color | number;
  starCount?: number;
  minBrightness?: number;
  maxBrightness?: number;
  minSize?: number;
  maxSize?: number;
  distance?: number;
  seed?: number;
  twinkleSpeed?: number;
  parallaxStrength?: number;
  variableChance?: number;
  cosmicOriginTime?: number;
  timeSpeed?: number;
  orbitalParallaxStrength?: number;
  atmosphereRadius?: number;
  planetRadius?: number;
  atmosphereDensity?: number;
  atmosphereColor?: number[];
}

const PROCEDURAL_RANGES = {
  STAR_COUNT: { min: 4500, max: 7500 },
  MIN_BRIGHTNESS: { min: 0.6, max: 0.8 },
  MAX_BRIGHTNESS: { min: 0.9, max: 1.0 },
  MIN_SIZE: { min: 8, max: 9.6 }, // 8x original
  MAX_SIZE: { min: 20, max: 32.0 }, // 8x original
  DISTANCE: { min: 2000, max: 3600 }, // 8x original
  TWINKLE_SPEED: { min: 1.0, max: 2.0 },
  PARALLAX_STRENGTH: { min: 1.0, max: 3.0 },
  VARIABLE_CHANCE: { min: 0.002, max: 0.005 },
  ORBITAL_PARALLAX_STRENGTH: { min: 0.15, max: 0.35 },
};

export class StarFieldEffect {
  private starSystem: THREE.InstancedMesh;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.PlaneGeometry;
  private params: StarFieldParams;
  private starCount: number;
  private cameraPosition: THREE.Vector3 = new THREE.Vector3();
  private lastCameraPosition: THREE.Vector3 = new THREE.Vector3();
  private startTime: number;
  private attenuationMesh?: THREE.Mesh;
  private attenuationMaterial?: THREE.ShaderMaterial;
  private attenuationGeometry?: THREE.SphereGeometry;

  private static readonly vertexShader = `
    attribute vec4 starData;
    attribute float distanceLayer;
    attribute vec3 originalPosition;

    uniform float time;
    uniform float twinkleSpeed;
    uniform vec3 cameraOffset;
    uniform float parallaxStrength;
    uniform vec3 orbitalPosition;
    uniform float orbitalParallaxStrength;

    uniform float atmosphereRadius;
    uniform float uPlanetRadius;
    uniform float atmosphereDensity;

    varying float vBrightness;
    varying float vTwinkle;
    varying float vStarType;
    varying float vAtmoBlur;
    varying vec2 vTangentDir;

    void main() {
      float size = starData.x;
      float brightness = starData.y;
      float twinklePhase = starData.z;
      float starType = starData.w;

      vBrightness = brightness;
      vStarType = starType;
      vAtmoBlur = 0.0;
      vTangentDir = vec2(0.0);

      float baseTwinkle;
      if (starType > 0.5) {
        float pulse = sin(time * twinkleSpeed * 1.0 + twinklePhase);
        baseTwinkle = 0.2 + 0.8 * (pulse * 0.5 + 0.5);
      } else {
        float intensity = 0.05 + 0.05 * brightness;
        baseTwinkle = (1.0 - intensity) + intensity * sin(time * twinkleSpeed + twinklePhase);
      }

      vec3 parallaxOffset = cameraOffset * parallaxStrength * (0.5 / distanceLayer);
      vec3 orbitalParallax = orbitalPosition * orbitalParallaxStrength * (1.0 / distanceLayer);

      vec3 adjustedPosition = originalPosition + parallaxOffset + orbitalParallax;

      vec4 mvPosition = modelViewMatrix * vec4(adjustedPosition, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      float sizeBoost = 1.0;

      if (atmosphereDensity > 0.0) {
        vec3 planetCenter = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        vec3 rayDir = normalize(mvPosition.xyz);

        float tClosest = dot(planetCenter, rayDir);
        vec3 closestPoint = tClosest * rayDir;
        float d = length(planetCenter - closestPoint);

        float outerFade = 1.0 - smoothstep(uPlanetRadius, atmosphereRadius, d);
        float innerFade = smoothstep(uPlanetRadius * 0.92, uPlanetRadius * 1.08, d);
        float atmoFactor = outerFade * innerFade;

        if (atmoFactor > 0.0) {
          float turbulenceStrength = atmoFactor * atmosphereDensity;
          float turb1 = sin(time * 3.7 + twinklePhase * 2.0) * 0.4;
          float turb2 = sin(time * 7.3 + twinklePhase * 4.0) * 0.25;
          float turb3 = sin(time * 13.1 + twinklePhase * 6.0) * 0.15;
          baseTwinkle *= 1.0 + turbulenceStrength * (turb1 + turb2 + turb3);

          vec4 planetClip = projectionMatrix * vec4(planetCenter, 1.0);
          vec2 planetNDC = planetClip.xy / planetClip.w;
          vec2 starNDC = gl_Position.xy / gl_Position.w;
          vec2 refrDir = normalize(starNDC - planetNDC);
          float refrBase = atmoFactor * atmosphereDensity * 0.04;
          float wobble = 0.6 + 0.4 * sin(time * 2.3 + twinklePhase * 3.0);
          gl_Position.xy += refrDir * (refrBase * wobble) * gl_Position.w;

          sizeBoost = 1.0 + atmoFactor * atmosphereDensity * 2.0;
          vAtmoBlur = atmoFactor * atmosphereDensity;

          vTangentDir = vec2(-refrDir.y, refrDir.x) * vAtmoBlur;
        }
      }

      vTwinkle = baseTwinkle;

      float sizeMultiplier = starType > 0.5 ? 1.2 : 1.0;

      // For InstancedMesh, we need to scale the plane
      vec3 scale = vec3(size * sizeMultiplier * sizeBoost * 0.01 * (300.0 / length(mvPosition.xyz)));
      mat4 scaleMatrix = mat4(
        scale.x, 0.0, 0.0, 0.0,
        0.0, scale.y, 0.0, 0.0,
        0.0, 0.0, scale.z, 0.0,
        0.0, 0.0, 0.0, 1.0
      );

      gl_Position = projectionMatrix * modelViewMatrix * scaleMatrix * vec4(adjustedPosition, 1.0);
    }
  `;

  private static readonly fragmentShader = `
    uniform vec3 starColor;

    varying float vBrightness;
    varying float vTwinkle;
    varying float vStarType;
    varying float vAtmoBlur;
    varying vec2 vTangentDir;

    void main() {
      vec2 centered = gl_PointCoord - vec2(0.5);

      float stretchMag = length(vTangentDir);
      if (stretchMag > 0.01) {
        vec2 tDir = vTangentDir / stretchMag;
        vec2 pDir = vec2(-tDir.y, tDir.x);
        float tComp = dot(centered, tDir);
        float pComp = dot(centered, pDir);
        float stretch = 1.0 + stretchMag * 0.6;
        centered = tDir * (tComp / stretch) + pDir * pComp;
      }

      float dist = length(centered);
      if (dist > 0.5) discard;

      float radialFalloff = 1.0 - dist * 2.0;
      radialFalloff = pow(max(radialFalloff, 0.0), max(1.0 - vAtmoBlur * 0.7, 0.3));

      float alpha = radialFalloff * vBrightness * vTwinkle;

      if (vStarType > 0.5) {
        alpha = pow(alpha, 1.0);
        alpha *= 1.5 + 1.5 * vTwinkle;
      } else {
        alpha = pow(alpha, 1.5);
        alpha *= 1.5;
      }

      vec3 finalColor;
      if (vStarType > 0.5) {
        vec3 variableTint = vec3(1.0, 0.6, 0.4);
        finalColor = starColor * variableTint * (0.8 + 0.4 * vTwinkle);
      } else {
        vec3 normalTint = vec3(1.0, 0.9, 0.7);
        finalColor = starColor * normalTint * (0.8 + 0.4 * vTwinkle);
      }

      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  private static readonly attenuationVertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mvPos.xyz);
      gl_Position = projectionMatrix * mvPos;
    }
  `;

  private static readonly attenuationFragmentShader = `
    uniform float atmosphereDensity;

    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      float cosAngle = abs(dot(normalize(vNormal), normalize(vViewDir)));
      float edgeFactor = 1.0 - cosAngle;
      float pathEstimate = pow(edgeFactor, 0.6);

      float alpha = (1.0 - exp(-atmosphereDensity * pathEstimate * 3.0));

      gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
    }
  `;

  private starMatrix: THREE.Matrix4[] = [];
  private starData: Float32Array;

  constructor(planetRadius: number, params: StarFieldParams = {}) {
    const seed = params.seed !== undefined ? params.seed : Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed + 10000);

    this.params = {
      color: params.color || new THREE.Color(0xffffff),
      starCount: params.starCount !== undefined ? params.starCount : Math.floor(rng.uniform(PROCEDURAL_RANGES.STAR_COUNT.min, PROCEDURAL_RANGES.STAR_COUNT.max)),
      minBrightness: params.minBrightness !== undefined ? params.minBrightness : rng.uniform(PROCEDURAL_RANGES.MIN_BRIGHTNESS.min, PROCEDURAL_RANGES.MIN_BRIGHTNESS.max),
      maxBrightness: params.maxBrightness !== undefined ? params.maxBrightness : rng.uniform(PROCEDURAL_RANGES.MAX_BRIGHTNESS.min, PROCEDURAL_RANGES.MAX_BRIGHTNESS.max),
      minSize: params.minSize !== undefined ? params.minSize : rng.uniform(PROCEDURAL_RANGES.MIN_SIZE.min, PROCEDURAL_RANGES.MIN_SIZE.max),
      maxSize: params.maxSize !== undefined ? params.maxSize : rng.uniform(PROCEDURAL_RANGES.MAX_SIZE.min, PROCEDURAL_RANGES.MAX_SIZE.max),
      distance: params.distance !== undefined ? params.distance : rng.uniform(PROCEDURAL_RANGES.DISTANCE.min, PROCEDURAL_RANGES.DISTANCE.max),
      seed: seed,
      twinkleSpeed: params.twinkleSpeed !== undefined ? params.twinkleSpeed : rng.uniform(PROCEDURAL_RANGES.TWINKLE_SPEED.min, PROCEDURAL_RANGES.TWINKLE_SPEED.max),
      parallaxStrength: params.parallaxStrength !== undefined ? params.parallaxStrength : rng.uniform(PROCEDURAL_RANGES.PARALLAX_STRENGTH.min, PROCEDURAL_RANGES.PARALLAX_STRENGTH.max),
      variableChance: params.variableChance !== undefined ? params.variableChance : rng.uniform(PROCEDURAL_RANGES.VARIABLE_CHANCE.min, PROCEDURAL_RANGES.VARIABLE_CHANCE.max),
      cosmicOriginTime: params.cosmicOriginTime,
      timeSpeed: params.timeSpeed !== undefined ? params.timeSpeed : 1.0,
      orbitalParallaxStrength: params.orbitalParallaxStrength !== undefined ? params.orbitalParallaxStrength : rng.uniform(PROCEDURAL_RANGES.ORBITAL_PARALLAX_STRENGTH.min, PROCEDURAL_RANGES.ORBITAL_PARALLAX_STRENGTH.max),
      atmosphereRadius: params.atmosphereRadius,
      planetRadius: params.planetRadius,
      atmosphereDensity: params.atmosphereDensity,
      atmosphereColor: params.atmosphereColor,
    };

    const cosmicOriginTime = this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME;
    this.startTime = getUniverseTime(cosmicOriginTime);

    this.starCount = this.params.starCount!;
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.material = this.createMaterial();

    this.starData = new Float32Array(this.starCount * 4); // size, brightness, twinklePhase, starType
    this.starMatrix = new Array(this.starCount).fill(0).map(() => new THREE.Matrix4());

    this.generateStars(planetRadius);
    this.starSystem = new THREE.InstancedMesh(this.geometry, this.material, this.starCount);
    this.starSystem.renderOrder = -100;

    if ((this.params.atmosphereDensity || 0) > 0 && this.params.atmosphereRadius) {
      this.createAttenuationSphere();
    }
  }

  private generateStars(_planetRadius: number): void {
    const seed = this.params.seed!;
    const rng = new SeededRandom(seed + 10000);

    // Create instance attributes
    const distanceLayers = new Float32Array(this.starCount);
    const originalPositions = new Float32Array(this.starCount * 3);

    for (let i = 0; i < this.starCount; i++) {
      const phi = rng.uniform(0, 2 * Math.PI);
      const cosTheta = rng.uniform(-1, 1);
      const theta = Math.acos(cosTheta);

      const baseDistance = this.params.distance!;
      const distanceVariation = rng.uniform(0.7, 1.3);
      const distance = baseDistance * distanceVariation;

      const x = distance * Math.sin(theta) * Math.cos(phi);
      const y = distance * Math.sin(theta) * Math.sin(phi);
      const z = distance * Math.cos(theta);

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      const isVariable = rng.uniform(0, 1) < this.params.variableChance!;
      const starType = isVariable ? 1.0 : 0.0;

      distanceLayers[i] = distanceVariation;

      const size = rng.uniform(this.params.minSize!, this.params.maxSize!);
      let brightness = rng.uniform(this.params.minBrightness!, this.params.maxBrightness!);
      const twinklePhase = rng.uniform(0, Math.PI * 2);

      if (isVariable) {
        brightness = Math.min(1.0, brightness + 0.2);
      }

      // Store star data for instance attributes
      this.starData[i * 4] = size;
      this.starData[i * 4 + 1] = brightness;
      this.starData[i * 4 + 2] = twinklePhase;
      this.starData[i * 4 + 3] = starType;

      // Create instance matrix
      const matrix = this.starMatrix[i];
      matrix.makeTranslation(x, y, z);
    }

    // Add instance attributes
    this.geometry.setAttribute('starData', new THREE.InstancedBufferAttribute(this.starData, 4, false));
    this.geometry.setAttribute('distanceLayer', new THREE.InstancedBufferAttribute(distanceLayers, 1, false));
    this.geometry.setAttribute('originalPosition', new THREE.InstancedBufferAttribute(originalPositions, 3, false));

    // Set instance matrices
    for (let i = 0; i < this.starCount; i++) {
      this.starSystem.setMatrixAt(i, this.starMatrix[i]);
    }
    this.starSystem.instanceMatrix.needsUpdate = true;
  }

  private createMaterial(): THREE.ShaderMaterial {
    const starColor = this.params.color instanceof THREE.Color ? this.params.color : new THREE.Color(this.params.color as any);

    return new THREE.ShaderMaterial({
      vertexShader: StarFieldEffect.vertexShader,
      fragmentShader: StarFieldEffect.fragmentShader,
      uniforms: {
        time: { value: 0 },
        starColor: { value: starColor },
        twinkleSpeed: { value: this.params.twinkleSpeed },
        cameraOffset: { value: new THREE.Vector3(0, 0, 0) },
        parallaxStrength: { value: this.params.parallaxStrength },
        orbitalPosition: { value: new THREE.Vector3(0, 0, 0) },
        orbitalParallaxStrength: { value: this.params.orbitalParallaxStrength },
        atmosphereRadius: { value: this.params.atmosphereRadius || 0 },
        uPlanetRadius: { value: this.params.planetRadius || 0 },
        atmosphereDensity: { value: this.params.atmosphereDensity || 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: false,
    });
  }

  private createAttenuationSphere(): void {
    this.attenuationGeometry = new THREE.SphereGeometry(this.params.atmosphereRadius!, 64, 64);
    this.attenuationMaterial = new THREE.ShaderMaterial({
      vertexShader: StarFieldEffect.attenuationVertexShader,
      fragmentShader: StarFieldEffect.attenuationFragmentShader,
      uniforms: {
        atmosphereDensity: { value: this.params.atmosphereDensity || 0 },
      },
      transparent: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.ZeroFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      depthWrite: false,
      depthTest: true,
      side: THREE.BackSide,
    });

    this.attenuationMesh = new THREE.Mesh(this.attenuationGeometry, this.attenuationMaterial);
    this.attenuationMesh.renderOrder = -99;
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.starSystem.position.copy(planetPosition);
    }
    scene.add(this.starSystem);

    if (this.attenuationMesh) {
      if (planetPosition) {
        this.attenuationMesh.position.copy(planetPosition);
      }
      scene.add(this.attenuationMesh);
    }
  }

  update(_deltaTime: number, _planetRotation?: number, camera?: THREE.Camera): void {
    const cosmicOriginTime = this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.params.timeSpeed!, this.startTime);

    this.material.uniforms.time.value = currentTime;

    if (camera) {
      this.cameraPosition.copy(camera.position);

      const cameraOffset = new THREE.Vector3().subVectors(this.cameraPosition, this.lastCameraPosition).multiplyScalar(0.3);

      this.material.uniforms.cameraOffset.value.lerp(cameraOffset, 0.1);
      this.lastCameraPosition.copy(this.cameraPosition);
    }
  }

  updateWithCamera(deltaTime: number, camera: THREE.Camera): void {
    this.update(deltaTime, undefined, camera);
  }

  updateParams(newParams: Partial<StarFieldParams>): void {
    this.params = { ...this.params, ...newParams };

    if (newParams.color !== undefined) {
      const newColor = newParams.color instanceof THREE.Color ? newParams.color : new THREE.Color(newParams.color);
      this.material.uniforms.starColor.value = newColor;
    }

    if (newParams.twinkleSpeed !== undefined) {
      this.material.uniforms.twinkleSpeed.value = newParams.twinkleSpeed;
    }

    if (newParams.parallaxStrength !== undefined) {
      this.material.uniforms.parallaxStrength.value = newParams.parallaxStrength;
    }

    if (newParams.orbitalParallaxStrength !== undefined) {
      this.material.uniforms.orbitalParallaxStrength.value = newParams.orbitalParallaxStrength;
    }
  }

  updateOrbitalPosition(position: THREE.Vector3): void {
    this.material.uniforms.orbitalPosition.value.copy(position);
  }

  getObject3D(): THREE.Object3D {
    return this.starSystem;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    if (this.attenuationGeometry) this.attenuationGeometry.dispose();
    if (this.attenuationMaterial) this.attenuationMaterial.dispose();
  }
}

export function createStarFieldFromPythonData(planetRadius: number, planetSeed?: number, atmosphereData?: any): StarFieldEffect {
  const seed = planetSeed !== undefined ? planetSeed : Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed + 10000);

  const params: StarFieldParams = {
    color: new THREE.Color(0xffffff),
    starCount: Math.floor(rng.uniform(PROCEDURAL_RANGES.STAR_COUNT.min, PROCEDURAL_RANGES.STAR_COUNT.max)),
    minBrightness: rng.uniform(PROCEDURAL_RANGES.MIN_BRIGHTNESS.min, PROCEDURAL_RANGES.MIN_BRIGHTNESS.max),
    maxBrightness: rng.uniform(PROCEDURAL_RANGES.MAX_BRIGHTNESS.min, PROCEDURAL_RANGES.MAX_BRIGHTNESS.max),
    minSize: rng.uniform(PROCEDURAL_RANGES.MIN_SIZE.min, PROCEDURAL_RANGES.MIN_SIZE.max),
    maxSize: rng.uniform(PROCEDURAL_RANGES.MAX_SIZE.min, PROCEDURAL_RANGES.MAX_SIZE.max),
    distance: rng.uniform(PROCEDURAL_RANGES.DISTANCE.min, PROCEDURAL_RANGES.DISTANCE.max),
    seed,
    twinkleSpeed: rng.uniform(PROCEDURAL_RANGES.TWINKLE_SPEED.min, PROCEDURAL_RANGES.TWINKLE_SPEED.max),
    parallaxStrength: rng.uniform(PROCEDURAL_RANGES.PARALLAX_STRENGTH.min, PROCEDURAL_RANGES.PARALLAX_STRENGTH.max),
    variableChance: rng.uniform(PROCEDURAL_RANGES.VARIABLE_CHANCE.min, PROCEDURAL_RANGES.VARIABLE_CHANCE.max),
  };

  if (atmosphereData && atmosphereData.type && atmosphereData.type !== "None") {
    const width = atmosphereData.width || 12;
    const color = atmosphereData.color || [0.7, 0.7, 0.7, 0.15];
    const alpha = Array.isArray(color) && color.length >= 4 ? color[3] : 0.15;

    params.atmosphereRadius = planetRadius * (1 + width / 100);
    params.planetRadius = planetRadius;
    params.atmosphereDensity = alpha * (width / 18);
    params.atmosphereColor = [Array.isArray(color) ? color[0] : 0.7, Array.isArray(color) ? color[1] : 0.7, Array.isArray(color) ? color[2] : 0.7];
  } else {
    params.atmosphereDensity = 0;
  }

  return new StarFieldEffect(planetRadius, params);
}
