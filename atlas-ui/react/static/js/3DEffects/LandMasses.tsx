// atlas-ui/react/static/js/3DEffects/LandMasses.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";

export interface LandMassesParams {
  greenPatches?: any[];
  seed?: number;
  transparentMode?: boolean;
  tundraMode?: boolean;
}

export class LandMassesEffect {
  private landGroup: THREE.Group;
  private lands: THREE.Mesh[] = [];

  constructor(planetRadius: number, params: LandMassesParams = {}) {
    this.landGroup = new THREE.Group();

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    if (params.greenPatches && params.greenPatches.length > 0) {
      this.generateLandsFromPython(planetRadius, params.greenPatches, rng, params);
    } else {
      this.generateProceduralLands(planetRadius, rng, params);
    }
  }

  private generateLandsFromPython(planetRadius: number, greenPatches: any[], rng: SeededRandom, params: LandMassesParams): void {
    interface PatchData {
      position: THREE.Vector3;
      size: number;
      color: THREE.Color;
      opacity: number;
      seed: number;
    }

    const patches: PatchData[] = greenPatches.map((patch) => {
      let position = patch.position_3d || patch.position || [0, 0, 1];
      if (position.length === 2) {
        const theta = rng.uniform(0, Math.PI * 2);
        const phi = Math.acos(rng.uniform(-1, 1));
        position = [Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)];
      }

      let patchColor = new THREE.Color(0x4a7c59);
      let patchOpacity = 1.0;
      if (patch.color && Array.isArray(patch.color)) {
        patchColor = new THREE.Color(patch.color[0], patch.color[1], patch.color[2]);
        if (patch.color.length > 3) patchOpacity = patch.color[3];
      }

      return {
        position: new THREE.Vector3(position[0], position[1], position[2]).normalize(),
        size: (patch.size || 0.1) * planetRadius * 1.8 * 1.5,
        color: patchColor,
        opacity: patchOpacity,
        seed: rng.uniform(0, 10000),
      };
    });

    const parent: number[] = patches.map((_, i) => i);
    const find = (i: number): number => {
      if (parent[i] !== i) parent[i] = find(parent[i]);
      return parent[i];
    };
    const union = (i: number, j: number) => {
      const pi = find(i),
        pj = find(j);
      if (pi !== pj) parent[pi] = pj;
    };

    for (let i = 0; i < patches.length; i++) {
      for (let j = i + 1; j < patches.length; j++) {
        const angularDist = Math.acos(Math.min(1, Math.max(-1, patches[i].position.dot(patches[j].position))));
        const dist = angularDist * planetRadius;

        const combinedSize = patches[i].size + patches[j].size;
        const proximityMargin = combinedSize * 0.15;
        const maxMergeAngle = Math.PI / 6; // 30°
        if (dist < combinedSize + proximityMargin && angularDist < maxMergeAngle) {
          union(i, j);
        }
      }
    }

    const clusters = new Map<number, number[]>();
    for (let i = 0; i < patches.length; i++) {
      const root = find(i);
      if (!clusters.has(root)) clusters.set(root, []);
      clusters.get(root)!.push(i);
    }

    clusters.forEach((indices) => {
      const clusterPatches = indices.map((i) => patches[i]);
      this.generateMergedLandmass(planetRadius, clusterPatches, rng, params);
    });
  }

  private generateMergedLandmass(planetRadius: number, patches: { position: THREE.Vector3; size: number; color: THREE.Color; opacity: number; seed: number }[], rng: SeededRandom, params: LandMassesParams): void {
    const center = new THREE.Vector3();
    let totalSize = 0;
    patches.forEach((p) => {
      center.add(p.position.clone().multiplyScalar(p.size));
      totalSize += p.size;
    });
    center.divideScalar(totalSize).normalize();

    let maxDist = 0;
    patches.forEach((p) => {
      const angularDist = Math.acos(Math.min(1, Math.max(-1, center.dot(p.position))));
      maxDist = Math.max(maxDist, angularDist * planetRadius + p.size);
    });
    const maxAllowedSize = planetRadius * Math.tan(Math.PI / 5); // ~36°
    const size = Math.min(maxDist * 1.2, maxAllowedSize);

    const avgColor = new THREE.Color(0, 0, 0);
    let avgOpacity = 0;
    patches.forEach((p) => {
      avgColor.r += p.color.r * p.size;
      avgColor.g += p.color.g * p.size;
      avgColor.b += p.color.b * p.size;
      avgOpacity += p.opacity * p.size;
    });
    avgColor.multiplyScalar(1 / totalSize);
    avgOpacity /= totalSize;

    const resolution = Math.max(48, Math.min(80, Math.floor(size * 40)));
    const clusterSeed = patches[0]?.seed || 0;

    const tangent1 = new THREE.Vector3();
    const tangent2 = new THREE.Vector3();
    if (Math.abs(center.y) < 0.99) {
      tangent1.crossVectors(center, new THREE.Vector3(0, 1, 0)).normalize();
    } else {
      tangent1.crossVectors(center, new THREE.Vector3(1, 0, 0)).normalize();
    }
    tangent2.crossVectors(center, tangent1).normalize();

    const noise2D = (x: number, y: number, seed: number = 0) => {
      const hash = (px: number, py: number) => {
        const dot = px * 127.1 + py * 311.7 + seed;
        return (Math.sin(dot) * 43758.5453) % 1;
      };
      const ix = Math.floor(x),
        iy = Math.floor(y);
      const fx = x - ix,
        fy = y - iy;
      const smooth = (t: number) => t * t * (3 - 2 * t);
      const sx = smooth(fx),
        sy = smooth(fy);
      const n00 = hash(ix, iy),
        n10 = hash(ix + 1, iy);
      const n01 = hash(ix, iy + 1),
        n11 = hash(ix + 1, iy + 1);
      return n00 * (1 - sx) * (1 - sy) + n10 * sx * (1 - sy) + n01 * (1 - sx) * sy + n11 * sx * sy;
    };

    const organicNoise = (x: number, y: number) => {
      let value = 0,
        amp = 1,
        freq = 2.0,
        maxAmp = 0;
      for (let i = 0; i < 4; i++) {
        value += noise2D(x * freq, y * freq, clusterSeed + i * 100) * amp;
        maxAmp += amp;
        amp *= 0.5;
        freq *= 2.0;
      }
      return value / maxAmp;
    };

    const getFieldValue = (worldDir: THREE.Vector3) => {
      let totalField = 0;
      for (const patch of patches) {
        const dot = Math.min(1, Math.max(-1, worldDir.dot(patch.position)));
        const angularDist = Math.acos(dot);
        const dist = angularDist * planetRadius;

        const angle = Math.atan2(worldDir.clone().sub(patch.position).dot(tangent2), worldDir.clone().sub(patch.position).dot(tangent1));
        const noiseVal = organicNoise(Math.cos(angle) * 3 + patch.seed * 0.01, Math.sin(angle) * 3);
        const radiusVariation = 1.0 + (noiseVal - 0.5) * 0.4;
        const effectiveRadius = patch.size * radiusVariation;

        const normalizedDist = dist / effectiveRadius;
        if (normalizedDist < 1.5) {
          const t = Math.max(0, 1 - normalizedDist);
          totalField += t * t * (3 - 2 * t); // smoothstep
        }
      }
      return totalField;
    };

    const landThreshold = 0.2;
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    const fieldGrid: number[][] = [];
    const posGrid: THREE.Vector3[][] = [];

    const coverageFactor = 2.8;

    const smoothstep = (edge0: number, edge1: number, x: number): number => {
      const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    };

    for (let i = 0; i <= resolution; i++) {
      fieldGrid[i] = [];
      posGrid[i] = [];
      for (let j = 0; j <= resolution; j++) {
        const u = (i / resolution - 0.5) * coverageFactor;
        const v = (j / resolution - 0.5) * coverageFactor;
        const localX = u * size;
        const localY = v * size;

        const planePos = new THREE.Vector3().addScaledVector(tangent1, localX).addScaledVector(tangent2, localY).add(center.clone().multiplyScalar(planetRadius));

        const worldDir = planePos.clone().normalize();

        const fadeMargin = 0.2;
        const distFromEdgeU = 0.5 - Math.abs(u / coverageFactor);
        const distFromEdgeV = 0.5 - Math.abs(v / coverageFactor);
        const fadeU = smoothstep(0, fadeMargin, distFromEdgeU);
        const fadeV = smoothstep(0, fadeMargin, distFromEdgeV);
        const fadeFactor = fadeU * fadeV;

        posGrid[i][j] = worldDir;
        fieldGrid[i][j] = getFieldValue(worldDir) * fadeFactor;
      }
    }

    const isOnBorder = (i: number, j: number): boolean => {
      if (fieldGrid[i][j] <= landThreshold) return false;
      const neighbors = [
        [i - 1, j],
        [i + 1, j],
        [i, j - 1],
        [i, j + 1],
      ];
      for (const [ni, nj] of neighbors) {
        if (ni < 0 || ni > resolution || nj < 0 || nj > resolution) continue;
        if (fieldGrid[ni][nj] <= landThreshold) return true;
      }
      return false;
    };

    const vertexMap = new Map<string, number>();
    let vertexIndex = 0;
    const uniformRadius = planetRadius * 1.012;

    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const fieldValue = fieldGrid[i][j];

        if (fieldValue > landThreshold) {
          let finalDir = posGrid[i][j].clone();

          if (isOnBorder(i, j)) {
            const neighbors: [number, number, number][] = [
              [i - 1, j, 1.0],
              [i + 1, j, 1.0],
              [i, j - 1, 1.0],
              [i, j + 1, 1.0],
              [i - 1, j - 1, 0.7],
              [i + 1, j - 1, 0.7],
              [i - 1, j + 1, 0.7],
              [i + 1, j + 1, 0.7],
            ];
            let avgDir = new THREE.Vector3();
            let totalWeight = 0;
            let gradientDir = new THREE.Vector3();

            for (const [ni, nj, weight] of neighbors) {
              if (ni < 0 || ni > resolution || nj < 0 || nj > resolution) continue;
              const nField = fieldGrid[ni][nj];
              if (nField <= landThreshold) {
                const t = Math.max(0, Math.min(1, (landThreshold - fieldValue) / (nField - fieldValue)));
                const interpDir = finalDir.clone().lerp(posGrid[ni][nj], t);
                avgDir.addScaledVector(interpDir.clone().sub(finalDir), weight);
                gradientDir.add(posGrid[ni][nj].clone().sub(finalDir));
                totalWeight += weight;
              }
            }

            if (totalWeight > 0) {
              avgDir.divideScalar(totalWeight).multiplyScalar(0.95);
              finalDir.add(avgDir).normalize();

              gradientDir.normalize();
              const tangentDir = new THREE.Vector3().crossVectors(finalDir, gradientDir).normalize();

              const noiseInput = i * 0.1 + j * 0.13 + clusterSeed * 0.001;
              const perturbation = (organicNoise(noiseInput, noiseInput * 1.7) - 0.5) * 2;
              const perturbStrength = 0.012;

              finalDir.addScaledVector(tangentDir, perturbation * perturbStrength).normalize();
            }
          }

          const worldPos = finalDir.multiplyScalar(uniformRadius);

          vertices.push(worldPos.x, worldPos.y, worldPos.z);
          uvs.push(i / resolution, j / resolution);
          vertexMap.set(`${i},${j}`, vertexIndex);
          vertexIndex++;
        }
      }
    }

    const adjacency: Map<number, number[]> = new Map();

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const v00 = vertexMap.get(`${i},${j}`);
        const v10 = vertexMap.get(`${i + 1},${j}`);
        const v01 = vertexMap.get(`${i},${j + 1}`);
        const v11 = vertexMap.get(`${i + 1},${j + 1}`);

        if (v00 !== undefined && v10 !== undefined && v01 !== undefined) {
          indices.push(v00, v10, v01);
          if (!adjacency.has(v00)) adjacency.set(v00, []);
          if (!adjacency.has(v10)) adjacency.set(v10, []);
          if (!adjacency.has(v01)) adjacency.set(v01, []);
          adjacency.get(v00)!.push(v10, v01);
          adjacency.get(v10)!.push(v00, v01);
          adjacency.get(v01)!.push(v00, v10);
        }
        if (v10 !== undefined && v11 !== undefined && v01 !== undefined) {
          indices.push(v10, v11, v01);
          if (!adjacency.has(v10)) adjacency.set(v10, []);
          if (!adjacency.has(v11)) adjacency.set(v11, []);
          if (!adjacency.has(v01)) adjacency.set(v01, []);
          adjacency.get(v10)!.push(v11, v01);
          adjacency.get(v11)!.push(v10, v01);
          adjacency.get(v01)!.push(v10, v11);
        }
      }
    }

    if (vertices.length === 0) return;

    const borderVertices = new Set<number>();
    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const idx = vertexMap.get(`${i},${j}`);
        if (idx !== undefined && isOnBorder(i, j)) {
          borderVertices.add(idx);
        }
      }
    }

    const smoothingPasses = 1;
    const smoothingFactor = 0.4;

    for (let pass = 0; pass < smoothingPasses; pass++) {
      const newPositions: THREE.Vector3[] = [];

      for (let idx = 0; idx < vertices.length / 3; idx++) {
        const pos = new THREE.Vector3(vertices[idx * 3], vertices[idx * 3 + 1], vertices[idx * 3 + 2]);

        if (borderVertices.has(idx)) {
          const neighbors = adjacency.get(idx);
          if (neighbors && neighbors.length > 0) {
            const uniqueNeighbors = [...new Set(neighbors)];
            const centroid = new THREE.Vector3();
            for (const n of uniqueNeighbors) {
              centroid.add(new THREE.Vector3(vertices[n * 3], vertices[n * 3 + 1], vertices[n * 3 + 2]));
            }
            centroid.divideScalar(uniqueNeighbors.length);

            pos.lerp(centroid, smoothingFactor);
            pos.normalize().multiplyScalar(uniformRadius);
          }
        }
        newPositions.push(pos);
      }

      for (let idx = 0; idx < newPositions.length; idx++) {
        vertices[idx * 3] = newPositions[idx].x;
        vertices[idx * 3 + 1] = newPositions[idx].y;
        vertices[idx * 3 + 2] = newPositions[idx].z;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhongMaterial({
      color: params.transparentMode ? new THREE.Color(0xe6f3ff) : avgColor,
      opacity: params.transparentMode ? 0.3 : avgOpacity,
      transparent: params.transparentMode || avgOpacity < 1.0,
      emissive: params.transparentMode ? new THREE.Color(0xcce6ff).multiplyScalar(0.1) : avgColor.clone().multiplyScalar(0.05),
      emissiveIntensity: params.transparentMode ? 0.05 : 0.0000001,
      shininess: params.transparentMode ? 30 : 8,
      flatShading: false,
      depthWrite: true,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    if (!params.transparentMode) {
      const texSize = 32;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = texSize;
      const ctx = canvas.getContext("2d")!;
      const imageData = ctx.createImageData(texSize, texSize);

      for (let i = 0; i < imageData.data.length; i += 4) {
        const v = 200 + Math.floor(Math.random() * 55);
        imageData.data[i] = v;
        imageData.data[i + 1] = v;
        imageData.data[i + 2] = v;
        imageData.data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);

      const noiseTexture = new THREE.CanvasTexture(canvas);
      noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;
      noiseTexture.repeat.set(4, 4);
      material.map = noiseTexture;
    }

    const landMesh = new THREE.Mesh(geometry, material);
    landMesh.castShadow = true;
    landMesh.receiveShadow = true;
    landMesh.renderOrder = 1;

    this.lands.push(landMesh);
    this.landGroup.add(landMesh);
  }

  private generateProceduralLands(planetRadius: number, rng: SeededRandom, params: LandMassesParams): void {
    const numLands = Math.floor(rng.uniform(5, 15));

    for (let i = 0; i < numLands; i++) {
      const theta = rng.uniform(0, Math.PI * 2);
      const phi = Math.acos(rng.uniform(-1, 1));

      const position = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi));

      const size = planetRadius * rng.uniform(0.02, 0.08);

      const geometry = new THREE.CircleGeometry(size, 16);

      const worldPos = position.clone().multiplyScalar(planetRadius * 1.002);
      geometry.lookAt(position);
      geometry.translate(worldPos.x, worldPos.y, worldPos.z);

      const greenAmount = rng.uniform(0.3, 0.7);
      const baseColor = new THREE.Color(0.36 * (1 - greenAmount) + 0.22 * greenAmount, 0.23 * (1 - greenAmount) + 0.36 * greenAmount, 0);

      const isTundra = params.tundraMode || false;
      const proceduralOpacity = isTundra ? 0.25 : 1.0;

      const material = new THREE.MeshPhongMaterial({
        color: params.transparentMode ? new THREE.Color(0xe6f3ff) : baseColor,
        opacity: params.transparentMode ? 0.3 : proceduralOpacity,
        transparent: params.transparentMode || proceduralOpacity < 1.0,
        emissive: params.transparentMode ? new THREE.Color(0xcce6ff).multiplyScalar(0.1) : 0x0a0a00,
        shininess: params.transparentMode ? 30 : 5,

        depthWrite: true,
        depthTest: true,
      });

      const landMesh = new THREE.Mesh(geometry, material);

      landMesh.renderOrder = 1;
      this.lands.push(landMesh);
      this.landGroup.add(landMesh);
    }
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.landGroup.position.copy(planetPosition);
    }
    scene.add(this.landGroup);
  }

  update(deltaTime: number, planetRotation?: number): void {
    if (planetRotation !== undefined) {
      this.landGroup.rotation.y = planetRotation;
    }
  }

  getObject3D(): THREE.Group {
    return this.landGroup;
  }

  dispose(): void {
    this.lands.forEach((land) => {
      land.geometry.dispose();
      if (land.material instanceof THREE.Material) {
        land.material.dispose();
      }
    });
    this.lands = [];
    this.landGroup.clear();
  }
}

export function createLandMassesFromPythonData(planetRadius: number, surfaceData: any, globalSeed?: number): LandMassesEffect | null {
  const greenPatches = surfaceData.green_patches;

  if (!greenPatches || greenPatches.length === 0) {
    return null;
  }

  const seed = globalSeed || Math.floor(Math.random() * 1000000);

  return new LandMassesEffect(planetRadius, {
    greenPatches: greenPatches,
    seed: seed + 6000,
  });
}

export function createTransparentLandMassesForIcyPlanet(planetRadius: number, surfaceData: any, globalSeed?: number): LandMassesEffect | null {
  const seed = globalSeed || Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed + 7000);

  const numPatches = Math.floor(rng.uniform(3, 8));
  const syntheticPatches = [];

  for (let i = 0; i < numPatches; i++) {
    const theta = rng.uniform(0, Math.PI * 2);
    const phi = Math.acos(rng.uniform(-1, 1));

    syntheticPatches.push({
      position_3d: [Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)],
      size: rng.uniform(0.05, 0.15),
      sides: Math.floor(rng.uniform(8, 16)),
      color: [0, 0, 0],
    });
  }

  return new LandMassesEffect(planetRadius, {
    greenPatches: syntheticPatches,
    seed: seed + 7000,
    transparentMode: true,
  });
}
