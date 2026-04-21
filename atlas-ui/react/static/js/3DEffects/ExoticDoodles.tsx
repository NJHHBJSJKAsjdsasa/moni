// atlas-ui/react/static/js/3DEffects/ExoticDoodles.tsx
import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getAnimatedUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime.tsx";

export interface ExoticDoodlesParams {
  doodles?: Array<{
    position_3d: [number, number, number];
    type: "arc" | "fractals" | "squiggle";
    size: number;
    color: [string, number];
    complexity: number;
    movement_speed: number;
    movement_pattern: "wave" | "pulse" | "spiral";
  }>;
  planetRadius?: number;

  orbitalData?: {
    enabled: boolean;
    cycle_duration_years: number;
    visible_duration_years: number;
  };
  currentTime?: number;
  cosmicOriginTime?: number;
}

const PROCEDURAL_RANGES = {
  DOODLE_COUNT: { min: 30, max: 48 },
  DOODLE_SIZE: { min: 0.08, max: 0.2 },
  COMPLEXITY: { min: 15, max: 35 },
  MOVEMENT_SPEED: { min: 0.03, max: 0.09 },
  COLOR_HUE: { min: 0.0, max: 1.0 },
  COLOR_SATURATION: { min: 0.6, max: 1.0 },
  COLOR_LIGHTNESS: { min: 0.4, max: 0.9 },
  OPACITY: { min: 0.3, max: 1.0 },
  TIME_SPEED: { min: 0.1, max: 3.0 },

  RING_CYCLE_DURATION: { min: 25, max: 45 },
  RING_EVENT_DURATION: { min: 3, max: 8 },
  SEPARATION_DURATION: { min: 0.8, max: 2.5 },
  RETURNING_DURATION: { min: 0.8, max: 2.5 },
};

type CosmicRingState = "normal" | "separating" | "ring_mode" | "returning";

export class ExoticDoodlesEffect {
  private group: THREE.Group;
  private doodles: THREE.Object3D[] = [];
  private doodleData: ExoticDoodlesParams["doodles"] = [];
  private planetRadius: number;
  private startTime: number;
  private timeSpeed: number;
  private rng: SeededRandom;
  private lightDirection: THREE.Vector3 = new THREE.Vector3(1, 1, 1).normalize();
  private lastDebugTime: number = 0;
  private debugInterval: number = 30;
  public debugMode: boolean = false;

  private cosmicRingState: CosmicRingState = "normal";
  private ringCycleDuration: number;
  private ringEventDuration: number;
  private separationDuration: number;
  private returningDuration: number;
  private doodleBasePositions: THREE.Vector3[] = [];
  private orbitalVisibilityFactor: number;
  private orbitalData?: ExoticDoodlesParams["orbitalData"];
  private currentTimeYears: number;

  private createLitMaterial(color: string, opacity: number): THREE.ShaderMaterial {
    const vertexShader = `
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 color;
      uniform float opacity;
      uniform vec3 lightDirection;
      uniform float ambientStrength;
      uniform float lightIntensity;
      
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      
      void main() {
        vec3 normal = normalize(vWorldNormal);
        vec3 lightDir = normalize(-lightDirection);

        float dotNL = dot(normal, lightDir);
        float lightingFactor = max(0.0, dotNL);

        float rimLight = 1.0 - abs(dotNL);
        rimLight = pow(rimLight, 3.0) * 0.1;

        float totalLight = ambientStrength + (lightIntensity * lightingFactor) + rimLight;
        totalLight = clamp(totalLight, 0.6, 1.2);

        vec3 finalColor = mix(color * 0.8, color * totalLight, 0.7);
        
        gl_FragColor = vec4(finalColor, opacity);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        color: { value: new THREE.Color(color) },
        opacity: { value: opacity },
        lightDirection: { value: this.lightDirection.clone() },
        ambientStrength: { value: 0.5 },
        lightIntensity: { value: 0.8 },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });
  }

  private projectPointOnSphere(localX: number, localY: number, radius: number, baseDirection: THREE.Vector3): THREE.Vector3 {
    const normal = baseDirection.clone().normalize();
    const tangent = new THREE.Vector3(0, 1, 0).cross(normal).normalize();

    if (tangent.lengthSq() < 0.001) {
      tangent.set(1, 0, 0).cross(normal).normalize();
    }

    const bitangent = normal.clone().cross(tangent).normalize();

    const localPosition = tangent.clone().multiplyScalar(localX).add(bitangent.clone().multiplyScalar(localY));

    const surfacePosition = normal.clone().add(localPosition).normalize().multiplyScalar(radius);

    return surfacePosition;
  }

  constructor(planetRadius: number, params: ExoticDoodlesParams = {}, seed?: number) {
    this.group = new THREE.Group();
    this.planetRadius = planetRadius;

    const actualSeed = seed || 12345;
    this.rng = new SeededRandom(actualSeed);

    this.startTime = (actualSeed % 10000) / 1000;

    this.timeSpeed = this.rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max);

    this.ringEventDuration = this.rng.uniform(PROCEDURAL_RANGES.RING_EVENT_DURATION.min, PROCEDURAL_RANGES.RING_EVENT_DURATION.max);
    this.separationDuration = this.rng.uniform(PROCEDURAL_RANGES.SEPARATION_DURATION.min, PROCEDURAL_RANGES.SEPARATION_DURATION.max);
    this.returningDuration = this.rng.uniform(PROCEDURAL_RANGES.RETURNING_DURATION.min, PROCEDURAL_RANGES.RETURNING_DURATION.max);

    const normalTime = this.rng.uniform(PROCEDURAL_RANGES.RING_CYCLE_DURATION.min, PROCEDURAL_RANGES.RING_CYCLE_DURATION.max);
    this.ringCycleDuration = normalTime + this.ringEventDuration;

    this.orbitalData = params.orbitalData;
    this.currentTimeYears = params.currentTime || 0;

    this.orbitalVisibilityFactor = this.calculateOrbitalVisibility();

    this.debugMode = false;

    this.doodleData = this.generateProceduralDoodles();

    if (this.doodleData.length > 0) {
      this.createDoodles();
    }
  }

  private generateProceduralDoodles(): ExoticDoodlesParams["doodles"] {
    const doodles: NonNullable<ExoticDoodlesParams["doodles"]> = [];
    const doodleCount = this.rng.randint(PROCEDURAL_RANGES.DOODLE_COUNT.min, PROCEDURAL_RANGES.DOODLE_COUNT.max);

    const doodleTypes: Array<"arc" | "fractals" | "squiggle"> = ["arc", "fractals", "squiggle"];
    const movementPatterns: Array<"wave" | "pulse" | "spiral"> = ["wave", "pulse", "spiral"];

    for (let i = 0; i < doodleCount; i++) {
      const theta = this.rng.random() * 2 * Math.PI;
      const phi = Math.acos(this.rng.random() * 2 - 1);

      const position_3d: [number, number, number] = [Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)];

      const r = this.rng.randint(200, 255);
      const g = this.rng.randint(0, 100);
      const b = this.rng.randint(150, 255);
      const opacity = this.rng.uniform(PROCEDURAL_RANGES.OPACITY.min, PROCEDURAL_RANGES.OPACITY.max);

      const hexColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

      doodles.push({
        position_3d,
        type: doodleTypes[this.rng.randint(0, doodleTypes.length - 1)],
        size: this.rng.uniform(PROCEDURAL_RANGES.DOODLE_SIZE.min, PROCEDURAL_RANGES.DOODLE_SIZE.max),
        color: [hexColor, opacity],
        complexity: this.rng.randint(PROCEDURAL_RANGES.COMPLEXITY.min, PROCEDURAL_RANGES.COMPLEXITY.max),
        movement_speed: this.rng.uniform(PROCEDURAL_RANGES.MOVEMENT_SPEED.min, PROCEDURAL_RANGES.MOVEMENT_SPEED.max),
        movement_pattern: movementPatterns[this.rng.randint(0, movementPatterns.length - 1)],
      });
    }

    return doodles;
  }

  private createDoodles(): void {
    this.doodleData.forEach((doodle, index) => {
      let doodleObject: THREE.Object3D;

      switch (doodle.type) {
        case "arc":
          doodleObject = this.createArcDoodle(doodle);
          break;
        case "fractals":
          doodleObject = this.createFractalDoodle(doodle);
          break;
        case "squiggle":
          doodleObject = this.createSquiggleDoodle(doodle);
          break;
        default:
          doodleObject = this.createSquiggleDoodle(doodle);
      }

      const baseDirection = new THREE.Vector3(...doodle.position_3d).normalize();
      this.doodleBasePositions[index] = baseDirection.multiplyScalar(this.planetRadius);

      this.doodles.push(doodleObject);
      this.group.add(doodleObject);
    });
  }

  private createArcDoodle(doodle: NonNullable<ExoticDoodlesParams["doodles"]>[0]): THREE.Object3D {
    const group = new THREE.Group();

    const curve = new THREE.EllipseCurve(0, 0, doodle.size * this.planetRadius, doodle.size * this.planetRadius * 0.7, 0, Math.PI * 1.5, false, 0);

    const points = curve.getPoints(50);

    const path = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p.x, p.y, 0)));
    const tubeRadius = this.planetRadius * 0.004;
    const geometry = new THREE.TubeGeometry(path, 50, tubeRadius, 8, false);

    const material = this.createLitMaterial(doodle.color[0], doodle.color[1]);

    const arc = new THREE.Mesh(geometry, material);
    group.add(arc);

    return group;
  }

  private createFractalDoodle(doodle: NonNullable<ExoticDoodlesParams["doodles"]>[0]): THREE.Object3D {
    const group = new THREE.Group();

    const numElements = Math.floor(doodle.complexity * 0.6) + 2;
    const baseDirection = new THREE.Vector3(...doodle.position_3d);
    const radius = this.planetRadius;

    for (let i = 0; i < numElements; i++) {
      const centerX = (this.rng.random() - 0.5) * doodle.size * this.planetRadius;
      const centerY = (this.rng.random() - 0.5) * doodle.size * this.planetRadius;

      const points: THREE.Vector3[] = [];
      const numPoints = Math.floor(this.rng.random() * 20) + 8;
      const baseCircleRadius = this.rng.random() * doodle.size * this.planetRadius * 0.3 + 0.1;

      for (let j = 0; j <= numPoints; j++) {
        const angle = (j / numPoints) * Math.PI * 2;

        const radiusVariation = baseCircleRadius * (0.7 + this.rng.random() * 0.6);
        const angleJitter = angle + (this.rng.random() - 0.5) * 0.5;

        const localX = centerX + Math.cos(angleJitter) * radiusVariation;
        const localY = centerY + Math.sin(angleJitter) * radiusVariation;

        const pointOnSphere = this.projectPointOnSphere(localX, localY, radius, baseDirection);
        points.push(pointOnSphere);
      }

      points.push(points[0]);

      const path = new THREE.CatmullRomCurve3(points);
      const tubeRadius = this.planetRadius * 0.004;
      const geometry = new THREE.TubeGeometry(path, points.length, tubeRadius, 8, true);
      const material = this.createLitMaterial(doodle.color[0], doodle.color[1]);

      const line = new THREE.Mesh(geometry, material);
      group.add(line);
    }

    return group;
  }

  private createSquiggleDoodle(doodle: NonNullable<ExoticDoodlesParams["doodles"]>[0]): THREE.Object3D {
    const group = new THREE.Group();

    const numStrokes = Math.floor(doodle.complexity * 0.8) + 3;
    const baseDirection = new THREE.Vector3(...doodle.position_3d);
    const radius = this.planetRadius;

    for (let stroke = 0; stroke < numStrokes; stroke++) {
      const points: THREE.Vector3[] = [];
      const strokeLength = this.rng.random() * 15 + 5;

      let currentX = (this.rng.random() - 0.5) * doodle.size * this.planetRadius;
      let currentY = (this.rng.random() - 0.5) * doodle.size * this.planetRadius;

      for (let i = 0; i <= strokeLength; i++) {
        const pointOnSphere = this.projectPointOnSphere(currentX, currentY, radius, baseDirection);
        points.push(pointOnSphere);

        currentX += (this.rng.random() - 0.5) * doodle.size * this.planetRadius * 0.2;
        currentY += (this.rng.random() - 0.5) * doodle.size * this.planetRadius * 0.2;

        const maxSize = doodle.size * this.planetRadius * 0.8;
        currentX = Math.max(-maxSize, Math.min(maxSize, currentX));
        currentY = Math.max(-maxSize, Math.min(maxSize, currentY));
      }

      if (points.length > 1) {
        const path = new THREE.CatmullRomCurve3(points);
        const tubeRadius = this.planetRadius * 0.004;
        const geometry = new THREE.TubeGeometry(path, points.length * 2, tubeRadius, 8, false);
        const material = this.createLitMaterial(doodle.color[0], doodle.color[1]);

        const line = new THREE.Mesh(geometry, material);
        group.add(line);
      }
    }

    return group;
  }

  update(_deltaTime: number): void {
    const cosmicOriginTime = DEFAULT_COSMIC_ORIGIN_TIME;
    const currentTime = getAnimatedUniverseTime(cosmicOriginTime, this.timeSpeed, this.startTime);

    const previousVisibility = this.orbitalVisibilityFactor;
    this.orbitalVisibilityFactor = this.calculateOrbitalVisibility();

    if (this.debugMode) {
      const now = Date.now() / 1000;
      if (now - this.lastDebugTime > this.debugInterval) {
        this.lastDebugTime = now;
        this.logOrbitalStatus();
      }

      if (previousVisibility <= 0.001 && this.orbitalVisibilityFactor > 0.001) {
      } else if (previousVisibility > 0.001 && this.orbitalVisibilityFactor <= 0.001) {
      }
    }

    if (!this.orbitalData || !this.orbitalData.enabled) {
      this.cosmicRingState = "normal";
      this.doodles.forEach((doodle) => {
        doodle.position.set(0, 0, 0);
      });
      this.applyNormalAnimations(currentTime);
      return;
    }

    if (this.orbitalVisibilityFactor <= 0.001) {
      this.cosmicRingState = "normal";

      this.doodles.forEach((doodle) => {
        doodle.position.set(0, 0, 0);
      });

      this.applyNormalAnimations(currentTime);
      return;
    }

    const cycleTime = currentTime % this.ringCycleDuration;
    this.updateCosmicRingState(cycleTime);

    this.doodles.forEach((doodle, index) => {
      const data = this.doodleData[index];
      if (!data) return;

      const ringEffect = this.calculateCosmicRingEffect(cycleTime, index);

      const surfacePosition = new THREE.Vector3(0, 0, 0);

      const basePos = this.doodleBasePositions[index];
      const ringLayer = index % 3;
      const targetSeparationDistance = this.planetRadius * 2.5;
      const layerOffset = ringLayer * 0.3 * this.planetRadius;
      const targetRingPos = basePos
        .clone()
        .normalize()
        .multiplyScalar(targetSeparationDistance + layerOffset);

      const ringCalculationTime = currentTime;

      const baseAngle = ringCalculationTime * 12;
      const layerSpeedMultiplier = 1 + ringLayer * 0.4;
      const targetAngle = baseAngle * layerSpeedMultiplier + index * ((Math.PI * 2) / this.doodles.length);
      const ringRadius = targetSeparationDistance * 0.08;

      const tangent = new THREE.Vector3().crossVectors(targetRingPos, new THREE.Vector3(0, 1, 0)).normalize();
      if (tangent.lengthSq() < 0.001) {
        tangent.set(1, 0, 0).cross(targetRingPos.clone().normalize()).normalize();
      }
      const bitangent = new THREE.Vector3().crossVectors(targetRingPos.clone().normalize(), tangent).normalize();

      const targetRingPosition = targetRingPos
        .clone()
        .add(tangent.multiplyScalar(Math.cos(targetAngle) * ringRadius))
        .add(bitangent.multiplyScalar(Math.sin(targetAngle) * ringRadius));

      let finalPosition: THREE.Vector3;

      if (ringEffect.separationFactor <= 0.001) {
        finalPosition = surfacePosition.clone();
      } else {
        let lerpFactor = ringEffect.separationFactor;

        if (this.cosmicRingState === "separating") {
          lerpFactor = this.easeOutQuart(lerpFactor);
        } else if (this.cosmicRingState === "returning") {
          lerpFactor = this.easeInOutCubic(lerpFactor);
        }

        finalPosition = surfacePosition.clone().lerp(targetRingPosition, lerpFactor);
      }

      doodle.position.copy(finalPosition);

      const speed = data.movement_speed * ringEffect.speedMultiplier;

      switch (data.movement_pattern) {
        case "wave":
          doodle.rotation.z = Math.sin(currentTime * speed) * 0.2;
          break;

        case "pulse":
          doodle.rotation.z = Math.sin(currentTime * speed * 2) * 0.15;
          break;

        case "spiral":
          doodle.rotation.z = currentTime * speed;
          break;
      }
    });
  }

  setCosmicTime(cosmicTimeSeconds: number): void {
    this.currentTimeYears = cosmicTimeSeconds / (365.25 * 24 * 3600);
  }

  private calculateOrbitalVisibility(): number {
    if (!this.orbitalData || !this.orbitalData.enabled) {
      return 1.0;
    }

    const currentTime = this.currentTimeYears;
    const cycleProgress = (currentTime % this.orbitalData.cycle_duration_years) / this.orbitalData.cycle_duration_years;
    const visibleFraction = this.orbitalData.visible_duration_years / this.orbitalData.cycle_duration_years;

    if (cycleProgress < visibleFraction) {
      const localProgress = cycleProgress / visibleFraction;
      if (localProgress < 0.1) {
        return localProgress / 0.1;
      } else if (localProgress > 0.9) {
        return (1 - localProgress) / 0.1;
      } else {
        return 1.0;
      }
    } else {
      return 0.0;
    }
  }

  private applyNormalAnimations(currentTime: number): void {
    this.doodles.forEach((doodle, index) => {
      const data = this.doodleData[index];
      if (!data) return;

      const speed = data.movement_speed;

      switch (data.movement_pattern) {
        case "wave":
          doodle.rotation.z = Math.sin(currentTime * speed) * 0.2;
          break;
        case "pulse":
          doodle.rotation.z = Math.sin(currentTime * speed * 2) * 0.15;
          break;
        case "spiral":
          doodle.rotation.z = currentTime * speed;
          break;
      }
    });
  }

  private updateCosmicRingState(cycleTime: number): void {
    const normalDuration = this.ringCycleDuration - this.ringEventDuration;

    if (cycleTime < normalDuration) {
      this.cosmicRingState = "normal";
    } else if (cycleTime < normalDuration + this.separationDuration) {
      this.cosmicRingState = "separating";
    } else if (cycleTime < normalDuration + this.separationDuration + (this.ringEventDuration - this.separationDuration - this.returningDuration)) {
      this.cosmicRingState = "ring_mode";
    } else {
      this.cosmicRingState = "returning";
    }
  }

  private calculateCosmicRingEffect(
    cycleTime: number,
    doodleIndex: number
  ): {
    separationFactor: number;
    orbitalSpeed: number;
    speedMultiplier: number;
  } {
    const normalDuration = this.ringCycleDuration - this.ringEventDuration;
    let separationFactor = 0;
    let orbitalSpeed = 0;
    let speedMultiplier = 1;

    switch (this.cosmicRingState) {
      case "normal":
        separationFactor = 0;
        orbitalSpeed = 0;
        speedMultiplier = 1;
        break;

      case "separating":
        const separatingProgress = (cycleTime - normalDuration) / this.separationDuration;

        separationFactor = this.easeOutQuart(separatingProgress);
        orbitalSpeed = 12;
        speedMultiplier = 1 + separationFactor * 7;
        break;

      case "ring_mode":
        separationFactor = 1;
        orbitalSpeed = 12;
        speedMultiplier = 8;
        break;

      case "returning":
        const returningStart = normalDuration + this.separationDuration + (this.ringEventDuration - this.separationDuration - this.returningDuration);
        const returningProgress = (cycleTime - returningStart) / this.returningDuration;

        const smoothReturn = this.easeInQuart(returningProgress);
        separationFactor = 1 - smoothReturn;
        orbitalSpeed = 12;
        speedMultiplier = 1 + separationFactor * 7;
        break;
    }

    const doodleDelayFactor = (doodleIndex / this.doodles.length) * 0.3;

    if (this.cosmicRingState === "separating") {
      const adjustedProgress = Math.max(0, (cycleTime - normalDuration - doodleDelayFactor * this.separationDuration) / this.separationDuration);
      separationFactor = this.easeOutQuart(adjustedProgress);
    } else if (this.cosmicRingState === "returning") {
      const returningStart = normalDuration + this.separationDuration + (this.ringEventDuration - this.separationDuration - this.returningDuration);
      const adjustedProgress = Math.max(0, (cycleTime - returningStart - doodleDelayFactor * this.returningDuration) / this.returningDuration);
      separationFactor = 1 - this.easeInQuart(adjustedProgress);
    }

    return {
      separationFactor,
      orbitalSpeed,
      speedMultiplier,
    };
  }

  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  private logOrbitalStatus(): void {
    if (!this.orbitalData || !this.orbitalData.enabled) {
      return;
    }

    const currentTime = this.currentTimeYears;
    const cycleProgress = (currentTime % this.orbitalData.cycle_duration_years) / this.orbitalData.cycle_duration_years;
    const visibleFraction = this.orbitalData.visible_duration_years / this.orbitalData.cycle_duration_years;

    const isCurrentlyVisible = cycleProgress < visibleFraction;
    const cycleTimeYears = currentTime % this.orbitalData.cycle_duration_years;

    let timeUntilNextEvent: number;
    let nextEventType: string;

    if (isCurrentlyVisible) {
      timeUntilNextEvent = this.orbitalData.visible_duration_years - cycleTimeYears;
      nextEventType = "DISAPPEAR";
    } else {
      timeUntilNextEvent = this.orbitalData.cycle_duration_years - cycleTimeYears;
      nextEventType = "APPEAR";
    }

    const timeInDays = timeUntilNextEvent * 365.25;
    const timeInHours = timeInDays * 24;
    const timeInMinutes = timeInHours * 60;

    let timeString: string;
    if (timeInDays > 1) {
      timeString = `${timeInDays.toFixed(1)} days`;
    } else if (timeInHours > 1) {
      timeString = `${timeInHours.toFixed(1)} hours`;
    } else {
      timeString = `${timeInMinutes.toFixed(1)} minutes`;
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }

  private easeInQuart(t: number): number {
    return t * t * t * t;
  }

  updateLightDirection(direction: THREE.Vector3): void {
    this.lightDirection.copy(direction).normalize();

    this.doodles.forEach((doodle) => {
      doodle.traverse((child) => {
        if ((child instanceof THREE.Line || child instanceof THREE.Mesh) && child.material instanceof THREE.ShaderMaterial) {
          if (child.material.uniforms.lightDirection) {
            child.material.uniforms.lightDirection.value.copy(this.lightDirection);
          }
        }
      });
    });
  }

  updateFromThreeLight(light: THREE.DirectionalLight): void {
    const direction = light.position.clone().normalize();
    this.updateLightDirection(direction);
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
    this.doodles.forEach((doodle) => {
      doodle.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    });
    this.doodles = [];
  }
}

export function createExoticDoodlesFromPythonData(planetRadius: number, _surfaceElements?: any, seed?: number, pythonData?: any): ExoticDoodlesEffect | null {
  const currentTimeYears = pythonData?.timing?.elapsed_time ? pythonData.timing.elapsed_time / (365.25 * 24 * 3600) : 0;

  const doodleData = pythonData?.surface_elements?.exotic_doodles;

  return new ExoticDoodlesEffect(
    planetRadius,
    {
      planetRadius: planetRadius,

      orbitalData: doodleData,
      currentTime: currentTimeYears,
    },
    seed
  );
}
