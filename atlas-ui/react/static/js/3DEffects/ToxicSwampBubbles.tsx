// atlas-ui/react/static/js/3DEffects/ToxicSwampBubbles.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime";

export interface ToxicSwampBubblesParams {
  bubbleCount?: number;
  bubbleSize?: number;
  riseSpeed?: number;
  expansionRate?: number;
  popDistance?: number;
  bubbleColor?: THREE.Color;
  opacity?: number;
  emissionRate?: number;
  seed?: number;
  planetType?: "SWAMP" | "DEFAULT";
  cosmicOriginTime?: number;
  timeSpeed?: number;
}

const PROCEDURAL_RANGES = {
  DEFAULT: {
    BUBBLE_COUNT: { min: 8, max: 15 },
    BUBBLE_SIZE: { min: 0.004, max: 0.008 },
    RISE_SPEED: { min: 0.008, max: 0.015 },
    EXPANSION_RATE: { min: 0.006, max: 0.012 },
    POP_DISTANCE: { min: 0.15, max: 0.25 },
    OPACITY: { min: 0.15, max: 0.35 },
    EMISSION_RATE: { min: 0.8, max: 1.5 },
  },
  SWAMP: {
    BUBBLE_COUNT: { min: 450, max: 900 },
    BUBBLE_SIZE: { min: 0.02, max: 0.06 },
    RISE_SPEED: { min: 0.003, max: 0.008 },
    EXPANSION_RATE: { min: 0.002, max: 0.004 },
    POP_DISTANCE: { min: 0.2, max: 0.35 },
    OPACITY: { min: 0.2, max: 0.9 },
    EMISSION_RATE: { min: 8.0, max: 12.0 },
  },
};

interface BubbleCycleData {
  bubbleIndex: number;
  birthOffset: number;
  cycleDuration: number;
  fadeInDuration: number;
  emergeDuration: number;
  riseDuration: number;
  popDuration: number;
  maxSize: number;
  riseSpeed: number;
  wobbleSpeed: number;
  wobbleAmplitude: number;
  emergenceSpeed: number;
  startPosition: THREE.Vector3;
  riseDirection: THREE.Vector3;
}

interface Bubble {
  cycleData: BubbleCycleData;
  mesh: THREE.Mesh;
  currentPhase: "hidden" | "fadeIn" | "emerging" | "rising" | "popping" | "fadeOut";
}

export class ToxicSwampBubblesEffect {
  private bubbles: Bubble[] = [];
  private bubbleGroup: THREE.Group;
  private material: THREE.MeshBasicMaterial;
  private geometry: THREE.SphereGeometry;
  private rng: SeededRandom;
  private params: Required<ToxicSwampBubblesParams>;
  private planetRadius: number;
  private planetCenter: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private bubbleCycleData: BubbleCycleData[] = [];

  constructor(planetRadius: number, params: ToxicSwampBubblesParams = {}) {
    this.planetRadius = planetRadius;
    this.rng = new SeededRandom(params.seed || Math.random() * 1000000);

    const planetType = params.planetType || "SWAMP";
    const ranges = PROCEDURAL_RANGES[planetType];

    const actualBubbleCount = params.bubbleCount || this.rng.randint(ranges.BUBBLE_COUNT.min, ranges.BUBBLE_COUNT.max);
    const actualBubbleSize = params.bubbleSize || planetRadius * this.rng.uniform(ranges.BUBBLE_SIZE.min, ranges.BUBBLE_SIZE.max);

    this.params = {
      bubbleCount: actualBubbleCount,
      bubbleSize: actualBubbleSize,
      riseSpeed: params.riseSpeed || this.rng.uniform(ranges.RISE_SPEED.min, ranges.RISE_SPEED.max),
      expansionRate: params.expansionRate || this.rng.uniform(ranges.EXPANSION_RATE.min, ranges.EXPANSION_RATE.max),
      popDistance: params.popDistance || planetRadius * this.rng.uniform(ranges.POP_DISTANCE.min, ranges.POP_DISTANCE.max),
      bubbleColor: params.bubbleColor || new THREE.Color(0x4d7c0f),
      opacity: params.opacity || this.rng.uniform(ranges.OPACITY.min, ranges.OPACITY.max),
      emissionRate: params.emissionRate || this.rng.uniform(ranges.EMISSION_RATE.min, ranges.EMISSION_RATE.max),
      seed: params.seed || Math.random() * 1000000,
      planetType,
      cosmicOriginTime: params.cosmicOriginTime || 514080000,
      timeSpeed: params.timeSpeed || this.rng.uniform(0.5, 2.0),
    };

    this.bubbleGroup = new THREE.Group();
    this.setupMaterials();
    this.setupGeometry();
    this.generateBubbleCycleData();
    this.createBubbleMeshes();
  }

  private setupMaterials(): void {
    this.material = new THREE.MeshBasicMaterial({
      color: this.params.bubbleColor,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
    });
  }

  private setupGeometry(): void {
    this.geometry = new THREE.SphereGeometry(0.3, 12, 8);
  }

  private generateBubbleCycleData(): void {
    for (let i = 0; i < this.params.bubbleCount; i++) {
      const rng = new SeededRandom(this.params.seed + i);

      const birthOffset = (i * 2.3) % 60;

      const fadeInDuration = rng.uniform(2, 4);
      const emergeDuration = rng.uniform(3, 5);
      const riseDuration = rng.uniform(15, 25);
      const popDuration = 0.5;
      const fadeOutDuration = 1;

      const cycleDuration = fadeInDuration + emergeDuration + riseDuration + popDuration + fadeOutDuration + rng.uniform(5, 15);

      const startPosition = this.getProceduralSurfacePoint(i);
      const riseDirection = startPosition.clone().sub(this.planetCenter).normalize();

      const cycleData: BubbleCycleData = {
        bubbleIndex: i,
        birthOffset,
        cycleDuration,
        fadeInDuration,
        emergeDuration,
        riseDuration,
        popDuration,
        maxSize: this.params.bubbleSize * rng.uniform(0.8, 1.5),
        riseSpeed: this.params.riseSpeed * rng.uniform(0.7, 1.3),
        wobbleSpeed: rng.uniform(0.5, 1.5),
        wobbleAmplitude: rng.uniform(0.002, 0.008),
        emergenceSpeed: rng.uniform(0.3, 0.6),
        startPosition: startPosition.clone(),
        riseDirection: riseDirection,
      };

      this.bubbleCycleData.push(cycleData);
    }
  }

  private getProceduralSurfacePoint(bubbleIndex: number): THREE.Vector3 {
    const rng = new SeededRandom(this.params.seed);

    for (let i = 0; i < bubbleIndex; i++) {
      rng.uniform(0, 1);
      rng.uniform(0, 1);
      rng.uniform(0, 1);
    }

    const u1 = rng.uniform(0, 1);
    const u2 = rng.uniform(0, 1);

    const theta = 2 * Math.PI * u1;
    const cosTheta = 2 * u2 - 1;
    const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);

    const x = sinTheta * Math.cos(theta);
    const y = cosTheta;
    const z = sinTheta * Math.sin(theta);

    const surfacePoint = new THREE.Vector3(x, y, z);

    const depthVariation = 0.95 + 0.05 * rng.uniform(0, 1);
    const startDepth = this.planetRadius * depthVariation;

    return surfacePoint.multiplyScalar(startDepth).add(this.planetCenter);
  }

  private createBubbleMeshes(): void {
    for (let i = 0; i < this.bubbleCycleData.length; i++) {
      const cycleData = this.bubbleCycleData[i];

      const bubbleMaterial = this.material.clone();
      bubbleMaterial.opacity = 0;
      const bubbleMesh = new THREE.Mesh(this.geometry, bubbleMaterial);
      bubbleMesh.position.copy(cycleData.startPosition);
      bubbleMesh.scale.setScalar(0);
      bubbleMesh.visible = false;

      const bubble: Bubble = {
        cycleData,
        mesh: bubbleMesh,
        currentPhase: "hidden",
      };

      this.bubbles.push(bubble);
      this.bubbleGroup.add(bubbleMesh);
    }
  }

  private getCurrentCosmicTime(): number {
    const timeSinceCosmicOrigin = getUniverseTime(this.params.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME);
    return timeSinceCosmicOrigin * this.params.timeSpeed;
  }

  private calculateBubbleState(bubble: Bubble, cosmicTime: number): void {
    const cycleData = bubble.cycleData;

    const adjustedTime = cosmicTime + cycleData.birthOffset;
    const cycleTime = adjustedTime % cycleData.cycleDuration;

    let currentTime = 0;
    const fadeInEnd = currentTime + cycleData.fadeInDuration;
    const emergeEnd = fadeInEnd + cycleData.emergeDuration;
    const riseEnd = emergeEnd + cycleData.riseDuration;
    const popEnd = riseEnd + cycleData.popDuration;
    const fadeOutEnd = popEnd + 1;

    let phase: Bubble["currentPhase"] = "hidden";
    let opacity = 0;
    let size = 0;
    let position = cycleData.startPosition.clone();

    if (cycleTime < fadeInEnd) {
      phase = "fadeIn";
      const progress = cycleTime / cycleData.fadeInDuration;
      opacity = this.params.opacity * progress;
      size = cycleData.maxSize * 0.1 * progress;
    } else if (cycleTime < emergeEnd) {
      phase = "emerging";
      const progress = (cycleTime - fadeInEnd) / cycleData.emergeDuration;
      opacity = this.params.opacity;
      size = THREE.MathUtils.lerp(cycleData.maxSize * 0.1, cycleData.maxSize * 0.7, THREE.MathUtils.smoothstep(progress, 0, 1));

      const emergeFactor = THREE.MathUtils.smoothstep(progress, 0, 1);
      const surfacePosition = cycleData.riseDirection.clone().multiplyScalar(this.planetRadius).add(this.planetCenter);
      position = cycleData.startPosition.clone().lerp(surfacePosition, emergeFactor);
    } else if (cycleTime < riseEnd) {
      phase = "rising";
      const progress = (cycleTime - emergeEnd) / cycleData.riseDuration;
      opacity = this.params.opacity;
      size = THREE.MathUtils.lerp(cycleData.maxSize * 0.7, cycleData.maxSize, progress);

      const riseDistance = cycleData.riseSpeed * (cycleTime - emergeEnd);
      const surfacePosition = cycleData.riseDirection.clone().multiplyScalar(this.planetRadius).add(this.planetCenter);

      const wobbleTime = (cycleTime - emergeEnd) * cycleData.wobbleSpeed;
      const wobbleX = Math.sin(wobbleTime + cycleData.bubbleIndex * 0.31) * cycleData.wobbleAmplitude;
      const wobbleY = Math.cos(wobbleTime * 1.3 + cycleData.bubbleIndex * 0.47) * cycleData.wobbleAmplitude;
      const wobbleZ = Math.sin(wobbleTime * 0.7 + cycleData.bubbleIndex * 0.13) * cycleData.wobbleAmplitude;
      const wobble = new THREE.Vector3(wobbleX, wobbleY, wobbleZ);

      position = surfacePosition.clone().add(cycleData.riseDirection.clone().multiplyScalar(riseDistance)).add(wobble);
    } else if (cycleTime < popEnd) {
      phase = "popping";
      const progress = (cycleTime - riseEnd) / cycleData.popDuration;
      opacity = this.params.opacity * (1 - progress) * 0.5;
      size = cycleData.maxSize * (1 + progress * 1.5);

      const riseDistance = cycleData.riseSpeed * cycleData.riseDuration;
      const surfacePosition = cycleData.riseDirection.clone().multiplyScalar(this.planetRadius).add(this.planetCenter);
      position = surfacePosition.clone().add(cycleData.riseDirection.clone().multiplyScalar(riseDistance));
    } else if (cycleTime < fadeOutEnd) {
      phase = "fadeOut";
      const progress = (cycleTime - popEnd) / 1;
      opacity = 0;
      size = 0;
    } else {
      phase = "hidden";
      opacity = 0;
      size = 0;
    }

    bubble.currentPhase = phase;
    bubble.mesh.visible = phase !== "hidden";
    bubble.mesh.position.copy(position);
    bubble.mesh.scale.setScalar(size);
    (bubble.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, opacity);
  }

  public update(deltaTime: number, planetRotation?: number): void {
    const cosmicTime = this.getCurrentCosmicTime();

    for (const bubble of this.bubbles) {
      this.calculateBubbleState(bubble, cosmicTime);
    }

    if (planetRotation !== undefined) {
      this.bubbleGroup.rotation.y = planetRotation;
    }
  }

  public addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.planetCenter.copy(planetPosition);
      this.bubbleGroup.position.copy(planetPosition);

      this.generateBubbleCycleData();
      for (let i = 0; i < this.bubbles.length; i++) {
        this.bubbles[i].cycleData = this.bubbleCycleData[i];
      }
    }
    scene.add(this.bubbleGroup);
  }

  public removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.bubbleGroup);
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();

    this.bubbles.forEach((bubble) => {
      this.bubbleGroup.remove(bubble.mesh);
      if (bubble.mesh.material !== this.material) {
        (bubble.mesh.material as THREE.Material).dispose();
      }
    });

    this.bubbles.length = 0;
  }

  public setEnabled(enabled: boolean): void {
    this.bubbleGroup.visible = enabled;
  }

  public isEnabled(): boolean {
    return this.bubbleGroup.visible;
  }

  public getObject3D(): THREE.Group {
    return this.bubbleGroup;
  }

  public getBubbleCount(): number {
    return this.bubbles.filter((b) => b.currentPhase !== "hidden").length;
  }
}

export function createToxicSwampBubblesFromPythonData(planetRadius: number, surface: any, seed: number, cosmicOriginTime?: number): ToxicSwampBubblesEffect | null {
  if (!surface.toxic_bubbles) {
    return null;
  }

  const bubbleData = surface.toxic_bubbles;

  return new ToxicSwampBubblesEffect(planetRadius, {
    bubbleColor: bubbleData.color ? new THREE.Color(bubbleData.color[0], bubbleData.color[1], bubbleData.color[2]) : undefined,
    seed: seed,
    planetType: "SWAMP",
    cosmicOriginTime: cosmicOriginTime,
    timeSpeed: 1.0,
  });
}
