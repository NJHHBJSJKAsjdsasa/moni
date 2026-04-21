// atlas-ui/react/static/js/3DEffects/ExoticGeometricShapes.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";

export interface ExoticGeometricShapesParams {
  shapes?: Array<{
    position_3d: [number, number, number];
    sides: number;
    size: number;
    rotation_speed: number;
    color: [number, number, number, number];
    angle: number;
  }>;
  planetRadius?: number;
  planetColor?: THREE.Color;
}

export class ExoticGeometricShapesEffect {
  private group: THREE.Group;
  private shapes: THREE.Mesh[] = [];
  private rotationSpeeds: number[] = [];
  private planetRadius: number;
  private planetColor: THREE.Color;

  constructor(planetRadius: number, params: ExoticGeometricShapesParams = {}) {
    this.group = new THREE.Group();
    this.planetRadius = planetRadius;
    this.planetColor = params.planetColor || new THREE.Color(0x800080);

    if (params.shapes && params.shapes.length > 0) {
      this.createShapes(params.shapes);
    }
  }

  private createShapes(shapesData: ExoticGeometricShapesParams["shapes"]) {
    if (!shapesData) return;

    shapesData.forEach((shapeData) => {
      const geometry = new THREE.CircleGeometry(shapeData.size * this.planetRadius, shapeData.sides);

      const darkerFactor = 0.7;
      const shapeColor = this.planetColor.clone();
      shapeColor.multiplyScalar(darkerFactor);

      const material = new THREE.MeshPhongMaterial({
        color: shapeColor,
        transparent: true,
        opacity: 0.8,
        emissive: shapeColor.clone().multiplyScalar(0.3),
        emissiveIntensity: 0.3,
        shininess: 60,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);

      const distance = this.planetRadius * 1.005;
      mesh.position.set(shapeData.position_3d[0] * distance, shapeData.position_3d[1] * distance, shapeData.position_3d[2] * distance);

      mesh.lookAt(0, 0, 0);

      mesh.rotateZ(shapeData.angle);

      this.shapes.push(mesh);
      this.rotationSpeeds.push(shapeData.rotation_speed);
      this.group.add(mesh);
    });
  }

  update(deltaTime: number): void {
    this.shapes.forEach((shape, index) => {
      shape.rotateZ(this.rotationSpeeds[index] * deltaTime);
    });
  }

  addToScene(scene: THREE.Scene, planetPosition: THREE.Vector3): void {
    this.group.position.copy(planetPosition);
    scene.add(this.group);
  }

  removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.group);
  }

  getObject3D(): THREE.Object3D {
    return this.group;
  }

  dispose(): void {
    this.shapes.forEach((shape) => {
      shape.geometry.dispose();
      if (shape.material instanceof THREE.Material) {
        shape.material.dispose();
      }
    });
    this.shapes = [];
  }
}

export function createExoticGeometricShapesFromPythonData(planetRadius: number, surfaceElements: any, seed?: number, planetColor?: THREE.Color): ExoticGeometricShapesEffect | null {
  if (!surfaceElements.small_geometric_shapes || surfaceElements.small_geometric_shapes.length === 0) {
    return null;
  }

  return new ExoticGeometricShapesEffect(planetRadius, {
    shapes: surfaceElements.small_geometric_shapes,
    planetRadius: planetRadius,
    planetColor: planetColor,
  });
}
