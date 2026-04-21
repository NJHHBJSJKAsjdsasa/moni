// atlas-ui/react/static/js/3DEffects/VisualDebug3D.tsx

import * as THREE from "three";

export interface VisualDebug3DParams {
  sunAngle?: number;
  orbitalAngle?: number;
  planetRotation?: number;
  currentTime?: number;
  cosmicOriginTime?: number;
  rotationPeriod?: number;
  initialAngleRotation?: number;
  planetRadius?: number;
  showSunLine?: boolean;
  showRotationLine?: boolean;
  showRotationInfo?: boolean;
  showTimeInfo?: boolean;
}

export class VisualDebug3DEffect {
  private sunLine: THREE.Line | null = null;
  private rotationLine: THREE.Line | null = null;
  private debugGroup: THREE.Group;
  private params: VisualDebug3DParams;
  private planetRadius: number;

  constructor(planetRadius: number, params: VisualDebug3DParams = {}) {
    this.planetRadius = planetRadius;
    this.params = {
      showSunLine: true,
      showRotationLine: true,
      showRotationInfo: true,
      showTimeInfo: true,
      planetRadius: planetRadius,
      ...params,
    };

    this.debugGroup = new THREE.Group();
    this.createDebugElements();
  }

  private createDebugElements(): void {
    if (this.params.showSunLine) {
      this.createSunLine();
    }

    if (this.params.showRotationLine) {
      this.createRotationLine();
    }
  }

  private createSunLine(): void {
    const sunAngle = this.calculateSunAngle();

    const lineDistance = this.planetRadius * 3;
    const shadowAngle = sunAngle;

    const shadowX = lineDistance * Math.cos(shadowAngle);
    const shadowZ = lineDistance * Math.sin(shadowAngle);
    const shadowY = shadowZ * 0.8;

    const lineGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array([0, 0, 0, shadowX, shadowY, shadowZ]);

    lineGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffff00,
      linewidth: 5,
      transparent: false,
    });

    this.sunLine = new THREE.Line(lineGeometry, lineMaterial);
    this.debugGroup.add(this.sunLine);

    const actualSunAngle = sunAngle + Math.PI;
    const sunSphereDistance = lineDistance * 0.7;

    const sunSphereX = sunSphereDistance * Math.cos(actualSunAngle);
    const sunSphereY = 0;
    const sunSphereZ = sunSphereDistance * Math.sin(actualSunAngle);

    const sunSphereGeometry = new THREE.SphereGeometry(this.planetRadius * 0.15, 16, 16);
    const sunSphereMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: false,
      opacity: 1.0,
    });
    const sunSphere = new THREE.Mesh(sunSphereGeometry, sunSphereMaterial);
    sunSphere.position.set(sunSphereX, sunSphereY, sunSphereZ);
    this.debugGroup.add(sunSphere);

    this.createTestSpheres();
  }

  private createTestSpheres(): void {}

  private createRotationLine(): void {
    const currentRotation = this.calculateCurrentRotation();

    const sceneRadius = this.planetRadius * 25;

    const lineGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array([-sceneRadius * Math.cos(currentRotation), 0, -sceneRadius * Math.sin(currentRotation), sceneRadius * Math.cos(currentRotation), 0, sceneRadius * Math.sin(currentRotation)]);

    lineGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const rotationMaterial = new THREE.LineBasicMaterial({
      color: 0x8a8a8a,
      linewidth: 2,
      transparent: false,
    });

    this.rotationLine = new THREE.Line(lineGeometry, rotationMaterial);
    this.debugGroup.add(this.rotationLine);
  }

  private calculateSunAngle(): number {
    if (this.params.sunAngle !== undefined) {
      return this.params.sunAngle;
    }

    const orbitalAngle = this.params.orbitalAngle || 0;

    return orbitalAngle;
  }

  private calculateCurrentRotation(): number {
    const currentTime = this.params.currentTime || Date.now() / 1000;
    const cosmicOriginTime = this.params.cosmicOriginTime || currentTime - 3600;
    const rotationPeriod = this.params.rotationPeriod || 86400;
    const initialAngleRotation = this.params.initialAngleRotation || 0;

    const timeElapsedSeconds = currentTime - cosmicOriginTime;
    const angleVelocityRotation = (2 * Math.PI) / rotationPeriod;
    const angleRotation = (initialAngleRotation + timeElapsedSeconds * angleVelocityRotation) % (2 * Math.PI);

    return angleRotation;
  }

  update(deltaTime: number, newParams?: Partial<VisualDebug3DParams>): void {
    if (newParams) {
      this.params = { ...this.params, ...newParams };
    }

    if (this.sunLine && this.params.showSunLine) {
      this.updateSunLine();
    }

    if (this.rotationLine && this.params.showRotationLine) {
      this.updateRotationLine();
    }
  }

  private updateSunLine(): void {
    if (!this.sunLine) return;

    const sunAngle = this.calculateSunAngle();
    const shadowAngle = sunAngle;
    const sceneRadius = this.planetRadius * 20;

    const geometry = this.sunLine.geometry as THREE.BufferGeometry;
    const positions = geometry.attributes.position.array as Float32Array;

    positions[3] = sceneRadius * Math.cos(shadowAngle);
    positions[4] = 0;
    positions[5] = sceneRadius * Math.sin(shadowAngle);

    geometry.attributes.position.needsUpdate = true;
  }

  private updateRotationLine(): void {
    if (!this.rotationLine) return;

    const currentRotation = this.calculateCurrentRotation();
    const sceneRadius = this.planetRadius * 25;

    const geometry = this.rotationLine.geometry as THREE.BufferGeometry;
    const positions = geometry.attributes.position.array as Float32Array;

    positions[0] = -sceneRadius * Math.cos(currentRotation);
    positions[1] = 0;
    positions[2] = -sceneRadius * Math.sin(currentRotation);
    positions[3] = sceneRadius * Math.cos(currentRotation);
    positions[4] = 0;
    positions[5] = sceneRadius * Math.sin(currentRotation);

    geometry.attributes.position.needsUpdate = true;
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.debugGroup.position.copy(planetPosition);
    }

    scene.add(this.debugGroup);
  }

  getDebugInfo(): { [key: string]: any } {
    const currentRotation = this.calculateCurrentRotation();
    const sunAngle = this.calculateSunAngle();

    return {
      "Current Time": new Date().toISOString(),
      "Planet Rotation": `${((currentRotation * 180) / Math.PI).toFixed(2)}°`,
      "Sun Angle": `${((sunAngle * 180) / Math.PI).toFixed(2)}°`,
      "Rotation Period": `${this.params.rotationPeriod}s`,
      "Cosmic Origin": new Date((this.params.cosmicOriginTime || 0) * 1000).toISOString(),
    };
  }

  toggleSunLine(visible: boolean): void {
    if (this.sunLine) {
      this.sunLine.visible = visible;
    }
  }

  toggleRotationLine(visible: boolean): void {
    if (this.rotationLine) {
      this.rotationLine.visible = visible;
    }
  }

  getObject3D(): THREE.Group {
    return this.debugGroup;
  }

  dispose(): void {
    this.debugGroup.clear();

    if (this.sunLine) {
      this.sunLine.geometry.dispose();
      (this.sunLine.material as THREE.LineBasicMaterial).dispose();
    }

    if (this.rotationLine) {
      this.rotationLine.geometry.dispose();
      (this.rotationLine.material as THREE.LineBasicMaterial).dispose();
    }
  }
}

export function createVisualDebug3DFromPythonData(planetData: any, planetRadius: number): VisualDebug3DEffect {
  const params: VisualDebug3DParams = {
    currentTime: Date.now() / 1000,
    cosmicOriginTime: planetData.debug?.cosmic_origin_time || planetData.timing?.cosmic_origin_time || planetData.cosmicOriginTime,
    rotationPeriod: planetData.planet_info?.rotation_period || planetData.rotation_period_seconds || 86400,
    initialAngleRotation: planetData.debug?.initial_angle_rotation || planetData.timing?.initial_angle_rotation || planetData.initialAngleRotation || 0,
    planetRadius: planetRadius,

    orbitalAngle: planetData.timing?.orbital_angle || 0,
    sunAngle: planetData.sun_angle || planetData.lighting?.sun_angle,

    showSunLine: true,
    showRotationLine: true,
    showRotationInfo: true,
    showTimeInfo: true,
  };

  return new VisualDebug3DEffect(planetRadius, params);
}
