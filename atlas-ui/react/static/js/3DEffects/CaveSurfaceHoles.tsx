// atlas-ui/react/static/js/3DEffects/CaveSurfaceHoles.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";

export interface CaveSurfaceHolesParams {
  holes?: Array<{
    position_3d: [number, number, number];
    radius: number;
    depth: number;
    roughness: number;
    color_variation: number;
  }>;
  planetRadius?: number;
  baseColor?: THREE.Color | string;
  holeColor?: THREE.Color | string;
  enableShadows?: boolean;
}

const PROCEDURAL_RANGES = {
  HOLE_COUNT: { min: 22, max: 36 },
  HOLE_RADIUS: { min: 0.03, max: 0.1 },
  HOLE_DEPTH: { min: 0.02, max: 0.12 },
  ROUGHNESS: { min: 0.4, max: 0.8 },
  COLOR_VARIATION: { min: 0.2, max: 0.5 },
};

export class CaveSurfaceHolesEffect {
  private group: THREE.Group;
  private planetRadius: number;
  private rng: SeededRandom;
  private holesData: CaveSurfaceHolesParams["holes"] = [];
  private coneMeshes: THREE.Mesh[] = [];
  private holeMask?: THREE.Mesh;
  private holeColor: THREE.Color;

  constructor(planetRadius: number, params: CaveSurfaceHolesParams = {}, seed?: number) {
    this.group = new THREE.Group();
    this.planetRadius = planetRadius;

    const actualSeed = seed || 12345;
    this.rng = new SeededRandom(actualSeed);

    this.holeColor = params.holeColor instanceof THREE.Color ? params.holeColor : new THREE.Color(params.holeColor || "#000000");

    this.holesData = this.generateProceduralHoles();

    if (this.holesData.length > 0) {
      this.createHoles();
    }
  }

  private generateProceduralHoles(): CaveSurfaceHolesParams["holes"] {
    const holes: NonNullable<CaveSurfaceHolesParams["holes"]> = [];
    const holeCount = this.rng.randint(PROCEDURAL_RANGES.HOLE_COUNT.min, PROCEDURAL_RANGES.HOLE_COUNT.max);

    for (let i = 0; i < holeCount; i++) {
      const theta = this.rng.random() * 2 * Math.PI;
      const phi = Math.acos(this.rng.random() * 2 - 1);

      const position_3d: [number, number, number] = [Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)];

      holes.push({
        position_3d,
        radius: this.rng.uniform(PROCEDURAL_RANGES.HOLE_RADIUS.min, PROCEDURAL_RANGES.HOLE_RADIUS.max),
        depth: this.rng.uniform(PROCEDURAL_RANGES.HOLE_DEPTH.min, PROCEDURAL_RANGES.HOLE_DEPTH.max),
        roughness: this.rng.uniform(PROCEDURAL_RANGES.ROUGHNESS.min, PROCEDURAL_RANGES.ROUGHNESS.max),
        color_variation: this.rng.uniform(PROCEDURAL_RANGES.COLOR_VARIATION.min, PROCEDURAL_RANGES.COLOR_VARIATION.max),
      });
    }

    return holes;
  }

  createPlanetHoleShader(baseColor: THREE.Color): THREE.ShaderMaterial {
    const MAX_SHADER_HOLES = 64;
    const maxHoles = Math.min(this.holesData.length, MAX_SHADER_HOLES);

    const vertexShader = `
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

    const fragmentShader = `
      uniform vec3 baseColor;
      uniform vec3 lightDirection;
      uniform vec3 lightPosition;
      uniform float ambientStrength;
      uniform float lightIntensity;
      uniform vec3 holePositions[${maxHoles}];
      uniform float holeRadii[${maxHoles}];
      uniform int numHoles;
      uniform float rotationAngle;

      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUv;

      vec3 rotateY(vec3 p, float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
      }

      void main() {
        vec3 rotatedWorldPos = rotateY(vWorldPosition, -rotationAngle);
        vec3 worldPos = normalize(rotatedWorldPos);

        for(int i = 0; i < ${maxHoles}; i++) {
          if(i >= numHoles) break;

          vec3 holePos = normalize(holePositions[i]);
          float dist = distance(worldPos, holePos);
          float holeRadius = holeRadii[i];

          if(dist < holeRadius) {
            discard;
          }
        }

        vec3 normal = normalize(vWorldNormal);
        
        vec3 lightDir;
        if (length(lightPosition) > 0.0) {
          lightDir = normalize(lightPosition - vWorldPosition);
        } else {
          lightDir = normalize(-lightDirection);
        }
        
        float dotNL = dot(normal, lightDir);
        float dayNight = smoothstep(-0.3, 0.1, dotNL);

        float rimLight = 1.0 - abs(dotNL);
        rimLight = pow(rimLight, 3.0) * 0.1;

        float totalLight = ambientStrength + (lightIntensity * dayNight) + rimLight;
        vec3 finalColor = baseColor * totalLight;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const holePositions = new Array(maxHoles).fill(null).map((_, i) => (i < this.holesData.length ? new THREE.Vector3(...this.holesData[i].position_3d) : new THREE.Vector3(0, 0, 0)));

    const holeRadii = new Array(maxHoles).fill(null).map((_, i) => (i < this.holesData.length ? this.holesData[i].radius : 0));

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        baseColor: { value: baseColor },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
        ambientStrength: { value: 0.15 },
        lightIntensity: { value: 0.85 },
        holePositions: { value: holePositions },
        holeRadii: { value: holeRadii },
        numHoles: { value: maxHoles },
        rotationAngle: { value: 0.0 },
      },
      side: THREE.FrontSide,
    });
  }

  private createHoles(): void {
    const MAX_SHADER_HOLES = 64;
    const holesForCones = this.holesData.slice(0, MAX_SHADER_HOLES);

    holesForCones.forEach((holeData) => {
      this.createHoleCone(holeData);
    });
  }

  private createHollowConeGeometry(topRadius: number, height: number, segments: number, planetRadius: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle);
      const z = Math.sin(angle);

      const topX = x * topRadius;
      const topZ = z * topRadius;
      const topY = height / 2;

      const radiusFromCenter = Math.sqrt(topX * topX + topZ * topZ);
      const curvatureFactor = (radiusFromCenter * radiusFromCenter) / (planetRadius * 2);
      const curvedY = topY - curvatureFactor;

      vertices.push(topX, curvedY, topZ);
      uvs.push(i / segments, 1);

      vertices.push(0, -height / 2, 0);
      uvs.push(i / segments, 0);
    }

    for (let i = 0; i < segments; i++) {
      const topIndex1 = i * 2;
      const bottomIndex1 = i * 2 + 1;
      const topIndex2 = ((i + 1) % (segments + 1)) * 2;
      const bottomIndex2 = ((i + 1) % (segments + 1)) * 2 + 1;

      indices.push(topIndex1, bottomIndex1, topIndex2);

      indices.push(bottomIndex1, bottomIndex2, topIndex2);

      const angle = (i / segments) * Math.PI * 2;

      const normal1x = Math.cos(angle);
      const normal1z = Math.sin(angle);

      normals.push(normal1x, 0.5, normal1z);
      normals.push(normal1x, 0.5, normal1z);
    }

    const angle = 0;
    const normalX = Math.cos(angle);
    const normalZ = Math.sin(angle);
    normals.push(normalX, 0.5, normalZ);
    normals.push(normalX, 0.5, normalZ);

    geometry.setIndex(indices);
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

    return geometry;
  }

  private createHoleCone(holeData: NonNullable<CaveSurfaceHolesParams["holes"]>[0]): void {
    const position = new THREE.Vector3(...holeData.position_3d).normalize();
    const coneRadius = holeData.radius * this.planetRadius;
    const caveDepth = holeData.depth * this.planetRadius * 2;

    const coneGeometry = this.createHollowConeGeometry(coneRadius, caveDepth, 16, this.planetRadius);
    const coneMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color(0x808080),
      transparent: false,
      opacity: 1.0,
      side: THREE.DoubleSide,
    });

    const coneMesh = new THREE.Mesh(coneGeometry, coneMaterial);

    const surfacePosition = position.clone().multiplyScalar(this.planetRadius);
    const inwardDirection = position.clone().negate();

    const conePosition = surfacePosition.clone().add(inwardDirection.clone().multiplyScalar(caveDepth * 0.5));
    coneMesh.position.copy(conePosition);

    const up = new THREE.Vector3(0, 1, 0);
    const targetDirection = position.clone();

    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, targetDirection);
    coneMesh.setRotationFromQuaternion(quaternion);

    this.coneMeshes.push(coneMesh);
    this.group.add(coneMesh);
  }

  update(_deltaTime: number, planetRotation?: number): void {
    if (planetRotation !== undefined) {
      this.group.rotation.y = planetRotation;
      if (this.planetShader && this.planetShader.uniforms.rotationAngle) {
        this.planetShader.uniforms.rotationAngle.value = planetRotation;
      }
    }
  }

  updateLightDirection(direction: THREE.Vector3): void {
    if (this.planetShader) {
      this.planetShader.uniforms.lightDirection.value.copy(direction.normalize());
    }
  }

  updateFromThreeLight(light: THREE.DirectionalLight): void {
    if (this.planetShader) {
      this.planetShader.uniforms.lightPosition.value.copy(light.position);
      const direction = light.target.position.clone().sub(light.position).normalize();
      this.planetShader.uniforms.lightDirection.value.copy(direction);
    }
  }

  addToScene(scene: THREE.Scene, planetPosition: THREE.Vector3): void {
    this.group.position.copy(planetPosition);
    scene.add(this.group);
  }

  applyToPlanetSystem(planetSystem: any, baseColor: THREE.Color): void {
    const holeShader = this.createPlanetHoleShader(baseColor);

    // Copy lighting uniforms from the original planet material to match its lighting
    if (planetSystem.baseMaterial && planetSystem.baseMaterial.uniforms) {
      const originalUniforms = planetSystem.baseMaterial.uniforms;
      if (originalUniforms.lightDirection) {
        holeShader.uniforms.lightDirection.value.copy(originalUniforms.lightDirection.value);
      }
      if (originalUniforms.lightPosition) {
        holeShader.uniforms.lightPosition.value.copy(originalUniforms.lightPosition.value);
      }
      if (originalUniforms.ambientStrength) {
        holeShader.uniforms.ambientStrength.value = originalUniforms.ambientStrength.value;
      }
      if (originalUniforms.lightIntensity) {
        holeShader.uniforms.lightIntensity.value = originalUniforms.lightIntensity.value;
      }
    }

    planetSystem.applyHoleShader(holeShader);
    this.planetShader = holeShader;
    this.planetSystem = planetSystem;
  }

  private planetShader?: THREE.ShaderMaterial;
  private planetSystem?: any;

  removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.group);
  }

  getObject3D(): THREE.Object3D {
    return this.group;
  }

  dispose(): void {
    this.coneMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    });
    this.coneMeshes = [];

    if (this.planetShader) {
      this.planetShader.dispose();
      this.planetShader = undefined;
    }
  }
}

export function createCaveSurfaceHolesFromPythonData(planetRadius: number, pythonData?: any, seed?: number): CaveSurfaceHolesEffect | null {
  const caveData = pythonData?.surface_elements?.cave_holes;

  const params: CaveSurfaceHolesParams = {};

  if (caveData?.holes) {
    params.holes = caveData.holes;
  }

  if (caveData?.hole_color) {
    params.holeColor = caveData.hole_color;
  }

  return new CaveSurfaceHolesEffect(planetRadius, params, seed);
}
