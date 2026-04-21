// atlas-ui/react/static/js/3DEffects/VegetationEffect.tsx

import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime";

export interface VegetationParams {
  vegetationPatches?: any[];
  seed?: number;
  density?: number;
  color?: THREE.Color | number;
  opacity?: number;
  size?: number;
  treeHeight?: number;
  cosmicOriginTime?: number;
  timeSpeed?: number;
}

const PROCEDURAL_RANGES = {
  PATCH_COUNT: { min: 20, max: 40 },
  DENSITY: { min: 0.8, max: 1.5 },
  SIZE: { min: 0.08, max: 0.25 },
  OPACITY: { min: 0.7, max: 0.95 },
  TREE_HEIGHT: { min: 0.015, max: 0.035 },
  TIME_SPEED: { min: 0.05, max: 0.2 },
};

export class VegetationEffect {
  private vegetationGroup: THREE.Group;
  private vegetationPatches: THREE.Mesh[] = [];
  private treeLayers: THREE.Mesh[] = [];
  private params: VegetationParams;
  private cosmicOriginTime: number;
  private cosmicOffset: number;

  private static readonly vegetationVertexShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    
    uniform float time;
    uniform float timeSpeed;
    uniform float treeHeight;
    
    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      
      // Posición del mundo para efectos de ruido y iluminación
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      
      // Movimiento sutil simulando viento en la vegetación
      vec3 pos = position;
      float slowTime = time * timeSpeed;
      
      // Movimiento más pronunciado en las partes altas (árboles)
      float heightFactor = smoothstep(0.0, 1.0, vUv.y);
      
      pos.x += sin(slowTime + worldPosition.z * 0.1) * treeHeight * 0.1 * heightFactor;
      pos.z += cos(slowTime * 0.7 + worldPosition.x * 0.1) * treeHeight * 0.08 * heightFactor;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  private static readonly vegetationFragmentShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    
    uniform float time;
    uniform float opacity;
    uniform vec3 vegetationColor;
    uniform float density;
    uniform vec3 lightDirection;
    uniform vec3 lightPosition;
    uniform float treeHeight;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      
      for (int i = 0; i < 3; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    
    void main() {
      vec2 center = vec2(0.5);
      float distFromCenter = length(vUv - center);
      
      vec2 noiseUv1 = vUv * 12.0 + time * 0.008;
      float vegetationNoise1 = fbm(noiseUv1);
      
      vec2 noiseUv2 = vUv * 6.0 + time * 0.005;
      float vegetationNoise2 = fbm(noiseUv2);
      
      vec2 noiseUv3 = vUv * 20.0 + time * 0.012;
      float vegetationNoise3 = fbm(noiseUv3) * 0.5;
      
      float combinedNoise = vegetationNoise1 * 0.6 + vegetationNoise2 * 0.3 + vegetationNoise3 * 0.1;
      
      vec3 baseColor = vegetationColor;
      
      float colorVariation = 0.7 + combinedNoise * 0.6;
      
      float leafPattern = sin(vUv.x * 15.0) * sin(vUv.y * 12.0) * 0.15;
      colorVariation += leafPattern;
      
      vec3 finalColor = baseColor * colorVariation;
      
      vec3 darkGreen = vec3(0.15, 0.35, 0.12);
      vec3 lightGreen = vec3(0.25, 0.50, 0.18);
      vec3 brownTone = vec3(0.35, 0.25, 0.15);
      
      if (combinedNoise < 0.3) {
        finalColor = mix(finalColor, darkGreen, 0.4);
      } else if (combinedNoise > 0.7) {
        finalColor = mix(finalColor, lightGreen, 0.3);
      }
      
      if (vegetationNoise3 > 0.8) {
        finalColor = mix(finalColor, brownTone, 0.2);
      }
      
      vec3 lightDir;
      if (length(lightPosition) > 0.0) {
        lightDir = normalize(lightPosition - vWorldPosition);
      } else {
        lightDir = normalize(-lightDirection);
      }
      
      vec3 planetNormal = normalize(vWorldPosition);
      float dotNL = dot(planetNormal, lightDir);
      
      float lighting = smoothstep(-0.3, 0.8, dotNL);
      lighting = mix(0.3, 1.0, lighting);
      
      float subsurface = pow(max(0.0, dot(vWorldNormal, lightDir)), 0.8) * 0.4;
      lighting += subsurface;
      
      float ambientOcclusion = 1.0 - (combinedNoise * 0.2);
      lighting *= ambientOcclusion;
      
      finalColor *= lighting;
      
      float alpha = opacity * density;
      
      float organicMask = smoothstep(0.2, 1.0, combinedNoise);
      
      float radialFade = 1.0 - smoothstep(0.3, 0.9, distFromCenter);
      
      alpha *= organicMask * radialFade;
      
      alpha *= (0.8 + sin(vUv.x * 25.0) * sin(vUv.y * 30.0) * 0.15);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  constructor(planetRadius: number, params: VegetationParams = {}) {
    const seed = params.seed || Math.floor(Math.random() * 1000000);
    this.cosmicOriginTime = params.cosmicOriginTime || 514080000;
    this.cosmicOffset = (seed % 3600) * 10;

    const rng = new SeededRandom(seed);

    this.params = {
      density: params.density || rng.uniform(PROCEDURAL_RANGES.DENSITY.min, PROCEDURAL_RANGES.DENSITY.max),
      color: params.color || new THREE.Color(0x2d5a3d),
      opacity: params.opacity || rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max),
      size: params.size || rng.uniform(PROCEDURAL_RANGES.SIZE.min, PROCEDURAL_RANGES.SIZE.max),
      treeHeight: params.treeHeight || rng.uniform(PROCEDURAL_RANGES.TREE_HEIGHT.min, PROCEDURAL_RANGES.TREE_HEIGHT.max),
      timeSpeed: params.timeSpeed || rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),
      seed,
      cosmicOriginTime: this.cosmicOriginTime,
      vegetationPatches: params.vegetationPatches || [],
    };

    this.vegetationGroup = new THREE.Group();
    this.generateVegetation(planetRadius);
  }

  private generateVegetation(planetRadius: number): void {
    const seed = this.params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    const vegetationPatches = this.params.vegetationPatches;

    let patchCount = 0;
    if (vegetationPatches && vegetationPatches.length > 0) {
      patchCount = vegetationPatches.length;
      this.generateVegetationFromPython(planetRadius, vegetationPatches, rng);
    } else {
      patchCount = Math.floor(rng.uniform(PROCEDURAL_RANGES.PATCH_COUNT.min, PROCEDURAL_RANGES.PATCH_COUNT.max));
      this.generateProceduralVegetation(planetRadius, patchCount, rng);
    }
  }

  private generateVegetationFromPython(planetRadius: number, patches: any[], rng: SeededRandom): void {
    patches.forEach((patch, index) => {
      this.createVegetationPatch(planetRadius, patch, rng, index);
    });
  }

  private generateProceduralVegetation(planetRadius: number, patchCount: number, rng: SeededRandom): void {
    for (let i = 0; i < patchCount; i++) {
      const phi = rng.uniform(0, 2 * Math.PI);
      const cosTheta = rng.uniform(-1, 1);
      const theta = Math.acos(cosTheta);

      const patch = {
        position_3d: [Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta)],
        size: rng.uniform(PROCEDURAL_RANGES.SIZE.min, PROCEDURAL_RANGES.SIZE.max),
        color: [rng.uniform(0.1, 0.4), rng.uniform(0.4, 0.8), rng.uniform(0.1, 0.3)],
      };

      this.createVegetationPatch(planetRadius, patch, rng, i);
    }
  }

  private createVegetationPatch(planetRadius: number, patch: any, rng: SeededRandom, index: number): void {
    const position = patch.position_3d || patch.position || [0, 0, 1];
    const size = (patch.size || this.params.size!) * planetRadius;

    let vegetationColor = this.params.color instanceof THREE.Color ? this.params.color : new THREE.Color(this.params.color as number);

    if (patch.color && Array.isArray(patch.color)) {
      vegetationColor = new THREE.Color(patch.color[0], patch.color[1], patch.color[2]);
    }

    const sphericalPos = new THREE.Vector3(position[0], position[1], position[2]).normalize();

    this.createVegetationBase(planetRadius, sphericalPos, size, vegetationColor, rng);
    this.createTreeLayer(planetRadius, sphericalPos, size, vegetationColor, rng);
  }

  private createVegetationBase(planetRadius: number, normal: THREE.Vector3, size: number, color: THREE.Color, rng: SeededRandom): void {
    const geometry = this.createOrganicVegetationGeometry(planetRadius, normal, size, rng);

    const material = new THREE.ShaderMaterial({
      vertexShader: VegetationEffect.vegetationVertexShader,
      fragmentShader: VegetationEffect.vegetationFragmentShader,
      uniforms: {
        time: { value: 0 },
        timeSpeed: { value: this.params.timeSpeed },
        opacity: { value: this.params.opacity },
        vegetationColor: { value: color },
        density: { value: this.params.density },
        treeHeight: { value: this.params.treeHeight },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
      },
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const vegetationMesh = new THREE.Mesh(geometry, material);
    vegetationMesh.renderOrder = 3;

    this.vegetationPatches.push(vegetationMesh);
    this.vegetationGroup.add(vegetationMesh);
  }

  private createTreeLayer(planetRadius: number, normal: THREE.Vector3, size: number, color: THREE.Color, rng: SeededRandom): void {
    const numTrees = Math.floor(rng.uniform(8, 20));

    for (let i = 0; i < numTrees; i++) {
      const angle = rng.uniform(0, Math.PI * 2);
      const radius = rng.uniform(0, size * 0.8);

      const localX = Math.cos(angle) * radius;
      const localY = Math.sin(angle) * radius;

      const tangent1 = new THREE.Vector3();
      const tangent2 = new THREE.Vector3();

      if (Math.abs(normal.y) < 0.99) {
        tangent1.crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize();
      } else {
        tangent1.crossVectors(normal, new THREE.Vector3(1, 0, 0)).normalize();
      }
      tangent2.crossVectors(normal, tangent1).normalize();

      const treePosition = normal.clone().multiplyScalar(planetRadius * 1.002); // Ligeramente elevado sobre la superficie
      treePosition.addScaledVector(tangent1, localX);
      treePosition.addScaledVector(tangent2, localY);
      const treeSize = rng.uniform(0.008, 0.02) * planetRadius;
      const treeGeometry = this.createSingleTreeGeometry(treeSize, rng);

      const treeNormal = treePosition.clone().normalize();
      const rotationMatrix = new THREE.Matrix4();

      const treeTangent1 = new THREE.Vector3();
      const treeTangent2 = new THREE.Vector3();

      if (Math.abs(treeNormal.y) < 0.99) {
        treeTangent1.crossVectors(treeNormal, new THREE.Vector3(0, 1, 0)).normalize();
      } else {
        treeTangent1.crossVectors(treeNormal, new THREE.Vector3(1, 0, 0)).normalize();
      }
      treeTangent2.crossVectors(treeNormal, treeTangent1).normalize();

      rotationMatrix.makeBasis(treeTangent1, treeTangent2, treeNormal);
      treeGeometry.applyMatrix4(rotationMatrix);
      treeGeometry.translate(treePosition.x, treePosition.y, treePosition.z);

      const treeColor = color.clone().multiplyScalar(rng.uniform(0.6, 0.9));
      const treeMaterial = new THREE.ShaderMaterial({
        vertexShader: VegetationEffect.vegetationVertexShader,
        fragmentShader: VegetationEffect.vegetationFragmentShader,
        uniforms: {
          time: { value: 0 },
          timeSpeed: { value: this.params.timeSpeed },
          opacity: { value: this.params.opacity! * rng.uniform(0.7, 0.9) },
          vegetationColor: { value: treeColor },
          density: { value: this.params.density! * rng.uniform(0.8, 1.2) },
          treeHeight: { value: this.params.treeHeight },
          lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
          lightPosition: { value: new THREE.Vector3(0, 0, 0) },
        },
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const treeMesh = new THREE.Mesh(treeGeometry, treeMaterial);
      treeMesh.renderOrder = 4;

      this.treeLayers.push(treeMesh);
      this.vegetationGroup.add(treeMesh);
    }
  }

  private createOrganicVegetationGeometry(planetRadius: number, normal: THREE.Vector3, size: number, rng: SeededRandom): THREE.BufferGeometry {
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    const tangent1 = new THREE.Vector3();
    const tangent2 = new THREE.Vector3();

    if (Math.abs(normal.y) < 0.99) {
      tangent1.crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize();
    } else {
      tangent1.crossVectors(normal, new THREE.Vector3(1, 0, 0)).normalize();
    }
    tangent2.crossVectors(normal, tangent1).normalize();

    const centerPosition = normal.clone().multiplyScalar(planetRadius * 1.0005);

    let vertexIndex = 0;

    const numPoints = Math.floor(rng.uniform(20, 40));
    const outerPoints: { x: number; y: number; u: number; v: number }[] = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;

      const noiseAngle = angle * 3;
      const noiseValue = Math.sin(noiseAngle + rng.uniform(0, Math.PI * 2)) * 0.3 + 1.0;
      const radiusVariation = rng.uniform(0.6, 1.0) * noiseValue;

      const localRadius = size * radiusVariation;
      const localX = Math.cos(angle) * localRadius;
      const localY = Math.sin(angle) * localRadius;

      outerPoints.push({
        x: localX,
        y: localY,
        u: (localX / size + 1) * 0.5,
        v: (localY / size + 1) * 0.5,
      });
    }

    vertices.push(centerPosition.x, centerPosition.y, centerPosition.z);
    uvs.push(0.5, 0.5);
    const centerIndex = vertexIndex++;

    for (const point of outerPoints) {
      const worldPos = centerPosition.clone().addScaledVector(tangent1, point.x).addScaledVector(tangent2, point.y);

      const direction = worldPos.clone().normalize();
      const elevationNoise = this.noise2D(point.x * 5, point.y * 5, rng) * 0.0002;
      const finalPos = direction.multiplyScalar(planetRadius * (1.0005 + elevationNoise));

      vertices.push(finalPos.x, finalPos.y, finalPos.z);
      uvs.push(point.u, point.v);
      vertexIndex++;
    }

    for (let i = 0; i < outerPoints.length; i++) {
      const nextI = (i + 1) % outerPoints.length;
      const outerIndex1 = i + 1;
      const outerIndex2 = nextI + 1;

      indices.push(centerIndex, outerIndex1, outerIndex2);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  private createSingleTreeGeometry(treeSize: number, rng: SeededRandom): THREE.BufferGeometry {
    const height = treeSize * rng.uniform(0.8, 1.5);
    const width = treeSize * rng.uniform(0.4, 0.8);

    const vertices = [
      // Triángulo inferior
      -width / 2,
      0,
      0, // Esquina inferior izquierda
      width / 2,
      0,
      0, // Esquina inferior derecha
      -width / 2,
      height,
      0, // Esquina superior izquierda

      // Triángulo superior
      width / 2,
      0,
      0, // Esquina inferior derecha
      width / 2,
      height,
      0, // Esquina superior derecha
      -width / 2,
      height,
      0, // Esquina superior izquierda
    ];

    const uvs = [
      // Triángulo inferior
      0, 0, 1, 0, 0, 1,

      1, 0, 1, 1, 0, 1,
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();

    return geometry;
  }

  private noise2D(x: number, y: number, rng: SeededRandom): number {
    const seed = this.params.seed || 0;
    const hash = (px: number, py: number) => {
      const dot = px * 12.9898 + py * 78.233 + seed;
      return (Math.sin(dot) * 43758.5453) % 1;
    };

    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    const n00 = Math.abs(hash(ix, iy));
    const n10 = Math.abs(hash(ix + 1, iy));
    const n01 = Math.abs(hash(ix, iy + 1));
    const n11 = Math.abs(hash(ix + 1, iy + 1));

    const nx0 = n00 * (1 - fx) + n10 * fx;
    const nx1 = n01 * (1 - fx) + n11 * fx;

    return nx0 * (1 - fy) + nx1 * fy;
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.vegetationGroup.position.copy(planetPosition);
    }
    scene.add(this.vegetationGroup);
  }

  update(_deltaTime?: number, planetRotation?: number): void {
    const timeSinceCosmicOrigin = getUniverseTime(this.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME);
    const animTime = (timeSinceCosmicOrigin + this.cosmicOffset) * this.params.timeSpeed!;
    const windowedTime = animTime % 10000;

    [...this.vegetationPatches, ...this.treeLayers].forEach((mesh) => {
      const material = mesh.material as THREE.ShaderMaterial;
      material.uniforms.time.value = windowedTime;
    });

    // Rotate with planet
    if (planetRotation !== undefined) {
      this.vegetationGroup.rotation.y = planetRotation;
    }
  }

  updateLightPosition(position: THREE.Vector3): void {
    [...this.vegetationPatches, ...this.treeLayers].forEach((mesh) => {
      const material = mesh.material as THREE.ShaderMaterial;
      if (material.uniforms.lightPosition) {
        material.uniforms.lightPosition.value.copy(position);
      }
    });
  }

  updateLightDirection(direction: THREE.Vector3): void {
    [...this.vegetationPatches, ...this.treeLayers].forEach((mesh) => {
      const material = mesh.material as THREE.ShaderMaterial;
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

  updateParams(newParams: Partial<VegetationParams>): void {
    this.params = { ...this.params, ...newParams };

    [...this.vegetationPatches, ...this.treeLayers].forEach((mesh) => {
      const material = mesh.material as THREE.ShaderMaterial;

      if (newParams.opacity !== undefined) {
        material.uniforms.opacity.value = newParams.opacity;
      }
      if (newParams.density !== undefined) {
        material.uniforms.density.value = newParams.density;
      }
      if (newParams.timeSpeed !== undefined) {
        material.uniforms.timeSpeed.value = newParams.timeSpeed;
      }
    });
  }

  getObject3D(): THREE.Group {
    return this.vegetationGroup;
  }

  dispose(): void {
    [...this.vegetationPatches, ...this.treeLayers].forEach((mesh) => {
      mesh.geometry.dispose();
      (mesh.material as THREE.ShaderMaterial).dispose();
    });

    this.vegetationPatches = [];
    this.treeLayers = [];
    this.vegetationGroup.clear();
  }
}

export function createVegetationFromPythonData(planetRadius: number, surfaceData: any, globalSeed?: number, cosmicOriginTime?: number): VegetationEffect | null {
  const vegetationPatches = surfaceData.vegetation;

  const seed = globalSeed || Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed + 8000);

  const params: VegetationParams = {
    color: new THREE.Color(0x2d5a3d),
    density: rng.uniform(PROCEDURAL_RANGES.DENSITY.min, PROCEDURAL_RANGES.DENSITY.max),
    opacity: rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max),
    size: rng.uniform(PROCEDURAL_RANGES.SIZE.min, PROCEDURAL_RANGES.SIZE.max),
    treeHeight: rng.uniform(PROCEDURAL_RANGES.TREE_HEIGHT.min, PROCEDURAL_RANGES.TREE_HEIGHT.max),
    timeSpeed: rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),
    seed: seed + 8000,
    cosmicOriginTime: cosmicOriginTime,
    vegetationPatches: vegetationPatches,
  };

  return new VegetationEffect(planetRadius, params);
}
