// atlas-ui/react/static/js/3DEffects/CrystallineSurfaceEffect.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime";

export interface CrystallineSurfaceParams {
  crystallinePatches?: any[];
  seed?: number;
  density?: number;
  baseColor?: THREE.Color | number;
  transmission?: number;
  ior?: number;
  roughness?: number;
  metalness?: number;
  glowIntensity?: number;
  refractionStrength?: number;
  fractureIntensity?: number;
  cosmicOriginTime?: number;
  timeSpeed?: number;
}

const PROCEDURAL_RANGES = {
  CRYSTAL_COUNT: { min: 100, max: 400 },
  DENSITY: { min: 0.8, max: 1.8 },
  SIZE: { min: 0.8, max: 1.2 },
  TRANSMISSION: { min: 0, max: 0 },
  IOR: { min: 2.4, max: 2.1 },
  ROUGHNESS: { min: 0.0, max: 0.01 },
  GLOW_INTENSITY: { min: 0.1, max: 2.1 },
  HEIGHT: { min: 0.01, max: 0.09 },
};

export class CrystallineSurfaceEffect {
  private crystallineGroup: THREE.Group;
  private crystallineFormations: THREE.Mesh[] = [];
  private glowMeshes: THREE.Mesh[] = [];
  private animationSpeed: number;
  private envMap: THREE.CubeTexture | null = null;
  private starFieldReflections: THREE.Points | null = null;
  private starFieldMaterial: THREE.ShaderMaterial | null = null;
  private crystallineData: any[] = [];

  constructor(private planetRadius: number, private params: CrystallineSurfaceParams = {}, private seededRng?: SeededRandom, private starField?: any) {
    this.crystallineGroup = new THREE.Group();
    this.crystallineGroup.name = "CrystallineSurface";

    this.animationSpeed = params.timeSpeed || 0.05;

    this.createStarfieldCubemap();

    this.generateCrystallineFormations();

    if (this.starField) {
      setTimeout(() => {
        if (this.starField && this.starField.getObject3D && this.starField.getObject3D()) {
          this.createStarFieldReflections();
        } else {
        }
      }, 0);
    }
  }

  /**
   * Crear cubemap sutil con starfield realista para reflexiones cristalinas
   */
  private createStarfieldCubemap(): void {
    try {
      const size = 512;
      const images: HTMLCanvasElement[] = [];

      for (let i = 0; i < 6; i++) {
        const faceCanvas = document.createElement("canvas");
        faceCanvas.width = size;
        faceCanvas.height = size;
        const faceContext = faceCanvas.getContext("2d");

        if (!faceContext) continue;

        const gradient = faceContext.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, "#1a1a2e");
        gradient.addColorStop(0.5, "#16213e");
        gradient.addColorStop(1, "#0f0f23");
        faceContext.fillStyle = gradient;
        faceContext.fillRect(0, 0, size, size);

        const cubemapRng = new SeededRandom((this.params.seed || 42) + i * 1000);
        const starCount = 200 + Math.floor(cubemapRng.random() * 100);
        for (let j = 0; j < starCount; j++) {
          const x = cubemapRng.random() * size;
          const y = cubemapRng.random() * size;
          const brightness = 0.3 + cubemapRng.random() * 0.4;
          const starSize = cubemapRng.random() * 2 + 0.5;

          const colorVariant = cubemapRng.random();
          if (colorVariant < 0.4) {
            faceContext.fillStyle = `rgba(${120 + 60 * brightness}, ${140 + 80 * brightness}, 255, ${brightness})`;
          } else if (colorVariant < 0.7) {
            faceContext.fillStyle = `rgba(${200 + 55 * brightness}, ${200 + 55 * brightness}, ${200 + 55 * brightness}, ${brightness})`;
          } else {
            faceContext.fillStyle = `rgba(255, ${180 + 60 * brightness}, ${120 + 60 * brightness}, ${brightness})`;
          }

          faceContext.beginPath();
          faceContext.arc(x, y, starSize, 0, Math.PI * 2);
          faceContext.fill();

          if (brightness > 0.6 && cubemapRng.random() < 0.1) {
            faceContext.fillStyle = `rgba(255, 255, 255, ${brightness * 0.2})`;
            faceContext.beginPath();
            faceContext.arc(x, y, starSize * 2, 0, Math.PI * 2);
            faceContext.fill();
          }
        }

        images.push(faceCanvas);
      }

      if (images.length === 6) {
        this.envMap = new THREE.CubeTexture(images);
        this.envMap.needsUpdate = true;
        this.envMap.mapping = THREE.CubeReflectionMapping;
        this.envMap.format = THREE.RGBAFormat;
        this.envMap.generateMipmaps = false;
        this.envMap.minFilter = THREE.LinearFilter;
        this.envMap.magFilter = THREE.LinearFilter;
      } else {
      }
    } catch (error) {}
  }

  /**
   * Generar formaciones cristalinas con materiales avanzados
   */
  private generateCrystallineFormations(): void {
    this.crystallineData = this.params.crystallinePatches || this.generateProceduralCrystals();

    this.crystallineData.forEach((crystalData: any, index: number) => {
      this.createCrystalFormation(crystalData, index);
    });
  }

  private generateProceduralCrystals(): any[] {
    const rng = this.seededRng || new SeededRandom(this.params.seed || 42);
    const crystalCount = rng.randint(PROCEDURAL_RANGES.CRYSTAL_COUNT.min, PROCEDURAL_RANGES.CRYSTAL_COUNT.max);
    const crystals = [];

    const baseColor = this.params.baseColor instanceof THREE.Color ? this.params.baseColor : new THREE.Color(this.params.baseColor || 0x00ccff);

    for (let i = 0; i < crystalCount; i++) {
      const theta = rng.random() * Math.PI * 2;
      const phi = Math.acos(rng.random() * 2 - 1);

      const position_3d = [Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)];

      const colorVariation = 0.8 + rng.random() * 0.2;
      const crystalColor = baseColor.clone().multiplyScalar(colorVariation);

      crystals.push({
        position_3d,
        size: rng.uniform(PROCEDURAL_RANGES.SIZE.min, PROCEDURAL_RANGES.SIZE.max),
        color: [crystalColor.r, crystalColor.g, crystalColor.b, 0.9],
        height: rng.uniform(PROCEDURAL_RANGES.HEIGHT.min, PROCEDURAL_RANGES.HEIGHT.max),
        sides: 6 + Math.floor(rng.random() * 6),
        transmission: rng.uniform(PROCEDURAL_RANGES.TRANSMISSION.min, PROCEDURAL_RANGES.TRANSMISSION.max),
        ior: rng.uniform(PROCEDURAL_RANGES.IOR.min, PROCEDURAL_RANGES.IOR.max),
        roughness: rng.uniform(PROCEDURAL_RANGES.ROUGHNESS.min, PROCEDURAL_RANGES.ROUGHNESS.max),
        glowIntensity: rng.uniform(PROCEDURAL_RANGES.GLOW_INTENSITY.min, PROCEDURAL_RANGES.GLOW_INTENSITY.max),
      });
    }

    return crystals;
  }

  private createCrystalFormation(crystalData: any, index: number): void {
    const surfaceNormal = new THREE.Vector3(crystalData.position_3d[0], crystalData.position_3d[1], crystalData.position_3d[2]).normalize();

    const baseRadius = crystalData.size * this.planetRadius * 0.5;
    const crystalHeight = crystalData.height * this.planetRadius;

    const radialSegments = crystalData.sides;
    const heightSegments = 4;

    const geometry = new THREE.CylinderGeometry(baseRadius * 0.8, baseRadius, crystalHeight, radialSegments, heightSegments);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(crystalData.color[0], crystalData.color[1], crystalData.color[2]) },
        envMap: { value: this.envMap },
        roughness: { value: crystalData.roughness },
        ior: { value: crystalData.ior },
        transmission: { value: 0.2 },
        // Initialize to (0,0,0) - same as PlanetLayerSystem for consistency
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          vPosition = position;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform samplerCube envMap;
        uniform float roughness;
        uniform float ior;
        uniform float transmission;
        uniform vec3 lightPosition;
        uniform vec3 lightDirection;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 normal = normalize(vWorldNormal);
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);

          vec3 lightDir;
          if (length(lightPosition) > 0.0) {
            lightDir = normalize(lightPosition - vWorldPosition);
          } else {
            lightDir = normalize(-lightDirection);
          }

          float NdotL = dot(normal, lightDir);
          float dayNightFactor = smoothstep(-0.3, 0.1, NdotL);

          float NdotV = max(dot(normal, viewDir), 0.0);
          float F0 = pow((1.0 - ior) / (1.0 + ior), 2.0);
          float fresnel = F0 + (1.0 - F0) * pow(1.0 - NdotV, 3.0);

          vec3 reflectDir = reflect(-viewDir, normal);
          vec3 envReflection = textureCube(envMap, reflectDir).rgb;

          vec3 perturbedNormal1 = normalize(normal + vec3(0.1, 0.0, 0.0));
          vec3 perturbedNormal2 = normalize(normal + vec3(0.0, 0.1, 0.0));
          vec3 reflectDir1 = reflect(-viewDir, perturbedNormal1);
          vec3 reflectDir2 = reflect(-viewDir, perturbedNormal2);
          
          vec3 envReflection1 = textureCube(envMap, reflectDir1).rgb;
          vec3 envReflection2 = textureCube(envMap, reflectDir2).rgb;

          vec3 totalReflection = envReflection * 0.6 + envReflection1 * 0.2 + envReflection2 * 0.2;
          totalReflection *= (2.0 - roughness);

          vec3 refractDir = refract(-viewDir, normal, 1.0 / ior);
          vec3 envRefraction = vec3(0.0);
          if (length(refractDir) > 0.0) {
            envRefraction = textureCube(envMap, refractDir).rgb;
          }

          vec3 crystalColor = color * 1.2;

          vec3 transmittedColor = mix(crystalColor * 0.8, envRefraction * crystalColor, transmission);

          float dispersion = 0.02;
          vec3 refractR = refract(-viewDir, normal, 1.0 / (ior - dispersion));
          vec3 refractG = refract(-viewDir, normal, 1.0 / ior);
          vec3 refractB = refract(-viewDir, normal, 1.0 / (ior + dispersion));
          
          vec3 dispersedColor = vec3(0.0);
          if (length(refractR) > 0.0) dispersedColor.r = textureCube(envMap, refractR).r;
          if (length(refractG) > 0.0) dispersedColor.g = textureCube(envMap, refractG).g;
          if (length(refractB) > 0.0) dispersedColor.b = textureCube(envMap, refractB).b;

          transmittedColor = mix(transmittedColor, dispersedColor * crystalColor, 0.15);

          float internalGlow = pow(fresnel, 0.5) * (1.0 - roughness);
          vec3 glowColor = crystalColor * internalGlow * 0.3;

          vec3 finalColor = mix(transmittedColor, totalReflection, fresnel);

          finalColor += glowColor;

          float visibilityFactor = 0.15 + 0.85 * dayNightFactor;
          finalColor *= visibilityFactor;

          float alpha = mix(0.3 + transmission * 0.4, 0.85, fresnel);
          alpha = clamp(alpha, 0.3, 0.9);
          alpha *= visibilityFactor;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
    });

    const crystalPosition = surfaceNormal.clone().multiplyScalar(this.planetRadius);
    const normalFromPlanet = crystalPosition.clone().normalize();

    const tangent1 = new THREE.Vector3();
    const tangent2 = new THREE.Vector3();

    if (Math.abs(normalFromPlanet.y) < 0.99) {
      tangent1.crossVectors(normalFromPlanet, new THREE.Vector3(0, 1, 0)).normalize();
    } else {
      tangent1.crossVectors(normalFromPlanet, new THREE.Vector3(1, 0, 0)).normalize();
    }

    tangent2.crossVectors(normalFromPlanet, tangent1).normalize();

    const randomAngle = ((index * 137.5) % 360) * (Math.PI / 180);
    const rotatedTangent1 = tangent1
      .clone()
      .multiplyScalar(Math.cos(randomAngle))
      .add(tangent2.clone().multiplyScalar(Math.sin(randomAngle)));
    const rotatedTangent2 = new THREE.Vector3().crossVectors(normalFromPlanet, rotatedTangent1).normalize();

    const flattenMatrix = new THREE.Matrix4();
    flattenMatrix.makeRotationX(Math.PI / 2);
    geometry.applyMatrix4(flattenMatrix);

    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeBasis(rotatedTangent1, rotatedTangent2, normalFromPlanet);

    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    geometry.applyMatrix4(rotationMatrix);

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);

      const worldVertex = vertex.clone().add(crystalPosition);

      const distanceFromCenter = worldVertex.length();

      const direction = worldVertex.clone().normalize();
      const surfaceRadius = this.planetRadius + (distanceFromCenter - this.planetRadius) * 0.5;
      const projectedVertex = direction.multiplyScalar(surfaceRadius);

      const localVertex = projectedVertex.sub(crystalPosition);

      positions.setXYZ(i, localVertex.x, localVertex.y, localVertex.z);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();

    this.applyProceduralNoise(geometry, crystalData.size * 0.3);

    geometry.translate(crystalPosition.x, crystalPosition.y, crystalPosition.z);

    const crystalMesh = new THREE.Mesh(geometry, material);

    this.createInnerGlow(crystalMesh, crystalData, index);

    this.crystallineFormations.push(crystalMesh);
    this.crystallineGroup.add(crystalMesh);
  }

  /**
   * Aplicar ruido procedural para fracturas y vetas
   */
  private applyProceduralNoise(geometry: THREE.BufferGeometry, intensity: number): void {
    const positions = geometry.getAttribute("position");
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);

      const noise = this.simpleNoise(vertex.x * 10, vertex.y * 10, vertex.z * 10);
      const displacement = noise * intensity * 0.02;

      vertex.multiplyScalar(1 + displacement);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.setAttribute("position", positions);
    geometry.computeVertexNormals();
  }

  private simpleNoise(x: number, y: number, z: number): number {
    return (Math.sin(x * 0.1) * Math.cos(y * 0.1) * Math.sin(z * 0.1) + Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.5 + Math.sin(x * 0.2) * Math.sin(z * 0.15) * 0.3) * 0.5;
  }

  private createStarFieldReflections(): void {
    if (!this.starField || !this.starField.getObject3D) return;

    const starFieldObject = this.starField.getObject3D();
    if (!starFieldObject.geometry) return;

    const starPositions = starFieldObject.geometry.attributes.position;
    const starSizes = starFieldObject.geometry.attributes.size;
    const starBrightnesses = starFieldObject.geometry.attributes.brightness;

    if (!starPositions || !starSizes || !starBrightnesses) return;

    const reflections: Array<{
      position: THREE.Vector3;
      size: number;
      brightness: number;
      crystalIndex: number;
    }> = [];

    this.crystallineData.forEach((crystalData, crystalIndex) => {
      const surfaceNormal = new THREE.Vector3(crystalData.position_3d[0], crystalData.position_3d[1], crystalData.position_3d[2]).normalize();

      const crystalWorldPos = surfaceNormal.clone().multiplyScalar(this.planetRadius);
      const crystalNormal = crystalWorldPos.clone().normalize();

      const faceNormals = this.generateDeterministicFaceNormals(crystalData, crystalIndex);

      faceNormals.forEach((faceNormal, faceIndex) => {
        for (let starIndex = 0; starIndex < starPositions.count; starIndex++) {
          const starX = starPositions.getX(starIndex);
          const starY = starPositions.getY(starIndex);
          const starZ = starPositions.getZ(starIndex);
          const starBrightness = starBrightnesses.getX(starIndex);
          const starSize = starSizes.getX(starIndex);

          if (starBrightness < 0.6) continue;

          const starPos = new THREE.Vector3(starX, starY, starZ);
          const starDir = starPos.clone().normalize();

          const incidentDir = starDir.clone().negate();

          const dotProduct = incidentDir.dot(faceNormal);
          const reflectedDir = incidentDir.clone().sub(faceNormal.clone().multiplyScalar(2 * dotProduct));

          const reflectionVisibility = Math.abs(reflectedDir.dot(crystalNormal));

          const reflectionSeed = crystalIndex * 10000 + faceIndex * 1000 + starIndex;
          const seededRng = new SeededRandom(reflectionSeed + (this.params.seed || 42));
          const shouldCreateReflection = seededRng.random() < 0.4;

          if (reflectionVisibility > 0.3 && dotProduct < -0.1 && shouldCreateReflection) {
            const reflectionPos = crystalWorldPos.clone().add(faceNormal.clone().multiplyScalar(0.001));

            const surfaceProjection = reflectionPos
              .clone()
              .normalize()
              .multiplyScalar(this.planetRadius * 1.001);

            reflections.push({
              position: surfaceProjection,
              size: starSize * 0.4 * reflectionVisibility,
              brightness: starBrightness * 0.5 * reflectionVisibility,
              crystalIndex,
            });
          }
        }
      });
    });

    if (reflections.length === 0) {
      return;
    }

    const reflectionPositions = new Float32Array(reflections.length * 3);
    const reflectionSizes = new Float32Array(reflections.length);
    const reflectionBrightnesses = new Float32Array(reflections.length);
    const reflectionCrystalIndices = new Float32Array(reflections.length);

    reflections.forEach((reflection, index) => {
      reflectionPositions[index * 3] = reflection.position.x;
      reflectionPositions[index * 3 + 1] = reflection.position.y;
      reflectionPositions[index * 3 + 2] = reflection.position.z;

      reflectionSizes[index] = reflection.size;
      reflectionBrightnesses[index] = reflection.brightness;
      reflectionCrystalIndices[index] = reflection.crystalIndex;
    });

    const reflectionGeometry = new THREE.BufferGeometry();
    reflectionGeometry.setAttribute("position", new THREE.BufferAttribute(reflectionPositions, 3));
    reflectionGeometry.setAttribute("size", new THREE.BufferAttribute(reflectionSizes, 1));
    reflectionGeometry.setAttribute("brightness", new THREE.BufferAttribute(reflectionBrightnesses, 1));
    reflectionGeometry.setAttribute("crystalIndex", new THREE.BufferAttribute(reflectionCrystalIndices, 1));

    this.starFieldMaterial = new THREE.ShaderMaterial({
      uniforms: {
        planetRadius: { value: this.planetRadius },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
      },
      vertexShader: `
        attribute float size;
        attribute float brightness;
        attribute float crystalIndex;
        
        uniform float planetRadius;
        uniform vec3 lightDirection;
        
        varying float vBrightness;
        varying float vLightInfluence;
        varying float vCrystalIndex;
        
        void main() {
          vBrightness = brightness;
          vCrystalIndex = crystalIndex;

          vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          vec3 normal = normalize(worldPos);
          float lightDot = dot(normal, lightDirection);
          vLightInfluence = max(0.01, lightDot * 0.5 + 0.5);
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * (350.0 / -mvPosition.z) * (0.7 + 0.3 * vLightInfluence);
        }
      `,
      fragmentShader: `
        varying float vBrightness;
        varying float vLightInfluence;
        varying float vCrystalIndex;
        
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = (1.0 - dist * 2.0) * vBrightness * vLightInfluence;
          alpha *= 0.8 * vLightInfluence;

          vec3 baseColor = vec3(0.4, 0.8, 1.0);
          float crystalVariation = sin(vCrystalIndex * 0.7) * 0.1;
          vec3 reflectionColor = baseColor + vec3(crystalVariation, crystalVariation * 0.5, -crystalVariation * 0.3);

          gl_FragColor = vec4(reflectionColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.starFieldReflections = new THREE.Points(reflectionGeometry, this.starFieldMaterial);
    this.crystallineGroup.add(this.starFieldReflections);
  }

  private generateDeterministicFaceNormals(crystalData: any, crystalIndex: number): THREE.Vector3[] {
    const rng = new SeededRandom((this.params.seed || 42) + crystalIndex * 1000);
    const faceNormals: THREE.Vector3[] = [];

    const sides = crystalData.sides || 6;
    const numFaces = Math.min(sides, 8);

    const crystalNormal = new THREE.Vector3(crystalData.position_3d[0], crystalData.position_3d[1], crystalData.position_3d[2]).normalize();

    const tangent1 = new THREE.Vector3();
    const tangent2 = new THREE.Vector3();

    if (Math.abs(crystalNormal.y) < 0.99) {
      tangent1.crossVectors(crystalNormal, new THREE.Vector3(0, 1, 0)).normalize();
    } else {
      tangent1.crossVectors(crystalNormal, new THREE.Vector3(1, 0, 0)).normalize();
    }
    tangent2.crossVectors(crystalNormal, tangent1).normalize();

    for (let i = 0; i < numFaces; i++) {
      const angle1 = (i / numFaces) * Math.PI * 2;
      const angle2 = rng.uniform(-Math.PI * 0.3, Math.PI * 0.3);

      const faceNormal = new THREE.Vector3().addScaledVector(tangent1, Math.cos(angle1)).addScaledVector(tangent2, Math.sin(angle1)).addScaledVector(crystalNormal, Math.sin(angle2)).normalize();

      faceNormals.push(faceNormal);
    }

    return faceNormals;
  }

  private createInnerGlow(parentMesh: THREE.Mesh, crystalData: any, _index: number): void {
    const glowGeometry = parentMesh.geometry.clone();

    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color(crystalData.color[0], crystalData.color[1], crystalData.color[2]) },
        glowIntensity: { value: crystalData.glowIntensity || 0.5 },
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 glowColor;
        uniform float glowIntensity;
        uniform vec3 lightPosition;
        uniform vec3 lightDirection;

        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;

        void main() {
          vec3 worldNormal = normalize(vWorldNormal);
          vec3 lightDir;
          if (length(lightPosition) > 0.0) {
            lightDir = normalize(lightPosition - vWorldPosition);
          } else {
            lightDir = normalize(-lightDirection);
          }
          float NdotL = dot(worldNormal, lightDir);
          float dayNightFactor = smoothstep(-0.3, 0.1, NdotL);

          float intensity = pow(0.4 - dot(vNormal, vPositionNormal), 2.0);
          intensity *= (0.8 + 0.2 * sin(time * 2.0));

          float glowVisibility = 0.15 + 0.85 * dayNightFactor;

          vec3 glow = glowColor * intensity * glowIntensity * glowVisibility;
          gl_FragColor = vec4(glow, intensity * 0.6 * glowVisibility);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(parentMesh.position);
    glowMesh.rotation.copy(parentMesh.rotation);
    glowMesh.scale.multiplyScalar(1.05);

    this.glowMeshes.push(glowMesh);
    this.crystallineGroup.add(glowMesh);
  }

  public update(_deltaTime?: number, planetRotation?: number): void {
    const cosmicOriginTime = this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME;
    const elapsed = getUniverseTime(cosmicOriginTime) * this.animationSpeed;

    this.glowMeshes.forEach((mesh) => {
      if (mesh.material instanceof THREE.ShaderMaterial) {
        mesh.material.uniforms.time.value = elapsed;
      }
    });

    if (planetRotation !== undefined) {
      this.crystallineGroup.rotation.y = planetRotation;
    }
  }

  public updateLightDirection(lightDirection: THREE.Vector3): void {
    if (this.starFieldMaterial) {
      this.starFieldMaterial.uniforms.lightDirection.value.copy(lightDirection);
    }

    this.crystallineFormations.forEach((mesh) => {
      if (mesh.material instanceof THREE.ShaderMaterial && mesh.material.uniforms.lightDirection) {
        mesh.material.uniforms.lightDirection.value.copy(lightDirection);
      }
    });

    this.glowMeshes.forEach((mesh) => {
      if (mesh.material instanceof THREE.ShaderMaterial && mesh.material.uniforms.lightDirection) {
        mesh.material.uniforms.lightDirection.value.copy(lightDirection);
      }
    });
  }

  public updateLightPosition(lightPosition: THREE.Vector3): void {
    if (this.starFieldMaterial) {
      this.starFieldMaterial.uniforms.lightPosition.value.copy(lightPosition);
    }

    this.crystallineFormations.forEach((mesh) => {
      if (mesh.material instanceof THREE.ShaderMaterial && mesh.material.uniforms.lightPosition) {
        mesh.material.uniforms.lightPosition.value.copy(lightPosition);
      }
    });

    this.glowMeshes.forEach((mesh) => {
      if (mesh.material instanceof THREE.ShaderMaterial && mesh.material.uniforms.lightPosition) {
        mesh.material.uniforms.lightPosition.value.copy(lightPosition);
      }
    });
  }

  public updateFromThreeLight(light: THREE.DirectionalLight): void {
    this.updateLightPosition(light.position);

    const direction = light.target.position.clone().sub(light.position).normalize();
    this.updateLightDirection(direction);
  }

  public setStarField(starField: any): void {
    this.starField = starField;

    if (this.starFieldReflections) {
      this.crystallineGroup.remove(this.starFieldReflections);
      if (this.starFieldReflections.geometry) this.starFieldReflections.geometry.dispose();
      if (this.starFieldMaterial) this.starFieldMaterial.dispose();
      this.starFieldReflections = null;
      this.starFieldMaterial = null;
    }

    if (this.starField && this.crystallineData.length > 0) {
      this.createStarFieldReflections();
    }
  }

  public addToScene(scene: THREE.Scene, position: THREE.Vector3): void {
    this.crystallineGroup.position.copy(position);
    scene.add(this.crystallineGroup);
  }

  public removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.crystallineGroup);
  }

  public dispose(): void {
    this.crystallineFormations.forEach((mesh) => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) mesh.material.dispose();
    });

    this.glowMeshes.forEach((mesh) => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) mesh.material.dispose();
    });

    if (this.starFieldReflections) {
      if (this.starFieldReflections.geometry) this.starFieldReflections.geometry.dispose();
      if (this.starFieldMaterial) this.starFieldMaterial.dispose();
    }

    if (this.envMap) this.envMap.dispose();

    this.crystallineFormations = [];
    this.glowMeshes = [];
    this.starFieldReflections = null;
    this.starFieldMaterial = null;
  }

  public getGroup(): THREE.Group {
    return this.crystallineGroup;
  }

  public getObject3D(): THREE.Group {
    return this.crystallineGroup;
  }
}

export function createCrystallineSurfaceFromPythonData(planetRadius: number, surfaceData: any, seed: number, cosmicOriginTime?: number, starField?: any, baseColor?: THREE.Color): CrystallineSurfaceEffect | null {
  const color = baseColor || new THREE.Color(0.0, 0.8, 1.0);
  return new CrystallineSurfaceEffect(
    planetRadius,
    {
      seed,
      cosmicOriginTime,
      baseColor: color,
      transmission: 0.2,
      ior: 1.6,
      roughness: 0.01,
      glowIntensity: 0.3,
      timeSpeed: 0.05,
    },
    new SeededRandom(seed),
    starField
  );
}
