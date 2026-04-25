// atlas-ui/react/static/js/Components/MultiverseTransitionCanvas.tsx

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import PhotosensitivityWarning from "./PhotosensitivityWarning";
import PhotosensitivePlaceholder from "./PhotosensitivePlaceholder";

interface MultiverseTransitionCanvasProps {
  isActive: boolean;
  onTransitionComplete?: () => void;
}

const MultiverseTransitionCanvas: React.FC<MultiverseTransitionCanvasProps> = ({ isActive, onTransitionComplete }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGL2Renderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [canStartAnimation, setCanStartAnimation] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const fadeOverlayRef = useRef<HTMLDivElement | null>(null);

  const TRANSITION_DURATION = 3.0;
  const PHASE_1_DURATION = 0.8;
  const PHASE_2_DURATION = 1.4;
  const PHASE_3_DURATION = 0.8;

  const createCircleTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;

    ctx.clearRect(0, 0, 64, 64);

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1.0)");
    gradient.addColorStop(0.3, "rgba(255,255,255,0.8)");
    gradient.addColorStop(0.7, "rgba(255,255,255,0.2)");
    gradient.addColorStop(1, "rgba(255,255,255,0.0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.premultiplyAlpha = false;
    texture.format = THREE.RGBAFormat;
    return texture;
  };

  const createWormholeTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;

    ctx.clearRect(0, 0, 128, 128);

    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 4;
      const radius = (i / 50) * 60;
      const x = 64 + Math.cos(angle) * radius;
      const y = 64 + Math.sin(angle) * radius;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
      gradient.addColorStop(0, `rgba(100, 200, 255, ${0.8 - (i / 50) * 0.8})`);
      gradient.addColorStop(1, "rgba(100, 200, 255, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.premultiplyAlpha = false;
    texture.format = THREE.RGBAFormat;
    return texture;
  };

  const createWormhole = (start: THREE.Vector3, end: THREE.Vector3) => {
    const group = new THREE.Group();

    const direction = end.clone().sub(start);
    const distance = direction.length();
    const segments = Math.floor(distance / 5) + 10;

    const curve = new THREE.CatmullRomCurve3([
      start,
      start
        .clone()
        .add(direction.clone().multiplyScalar(0.2))
        .add(new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10)),
      start
        .clone()
        .add(direction.clone().multiplyScalar(0.5))
        .add(new THREE.Vector3((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15)),
      start
        .clone()
        .add(direction.clone().multiplyScalar(0.8))
        .add(new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10)),
      end,
    ]);

    const particleCount = 100;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const point = curve.getPointAt(t);

      particlePositions[i * 3] = point.x;
      particlePositions[i * 3 + 1] = point.y;
      particlePositions[i * 3 + 2] = point.z;

      particleColors[i * 3] = 0.3 + Math.random() * 0.7;
      particleColors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
      particleColors[i * 3 + 2] = 1;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      map: createWormholeTexture(),
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    group.userData = { curve, particleGeometry, particleCount };

    return group;
  };

  const createEnergyStream = (start: THREE.Vector3, end: THREE.Vector3, color: THREE.Color) => {
    const group = new THREE.Group();

    const midPoint = start.clone().add(end).multiplyScalar(0.5);
    midPoint.add(new THREE.Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20));

    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);

    const particleCount = 50;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const point = curve.getPointAt(t);

      particlePositions[i * 3] = point.x;
      particlePositions[i * 3 + 1] = point.y;
      particlePositions[i * 3 + 2] = point.z;

      particleColors[i * 3] = color.r + Math.random() * 0.3;
      particleColors[i * 3 + 1] = color.g + Math.random() * 0.3;
      particleColors[i * 3 + 2] = color.b + Math.random() * 0.3;

      particleSizes[i] = 0.5 + Math.random() * 0.8;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(particleSizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        texture: { value: createCircleTexture() },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float time;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

          mvPosition.xyz += sin(time + position.x * 0.1) * 0.5;

          gl_PointSize = size * ( 50.0 / -mvPosition.z );
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D texture;
        varying vec3 vColor;

        void main() {
          vec4 textureColor = texture2D(texture, gl_PointCoord);
          gl_FragColor = vec4(vColor, 1.0) * textureColor;
        }
      `,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    const energyParticles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(energyParticles);

    group.userData = {
      curve,
      particleGeometry,
      particleMaterial,
      particleCount,
      speed: 0.5 + Math.random() * 1.0,
    };

    return group;
  };

  const createNebula = (position: THREE.Vector3, size: number, color: THREE.Color) => {
    const group = new THREE.Group();

    for (let layer = 0; layer < 2; layer++) {
      const particleCount = 200 + layer * 100;
      const particlePositions = new Float32Array(particleCount * 3);
      const particleColors = new Float32Array(particleCount * 3);
      const particleSizes = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        const radius = size * (0.5 + Math.random() * 0.5) * (1 + layer * 0.3);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        particlePositions[i * 3] = position.x + x;
        particlePositions[i * 3 + 1] = position.y + y;
        particlePositions[i * 3 + 2] = position.z + z;

        const colorVariation = 0.3 + Math.random() * 0.4;
        particleColors[i * 3] = color.r * colorVariation;
        particleColors[i * 3 + 1] = color.g * colorVariation;
        particleColors[i * 3 + 2] = color.b * colorVariation;

        particleSizes[i] = (0.8 + Math.random() * 1.2) * (1 + layer * 0.3);
      }

      const nebulaGeometry = new THREE.BufferGeometry();
      nebulaGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
      nebulaGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
      nebulaGeometry.setAttribute("size", new THREE.BufferAttribute(particleSizes, 1));

      const nebulaMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          texture: { value: createCircleTexture() },
        },
        vertexShader: `
          attribute float size;
          varying vec3 vColor;
          uniform float time;

          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

            float swirl = sin(time * 0.1 + position.x * 0.01 + position.z * 0.01) * 0.2;
            mvPosition.xyz += vec3(swirl, sin(time * 0.05 + position.y * 0.01) * 0.1, swirl);

            gl_PointSize = size * ( 50.0 / -mvPosition.z );
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D texture;
          varying vec3 vColor;

          void main() {
            vec4 textureColor = texture2D(texture, gl_PointCoord);
            gl_FragColor = vec4(vColor, 0.02) * textureColor;
          }
        `,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });

      const nebulaParticles = new THREE.Points(nebulaGeometry, nebulaMaterial);
      group.add(nebulaParticles);
    }

    return group;
  };

  const ChromaticAberrationShader = {
    uniforms: {
      tDiffuse: { value: null },
      distortion: { value: 0.0 },
      time: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float distortion;
      uniform float time;
      varying vec2 vUv;

      void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 direction = vUv - center;
        float distance = length(direction);

        float aberration = distortion * distance;

        vec2 redOffset = direction * aberration * 1.5;
        vec2 greenOffset = direction * aberration;
        vec2 blueOffset = direction * aberration * 0.5;

        float red = texture2D(tDiffuse, vUv + redOffset).r;
        float green = texture2D(tDiffuse, vUv + greenOffset).g;
        float blue = texture2D(tDiffuse, vUv + blueOffset).b;

        gl_FragColor = vec4(red, green, blue, 1.0);
      }
    `,
  };

  const TimeDistortionShader = {
    uniforms: {
      tDiffuse: { value: null },
      distortionAmount: { value: 0.0 },
      time: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float distortionAmount;
      uniform float time;
      varying vec2 vUv;

      void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 uv = vUv;

        vec2 direction = uv - center;
        float distance = length(direction);

        float waveDistortion = sin(distance * 20.0 + time * 10.0) * distortionAmount * 0.02;
        float radialDistortion = distance * distortionAmount * 0.1;

        uv += direction * (waveDistortion + radialDistortion);

        gl_FragColor = texture2D(tDiffuse, uv);
      }
    `,
  };

  const GravitationalWaveShader = {
    uniforms: {
      tDiffuse: { value: null },
      time: { value: 0.0 },
      waveStrength: { value: 0.0 },
      waveSources: { value: [] },
      sourceCount: { value: 0 },
      cameraVelocity: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float time;
      uniform float waveStrength;
      uniform float cameraVelocity;
      uniform vec4 waveSources[10];
      uniform int sourceCount;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        vec2 center = vec2(0.5, 0.5);

        float lorentzFactor = 1.0 / sqrt(1.0 - cameraVelocity * cameraVelocity * 0.01);
        vec2 contractionDirection = normalize(uv - center);
        float contractionAmount = (cameraVelocity * 0.05) / lorentzFactor;

        vec2 toCenter = center - uv;
        float distFromCenter = length(toCenter);
        uv += normalize(toCenter) * contractionAmount * distFromCenter * 0.5;

        float totalWaveEffect = 0.0;

        for (int i = 0; i < 10; i++) {
          if (i >= sourceCount) break;

          vec3 sourcePos = waveSources[i].xyz;
          float sourceStrength = waveSources[i].w;

          vec2 sourceScreenPos = sourcePos.xy * 0.5 + 0.5;

          float distToSource = length(uv - sourceScreenPos);

          float wavePhase = distToSource * 50.0 - time * 20.0;
          float wave = sin(wavePhase) * exp(-distToSource * 2.0) * sourceStrength;

          vec2 dirToSource = normalize(uv - sourceScreenPos);
          float quadrupole = cos(2.0 * atan(dirToSource.y, dirToSource.x));

          totalWaveEffect += wave * quadrupole;
        }

        vec2 waveDistortion = (uv - center) * totalWaveEffect * waveStrength * 0.02;
        uv += waveDistortion;

        vec3 color = texture2D(tDiffuse, uv).rgb;
        if (cameraVelocity > 0.3) {
          float dopplerShift = cameraVelocity * 0.1;
          color.r *= (1.0 - dopplerShift);
          color.b *= (1.0 + dopplerShift);
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  };

  const createThickCubeEdges = (size: number, thickness: number, color: THREE.Color = new THREE.Color(0xffffff), opacity: number = 0.8) => {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      blending: THREE.AdditiveBlending,
    });

    const edges = [
      [
        [-size / 2, -size / 2, size / 2],
        [size / 2, -size / 2, size / 2],
      ],
      [
        [size / 2, -size / 2, size / 2],
        [size / 2, size / 2, size / 2],
      ],
      [
        [size / 2, size / 2, size / 2],
        [-size / 2, size / 2, size / 2],
      ],
      [
        [-size / 2, size / 2, size / 2],
        [-size / 2, -size / 2, size / 2],
      ],
      [
        [-size / 2, -size / 2, -size / 2],
        [size / 2, -size / 2, -size / 2],
      ],
      [
        [size / 2, -size / 2, -size / 2],
        [size / 2, size / 2, -size / 2],
      ],
      [
        [size / 2, size / 2, -size / 2],
        [-size / 2, size / 2, -size / 2],
      ],
      [
        [-size / 2, size / 2, -size / 2],
        [-size / 2, -size / 2, -size / 2],
      ],
      [
        [-size / 2, -size / 2, -size / 2],
        [-size / 2, -size / 2, size / 2],
      ],
      [
        [size / 2, -size / 2, -size / 2],
        [size / 2, -size / 2, size / 2],
      ],
      [
        [size / 2, size / 2, -size / 2],
        [size / 2, size / 2, size / 2],
      ],
      [
        [-size / 2, size / 2, -size / 2],
        [-size / 2, size / 2, size / 2],
      ],
    ];

    edges.forEach(([start, end]) => {
      const startVec = new THREE.Vector3(start[0], start[1], start[2]);
      const endVec = new THREE.Vector3(end[0], end[1], end[2]);
      const direction = endVec.clone().sub(startVec);
      const length = direction.length();

      const geometry = new THREE.CylinderGeometry(thickness, thickness, length, 8);
      const cylinder = new THREE.Mesh(geometry, material);

      cylinder.position.copy(startVec.clone().add(endVec).multiplyScalar(0.5));
      cylinder.lookAt(endVec);
      cylinder.rotateX(Math.PI / 2);

      group.add(cylinder);
    });

    return group;
  };

  const initScene = () => {
    if (!mountRef.current) return;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000011);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 2000);
      camera.position.set(0, 0, 3.0);
      cameraRef.current = camera;

      const renderer = new THREE.WebGL2Renderer({
        antialias: true,
        alpha: false,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.15, 0.3, 0.2);
      composer.addPass(bloomPass);

      const timeDistortionPass = new ShaderPass(TimeDistortionShader);
      composer.addPass(timeDistortionPass);

      const chromaticAberrationPass = new ShaderPass(ChromaticAberrationShader);
      composer.addPass(chromaticAberrationPass);

      const gravitationalWavePass = new ShaderPass(GravitationalWaveShader);
      composer.addPass(gravitationalWavePass);

      composerRef.current = composer;

      const currentCube = createThickCubeEdges(10, 0.12, new THREE.Color(0x8a2be2), 0.9);
      scene.add(currentCube);

      const multiverseCubes: THREE.Group[] = [];
      const cubeCount = 50;
      const wormholes: THREE.Group[] = [];
      const gravitationalSources: { position: THREE.Vector3; strength: number }[] = [];

      for (let i = 0; i < cubeCount; i++) {
        const size = Math.random() * 5 + 2;
        const thickness = 0.06 + Math.random() * 0.08;

        const hue = Math.random() * 0.3 + 0.5;
        const color = new THREE.Color().setHSL(hue, 0.8, 0.6);

        const cube = createThickCubeEdges(size, thickness, color, 0.0);

        const spread = 150;
        cube.position.set((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread);

        cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        const isMassive = Math.random() < 0.2;
        const mass = isMassive ? 2 + Math.random() * 3 : 1;

        cube.userData = {
          originalOpacity: 0.6,
          rotationSpeed: {
            x: 0.005 + Math.random() * 0.01,
            y: 0.003 + Math.random() * 0.007,
            z: 0.007 + Math.random() * 0.005,
          },
          mass: mass,
          isMassive: isMassive,
        };

        if (isMassive) {
          cube.children.forEach((edge) => {
            const material = (edge as THREE.Mesh).material as THREE.MeshBasicMaterial;
            material.color.setHSL(0.1, 1.0, 0.7);
          });

          gravitationalSources.push({
            position: cube.position.clone(),
            strength: mass * 0.5,
          });
        }

        multiverseCubes.push(cube);
        scene.add(cube);
      }

      const wormholeCount = Math.min(15, cubeCount / 3);
      for (let i = 0; i < wormholeCount; i++) {
        const cube1 = multiverseCubes[Math.floor(Math.random() * cubeCount)];
        const cube2 = multiverseCubes[Math.floor(Math.random() * cubeCount)];

        if (cube1 !== cube2 && cube1.position.distanceTo(cube2.position) > 30) {
          const wormhole = createWormhole(cube1.position, cube2.position);
          wormholes.push(wormhole);
          scene.add(wormhole);
        }
      }

      const targetCubeIndex = Math.floor(Math.random() * cubeCount);
      const targetCube = multiverseCubes[targetCubeIndex];

      targetCube.children.forEach((edge) => {
        const material = (edge as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.color.setHex(0x00ffff);
        material.opacity = 1.0;
      });

      const particleCount = 2000;
      const particlePositions = new Float32Array(particleCount * 3);
      const particleColors = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        particlePositions[i3] = (Math.random() - 0.5) * 400;
        particlePositions[i3 + 1] = (Math.random() - 0.5) * 400;
        particlePositions[i3 + 2] = (Math.random() - 0.5) * 400;

        const intensity = Math.random() * 0.8 + 0.2;
        particleColors[i3] = intensity;
        particleColors[i3 + 1] = intensity * 0.8;
        particleColors[i3 + 2] = intensity;
      }

      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
      particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

      const particleMaterial = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        map: createCircleTexture(),
      });

      const particles = new THREE.Points(particleGeometry, particleMaterial);
      particleMaterial.opacity = 0.0;
      scene.add(particles);

      let startTime = Date.now();
      let previousCameraPosition = new THREE.Vector3(0, 0, 3.0);

      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;

        if (elapsed >= TRANSITION_DURATION) {
          if (onTransitionComplete) {
            onTransitionComplete();
          }
          return;
        }

        const composer = composerRef.current;
        const bloomPass = composer?.passes[1] as UnrealBloomPass;
        const timeDistortionPass = composer?.passes[2] as ShaderPass;
        const chromaticAberrationPass = composer?.passes[3] as ShaderPass;
        const gravitationalWavePass = composer?.passes[4] as ShaderPass;

        let cameraDistance: number;
        let cameraPos: THREE.Vector3;

        if (elapsed < PHASE_1_DURATION) {
          const progress = elapsed / PHASE_1_DURATION;

          const smoothProgress = Math.sin(progress * Math.PI * 0.5) * Math.sin(progress * Math.PI * 0.5);

          const startDistance = 3.0;
          const endDistance = 25.0;
          cameraDistance = startDistance + smoothProgress * (endDistance - startDistance);

          cameraPos = new THREE.Vector3(0, 0, cameraDistance);
          camera.lookAt(0, 0, 0);
        } else if (elapsed < PHASE_1_DURATION + PHASE_2_DURATION) {
          const phaseTime = elapsed - PHASE_1_DURATION;
          const progress = phaseTime / PHASE_2_DURATION;

          const angle = progress * Math.PI * 2;
          const radius = 25 + Math.sin(progress * Math.PI) * 20;
          const height = Math.sin(progress * Math.PI * 3) * 15;

          cameraDistance = radius;
          cameraPos = new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius);

          let lookTarget: THREE.Vector3;
          if (progress < 0.6) {
            lookTarget = new THREE.Vector3(0, 0, 0);
          } else {
            const lookProgress = (progress - 0.6) / 0.4;
            const originPoint = new THREE.Vector3(0, 0, 0);
            const targetPoint = targetCube.position.clone();
            lookTarget = originPoint.lerp(targetPoint, lookProgress);
          }
          camera.lookAt(lookTarget);
        } else {
          const phaseTime = elapsed - PHASE_1_DURATION - PHASE_2_DURATION;
          const progress = phaseTime / PHASE_3_DURATION;
          const smoothProgress = Math.pow(progress, 2);

          const phase2EndAngle = 1 * Math.PI * 2;
          const phase2EndRadius = 25 + Math.sin(Math.PI) * 20;
          const phase2EndHeight = Math.sin(Math.PI * 3) * 15;
          const startPos = new THREE.Vector3(Math.cos(phase2EndAngle) * phase2EndRadius, phase2EndHeight, Math.sin(phase2EndAngle) * phase2EndRadius);

          const endPos = targetCube.position.clone().add(new THREE.Vector3(0, 0, 0.1));

          cameraPos = startPos.lerp(endPos, smoothProgress);
          cameraDistance = cameraPos.length();

          const lookProgress = Math.min(1, progress + 0.6);
          const originPoint = new THREE.Vector3(0, 0, 0);
          const targetPoint = targetCube.position.clone();
          const lookTarget = originPoint.lerp(targetPoint, lookProgress);
          camera.lookAt(lookTarget);
        }

        camera.position.copy(cameraPos);

        const cameraVelocity = camera.position.distanceTo(previousCameraPosition) * 60;
        previousCameraPosition.copy(camera.position);

        const multiverseVisibility = Math.min(1, Math.max(0, (cameraDistance - 4) / 16));

        multiverseCubes.forEach((cube) => {
          const distanceToTarget = cube.position.distanceTo(targetCube.position);
          let opacity = multiverseVisibility * cube.userData.originalOpacity;

          if (elapsed > PHASE_1_DURATION + PHASE_2_DURATION) {
            const phase3Progress = (elapsed - PHASE_1_DURATION - PHASE_2_DURATION) / PHASE_3_DURATION;
            if (cube !== targetCube && cube !== currentCube) {
              const distanceFactor = Math.min(1, distanceToTarget / 100);
              opacity *= Math.max(0, 1 - phase3Progress * (1 + distanceFactor));
            }
          }

          cube.children.forEach((edge) => {
            const material = (edge as THREE.Mesh).material as THREE.MeshBasicMaterial;
            material.opacity = opacity;
          });

          cube.rotation.x += cube.userData.rotationSpeed.x;
          cube.rotation.y += cube.userData.rotationSpeed.y;
          cube.rotation.z += cube.userData.rotationSpeed.z;
        });

        wormholes.forEach((wormhole) => {
          const { curve, particleGeometry, particleCount } = wormhole.userData;
          const positions = particleGeometry.attributes.position.array;

          for (let i = 0; i < particleCount; i++) {
            let t = (i / particleCount + elapsed * 0.1) % 1;
            const point = curve.getPointAt(t);

            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
          }

          particleGeometry.attributes.position.needsUpdate = true;

          wormhole.children.forEach((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
              child.material.opacity = multiverseVisibility * 0.3;
            }
            if (child instanceof THREE.Points && child.material instanceof THREE.PointsMaterial) {
              child.material.opacity = multiverseVisibility * 0.7;
            }
          });
        });

        let currentCubeOpacity: number;
        if (cameraDistance < 3.5) {
          currentCubeOpacity = 0.2;
        } else if (cameraDistance < 6) {
          currentCubeOpacity = 0.2 + ((cameraDistance - 3.5) / 2.5) * 0.6;
        } else {
          currentCubeOpacity = 0.8;
        }

        currentCube.children.forEach((edge) => {
          const material = (edge as THREE.Mesh).material as THREE.MeshBasicMaterial;
          material.opacity = currentCubeOpacity;
        });

        if (particles.material instanceof THREE.PointsMaterial) {
          const particleVisibility = Math.min(1, Math.max(0, (cameraDistance - 3) / 12));
          particles.material.opacity = particleVisibility * 0.3;
        }

        if (elapsed < PHASE_1_DURATION + PHASE_2_DURATION * 0.5) {
          const rotationProgress = elapsed / (PHASE_1_DURATION + PHASE_2_DURATION * 0.5);
          currentCube.rotation.y = rotationProgress * Math.PI * 0.5;
          currentCube.rotation.x = rotationProgress * Math.PI * 0.3;
        }

        let effectIntensity = 0;

        if (elapsed < PHASE_1_DURATION) {
          const progress = elapsed / PHASE_1_DURATION;
          effectIntensity = progress * 0.2;
        } else if (elapsed < PHASE_1_DURATION + PHASE_2_DURATION) {
          const phaseTime = elapsed - PHASE_1_DURATION;
          const progress = phaseTime / PHASE_2_DURATION;

          if (progress < 0.3 || progress > 0.7) {
            effectIntensity = 0.2;
          } else {
            const centerProgress = (progress - 0.3) / 0.4;
            effectIntensity = 0.2 + 0.3 * Math.sin(centerProgress * Math.PI);
          }
        } else {
          const phaseTime = elapsed - PHASE_1_DURATION - PHASE_2_DURATION;
          const progress = phaseTime / PHASE_3_DURATION;
          effectIntensity = 0.2 * (1 - progress * progress * progress);
        }

        if (gravitationalWavePass) {
          const waveSources: number[] = [];
          gravitationalSources.slice(0, 10).forEach((source) => {
            waveSources.push(source.position.x / 100, source.position.y / 100, source.position.z / 100, source.strength);
          });

          gravitationalWavePass.uniforms.time.value = elapsed;
          gravitationalWavePass.uniforms.waveStrength.value = effectIntensity * 1.0;
          gravitationalWavePass.uniforms.cameraVelocity.value = Math.min(0.5, cameraVelocity / 15);
          gravitationalWavePass.uniforms.waveSources.value = waveSources;
          gravitationalWavePass.uniforms.sourceCount.value = Math.min(10, gravitationalSources.length);
        }

        if (bloomPass && timeDistortionPass && chromaticAberrationPass) {
          if (elapsed < PHASE_1_DURATION) {
            bloomPass.strength = 0.08 + effectIntensity * 0.05;
          } else if (elapsed < PHASE_1_DURATION + PHASE_2_DURATION) {
            bloomPass.strength = 0.1 + effectIntensity * 0.15;
          } else {
            bloomPass.strength = 0.08 + effectIntensity * 0.02;
          }

          timeDistortionPass.uniforms.distortionAmount.value = effectIntensity * 0.06;
          timeDistortionPass.uniforms.time.value = elapsed;
          chromaticAberrationPass.uniforms.distortion.value = effectIntensity * 0.03;
          chromaticAberrationPass.uniforms.time.value = elapsed;
        }

        if (fadeOverlayRef.current && elapsed > TRANSITION_DURATION - 0.3) {
          const fadeProgress = (elapsed - (TRANSITION_DURATION - 0.3)) / 0.3;
          fadeOverlayRef.current.style.opacity = fadeProgress.toString();
        }

        if (composerRef.current) {
          composerRef.current.render();
        } else if (rendererRef.current) {
          rendererRef.current.render(scene, camera);
        }

        animationIdRef.current = requestAnimationFrame(animate);
      };

      animate();
    } catch (error) {
      console.error("Error initializing multiverse transition scene:", error);
    }
  };

  const handleWarningProceed = () => {
    setShowWarning(false);
    setCanStartAnimation(true);
  };

  const handleWarningSkip = () => {
    setShowWarning(false);
    setShowPlaceholder(true);
  };

  const handlePlaceholderComplete = () => {
    setShowPlaceholder(false);
    if (onTransitionComplete) {
      onTransitionComplete();
    }
  };

  useEffect(() => {
    if (isActive && !isVisible && canStartAnimation) {
      setIsVisible(true);
      setTimeout(() => {
        initScene();
      }, 100);
    }
  }, [isActive, isVisible, canStartAnimation]);

  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && mountRef.current && rendererRef.current.domElement.parentNode) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  if (showWarning) {
    return (
      <PhotosensitivityWarning onProceed={handleWarningProceed} onSkip={handleWarningSkip}>
        {null}
      </PhotosensitivityWarning>
    );
  }

  if (showPlaceholder) {
    return <PhotosensitivePlaceholder onComplete={handlePlaceholderComplete} duration={3000} />;
  }

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div
        ref={mountRef}
        className="fixed inset-0 z-50 bg-black"
        style={{
          width: "100vw",
          height: "100vh",
        }}
      />
      <div
        ref={fadeOverlayRef}
        className="fixed inset-0 z-[51] bg-black pointer-events-none"
        style={{
          width: "100vw",
          height: "100vh",
          opacity: 0,
          transition: "none",
        }}
      />
    </>
  );
};

export default MultiverseTransitionCanvas;
