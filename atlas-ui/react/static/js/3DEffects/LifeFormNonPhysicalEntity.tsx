// atlas-ui/react/static/js/3DEffects/LifeFormNonPhysicalEntity.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

const PROCEDURAL_RANGES = {
  RING_COUNT: { min: 3, max: 8 },
  RING_DISTANCE: { min: 1.5, max: 3.5 },
  WAVE_COUNT: { min: 51, max: 151 },
  WAVE_AMPLITUDE: { min: 0.1, max: 0.2 },
  ORBITAL_SPEED: { min: 0.2, max: 0.8 },
  PORTAL_COUNT: { min: 21, max: 60 },
  ENERGY_BEAM_COUNT: { min: 2, max: 8 },
  PARTICLE_COUNT: { min: 201, max: 801 },
};

export interface LifeFormNonPhysicalEntityParams {
  color?: number[] | THREE.Color;
  ringCount?: number;
  ringDistance?: number;
  waveCount?: number;
  waveAmplitude?: number;
  orbitalSpeed?: number;
  portalCount?: number;
  energyBeamCount?: number;
  particleCount?: number;
  seed?: number;
  cosmicOriginTime?: number;
}

export class LifeFormNonPhysicalEntityEffect {
  private group: THREE.Group;
  private plasmaRings: THREE.Mesh[] = [];
  private energyWaves: THREE.Mesh[] = [];
  private dimensionalPortals: THREE.Mesh[] = [];
  private energyBeams: THREE.Mesh[] = [];
  private energyParticles: THREE.Points;
  private particleOrbitData: Array<{
    distance: number;
    inclination: number;
    longitudeOfAscendingNode: number;
    initialAngle: number;
    orbitalSpeed: number;
  }> = [];
  private spaceDistortion: THREE.Mesh;
  private params: LifeFormNonPhysicalEntityParams;
  private rng: SeededRandom;
  private planetRadius: number;
  private cosmicOffset: number;

  constructor(planetRadius: number, params: LifeFormNonPhysicalEntityParams = {}) {
    this.planetRadius = planetRadius;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    this.rng = new SeededRandom(seed);

    this.params = {
      color: params.color || [0.2, 0.6, 1.0],
      ringCount: params.ringCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.RING_COUNT.max - PROCEDURAL_RANGES.RING_COUNT.min) + PROCEDURAL_RANGES.RING_COUNT.min),
      ringDistance: params.ringDistance || this.rng.random() * (PROCEDURAL_RANGES.RING_DISTANCE.max - PROCEDURAL_RANGES.RING_DISTANCE.min) + PROCEDURAL_RANGES.RING_DISTANCE.min,
      waveCount: params.waveCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.WAVE_COUNT.max - PROCEDURAL_RANGES.WAVE_COUNT.min) + PROCEDURAL_RANGES.WAVE_COUNT.min),
      waveAmplitude: params.waveAmplitude || this.rng.random() * (PROCEDURAL_RANGES.WAVE_AMPLITUDE.max - PROCEDURAL_RANGES.WAVE_AMPLITUDE.min) + PROCEDURAL_RANGES.WAVE_AMPLITUDE.min,
      orbitalSpeed: params.orbitalSpeed || this.rng.random() * (PROCEDURAL_RANGES.ORBITAL_SPEED.max - PROCEDURAL_RANGES.ORBITAL_SPEED.min) + PROCEDURAL_RANGES.ORBITAL_SPEED.min,
      portalCount: params.portalCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.PORTAL_COUNT.max - PROCEDURAL_RANGES.PORTAL_COUNT.min) + PROCEDURAL_RANGES.PORTAL_COUNT.min),
      energyBeamCount: params.energyBeamCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.ENERGY_BEAM_COUNT.max - PROCEDURAL_RANGES.ENERGY_BEAM_COUNT.min) + PROCEDURAL_RANGES.ENERGY_BEAM_COUNT.min),
      particleCount: params.particleCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.PARTICLE_COUNT.max - PROCEDURAL_RANGES.PARTICLE_COUNT.min) + PROCEDURAL_RANGES.PARTICLE_COUNT.min),
      cosmicOriginTime: params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME,
      seed,
    };

    this.cosmicOffset = (seed % 100) * 0.1;

    this.group = new THREE.Group();
    this.createPlasmaRings();
    this.createEnergyWaves();
    this.createDimensionalPortals();
    this.createEnergyBeams();
    this.createEnergyParticles();
    this.createSpaceDistortion();
  }

  private createPlasmaRings(): void {
    const ringCount = this.params.ringCount!;
    const baseDistance = this.planetRadius + this.params.ringDistance!;

    for (let i = 0; i < ringCount; i++) {
      const distance = baseDistance + i * 0.8;

      const inclination = this.rng.random() * Math.PI * 0.5;
      const longitudeOfAscendingNode = this.rng.random() * Math.PI * 2;
      const tiltAngle = (this.rng.random() - 0.5) * Math.PI * 0.3;

      const ringGeometry = new THREE.TorusGeometry(this.planetRadius * 0.2 + i * 0.1, this.planetRadius * 0.03, 8, 32);

      const ringMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(this.params.color![0], this.params.color![1], this.params.color![2]) },
          opacity: { value: 0.6 - i * 0.08 },
          ringIndex: { value: i },
          pulseSpeed: { value: 2.0 + this.rng.random() * 2.0 },
        },
        vertexShader: `
          uniform float time;
          uniform float ringIndex;
          uniform float pulseSpeed;
          varying vec2 vUv;
          varying float vIntensity;
          
          void main() {
            vUv = uv;
            float pulse = sin(time * pulseSpeed + ringIndex * 1.5) * 0.3 + 0.7;
            vIntensity = pulse;
            
            vec3 pos = position;
            pos.z += sin(time * 1.5 + ringIndex) * 0.1;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float opacity;
          uniform float time;
          varying vec2 vUv;
          varying float vIntensity;
          
          void main() {
            float plasma = sin(vUv.x * 15.0 + time * 3.0) * sin(vUv.y * 10.0 + time * 2.0) * 0.5 + 0.5;
            float energy = sin(time * 4.0 + vUv.x * 8.0) * 0.3 + 0.7;
            
            float finalIntensity = plasma * energy * vIntensity;
            
            gl_FragColor = vec4(color, finalIntensity * opacity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);

      ring.rotation.set(inclination, 0, tiltAngle);
      ring.userData = {
        distance: distance,
        inclination: inclination,
        longitudeOfAscendingNode: longitudeOfAscendingNode,
        tiltAngle: tiltAngle,
        orbitalSpeed: this.rng.random() * 0.5 + 0.3,
        ringIndex: i,
      };

      this.plasmaRings.push(ring);
      this.group.add(ring);
    }
  }

  private createEnergyWaves(): void {
    const waveCount = this.params.waveCount!;
    const waveDistance = this.planetRadius + this.params.ringDistance! + 0.5;

    for (let i = 0; i < waveCount; i++) {
      const distance = waveDistance + this.rng.random() * 1.0;

      const inclination = this.rng.random() * Math.PI;
      const longitudeOfAscendingNode = this.rng.random() * Math.PI * 2;
      const initialAngle = this.rng.random() * Math.PI * 2;

      const position = this.calculateOrbitalPosition(distance, inclination, longitudeOfAscendingNode, initialAngle);

      const waveGeometry = new THREE.SphereGeometry(this.planetRadius * 0.08 + this.rng.random() * 0.04, 16, 8);

      const waveMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(this.params.color![0] * 0.8, this.params.color![1] * 0.9, this.params.color![2]) },
          amplitude: { value: this.params.waveAmplitude! },
          frequency: { value: 3.0 + this.rng.random() * 4.0 },
          waveIndex: { value: i },
        },
        vertexShader: `
          uniform float time;
          uniform float amplitude;
          uniform float frequency;
          uniform float waveIndex;
          varying vec3 vNormal;
          varying float vWaveIntensity;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            
            float wave = sin(time * frequency + waveIndex * 2.0) * amplitude;
            vec3 pos = position + normal * wave;
            
            vWaveIntensity = (sin(time * 2.0 + waveIndex) + 1.0) * 0.5;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          varying vec3 vNormal;
          varying float vWaveIntensity;
          
          void main() {
            float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            float ethereal = sin(time * 4.0 + fresnel * 10.0) * 0.3 + 0.7;
            
            float finalIntensity = fresnel * ethereal * vWaveIntensity * 0.8;
            gl_FragColor = vec4(color, finalIntensity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const wave = new THREE.Mesh(waveGeometry, waveMaterial);
      wave.position.set(position.x, position.y, position.z);

      wave.userData = {
        distance: distance,
        inclination: inclination,
        longitudeOfAscendingNode: longitudeOfAscendingNode,
        initialAngle: initialAngle,
        orbitalSpeed: this.rng.random() * 0.4 + 0.2,
        waveIndex: i,
      };

      this.energyWaves.push(wave);
      this.group.add(wave);
    }
  }

  private createDimensionalPortals(): void {
    const portalCount = this.params.portalCount!;
    const portalDistance = this.planetRadius + this.params.ringDistance! + 1.2;

    for (let i = 0; i < portalCount; i++) {
      const distance = portalDistance + this.rng.random() * 0.8;

      const inclination = this.rng.random() * Math.PI;
      const longitudeOfAscendingNode = this.rng.random() * Math.PI * 2;
      const initialAngle = this.rng.random() * Math.PI * 2;

      const position = this.calculateOrbitalPosition(distance, inclination, longitudeOfAscendingNode, initialAngle);

      const portalGeometry = new THREE.RingGeometry(this.planetRadius * 0.12, this.planetRadius * 0.18, 16, 1);

      const portalMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0.8, 0.4, 1.0) },
          portalIndex: { value: i },
          activation: { value: 0.0 },
        },
        vertexShader: `
          uniform float time;
          uniform float portalIndex;
          uniform float activation;
          varying vec2 vUv;
          varying float vActivation;
          
          void main() {
            vUv = uv;
            vActivation = activation;
            
            vec3 pos = position;
            float ripple = sin(time * 4.0 + portalIndex * 2.0) * 0.05 * activation;
            pos += normal * ripple;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          uniform float portalIndex;
          varying vec2 vUv;
          varying float vActivation;
          
          void main() {
            vec2 center = vUv - 0.5;
            float dist = length(center);
            
            float portal = smoothstep(0.35, 0.4, dist) * (1.0 - smoothstep(0.45, 0.5, dist));
            
            float spiral = sin(atan(center.y, center.x) * 8.0 + time * 6.0 + dist * 20.0) * 0.5 + 0.5;
            float vortex = sin(time * 10.0 + portalIndex * 3.0) * 0.3 + 0.7;
            
            float intensity = portal * spiral * vortex * vActivation;
            
            vec3 portalColor = mix(color, vec3(1.0, 0.8, 0.9), spiral * 0.3);
            gl_FragColor = vec4(portalColor, intensity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const portal = new THREE.Mesh(portalGeometry, portalMaterial);
      portal.position.set(position.x, position.y, position.z);
      portal.lookAt(0, 0, 0);

      portal.userData = {
        distance: distance,
        inclination: inclination,
        longitudeOfAscendingNode: longitudeOfAscendingNode,
        initialAngle: initialAngle,
        orbitalSpeed: this.rng.random() * 0.3 + 0.1,
        portalIndex: i,
        activationPhase: this.rng.random() * Math.PI * 2,
      };

      this.dimensionalPortals.push(portal);
      this.group.add(portal);
    }
  }

  private createEnergyBeams(): void {
    const beamCount = this.params.energyBeamCount!;

    for (let i = 0; i < beamCount; i++) {
      const startDistance = this.planetRadius + 0.2;
      const endDistance = this.planetRadius + 0.4 + this.rng.random() * 0.3;

      const inclination = this.rng.random() * Math.PI;
      const longitudeOfAscendingNode = this.rng.random() * Math.PI * 2;
      const startAngle = this.rng.random() * Math.PI * 2;
      const endAngle = startAngle + (this.rng.random() - 0.5) * Math.PI;

      const startPos = this.calculateOrbitalPosition(startDistance, inclination, longitudeOfAscendingNode, startAngle);
      const endPos = this.calculateOrbitalPosition(endDistance, inclination, longitudeOfAscendingNode, endAngle);

      const curvePoints = this.createCurvedBeamPath(startPos, endPos, startDistance, endDistance);
      const curve = new THREE.CatmullRomCurve3(curvePoints);

      const tubeRadius = this.planetRadius * 0.015;
      const radialSegments = 6;
      const tubularSegments = Math.max(20, curvePoints.length * 2);

      const geometry = new THREE.TubeGeometry(curve, tubularSegments, tubeRadius, radialSegments, false);

      const beamMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0.3, 0.8, 1.0) },
          beamIndex: { value: i },
          intensity: { value: 0.0 },
        },
        vertexShader: `
          uniform float time;
          uniform float beamIndex;
          uniform float intensity;
          varying vec2 vUv;
          varying float vIntensity;
          
          void main() {
            vUv = uv;
            vIntensity = intensity;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          varying vec2 vUv;
          varying float vIntensity;
          
          void main() {
            float centerDistance = abs(vUv.y - 0.5) * 2.0;
            float tubeFalloff = 1.0 - smoothstep(0.0, 1.0, centerDistance);
            
            float glow = sin(time * 8.0 + vUv.x * 10.0) * 0.3 + 0.7;
            float energy = sin(time * 6.0 - vUv.x * 15.0) * 0.2 + 0.8;
            
            float finalIntensity = tubeFalloff * glow * energy * vIntensity;
            gl_FragColor = vec4(color, finalIntensity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const beam = new THREE.Mesh(geometry, beamMaterial);
      beam.userData = {
        startDistance,
        endDistance,
        inclination,
        longitudeOfAscendingNode,
        startAngle,
        endAngle,
        beamIndex: i,
        activationPhase: this.rng.random() * Math.PI * 2,
        curve: curve,
        tubeRadius: tubeRadius,
        tubularSegments: tubularSegments,
        radialSegments: radialSegments,
      };

      this.energyBeams.push(beam);
      this.group.add(beam);
    }
  }

  private createEnergyParticles(): void {
    const particleCount = this.params.particleCount!;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const distance = this.planetRadius + this.params.ringDistance! + this.rng.random() * 2.0;
      const inclination = this.rng.random() * Math.PI;
      const longitudeOfAscendingNode = this.rng.random() * Math.PI * 2;
      const initialAngle = this.rng.random() * Math.PI * 2;
      const orbitalSpeed = this.rng.random() * 0.5 + 0.2;

      this.particleOrbitData.push({
        distance,
        inclination,
        longitudeOfAscendingNode,
        initialAngle,
        orbitalSpeed,
      });

      const position = this.calculateOrbitalPosition(distance, inclination, longitudeOfAscendingNode, initialAngle);

      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      const colorVariation = this.rng.random() * 0.3;
      colors[i * 3] = 0.2 + colorVariation;
      colors[i * 3 + 1] = 0.6 + colorVariation;
      colors[i * 3 + 2] = 1.0;

      sizes[i] = this.planetRadius * (0.035 + this.rng.random() * 0.045);
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        particleTexture: { value: this.createParticleTexture() },
      },
      vertexShader: `
        attribute float size;
        uniform float time;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = color;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float distanceFade = 1.0 / (1.0 + length(mvPosition.xyz) * 0.1);
          
          vAlpha = sin(time * 2.0 + position.x * 0.1) * 0.3 + 0.7;
          vAlpha *= distanceFade;
          
          gl_PointSize = size * (400.0 / -mvPosition.z) * 1.5; // Factor de escala mejorado para 4K
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D particleTexture;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec4 texColor = texture2D(particleTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    this.energyParticles = new THREE.Points(particleGeometry, particleMaterial);
    this.group.add(this.energyParticles);
  }

  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext("2d")!;

    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.4, "rgba(100, 200, 255, 0.8)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private createCurvedBeamPath(startPos: THREE.Vector3, endPos: THREE.Vector3, startDistance: number, endDistance: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const segments = 15;

    const startSpherical = new THREE.Spherical().setFromVector3(startPos);
    const endSpherical = new THREE.Spherical().setFromVector3(endPos);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      const phi = THREE.MathUtils.lerp(startSpherical.phi, endSpherical.phi, t);
      let theta = THREE.MathUtils.lerp(startSpherical.theta, endSpherical.theta, t);

      const thetaDiff = endSpherical.theta - startSpherical.theta;
      if (Math.abs(thetaDiff) > Math.PI) {
        if (thetaDiff > 0) {
          theta = THREE.MathUtils.lerp(startSpherical.theta, endSpherical.theta - 2 * Math.PI, t);
        } else {
          theta = THREE.MathUtils.lerp(startSpherical.theta, endSpherical.theta + 2 * Math.PI, t);
        }
      }

      const radius = THREE.MathUtils.lerp(startDistance, endDistance, t);

      const elevatedRadius = radius;

      const sphericalPoint = new THREE.Spherical(elevatedRadius, phi, theta);
      const cartesianPoint = new THREE.Vector3().setFromSpherical(sphericalPoint);

      points.push(cartesianPoint);
    }

    return points;
  }

  private createSpaceDistortion(): void {
    const distortionGeometry = new THREE.SphereGeometry(this.planetRadius + this.params.ringDistance! + 1.5, 32, 16);

    const distortionMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0.1, 0.3, 0.6) },
      },
      vertexShader: `
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          
          vec3 pos = position;
          float distortion = sin(pos.x * 2.0 + time) * sin(pos.y * 2.0 + time * 1.3) * sin(pos.z * 2.0 + time * 0.7);
          pos += normal * distortion * 0.1;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
          float distortionPattern = sin(vPosition.x * 5.0 + time * 2.0) * sin(vPosition.y * 5.0 + time * 1.5) * 0.5 + 0.5;
          
          float alpha = fresnel * distortionPattern * 0.15;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.spaceDistortion = new THREE.Mesh(distortionGeometry, distortionMaterial);
    this.group.add(this.spaceDistortion);
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
    const animTime = (timeSinceCosmicOrigin + this.cosmicOffset) * (this.params.orbitalSpeed || 1.0);

    this.plasmaRings.forEach((ring) => {
      const userData = ring.userData;
      const currentAngle = userData.longitudeOfAscendingNode + animTime * userData.orbitalSpeed * 0.05;

      ring.rotation.y = currentAngle;
      ring.rotation.z = userData.tiltAngle + Math.sin(animTime * 0.5 + userData.ringIndex) * 0.2;

      const material = ring.material as THREE.ShaderMaterial;
      material.uniforms.time.value = animTime;
    });

    this.energyWaves.forEach((wave) => {
      const userData = wave.userData;
      const currentAngle = userData.initialAngle + animTime * userData.orbitalSpeed * 0.1;

      const position = this.calculateOrbitalPosition(userData.distance, userData.inclination, userData.longitudeOfAscendingNode, currentAngle);
      wave.position.set(position.x, position.y, position.z);

      wave.rotation.x += 0.01 + userData.waveIndex * 0.002;
      wave.rotation.y += 0.008 + userData.waveIndex * 0.003;
      wave.rotation.z += 0.012 + userData.waveIndex * 0.001;

      const material = wave.material as THREE.ShaderMaterial;
      material.uniforms.time.value = animTime;
    });

    this.dimensionalPortals.forEach((portal) => {
      const userData = portal.userData;
      const currentAngle = userData.initialAngle + animTime * userData.orbitalSpeed * 0.08;

      const position = this.calculateOrbitalPosition(userData.distance, userData.inclination, userData.longitudeOfAscendingNode, currentAngle);
      portal.position.set(position.x, position.y, position.z);
      portal.lookAt(0, 0, 0);

      const activation = (Math.sin(animTime * 1.5 + userData.activationPhase) + 1.0) * 0.5;

      const material = portal.material as THREE.ShaderMaterial;
      material.uniforms.time.value = animTime;
      material.uniforms.activation.value = activation;
    });

    this.energyBeams.forEach((beam) => {
      const userData = beam.userData;
      const currentStartAngle = userData.startAngle + animTime * 0.1;
      const currentEndAngle = userData.endAngle + animTime * 0.15;

      const startPos = this.calculateOrbitalPosition(userData.startDistance, userData.inclination, userData.longitudeOfAscendingNode, currentStartAngle);
      const endPos = this.calculateOrbitalPosition(userData.endDistance, userData.inclination, userData.longitudeOfAscendingNode, currentEndAngle);

      const curvePoints = this.createCurvedBeamPath(startPos, endPos, userData.startDistance, userData.endDistance);
      const newCurve = new THREE.CatmullRomCurve3(curvePoints);

      beam.geometry.dispose();
      beam.geometry = new THREE.TubeGeometry(newCurve, userData.tubularSegments, userData.tubeRadius, userData.radialSegments, false);

      const intensity = (Math.sin(animTime * 3.0 + userData.activationPhase) + 1.0) * 0.5;

      const material = beam.material as THREE.ShaderMaterial;
      material.uniforms.time.value = animTime;
      material.uniforms.intensity.value = intensity;
    });

    if (this.energyParticles) {
      const particleMaterial = this.energyParticles.material as THREE.ShaderMaterial;
      particleMaterial.uniforms.time.value = animTime;

      const positions = this.energyParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length / 3; i++) {
        const orbitData = this.particleOrbitData[i];
        const currentAngle = orbitData.initialAngle + animTime * orbitData.orbitalSpeed * 0.08;

        const position = this.calculateOrbitalPosition(orbitData.distance, orbitData.inclination, orbitData.longitudeOfAscendingNode, currentAngle);

        positions[i * 3] = position.x;
        positions[i * 3 + 1] = position.y;
        positions[i * 3 + 2] = position.z;
      }
      this.energyParticles.geometry.attributes.position.needsUpdate = true;
    }

    if (this.spaceDistortion) {
      const distortionMaterial = this.spaceDistortion.material as THREE.ShaderMaterial;
      distortionMaterial.uniforms.time.value = animTime;

      this.spaceDistortion.rotation.x += 0.002;
      this.spaceDistortion.rotation.y += 0.003;
    }
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
    this.plasmaRings.forEach((ring) => {
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
    });

    this.energyWaves.forEach((wave) => {
      wave.geometry.dispose();
      (wave.material as THREE.Material).dispose();
    });

    this.dimensionalPortals.forEach((portal) => {
      portal.geometry.dispose();
      (portal.material as THREE.Material).dispose();
    });

    this.energyBeams.forEach((beam) => {
      beam.geometry.dispose();
      (beam.material as THREE.Material).dispose();
    });

    if (this.energyParticles) {
      this.energyParticles.geometry.dispose();
      (this.energyParticles.material as THREE.Material).dispose();
    }

    if (this.spaceDistortion) {
      this.spaceDistortion.geometry.dispose();
      (this.spaceDistortion.material as THREE.Material).dispose();
    }

    this.group.clear();
  }

  public setEnabled(enabled: boolean): void {
    this.group.visible = enabled;
  }

  public updateParams(newParams: Partial<LifeFormNonPhysicalEntityParams>): void {
    Object.assign(this.params, newParams);

    if (newParams.color) {
      const color = new THREE.Color(newParams.color[0], newParams.color[1], newParams.color[2]);

      this.plasmaRings.forEach((ring) => {
        const material = ring.material as THREE.ShaderMaterial;
        material.uniforms.color.value = color;
      });

      this.energyWaves.forEach((wave) => {
        const material = wave.material as THREE.ShaderMaterial;
        material.uniforms.color.value = new THREE.Color(color.r * 0.8, color.g * 0.9, color.b);
      });
    }
  }
}

export function createLifeFormNonPhysicalEntityFromPythonData(planetRadius: number, pythonData: any, globalSeed?: number): LifeFormNonPhysicalEntityEffect {
  const seed = globalSeed || Math.floor(Math.random() * 1000000);

  const params: LifeFormNonPhysicalEntityParams = {
    seed: seed + 70003,
    color: pythonData.color || [0.2, 0.6, 1.0],
    cosmicOriginTime: pythonData?.timing?.cosmic_origin_time || pythonData?.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME,
  };

  return new LifeFormNonPhysicalEntityEffect(planetRadius, params);
}
