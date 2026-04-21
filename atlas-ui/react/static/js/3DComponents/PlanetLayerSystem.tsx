// atlas-ui/react/static/js/3DComponents/PlanetLayerSystem.tsx

import * as THREE from "three";

export interface LayerEffect {
  name: string;
  mesh?: THREE.Mesh;
  material: THREE.ShaderMaterial;
  layerObject?: unknown;
  update?: (deltaTime: number, planetRotation?: number) => void;
  dispose?: () => void;
}

export class PlanetLayerSystem {
  private baseMesh: THREE.Mesh;
  private baseMaterial: THREE.ShaderMaterial;
  private originalBaseMaterial?: THREE.ShaderMaterial;
  private effectLayers: LayerEffect[] = [];
  private scene?: THREE.Scene;
  private planetRadius: number;

  private static readonly baseVertexShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec2 vUv;
    
    void main() {
      vPosition = position;
      vNormal = normalMatrix * normal;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  private static readonly baseFragmentShader = `
    uniform vec3 baseColor;
    uniform vec3 lightDirection;
    uniform vec3 lightPosition;
    uniform float ambientStrength;
    uniform float lightIntensity;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec2 vUv;
    
    void main() {
      vec3 normal = normalize(vWorldNormal);
      
      vec3 lightDir;
      if (length(lightPosition) > 0.0) {
        lightDir = normalize(lightPosition - vWorldPosition);
      } else {
        lightDir = normalize(-lightDirection);
      }
      
      float dotNL = dot(normal, lightDir);
      
      float dayNight = smoothstep(-0.3, 0.1, dotNL);
      
      float rimLight = 1.0 - abs(dotNL);
      rimLight = pow(rimLight, 3.0) * 0.1;
      
      vec3 finalColor = baseColor;
      
      float totalLight = ambientStrength + (lightIntensity * dayNight) + rimLight;
      finalColor *= totalLight;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  constructor(baseMesh: THREE.Mesh, baseColor: THREE.Color | THREE.ColorRepresentation = new THREE.Color(0xffa500)) {
    this.baseMesh = baseMesh;

    const geometry = baseMesh.geometry as THREE.SphereGeometry;
    this.planetRadius = geometry.parameters.radius || 1;

    const color = baseColor instanceof THREE.Color ? baseColor : new THREE.Color(baseColor);

    this.baseMaterial = new THREE.ShaderMaterial({
      vertexShader: PlanetLayerSystem.baseVertexShader,
      fragmentShader: PlanetLayerSystem.baseFragmentShader,
      uniforms: {
        baseColor: { value: color },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
        ambientStrength: { value: 0.15 },
        lightIntensity: { value: 0.85 },
      },
      side: THREE.FrontSide,
    });

    this.baseMesh.material = this.baseMaterial;
  }

  addEffectLayer(name: string, material: THREE.ShaderMaterial, scaleFactor: number = 1.001, layerObject?: unknown): THREE.Mesh {
    const layerGeometry = new THREE.SphereGeometry(this.planetRadius * scaleFactor, 256, 256);

    const layerMesh = new THREE.Mesh(layerGeometry, material);

    layerMesh.position.copy(this.baseMesh.position);
    layerMesh.rotation.copy(this.baseMesh.rotation);

    this.effectLayers.push({
      name,
      mesh: layerMesh,
      material,
      layerObject,
    });

    if (this.scene) {
      this.scene.add(layerMesh);
    }

    return layerMesh;
  }

  createCloudBandsLayerMaterial(params: Record<string, unknown>): THREE.ShaderMaterial {
    const vertexShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vPosition = position;
        vNormal = normal;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float time;
      uniform float seed;
      uniform vec3 bandColor;
      uniform float numBands;
      uniform float rotationAngle;
      uniform float bandPositions[20];
      uniform float bandWidths[20];
      uniform float animationSpeed;
      uniform float turbulence;
      uniform float noiseScale;
      uniform vec3 lightDirection;
      uniform float opacity;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      float hash(float n) {
        return fract(sin(n + seed) * 43758.5453123);
      }
      
      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float n = i.x + i.y * 57.0 + 113.0 * i.z;
        return mix(
          mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
              mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
          mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
              mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
      }
      
      float fbm(vec3 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for(int i = 0; i < 4; i++) {
          value += amplitude * noise(p * frequency);
          frequency *= 2.0;
          amplitude *= 0.5;
        }
        
        return value;
      }
      
      float createBandGaps(vec3 pos, float bandIndex) {
        float angle = atan(pos.z, pos.x);
        
        float gapPattern = 1.0;
        
        for(float g = 0.0; g < 4.0; g++) {
          float gapSeed = hash(bandIndex * 100.0 + g * 17.0);
          float gapPosition = gapSeed * 6.28318;
          float gapWidth = 0.3 + gapSeed * 0.4;
          
          float distToGap = abs(angle - gapPosition);
          distToGap = min(distToGap, 6.28318 - distToGap);
          
          if(distToGap < gapWidth) {
            float gapIntensity = smoothstep(0.0, gapWidth, distToGap);
            gapPattern *= gapIntensity;
          }
        }
        
        return gapPattern;
      }
      
      float createCloudBands(vec3 pos) {
        float bands = 0.0;
        
        float currentY = pos.y;
        float currentX = pos.x;
        
        float cosAngle = cos(rotationAngle);
        float sinAngle = sin(rotationAngle);
        float rotatedY = sinAngle * currentX + cosAngle * currentY;
        
        for(int i = 0; i < 20; i++) {
          if(float(i) >= numBands) break;
          
          float bandPosY = bandPositions[i];
          float bandWidth = bandWidths[i];
          
          float distToBand = abs(rotatedY - bandPosY);
          if(distToBand < bandWidth / 2.0) {
            float bandIntensity = 1.0 - (distToBand / (bandWidth / 2.0));
            
            float turbulenceNoise = fbm(pos * noiseScale + vec3(time * animationSpeed * 0.1));
            bandIntensity *= (0.8 + 0.4 * turbulenceNoise * turbulence);
            
            float gapMask = createBandGaps(pos, float(i));
            bandIntensity *= gapMask;
            
            bands += bandIntensity * 0.8;
          }
        }
        
        return clamp(bands, 0.0, 1.0);
      }
      
      void main() {
        vec3 pos = normalize(vPosition);
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(lightDirection);
        
        float dotNL = dot(normal, lightDir);
        float visibility = smoothstep(-0.2, 0.2, dotNL);
        
        float bands = createCloudBands(pos);
        
        float lightIntensity = max(0.3, dotNL);
        
        vec3 color = bandColor * (0.5 + 0.5 * lightIntensity);
        float alpha = bands * opacity;
        
        gl_FragColor = vec4(color, alpha);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        seed: { value: params.seed || Math.random() * 1000 },
        bandColor: { value: params.bandColor || new THREE.Color(0xff8c00) },
        numBands: { value: params.numBands || 8 },
        rotationAngle: { value: params.rotationAngle || 0 },
        bandPositions: { value: params.bandPositions || new Array(20).fill(0) },
        bandWidths: { value: params.bandWidths || new Array(20).fill(0.1) },
        animationSpeed: { value: params.animationSpeed || 1.0 },
        turbulence: { value: params.turbulence || 0.5 },
        noiseScale: { value: params.noiseScale || 3.0 },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        opacity: { value: params.opacity || 0.4 },
      },
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
      depthWrite: false,
    });
  }

  createMetallicSurfaceLayerMaterial(params: Record<string, unknown>): THREE.ShaderMaterial {
    const vertexShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      
      void main() {
        vPosition = position;
        vNormal = normalMatrix * normal;
        vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 metalColor;
      uniform float metalness;
      uniform float roughness;
      uniform float fragmentationIntensity;
      uniform float opacity;
      uniform vec3 lightDirection;
      uniform vec3 lightPosition;
      uniform float ambientStrength;
      uniform float lightIntensity;
      uniform float time;
      uniform float noiseScale;
      uniform float noiseIntensity;
      uniform float crystalScale;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      
      float hash(vec3 p) {
        p = fract(p * vec3(443.8975, 397.2973, 491.1871));
        p += dot(p, p.yxz + 19.19);
        return fract((p.x + p.y) * p.z);
      }
      
      float noise3D(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float n = mix(
          mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        
        return n;
      }
      
      float angularCracks(vec2 uv, float scale, float sharpness) {
        vec2 id = floor(uv * scale);
        vec2 f = fract(uv * scale);
        
        float d = 1.0;
        for(float x = -1.0; x <= 1.0; x++) {
          for(float y = -1.0; y <= 1.0; y++) {
            vec2 neighbor = vec2(x, y);
            vec2 point = hash(vec3(id + neighbor, 0.0)) * vec2(1.0) + neighbor;
            float dist = length(f - point);
            d = min(d, dist);
          }
        }
        
        return pow(1.0 - d, sharpness);
      }
      
      vec3 crystallineFacets(vec2 uv, float scale, vec3 baseNormal) {
        vec2 id = floor(uv * scale);
        vec2 f = fract(uv * scale);
        
        float crystalType = hash(vec3(id, 42.0));
        
        vec3 facetNormal = baseNormal;
        
        float angle1 = hash(vec3(id, 123.0)) * 6.28;
        float angle2 = hash(vec3(id, 456.0)) * 3.14;
        
        if(crystalType < 0.25) {
          float noise1 = hash(vec3(id, 789.0));
          float noise2 = hash(vec3(id, 234.0));
          float irregular1 = sin((f.x + noise1) * 8.0) * cos((f.y + noise2) * 6.0);
          
          vec3 perturbation = vec3(
            cos(angle1 + irregular1) * 0.15,
            sin(angle1 + irregular1) * 0.15,
            irregular1 * 0.1
          );
          
          facetNormal = normalize(baseNormal + perturbation);
          
        } else if(crystalType < 0.5) {
          float facet1 = sin(f.x * 12.0 + angle1) * 0.5 + 0.5;
          float facet2 = cos(f.y * 10.0 + angle2) * 0.5 + 0.5;
          float combined = facet1 * facet2;
          
          vec3 perturbation = vec3(
            (facet1 - 0.5) * 0.2,
            (facet2 - 0.5) * 0.2,
            combined * 0.15
          );
          
          facetNormal = normalize(baseNormal + perturbation);
          
        } else if(crystalType < 0.75) {
          float wave1 = sin((f.x + f.y) * 15.0 + angle1);
          float wave2 = cos((f.x - f.y) * 13.0 + angle2);
          float complex = wave1 * wave2 * 0.5 + 0.5;
          
          vec3 perturbation = vec3(
            wave1 * 0.12,
            wave2 * 0.12,
            complex * 0.08
          );
          
          facetNormal = normalize(baseNormal + perturbation);
          
        } else {
          float dist = length(f - vec2(0.5));
          float angleNoise = atan(f.y - 0.5, f.x - 0.5) + angle1;
          float fractal = sin(angleNoise * 7.0) * cos(dist * 20.0);
          
          vec3 perturbation = vec3(
            cos(angleNoise + fractal) * 0.18,
            sin(angleNoise + fractal) * 0.18,
            fractal * 0.1
          );
          
          facetNormal = normalize(baseNormal + perturbation);
        }
        
        return facetNormal;
      }
      
      void main() {
        vec3 baseNormal = normalize(vWorldNormal);
        
        vec3 normal = crystallineFacets(vUv, crystalScale, baseNormal);
        
        vec3 lightDir;
        if (length(lightPosition) > 0.0) {
          lightDir = normalize(lightPosition - vWorldPosition);
        } else {
          lightDir = normalize(-lightDirection);
        }
        
        float dotNL = dot(normal, lightDir);
        
        float dayNight = smoothstep(-0.3, 0.1, dotNL);
        
        float rimLight = 1.0 - abs(dotNL);
        rimLight = pow(rimLight, 3.0) * 0.1;
        
        vec3 color = metalColor;
        
        float surfaceNoise = noise3D(vPosition * noiseScale);
        color = mix(color, color * 0.7, surfaceNoise * noiseIntensity);
        
        float edgeFactor = 1.0 - abs(dotNL);
        float fragmentation = angularCracks(vUv, 5.0 + fragmentationIntensity * 10.0, 2.0);
        
        if(edgeFactor > 0.8) {
          color = mix(color, color * 0.5, fragmentation * edgeFactor * 0.3);
        }
        
        float radialWaves = sin(length(vUv - 0.5) * 20.0 + time * 0.5) * 0.5 + 0.5;
        color = mix(color, color * 1.1, radialWaves * 0.1 * (1.0 - edgeFactor));
        
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 halfwayDir = normalize(lightDir + viewDir);
        
        float NdotH = max(dot(normal, halfwayDir), 0.0);
        float specularStrength = pow(NdotH, mix(4.0, 128.0, 1.0 - roughness));
        vec3 specular = mix(vec3(0.04), color, metalness) * specularStrength;
        
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
        vec3 fresnelColor = mix(vec3(0.04), color, metalness) * fresnel;
        
        float totalLight = ambientStrength + (lightIntensity * dayNight) + rimLight;
        vec3 finalColor = color * totalLight;
        
        finalColor += (specular + fresnelColor * 0.5) * dayNight;
        
        finalColor = mix(finalColor, finalColor * 0.5, pow(surfaceNoise, 2.0) * 0.3);
        
        gl_FragColor = vec4(finalColor, opacity);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        metalColor: { value: params.color || new THREE.Color(0x808080) },
        metalness: { value: params.metalness || 0.8 },
        roughness: { value: params.roughness || 0.4 },
        fragmentationIntensity: { value: params.fragmentationIntensity || 0.5 },
        opacity: { value: params.opacity || 0.8 },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
        ambientStrength: { value: 0.15 },
        lightIntensity: { value: 0.85 },
        noiseScale: { value: params.noiseScale || 8.0 },
        noiseIntensity: { value: params.noiseIntensity || 0.3 },
        crystalScale: { value: params.crystalScale || 80.0 },
      },
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
      depthWrite: false,
    });
  }

  createIcyTerrainLayerMaterial(params: Record<string, unknown>): THREE.ShaderMaterial {
    const vertexShader = `
      uniform float rotationAngle;

      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUv;

      vec3 rotateY(vec3 p, float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
      }

      void main() {
        vec3 rotatedPosition = rotateY(position, -rotationAngle);
        vPosition = rotatedPosition;
        vNormal = normalMatrix * normal;
        vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = rotateY(worldPos.xyz, -rotationAngle);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 iceColor;
      uniform float iceReflectivity;
      uniform float frostDensity;
      uniform float crackIntensity;
      uniform float opacity;
      uniform float organicShapeIntensity;
      uniform vec3 lightDirection;
      uniform vec3 lightPosition;
      uniform float ambientStrength;
      uniform float lightIntensity;
      uniform float time;
      uniform float crystalScale;
      uniform float crystalDensity;
      uniform float crystalSharpness;
      uniform float frostPattern;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      
      float hash(vec3 p) {
        p = fract(p * vec3(443.8975, 397.2973, 491.1871));
        p += dot(p, p.yxz + 19.19);
        return fract((p.x + p.y) * p.z);
      }
      
      float noise3D(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float n = mix(
          mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        
        return n;
      }
      
      float iceCracks(vec3 p) {
        vec3 n = floor(p);
        vec3 f = fract(p);

        float minDist = 1.0;

        for(int i = -1; i <= 1; i++) {
          for(int j = -1; j <= 1; j++) {
            for(int k = -1; k <= 1; k++) {
              vec3 neighbor = vec3(float(i), float(j), float(k));
              vec3 point = neighbor + hash(n + neighbor) - f;
              float dist = length(point);
              minDist = min(minDist, dist);
            }
          }
        }

        return minDist;
      }
      
      float iceBubbles(vec3 p) {
        float bubbles = 0.0;
        
        bubbles += smoothstep(0.8, 1.0, noise3D(p * 8.0)) * 0.6;
        bubbles += smoothstep(0.9, 1.0, noise3D(p * 16.0 + vec3(100.0))) * 0.3;
        bubbles += smoothstep(0.95, 1.0, noise3D(p * 32.0 + vec3(200.0))) * 0.1;
        
        return bubbles;
      }
      
      void main() {
        vec3 normal = normalize(vWorldNormal);
        
        vec3 lightDir;
        if (length(lightPosition) > 0.0) {
          lightDir = normalize(lightPosition - vWorldPosition);
        } else {
          lightDir = normalize(-lightDirection);
        }
        
        float dotNL = dot(normal, lightDir);
        float dayNight = smoothstep(-0.3, 0.1, dotNL);
        
        float cracks = iceCracks(vWorldPosition * crackIntensity * 4.0);
        cracks = pow(cracks, 1.5);
        
        float scale1 = crystalScale * 0.8;
        float scale2 = crystalScale * 1.6; 
        float scale3 = crystalScale * 3.2;
        
        float microCrystals1 = noise3D(vWorldPosition * scale1);
        float microCrystals2 = noise3D(vWorldPosition * scale2);
        float microCrystals3 = noise3D(vWorldPosition * scale3);
        
        float crystals = microCrystals1 * 0.6 + microCrystals2 * 0.3 + microCrystals3 * 0.1;
        crystals = smoothstep(0.3, 0.3 + crystalDensity, crystals);
        
        float frost = noise3D(vWorldPosition * frostPattern);
        frost = smoothstep(0.6, 0.9, frost);
        
        vec3 baseIce = vec3(0.95, 0.97, 1.0);
        vec3 scratchColor = vec3(0.7, 0.8, 0.9);
        vec3 color = mix(scratchColor, baseIce, cracks);
        
        color = mix(color, vec3(0.98, 0.99, 1.0), crystals * 0.3);
        
        color = mix(color, vec3(1.0, 1.0, 1.0), frost * 0.4);
        
        float smoothLight = ambientStrength + (lightIntensity * dayNight);
        
        float backLight = max(0.0, -dotNL) * 0.25;
        float totalLight = smoothLight + backLight;
        
        vec3 finalColor = color * totalLight;
        
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float NdotH = max(dot(normal, halfwayDir), 0.0);
        
        float mainSpecular = pow(NdotH, 60.0) * iceReflectivity;
        mainSpecular *= (0.2 + 0.8 * cracks);
        
        float sharpness1 = crystalSharpness * 0.6;
        float sharpness2 = crystalSharpness * 1.0;
        float crystalSpecular1 = pow(NdotH, sharpness1) * crystals * iceReflectivity * 0.8;
        float crystalSpecular2 = pow(NdotH, sharpness2) * crystals * iceReflectivity * 0.4;
        
        float frostSpecular = pow(NdotH, 40.0) * frost * iceReflectivity * 0.6;
        
        vec3 specular = vec3(mainSpecular + crystalSpecular1 + crystalSpecular2 + frostSpecular);
        finalColor += specular * dayNight;
        
        float sparkle = smoothstep(0.8, 1.0, crystals) * smoothstep(0.9, 1.0, NdotH);
        finalColor += vec3(1.0, 1.0, 1.0) * sparkle * 0.5 * dayNight;
        
        float smoothVisibility = smoothstep(-0.5, 0.3, dotNL);
        float alpha = (0.5 + 0.3 * cracks + 0.2 * crystals) * smoothVisibility * opacity;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        rotationAngle: { value: 0 },
        iceColor: { value: params.color || new THREE.Color(0xb0e0e6) },
        iceReflectivity: { value: params.iceReflectivity || 0.8 },
        frostDensity: { value: params.frostDensity || 0.5 },
        crackIntensity: { value: params.crackIntensity || 0.4 },
        opacity: { value: params.opacity || 0.7 },
        crystalScale: { value: params.crystalScale || 25.0 },
        crystalDensity: { value: params.crystalDensity || 0.6 },
        crystalSharpness: { value: params.crystalSharpness || 150.0 },
        frostPattern: { value: params.frostPattern || 12.0 },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
        ambientStrength: { value: 0.15 },
        lightIntensity: { value: 0.85 },
      },
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    });
  }

  createAquiferWaterLayerMaterial(params: Record<string, unknown>): THREE.ShaderMaterial {
    const vertexShader = `
      uniform float time;
      uniform float waveHeight;
      uniform float waveFrequency;
      uniform float waveSpeed;
      uniform float seedOffset;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      varying float vWaveHeight;
      
      float random(vec3 st) {
        return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 54.321))) * 43758.5453123);
      }
      
      float noise(vec3 st) {
        vec3 i = floor(st);
        vec3 f = fract(st);
        
        f = f * f * (3.0 - 2.0 * f);
        
        float a = random(i);
        float b = random(i + vec3(1.0, 0.0, 0.0));
        float c = random(i + vec3(0.0, 1.0, 0.0));
        float d = random(i + vec3(1.0, 1.0, 0.0));
        float e = random(i + vec3(0.0, 0.0, 1.0));
        float f2 = random(i + vec3(1.0, 0.0, 1.0));
        float g = random(i + vec3(0.0, 1.0, 1.0));
        float h = random(i + vec3(1.0, 1.0, 1.0));
        
        return mix(
          mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
          mix(mix(e, f2, f.x), mix(g, h, f.x), f.y),
          f.z
        );
      }
      
      void main() {
        vPosition = position;
        vUv = uv;
        
        vec3 spherePos = normalize(position);
        
        float waveValue = 0.0;
        
        vec3 seedOffset3D = vec3(seedOffset, seedOffset * 0.7, seedOffset * 1.3);
        
        waveValue += (noise(spherePos * waveFrequency + seedOffset3D + vec3(time * waveSpeed * 0.3)) * 2.0 - 1.0) * 0.5;
        waveValue += (noise(spherePos * waveFrequency * 2.0 + seedOffset3D * 1.5 + vec3(time * waveSpeed * 0.5)) * 2.0 - 1.0) * 0.3;
        waveValue += (noise(spherePos * waveFrequency * 4.0 + seedOffset3D * 2.0 + vec3(time * waveSpeed * 0.2)) * 2.0 - 1.0) * 0.2;
        
        vWaveHeight = waveValue * waveHeight;
        
        vec3 newPosition = position + normal * vWaveHeight;
        
        vec3 modifiedNormal = normalize(normal + vec3(waveValue * 0.05, waveValue * 0.05, 0.0));
        vNormal = normalMatrix * modifiedNormal;
        vWorldNormal = normalize((modelMatrix * vec4(modifiedNormal, 0.0)).xyz);
        
        vec4 worldPos = modelMatrix * vec4(newPosition, 1.0);
        vWorldPosition = worldPos.xyz;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float time;
      uniform vec3 waterColor;
      uniform vec3 deepWaterColor;
      uniform vec3 foamColor;
      uniform float specularIntensity;
      uniform float transparency;
      uniform float roughness;
      
      uniform vec3 lightDirection;
      uniform vec3 lightPosition;
      uniform float ambientStrength;
      uniform float lightIntensity;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      varying float vWaveHeight;
      
      void main() {
        vec3 normal = normalize(vWorldNormal);
        
        vec3 lightDir;
        if (length(lightPosition) > 0.0) {
          lightDir = normalize(lightPosition - vWorldPosition);
        } else {
          lightDir = normalize(-lightDirection);
        }
        
        float dotNL = dot(normal, lightDir);
        float dayNight = smoothstep(-0.3, 0.1, dotNL);
        
        float rimLight = 1.0 - abs(dotNL);
        rimLight = pow(rimLight, 3.0) * 0.1;
        
        float depth = 1.0 - abs(vWaveHeight) * 2.0;
        vec3 baseColor = mix(deepWaterColor, waterColor, depth);
        
        float foamFactor = smoothstep(0.2, 0.4, vWaveHeight);
        baseColor = mix(baseColor, foamColor, foamFactor * 0.3);
        
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float NdotH = max(dot(normal, halfwayDir), 0.0);
        float specularStrength = pow(NdotH, mix(4.0, 128.0, 1.0 - roughness)) * specularIntensity;
        
        float totalLight = ambientStrength + (lightIntensity * dayNight) + rimLight;
        vec3 finalColor = baseColor * totalLight;
        
        finalColor += vec3(1.0, 1.0, 1.0) * specularStrength * dayNight;
        
        gl_FragColor = vec4(finalColor, transparency);
      }
    `;

    const waterColor = params.waterColor instanceof THREE.Color ? params.waterColor : new THREE.Color((params.waterColor as THREE.ColorRepresentation) || 0x2e8b8b);
    const deepWaterColor = params.deepWaterColor instanceof THREE.Color ? params.deepWaterColor : new THREE.Color((params.deepWaterColor as THREE.ColorRepresentation) || 0x003366);
    const foamColor = params.foamColor instanceof THREE.Color ? params.foamColor : new THREE.Color((params.foamColor as THREE.ColorRepresentation) || 0xffffff);

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        seedOffset: { value: ((params.seed as number) || 0) % 100 },
        waveHeight: { value: params.waveHeight || 0.08 },
        waveFrequency: { value: params.waveFrequency || 3.0 },
        waveSpeed: { value: params.waveSpeed || 0.5 },
        waterColor: { value: waterColor },
        deepWaterColor: { value: deepWaterColor },
        foamColor: { value: foamColor },
        specularIntensity: { value: params.specularIntensity || 3.0 },
        transparency: { value: params.transparency || 0.6 },
        roughness: { value: params.roughness || 0.1 },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
        ambientStrength: { value: 0.15 },
        lightIntensity: { value: 0.85 },
      },
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
      depthWrite: false,
    });
  }

  createOceanCurrentsLayerMaterial(params: Record<string, unknown>): THREE.ShaderMaterial {
    const vertexShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      
      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vUv = uv;
        
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float time;
      uniform vec3 currentColor;
      uniform vec3 deepCurrentColor;
      uniform float currentIntensity;
      uniform float currentScale;
      uniform float currentSpeed;
      uniform float secondaryCurrentIntensity;
      uniform float secondaryCurrentScale;
      uniform float secondaryCurrentSpeed;
      uniform float opacity;
      uniform float seedOffset;
      
      uniform vec3 lightDirection;
      uniform vec3 lightPosition;
      uniform float ambientStrength;
      uniform float lightIntensity;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      
      float random(vec3 st) {
        return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 54.321))) * 43758.5453123);
      }
      
      float noise(vec3 st) {
        vec3 i = floor(st);
        vec3 f = fract(st);
        
        f = f * f * (3.0 - 2.0 * f);
        
        float a = random(i);
        float b = random(i + vec3(1.0, 0.0, 0.0));
        float c = random(i + vec3(0.0, 1.0, 0.0));
        float d = random(i + vec3(1.0, 1.0, 0.0));
        float e = random(i + vec3(0.0, 0.0, 1.0));
        float f2 = random(i + vec3(1.0, 0.0, 1.0));
        float g = random(i + vec3(0.0, 1.0, 1.0));
        float h = random(i + vec3(1.0, 1.0, 1.0));
        
        return mix(
          mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
          mix(mix(e, f2, f.x), mix(g, h, f.x), f.y),
          f.z
        );
      }
      
      float fbm(vec3 p) {
        float value = 0.0;
        float amplitude = 0.5;
        
        for (int i = 0; i < 4; i++) {
          value += amplitude * noise(p);
          p *= 2.0;
          amplitude *= 0.5;
        }
        
        return value;
      }
      
      void main() {
        vec3 normal = normalize(vWorldNormal);
        
        vec3 lightDir;
        if (length(lightPosition) > 0.0) {
          lightDir = normalize(lightPosition - vWorldPosition);
        } else {
          lightDir = normalize(-lightDirection);
        }
        
        float dotNL = dot(normal, lightDir);
        float dayNight = smoothstep(-0.3, 0.1, dotNL);
        
        vec3 spherePos = normalize(vPosition);
        
        vec3 seedOffset3D = vec3(seedOffset, seedOffset * 0.7, seedOffset * 1.3);
        
        float currentPattern = 0.0;
        
        currentPattern += fbm(spherePos * currentScale + seedOffset3D + vec3(time * currentSpeed * 0.1)) * currentIntensity;
        
        currentPattern += fbm(spherePos * secondaryCurrentScale + seedOffset3D * 1.5 + vec3(time * secondaryCurrentSpeed * 0.15)) * secondaryCurrentIntensity;
        
        currentPattern += fbm(spherePos * currentScale * 3.0 + seedOffset3D * 2.0 + vec3(time * currentSpeed * 0.05)) * 0.2;
        
        currentPattern = (currentPattern * 2.0 - 1.0) * 0.5 + 0.5;
        currentPattern = smoothstep(0.3, 0.7, currentPattern);
        
        vec3 baseColor = mix(deepCurrentColor, currentColor, currentPattern);
        
        float totalLight = ambientStrength + (lightIntensity * dayNight * 0.3);
        vec3 finalColor = baseColor * totalLight;
        
        float alpha = currentPattern * opacity;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    const currentColor = params.currentColor instanceof THREE.Color ? params.currentColor : new THREE.Color((params.currentColor as THREE.ColorRepresentation) || 0x4a9b8e);
    const deepCurrentColor = params.deepCurrentColor instanceof THREE.Color ? params.deepCurrentColor : new THREE.Color((params.deepCurrentColor as THREE.ColorRepresentation) || 0x2d5d52);

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        seedOffset: { value: ((params.seed as number) || 0) % 100 },
        currentIntensity: { value: params.currentIntensity || 0.5 },
        currentScale: { value: params.currentScale || 2.0 },
        currentSpeed: { value: params.currentSpeed || 0.2 },
        secondaryCurrentIntensity: { value: params.secondaryCurrentIntensity || 0.3 },
        secondaryCurrentScale: { value: params.secondaryCurrentScale || 3.0 },
        secondaryCurrentSpeed: { value: params.secondaryCurrentSpeed || 0.15 },
        currentColor: { value: currentColor },
        deepCurrentColor: { value: deepCurrentColor },
        opacity: { value: params.opacity || 0.25 },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
        ambientStrength: { value: 0.15 },
        lightIntensity: { value: 0.85 },
      },
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
      depthWrite: false,
    });
  }

  addToScene(scene: THREE.Scene): void {
    this.scene = scene;

    this.effectLayers.forEach((layer) => {
      if (layer.mesh) {
        scene.add(layer.mesh);
      }
    });
  }

  update(deltaTime: number, planetRotation?: number): void {
    this.effectLayers.forEach((layer) => {
      if (layer.material.uniforms.time) {
        layer.material.uniforms.time.value += deltaTime;
      }
      if (planetRotation !== undefined && layer.material.uniforms.rotationAngle) {
        layer.material.uniforms.rotationAngle.value = planetRotation;
      }

      if (layer.layerObject && typeof layer.layerObject === "object" && layer.layerObject !== null && "update" in layer.layerObject) {
        try {
          (layer.layerObject as { update: (deltaTime: number, planetRotation?: number) => void }).update(deltaTime, planetRotation);
        } catch (error) {}
      }

      if (layer.mesh && planetRotation !== undefined) {
        layer.mesh.rotation.y = planetRotation;
      }
    });
  }

  updateBaseColor(color: THREE.Color | THREE.ColorRepresentation): void {
    const newColor = color instanceof THREE.Color ? color : new THREE.Color(color);
    this.baseMaterial.uniforms.baseColor.value = newColor;
  }

  updateLightDirection(direction: THREE.Vector3): void {
    this.baseMaterial.uniforms.lightDirection.value = direction.clone().normalize();

    this.effectLayers.forEach((layer) => {
      if (layer.material.uniforms.lightDirection) {
        layer.material.uniforms.lightDirection.value = direction.clone().normalize();
      }
    });
  }

  updateLightPosition(position: THREE.Vector3): void {
    this.baseMaterial.uniforms.lightPosition.value = position.clone();

    this.effectLayers.forEach((layer) => {
      if (layer.material.uniforms.lightPosition) {
        layer.material.uniforms.lightPosition.value = position.clone();
      }
    });
  }

  updateFromThreeLight(light: THREE.DirectionalLight): void {
    this.updateLightPosition(light.position);

    const direction = light.target.position.clone().sub(light.position).normalize();
    this.updateLightDirection(direction);

    if (this.baseMaterial.uniforms.lightIntensity) {
      this.baseMaterial.uniforms.lightIntensity.value = light.intensity;
    }

    if (this.baseMaterial.uniforms.ambientStrength) {
      const normalizedIntensity = Math.min(1.0, light.intensity / 3.0);
      const minAmbient = 0.02;
      const maxAmbient = 0.15;
      this.baseMaterial.uniforms.ambientStrength.value = minAmbient + normalizedIntensity * (maxAmbient - minAmbient);
    }
  }

  applyHoleShader(holeShader: THREE.ShaderMaterial): void {
    if (!this.originalBaseMaterial) {
      this.originalBaseMaterial = this.baseMaterial.clone();
    }

    if (this.baseMaterial) {
      this.baseMaterial.dispose();
    }

    this.baseMaterial = holeShader;
    this.baseMesh.material = holeShader;
  }

  restoreOriginalMaterial(): void {
    if (this.originalBaseMaterial) {
      if (this.baseMaterial) {
        this.baseMaterial.dispose();
      }

      this.baseMaterial = this.originalBaseMaterial.clone();
      this.baseMesh.material = this.baseMaterial;
    }
  }

  createGenericLayerMaterial(vertexShader: string, fragmentShader: string, uniforms: { [uniform: string]: THREE.IUniform<any> }, transparent: boolean = true, blending: THREE.Blending = THREE.NormalBlending): THREE.ShaderMaterial {
    if (!uniforms.lightDirection) {
      uniforms.lightDirection = { value: new THREE.Vector3(1, 1, 1).normalize() };
    }
    if (!uniforms.lightPosition) {
      uniforms.lightPosition = { value: new THREE.Vector3(0, 0, 0) };
    }

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent,
      blending,
      side: THREE.FrontSide,
      depthWrite: false,
    });
  }

  convertEffectToLayer(effectName: string, originalMaterial: THREE.Material | THREE.ShaderMaterial, scaleFactor: number = 1.001): THREE.Mesh | null {
    if (originalMaterial instanceof THREE.ShaderMaterial) {
      const layerMaterial = originalMaterial.clone();
      layerMaterial.transparent = true;
      layerMaterial.depthWrite = false;

      if (!layerMaterial.uniforms.lightDirection) {
        layerMaterial.uniforms.lightDirection = {
          value: new THREE.Vector3(1, 1, 1).normalize(),
        };
      }

      return this.addEffectLayer(effectName, layerMaterial, scaleFactor);
    }

    return null;
  }

  createDiamondSurfaceLayerMaterial(params: Record<string, unknown>): THREE.ShaderMaterial {
    const vertexShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      
      void main() {
        vPosition = position;
        vNormal = normalMatrix * normal;
        vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 diamondColor;
      uniform float refractionIndex;
      uniform float dispersion;
      uniform float clarity;
      uniform float facetSize;
      uniform float brilliance;
      uniform float opacity;
      uniform float prismaticIntensity;
      uniform float iridescenceIntensity;
      uniform float iridescenceRange;
      uniform float iridescenceSpeed;
      uniform float iridescenceScale;
      uniform float time;
      uniform vec3 lightDirection;
      uniform vec3 lightPosition;
      uniform float ambientStrength;
      uniform float lightIntensity;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      
      float hash(vec3 p) {
        p = fract(p * vec3(443.8975, 397.2973, 491.1871));
        p += dot(p, p.yxz + 19.19);
        return fract((p.x + p.y) * p.z);
      }
      
      vec3 diamondFacets(vec2 uv, float scale, vec3 baseNormal) {
        vec2 scaledUv = uv * scale;
        vec2 id = floor(scaledUv);
        vec2 f = fract(scaledUv);
        
        float facetType = hash(vec3(id, 42.0));
        vec3 facetNormal = baseNormal;
        
        vec2 center = vec2(0.5);
        vec2 toCenter = f - center;
        float dist = length(toCenter);
        float angle = atan(toCenter.y, toCenter.x);
        
        if(facetType < 0.33) {
          float hexAngle = floor(angle * 3.0 / 3.14159) * 3.14159 / 3.0;
          vec3 perturbation = vec3(
            cos(hexAngle) * dist * 0.8,
            sin(hexAngle) * dist * 0.8,
            (1.0 - dist) * 0.6
          );
          facetNormal = normalize(baseNormal + perturbation);
          
        } else if(facetType < 0.66) {
          float octAngle = floor(angle * 4.0 / 3.14159) * 3.14159 / 4.0;
          vec3 perturbation = vec3(
            cos(octAngle) * dist * 0.9,
            sin(octAngle) * dist * 0.9,
            cos(dist * 6.28) * 0.5
          );
          facetNormal = normalize(baseNormal + perturbation);
          
        } else {
          float triAngle = floor(angle * 6.0 / 3.14159) * 3.14159 / 6.0;
          float triPattern = sin(triAngle * 3.0) * cos(dist * 8.0);
          vec3 perturbation = vec3(
            cos(triAngle) * triPattern * 0.7,
            sin(triAngle) * triPattern * 0.7,
            triPattern * 0.4
          );
          facetNormal = normalize(baseNormal + perturbation);
        }
        
        return facetNormal;
      }
      
      vec3 chromaticDispersion(vec3 direction, vec3 normal, float dispersionAmount) {
        float eta_r = 1.0 / (refractionIndex - dispersionAmount * 0.01);
        float eta_g = 1.0 / refractionIndex;
        float eta_b = 1.0 / (refractionIndex + dispersionAmount * 0.01);
        
        vec3 refracted_r = refract(direction, normal, eta_r);
        vec3 refracted_g = refract(direction, normal, eta_g);
        vec3 refracted_b = refract(direction, normal, eta_b);
        
        return vec3(
          length(refracted_r),
          length(refracted_g),
          length(refracted_b)
        );
      }
      
      vec3 calculateIridescence(vec3 viewDir, vec3 normal, vec3 worldPos) {
        float fresnel = 1.0 - abs(dot(normal, viewDir));
        
        float spatialVariation = sin(worldPos.x * iridescenceScale) * 
                                cos(worldPos.y * iridescenceScale * 0.8) * 
                                sin(worldPos.z * iridescenceScale * 1.2);
        
        float timeVariation = sin(time * iridescenceSpeed) * 0.5 + 0.5;
        
        float colorShift = (spatialVariation * 0.7 + timeVariation * 0.3) * iridescenceRange;
        
        float anglePhase = fresnel * 6.28318;
        
        vec3 iridColor = vec3(
          sin(anglePhase + colorShift) * 0.5 + 0.5,
          sin(anglePhase + colorShift + 2.094) * 0.5 + 0.5,
          sin(anglePhase + colorShift + 4.188) * 0.5 + 0.5
        );
        
        float edgeIntensity = pow(fresnel, 2.0);
        
        return iridColor * edgeIntensity * iridescenceIntensity;
      }
      
      void main() {
        vec3 baseNormal = normalize(vWorldNormal);
        
        vec3 normal = diamondFacets(vUv, facetSize, baseNormal);
        
        vec3 lightDir;
        if (length(lightPosition) > 0.0) {
          lightDir = normalize(lightPosition - vWorldPosition);
        } else {
          lightDir = normalize(-lightDirection);
        }
        
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        
        float dotNL = dot(normal, lightDir);
        float dayNight = smoothstep(-0.3, 0.1, dotNL);
        float rimLight = 1.0 - abs(dotNL);
        rimLight = pow(rimLight, 3.0) * 0.1;
        
        vec3 color = diamondColor;
        
        vec3 dispersedColor = chromaticDispersion(-viewDir, normal, dispersion * 10.0);
        vec3 prismaticColors = vec3(
          sin(dispersedColor.r * 15.0) * 0.5 + 0.5,
          sin(dispersedColor.g * 12.0) * 0.5 + 0.5,
          sin(dispersedColor.b * 18.0) * 0.5 + 0.5
        );
        
        color = mix(color, prismaticColors, prismaticIntensity * clarity * 0.7);
        
        vec3 iridescence = calculateIridescence(viewDir, normal, vWorldPosition);
        color = mix(color, color + iridescence, clarity * dayNight);
        
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float NdotH = max(dot(normal, halfwayDir), 0.0);
        float specularPower = mix(32.0, 256.0, brilliance / 3.0);
        float specularStrength = pow(NdotH, specularPower) * brilliance;
        
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
        vec3 internalReflections = vec3(1.0) * fresnel * clarity;
        
        vec3 refractedDir = refract(-viewDir, normal, 1.0 / refractionIndex);
        float refractionEffect = length(refractedDir) * clarity;
        
        vec3 refractionTint = vec3(0.9, 0.95, 1.1);
        color = mix(color, color * refractionTint, refractionEffect * 0.3);
        
        float totalLight = ambientStrength + (lightIntensity * dayNight) + rimLight;
        vec3 finalColor = color * totalLight;
        
        vec3 diamondSparkle = vec3(specularStrength);
        finalColor += diamondSparkle * dayNight;
        
        finalColor += internalReflections * 0.2 * dayNight;
        
        float sparkle = sin(dot(normal, viewDir) * facetSize * 2.0) * 0.5 + 0.5;
        finalColor += vec3(sparkle * brilliance * 0.1) * dayNight;
        
        float finalOpacity = opacity * clarity;
        
        gl_FragColor = vec4(finalColor, finalOpacity);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        diamondColor: { value: params.color || new THREE.Color(0x808080) },
        refractionIndex: { value: params.refractionIndex || 2.42 },
        dispersion: { value: params.dispersion || 0.5 },
        clarity: { value: params.clarity || 0.8 },
        facetSize: { value: params.facetSize !== undefined ? params.facetSize : 15.0 },
        brilliance: { value: params.brilliance || 2.0 },
        opacity: { value: params.opacity || 0.9 },
        prismaticIntensity: { value: params.prismaticIntensity || 0.6 },
        iridescenceIntensity: { value: params.iridescenceIntensity || 0.5 },
        iridescenceRange: { value: params.iridescenceRange || 1.0 },
        iridescenceSpeed: { value: params.iridescenceSpeed || 0.3 },
        iridescenceScale: { value: params.iridescenceScale || 1.5 },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
        ambientStrength: { value: 0.15 },
        lightIntensity: { value: 0.85 },
      },
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  createMoltenLavaLayerMaterial(params: Record<string, unknown>): THREE.ShaderMaterial {
    const vertexShader = `
      uniform float time;
      uniform float lavaWaveHeight;
      uniform float lavaWaveFrequency;
      uniform float lavaWaveSpeed;
      uniform float seedOffset;
      uniform float viscosity;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      varying float vLavaHeight;
      
      float random(vec3 st) {
        return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 54.321))) * 43758.5453123);
      }
      
      float noise(vec3 st) {
        vec3 i = floor(st);
        vec3 f = fract(st);
        
        f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
        
        float a = random(i);
        float b = random(i + vec3(1.0, 0.0, 0.0));
        float c = random(i + vec3(0.0, 1.0, 0.0));
        float d = random(i + vec3(1.0, 1.0, 0.0));
        float e = random(i + vec3(0.0, 0.0, 1.0));
        float f2 = random(i + vec3(1.0, 0.0, 1.0));
        float g = random(i + vec3(0.0, 1.0, 1.0));
        float h = random(i + vec3(1.0, 1.0, 1.0));
        
        return mix(
          mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
          mix(mix(e, f2, f.x), mix(g, h, f.x), f.y),
          f.z
        );
      }
      
      void main() {
        vPosition = position;
        vUv = uv;
        
        vec3 spherePos = normalize(position);
        
        float lavaValue = 0.0;
        
        vec3 seedOffset3D = vec3(seedOffset, seedOffset * 0.7, seedOffset * 1.3);
        
        lavaValue += (noise(spherePos * lavaWaveFrequency + seedOffset3D + vec3(time * lavaWaveSpeed * 0.1)) * 2.0 - 1.0) * 0.6;
        lavaValue += (noise(spherePos * lavaWaveFrequency * 1.8 + seedOffset3D * 1.5 + vec3(time * lavaWaveSpeed * 0.05)) * 2.0 - 1.0) * 0.3;
        lavaValue += (noise(spherePos * lavaWaveFrequency * 3.2 + seedOffset3D * 2.0 + vec3(time * lavaWaveSpeed * 0.03)) * 2.0 - 1.0) * 0.1;
        
        vLavaHeight = lavaValue * lavaWaveHeight * viscosity;
        
        vec3 newPosition = position + normal * vLavaHeight;
        
        vec3 modifiedNormal = normalize(normal + vec3(lavaValue * 0.02, lavaValue * 0.02, 0.0));
        vNormal = normalMatrix * modifiedNormal;
        vWorldNormal = normalize((modelMatrix * vec4(modifiedNormal, 0.0)).xyz);
        
        vec4 worldPos = modelMatrix * vec4(newPosition, 1.0);
        vWorldPosition = worldPos.xyz;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float time;
      uniform vec3 moltenColor;
      uniform vec3 coreColor;
      uniform vec3 coolingColor;
      uniform float emissiveIntensity;
      uniform float glowIntensity;
      uniform float temperature;
      uniform float lavaRoughness;
      
      uniform vec3 lightDirection;
      uniform vec3 lightPosition;
      uniform float ambientStrength;
      uniform float lightIntensity;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      varying float vLavaHeight;
      
      float random3D(vec3 st) {
        return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 54.321))) * 43758.5453123);
      }

      float noise3D(vec3 st) {
        vec3 i = floor(st);
        vec3 f = fract(st);

        f = f * f * (3.0 - 2.0 * f);

        float a = random3D(i);
        float b = random3D(i + vec3(1.0, 0.0, 0.0));
        float c = random3D(i + vec3(0.0, 1.0, 0.0));
        float d = random3D(i + vec3(1.0, 1.0, 0.0));
        float e = random3D(i + vec3(0.0, 0.0, 1.0));
        float f2 = random3D(i + vec3(1.0, 0.0, 1.0));
        float g = random3D(i + vec3(0.0, 1.0, 1.0));
        float h = random3D(i + vec3(1.0, 1.0, 1.0));

        return mix(
          mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
          mix(mix(e, f2, f.x), mix(g, h, f.x), f.y),
          f.z
        );
      }

      float fbm3D(vec3 st) {
        float value = 0.0;
        float amplitude = 0.5;

        for (int i = 0; i < 5; i++) {
          value += amplitude * noise3D(st);
          st *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }
      
      void main() {
        vec3 normal = normalize(vWorldNormal);
        
        vec3 lightDir;
        if (length(lightPosition) > 0.0) {
          lightDir = normalize(lightPosition - vWorldPosition);
        } else {
          lightDir = normalize(-lightDirection);
        }
        
        float dotNL = dot(normal, lightDir);
        float dayNight = smoothstep(-0.3, 0.1, dotNL);
        
        float rimLight = 1.0 - abs(dotNL);
        rimLight = pow(rimLight, 3.0) * 0.1;
        
        vec3 lavaPos = vWorldPosition;
        vec3 flowDirection = vec3(time * 0.02, time * 0.01, 0.0);

        float lavaTexture1 = fbm3D(lavaPos * 4.0 + flowDirection);
        float lavaTexture2 = fbm3D(lavaPos * 8.0 + vec3(time * 0.03, time * 0.02, 0.0));
        float lavaTexture3 = fbm3D(lavaPos * 16.0 + vec3(time * 0.05, time * 0.03, 0.0));
        
        float combinedTexture = lavaTexture1 * 0.5 + lavaTexture2 * 0.3 + lavaTexture3 * 0.2;
        
        float temperaturePulse = sin(time * 0.2) * 0.5 + 0.5;
        float heatIntensity = combinedTexture + temperaturePulse * 0.2 + temperature * 0.3;
        
        vec3 baseColor;
        if (heatIntensity > 0.8) {
          baseColor = mix(moltenColor, coreColor, (heatIntensity - 0.8) / 0.2);
        } else if (heatIntensity > 0.5) {
          baseColor = mix(coolingColor, moltenColor, (heatIntensity - 0.5) / 0.3);
        } else {
          baseColor = coolingColor * (0.4 + heatIntensity * 0.6);
        }
        
        float elevationFactor = 1.0 + abs(vLavaHeight) * 3.0;
        baseColor = mix(baseColor, coreColor, elevationFactor * 0.2);
        
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float NdotH = max(dot(normal, halfwayDir), 0.0);
        float specularStrength = pow(NdotH, mix(2.0, 8.0, 1.0 - lavaRoughness)) * glowIntensity * 0.5;
        
        float totalLight = ambientStrength + (lightIntensity * dayNight) + rimLight;
        vec3 finalColor = baseColor * totalLight;
        
        finalColor += vec3(1.0, 0.8, 0.6) * specularStrength * dayNight;
        
        vec3 emissive = baseColor * emissiveIntensity * (0.6 + temperaturePulse * 0.4) * heatIntensity;
        
        float emissiveFactor = mix(0.22, 1.0, dayNight);
        
        finalColor += emissive * emissiveFactor;
        
        float alpha = 0.8 + heatIntensity * 0.2;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    const moltenColor = params.moltenColor instanceof THREE.Color ? params.moltenColor : new THREE.Color((params.moltenColor as THREE.ColorRepresentation) || 0xff8c00);
    const coreColor = params.coreColor instanceof THREE.Color ? params.coreColor : new THREE.Color((params.coreColor as THREE.ColorRepresentation) || 0xffb347);
    const coolingColor = params.coolingColor instanceof THREE.Color ? params.coolingColor : new THREE.Color((params.coolingColor as THREE.ColorRepresentation) || 0xcc4400);

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        seedOffset: { value: ((params.seed as number) || 0) % 100 },
        lavaWaveHeight: { value: params.lavaWaveHeight || 0.04 },
        lavaWaveFrequency: { value: params.lavaWaveFrequency || 2.0 },
        lavaWaveSpeed: { value: params.lavaWaveSpeed || 0.05 },
        viscosity: { value: params.viscosity || 0.8 },
        moltenColor: { value: moltenColor },
        coreColor: { value: coreColor },
        coolingColor: { value: coolingColor },
        emissiveIntensity: { value: params.emissiveIntensity || 4.0 },
        glowIntensity: { value: params.glowIntensity || 3.0 },
        temperature: { value: params.temperature || 0.9 },
        lavaRoughness: { value: params.lavaRoughness || 0.8 },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
        ambientStrength: { value: 0.15 },
        lightIntensity: { value: 0.85 },
      },
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
      depthWrite: false,
    });
  }

  getNextScaleFactor(): number {
    const baseScale = 1.001;
    const increment = 0.001;
    return baseScale + this.effectLayers.length * increment;
  }

  getLayerMeshes(): Record<string, THREE.Mesh | undefined> {
    const meshes: Record<string, THREE.Mesh | undefined> = {};
    this.effectLayers.forEach((layer) => {
      if (layer.name && layer.mesh) {
        meshes[layer.name] = layer.mesh;
      }
    });
    return meshes;
  }

  dispose(): void {
    this.baseMaterial.dispose();

    this.effectLayers.forEach((layer) => {
      if (layer.mesh) {
        layer.mesh.geometry.dispose();
        if (this.scene) {
          this.scene.remove(layer.mesh);
        }
      }
      layer.material.dispose();
    });
  }
}
