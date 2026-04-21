// atlas-ui/react/static/js/3DEffects/MagmaFlowsEffect.tsx

import * as THREE from "three";
import { SeededRandom } from "../Utils/SeededRandom.tsx";
import { getUniverseTime, DEFAULT_COSMIC_ORIGIN_TIME } from "../Utils/UniverseTime";

export interface MagmaFlowsParams {
  magmaLakes?: any[];
  seed?: number;
  heatIntensity?: number;
  flowSpeed?: number;
  bubbleActivity?: number;
  glowIntensity?: number;
  cosmicOriginTime?: number;
  timeSpeed?: number;
}

const PROCEDURAL_RANGES = {
  LAKE_COUNT: { min: 8, max: 12 },
  LAKE_SIZE: { min: 0.15, max: 0.55 },
  LAKE_SIZE_VARIATION: { min: 0.6, max: 1.4 },
  HEAT_INTENSITY: { min: 0.8, max: 1.5 },
  FLOW_SPEED: { min: 0.002, max: 0.008 },
  BUBBLE_ACTIVITY: { min: 0.6, max: 1.0 },
  GLOW_INTENSITY: { min: 0.8, max: 1.0 },
  TIME_SPEED: { min: 0.1, max: 0.3 },
  SHAPE_COMPLEXITY: { min: 3, max: 8 },
  SHAPE_IRREGULARITY: { min: 0.2, max: 0.6 },
};

export class MagmaFlowsEffect {
  private magmaGroup: THREE.Group;
  private magmaLakes: THREE.Mesh[] = [];
  private magmaFlows: THREE.Mesh[] = [];
  private params: MagmaFlowsParams;
  private cosmicOriginTime: number;
  private cosmicOffset: number;

  private static readonly magmaVertexShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    
    uniform float time;
    uniform float timeSpeed;
    uniform float flowSpeed;
    
    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      
      vec3 pos = position;
      float slowTime = time * timeSpeed;
      
      float localRadius = length(pos.xy);
      float localAngle = atan(pos.y, pos.x);
      
      float radialFlow = sin(slowTime * 0.8 + localAngle * 4.0) * flowSpeed * 0.3;
      float angularFlow = cos(slowTime * 0.6 + localRadius * 20.0) * flowSpeed * 0.2;
      
      if (localRadius > 0.0) {
        vec2 radialDir = normalize(pos.xy);
        pos.xy += radialDir * radialFlow;
      }
      
      vec2 tangentialDir = vec2(-sin(localAngle), cos(localAngle));
      pos.xy += tangentialDir * angularFlow;
      
      float bubbleHeight = sin(slowTime * 1.5 + localRadius * 15.0 + localAngle * 3.0) * flowSpeed * 0.05;
      pos.z += bubbleHeight;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  private static readonly magmaFragmentShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    
    uniform float time;
    uniform float heatIntensity;
    uniform float bubbleActivity;
    uniform float glowIntensity;
    uniform vec3 magmaColor;
    uniform vec3 lightDirection;
    uniform vec3 lightPosition;
    uniform float flowSpeed;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    
    void main() {
      vec2 magmaUv1 = vUv * 4.0 + time * flowSpeed * vec2(0.5, 0.2);
      vec2 magmaUv2 = vUv * 7.0 + time * flowSpeed * vec2(-0.3, 0.4);
      vec2 magmaUv3 = vUv * 12.0 + time * flowSpeed * vec2(0.2, -0.6);
      vec2 magmaUv4 = vUv * 20.0 + time * flowSpeed * vec2(-0.1, 0.3);
      
      float magmaNoise1 = fbm(magmaUv1);
      float magmaNoise2 = fbm(magmaUv2);
      float magmaNoise3 = fbm(magmaUv3) * 0.5;
      float detailNoise = fbm(magmaUv4) * 0.3;
      
      vec2 flowDir = normalize(vUv - vec2(0.5));
      float flowPattern = fbm(vUv * 8.0 + flowDir * time * flowSpeed * 2.0) * 0.4;
      
      float combinedNoise = magmaNoise1 * 0.4 + magmaNoise2 * 0.25 + magmaNoise3 * 0.15 + detailNoise * 0.1 + flowPattern * 0.1;
      
      vec3 baseColor = magmaColor;
      
      float heatVariation = combinedNoise * heatIntensity;
      
      vec3 veryHotMagma = vec3(1.4, 1.0, 0.6);
      vec3 hotMagma = vec3(1.2, 0.8, 0.3);
      vec3 warmMagma = vec3(1.0, 0.5, 0.1);
      vec3 mediumMagma = vec3(0.9, 0.3, 0.05);
      vec3 coolMagma = vec3(0.7, 0.15, 0.0);
      vec3 coldMagma = vec3(0.4, 0.08, 0.0);
      
      vec3 finalColor = baseColor;
      
      if (heatVariation > 0.85) {
        finalColor = mix(finalColor, veryHotMagma, (heatVariation - 0.85) * 6.0);
      } else if (heatVariation > 0.65) {
        finalColor = mix(finalColor, hotMagma, (heatVariation - 0.65) * 4.0);
      } else if (heatVariation > 0.45) {
        finalColor = mix(finalColor, warmMagma, (heatVariation - 0.45) * 3.0);
      } else if (heatVariation > 0.25) {
        finalColor = mix(finalColor, mediumMagma, (heatVariation - 0.25) * 2.5);
      } else if (heatVariation > 0.1) {
        finalColor = mix(finalColor, coolMagma, (heatVariation - 0.1) * 2.0);
      } else {
        finalColor = mix(finalColor, coldMagma, (0.1 - heatVariation) * 3.0);
      }
      
      float flowTemperature = flowPattern * 0.3;
      if (flowTemperature > 0.15) {
        finalColor = mix(finalColor, hotMagma, flowTemperature);
      }
      
      float bubblePattern1 = sin(vUv.x * 18.0 + time * 3.2) * sin(vUv.y * 22.0 + time * 2.8);
      float bubblePattern2 = sin(vUv.x * 35.0 + time * 4.1) * sin(vUv.y * 28.0 + time * 3.5);
      float bubbleNoise1 = noise(vUv * 30.0 + time * 1.2) * bubbleActivity;
      float bubbleNoise2 = noise(vUv * 45.0 + time * 0.6) * bubbleActivity * 0.7;
      
      if (bubblePattern1 * bubbleNoise1 > 0.35) {
        finalColor = mix(finalColor, veryHotMagma, 0.5);
      }
      
      if (bubblePattern2 * bubbleNoise2 > 0.4) {
        finalColor = mix(finalColor, hotMagma, 0.3);
      }
      
      float convectionPattern = fbm(vUv * 6.0 + time * flowSpeed * 0.5);
      if (convectionPattern > 0.6) {
        finalColor = mix(finalColor, warmMagma, 0.2);
      }
      
      vec3 lightDir;
      if (length(lightPosition) > 0.0) {
        lightDir = normalize(lightPosition - vWorldPosition);
      } else {
        lightDir = normalize(-lightDirection);
      }
      
      vec3 normal = normalize(vWorldNormal);
      float dotNL = dot(normal, lightDir);
      
      float dayNight = smoothstep(-0.3, 0.1, dotNL);
      
      float rimLight = 1.0 - abs(dotNL);
      rimLight = pow(rimLight, 3.0) * 0.1;
      
      float ambientStrength = 0.6;
      float lightIntensity = 0.4;
      
      float totalLight = ambientStrength + (lightIntensity * dayNight) + rimLight;
      
      float emission = glowIntensity * (0.8 + heatVariation * 0.4);
      
      finalColor *= totalLight;
      finalColor += finalColor * emission * 0.3;
      
      float alpha = 0.95;
      
      float distance = length(vUv - vec2(0.5));
      alpha *= smoothstep(0.5, 0.3, distance);
      
      alpha *= 0.9 + heatVariation * 0.1;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  constructor(planetRadius: number, params: MagmaFlowsParams = {}) {
    const seed = params.seed || 123456789;
    this.cosmicOriginTime = params.cosmicOriginTime || 514080000;
    this.cosmicOffset = (seed % 3600) * 10;

    const rng = new SeededRandom(seed);

    this.params = {
      heatIntensity: params.heatIntensity || rng.uniform(PROCEDURAL_RANGES.HEAT_INTENSITY.min, PROCEDURAL_RANGES.HEAT_INTENSITY.max),
      flowSpeed: params.flowSpeed || rng.uniform(PROCEDURAL_RANGES.FLOW_SPEED.min, PROCEDURAL_RANGES.FLOW_SPEED.max),
      bubbleActivity: params.bubbleActivity || rng.uniform(PROCEDURAL_RANGES.BUBBLE_ACTIVITY.min, PROCEDURAL_RANGES.BUBBLE_ACTIVITY.max),
      glowIntensity: params.glowIntensity || rng.uniform(PROCEDURAL_RANGES.GLOW_INTENSITY.min, PROCEDURAL_RANGES.GLOW_INTENSITY.max),
      timeSpeed: params.timeSpeed || rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),
      seed,
      cosmicOriginTime: this.cosmicOriginTime,
      magmaLakes: params.magmaLakes || [],
    };

    this.magmaGroup = new THREE.Group();
    this.generateMagmaFlows(planetRadius);
  }

  private generateMagmaFlows(planetRadius: number): void {
    const seed = this.params.seed || 123456789;
    const rng = new SeededRandom(seed);

    const magmaLakes = this.params.magmaLakes;

    if (magmaLakes && magmaLakes.length > 0) {
      this.generateMagmaFromPython(planetRadius, magmaLakes, rng);
    } else {
      const lakeCount = Math.floor(rng.uniform(PROCEDURAL_RANGES.LAKE_COUNT.min, PROCEDURAL_RANGES.LAKE_COUNT.max));
      this.generateProceduralMagma(planetRadius, lakeCount, rng);
    }
  }

  private generateMagmaFromPython(planetRadius: number, lakes: any[], rng: SeededRandom): void {
    lakes.forEach((lake) => {
      this.createMagmaLake(planetRadius, lake, rng);
    });
  }

  private generateProceduralMagma(planetRadius: number, lakeCount: number, rng: SeededRandom): void {
    for (let i = 0; i < lakeCount; i++) {
      const phi = rng.uniform(0, 2 * Math.PI);
      const cosTheta = rng.uniform(-1, 1);
      const theta = Math.acos(cosTheta);

      const colorVariation = rng.uniform(0, 1);
      let color: number[];
      if (colorVariation < 0.3) {
        color = [1.0, 0.8, 0.3, 1.0];
      } else if (colorVariation < 0.6) {
        color = [0.85, 0.27, 0.0, 1.0];
      } else if (colorVariation < 0.85) {
        color = [0.7, 0.15, 0.0, 1.0];
      } else {
        color = [0.6, 0.1, 0.2, 1.0];
      }

      const lake = {
        position_3d: [Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta)],
        radius: rng.uniform(PROCEDURAL_RANGES.LAKE_SIZE.min, PROCEDURAL_RANGES.LAKE_SIZE.max),
        color: color,
        temperature: rng.uniform(1500, 2000),
        bubble_activity: rng.uniform(0.6, 1.0),
        glow_intensity: rng.uniform(0.8, 1.0),
      };

      this.createMagmaLake(planetRadius, lake, rng);
    }
  }

  private createMagmaLake(planetRadius: number, lake: any, rng: SeededRandom): void {
    const position = lake.position_3d || [0, 0, 1];
    const baseRadius = lake.radius || rng.uniform(PROCEDURAL_RANGES.LAKE_SIZE.min, PROCEDURAL_RANGES.LAKE_SIZE.max);

    const sizeVariation = rng.uniform(PROCEDURAL_RANGES.LAKE_SIZE_VARIATION.min, PROCEDURAL_RANGES.LAKE_SIZE_VARIATION.max);
    const sizeMultiplier = lake.radius ? 0.8 * sizeVariation : 1.2 * sizeVariation;
    const radius = baseRadius * planetRadius * sizeMultiplier;

    const shapeParams = {
      complexity: Math.floor(rng.uniform(PROCEDURAL_RANGES.SHAPE_COMPLEXITY.min, PROCEDURAL_RANGES.SHAPE_COMPLEXITY.max)),
      irregularity: rng.uniform(PROCEDURAL_RANGES.SHAPE_IRREGULARITY.min, PROCEDURAL_RANGES.SHAPE_IRREGULARITY.max),
      elongation: rng.uniform(0.6, 1.5),
      rotation: rng.uniform(0, Math.PI * 2),
      seed: rng.uniform(0, 1000000),
    };

    const sphericalPos = new THREE.Vector3(position[0], position[1], position[2]).normalize();

    const geometry = this.createMagmaLakeGeometry(radius, rng, planetRadius, sphericalPos, shapeParams);

    let magmaColor = new THREE.Color(0.85, 0.27, 0.0);
    if (lake.color && Array.isArray(lake.color)) {
      magmaColor = new THREE.Color(lake.color[0], lake.color[1], lake.color[2]);
    }

    const material = new THREE.ShaderMaterial({
      vertexShader: MagmaFlowsEffect.magmaVertexShader,
      fragmentShader: MagmaFlowsEffect.magmaFragmentShader,
      uniforms: {
        time: { value: 0 },
        timeSpeed: { value: this.params.timeSpeed },
        heatIntensity: { value: this.params.heatIntensity },
        bubbleActivity: { value: lake.bubble_activity || this.params.bubbleActivity },
        glowIntensity: { value: lake.glow_intensity || this.params.glowIntensity },
        magmaColor: { value: magmaColor },
        flowSpeed: { value: this.params.flowSpeed },
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        lightPosition: { value: new THREE.Vector3(0, 0, 0) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const magmaMesh = new THREE.Mesh(geometry, material);

    magmaMesh.position.set(0, 0, 0);

    magmaMesh.renderOrder = 8;

    this.magmaLakes.push(magmaMesh);
    this.magmaGroup.add(magmaMesh);
  }

  private createMagmaLakeGeometry(radius: number, rng: SeededRandom, planetRadius: number, centerPosition: THREE.Vector3, shapeParams?: any): THREE.BufferGeometry {
    const baseSegments = Math.floor(radius * 60);
    const segmentVariation = Math.floor(rng.uniform(-4, 4));
    const segments = Math.max(24, baseSegments + segmentVariation);

    const shape = shapeParams || {
      complexity: Math.floor(rng.uniform(PROCEDURAL_RANGES.SHAPE_COMPLEXITY.min, PROCEDURAL_RANGES.SHAPE_COMPLEXITY.max)),
      irregularity: rng.uniform(PROCEDURAL_RANGES.SHAPE_IRREGULARITY.min, PROCEDURAL_RANGES.SHAPE_IRREGULARITY.max),
      elongation: rng.uniform(0.6, 1.5),
      rotation: rng.uniform(0, Math.PI * 2),
      seed: Math.floor(rng.uniform(0, 1000000)),
    };

    const shapeRng = new SeededRandom(shape.seed);

    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const angularRadius = radius / planetRadius;

    let vertexIndex = 0;
    const vertexGrid: (number | null)[][] = [];

    const noisePhases = {
      noiseScale: 10.0 + shapeRng.uniform(-2.0, 2.0),
      noise1: shapeRng.uniform(0, Math.PI * 2),
      noise2: shapeRng.uniform(0, Math.PI * 2),
      noise3: shapeRng.uniform(0, Math.PI * 2),
      flowDirection: shapeRng.uniform(0, Math.PI * 2),
      channel1: shapeRng.uniform(0, Math.PI * 2),
      channel2: shapeRng.uniform(0, Math.PI * 2),
      edge1: shapeRng.uniform(0, Math.PI * 2),
      edge2: shapeRng.uniform(0, Math.PI * 2),
      edge3: shapeRng.uniform(0, Math.PI * 2),
      edge4: shapeRng.uniform(0, Math.PI * 2),
      edge5: shapeRng.uniform(0, Math.PI * 2),
      finger: shapeRng.uniform(0, Math.PI * 2),
      perp: shapeRng.uniform(0, Math.PI * 2),
    };

    const getOrganicRadius = (angle: number): number => {
      let r = 1.0;

      const adjustedAngle = angle - shape.rotation;
      const ellipseX = Math.cos(adjustedAngle);
      const ellipseY = Math.sin(adjustedAngle);
      r *= Math.sqrt(1.0 / ((ellipseX * ellipseX) / (shape.elongation * shape.elongation) + ellipseY * ellipseY));

      for (let k = 0; k < shape.complexity; k++) {
        const lobuleAngle = (k / shape.complexity) * Math.PI * 2 + shapeRng.uniform(-0.3, 0.3);
        const lobuleAmplitude = shapeRng.uniform(0.1, 0.3) * shape.irregularity;
        const lobuleWidth = shapeRng.uniform(0.3, 0.6);

        let angleDiff = angle - lobuleAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const influence = Math.exp(-(angleDiff * angleDiff) / (2 * lobuleWidth * lobuleWidth));
        r += lobuleAmplitude * influence;
      }

      const noiseFreq = 8;
      const noiseAmp = 0.05 * shape.irregularity;
      r += Math.sin(angle * noiseFreq + shapeRng.uniform(0, Math.PI * 2)) * noiseAmp;
      r += Math.sin(angle * noiseFreq * 1.7 + shapeRng.uniform(0, Math.PI * 2)) * noiseAmp * 0.5;

      return Math.max(0.3, Math.min(1.5, r));
    };

    for (let i = 0; i <= segments; i++) {
      vertexGrid[i] = [];
      for (let j = 0; j <= segments; j++) {
        const u = (i / segments) * 2 - 1;
        const v = (j / segments) * 2 - 1;
        const distance = Math.sqrt(u * u + v * v);
        const angle = Math.atan2(v, u);

        const maxRadius = getOrganicRadius(angle);

        if (distance <= maxRadius) {
          const localTheta = distance * angularRadius;
          const localPhi = Math.atan2(v, u);

          const localX = Math.sin(localTheta) * Math.cos(localPhi);
          const localY = Math.sin(localTheta) * Math.sin(localPhi);
          const localZ = Math.cos(localTheta);

          const localPoint = new THREE.Vector3(localX, localY, localZ);

          const centerDir = centerPosition.clone().normalize();

          const up = centerDir;
          const right = new THREE.Vector3();
          const forward = new THREE.Vector3();

          if (Math.abs(up.z) < 0.9) {
            right.crossVectors(up, new THREE.Vector3(0, 0, 1)).normalize();
          } else {
            right.crossVectors(up, new THREE.Vector3(1, 0, 0)).normalize();
          }
          forward.crossVectors(right, up).normalize();

          const globalPoint = new THREE.Vector3();
          globalPoint.addScaledVector(right, localPoint.x);
          globalPoint.addScaledVector(forward, localPoint.y);
          globalPoint.addScaledVector(up, localPoint.z);

          const surfacePoint = globalPoint.normalize();

          let heightVariation = 0;

          const centerDistance = distance;
          const flowHeight = (1.0 - centerDistance) * 0.003;

          const noise1 = Math.sin(localTheta * noisePhases.noiseScale + localPhi * 3.0 + noisePhases.noise1) * 0.0008;
          const noise2 = Math.cos(localTheta * 7.0 + localPhi * noisePhases.noiseScale + noisePhases.noise2) * 0.0005;
          const noise3 = Math.sin(localTheta * 15.0 + noisePhases.noise3) * Math.cos(localPhi * 12.0) * 0.0003;

          const flowDirectionNoise = Math.sin(localPhi * 4.0 + noisePhases.flowDirection) * 0.0004;

          heightVariation = flowHeight + noise1 + noise2 + noise3 + flowDirectionNoise;

          const channelPattern = Math.sin(localTheta * 6.0 + noisePhases.channel1) * Math.sin(localPhi * 8.0 + noisePhases.channel2);
          if (channelPattern > 0.3 && distance > 0.3) {
            heightVariation += 0.0012;
          }

          const elevatedPoint = surfacePoint.multiplyScalar(planetRadius + planetRadius * (0.002 + heightVariation));

          positions.push(elevatedPoint.x, elevatedPoint.y, elevatedPoint.z);

          normals.push(surfacePoint.x, surfacePoint.y, surfacePoint.z);

          const texU = 0.5 + u * 0.5;
          const texV = 0.5 + v * 0.5;
          uvs.push(texU, texV);

          vertexGrid[i][j] = vertexIndex;
          vertexIndex++;

          const edgeThreshold = maxRadius * 0.65;
          if (distance > edgeThreshold) {
            const currentAngle = Math.atan2(v, u);

            const baseNoise = Math.sin(currentAngle * 6 + noisePhases.edge1) * 0.04 + Math.sin(currentAngle * 3 + noisePhases.edge2) * 0.06;
            const detailNoise = Math.sin(currentAngle * 15 + noisePhases.edge3) * 0.02 + Math.sin(currentAngle * 22 + noisePhases.edge4) * 0.015;
            const flowNoise = Math.sin(currentAngle * 4 + localTheta * 8 + noisePhases.edge5) * 0.03;

            const fingerPattern = Math.sin(currentAngle * 12 + noisePhases.finger) * 0.5 + 0.5;
            const fingerNoise = fingerPattern > 0.7 ? shapeRng.uniform(0.15, 0.25) : 0;

            const distanceFactor = Math.pow((distance - edgeThreshold) / (maxRadius - edgeThreshold), 2);

            const totalIrregularity = (baseNoise + detailNoise + flowNoise) * distanceFactor + fingerNoise * distanceFactor;
            const irregularityFactor = totalIrregularity * shapeRng.uniform(0.12, 0.2) * shape.irregularity;

            const tangent1 = new THREE.Vector3();
            const tangent2 = new THREE.Vector3();

            if (Math.abs(surfacePoint.z) < 0.9) {
              tangent1.crossVectors(surfacePoint, new THREE.Vector3(0, 0, 1)).normalize();
            } else {
              tangent1.crossVectors(surfacePoint, new THREE.Vector3(1, 0, 0)).normalize();
            }
            tangent2.crossVectors(surfacePoint, tangent1).normalize();

            const radialOffset = Math.cos(currentAngle) * irregularityFactor * planetRadius;
            const tangentialOffset = Math.sin(currentAngle) * irregularityFactor * planetRadius;

            const perpVariation = Math.sin(currentAngle * 7 + localTheta * 12 + noisePhases.perp) * irregularityFactor * 0.3;

            const tangentOffset = tangent1
              .clone()
              .multiplyScalar(radialOffset + perpVariation)
              .add(tangent2.clone().multiplyScalar(tangentialOffset));

            elevatedPoint.add(tangentOffset);

            const idx = (vertexIndex - 1) * 3;
            positions[idx] = elevatedPoint.x;
            positions[idx + 1] = elevatedPoint.y;
            positions[idx + 2] = elevatedPoint.z;
          }
        } else {
          vertexGrid[i][j] = null;
        }
      }
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const v1 = vertexGrid[i][j];
        const v2 = vertexGrid[i + 1][j];
        const v3 = vertexGrid[i][j + 1];
        const v4 = vertexGrid[i + 1][j + 1];

        if (v1 !== null && v2 !== null && v3 !== null) {
          indices.push(v1, v2, v3);
        }
        if (v2 !== null && v3 !== null && v4 !== null) {
          indices.push(v2, v4, v3);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    return geometry;
  }

  addToScene(scene: THREE.Scene, planetPosition?: THREE.Vector3): void {
    if (planetPosition) {
      this.magmaGroup.position.copy(planetPosition);
    }
    scene.add(this.magmaGroup);
  }

  update(_deltaTime?: number, planetRotation?: number): void {
    const timeSinceCosmicOrigin = getUniverseTime(this.cosmicOriginTime || DEFAULT_COSMIC_ORIGIN_TIME);
    const animTime = (timeSinceCosmicOrigin + this.cosmicOffset) * this.params.timeSpeed!;
    const windowedTime = animTime % 10000;

    [...this.magmaLakes, ...this.magmaFlows].forEach((mesh) => {
      const material = mesh.material as THREE.ShaderMaterial;
      material.uniforms.time.value = windowedTime;
    });

    if (planetRotation !== undefined) {
      this.magmaGroup.rotation.y = planetRotation;
    }
  }

  updateLightPosition(position: THREE.Vector3): void {
    [...this.magmaLakes, ...this.magmaFlows].forEach((mesh) => {
      const material = mesh.material as THREE.ShaderMaterial;
      if (material.uniforms.lightPosition) {
        material.uniforms.lightPosition.value.copy(position);
      }
    });
  }

  updateLightDirection(direction: THREE.Vector3): void {
    [...this.magmaLakes, ...this.magmaFlows].forEach((mesh) => {
      const material = mesh.material as THREE.ShaderMaterial;
      if (material.uniforms.lightDirection) {
        material.uniforms.lightDirection.value.copy(direction);
      }
    });
  }

  updateFromThreeLight(light: THREE.DirectionalLight): void {
    this.updateLightPosition(light.position);
    const direction = light.target.position.clone().sub(light.position).normalize();
    this.updateLightDirection(direction);
  }

  getObject3D(): THREE.Group {
    return this.magmaGroup;
  }

  dispose(): void {
    [...this.magmaLakes, ...this.magmaFlows].forEach((mesh) => {
      mesh.geometry.dispose();
      (mesh.material as THREE.ShaderMaterial).dispose();
    });

    this.magmaLakes = [];
    this.magmaFlows = [];
    this.magmaGroup.clear();
  }
}

export function createMagmaFlowsFromPythonData(planetRadius: number, surfaceData: any, globalSeed?: number, cosmicOriginTime?: number): MagmaFlowsEffect | null {
  const magmaLakes = surfaceData.magma_lakes;

  if (!magmaLakes || magmaLakes.length === 0) {
    return null;
  }

  const seed = globalSeed || 123456789;
  const rng = new SeededRandom(seed + 9000);

  const params: MagmaFlowsParams = {
    heatIntensity: rng.uniform(PROCEDURAL_RANGES.HEAT_INTENSITY.min, PROCEDURAL_RANGES.HEAT_INTENSITY.max),
    flowSpeed: rng.uniform(PROCEDURAL_RANGES.FLOW_SPEED.min, PROCEDURAL_RANGES.FLOW_SPEED.max),
    bubbleActivity: rng.uniform(PROCEDURAL_RANGES.BUBBLE_ACTIVITY.min, PROCEDURAL_RANGES.BUBBLE_ACTIVITY.max),
    glowIntensity: rng.uniform(PROCEDURAL_RANGES.GLOW_INTENSITY.min, PROCEDURAL_RANGES.GLOW_INTENSITY.max),
    timeSpeed: rng.uniform(PROCEDURAL_RANGES.TIME_SPEED.min, PROCEDURAL_RANGES.TIME_SPEED.max),
    seed: seed + 9000,
    cosmicOriginTime: cosmicOriginTime,
    magmaLakes: magmaLakes,
  };

  return new MagmaFlowsEffect(planetRadius, params);
}
