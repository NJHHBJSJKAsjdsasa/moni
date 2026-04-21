// atlas-ui/react/static/js/3DEffects/FluidLayers.tsx

import * as THREE from "three";

export interface FluidLayersParams {
  radius?: number;
  detail?: number;
  flowSpeed?: number;
  waveAmplitude?: number;
  opacity?: number;
  colorDeep?: THREE.Color | number[];
  colorShallow?: THREE.Color | number[];
}

export class FluidLayersEffect {
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private params: FluidLayersParams;

  private static readonly vertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying float vDisplacement;
    
    uniform float uTime;
    uniform float uWaveAmplitude;
    uniform float uNoiseScale;
    uniform float uSecondaryWaveScale;
    uniform float uPrimaryFlowSpeed;
    uniform float uSecondaryFlowSpeed;
    
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){ 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );

      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1. + 3.0 * C.xxx;

      i = mod(i, 289.0 ); 
      vec4 p = permute( permute( permute( 
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

      float n_ = 1.0/7.0;
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }
    
    float fbm(vec3 p, int octaves, float persistence, float lacunarity) {
      float amplitude = 0.5;
      float frequency = 1.0;
      float total = 0.0;
      float normalization = 0.0;

      for (int i = 0; i < octaves; i++) {
        float noiseValue = snoise(p * frequency);
        total += noiseValue * amplitude;
        normalization += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
      }

      return total / normalization;
    }
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      vec3 pos = position;
      
      float primaryFlow = fbm(
        vec3(pos.x * uNoiseScale, pos.y * uNoiseScale, pos.z * uNoiseScale + uTime * uPrimaryFlowSpeed),
        4, 0.5, 2.0
      );
      
      float secondaryFlow = fbm(
        vec3(pos.x * uSecondaryWaveScale, pos.y * uSecondaryWaveScale, pos.z * uSecondaryWaveScale - uTime * uSecondaryFlowSpeed),
        3, 0.4, 2.5
      );
      
      float displacement = primaryFlow * 0.7 + secondaryFlow * 0.3;
      displacement *= uWaveAmplitude;
      
      pos += normal * displacement;
      vDisplacement = displacement;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewPosition = -mvPosition.xyz;
      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  private static readonly fragmentShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying float vDisplacement;
    
    uniform float uTime;
    uniform float uFlowSpeed;
    uniform float uFresnelPower;
    uniform float uOpacity;
    uniform vec3 uColorDeep;
    uniform vec3 uColorShallow;
    uniform float uNoiseScale;
    uniform float uUvPatternSpeed1;
    uniform float uUvPatternSpeed2;
    
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    
    float snoise(vec3 v){ 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1. + 3.0 * C.xxx;
      i = mod(i, 289.0 ); 
      vec4 p = permute( permute( permute( 
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 1.0/7.0;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }
    
    void main() {
      vec3 viewDirection = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      
      float fresnel = pow(1.0 - abs(dot(viewDirection, normal)), uFresnelPower);
      
      float flowPattern = snoise(vWorldPosition * uNoiseScale + vec3(uTime * uFlowSpeed, uTime * uFlowSpeed * 0.5, 0.0));
      flowPattern = (flowPattern + 1.0) * 0.5;
      
      float uvPattern = sin(vUv.x * 15.0 + uTime * uUvPatternSpeed1) * cos(vUv.y * 15.0 - uTime * uUvPatternSpeed2);
      uvPattern = (uvPattern + 1.0) * 0.5;
      
      float combinedPattern = flowPattern * 0.7 + uvPattern * 0.3;
      
      float opacity = uOpacity;
      opacity *= (0.4 + fresnel * 0.6);
      opacity *= (0.6 + abs(vDisplacement) * 15.0);
      opacity *= (0.5 + combinedPattern * 0.5);
      
      float lightIntensity = max(dot(normal, vec3(0.5, 0.8, 0.3)), 0.0);
      opacity = mix(opacity, opacity * 1.3, lightIntensity * 0.5);
      
      vec3 color = mix(uColorDeep, uColorShallow, combinedPattern);
      
      float highlight = smoothstep(0.01, 0.02, vDisplacement);
      color += vec3(0.2, 0.3, 0.4) * highlight * fresnel;
      
      vec3 lightDir = normalize(vec3(0.5, 0.8, 0.3));
      float NdotL = max(dot(normal, lightDir), 0.0);
      
      vec3 finalColor = mix(
        vec3(0.4, 0.5, 0.6),
        vec3(0.9, 0.95, 1.0),
        1.0 - NdotL
      );
      
      finalColor *= (0.5 + 0.5 * NdotL);
      finalColor *= (0.7 + 0.3 * fresnel);
      
      float colorMix = mix(0.35, 0.55, NdotL);
      finalColor = mix(finalColor, color, colorMix);
      
      gl_FragColor = vec4(finalColor, opacity);
    }
  `;

  constructor(planetRadius: number, params: FluidLayersParams = {}) {
    this.params = {
      radius: params.radius || planetRadius * 0.999,
      detail: params.detail || 128,
      flowSpeed: params.flowSpeed || 0.5,
      waveAmplitude: params.waveAmplitude || 0.02,
      opacity: params.opacity || 0.75,
      colorDeep: params.colorDeep || new THREE.Color(0x001033),
      colorShallow: params.colorShallow || new THREE.Color(0x0066dd),
      ...params,
    };

    const geometry = new THREE.SphereGeometry(this.params.radius!, this.params.detail!, this.params.detail!);

    this.material = new THREE.ShaderMaterial({
      vertexShader: FluidLayersEffect.vertexShader,
      fragmentShader: FluidLayersEffect.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uFlowSpeed: { value: this.params.flowSpeed },
        uWaveAmplitude: { value: this.params.waveAmplitude },
        uFresnelPower: { value: 1.5 },
        uOpacity: { value: this.params.opacity },
        uColorDeep: { value: this.params.colorDeep instanceof THREE.Color ? this.params.colorDeep : new THREE.Color(this.params.colorDeep as any) },
        uColorShallow: { value: this.params.colorShallow instanceof THREE.Color ? this.params.colorShallow : new THREE.Color(this.params.colorShallow as any) },
        uNoiseScale: { value: 3.0 },
        uSecondaryWaveScale: { value: 6.0 },
        uPrimaryFlowSpeed: { value: this.params.flowSpeed || 0.5 },
        uSecondaryFlowSpeed: { value: (this.params.flowSpeed || 0.5) * 1.6 },
        uUvPatternSpeed1: { value: (this.params.flowSpeed || 0.5) * 4.0 },
        uUvPatternSpeed2: { value: (this.params.flowSpeed || 0.5) * 3.0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.FrontSide,
      blending: THREE.NormalBlending,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.renderOrder = -1;
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.mesh.position.copy(planetPosition);
    }
    scene.add(this.mesh);
  }

  update(deltaTime: number, planetRotation?: number): void {
    this.material.uniforms.uTime.value += deltaTime;

    if (planetRotation !== undefined) {
      this.mesh.rotation.y = planetRotation;
    }
  }

  updateParams(newParams: Partial<FluidLayersParams>): void {
    this.params = { ...this.params, ...newParams };

    if (newParams.flowSpeed !== undefined) {
      this.material.uniforms.uFlowSpeed.value = newParams.flowSpeed;
      this.material.uniforms.uPrimaryFlowSpeed.value = newParams.flowSpeed;
      this.material.uniforms.uSecondaryFlowSpeed.value = newParams.flowSpeed * 1.6;
      this.material.uniforms.uUvPatternSpeed1.value = newParams.flowSpeed * 4.0;
      this.material.uniforms.uUvPatternSpeed2.value = newParams.flowSpeed * 3.0;
    }
    if (newParams.waveAmplitude !== undefined) {
      this.material.uniforms.uWaveAmplitude.value = newParams.waveAmplitude;
    }
    if (newParams.opacity !== undefined) {
      this.material.uniforms.uOpacity.value = newParams.opacity;
    }
    if (newParams.colorDeep) {
      const color = newParams.colorDeep instanceof THREE.Color ? newParams.colorDeep : new THREE.Color(newParams.colorDeep as any);
      this.material.uniforms.uColorDeep.value = color;
    }
    if (newParams.colorShallow) {
      const color = newParams.colorShallow instanceof THREE.Color ? newParams.colorShallow : new THREE.Color(newParams.colorShallow as any);
      this.material.uniforms.uColorShallow.value = color;
    }
  }

  getObject3D(): THREE.Mesh {
    return this.mesh;
  }

  dispose(): void {
    if (this.mesh.geometry) {
      this.mesh.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
  }
}

export function createFluidLayersFromPythonData(planetRadius: number, pythonData: any): FluidLayersEffect {
  let flowSpeed = 0.5;
  let waveAmplitude = 0.025;
  let opacity = 0.75;

  if (pythonData.seeds) {
    const seed = pythonData.seeds.shape_seed || pythonData.seeds.planet_seed;
    const rng = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
      };
    };

    const random = rng(seed);
    flowSpeed = 0.05 + random() * 0.3;
    waveAmplitude = 0.02 + random() * 0.02;
    opacity = 0.25 + random() * 0.6;
  }

  const params: FluidLayersParams = {
    radius: planetRadius * 0.999,
    detail: 128,
    flowSpeed,
    waveAmplitude: waveAmplitude * 0.4,
    opacity,
    colorDeep: new THREE.Color(0x001033),
    colorShallow: new THREE.Color(0x0066dd),
  };

  return new FluidLayersEffect(planetRadius, params);
}

export default FluidLayersEffect;
