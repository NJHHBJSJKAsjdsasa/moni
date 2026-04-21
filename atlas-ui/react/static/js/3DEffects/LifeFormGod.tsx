// atlas-ui/react/static/js/3DEffects/LifeFormGod.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

const PROCEDURAL_RANGES = {
  SACRED_SYMBOL_COUNT: { min: 12, max: 24 },
  ORBITAL_CROSS_COUNT: { min: 8, max: 16 },
  SACRED_CIRCLE_COUNT: { min: 24, max: 32 },
  GOLDEN_PARTICLE_COUNT: { min: 200, max: 350 },
  DIVINE_PULSE_INTENSITY: { min: 3.0, max: 8.0 },
  ORBITAL_SPEED: { min: 0.2, max: 1.0 },
  CROSS_SPIRAL_COUNT: { min: 3, max: 6 },
  HOLOGRAM_RING_COUNT: { min: 4, max: 8 },
  BINARY_DIGIT_COUNT: { min: 200, max: 600 },
};

export interface LifeFormGodParams {
  color?: number[] | THREE.Color;
  sacredSymbolCount?: number;
  orbitalCrossCount?: number;
  sacredCircleCount?: number;
  goldenParticleCount?: number;
  divinePulseIntensity?: number;
  orbitalSpeed?: number;
  crossSpiralCount?: number;
  hologramRingCount?: number;
  binaryDigitCount?: number;
  planetPosition?: THREE.Vector3;
  seed?: number;
  cosmicOriginTime?: number;
}

export class LifeFormGodEffect {
  private group: THREE.Group;
  private digitalGodSphere: THREE.Group;
  private godSphere: THREE.Mesh;
  private binaryDigits: THREE.Points[] = [];
  private binaryDigitData: Array<{
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    digit: number;
    scale: number;
    orbitalSpeed: number;
    phase: number;
  }> = [];
  private sacredSymbols: THREE.Mesh[] = [];
  private orbitalCrosses: THREE.Mesh[] = [];
  private crossSpirals: THREE.Mesh[] = [];
  private hologramRings: THREE.Mesh[] = [];
  private sacredCircles: THREE.Mesh[] = [];
  private goldenParticles: THREE.Points;
  private divineParticles: THREE.Points;
  private energyWaves: THREE.Mesh[] = [];
  private particleOrbitData: Array<{
    distance: number;
    inclination: number;
    longitudeOfAscendingNode: number;
    initialAngle: number;
    orbitalSpeed: number;
    fallSpeed: number;
  }> = [];
  private divineParticleOrbitData: Array<{
    distance: number;
    inclination: number;
    longitudeOfAscendingNode: number;
    initialAngle: number;
    orbitalSpeed: number;
    phase: number;
  }> = [];
  private spaceDistortion: THREE.Mesh;
  private divineLight: THREE.PointLight;
  private holyLights: THREE.PointLight[] = [];
  private params: LifeFormGodParams;
  private rng: SeededRandom;
  private planetRadius: number;
  private cosmicOffset: number;

  constructor(planetRadius: number, params: LifeFormGodParams = {}) {
    this.planetRadius = planetRadius;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    this.rng = new SeededRandom(seed);

    this.params = {
      color: params.color || [1.0, 0.84, 0.0], // Divine gold
      sacredSymbolCount: params.sacredSymbolCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.SACRED_SYMBOL_COUNT.max - PROCEDURAL_RANGES.SACRED_SYMBOL_COUNT.min) + PROCEDURAL_RANGES.SACRED_SYMBOL_COUNT.min),
      orbitalCrossCount: params.orbitalCrossCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.ORBITAL_CROSS_COUNT.max - PROCEDURAL_RANGES.ORBITAL_CROSS_COUNT.min) + PROCEDURAL_RANGES.ORBITAL_CROSS_COUNT.min),
      sacredCircleCount: params.sacredCircleCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.SACRED_CIRCLE_COUNT.max - PROCEDURAL_RANGES.SACRED_CIRCLE_COUNT.min) + PROCEDURAL_RANGES.SACRED_CIRCLE_COUNT.min),
      goldenParticleCount: params.goldenParticleCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.GOLDEN_PARTICLE_COUNT.max - PROCEDURAL_RANGES.GOLDEN_PARTICLE_COUNT.min) + PROCEDURAL_RANGES.GOLDEN_PARTICLE_COUNT.min),
      divinePulseIntensity: params.divinePulseIntensity || this.rng.random() * (PROCEDURAL_RANGES.DIVINE_PULSE_INTENSITY.max - PROCEDURAL_RANGES.DIVINE_PULSE_INTENSITY.min) + PROCEDURAL_RANGES.DIVINE_PULSE_INTENSITY.min,
      orbitalSpeed: params.orbitalSpeed || this.rng.random() * (PROCEDURAL_RANGES.ORBITAL_SPEED.max - PROCEDURAL_RANGES.ORBITAL_SPEED.min) + PROCEDURAL_RANGES.ORBITAL_SPEED.min,
      crossSpiralCount: params.crossSpiralCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.CROSS_SPIRAL_COUNT.max - PROCEDURAL_RANGES.CROSS_SPIRAL_COUNT.min) + PROCEDURAL_RANGES.CROSS_SPIRAL_COUNT.min),
      hologramRingCount: params.hologramRingCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.HOLOGRAM_RING_COUNT.max - PROCEDURAL_RANGES.HOLOGRAM_RING_COUNT.min) + PROCEDURAL_RANGES.HOLOGRAM_RING_COUNT.min),
      cosmicOriginTime: params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME,
      seed,
    };

    this.cosmicOffset = (seed % 100) * 0.1;

    this.group = new THREE.Group();
    this.createDigitalGodSphere();
    this.createBinaryDigits();
    this.createSacredSymbols();
    this.createOrbitalCrosses();
    this.createCrossSpirals();
    this.createHologramRings();
    this.createSacredCircles();
    this.createGoldenParticles();
    this.createDivineParticles();
    this.createEnergyWaves();
    this.createSpaceDistortion();
    this.createDivineLight();
    this.createHolyLights();
  }

  private createDigitalGodSphere(): void {
    this.digitalGodSphere = new THREE.Group();

    const sphereSize = this.planetRadius * 1.33;

    const sphereGeometry = new THREE.SphereGeometry(sphereSize, 64, 64);
    const sphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(1.0, 0.8, 0.0) },
        pulseIntensity: { value: this.params.divinePulseIntensity! },
        planetRadius: { value: this.planetRadius },
      },
      vertexShader: `
        uniform float time;
        uniform float pulseIntensity;
        uniform float planetRadius;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying float vPulse;
        varying float vDistanceFromCenter;
        
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          vDistanceFromCenter = length(position);
          
          float pulse = sin(time * 2.0) * 0.03 + 1.0;
          vPulse = pulse * pulseIntensity;
          
          vec3 pos = position * pulse;
          // Digital energy waves
          pos += normal * sin(time * 3.0 + length(position) * 0.1) * 0.02;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        uniform float planetRadius;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying float vPulse;
        varying float vDistanceFromCenter;
        
        void main() {
          vec3 digitalColor = color;
          
          float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
          
          float gridX = sin(vUv.x * 120.0 + time * 2.5) * 0.5 + 0.5;
          float gridY = sin(vUv.y * 100.0 + time * 2.0) * 0.5 + 0.5;
          float grid = step(0.92, gridX) + step(0.92, gridY);

          float gridDiag = sin((vUv.x + vUv.y) * 90.0 + time * 1.8) * 0.5 + 0.5;
          grid += step(0.95, gridDiag) * 0.5;
          grid *= 1.0;
          
          float dataStream = sin(vUv.y * 70.0 - time * 6.0) * 0.5 + 0.5;
          float dataStream2 = sin(vUv.x * 60.0 + time * 4.5) * 0.5 + 0.5;
          dataStream = step(0.65, dataStream) * 0.8 + step(0.75, dataStream2) * 0.6;
          
          float waves = sin(vDistanceFromCenter * 0.4 + time * 5.0) * 0.3 + 0.7;
          waves += sin(vDistanceFromCenter * 0.8 + time * 3.0) * 0.2;
          waves += sin(vDistanceFromCenter * 1.2 - time * 2.0) * 0.15;
          
          vec3 finalColor = digitalColor * waves;
          finalColor += vec3(1.0, 0.9, 0.3) * grid;
          finalColor += vec3(1.0, 0.8, 0.2) * dataStream; 
          finalColor += vec3(1.0, 0.7, 0.1) * fresnel * 0.8; 
          
          float distanceFade = smoothstep(planetRadius * 1.4, planetRadius * 1.0, vDistanceFromCenter);
          float alpha = (0.6 + fresnel * 0.4 + grid * 0.3 + dataStream * 0.25) * distanceFade;
          
          gl_FragColor = vec4(finalColor * vPulse, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.godSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.digitalGodSphere.add(this.godSphere);

    const planetPos = this.params.planetPosition || new THREE.Vector3(0, 0, 0);
    this.digitalGodSphere.position.copy(planetPos);

    this.digitalGodSphere.userData = {
      rotationSpeed: 0.002,
      planetPosition: planetPos.clone(),
      baseRotationX: this.digitalGodSphere.rotation.x,
      baseRotationY: this.digitalGodSphere.rotation.y,
    };

    this.group.add(this.digitalGodSphere);
  }

  private createBinaryDigits(): void {
    const digitCount = this.params.binaryDigitCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.BINARY_DIGIT_COUNT.max - PROCEDURAL_RANGES.BINARY_DIGIT_COUNT.min) + PROCEDURAL_RANGES.BINARY_DIGIT_COUNT.min);
    const sphereRadius = this.planetRadius * 1.35;

    for (let system = 0; system < 5; system++) {
      const digitsInSystem = Math.floor(digitCount / 5);
      const positions = new Float32Array(digitsInSystem * 3);
      const colors = new Float32Array(digitsInSystem * 3);
      const sizes = new Float32Array(digitsInSystem);
      const digits = new Float32Array(digitsInSystem);

      for (let i = 0; i < digitsInSystem; i++) {
        const goldenAngle = Math.PI * (3.0 - Math.sqrt(5.0));
        const globalIndex = system * digitsInSystem + i;

        const y = 1 - (globalIndex / (digitCount - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = goldenAngle * globalIndex;

        const x = sphereRadius * Math.cos(theta) * radius;
        const z = sphereRadius * Math.sin(theta) * radius;
        const yPos = sphereRadius * y;

        positions[i * 3] = x;
        positions[i * 3 + 1] = yPos;
        positions[i * 3 + 2] = z;

        const digit = Math.floor(this.rng.random() * 2);
        digits[i] = digit;

        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;

        sizes[i] = this.planetRadius * (0.06 + this.rng.random() * 0.04);

        this.binaryDigitData.push({
          position: new THREE.Vector3(x, yPos, z),
          velocity: new THREE.Vector3((this.rng.random() - 0.5) * 0.02, (this.rng.random() - 0.5) * 0.02, (this.rng.random() - 0.5) * 0.02),
          digit: digit,
          scale: sizes[i],
          orbitalSpeed: 0.5 + this.rng.random() * 0.5,
          phase: this.rng.random() * Math.PI * 2,
        });
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute("digit", new THREE.BufferAttribute(digits, 1));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          digitTexture: { value: this.createBinaryDigitTexture() },
        },
        vertexShader: `
          attribute float size;
          attribute float digit;
          uniform float time;
          varying vec3 vColor;
          varying float vAlpha;
          varying float vDigit;
          
          void main() {
            vColor = color;
            vDigit = digit;
            
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float distanceFade = 1.0 / (1.0 + length(mvPosition.xyz) * 0.01);
            
            float pulse = sin(time * 4.0 + position.x * 0.15 + position.y * 0.15 + digit * 3.14) * 0.4 + 0.6;

            float matrixFlicker = step(0.95, sin(time * 20.0 + position.x * 50.0 + position.y * 30.0));
            vAlpha = (pulse + matrixFlicker * 0.8) * distanceFade;
            
            gl_PointSize = size * (400.0 / -mvPosition.z) * (1.0 + pulse * 0.5 + matrixFlicker * 0.3);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D digitTexture;
          varying vec3 vColor;
          varying float vAlpha;
          varying float vDigit;
          
          void main() {
            vec4 texColor = texture2D(digitTexture, gl_PointCoord);
            
            vec2 coord = gl_PointCoord;
            coord.y = 1.0 - coord.y; 
            if (vDigit < 0.5) {
              coord.x *= 0.5;
            } else {
              coord.x = coord.x * 0.5 + 0.5;
            }
            
            vec4 finalTexColor = texture2D(digitTexture, coord);
            vec3 finalColor = vColor * finalTexColor.rgb;
            
            gl_FragColor = vec4(finalColor, finalTexColor.a * vAlpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true,
      });

      const pointCloud = new THREE.Points(geometry, material);
      pointCloud.userData = { systemIndex: system };
      this.binaryDigits.push(pointCloud);
      this.digitalGodSphere.add(pointCloud);
    }
  }

  private createSacredSymbols(): void {
    const symbolCount = this.params.sacredSymbolCount!;

    for (let i = 0; i < symbolCount; i++) {
      const distance = this.planetRadius + 2.0 + this.rng.random() * 1.5;
      const inclination = this.rng.random() * Math.PI;
      const longitudeOfAscendingNode = this.rng.random() * Math.PI * 2;
      const initialAngle = this.rng.random() * Math.PI * 2;

      const position = this.calculateOrbitalPosition(distance, inclination, longitudeOfAscendingNode, initialAngle);

      const symbolType = Math.floor(this.rng.random() * 2);
      let symbolGeometry: THREE.BufferGeometry;

      if (symbolType === 0) {
        symbolGeometry = this.createStarGeometry();
      } else {
        symbolGeometry = new THREE.ConeGeometry(this.planetRadius * 0.08, this.planetRadius * 0.12, 3);
      }

      const symbolMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(this.params.color![0] * 0.9, this.params.color![1] * 1.1, this.params.color![2] * 0.9) },
          symbolIndex: { value: i },
          symbolType: { value: symbolType },
        },
        vertexShader: `
          uniform float time;
          uniform float symbolIndex;
          varying vec3 vPosition;
          varying float vSacred;
          
          void main() {
            vPosition = position;
            
            float sacred = sin(time * 4.0 + symbolIndex * 2.0) * 0.3 + 0.7;
            vSacred = sacred;
            
            vec3 pos = position * (1.0 + sacred * 0.2);
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          uniform float symbolType;
          varying vec3 vPosition;
          varying float vSacred;
          
          void main() {
            float divine = sin(time * 6.0 + vPosition.x * 5.0) * 0.2 + 0.8;
            float sacred = sin(time * 3.0 + symbolType * 3.14) * 0.1 + 0.9;
            
            vec3 holyColor = color * divine * sacred;
            float alpha = vSacred * 0.9;
            
            gl_FragColor = vec4(holyColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
      symbol.position.set(position.x, position.y, position.z);
      symbol.lookAt(0, 0, 0);

      symbol.userData = {
        distance: distance,
        inclination: inclination,
        longitudeOfAscendingNode: longitudeOfAscendingNode,
        initialAngle: initialAngle,
        orbitalSpeed: this.rng.random() * 0.3 + 0.1,
        symbolIndex: i,
        symbolType: symbolType,
      };

      this.sacredSymbols.push(symbol);
      this.group.add(symbol);
    }
  }

  private createCrossGeometry(): THREE.BufferGeometry {
    const size = this.planetRadius * 0.1;
    const thickness = size * 0.2;

    const verticalGeometry = new THREE.BoxGeometry(thickness, size, thickness);
    const horizontalGeometry = new THREE.BoxGeometry(size * 0.6, thickness, thickness);
    const horizontalGeometry2 = horizontalGeometry.clone();
    horizontalGeometry2.translate(0, size * 0.2, 0);

    const positions1 = verticalGeometry.attributes.position.array;
    const positions2 = horizontalGeometry2.attributes.position.array;

    const totalVertices = positions1.length + positions2.length;
    const mergedPositions = new Float32Array(totalVertices);
    mergedPositions.set(positions1, 0);
    mergedPositions.set(positions2, positions1.length);

    const mergedGeometry = new THREE.BufferGeometry();
    mergedGeometry.setAttribute("position", new THREE.BufferAttribute(mergedPositions, 3));
    mergedGeometry.computeVertexNormals();

    return mergedGeometry;
  }

  private createEnhancedCrossGeometry(): THREE.BufferGeometry {
    const size = this.planetRadius * 0.15;
    const thickness = size * 0.15;

    const verticalGeometry = new THREE.BoxGeometry(thickness, size, thickness);
    const horizontalGeometry = new THREE.BoxGeometry(size * 0.7, thickness, thickness);
    const horizontalGeometry2 = horizontalGeometry.clone();
    horizontalGeometry2.translate(0, size * 0.15, 0);

    const sphereGeometry = new THREE.SphereGeometry(thickness * 0.8, 8, 8);
    const topSphere = sphereGeometry.clone();
    const bottomSphere = sphereGeometry.clone();
    const leftSphere = sphereGeometry.clone();
    const rightSphere = sphereGeometry.clone();

    topSphere.translate(0, size * 0.4, 0);
    bottomSphere.translate(0, -size * 0.4, 0);
    leftSphere.translate(-size * 0.25, size * 0.15, 0);
    rightSphere.translate(size * 0.25, size * 0.15, 0);

    const geometries = [verticalGeometry, horizontalGeometry2, topSphere, bottomSphere, leftSphere, rightSphere];

    let totalVertices = 0;
    geometries.forEach((geo) => (totalVertices += geo.attributes.position.count * 3));

    const mergedPositions = new Float32Array(totalVertices);
    let offset = 0;

    geometries.forEach((geo) => {
      const positions = geo.attributes.position.array;
      mergedPositions.set(positions, offset);
      offset += positions.length;
    });

    const mergedGeometry = new THREE.BufferGeometry();
    mergedGeometry.setAttribute("position", new THREE.BufferAttribute(mergedPositions, 3));
    mergedGeometry.computeVertexNormals();

    return mergedGeometry;
  }

  private createStarGeometry(): THREE.BufferGeometry {
    const outerRadius = this.planetRadius * 0.08;
    const innerRadius = outerRadius * 0.4;
    const points = 5;

    const vertices = [];

    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      vertices.push(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));

    const indices = [];
    for (let i = 0; i < points * 2 - 2; i++) {
      indices.push(0, i + 1, i + 2);
    }
    indices.push(0, points * 2 - 1, 1);

    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  private createOrbitalCrosses(): void {
    const crossCount = this.params.orbitalCrossCount!;

    for (let i = 0; i < crossCount; i++) {
      const goldenAngle = Math.PI * (3.0 - Math.sqrt(5.0));
      const distance = this.planetRadius + 1.5 + i * i * 0.3 + this.rng.random() * 0.5;
      const inclination = Math.acos(1 - (2 * (i + this.rng.random())) / crossCount);
      const longitudeOfAscendingNode = i * goldenAngle + this.rng.random() * 0.5;
      const initialAngle = this.rng.random() * Math.PI * 2;

      const crossGeometry = this.createEnhancedCrossGeometry();

      const crossMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(this.params.color![0], this.params.color![1] * 0.8, this.params.color![2] * 1.2) },
          crossIndex: { value: i },
          divinePulse: { value: this.params.divinePulseIntensity! },
        },
        vertexShader: `
          uniform float time;
          uniform float crossIndex;
          uniform float divinePulse;
          varying float vBlessing;
          varying vec3 vPosition;
          varying vec3 vNormal;
          
          void main() {
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            
            float blessing = sin(time * 5.0 + crossIndex * 1.5) * 0.4 + 0.6;
            float divineScale = sin(time * 3.0 + crossIndex) * 0.3 + 1.0;
            vBlessing = blessing * divinePulse;
            
            vec3 pos = position * divineScale;
            pos += normal * sin(time * 4.0 + position.x * 10.0) * 0.02;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          uniform float crossIndex;
          varying float vBlessing;
          varying vec3 vPosition;
          varying vec3 vNormal;
          
          void main() {
            float divine = sin(time * 8.0 + vPosition.x * 5.0) * sin(time * 6.0 + vPosition.y * 3.0) * 0.3 + 0.7;
            float sacred = sin(time * 10.0 + crossIndex * 2.0) * 0.2 + 0.8;
            
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
            float shimmer = sin(time * 15.0 + vPosition.x * 20.0 + vPosition.y * 15.0) * 0.5 + 0.5;
            
            vec3 finalColor = color * divine * sacred;
            finalColor += vec3(1.0, 1.0, 0.8) * fresnel * shimmer * 0.3;
            
            gl_FragColor = vec4(finalColor, vBlessing * (1.0 + fresnel * 0.5));
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const cross = new THREE.Mesh(crossGeometry, crossMaterial);

      const rotationPhaseX = i * goldenAngle;
      const rotationPhaseY = i * goldenAngle * 1.618;
      const rotationPhaseZ = i * goldenAngle * 0.618;

      cross.userData = {
        distance: distance,
        inclination: inclination,
        longitudeOfAscendingNode: longitudeOfAscendingNode,
        initialAngle: initialAngle,
        orbitalSpeed: (0.2 + (i % 3) * 0.1) * this.params.orbitalSpeed!,
        crossIndex: i,
        rotationPhaseX: rotationPhaseX,
        rotationPhaseY: rotationPhaseY,
        rotationPhaseZ: rotationPhaseZ,
        rotationSpeedX: (this.rng.random() - 0.5) * 0.02,
        rotationSpeedY: (this.rng.random() - 0.5) * 0.03,
        rotationSpeedZ: (this.rng.random() - 0.5) * 0.025,
      };

      this.orbitalCrosses.push(cross);
      this.group.add(cross);
    }
  }

  private createCrossSpirals(): void {
    const spiralCount = this.params.crossSpiralCount!;

    for (let s = 0; s < spiralCount; s++) {
      const crossesInSpiral = 12 + s * 6;
      const spiralRadius = this.planetRadius + 2.0 + s * 1.5;
      const spiralHeight = this.planetRadius * 2.0;

      for (let i = 0; i < crossesInSpiral; i++) {
        const t = i / crossesInSpiral;
        const angle = t * Math.PI * 6;
        const height = (t - 0.5) * spiralHeight;
        const currentRadius = spiralRadius * (1.0 + Math.sin(t * Math.PI * 3) * 0.2);

        const x = Math.cos(angle) * currentRadius;
        const z = Math.sin(angle) * currentRadius;
        const y = height;

        const crossGeometry = this.createEnhancedCrossGeometry();
        const crossMaterial = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            color: { value: new THREE.Color(1.0, 0.9, 0.3) },
            spiralIndex: { value: s },
            crossIndex: { value: i },
          },
          vertexShader: `
            uniform float time;
            uniform float spiralIndex;
            uniform float crossIndex;
            varying float vHoliness;
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
              vPosition = position;
              vNormal = normalize(normalMatrix * normal);
              
              float holiness = sin(time * 7.0 + spiralIndex + crossIndex * 0.5) * 0.5 + 0.5;
              vHoliness = holiness;
              
              vec3 pos = position;
              pos *= (1.0 + holiness * 0.3);
              
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 color;
            uniform float time;
            varying float vHoliness;
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
              float divine = sin(time * 12.0 + vPosition.x * 8.0 + vPosition.y * 6.0) * 0.4 + 0.6;
              float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
              
              vec3 finalColor = color * divine;
              finalColor += vec3(1.0, 1.0, 1.0) * fresnel * 0.5;
              
              gl_FragColor = vec4(finalColor, vHoliness * (0.8 + fresnel * 0.4));
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        });

        const cross = new THREE.Mesh(crossGeometry, crossMaterial);
        cross.position.set(x, y, z);
        cross.lookAt(0, 0, 0);

        cross.userData = {
          spiralIndex: s,
          crossIndex: i,
          angle: angle,
          spiralRadius: spiralRadius,
          height: height,
          rotationSpeed: (this.rng.random() - 0.5) * 0.03,
        };

        this.crossSpirals.push(cross);
        this.group.add(cross);
      }
    }
  }

  private createHologramRings(): void {
    const ringCount = this.params.hologramRingCount!;

    for (let i = 0; i < ringCount; i++) {
      const ringRadius = this.planetRadius + 1.0 + i * 0.8;
      const ringGeometry = new THREE.RingGeometry(ringRadius, ringRadius + 0.02, 128, 1);

      const ringMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0.3 + i * 0.1, 0.8, 1.0) },
          ringIndex: { value: i },
        },
        vertexShader: `
          uniform float time;
          uniform float ringIndex;
          varying vec2 vUv;
          varying float vHologram;
          
          void main() {
            vUv = uv;
            
            float hologram = sin(time * 8.0 + ringIndex * 2.0) * 0.3 + 0.7;
            vHologram = hologram;
            
            vec3 pos = position;
            pos.z += sin(time * 5.0 + atan(pos.y, pos.x) * 20.0) * 0.1;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          uniform float ringIndex;
          varying vec2 vUv;
          varying float vHologram;
          
          void main() {
            float dist = length(vUv - 0.5);
            float ring = 1.0 - smoothstep(0.48, 0.5, dist);
            ring *= smoothstep(0.45, 0.47, dist);
            
            float scanlines = sin(dist * 200.0 + time * 10.0) * 0.5 + 0.5;
            float hologram = sin(time * 15.0 + dist * 50.0) * 0.3 + 0.7;
            
            float intensity = ring * scanlines * hologram * vHologram;
            
            gl_FragColor = vec4(color, intensity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 + i * 0.2;
      ring.rotation.y = i * 0.3;

      ring.userData = {
        ringIndex: i,
        baseRotationX: ring.rotation.x,
        baseRotationY: ring.rotation.y,
        rotationSpeed: (this.rng.random() - 0.5) * 0.01,
      };

      this.hologramRings.push(ring);
      this.group.add(ring);
    }
  }

  private createSacredCircles(): void {
    const circleCount = this.params.sacredCircleCount!;

    for (let i = 0; i < circleCount; i++) {
      const baseRadius = this.planetRadius + 1.8 + (i % 5) * 0.4;
      const ringThickness = 0.05 + (i % 3) * 0.02;

      const circleGeometry = new THREE.RingGeometry(baseRadius - ringThickness, baseRadius + ringThickness, 128, 4);

      const circleMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(1.0, 0.8, 0.1) },
          circleIndex: { value: i },
          ringRadius: { value: baseRadius },
        },
        vertexShader: `
          uniform float time;
          uniform float circleIndex;
          uniform float ringRadius;
          varying vec2 vUv;
          varying vec3 vPosition;
          varying float vEnergy;
          varying float vDistance;
          
          void main() {
            vUv = uv;
            vPosition = position;
            vDistance = length(position);
            
            float energy1 = sin(time * 3.0 + circleIndex * 0.8) * 0.2 + 0.8;
            float energy2 = sin(time * 5.0 + atan(position.y, position.x) * 8.0) * 0.3 + 0.7;
            vEnergy = energy1 * energy2;
            
            vec3 pos = position;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          uniform float circleIndex;
          varying vec2 vUv;
          varying vec3 vPosition;
          varying float vEnergy;
          varying float vDistance;
          
          void main() {
            float dist = length(vUv - 0.5);
            float ring = smoothstep(0.4, 0.42, dist) * (1.0 - smoothstep(0.48, 0.5, dist));
            
            float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
            float segments = sin(angle * 20.0 + time * 2.0 + circleIndex * 3.0) * 0.5 + 0.5;
            segments = step(0.3, segments);
            
            float dataFlow = sin(angle * 15.0 - time * 8.0) * 0.5 + 0.5;
            dataFlow = step(0.7, dataFlow) * 0.8;
            
            float shimmer = sin(time * 12.0 + angle * 25.0 + dist * 30.0) * 0.3 + 0.7;
            
            float intensity = ring * (segments * 0.7 + dataFlow * 0.5 + 0.3) * shimmer * vEnergy;
            
            vec3 finalColor = color;
            finalColor += vec3(0.2, 0.3, 0.0) * sin(circleIndex * 2.0); 
            
            gl_FragColor = vec4(finalColor, intensity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const circle = new THREE.Mesh(circleGeometry, circleMaterial);

      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      const fibonacci = ((i * goldenRatio) % 1) * Math.PI * 2;

      circle.rotation.x = fibonacci + i * 0.3;
      circle.rotation.y = fibonacci * 1.618 + i * 0.4;
      circle.rotation.z = fibonacci * 0.618 + i * 0.2;

      circle.userData = {
        circleIndex: i,
        orbitalSpeed: 0.3 + this.rng.random() * 0.4,
        baseRotationX: circle.rotation.x,
        baseRotationY: circle.rotation.y,
        baseRotationZ: circle.rotation.z,
        orbitalPhase: fibonacci,
      };

      this.sacredCircles.push(circle);
      this.group.add(circle);
    }
  }

  private createGoldenParticles(): void {
    const particleCount = this.params.goldenParticleCount!;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const distance = this.planetRadius + this.rng.random() * 4.0;
      const inclination = this.rng.random() * Math.PI;
      const longitudeOfAscendingNode = this.rng.random() * Math.PI * 2;
      const initialAngle = this.rng.random() * Math.PI * 2;
      const orbitalSpeed = this.rng.random() * 0.5 + 0.2;
      const fallSpeed = this.rng.random() * 0.02 + 0.01;

      this.particleOrbitData.push({
        distance,
        inclination,
        longitudeOfAscendingNode,
        initialAngle,
        orbitalSpeed,
        fallSpeed,
      });

      const position = this.calculateOrbitalPosition(distance, inclination, longitudeOfAscendingNode, initialAngle);

      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y + this.rng.random() * 2.0;
      positions[i * 3 + 2] = position.z;

      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.84 + this.rng.random() * 0.16;
      colors[i * 3 + 2] = 0.0 + this.rng.random() * 0.3;

      sizes[i] = this.planetRadius * (0.01 + this.rng.random() * 0.02);
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        particleTexture: { value: this.createDivineParticleTexture() },
      },
      vertexShader: `
        attribute float size;
        uniform float time;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = color;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float distanceFade = 1.0 / (1.0 + length(mvPosition.xyz) * 0.05);
          
          vAlpha = sin(time * 3.0 + position.x * 0.1) * 0.4 + 0.6;
          vAlpha *= distanceFade;
          
          gl_PointSize = size * (400.0 / -mvPosition.z);
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

    this.goldenParticles = new THREE.Points(particleGeometry, particleMaterial);
    this.group.add(this.goldenParticles);
  }

  private createDivineParticles(): void {
    const particleCount = Math.floor(this.params.goldenParticleCount! * 0.3);
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const distance = this.planetRadius + this.rng.random() * 6.0;
      const inclination = this.rng.random() * Math.PI;
      const longitudeOfAscendingNode = this.rng.random() * Math.PI * 2;
      const initialAngle = this.rng.random() * Math.PI * 2;
      const orbitalSpeed = this.rng.random() * 0.8 + 0.3;
      const phase = this.rng.random() * Math.PI * 2;

      this.divineParticleOrbitData.push({
        distance,
        inclination,
        longitudeOfAscendingNode,
        initialAngle,
        orbitalSpeed,
        phase,
      });

      const position = this.calculateOrbitalPosition(distance, inclination, longitudeOfAscendingNode, initialAngle);

      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 0.8 + this.rng.random() * 0.2;

      sizes[i] = this.planetRadius * (0.02 + this.rng.random() * 0.03);
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        particleTexture: { value: this.createDivineStarTexture() },
      },
      vertexShader: `
        attribute float size;
        uniform float time;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = color;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float distanceFade = 1.0 / (1.0 + length(mvPosition.xyz) * 0.03);
          
          float pulse = sin(time * 4.0 + position.x * 0.2 + position.y * 0.15) * 0.5 + 0.5;
          vAlpha = pulse * distanceFade;
          
          gl_PointSize = size * (500.0 / -mvPosition.z) * (1.0 + pulse * 0.5);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D particleTexture;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec4 texColor = texture2D(particleTexture, gl_PointCoord);
          vec3 finalColor = vColor * texColor.rgb;
          finalColor += vec3(0.3, 0.3, 0.8) * texColor.a * 0.5;
          gl_FragColor = vec4(finalColor, texColor.a * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    this.divineParticles = new THREE.Points(particleGeometry, particleMaterial);
    this.group.add(this.divineParticles);
  }

  private createEnergyWaves(): void {
    const waveCount = 6;

    for (let i = 0; i < waveCount; i++) {
      const waveRadius = this.planetRadius + 3.0 + i * 1.0;
      const waveGeometry = new THREE.SphereGeometry(waveRadius, 64, 32);

      const waveMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0.2, 0.6, 1.0) },
          waveIndex: { value: i },
        },
        vertexShader: `
          uniform float time;
          uniform float waveIndex;
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vWave;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            
            float wave = sin(time * 3.0 + waveIndex * 0.5) * 0.5 + 0.5;
            vWave = wave;
            
            vec3 pos = position * (1.0 + wave * 0.1);
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vWave;
          
          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 4.0);
            float energy = sin(vPosition.x * 2.0 + time * 2.0) * sin(vPosition.y * 2.0 + time * 1.5) * sin(vPosition.z * 2.0 + time * 3.0);
            energy = energy * 0.3 + 0.7;
            
            float alpha = fresnel * energy * vWave * 0.1;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      });

      const wave = new THREE.Mesh(waveGeometry, waveMaterial);
      wave.userData = {
        waveIndex: i,
        rotationSpeed: (this.rng.random() - 0.5) * 0.005,
      };

      this.energyWaves.push(wave);
      this.group.add(wave);
    }
  }

  private createHolyLights(): void {
    const lightCount = 8;

    for (let i = 0; i < lightCount; i++) {
      const angle = (i / lightCount) * Math.PI * 2;
      const distance = this.planetRadius + 2.0;
      const height = (this.rng.random() - 0.5) * this.planetRadius;

      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const y = height;

      const light = new THREE.PointLight(new THREE.Color(1.0, 0.9, 0.7), 1.5, this.planetRadius * 8.0);

      light.position.set(x, y, z);
      light.userData = {
        lightIndex: i,
        baseX: x,
        baseY: y,
        baseZ: z,
        angle: angle,
        distance: distance,
        orbitalSpeed: 0.1 + this.rng.random() * 0.2,
      };

      this.holyLights.push(light);
      this.group.add(light);
    }
  }

  private createDivineParticleTexture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d")!;

    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 215, 0, 1)");
    gradient.addColorStop(0.3, "rgba(255, 255, 100, 0.8)");
    gradient.addColorStop(0.7, "rgba(255, 200, 50, 0.4)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);

    context.strokeStyle = "rgba(255, 255, 255, 0.8)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(32, 16);
    context.lineTo(32, 48);
    context.moveTo(16, 32);
    context.lineTo(48, 32);
    context.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private createDivineStarTexture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d")!;

    const centerX = 64,
      centerY = 64,
      radius = 60;

    const outerGradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    outerGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    outerGradient.addColorStop(0.2, "rgba(255, 255, 200, 0.9)");
    outerGradient.addColorStop(0.5, "rgba(200, 200, 255, 0.6)");
    outerGradient.addColorStop(0.8, "rgba(100, 150, 255, 0.3)");
    outerGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    context.fillStyle = outerGradient;
    context.fillRect(0, 0, 128, 128);

    context.strokeStyle = "rgba(255, 255, 255, 0.8)";
    context.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const startR = 10;
      const endR = 55;

      context.beginPath();
      context.moveTo(centerX + Math.cos(angle) * startR, centerY + Math.sin(angle) * startR);
      context.lineTo(centerX + Math.cos(angle) * endR, centerY + Math.sin(angle) * endR);
      context.stroke();
    }

    const innerGradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 20);
    innerGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    innerGradient.addColorStop(0.5, "rgba(255, 255, 200, 0.8)");
    innerGradient.addColorStop(1, "rgba(255, 200, 100, 0.4)");

    context.fillStyle = innerGradient;
    context.beginPath();
    context.arc(centerX, centerY, 20, 0, Math.PI * 2);
    context.fill();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private createBinaryDigitTexture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const context = canvas.getContext("2d")!;

    context.fillStyle = "rgba(0, 0, 0, 0)";
    context.fillRect(0, 0, 128, 64);

    context.fillStyle = "rgba(255, 255, 255, 1)";
    context.font = "bold 48px monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("0", 32, 32);

    context.fillText("1", 96, 32);

    context.shadowColor = "#ffffff";
    context.shadowBlur = 8;
    context.fillStyle = "rgba(255, 255, 255, 0.9)";
    context.fillText("0", 32, 32);
    context.fillText("1", 96, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createSpaceDistortion(): void {
    const distortionGeometry = new THREE.SphereGeometry(this.planetRadius + 5.0, 64, 32);

    const distortionMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(this.params.color![0] * 0.3, this.params.color![1] * 0.3, this.params.color![2] * 0.1) },
      },
      vertexShader: `
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          
          vec3 pos = position;
          float distortion = sin(pos.x * 1.5 + time * 0.5) * sin(pos.y * 1.5 + time * 0.7) * sin(pos.z * 1.5 + time * 0.3);
          pos += normal * distortion * 0.2;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 4.0);
          float divine = sin(vPosition.x * 3.0 + time) * sin(vPosition.y * 3.0 + time * 1.3) * sin(vPosition.z * 3.0 + time * 0.7) * 0.5 + 0.5;
          
          float alpha = fresnel * divine * 0.1;
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

  private createDivineLight(): void {
    this.divineLight = new THREE.PointLight(new THREE.Color(this.params.color![0], this.params.color![1], this.params.color![2]), 2.0, this.planetRadius * 10.0);
    this.divineLight.position.set(0, this.planetRadius * 1.5, 0);
    this.group.add(this.divineLight);
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

    if (this.digitalGodSphere) {
      const userData = this.digitalGodSphere.userData;

      if (this.params.planetPosition && userData.planetPosition) {
        if (!this.params.planetPosition.equals(userData.planetPosition)) {
          this.digitalGodSphere.position.copy(this.params.planetPosition);
          userData.planetPosition.copy(this.params.planetPosition);
        }
      }

      this.digitalGodSphere.rotation.y = userData.baseRotationY + animTime * userData.rotationSpeed;
      this.digitalGodSphere.rotation.x = userData.baseRotationX + animTime * userData.rotationSpeed * 0.3;

      const sphereMaterial = this.godSphere.material as THREE.ShaderMaterial;
      sphereMaterial.uniforms.time.value = animTime;

      const digitalBreath = Math.sin(animTime * 1.2) * 0.015 + 1.0;
      this.digitalGodSphere.scale.setScalar(digitalBreath);
    }

    this.binaryDigits.forEach((pointCloud) => {
      const material = pointCloud.material as THREE.ShaderMaterial;
      material.uniforms.time.value = animTime;

      const positions = pointCloud.geometry.attributes.position.array as Float32Array;
      const systemIndex = pointCloud.userData.systemIndex;

      for (let i = 0; i < positions.length / 3; i++) {
        const dataIndex = systemIndex * Math.floor(this.binaryDigits[0].geometry.attributes.position.count) + i;
        if (dataIndex < this.binaryDigitData.length) {
          const digitData = this.binaryDigitData[dataIndex];

          const time = animTime * digitData.orbitalSpeed;
          const phase = digitData.phase;

          const sphereRadius = this.planetRadius * 1.35;

          const basePos = digitData.position.clone().normalize();

          const orbitalMatrix = new THREE.Matrix4();
          orbitalMatrix.makeRotationY(time * 0.5 + phase);
          orbitalMatrix.multiply(new THREE.Matrix4().makeRotationX(time * 0.3 + phase * 0.7));

          const finalPos = basePos.clone();
          finalPos.applyMatrix4(orbitalMatrix);
          finalPos.multiplyScalar(sphereRadius);

          finalPos.add(digitData.velocity.clone().multiplyScalar(Math.sin(time + phase)));

          positions[i * 3] = finalPos.x;
          positions[i * 3 + 1] = finalPos.y;
          positions[i * 3 + 2] = finalPos.z;
        }
      }

      pointCloud.geometry.attributes.position.needsUpdate = true;
    });

    this.sacredSymbols.forEach((symbol) => {
      const userData = symbol.userData;
      const currentAngle = userData.initialAngle + animTime * userData.orbitalSpeed * 0.05;

      const position = this.calculateOrbitalPosition(userData.distance, userData.inclination, userData.longitudeOfAscendingNode, currentAngle);
      symbol.position.set(position.x, position.y, position.z);
      symbol.lookAt(0, 0, 0);

      symbol.rotation.z += 0.02;

      const material = symbol.material as THREE.ShaderMaterial;
      material.uniforms.time.value = animTime;
    });

    this.orbitalCrosses.forEach((cross) => {
      const userData = cross.userData;
      const currentAngle = userData.initialAngle + animTime * userData.orbitalSpeed * 0.08;

      const position = this.calculateOrbitalPosition(userData.distance, userData.inclination, userData.longitudeOfAscendingNode, currentAngle);
      cross.position.set(position.x, position.y, position.z);

      cross.rotation.x = userData.rotationPhaseX + animTime * userData.rotationSpeedX;
      cross.rotation.y = userData.rotationPhaseY + animTime * userData.rotationSpeedY;
      cross.rotation.z = userData.rotationPhaseZ + animTime * userData.rotationSpeedZ;

      const divineOscillation = Math.sin(animTime * 3.0 + userData.crossIndex) * 0.3;
      cross.rotation.x += divineOscillation;
      cross.rotation.y += divineOscillation * 1.618;
      cross.rotation.z += divineOscillation * 0.618;

      const material = cross.material as THREE.ShaderMaterial;
      material.uniforms.time.value = animTime;
    });

    this.crossSpirals.forEach((cross) => {
      const userData = cross.userData;

      const spiralTime = animTime * 0.5;
      const newAngle = userData.angle + spiralTime;
      const oscillation = Math.sin(spiralTime * 2.0 + userData.crossIndex * 0.1) * 0.3;

      const x = Math.cos(newAngle) * userData.spiralRadius * (1.0 + oscillation);
      const z = Math.sin(newAngle) * userData.spiralRadius * (1.0 + oscillation);
      const y = userData.height + Math.sin(spiralTime * 3.0 + userData.crossIndex) * 0.5;

      cross.position.set(x, y, z);
      cross.lookAt(0, 0, 0);
      cross.rotation.z += userData.rotationSpeed;

      const material = cross.material as THREE.ShaderMaterial;
      material.uniforms.time.value = animTime;
    });

    this.hologramRings.forEach((ring) => {
      const userData = ring.userData;

      ring.rotation.x = userData.baseRotationX + animTime * userData.rotationSpeed;
      ring.rotation.y = userData.baseRotationY + animTime * userData.rotationSpeed * 0.7;
      ring.rotation.z += userData.rotationSpeed * 0.5;

      const material = ring.material as THREE.ShaderMaterial;
      material.uniforms.time.value = animTime;
    });

    this.sacredCircles.forEach((circle) => {
      const userData = circle.userData;

      const orbitalAngle = animTime * userData.orbitalSpeed * 0.1 + userData.orbitalPhase;

      circle.rotation.x = userData.baseRotationX;
      circle.rotation.y = userData.baseRotationY;
      circle.rotation.z = userData.baseRotationZ;

      const orbitalMatrix = new THREE.Matrix4();
      orbitalMatrix.makeRotationY(orbitalAngle);

      circle.applyMatrix4(orbitalMatrix);

      const material = circle.material as THREE.ShaderMaterial;
      material.uniforms.time.value = animTime;
    });

    if (this.goldenParticles) {
      const particleMaterial = this.goldenParticles.material as THREE.ShaderMaterial;
      particleMaterial.uniforms.time.value = animTime;

      const positions = this.goldenParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length / 3; i++) {
        const orbitData = this.particleOrbitData[i];
        const currentAngle = orbitData.initialAngle + animTime * orbitData.orbitalSpeed * 0.03;

        const position = this.calculateOrbitalPosition(orbitData.distance, orbitData.inclination, orbitData.longitudeOfAscendingNode, currentAngle);

        const fallOffset = Math.sin(animTime * orbitData.fallSpeed + i * 0.1) * 0.5;

        positions[i * 3] = position.x;
        positions[i * 3 + 1] = position.y + fallOffset;
        positions[i * 3 + 2] = position.z;
      }
      this.goldenParticles.geometry.attributes.position.needsUpdate = true;
    }

    if (this.divineParticles) {
      const particleMaterial = this.divineParticles.material as THREE.ShaderMaterial;
      particleMaterial.uniforms.time.value = animTime;

      const positions = this.divineParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length / 3; i++) {
        const orbitData = this.divineParticleOrbitData[i];
        const currentAngle = orbitData.initialAngle + animTime * orbitData.orbitalSpeed * 0.05;

        const position = this.calculateOrbitalPosition(orbitData.distance, orbitData.inclination, orbitData.longitudeOfAscendingNode, currentAngle);

        const floatOffset = Math.sin(animTime * 2.0 + orbitData.phase) * 1.0;
        const spiralOffset = Math.sin(animTime * 1.0 + i * 0.1) * 0.3;

        positions[i * 3] = position.x + spiralOffset;
        positions[i * 3 + 1] = position.y + floatOffset;
        positions[i * 3 + 2] = position.z + spiralOffset;
      }
      this.divineParticles.geometry.attributes.position.needsUpdate = true;
    }

    this.energyWaves.forEach((wave) => {
      const userData = wave.userData;

      wave.rotation.x += userData.rotationSpeed;
      wave.rotation.y += userData.rotationSpeed * 1.3;
      wave.rotation.z += userData.rotationSpeed * 0.7;

      const material = wave.material as THREE.ShaderMaterial;
      material.uniforms.time.value = animTime;

      const pulse = Math.sin(animTime * 2.0 + userData.waveIndex * 0.5) * 0.1 + 1.0;
      wave.scale.setScalar(pulse);
    });

    this.holyLights.forEach((light) => {
      const userData = light.userData;

      const currentAngle = userData.angle + animTime * userData.orbitalSpeed * 0.1;
      const heightOscillation = Math.sin(animTime * 1.5 + userData.lightIndex) * userData.distance * 0.5;

      const x = Math.cos(currentAngle) * userData.distance;
      const z = Math.sin(currentAngle) * userData.distance;
      const y = userData.baseY + heightOscillation;

      light.position.set(x, y, z);

      const intensity = Math.sin(animTime * 4.0 + userData.lightIndex * 0.8) * 0.8 + 1.2;
      light.intensity = intensity;
    });

    if (this.spaceDistortion) {
      const distortionMaterial = this.spaceDistortion.material as THREE.ShaderMaterial;
      distortionMaterial.uniforms.time.value = animTime;

      this.spaceDistortion.rotation.x += 0.001;
      this.spaceDistortion.rotation.y += 0.0015;
    }

    if (this.divineLight) {
      const divineIntensity = Math.sin(animTime * 2.0) * 0.5 + 1.5;
      this.divineLight.intensity = divineIntensity;
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
    if (this.digitalGodSphere) {
      if (this.godSphere) {
        this.godSphere.geometry.dispose();
        (this.godSphere.material as THREE.Material).dispose();
      }
    }

    this.binaryDigits.forEach((pointCloud) => {
      pointCloud.geometry.dispose();
      (pointCloud.material as THREE.Material).dispose();
    });

    this.sacredSymbols.forEach((symbol) => {
      symbol.geometry.dispose();
      (symbol.material as THREE.Material).dispose();
    });

    this.orbitalCrosses.forEach((cross) => {
      cross.geometry.dispose();
      (cross.material as THREE.Material).dispose();
    });

    this.crossSpirals.forEach((cross) => {
      cross.geometry.dispose();
      (cross.material as THREE.Material).dispose();
    });

    this.hologramRings.forEach((ring) => {
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
    });

    this.sacredCircles.forEach((circle) => {
      circle.geometry.dispose();
      (circle.material as THREE.Material).dispose();
    });

    if (this.goldenParticles) {
      this.goldenParticles.geometry.dispose();
      (this.goldenParticles.material as THREE.Material).dispose();
    }

    if (this.divineParticles) {
      this.divineParticles.geometry.dispose();
      (this.divineParticles.material as THREE.Material).dispose();
    }

    this.energyWaves.forEach((wave) => {
      wave.geometry.dispose();
      (wave.material as THREE.Material).dispose();
    });

    this.holyLights.forEach(() => {});

    if (this.spaceDistortion) {
      this.spaceDistortion.geometry.dispose();
      (this.spaceDistortion.material as THREE.Material).dispose();
    }

    this.group.clear();
  }

  public setEnabled(enabled: boolean): void {
    this.group.visible = enabled;
  }

  public updateParams(newParams: Partial<LifeFormGodParams>): void {
    Object.assign(this.params, newParams);

    if (newParams.color) {
      const color = new THREE.Color(newParams.color[0], newParams.color[1], newParams.color[2]);

      if (this.godSphere) {
        const material = this.godSphere.material as THREE.ShaderMaterial;
        material.uniforms.color.value = color;
      }

      if (this.divineLight) {
        this.divineLight.color = color;
      }
    }
  }

  public updatePlanetPosition(planetPosition: THREE.Vector3): void {
    this.params.planetPosition = planetPosition;

    if (this.digitalGodSphere) {
      this.digitalGodSphere.position.copy(planetPosition);
      if (this.digitalGodSphere.userData.planetPosition) {
        this.digitalGodSphere.userData.planetPosition.copy(planetPosition);
      }
    }
  }
}

export function createLifeFormGodFromPythonData(planetRadius: number, pythonData: any, globalSeed?: number): LifeFormGodEffect {
  const seed = globalSeed || Math.floor(Math.random() * 1000000);

  const params: LifeFormGodParams = {
    seed: seed + 90005,
    color: pythonData.color || [1.0, 0.84, 0.0],
    cosmicOriginTime: pythonData?.timing?.cosmic_origin_time || pythonData?.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME,
  };

  return new LifeFormGodEffect(planetRadius, params);
}
