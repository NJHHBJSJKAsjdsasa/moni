// atlas-ui/react/static/js/3DEffects/IcyFeatures.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";

export interface IcyFeaturesParams {
  crystals?: any[];
  cracks?: any[];
  iceCaps?: any[];
  seed?: number;
}

export class IcyFeaturesEffect {
  private featuresGroup: THREE.Group;
  private crystals: THREE.Mesh[] = [];
  private cracks: THREE.Mesh[] = [];
  private iceCaps: THREE.Mesh[] = [];
  private planetRadius: number;

  constructor(planetRadius: number, params: IcyFeaturesParams = {}) {
    this.featuresGroup = new THREE.Group();
    this.planetRadius = planetRadius;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    if (params.crystals && params.crystals.length > 0) {
      this.generateCrystals(params.crystals, rng);
    }

    if (params.cracks && params.cracks.length > 0) {
      this.generateCracks(params.cracks);
    }

    if (params.iceCaps && params.iceCaps.length > 0) {
      this.generateIceCaps(params.iceCaps, rng);
    }
  }

  /**
   * Genera cristales de hielo 3D realistas
   */
  private generateCrystals(crystalsData: any[], rng: SeededRandom): void {
    crystalsData.forEach((crystal) => {
      const position = crystal.position || [0, 0];
      const baseSize = (crystal.width || 0.05) * this.planetRadius * 0.8;
      const height = (crystal.length || 0.1) * this.planetRadius * 0.08;
      const angle = crystal.angle || 0;
      const crystalColor = crystal.color || [172 / 255, 215 / 255, 230 / 255, 1.0];

      const minThickness = this.planetRadius * 0.015;
      const actualThickness = Math.max(height, minThickness);

      const geometry = new THREE.BoxGeometry(baseSize * 2, actualThickness, baseSize * 1.5, 4, 2, 4);

      const positions = geometry.attributes.position;
      const vertex = new THREE.Vector3();

      for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);

        if (Math.abs(vertex.y) > actualThickness * 0.3) {
          const angle = Math.atan2(vertex.z, vertex.x);
          const distance = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);

          const hexAngle = Math.round(angle / (Math.PI / 3)) * (Math.PI / 3);
          const variation = rng.uniform(0.8, 1.2);
          const newDistance = distance * variation;

          vertex.x = Math.cos(hexAngle) * newDistance;
          vertex.z = Math.sin(hexAngle) * newDistance;

          vertex.y += rng.uniform(-actualThickness * 0.1, actualThickness * 0.1);
        }

        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }

      positions.needsUpdate = true;
      geometry.computeVertexNormals();

      const material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(crystalColor[0], crystalColor[1], crystalColor[2]),
        transparent: true,
        opacity: 0.8,
        metalness: 0.0,
        roughness: 0.02,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        transmission: 0.7,
        ior: 1.31,
        thickness: 0.5,
        emissive: new THREE.Color(crystalColor[0], crystalColor[1], crystalColor[2]),
        emissiveIntensity: 0.02,
        flatShading: false,
        side: THREE.FrontSide,
      });

      const crystalMesh = new THREE.Mesh(geometry, material);

      let normalizedY = Math.min(1, Math.max(-1, position[1]));

      const polarBias = Math.pow(Math.abs(normalizedY), 0.3);
      const biasedY = Math.sign(normalizedY) * polarBias;

      const polarNoise = rng.uniform(-0.3, 0.3) * (1 - Math.abs(biasedY));
      const finalY = Math.min(1, Math.max(-1, biasedY + polarNoise));

      const phi = Math.acos(Math.abs(finalY));
      const theta = Math.atan2(position[0], 0.001) + angle;

      const surfaceRadius = this.planetRadius * rng.uniform(1.0005, 1.001);
      const x = surfaceRadius * Math.sin(phi) * Math.cos(theta);
      const y = surfaceRadius * finalY;
      const z = surfaceRadius * Math.sin(phi) * Math.sin(theta);

      crystalMesh.position.set(x, y, z);

      const surfaceNormal = crystalMesh.position.clone().normalize();

      const tangent1 = new THREE.Vector3();
      const tangent2 = new THREE.Vector3();

      if (Math.abs(surfaceNormal.x) < 0.9) {
        tangent1.set(1, 0, 0);
      } else {
        tangent1.set(0, 1, 0);
      }
      tangent1.crossVectors(tangent1, surfaceNormal).normalize();

      tangent2.crossVectors(surfaceNormal, tangent1).normalize();

      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeBasis(tangent1, surfaceNormal, tangent2);

      crystalMesh.rotation.setFromRotationMatrix(rotationMatrix);

      crystalMesh.rotateY(rng.uniform(0, Math.PI * 2));

      const scaleVariation = rng.uniform(0.8, 1.2);
      crystalMesh.scale.set(scaleVariation, scaleVariation, scaleVariation);

      this.crystals.push(crystalMesh);
      this.featuresGroup.add(crystalMesh);
    });
  }

  /**
   * Genera grietas en el hielo - MODIFICADO para favorecer regiones polares
   */
  private generateCracks(cracksData: any[]): void {
    const rng = new SeededRandom(42);

    cracksData.forEach((crack) => {
      const angle = crack.angle || 0;
      const length = (crack.length || 1.0) * this.planetRadius * 2;
      const crackColor = crack.color || [80 / 255, 80 / 255, 80 / 255, 0.4];
      const width = (crack.width || 1) * 0.0005 * this.planetRadius;

      const polarBiasedLat = rng.uniform(0.6, 1.0);
      const hemisphere = rng.uniform(0, 1) > 0.5 ? 1 : -1;
      const phi = Math.acos(polarBiasedLat * hemisphere);

      const points: THREE.Vector3[] = [];
      const numSegments = 20;

      for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments;
        const variance = Math.sin(t * Math.PI) * 0.1;

        const baseTheta = angle;
        const theta = baseTheta + ((t - 0.5) * length) / (this.planetRadius * Math.sin(Math.abs(phi))) + variance;

        const x = this.planetRadius * 1.002 * Math.sin(Math.abs(phi)) * Math.cos(theta);
        const y = this.planetRadius * 1.002 * Math.cos(Math.abs(phi)) * hemisphere;
        const z = this.planetRadius * 1.002 * Math.sin(Math.abs(phi)) * Math.sin(theta);

        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);

      const tubeGeometry = new THREE.TubeGeometry(curve, numSegments * 2, width, 8, false);

      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(crackColor[0], crackColor[1], crackColor[2]),
        transparent: true,
        opacity: crackColor[3] || 0.4,
        emissive: new THREE.Color(0, 0, 0),
        shininess: 5,
      });

      const crackMesh = new THREE.Mesh(tubeGeometry, material);

      this.cracks.push(crackMesh);
      this.featuresGroup.add(crackMesh);
    });
  }

  /**
   * Genera casquetes de hielo como campos de cristales agrupados
   */
  private generateIceCaps(iceCapsData: any[], rng: SeededRandom): void {
    iceCapsData.forEach((cap) => {
      const position = cap.position || [0, 0];
      const radius = (cap.radius || 0.3) * this.planetRadius;
      const capColor = cap.color || [0.678, 0.847, 1.0, 0.8];

      const theta = Math.atan2(position[1], position[0]);
      const phi = Math.acos(Math.min(1, Math.max(-1, Math.sqrt(position[0] ** 2 + position[1] ** 2))));

      const centerX = this.planetRadius * 1.002 * Math.sin(phi) * Math.cos(theta);
      const centerY = this.planetRadius * 1.002 * Math.cos(phi);
      const centerZ = this.planetRadius * 1.002 * Math.sin(phi) * Math.sin(theta);

      const centerPosition = new THREE.Vector3(centerX, centerY, centerZ);
      const normalFromPlanet = centerPosition.clone().normalize();

      const iceCapGroup = new THREE.Group();

      const numCrystals = Math.floor(rng.uniform(8, 20));

      for (let i = 0; i < numCrystals; i++) {
        const angle = rng.uniform(0, Math.PI * 2);
        const distance = rng.uniform(0, radius * 0.8);

        const offsetX = Math.cos(angle) * distance;
        const offsetZ = Math.sin(angle) * distance;

        const tangent1 = new THREE.Vector3();
        const tangent2 = new THREE.Vector3();

        if (Math.abs(normalFromPlanet.y) < 0.99) {
          tangent1.crossVectors(normalFromPlanet, new THREE.Vector3(0, 1, 0)).normalize();
        } else {
          tangent1.crossVectors(normalFromPlanet, new THREE.Vector3(1, 0, 0)).normalize();
        }
        tangent2.crossVectors(normalFromPlanet, tangent1).normalize();

        const crystalPosition = centerPosition.clone().addScaledVector(tangent1, offsetX).addScaledVector(tangent2, offsetZ);

        const direction = crystalPosition.normalize();
        const finalPosition = direction.multiplyScalar(this.planetRadius * rng.uniform(1.002, 1.008));

        const crystalSize = rng.uniform(radius * 0.05, radius * 0.15);
        const crystalHeight = rng.uniform(crystalSize * 0.4, crystalSize * 4.0);

        const crystalGeometry = new THREE.ConeGeometry(crystalSize, crystalHeight, 6, 1, false);

        const positions = crystalGeometry.attributes.position;
        const vertex = new THREE.Vector3();

        for (let k = 0; k < positions.count; k++) {
          vertex.fromBufferAttribute(positions, k);

          if (vertex.y > 0.1 && vertex.y < crystalHeight * 0.9) {
            const angle = Math.atan2(vertex.z, vertex.x);
            const radius = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);

            const facetAngle = Math.round(angle / (Math.PI / 3)) * (Math.PI / 3);
            const facetRadius = radius * 1.1;

            vertex.x = Math.cos(facetAngle) * facetRadius;
            vertex.z = Math.sin(facetAngle) * facetRadius;

            positions.setXYZ(k, vertex.x, vertex.y, vertex.z);
          }
        }

        positions.needsUpdate = true;

        crystalGeometry.computeVertexNormals();

        const crystalMaterial = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(capColor[0], capColor[1], capColor[2]),
          transparent: true,
          opacity: 0.85,
          metalness: 0.0,
          roughness: 0.05,
          clearcoat: 1.0,
          clearcoatRoughness: 0.0,
          transmission: 0.6,
          ior: 1.31,
          thickness: 0.8,
          emissive: new THREE.Color(capColor[0], capColor[1], capColor[2]),
          emissiveIntensity: 0.03,
          flatShading: true,
          side: THREE.FrontSide,
        });

        const crystalMesh = new THREE.Mesh(crystalGeometry, crystalMaterial);

        crystalMesh.position.copy(finalPosition);

        crystalMesh.lookAt(0, 0, 0);
        crystalMesh.rotateX(Math.PI / 2);
        crystalMesh.rotateZ(rng.uniform(0, Math.PI * 2));

        const scale = rng.uniform(0.7, 1.3);
        crystalMesh.scale.set(scale, scale, scale);

        iceCapGroup.add(crystalMesh);
        this.iceCaps.push(crystalMesh);
      }

      this.featuresGroup.add(iceCapGroup);
    });
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.featuresGroup.position.copy(planetPosition);
    }
    scene.add(this.featuresGroup);
  }

  update(_deltaTime?: number, planetRotation?: number): void {
    if (planetRotation !== undefined) {
      this.featuresGroup.rotation.y = planetRotation;
    }
  }

  getObject3D(): THREE.Group {
    return this.featuresGroup;
  }

  dispose(): void {
    this.crystals.forEach((crystal) => {
      crystal.geometry.dispose();
      if (crystal.material instanceof THREE.Material) {
        crystal.material.dispose();
      }
    });

    this.cracks.forEach((crack) => {
      crack.geometry.dispose();
      if (crack.material instanceof THREE.Material) {
        crack.material.dispose();
      }
    });

    this.iceCaps.forEach((cap) => {
      cap.geometry.dispose();
      if (cap.material instanceof THREE.Material) {
        cap.material.dispose();
      }
    });

    this.crystals = [];
    this.cracks = [];
    this.iceCaps = [];
    this.featuresGroup.clear();
  }
}

export function createIcyFeaturesFromPythonData(planetRadius: number, surfaceData: any, globalSeed?: number): IcyFeaturesEffect | null {
  const crystals = surfaceData.crystals;
  const cracks = surfaceData.cracks;
  const iceCaps = surfaceData.ice_caps;

  if (!crystals && !cracks && !iceCaps) {
    return null;
  }

  const seed = globalSeed || Math.floor(Math.random() * 1000000);

  return new IcyFeaturesEffect(planetRadius, {
    crystals: crystals || [],
    cracks: cracks || [],
    iceCaps: iceCaps || [],
    seed: seed + 9000,
  });
}
