// atlas-ui/react/static/js/3DEffects/FragmentationEffect.tsx

import * as THREE from "three";

export interface FragmentationParams {
  fragmentCount?: number;
  color?: THREE.Color | number[];
  size?: number;
  distribution?: "edge" | "surface" | "random";
  animationSpeed?: number;
  rotationSpeed?: number;
  metalness?: number;
  roughness?: number;
}

export class FragmentationEffect {
  private fragments: THREE.Group;
  private fragmentMeshes: THREE.Mesh[] = [];
  private params: FragmentationParams;
  private planetRadius: number;

  constructor(planetRadius: number, params: FragmentationParams = {}) {
    this.planetRadius = planetRadius;
    this.params = {
      fragmentCount: params.fragmentCount || 20,
      color: params.color || new THREE.Color(0x444444),
      size: params.size || 0.05,
      distribution: params.distribution || "edge",
      animationSpeed: params.animationSpeed || 1.0,
      rotationSpeed: params.rotationSpeed || 0.1,
      metalness: params.metalness || 0.9,
      roughness: params.roughness || 0.6,
    };

    this.fragments = new THREE.Group();
    this.generateFragments();
  }

  private generateFragments(): void {
    const material = new THREE.MeshStandardMaterial({
      color: this.params.color instanceof THREE.Color ? this.params.color : new THREE.Color(this.params.color as any),
      metalness: this.params.metalness,
      roughness: this.params.roughness,
    });

    for (let i = 0; i < this.params.fragmentCount!; i++) {
      const geometry = this.generateFragmentGeometry();
      const fragment = new THREE.Mesh(geometry, material);

      this.positionFragment(fragment, i);

      fragment.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      const scale = this.params.size! * (Math.random() * 0.5 + 0.75);
      fragment.scale.set(scale, scale, scale);

      (fragment as any).userData = {
        rotationAxis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        rotationSpeed: (Math.random() - 0.5) * this.params.rotationSpeed!,
      };

      this.fragmentMeshes.push(fragment);
      this.fragments.add(fragment);
    }
  }

  private generateFragmentGeometry(): THREE.BufferGeometry {
    const sides = Math.floor(Math.random() * 4) + 3;
    const vertices: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    const baseVertices: THREE.Vector3[] = [];

    baseVertices.push(new THREE.Vector3(0, 0, 0));

    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const radius = Math.random() * 0.5 + 0.5;
      const height = (Math.random() - 0.5) * 0.3;

      baseVertices.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, height));
    }

    for (let i = 1; i <= sides; i++) {
      const baseVertex = baseVertices[i];
      const extrudedVertex = baseVertex.clone();
      extrudedVertex.z += Math.random() * 0.4 + 0.2;
      baseVertices.push(extrudedVertex);
    }

    for (const vertex of baseVertices) {
      vertices.push(vertex.x, vertex.y, vertex.z);
    }

    for (let i = 1; i < sides; i++) {
      indices.push(0, i, i + 1);
    }
    indices.push(0, sides, 1);

    const topCenterIndex = baseVertices.length - sides - 1;
    for (let i = 0; i < sides - 1; i++) {
      indices.push(topCenterIndex, topCenterIndex + i + 2, topCenterIndex + i + 1);
    }
    indices.push(topCenterIndex, topCenterIndex + 1, topCenterIndex + sides);

    for (let i = 0; i < sides; i++) {
      const bottom1 = i + 1;
      const bottom2 = ((i + 1) % sides) + 1;
      const top1 = bottom1 + sides;
      const top2 = bottom2 + sides;

      indices.push(bottom1, top1, bottom2);
      indices.push(bottom2, top1, top2);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  private positionFragment(fragment: THREE.Mesh, index: number): void {
    let position: THREE.Vector3;

    switch (this.params.distribution) {
      case "edge":
        position = this.generateEdgePosition(index);
        break;

      case "surface":
        position = this.generateSurfacePosition();
        break;

      case "random":
      default:
        position = this.generateRandomPosition();
        break;
    }

    fragment.position.copy(position);
  }

  private generateEdgePosition(index: number): THREE.Vector3 {
    const angle = (index / this.params.fragmentCount!) * Math.PI * 2;
    const edgeOffset = this.planetRadius * (0.95 + Math.random() * 0.1);
    const heightVariation = (Math.random() - 0.5) * this.planetRadius * 0.5;

    return new THREE.Vector3(Math.cos(angle) * edgeOffset, heightVariation, Math.sin(angle) * edgeOffset);
  }

  private generateSurfacePosition(): THREE.Vector3 {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const radius = this.planetRadius * (1.0 + Math.random() * 0.05);

    return new THREE.Vector3(radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi));
  }

  private generateRandomPosition(): THREE.Vector3 {
    const radius = this.planetRadius * (0.8 + Math.random() * 0.4);
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI * 2;

    return new THREE.Vector3(radius * Math.sin(angle1) * Math.cos(angle2), radius * Math.sin(angle1) * Math.sin(angle2), radius * Math.cos(angle1));
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.fragments.position.copy(planetPosition);
    }
    scene.add(this.fragments);
  }

  update(deltaTime: number): void {
    this.fragmentMeshes.forEach((fragment, i) => {
      const userData = (fragment as any).userData;

      fragment.rotateOnAxis(userData.rotationAxis, userData.rotationSpeed * deltaTime * this.params.animationSpeed!);

      const floatOffset = Math.sin(Date.now() * 0.001 + i) * 0.001;
      fragment.position.y += floatOffset * deltaTime;
    });

    this.fragments.rotation.y += deltaTime * 0.01 * this.params.animationSpeed!;
  }

  updateParams(newParams: Partial<FragmentationParams>): void {
    this.params = { ...this.params, ...newParams };

    if (newParams.color) {
      const color = newParams.color instanceof THREE.Color ? newParams.color : new THREE.Color(newParams.color as any);

      this.fragmentMeshes.forEach((fragment) => {
        if (fragment.material instanceof THREE.MeshStandardMaterial) {
          fragment.material.color = color;
        }
      });
    }

    if (newParams.metalness !== undefined || newParams.roughness !== undefined) {
      this.fragmentMeshes.forEach((fragment) => {
        if (fragment.material instanceof THREE.MeshStandardMaterial) {
          if (newParams.metalness !== undefined) {
            fragment.material.metalness = newParams.metalness;
          }
          if (newParams.roughness !== undefined) {
            fragment.material.roughness = newParams.roughness;
          }
        }
      });
    }

    if (newParams.size !== undefined || newParams.fragmentCount !== undefined) {
      this.regenerateFragments();
    }
  }

  private regenerateFragments(): void {
    this.fragmentMeshes.forEach((fragment) => {
      if (fragment.geometry) fragment.geometry.dispose();
      if (fragment.material instanceof THREE.Material) fragment.material.dispose();
    });

    this.fragments.clear();
    this.fragmentMeshes = [];

    this.generateFragments();
  }

  getObject3D(): THREE.Group {
    return this.fragments;
  }

  getFragmentMeshes(): THREE.Mesh[] {
    return [...this.fragmentMeshes];
  }

  dispose(): void {
    this.fragmentMeshes.forEach((fragment) => {
      if (fragment.geometry) fragment.geometry.dispose();
      if (fragment.material instanceof THREE.Material) fragment.material.dispose();
    });

    this.fragmentMeshes = [];
    this.fragments.clear();
  }
}
