// atlas-ui/react/static/js/3DEffects/LifeFormConsciousGas.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

const PROCEDURAL_RANGES = {
  CLOUD_LAYER_COUNT: { min: 3, max: 6 },
  ATMOSPHERIC_BELT_COUNT: { min: 2, max: 5 },
  GAS_SWIRL_COUNT: { min: 8, max: 20 },
  COLOR_SHIFT_SPEED: { min: 0.5, max: 2.0 },
  FLOW_SPEED: { min: 0.3, max: 1.2 },
  CONSCIOUSNESS_PULSE_COUNT: { min: 5, max: 12 },
};

export interface LifeFormConsciousGasParams {
  color?: number[] | THREE.Color;
  cloudLayerCount?: number;
  atmosphericBeltCount?: number;
  gasSwirlCount?: number;
  colorShiftSpeed?: number;
  flowSpeed?: number;
  consciousnessPulseCount?: number;
  seed?: number;
  cosmicOriginTime?: number;
}

export class LifeFormConsciousGasEffect {
  private group: THREE.Group;
  private cloudLayers: THREE.Mesh[] = [];
  private atmosphericBelts: THREE.Mesh[] = [];
  private gasSwirls: THREE.Mesh[] = [];
  private consciousnessPulses: THREE.Mesh[] = [];
  private params: LifeFormConsciousGasParams;
  private rng: SeededRandom;
  private planetRadius: number;
  private cosmicOffset: number;

  constructor(planetRadius: number, params: LifeFormConsciousGasParams = {}) {
    this.planetRadius = planetRadius;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    this.rng = new SeededRandom(seed);

    this.params = {
      color: params.color || [0.6, 0.8, 0.4],
      cloudLayerCount: params.cloudLayerCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.CLOUD_LAYER_COUNT.max - PROCEDURAL_RANGES.CLOUD_LAYER_COUNT.min) + PROCEDURAL_RANGES.CLOUD_LAYER_COUNT.min),
      atmosphericBeltCount: params.atmosphericBeltCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.ATMOSPHERIC_BELT_COUNT.max - PROCEDURAL_RANGES.ATMOSPHERIC_BELT_COUNT.min) + PROCEDURAL_RANGES.ATMOSPHERIC_BELT_COUNT.min),
      gasSwirlCount: params.gasSwirlCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.GAS_SWIRL_COUNT.max - PROCEDURAL_RANGES.GAS_SWIRL_COUNT.min) + PROCEDURAL_RANGES.GAS_SWIRL_COUNT.min),
      colorShiftSpeed: params.colorShiftSpeed || this.rng.random() * (PROCEDURAL_RANGES.COLOR_SHIFT_SPEED.max - PROCEDURAL_RANGES.COLOR_SHIFT_SPEED.min) + PROCEDURAL_RANGES.COLOR_SHIFT_SPEED.min,
      flowSpeed: params.flowSpeed || this.rng.random() * (PROCEDURAL_RANGES.FLOW_SPEED.max - PROCEDURAL_RANGES.FLOW_SPEED.min) + PROCEDURAL_RANGES.FLOW_SPEED.min,
      consciousnessPulseCount: params.consciousnessPulseCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.CONSCIOUSNESS_PULSE_COUNT.max - PROCEDURAL_RANGES.CONSCIOUSNESS_PULSE_COUNT.min) + PROCEDURAL_RANGES.CONSCIOUSNESS_PULSE_COUNT.min),
      cosmicOriginTime: params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME,
      seed,
    };

    this.cosmicOffset = (seed % 100) * 0.1;

    this.group = new THREE.Group();
    this.createCloudLayers();
    this.createAtmosphericBelts();
    this.createGasSwirls();
    this.createConsciousnessPulses();
  }

  private createCloudLayers(): void {
    const layerCount = this.params.cloudLayerCount!;

    for (let i = 0; i < layerCount; i++) {
      const layerRadius = this.planetRadius + 0.1 + i * 0.15;

      const cloudGeometry = new THREE.SphereGeometry(layerRadius, 32, 16);

      const cloudMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          baseColor: { value: new THREE.Color(this.params.color![0], this.params.color![1], this.params.color![2]) },
          layerIndex: { value: i },
          colorShiftSpeed: { value: this.params.colorShiftSpeed! },
          opacity: { value: 0.3 - i * 0.04 },
        },
        vertexShader: `
          uniform float time;
          uniform float layerIndex;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying float vDistortion;
          
          float noise(vec3 p) {
            return sin(p.x * 4.0 + time * 0.5) * sin(p.y * 4.0 + time * 0.7) * sin(p.z * 4.0 + time * 0.3) * 0.5 + 0.5;
          }
          
          void main() {
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            
            vec3 noisePos = position * 2.0 + time * 0.2;
            float distortion = noise(noisePos) * 0.1;
            vDistortion = distortion;
            
            vec3 pos = position + normal * distortion;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 baseColor;
          uniform float time;
          uniform float layerIndex;
          uniform float colorShiftSpeed;
          uniform float opacity;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying float vDistortion;
          
          vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
          }
          
          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
            
            float colorCycle = sin(time * colorShiftSpeed + layerIndex * 2.0 + vPosition.x * 0.5) * 0.5 + 0.5;
            float hueShift = colorCycle * 0.3 + layerIndex * 0.1;
            
            vec3 shiftedColor = hsv2rgb(vec3(hueShift, 0.7, 0.9));
            vec3 finalColor = mix(baseColor, shiftedColor, colorCycle);
            
            float alpha = fresnel * opacity * (0.8 + vDistortion * 2.0);
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      });

      const cloudLayer = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloudLayer.userData = {
        layerIndex: i,
        rotationSpeed: (this.rng.random() - 0.5) * 0.01,
      };

      this.cloudLayers.push(cloudLayer);
      this.group.add(cloudLayer);
    }
  }

  private createAtmosphericBelts(): void {
    const beltCount = this.params.atmosphericBeltCount!;

    for (let i = 0; i < beltCount; i++) {
      const beltRadius = this.planetRadius + 0.3 + i * 0.4;
      const beltHeight = this.planetRadius * 0.15;

      const beltGeometry = new THREE.CylinderGeometry(beltRadius, beltRadius, beltHeight, 64, 8, true);

      const beltMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          baseColor: { value: new THREE.Color(this.params.color![0] * 0.8, this.params.color![1] * 1.2, this.params.color![2] * 0.9) },
          beltIndex: { value: i },
          flowSpeed: { value: this.params.flowSpeed! },
        },
        vertexShader: `
          uniform float time;
          uniform float beltIndex;
          uniform float flowSpeed;
          varying vec2 vUv;
          varying vec3 vPosition;
          varying float vFlow;
          
          void main() {
            vUv = uv;
            vPosition = position;
            
            float flow = sin(time * flowSpeed + beltIndex * 3.0 + position.x * 0.1) * 0.5 + 0.5;
            vFlow = flow;
            
            vec3 pos = position;
            pos.y += sin(time * 2.0 + uv.x * 20.0) * 0.05;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 baseColor;
          uniform float time;
          uniform float beltIndex;
          varying vec2 vUv;
          varying vec3 vPosition;
          varying float vFlow;
          
          void main() {
            float stripPattern = sin(vUv.x * 40.0 + time * 3.0) * 0.5 + 0.5;
            float flowPattern = sin(vUv.x * 10.0 + time * 5.0 + beltIndex * 2.0) * 0.3 + 0.7;
            
            float edgeFade = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
            
            vec3 gasColor = baseColor * (1.0 + stripPattern * 0.5) * flowPattern;
            float alpha = edgeFade * vFlow * 0.6;
            
            gl_FragColor = vec4(gasColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const belt = new THREE.Mesh(beltGeometry, beltMaterial);

      const inclination = this.rng.random() * Math.PI * 0.4 + Math.PI * 0.3;
      const longitudeOfAscendingNode = this.rng.random() * Math.PI * 2;
      const tiltAngle = (this.rng.random() - 0.5) * 0.3;

      belt.rotation.x = Math.PI / 2 + tiltAngle;
      belt.rotation.y = longitudeOfAscendingNode;
      belt.rotation.z = inclination;

      belt.userData = {
        beltIndex: i,
        inclination: inclination,
        longitudeOfAscendingNode: longitudeOfAscendingNode,
        tiltAngle: tiltAngle,
        orbitalSpeed: this.rng.random() * 0.3 + 0.1,
        rotationSpeed: (this.rng.random() - 0.5) * 0.02,
      };

      this.atmosphericBelts.push(belt);
      this.group.add(belt);
    }
  }

  private createGasSwirls(): void {
    const swirlCount = this.params.gasSwirlCount!;

    for (let i = 0; i < swirlCount; i++) {
      const distance = this.planetRadius + 0.05 + this.rng.random() * 0.8;
      const inclination = this.rng.random() * Math.PI;
      const longitudeOfAscendingNode = this.rng.random() * Math.PI * 2;
      const initialAngle = this.rng.random() * Math.PI * 2;

      const position = this.calculateOrbitalPosition(distance, inclination, longitudeOfAscendingNode, initialAngle);

      const swirlGeometry = new THREE.SphereGeometry(this.planetRadius * (0.08 + this.rng.random() * 0.06), 16, 12);

      const swirlMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(this.params.color![0], this.params.color![1] * 1.1, this.params.color![2] * 0.8) },
          swirlIndex: { value: i },
          swirlSpeed: { value: 2.0 + this.rng.random() * 3.0 },
        },
        vertexShader: `
          uniform float time;
          uniform float swirlIndex;
          uniform float swirlSpeed;
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vSwirl;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            
            float swirl = sin(time * swirlSpeed + swirlIndex * 2.0) * 0.5 + 0.5;
            vSwirl = swirl;
            
            vec3 pos = position;
            float twist = atan(pos.y, pos.x) + time * 2.0 + swirlIndex;
            pos.x += sin(twist) * 0.05 * swirl;
            pos.y += cos(twist) * 0.05 * swirl;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          uniform float swirlIndex;
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vSwirl;
          
          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
            float gasPattern = sin(vPosition.x * 8.0 + time * 4.0) * sin(vPosition.y * 6.0 + time * 3.0) * 0.3 + 0.7;
            
            float alpha = fresnel * gasPattern * vSwirl * 0.7;
            vec3 gasColor = color * (1.0 + gasPattern * 0.5);
            
            gl_FragColor = vec4(gasColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const swirl = new THREE.Mesh(swirlGeometry, swirlMaterial);
      swirl.position.set(position.x, position.y, position.z);

      swirl.userData = {
        distance: distance,
        inclination: inclination,
        longitudeOfAscendingNode: longitudeOfAscendingNode,
        initialAngle: initialAngle,
        orbitalSpeed: this.rng.random() * 0.5 + 0.3,
        swirlIndex: i,
      };

      this.gasSwirls.push(swirl);
      this.group.add(swirl);
    }
  }

  private createConsciousnessPulses(): void {
    const pulseCount = this.params.consciousnessPulseCount!;

    for (let i = 0; i < pulseCount; i++) {
      const distance = this.planetRadius + 0.6 + this.rng.random() * 0.5;
      const inclination = this.rng.random() * Math.PI;
      const longitudeOfAscendingNode = this.rng.random() * Math.PI * 2;
      const initialAngle = this.rng.random() * Math.PI * 2;

      const position = this.calculateOrbitalPosition(distance, inclination, longitudeOfAscendingNode, initialAngle);

      const pulseGeometry = new THREE.SphereGeometry(this.planetRadius * 0.04, 8, 6);

      const pulseMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(this.params.color![0] * 1.2, this.params.color![1], this.params.color![2] * 1.3) },
          pulseIndex: { value: i },
          pulseSpeed: { value: 3.0 + this.rng.random() * 2.0 },
        },
        vertexShader: `
          uniform float time;
          uniform float pulseIndex;
          uniform float pulseSpeed;
          varying float vIntensity;
          
          void main() {
            float pulse = sin(time * pulseSpeed + pulseIndex * 1.5) * 0.5 + 0.5;
            vIntensity = pulse;
            
            vec3 pos = position * (1.0 + pulse * 0.3);
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          varying float vIntensity;
          
          void main() {
            float consciousness = sin(time * 8.0) * 0.2 + 0.8;
            
            gl_FragColor = vec4(color * consciousness, vIntensity * 0.9);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
      pulse.position.set(position.x, position.y, position.z);

      pulse.userData = {
        distance: distance,
        inclination: inclination,
        longitudeOfAscendingNode: longitudeOfAscendingNode,
        initialAngle: initialAngle,
        orbitalSpeed: this.rng.random() * 0.3 + 0.1,
        pulseIndex: i,
      };

      this.consciousnessPulses.push(pulse);
      this.group.add(pulse);
    }
  }

  private calculateOrbitalPosition(distance: number, inclination: number, longitudeOfAscendingNode: number, angle: number): THREE.Vector3 {
    const x_orbital = distance * Math.cos(angle);
    const y_orbital = distance * Math.sin(angle);
    const z_orbital = 0;

    const x_inclined = x_orbital;
    const y_inclined = y_orbital * Math.cos(inclination) - z_orbital * Math.sin(inclination);
    const z_inclined = y_orbital * Math.sin(inclination) + z_orbital * Math.cos(inclination);

    const x_final = x_inclined * Math.cos(longitudeOfAscendingNode) - y_inclined * Math.sin(longitudeOfAscendingNode);
    const y_final = x_inclined * Math.sin(longitudeOfAscendingNode) + y_inclined * Math.cos(longitudeOfAscendingNode);
    const z_final = z_inclined;

    return new THREE.Vector3(x_final, y_final, z_final);
  }

  public update(_deltaTime?: number): void {
    const timeSinceCosmicOrigin = getUniverseTime(this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME);
    const animTime = timeSinceCosmicOrigin + this.cosmicOffset;

    this.cloudLayers.forEach((layer) => {
      const userData = layer.userData;

      layer.rotation.y += userData.rotationSpeed;
      layer.rotation.z += userData.rotationSpeed * 0.7;

      const material = layer.material as THREE.ShaderMaterial;
      material.uniforms.time.value = animTime;
    });

    this.atmosphericBelts.forEach((belt) => {
      const userData = belt.userData;

      const currentLongitude = userData.longitudeOfAscendingNode + animTime * userData.orbitalSpeed * 0.1;

      belt.rotation.x = Math.PI / 2 + userData.tiltAngle + Math.sin(animTime * 0.5 + userData.beltIndex) * 0.1;
      belt.rotation.y = currentLongitude;
      belt.rotation.z = userData.inclination + Math.cos(animTime * 0.3 + userData.beltIndex) * 0.05;

      const material = belt.material as THREE.ShaderMaterial;
      material.uniforms.time.value = animTime;
    });

    this.gasSwirls.forEach((swirl) => {
      const userData = swirl.userData;
      const currentAngle = userData.initialAngle + animTime * userData.orbitalSpeed * 0.1;

      const position = this.calculateOrbitalPosition(userData.distance, userData.inclination, userData.longitudeOfAscendingNode, currentAngle);
      swirl.position.set(position.x, position.y, position.z);

      swirl.rotation.x += 0.02;
      swirl.rotation.y += 0.015;

      const material = swirl.material as THREE.ShaderMaterial;
      material.uniforms.time.value = animTime;
    });

    this.consciousnessPulses.forEach((pulse) => {
      const userData = pulse.userData;
      const currentAngle = userData.initialAngle + animTime * userData.orbitalSpeed * 0.05;

      const position = this.calculateOrbitalPosition(userData.distance, userData.inclination, userData.longitudeOfAscendingNode, currentAngle);
      pulse.position.set(position.x, position.y, position.z);

      const material = pulse.material as THREE.ShaderMaterial;
      material.uniforms.time.value = animTime;
    });
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
    this.cloudLayers.forEach((layer) => {
      layer.geometry.dispose();
      (layer.material as THREE.Material).dispose();
    });

    this.atmosphericBelts.forEach((belt) => {
      belt.geometry.dispose();
      (belt.material as THREE.Material).dispose();
    });

    this.gasSwirls.forEach((swirl) => {
      swirl.geometry.dispose();
      (swirl.material as THREE.Material).dispose();
    });

    this.consciousnessPulses.forEach((pulse) => {
      pulse.geometry.dispose();
      (pulse.material as THREE.Material).dispose();
    });

    this.group.clear();
  }

  public setEnabled(enabled: boolean): void {
    this.group.visible = enabled;
  }

  public updateParams(newParams: Partial<LifeFormConsciousGasParams>): void {
    Object.assign(this.params, newParams);

    if (newParams.color) {
      const color = new THREE.Color(newParams.color[0], newParams.color[1], newParams.color[2]);

      this.cloudLayers.forEach((layer) => {
        const material = layer.material as THREE.ShaderMaterial;
        material.uniforms.baseColor.value = color;
      });

      this.atmosphericBelts.forEach((belt) => {
        const material = belt.material as THREE.ShaderMaterial;
        material.uniforms.baseColor.value = new THREE.Color(color.r * 0.8, color.g * 1.2, color.b * 0.9);
      });

      this.gasSwirls.forEach((swirl) => {
        const material = swirl.material as THREE.ShaderMaterial;
        material.uniforms.color.value = new THREE.Color(color.r, color.g * 1.1, color.b * 0.8);
      });

      this.consciousnessPulses.forEach((pulse) => {
        const material = pulse.material as THREE.ShaderMaterial;
        material.uniforms.color.value = new THREE.Color(color.r * 1.2, color.g, color.b * 1.3);
      });
    }
  }
}

export function createLifeFormConsciousGasFromPythonData(planetRadius: number, pythonData: any, globalSeed?: number): LifeFormConsciousGasEffect {
  const seed = globalSeed || Math.floor(Math.random() * 1000000);

  const params: LifeFormConsciousGasParams = {
    seed: seed + 80004,
    color: pythonData.color || [0.6, 0.8, 0.4],
    cosmicOriginTime: pythonData?.timing?.cosmic_origin_time || pythonData?.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME,
  };

  return new LifeFormConsciousGasEffect(planetRadius, params);
}
