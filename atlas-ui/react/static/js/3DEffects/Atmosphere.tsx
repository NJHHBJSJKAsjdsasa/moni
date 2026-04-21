// atlas-ui/react/static/js/3DEffects/Atmosphere.tsx

import * as THREE from "three";

export interface AtmosphereParams {
  type?: string;
  color?: number[];
  width?: number;
  opacity?: number;
  density?: number;
}

export class AtmosphereEffect {
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.SphereGeometry;
  private params: AtmosphereParams;

  private static readonly vertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  private static readonly fragmentShader = `
    uniform vec3 atmosphereColor;
    uniform float atmosphereOpacity;
    uniform float fresnelPower;
    
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      
      float fresnel = pow(1.0 - abs(dot(normal, viewDir)), fresnelPower);
      
      vec3 color = atmosphereColor;
      
      float alpha = fresnel * atmosphereOpacity;
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  constructor(planetRadius: number, params: AtmosphereParams = {}) {
    this.params = {
      type: params.type || "Thin",
      color: params.color || [0.7, 0.7, 0.7, 0.2],
      width: params.width || 12,
      opacity: params.opacity || 0.2,
      density: params.density || 1.0,
    };

    const atmosphereRadius = planetRadius * (1 + this.params.width! / 100);

    this.geometry = new THREE.SphereGeometry(atmosphereRadius, 32, 32);

    const atmosphereColor = new THREE.Color(this.params.color![0], this.params.color![1], this.params.color![2]);

    this.material = new THREE.ShaderMaterial({
      vertexShader: AtmosphereEffect.vertexShader,
      fragmentShader: AtmosphereEffect.fragmentShader,
      uniforms: {
        atmosphereColor: { value: atmosphereColor },
        atmosphereOpacity: { value: this.params.opacity! },
        fresnelPower: { value: 2.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.mesh.position.copy(planetPosition);
    }
    scene.add(this.mesh);
  }

  update(deltaTime: number): void {}

  updateParams(newParams: Partial<AtmosphereParams>): void {
    this.params = { ...this.params, ...newParams };

    if (newParams.color) {
      const atmosphereColor = new THREE.Color(newParams.color[0], newParams.color[1], newParams.color[2]);
      this.material.uniforms.atmosphereColor.value = atmosphereColor;
    }
    if (newParams.opacity !== undefined) {
      this.material.uniforms.atmosphereOpacity.value = newParams.opacity;
    }
    if (newParams.density !== undefined) {
      this.material.uniforms.atmosphereOpacity.value = (this.params.opacity || 0.3) * newParams.density;
    }
  }

  getObject3D(): THREE.Mesh {
    return this.mesh;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

export function createAtmosphereFromPythonData(planetRadius: number, atmosphereData: any): AtmosphereEffect {
  let atmosphereColor = [0.7, 0.7, 0.7, 0.15];
  let atmosphereWidth = 12;

  if (atmosphereData) {
    if (atmosphereData.color && Array.isArray(atmosphereData.color)) {
      const pythonColor = atmosphereData.color;
      atmosphereColor = [pythonColor[0], pythonColor[1], pythonColor[2], (pythonColor[3] || 0.15) * 0.7];
    }

    if (atmosphereData.width) {
      atmosphereWidth = atmosphereData.width;
    }
  }

  const params: AtmosphereParams = {
    type: atmosphereData?.type || "Thin",
    color: atmosphereColor,
    width: atmosphereWidth,
    opacity: atmosphereColor[3],
    density: 1.0,
  };

  return new AtmosphereEffect(planetRadius, params);
}
