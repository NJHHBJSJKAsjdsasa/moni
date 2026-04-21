// atlas-ui/react/static/js/3DEffects/LifeFormSiliconBasedLife.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

const PROCEDURAL_RANGES = {
  CRYSTAL_COUNT: { min: 10, max: 40 },
  CRYSTAL_DISTANCE: { min: 1.2, max: 2.5 },
  ORBITAL_SPEED: { min: 1.1, max: 4.6 },
  DEBRIS_COUNT: { min: 15, max: 35 },
  CONNECTION_PROBABILITY: 0.4,
};

export interface LifeFormSiliconBasedLifeParams {
  color?: number[] | THREE.Color;
  crystalCount?: number;
  crystalDistance?: number;
  orbitalSpeed?: number;
  debrisCount?: number;
  seed?: number;
  cosmicOriginTime?: number;
}

export class LifeFormSiliconBasedLifeEffect {
  private group: THREE.Group;
  private crystals: THREE.Mesh[] = [];
  private debris: THREE.Mesh[] = [];
  private connections: THREE.Mesh[] = [];
  private params: LifeFormSiliconBasedLifeParams;
  private rng: SeededRandom;
  private planetRadius: number;
  private cosmicOffset: number;

  constructor(planetRadius: number, params: LifeFormSiliconBasedLifeParams = {}) {
    this.planetRadius = planetRadius;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    this.rng = new SeededRandom(seed);

    this.params = {
      color: params.color || [0.3, 0.8, 1.0],
      crystalCount: params.crystalCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.CRYSTAL_COUNT.max - PROCEDURAL_RANGES.CRYSTAL_COUNT.min) + PROCEDURAL_RANGES.CRYSTAL_COUNT.min),
      crystalDistance: params.crystalDistance || this.rng.random() * (PROCEDURAL_RANGES.CRYSTAL_DISTANCE.max - PROCEDURAL_RANGES.CRYSTAL_DISTANCE.min) + PROCEDURAL_RANGES.CRYSTAL_DISTANCE.min,
      orbitalSpeed: params.orbitalSpeed || this.rng.random() * (PROCEDURAL_RANGES.ORBITAL_SPEED.max - PROCEDURAL_RANGES.ORBITAL_SPEED.min) + PROCEDURAL_RANGES.ORBITAL_SPEED.min,
      debrisCount: params.debrisCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.DEBRIS_COUNT.max - PROCEDURAL_RANGES.DEBRIS_COUNT.min) + PROCEDURAL_RANGES.DEBRIS_COUNT.min),
      cosmicOriginTime: params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME,
      seed,
    };

    this.cosmicOffset = (seed % 100) * 0.1;

    this.group = new THREE.Group();
    this.createCrystalFormations();
    this.createDebrisField();
    this.createConnections();
  }

  private createCrystalFormations(): void {
    const crystalCount = this.params.crystalCount!;
    const baseDistance = this.planetRadius + this.params.crystalDistance!;

    for (let i = 0; i < crystalCount; i++) {
      const distance = baseDistance + this.rng.random() * 1.0 - 0.5;

      const inclination = this.rng.random() * Math.PI;
      const longitudeOfAscendingNode = this.rng.random() * Math.PI * 2;
      const initialAngle = this.rng.random() * Math.PI * 2;

      const position = this.calculateOrbitalPosition(distance, inclination, longitudeOfAscendingNode, initialAngle);

      const geometry = this.createCrystalGeometry();

      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.params.color![0], this.params.color![1], this.params.color![2]),
        transparent: true,
        opacity: 0.8,
        wireframe: false,
      });

      const crystal = new THREE.Mesh(geometry, material);
      crystal.position.set(position.x, position.y, position.z);

      crystal.rotation.set(this.rng.random() * Math.PI * 2, this.rng.random() * Math.PI * 2, this.rng.random() * Math.PI * 2);

      crystal.userData = {
        distance: distance,
        inclination: inclination,
        longitudeOfAscendingNode: longitudeOfAscendingNode,
        initialAngle: initialAngle,
        orbitalSpeed: this.rng.random() * 0.3 + 0.2,
        rotationSpeed: (this.rng.random() - 0.5) * 0.02,
        originalScale: 1.0,
      };

      this.crystals.push(crystal);
      this.group.add(crystal);
    }
  }

  private createCrystalGeometry(): THREE.BufferGeometry {
    const shapeType = Math.floor(this.rng.random() * 4);
    const scale = this.planetRadius * (0.04 + this.rng.random() * 0.03);

    switch (shapeType) {
      case 0:
        const diamondGeometry = new THREE.ConeGeometry(scale * 0.6, scale * 2, 6);
        return diamondGeometry;

      case 1:
        const dodecaGeometry = new THREE.DodecahedronGeometry(scale, 0);
        return dodecaGeometry;

      case 2:
        const tetraGeometry = new THREE.TetrahedronGeometry(scale * 1.2, 0);
        return tetraGeometry;

      case 3:
        const icosaGeometry = new THREE.IcosahedronGeometry(scale, 1);
        return icosaGeometry;

      default:
        return new THREE.OctahedronGeometry(scale, 1);
    }
  }

  private createDebrisField(): void {
    const debrisCount = this.params.debrisCount!;
    const debrisDistance = this.planetRadius + this.params.crystalDistance! + 0.5;

    for (let i = 0; i < debrisCount; i++) {
      const distance = debrisDistance + this.rng.random() * 2.0 - 1.0;

      const inclination = this.rng.random() * Math.PI;
      const longitudeOfAscendingNode = this.rng.random() * Math.PI * 2;
      const initialAngle = this.rng.random() * Math.PI * 2;

      const position = this.calculateOrbitalPosition(distance, inclination, longitudeOfAscendingNode, initialAngle);

      const geometry = new THREE.TetrahedronGeometry(this.planetRadius * 0.006, 0);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.params.color![0] * 0.7, this.params.color![1] * 0.7, this.params.color![2] * 0.9),
        transparent: true,
        opacity: 0.6,
      });

      const debrisPiece = new THREE.Mesh(geometry, material);
      debrisPiece.position.set(position.x, position.y, position.z);

      debrisPiece.userData = {
        distance: distance,
        inclination: inclination,
        longitudeOfAscendingNode: longitudeOfAscendingNode,
        initialAngle: initialAngle,
        orbitalSpeed: this.rng.random() * 0.8 + 0.4,
        rotationSpeed: (this.rng.random() - 0.5) * 0.05,
      };

      this.debris.push(debrisPiece);
      this.group.add(debrisPiece);
    }
  }

  private createConnections(): void {
    for (let i = 0; i < this.crystals.length; i++) {
      for (let j = i + 1; j < this.crystals.length; j++) {
        if (this.rng.random() < PROCEDURAL_RANGES.CONNECTION_PROBABILITY) {
          const crystal1 = this.crystals[i];
          const crystal2 = this.crystals[j];

          const points = [crystal1.position.clone(), crystal2.position.clone()];
          const curve = new THREE.CatmullRomCurve3(points);

          const tubeRadius = this.planetRadius * 0.01;
          const radialSegments = 4;
          const tubularSegments = 8;

          const geometry = new THREE.TubeGeometry(curve, tubularSegments, tubeRadius, radialSegments, false);

          const material = new THREE.ShaderMaterial({
            uniforms: {
              time: { value: 0 },
              color: { value: new THREE.Color(this.params.color![0], this.params.color![1], this.params.color![2]) },
              opacity: { value: 0.4 },
            },
            vertexShader: `
              uniform float time;
              varying vec2 vUv;
              varying float vIntensity;
              
              void main() {
                vUv = uv;
                vIntensity = sin(time * 3.0 + position.x * 10.0) * 0.5 + 0.5;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform vec3 color;
              uniform float opacity;
              varying vec2 vUv;
              varying float vIntensity;
              
              void main() {
                float centerDistance = abs(vUv.y - 0.5) * 2.0;
                float tubeFalloff = 1.0 - smoothstep(0.0, 1.0, centerDistance);
                
                float finalOpacity = opacity * vIntensity * tubeFalloff;
                gl_FragColor = vec4(color, finalOpacity);
              }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });

          const connection = new THREE.Mesh(geometry, material);
          connection.renderOrder = 997;
          connection.userData = {
            crystal1Index: i,
            crystal2Index: j,
            tubeRadius: tubeRadius,
            tubularSegments: tubularSegments,
            radialSegments: radialSegments,
          };

          this.connections.push(connection);
          this.group.add(connection);
        }
      }
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
    const animTime = (timeSinceCosmicOrigin + this.cosmicOffset) * (this.params.orbitalSpeed || 1.0);

    this.crystals.forEach((crystal) => {
      const userData = crystal.userData;
      const currentAngle = userData.initialAngle + animTime * userData.orbitalSpeed * 0.1;

      const position = this.calculateOrbitalPosition(userData.distance, userData.inclination, userData.longitudeOfAscendingNode, currentAngle);

      crystal.position.set(position.x, position.y, position.z);

      crystal.rotation.x += userData.rotationSpeed;
      crystal.rotation.y += userData.rotationSpeed * 0.7;
      crystal.rotation.z += userData.rotationSpeed * 1.3;

      const pulse = Math.sin(animTime * 2 + userData.initialAngle) * 0.1 + 1;
      crystal.scale.setScalar(userData.originalScale * pulse);
    });

    this.debris.forEach((debrisPiece) => {
      const userData = debrisPiece.userData;
      const currentAngle = userData.initialAngle + animTime * userData.orbitalSpeed * 0.15;

      const position = this.calculateOrbitalPosition(userData.distance, userData.inclination, userData.longitudeOfAscendingNode, currentAngle);

      debrisPiece.position.set(position.x, position.y, position.z);
      debrisPiece.rotation.x += userData.rotationSpeed;
      debrisPiece.rotation.y += userData.rotationSpeed * 0.8;
    });

    this.connections.forEach((connection) => {
      const userData = connection.userData;
      const crystal1 = this.crystals[userData.crystal1Index];
      const crystal2 = this.crystals[userData.crystal2Index];

      const points = [crystal1.position, crystal2.position];
      const newCurve = new THREE.CatmullRomCurve3(points);

      // Recrear la geometría del tubo con las nuevas posiciones
      connection.geometry.dispose();
      connection.geometry = new THREE.TubeGeometry(newCurve, userData.tubularSegments, userData.tubeRadius, userData.radialSegments, false);

      const material = connection.material as THREE.ShaderMaterial;
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
    this.crystals.forEach((crystal) => {
      crystal.geometry.dispose();
      (crystal.material as THREE.Material).dispose();
    });

    this.debris.forEach((debris) => {
      debris.geometry.dispose();
      (debris.material as THREE.Material).dispose();
    });

    this.connections.forEach((connection) => {
      connection.geometry.dispose();
      (connection.material as THREE.Material).dispose();
    });

    this.group.clear();
  }

  public setEnabled(enabled: boolean): void {
    this.group.visible = enabled;
  }

  public updateParams(newParams: Partial<LifeFormSiliconBasedLifeParams>): void {
    Object.assign(this.params, newParams);

    if (newParams.color) {
      const color = new THREE.Color(newParams.color[0], newParams.color[1], newParams.color[2]);

      this.crystals.forEach((crystal) => {
        (crystal.material as THREE.MeshBasicMaterial).color = color;
      });

      this.connections.forEach((connection) => {
        const material = connection.material as THREE.ShaderMaterial;
        material.uniforms.color.value = color;
      });
    }
  }
}

export function createLifeFormSiliconBasedLifeFromPythonData(planetRadius: number, pythonData: any, globalSeed?: number): LifeFormSiliconBasedLifeEffect {
  const seed = globalSeed || Math.floor(Math.random() * 1000000);

  const params: LifeFormSiliconBasedLifeParams = {
    seed: seed + 80002,
    color: pythonData.color || [0.3, 0.8, 1.0],
    cosmicOriginTime: pythonData?.timing?.cosmic_origin_time || pythonData?.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME,
  };

  return new LifeFormSiliconBasedLifeEffect(planetRadius, params);
}
