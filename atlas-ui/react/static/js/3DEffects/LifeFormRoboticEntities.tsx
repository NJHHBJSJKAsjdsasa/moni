// atlas-ui/react/static/js/3DEffects/LifeFormRoboticEntities.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

const PROCEDURAL_RANGES = {
  COMPONENT_COUNT: { min: 32, max: 200 },
  COMPONENT_SIZE: { min: 0.01, max: 0.02 },
  ORBITAL_RADIUS: { min: 1.4, max: 3.5 },
  ASSEMBLY_DURATION: { min: 8, max: 15 },
  FIRING_DURATION: { min: 3, max: 7 },
  DISASSEMBLY_DURATION: { min: 5, max: 10 },
  WAIT_DURATION: { min: 10, max: 20 },
  CYCLE_OFFSET: { min: 0, max: 30 },
};

enum ComponentType {
  SAUCER_BASE = "saucer_base",
  SAUCER_TOP = "saucer_top",
  COMMAND_DOME = "command_dome",
  ENGINE_RING = "engine_ring",
  WEAPON_ARRAY = "weapon_array",
  ANTENNA = "antenna",
}

enum ComponentState {
  FREE_MOVE = "free_move",
  ASSEMBLING = "assembling",
  ASSEMBLED = "assembled",
  FIRING = "firing",
  DISASSEMBLING = "disassembling",
}

const CONSTRUCTION_TEMPLATES = [
  {
    name: "compact_mothership",
    isSpecial: true,
    rarity: 1.0,
    components: [
      { type: ComponentType.SAUCER_BASE, position: [0, 0, 0], rotation: [0, 0, 0] },

      { type: ComponentType.SAUCER_TOP, position: [0, 0.08, 0], rotation: [0, 0, 0] },

      { type: ComponentType.COMMAND_DOME, position: [0, 0.18, 0], rotation: [0, 0, 0] },

      { type: ComponentType.ENGINE_RING, position: [0, -0.05, 0], rotation: [0, 0, 0] },

      { type: ComponentType.WEAPON_ARRAY, position: [0.4, 0.02, 0], rotation: [0, 0, 0] },

      { type: ComponentType.ANTENNA, position: [0, 0.25, 0], rotation: [0, 0, 0] },
    ],
  },
];

export interface LifeFormRoboticEntitiesParams {
  color?: number[] | THREE.Color;
  componentCount?: number;
  componentSize?: number;
  orbitalRadius?: number;
  constructionSpeed?: number;
  seed?: number;
  cosmicOriginTime?: number;
}

interface Component {
  id: number;
  mesh: THREE.Mesh;
  type: ComponentType;
  state: ComponentState;
  targetPosition: THREE.Vector3;
  targetRotation: THREE.Euler;
  originalPosition: THREE.Vector3;
  originalRotation: THREE.Euler;
  velocity: THREE.Vector3;
  constructionSite?: THREE.Object3D;
  assemblyProgress: number;

  orbitalRadius: number;
  orbitalSpeed: number;
  orbitalPhase: number;
  orbitalInclination: number;
  rotationSpeed: THREE.Vector3;
}

interface ConstructionSite {
  group: THREE.Group;
  template: (typeof CONSTRUCTION_TEMPLATES)[0];
  position: THREE.Vector3;
  components: Component[];
  laserBeam?: THREE.Mesh;

  assemblyDuration: number;
  firingDuration: number;
  disassemblyDuration: number;
  waitDuration: number;
  cycleOffset: number;
  totalCycleDuration: number;

  assignedComponentIds: number[];
}

export class LifeFormRoboticEntitiesEffect {
  private group: THREE.Group;
  private components: Component[] = [];
  private constructionSites: ConstructionSite[] = [];
  private params: LifeFormRoboticEntitiesParams;
  private rng: SeededRandom;
  private planetRadius: number;
  private cosmicOffset: number;
  private materials: { [key: string]: THREE.Material } = {};

  constructor(planetRadius: number, params: LifeFormRoboticEntitiesParams = {}) {
    this.planetRadius = planetRadius;

    const seed = params.seed || Math.floor(Math.random() * 1000000);
    this.rng = new SeededRandom(seed);

    this.params = {
      color: params.color || [0.8, 0.85, 0.9],
      componentCount: params.componentCount || Math.floor(this.rng.random() * (PROCEDURAL_RANGES.COMPONENT_COUNT.max - PROCEDURAL_RANGES.COMPONENT_COUNT.min) + PROCEDURAL_RANGES.COMPONENT_COUNT.min),
      componentSize: params.componentSize || this.rng.random() * (PROCEDURAL_RANGES.COMPONENT_SIZE.max - PROCEDURAL_RANGES.COMPONENT_SIZE.min) + PROCEDURAL_RANGES.COMPONENT_SIZE.min,
      orbitalRadius: params.orbitalRadius || this.rng.random() * (PROCEDURAL_RANGES.ORBITAL_RADIUS.max - PROCEDURAL_RANGES.ORBITAL_RADIUS.min) + PROCEDURAL_RANGES.ORBITAL_RADIUS.min,
      constructionSpeed: params.constructionSpeed || 1.0,
      cosmicOriginTime: params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME,
      seed,
    };

    this.cosmicOffset = (seed % 100) * 0.1;

    this.group = new THREE.Group();
    this.createMaterials();
    this.initializeComponents();
    this.createConstructionSites();

    this.preAssignComponentsToSites();

    this.initializeToCurrentState();
  }

  private createMaterials(): void {
    const baseColor = new THREE.Color(this.params.color![0], this.params.color![1], this.params.color![2]);

    this.materials.steel = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0.85, 0.85, 0.9),
      specular: new THREE.Color(1.0, 1.0, 1.0),
      shininess: 200,
      reflectivity: 0.8,
    });

    this.materials.titanium = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0.75, 0.75, 0.8),
      specular: new THREE.Color(0.95, 0.95, 1.0),
      shininess: 180,
      reflectivity: 0.7,
    });

    this.materials.copper = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0.8, 0.8, 0.85),
      specular: new THREE.Color(1.0, 1.0, 1.0),
      shininess: 250,
      emissive: new THREE.Color(0.05, 0.05, 0.08),
    });

    this.materials.glowing = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0.9, 0.9, 0.95),
      specular: new THREE.Color(1.0, 1.0, 1.0),
      shininess: 300,
      emissive: new THREE.Color(0.1, 0.1, 0.15),
      transparent: true,
      opacity: 0.95,
    });
  }

  private initializeComponents(): void {
    const componentCount = this.params.componentCount!;
    const baseRadius = this.planetRadius * this.params.orbitalRadius!;
    const componentSize = this.planetRadius * this.params.componentSize!;

    for (let i = 0; i < componentCount; i++) {
      const componentType = this.getRandomComponentType();
      const mesh = this.createComponentMesh(componentType, componentSize);

      const angle = this.rng.random() * Math.PI * 2;
      const radius = baseRadius + (this.rng.random() - 0.5) * baseRadius * 0.3;
      const height = (this.rng.random() - 0.5) * baseRadius * 0.6;

      const position = new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius);

      mesh.position.copy(position);
      mesh.rotation.set(this.rng.random() * Math.PI * 2, this.rng.random() * Math.PI * 2, this.rng.random() * Math.PI * 2);

      const component: Component = {
        id: i,
        mesh,
        type: componentType,
        state: ComponentState.FREE_MOVE,
        targetPosition: position.clone(),
        targetRotation: new THREE.Euler(0, 0, 0),
        originalPosition: position.clone(),
        originalRotation: new THREE.Euler(this.rng.random() * Math.PI * 2, this.rng.random() * Math.PI * 2, this.rng.random() * Math.PI * 2),
        velocity: new THREE.Vector3((this.rng.random() - 0.5) * 0.01, (this.rng.random() - 0.5) * 0.01, (this.rng.random() - 0.5) * 0.01),
        assemblyProgress: 0,

        orbitalRadius: radius,
        orbitalSpeed: (this.rng.random() * 0.3 + 0.1) * (this.rng.random() > 0.5 ? 1 : -1),
        orbitalPhase: angle,
        orbitalInclination: (this.rng.random() - 0.5) * Math.PI * 0.4,
        rotationSpeed: new THREE.Vector3((this.rng.random() - 0.5) * 0.02, (this.rng.random() - 0.5) * 0.015, (this.rng.random() - 0.5) * 0.02),
      };

      this.components.push(component);
      this.group.add(mesh);
    }
  }

  private getRandomComponentType(): ComponentType {
    const types = Object.values(ComponentType);
    return types[Math.floor(this.rng.random() * types.length)];
  }

  private createComponentMesh(type: ComponentType, size: number): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    switch (type) {
      case ComponentType.SAUCER_BASE:
        geometry = new THREE.CylinderGeometry(size * 8, size * 8.5, size * 1.2, 32);
        material = this.materials.steel;
        break;
      case ComponentType.SAUCER_TOP:
        geometry = new THREE.CylinderGeometry(size * 5, size * 5.5, size * 0.8, 24);
        material = this.materials.titanium;
        break;
      case ComponentType.COMMAND_DOME:
        geometry = new THREE.SphereGeometry(size * 3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        material = this.materials.glowing;
        break;
      case ComponentType.ENGINE_RING:
        geometry = new THREE.TorusGeometry(size * 6, size * 0.8, 8, 16);
        material = this.materials.copper;
        break;
      case ComponentType.WEAPON_ARRAY:
        geometry = new THREE.CapsuleGeometry(size * 0.5, size * 4, 4, 8);
        material = this.materials.titanium;
        break;
      case ComponentType.ANTENNA:
        geometry = new THREE.CylinderGeometry(size * 0.15, size * 0.15, size * 5, 6);
        material = this.materials.glowing;
        break;
      default:
        geometry = new THREE.SphereGeometry(size, 8, 8);
        material = this.materials.steel;
    }

    return new THREE.Mesh(geometry, material);
  }

  private createConstructionSites(): void {
    const template = CONSTRUCTION_TEMPLATES[0];
    const componentsPerShip = template.components.length;
    const availableComponents = this.params.componentCount!;

    const maxShips = Math.floor(availableComponents / componentsPerShip);
    const actualShips = Math.max(1, maxShips);

    const baseRadius = this.planetRadius * this.params.orbitalRadius!;
    const minRadius = baseRadius * 0.7;
    const maxRadius = baseRadius * 1.3;

    for (let i = 0; i < actualShips; i++) {
      const angle = this.rng.random() * Math.PI * 2;
      const radius = minRadius + this.rng.random() * (maxRadius - minRadius);
      const height = (this.rng.random() - 0.5) * baseRadius * 0.8;

      const position = new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius);

      const group = new THREE.Group();
      group.position.copy(position);

      const assemblyDuration = this.rng.random() * (PROCEDURAL_RANGES.ASSEMBLY_DURATION.max - PROCEDURAL_RANGES.ASSEMBLY_DURATION.min) + PROCEDURAL_RANGES.ASSEMBLY_DURATION.min;
      const firingDuration = this.rng.random() * (PROCEDURAL_RANGES.FIRING_DURATION.max - PROCEDURAL_RANGES.FIRING_DURATION.min) + PROCEDURAL_RANGES.FIRING_DURATION.min;
      const disassemblyDuration = this.rng.random() * (PROCEDURAL_RANGES.DISASSEMBLY_DURATION.max - PROCEDURAL_RANGES.DISASSEMBLY_DURATION.min) + PROCEDURAL_RANGES.DISASSEMBLY_DURATION.min;
      const waitDuration = this.rng.random() * (PROCEDURAL_RANGES.WAIT_DURATION.max - PROCEDURAL_RANGES.WAIT_DURATION.min) + PROCEDURAL_RANGES.WAIT_DURATION.min;
      const cycleOffset = this.rng.random() * (PROCEDURAL_RANGES.CYCLE_OFFSET.max - PROCEDURAL_RANGES.CYCLE_OFFSET.min) + PROCEDURAL_RANGES.CYCLE_OFFSET.min;

      const site: ConstructionSite = {
        group,
        template,
        position,
        components: [],
        assemblyDuration,
        firingDuration,
        disassemblyDuration,
        waitDuration,
        cycleOffset,
        totalCycleDuration: assemblyDuration + firingDuration + disassemblyDuration + waitDuration,
        assignedComponentIds: [],
      };

      this.createLaserBeam(site);

      this.constructionSites.push(site);
      this.group.add(group);
    }
  }

  private createLaserBeam(site: ConstructionSite): void {
    const beamLength = site.position.length() * 2;
    const laserScale = 0.05;
    const beamGeometry = new THREE.CylinderGeometry(laserScale, laserScale * 1.5, beamLength, 16);

    const beamMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0.2, 0.8, 1.0),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      emissive: new THREE.Color(0.2, 0.8, 1.0),
      emissiveIntensity: 2.0,
    });

    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.visible = false;
    site.laserBeam = beam;
    this.group.add(beam);
  }

  private preAssignComponentsToSites(): void {
    const allComponentIds = this.components.map((c) => c.id).sort((a, b) => a - b);
    let availableIds = [...allComponentIds];

    for (const site of this.constructionSites) {
      const siteId = `${site.position.x.toFixed(3)}_${site.position.y.toFixed(3)}_${site.position.z.toFixed(3)}`;
      const siteRng = new SeededRandom(this.params.seed + siteId.split("").reduce((a, b) => a + b.charCodeAt(0), 0));

      const componentsNeeded = Math.min(site.template.components.length, availableIds.length);
      const assignedIds: number[] = [];

      for (let i = 0; i < componentsNeeded; i++) {
        const randomIndex = Math.floor(siteRng.random() * availableIds.length);
        assignedIds.push(availableIds.splice(randomIndex, 1)[0]);
      }

      site.assignedComponentIds = assignedIds;
    }
  }

  private initializeToCurrentState(): void {
    const cosmicTime = this.getCurrentCosmicTime();

    this.constructionSites.forEach((site) => {
      const state = this.calculateProceduralState(site, cosmicTime);

      this.snapToState(site, state, cosmicTime);
    });
  }

  private snapToState(site: ConstructionSite, state: ReturnType<typeof this.calculateProceduralState>, cosmicTime: number): void {
    if (state.phase !== "waiting" && site.components.length === 0) {
      this.assignComponentsToSite(site);
    }

    site.components.forEach((component, index) => {
      const templateComponent = site.template.components[index % site.template.components.length];
      const scaleFactor = this.params.componentSize! * this.planetRadius * 4;
      const siteTargetPosition = site.position.clone().add(new THREE.Vector3(templateComponent.position[0] * scaleFactor, templateComponent.position[1] * scaleFactor, templateComponent.position[2] * scaleFactor));

      let finalPosition: THREE.Vector3;
      let finalRotation: THREE.Euler;
      const material = component.mesh.material as THREE.MeshPhongMaterial;

      switch (state.phase) {
        case "waiting":
          finalPosition = this.calculateProceduralOrbitalPosition(component, cosmicTime);
          finalRotation = component.originalRotation.clone();
          material.emissive.setHex(0x000000);
          material.emissiveIntensity = 0;
          break;

        case "assembling":
          const orbitalPos = this.calculateProceduralOrbitalPosition(component, cosmicTime);
          finalPosition = orbitalPos.clone().lerp(siteTargetPosition, state.assemblyProgress);
          const targetRot = new THREE.Euler(templateComponent.rotation[0], templateComponent.rotation[1], templateComponent.rotation[2]);
          finalRotation = new THREE.Euler(component.originalRotation.x + (targetRot.x - component.originalRotation.x) * state.assemblyProgress, component.originalRotation.y + (targetRot.y - component.originalRotation.y) * state.assemblyProgress, component.originalRotation.z + (targetRot.z - component.originalRotation.z) * state.assemblyProgress);
          material.emissive.setHex(0x004080);
          material.emissiveIntensity = 0.3 * state.assemblyProgress;
          break;

        case "firing":
          finalPosition = siteTargetPosition.clone();
          finalRotation = new THREE.Euler(templateComponent.rotation[0], templateComponent.rotation[1], templateComponent.rotation[2]);
          material.emissive.setHex(0x000000);
          material.emissiveIntensity = 0;
          break;

        case "disassembling":
          const orbitalPosDisasm = this.calculateProceduralOrbitalPosition(component, cosmicTime);
          finalPosition = siteTargetPosition.clone().lerp(orbitalPosDisasm, state.disassemblyProgress);
          const siteRot = new THREE.Euler(templateComponent.rotation[0], templateComponent.rotation[1], templateComponent.rotation[2]);
          finalRotation = new THREE.Euler(siteRot.x + (component.originalRotation.x - siteRot.x) * state.disassemblyProgress, siteRot.y + (component.originalRotation.y - siteRot.y) * state.disassemblyProgress, siteRot.z + (component.originalRotation.z - siteRot.z) * state.disassemblyProgress);
          material.emissive.setHex(0x004080);
          material.emissiveIntensity = 0.3 * (1.0 - state.disassemblyProgress);
          break;
      }

      component.mesh.position.copy(finalPosition);
      component.mesh.rotation.copy(finalRotation);
    });

    if (site.laserBeam) {
      const material = site.laserBeam.material as THREE.MeshPhongMaterial;
      const isShipActuallyAssembled = this.verifyShipAssembly(site, state, cosmicTime);

      if (state.shouldShowLaser && isShipActuallyAssembled) {
        site.laserBeam.visible = true;
        material.opacity = state.laserOpacity;
        this.positionLaser(site);

        if (state.laserFadeProgress >= 0.8) {
          const pulseTime = (cosmicTime + site.cycleOffset) * 3;
          const pulse = Math.sin(pulseTime) * 0.3 + 0.7;
          material.emissiveIntensity = pulse * 2.0 * state.laserFadeProgress;
        } else {
          material.emissiveIntensity = state.laserFadeProgress * 2.0;
        }
      } else {
        site.laserBeam.visible = false;
      }
    }
  }

  private getCurrentCosmicTime(): number {
    return getUniverseTime(this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME);
  }

  public update(_deltaTime?: number): void {
    const cosmicTime = this.getCurrentCosmicTime();

    this.constructionSites.forEach((site) => {
      this.updateSiteProcedurally(site, cosmicTime);
    });

    this.updateFreeMovingComponents(cosmicTime);
  }

  private calculateProceduralState(
    site: ConstructionSite,
    cosmicTime: number
  ): {
    phase: "waiting" | "assembling" | "firing" | "disassembling";
    progress: number;
    shouldShowLaser: boolean;
    laserOpacity: number;
    absolutePhaseTime: number;
    cycleTime: number;
    assemblyProgress: number;
    disassemblyProgress: number;
    laserFadeProgress: number;
  } {
    const adjustedTime = cosmicTime + site.cycleOffset;

    const cycleTime = adjustedTime % site.totalCycleDuration;

    const assemblyEnd = site.assemblyDuration;
    const firingEnd = assemblyEnd + site.firingDuration;
    const disassemblyEnd = firingEnd + site.disassemblyDuration;

    if (cycleTime < assemblyEnd) {
      const absolutePhaseTime = cycleTime;
      const progress = absolutePhaseTime / site.assemblyDuration;
      const assemblyProgress = Math.min(1.0, Math.max(0.0, progress));

      return {
        phase: "assembling",
        progress,
        shouldShowLaser: false,
        laserOpacity: 0,
        absolutePhaseTime,
        cycleTime,
        assemblyProgress,
        disassemblyProgress: 0,
        laserFadeProgress: 0,
      };
    } else if (cycleTime < firingEnd) {
      const absolutePhaseTime = cycleTime - assemblyEnd;
      const progress = absolutePhaseTime / site.firingDuration;

      const fadeInTime = 0.6;
      const fadeOutTime = 0.6;
      let laserOpacity = 0;
      let laserFadeProgress = 0;

      if (absolutePhaseTime < fadeInTime) {
        laserFadeProgress = absolutePhaseTime / fadeInTime;
        laserOpacity = laserFadeProgress * 0.9;
      } else if (absolutePhaseTime > site.firingDuration - fadeOutTime) {
        const fadeOutStart = site.firingDuration - fadeOutTime;
        laserFadeProgress = 1.0 - (absolutePhaseTime - fadeOutStart) / fadeOutTime;
        laserOpacity = laserFadeProgress * 0.9;
      } else {
        laserFadeProgress = 1.0;
        laserOpacity = 0.9;
      }

      return {
        phase: "firing",
        progress,
        shouldShowLaser: true,
        laserOpacity,
        absolutePhaseTime,
        cycleTime,
        assemblyProgress: 1.0,
        disassemblyProgress: 0,
        laserFadeProgress,
      };
    } else if (cycleTime < disassemblyEnd) {
      const absolutePhaseTime = cycleTime - firingEnd;
      const progress = absolutePhaseTime / site.disassemblyDuration;
      const disassemblyProgress = Math.min(1.0, Math.max(0.0, progress));

      return {
        phase: "disassembling",
        progress,
        shouldShowLaser: false,
        laserOpacity: 0,
        absolutePhaseTime,
        cycleTime,
        assemblyProgress: 1.0 - disassemblyProgress,
        disassemblyProgress,
        laserFadeProgress: 0,
      };
    } else {
      const absolutePhaseTime = cycleTime - disassemblyEnd;
      const progress = absolutePhaseTime / site.waitDuration;

      return {
        phase: "waiting",
        progress,
        shouldShowLaser: false,
        laserOpacity: 0,
        absolutePhaseTime,
        cycleTime,
        assemblyProgress: 0,
        disassemblyProgress: 1.0,
        laserFadeProgress: 0,
      };
    }
  }

  private verifyShipAssembly(site: ConstructionSite, state: ReturnType<typeof this.calculateProceduralState>, cosmicTime: number): boolean {
    if (state.phase !== "firing" || state.assemblyProgress < 0.95) {
      return false;
    }

    if (site.components.length < site.template.components.length) {
      return false;
    }

    const tolerance = this.planetRadius * this.params.componentSize! * 2;

    for (let i = 0; i < site.components.length; i++) {
      const component = site.components[i];
      const templateComponent = site.template.components[i % site.template.components.length];

      const scaleFactor = this.params.componentSize! * this.planetRadius * 4;
      const expectedAssembledPosition = site.position.clone().add(new THREE.Vector3(templateComponent.position[0] * scaleFactor, templateComponent.position[1] * scaleFactor, templateComponent.position[2] * scaleFactor));

      const orbitalPosition = this.calculateProceduralOrbitalPosition(component, cosmicTime);
      const proceduralPosition = orbitalPosition.clone().lerp(expectedAssembledPosition, state.assemblyProgress);

      const distance = proceduralPosition.distanceTo(expectedAssembledPosition);
      if (distance > tolerance) {
        return false;
      }
    }

    return true;
  }

  private updateSiteProcedurally(site: ConstructionSite, cosmicTime: number): void {
    const state = this.calculateProceduralState(site, cosmicTime);

    this.updateComponentsForPhase(site, state, cosmicTime);

    const isShipActuallyAssembled = this.verifyShipAssembly(site, state, cosmicTime);

    if (site.laserBeam) {
      const material = site.laserBeam.material as THREE.MeshPhongMaterial;

      if (state.shouldShowLaser && isShipActuallyAssembled) {
        site.laserBeam.visible = true;
        material.opacity = state.laserOpacity;

        this.positionLaser(site);

        if (state.laserFadeProgress >= 0.8) {
          const pulseTime = (cosmicTime + site.cycleOffset) * 3;
          const pulse = Math.sin(pulseTime) * 0.3 + 0.7;
          material.emissiveIntensity = pulse * 2.0 * state.laserFadeProgress;
        } else {
          material.emissiveIntensity = state.laserFadeProgress * 2.0;
        }
      } else {
        site.laserBeam.visible = false;
      }
    }
  }

  private positionLaser(site: ConstructionSite): void {
    if (!site.laserBeam) return;

    const planetCenter = new THREE.Vector3(0, 0, 0);
    const direction = planetCenter.clone().sub(site.position);
    const distance = direction.length();

    const midpoint = site.position.clone().add(direction.multiplyScalar(0.5));
    site.laserBeam.position.copy(midpoint);

    site.laserBeam.lookAt(planetCenter);
    site.laserBeam.rotateX(Math.PI / 2);

    const beamLength = site.position.length() * 2;
    site.laserBeam.scale.y = distance / beamLength;
  }

  private updateComponentsForPhase(site: ConstructionSite, state: ReturnType<typeof this.calculateProceduralState>, cosmicTime: number): void {
    switch (state.phase) {
      case "waiting":
        break;

      case "assembling":
        if (site.components.length === 0) {
          this.assignComponentsToSite(site);
        }

        site.components.forEach((component) => {
          this.updateAssemblingComponentProcedural(component, state.assemblyProgress, site, state, cosmicTime);
        });
        break;

      case "firing":
        site.components.forEach((component) => {
          this.updateAssemblingComponentProcedural(component, state.assemblyProgress, site, state, cosmicTime);
        });
        break;

      case "disassembling":
        site.components.forEach((component) => {
          this.updateDisassemblingComponentProcedural(component, state.disassemblyProgress, site, state, cosmicTime);
        });
        break;
    }
  }

  private updateFreeMovingComponents(cosmicTime: number): void {
    this.components.forEach((component) => {
      const participatingInActiveSite = this.constructionSites.some((site) => {
        if (site.components.includes(component)) {
          const state = this.calculateProceduralState(site, cosmicTime);
          return state.phase !== "waiting";
        }
        return false;
      });

      if (!participatingInActiveSite) {
        this.updateFreeMovingComponent(component, cosmicTime);
      }
    });
  }

  private resetComponentToFreeMove(component: Component): void {
    component.state = ComponentState.FREE_MOVE;
    component.constructionSite = undefined;
    component.assemblyProgress = 0;

    const material = component.mesh.material as THREE.MeshPhongMaterial;
    material.emissive.setHex(0x000000);
    material.emissiveIntensity = 0;
  }

  private assignComponentsToSite(site: ConstructionSite): void {
    const assignedIds = site.assignedComponentIds;

    if (assignedIds.length === 0) return;

    const selectedComponents = assignedIds.map((id) => this.components.find((c) => c.id === id)).filter((c) => c !== undefined) as Component[];

    site.components = [];

    for (let i = 0; i < selectedComponents.length; i++) {
      const component = selectedComponents[i];
      const templateComponent = site.template.components[i % site.template.components.length];

      const scaleFactor = this.params.componentSize! * this.planetRadius * 4;
      component.targetPosition = site.position.clone().add(new THREE.Vector3(templateComponent.position[0] * scaleFactor, templateComponent.position[1] * scaleFactor, templateComponent.position[2] * scaleFactor));

      component.targetRotation = new THREE.Euler(templateComponent.rotation[0], templateComponent.rotation[1], templateComponent.rotation[2]);

      site.components.push(component);
    }
  }

  private updateAssemblingComponentProcedural(component: Component, assemblyProgress: number, site: ConstructionSite, state: ReturnType<typeof this.calculateProceduralState>, cosmicTime: number): void {
    const siteIndex = site.components.indexOf(component);
    if (siteIndex === -1) return;

    const templateComponent = site.template.components[siteIndex % site.template.components.length];
    const scaleFactor = this.params.componentSize! * this.planetRadius * 4;
    const siteTargetPosition = site.position.clone().add(new THREE.Vector3(templateComponent.position[0] * scaleFactor, templateComponent.position[1] * scaleFactor, templateComponent.position[2] * scaleFactor));

    const orbitalPosition = this.calculateProceduralOrbitalPosition(component, cosmicTime);
    const currentPosition = orbitalPosition.clone().lerp(siteTargetPosition, assemblyProgress);

    component.mesh.position.copy(currentPosition);

    const targetRotation = new THREE.Euler(templateComponent.rotation[0], templateComponent.rotation[1], templateComponent.rotation[2]);
    component.mesh.rotation.x = component.originalRotation.x + (targetRotation.x - component.originalRotation.x) * assemblyProgress;
    component.mesh.rotation.y = component.originalRotation.y + (targetRotation.y - component.originalRotation.y) * assemblyProgress;
    component.mesh.rotation.z = component.originalRotation.z + (targetRotation.z - component.originalRotation.z) * assemblyProgress;

    const material = component.mesh.material as THREE.MeshPhongMaterial;
    if (state.phase === "assembling") {
      material.emissive.setHex(0x004080);
      material.emissiveIntensity = 0.3 * assemblyProgress;
    } else if (state.phase === "firing") {
      material.emissive.setHex(0x000000);
      material.emissiveIntensity = 0;
    } else {
      material.emissive.setHex(0x000000);
      material.emissiveIntensity = 0;
    }
  }

  private updateDisassemblingComponentProcedural(component: Component, disassemblyProgress: number, site: ConstructionSite, state: ReturnType<typeof this.calculateProceduralState>, cosmicTime: number): void {
    const siteIndex = site.components.indexOf(component);
    if (siteIndex === -1) return;

    const templateComponent = site.template.components[siteIndex % site.template.components.length];
    const scaleFactor = this.params.componentSize! * this.planetRadius * 4;
    const sitePosition = site.position.clone().add(new THREE.Vector3(templateComponent.position[0] * scaleFactor, templateComponent.position[1] * scaleFactor, templateComponent.position[2] * scaleFactor));

    const orbitalPosition = this.calculateProceduralOrbitalPosition(component, cosmicTime);

    const currentPosition = sitePosition.clone().lerp(orbitalPosition, disassemblyProgress);
    component.mesh.position.copy(currentPosition);

    const siteRotation = new THREE.Euler(templateComponent.rotation[0], templateComponent.rotation[1], templateComponent.rotation[2]);
    component.mesh.rotation.x = siteRotation.x + (component.originalRotation.x - siteRotation.x) * disassemblyProgress;
    component.mesh.rotation.y = siteRotation.y + (component.originalRotation.y - siteRotation.y) * disassemblyProgress;
    component.mesh.rotation.z = siteRotation.z + (component.originalRotation.z - siteRotation.z) * disassemblyProgress;

    const material = component.mesh.material as THREE.MeshPhongMaterial;
    if (state.phase === "disassembling") {
      material.emissive.setHex(0x004080);
      material.emissiveIntensity = 0.3 * (1.0 - disassemblyProgress);
    } else {
      material.emissive.setHex(0x000000);
      material.emissiveIntensity = 0;
    }
  }

  private calculateProceduralOrbitalPosition(component: Component, cosmicTime: number): THREE.Vector3 {
    const adjustedCosmicTime = cosmicTime;

    const currentAngle = component.orbitalPhase + component.orbitalSpeed * adjustedCosmicTime;

    const x = Math.cos(currentAngle) * component.orbitalRadius;
    const z = Math.sin(currentAngle) * component.orbitalRadius;
    const y = Math.sin(currentAngle + component.orbitalInclination) * component.orbitalRadius * 0.3;

    return new THREE.Vector3(x, y, z);
  }

  private updateFreeMovingComponent(component: Component, cosmicTime: number): void {
    const orbitalPosition = this.calculateProceduralOrbitalPosition(component, cosmicTime);
    component.mesh.position.copy(orbitalPosition);

    const baseRotation = component.originalRotation;
    component.mesh.rotation.set(baseRotation.x + component.rotationSpeed.x * cosmicTime, baseRotation.y + component.rotationSpeed.y * cosmicTime, baseRotation.z + component.rotationSpeed.z * cosmicTime);
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
    this.components.forEach((component) => {
      component.mesh.geometry.dispose();
      if (component.mesh.material instanceof THREE.Material) {
        component.mesh.material.dispose();
      }
    });

    Object.values(this.materials).forEach((material) => {
      if (material instanceof THREE.Material) {
        material.dispose();
      }
    });

    this.group.clear();
  }

  public setEnabled(enabled: boolean): void {
    this.group.visible = enabled;
  }

  public updateParams(newParams: Partial<LifeFormRoboticEntitiesParams>): void {
    Object.assign(this.params, newParams);

    if (newParams.color) {
      const baseColor = new THREE.Color(newParams.color[0], newParams.color[1], newParams.color[2]);

      if (this.materials.steel instanceof THREE.MeshPhongMaterial) {
        this.materials.steel.color = baseColor.clone().multiplyScalar(0.8);
      }

      if (this.materials.titanium instanceof THREE.MeshPhongMaterial) {
        this.materials.titanium.color = baseColor.clone().multiplyScalar(1.1).lerp(new THREE.Color(0.7, 0.8, 0.9), 0.3);
      }
    }
  }
}

export function createLifeFormRoboticEntitiesFromPythonData(planetRadius: number, pythonData: any, globalSeed?: number): LifeFormRoboticEntitiesEffect {
  const seed = globalSeed || Math.floor(Math.random() * 1000000);

  const params: LifeFormRoboticEntitiesParams = {
    seed: seed + 90002,
    color: pythonData.color || [0.7, 0.8, 0.9],
    cosmicOriginTime: pythonData?.timing?.cosmic_origin_time || pythonData?.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME,
  };

  return new LifeFormRoboticEntitiesEffect(planetRadius, params);
}
