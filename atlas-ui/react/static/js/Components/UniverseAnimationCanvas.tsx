// atlas-ui/react/static/js/Components/UniverseAnimationCanvas.tsx
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import PhotosensitivityWarning from "./PhotosensitivityWarning";
import PhotosensitivePlaceholder from "./PhotosensitivePlaceholder";

interface UniverseAnimationCanvasProps {
  animationType: "core" | "multiverse" | "processing" | null;
  onAnimationComplete?: () => void;
}

const UniverseAnimationCanvas: React.FC<UniverseAnimationCanvasProps> = ({ animationType, onAnimationComplete }) => {
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

  const initScene = () => {
    if (!mountRef.current) {
      return;
    }

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000011);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
      camera.position.set(0, 0, 0.1);
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

      const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 0.6, 0.3);
      composer.addPass(bloomPass);

      const timeDistortionPass = new ShaderPass(TimeDistortionShader);
      composer.addPass(timeDistortionPass);

      const chromaticAberrationPass = new ShaderPass(ChromaticAberrationShader);
      composer.addPass(chromaticAberrationPass);

      composerRef.current = composer;

      const createThickCubeEdges = (size: number, thickness: number) => {
        const group = new THREE.Group();
        const material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8,
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

      const universeCube = createThickCubeEdges(10, 0.05);
      scene.add(universeCube);

      const anchorCube = createThickCubeEdges(10, 0.05);
      anchorCube.children.forEach((edge) => {
        const originalMaterial = (universeCube.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
        (edge as THREE.Mesh).material = new THREE.MeshBasicMaterial({
          color: originalMaterial.color.clone(),
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
        });
      });
      anchorCube.position.copy(universeCube.position);
      scene.add(anchorCube);

      const bigBangPositions = new Float32Array([0, 0, 0]);
      const bigBangColors = new Float32Array([1, 1, 1]);
      const bigBangSizes = new Float32Array([10]);

      const bigBangGeometry = new THREE.BufferGeometry();
      bigBangGeometry.setAttribute("position", new THREE.BufferAttribute(bigBangPositions, 3));
      bigBangGeometry.setAttribute("color", new THREE.BufferAttribute(bigBangColors, 3));
      bigBangGeometry.setAttribute("size", new THREE.BufferAttribute(bigBangSizes, 1));

      const bigBangMaterial = new THREE.PointsMaterial({
        size: 7,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        alphaTest: 0.01,
        map: createCircleTexture(),
      });

      const bigBang = new THREE.Points(bigBangGeometry, bigBangMaterial);
      scene.add(bigBang);

      const maxGalaxies = 7500;
      const galaxyPositions = new Float32Array(maxGalaxies * 3);
      const galaxyColors = new Float32Array(maxGalaxies * 3);
      const galaxySizes = new Float32Array(maxGalaxies);
      const galaxyTargetPositions = new Float32Array(maxGalaxies * 3);
      const galaxyDirections = new Float32Array(maxGalaxies * 3);
      const galaxyDistances = new Float32Array(maxGalaxies);

      const galaxyData = [];

      for (let i = 0; i < maxGalaxies; i++) {
        const attempts = 3 + Math.floor(Math.random() * 3);
        let minDistance = Infinity;
        let bestX = 0,
          bestY = 0,
          bestZ = 0;

        for (let attempt = 0; attempt < attempts; attempt++) {
          const tempX = (Math.random() - 0.5) * 10;
          const tempY = (Math.random() - 0.5) * 10;
          const tempZ = (Math.random() - 0.5) * 10;

          const distanceFromCenter = Math.sqrt(tempX * tempX + tempY * tempY + tempZ * tempZ);
          const biasWeight = Math.pow(Math.random(), 1.8) + distanceFromCenter * 0.1;

          if (biasWeight < minDistance) {
            minDistance = biasWeight;
            bestX = tempX;
            bestY = tempY;
            bestZ = tempZ;
          }
        }

        const distance = Math.sqrt(bestX * bestX + bestY * bestY + bestZ * bestZ);

        galaxyData.push({
          index: i,
          x: bestX,
          y: bestY,
          z: bestZ,
          distance: distance,
          launchTime: Math.random() * 3,
          speed: distance > 0 ? (2 + Math.random() * 3) / distance : 1,
        });
      }

      for (let i = 0; i < maxGalaxies; i++) {
        const data = galaxyData[i];

        galaxyPositions[i * 3] = 0;
        galaxyPositions[i * 3 + 1] = 0;
        galaxyPositions[i * 3 + 2] = 0;

        galaxyTargetPositions[i * 3] = data.x;
        galaxyTargetPositions[i * 3 + 1] = data.y;
        galaxyTargetPositions[i * 3 + 2] = data.z;

        galaxyDistances[i] = data.distance;

        if (data.distance > 0) {
          galaxyDirections[i * 3] = data.x / data.distance;
          galaxyDirections[i * 3 + 1] = data.y / data.distance;
          galaxyDirections[i * 3 + 2] = data.z / data.distance;
        } else {
          galaxyDirections[i * 3] = 0;
          galaxyDirections[i * 3 + 1] = 0;
          galaxyDirections[i * 3 + 2] = 1;
        }

        const intensity = Math.random() * 0.8 + 0.4;
        const distanceRatio = Math.min(data.distance / 5, 1);

        galaxyColors[i * 3] = intensity * (0.2 + distanceRatio * 0.8);
        galaxyColors[i * 3 + 1] = intensity * (0.5 + distanceRatio * 0.5);
        galaxyColors[i * 3 + 2] = intensity * (0.8 + distanceRatio * 0.2);

        galaxySizes[i] = Math.random() * 0.8 + 0.3;
      }

      const galaxyGeometry = new THREE.BufferGeometry();
      galaxyGeometry.setAttribute("position", new THREE.BufferAttribute(galaxyPositions, 3));
      galaxyGeometry.setAttribute("color", new THREE.BufferAttribute(galaxyColors, 3));
      galaxyGeometry.setAttribute("size", new THREE.BufferAttribute(galaxySizes, 1));

      const galaxyMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        map: createCircleTexture(),
      });

      const galaxies = new THREE.Points(galaxyGeometry, galaxyMaterial);
      scene.add(galaxies);

      const shockwaves = [];
      for (let i = 0; i < 8; i++) {
        const wave = new THREE.Mesh(
          new THREE.SphereGeometry(1, 32, 32),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(i * 0.08, 1, 0.7),
            transparent: true,
            opacity: 0,
            wireframe: true,
            blending: THREE.AdditiveBlending,
          }),
        );
        shockwaves.push(wave);
        scene.add(wave);
      }

      const explosionParticles = [];
      const particleCount = 200;

      for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.1, 0.1),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(Math.random() * 0.2, 1, 0.8),
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
          }),
        );

        particle.userData = {
          direction: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2).normalize(),
          speed: Math.random() * 10 + 5,
          life: Math.random() * 2 + 1,
        };

        explosionParticles.push(particle);
        scene.add(particle);
      }

      let startTime = Date.now();
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;

        const totalDuration = 10;
        const fadeStartTime = 7.5;
        const fadeDuration = 2;
        const explosionDuration = 1.5;

        const composer = composerRef.current;
        const bloomPass = composer?.passes[1] as UnrealBloomPass;
        const timeDistortionPass = composer?.passes[2] as ShaderPass;
        const chromaticAberrationPass = composer?.passes[3] as ShaderPass;

        const explosionPhase = Math.min(elapsed / explosionDuration, 1);
        const isExploding = elapsed < explosionDuration;

        if (bloomPass && timeDistortionPass && chromaticAberrationPass) {
          if (isExploding) {
            const effectIntensity = Math.sin(explosionPhase * Math.PI);

            bloomPass.strength = 0.2 + effectIntensity * 0.4;
            bloomPass.radius = 0.5 + effectIntensity * 0.1;

            timeDistortionPass.uniforms.distortionAmount.value = effectIntensity * 2.5;
            timeDistortionPass.uniforms.time.value = elapsed;

            chromaticAberrationPass.uniforms.distortion.value = effectIntensity * 0.4;
            chromaticAberrationPass.uniforms.time.value = elapsed;
          } else {
            const postIntensity = Math.max(0, 1 - (elapsed - explosionDuration) / 2);

            bloomPass.strength = 0.3 + postIntensity * 0.4;
            bloomPass.radius = 0.6 + postIntensity * 0.1;

            timeDistortionPass.uniforms.distortionAmount.value = postIntensity * 0.1;
            timeDistortionPass.uniforms.time.value = elapsed;

            chromaticAberrationPass.uniforms.distortion.value = postIntensity * 0.03;
            chromaticAberrationPass.uniforms.time.value = elapsed;
          }
        }

        if (isExploding) {
          const flashIntensity = explosionPhase < 0.2 ? Math.sin(explosionPhase * Math.PI * 10) * 0.5 + 1 : Math.max(0, 1 - explosionPhase * 2);

          shockwaves.forEach((wave, index) => {
            const waveDelay = index * 0.08;
            const waveProgress = Math.max(0, explosionPhase - waveDelay);

            if (waveProgress > 0) {
              const scale = waveProgress * (40 + index * 8);
              wave.scale.setScalar(scale);
              wave.material.opacity = Math.max(0, 1.2 - index * 0.1 - waveProgress * 0.8);
            }
          });

          explosionParticles.forEach((particle) => {
            const particleLife = explosionPhase * particle.userData.life;
            if (particleLife > 0) {
              const distance = particleLife * particle.userData.speed;
              const pos = particle.userData.direction.clone().multiplyScalar(distance);
              particle.position.copy(pos);

              particle.material.opacity = Math.max(0, 1 - particleLife / particle.userData.life);
              particle.rotation.x += 0.2;
              particle.rotation.y += 0.15;
              particle.rotation.z += 0.25;
            }
          });

          camera.fov = 75 + Math.sin(explosionPhase * Math.PI) * 40;
          camera.updateProjectionMatrix();

          const coreExplosionIntensity = Math.sin(elapsed * 80) * 0.5 + 1;
          bigBangMaterial.size = 15 + coreExplosionIntensity * 20 * (1 - explosionPhase);
          bigBangMaterial.opacity = Math.min(1.5, 1 + flashIntensity * 0.8 - explosionPhase);
        } else {
          bigBangMaterial.opacity = 0;

          const postExplosionTime = elapsed - explosionDuration;
          const shockwaveFadeTime = 2.0;

          if (postExplosionTime < shockwaveFadeTime) {
            const fadeProgress = postExplosionTime / shockwaveFadeTime;
            shockwaves.forEach((wave, index) => {
              wave.material.opacity = Math.max(0, (0.3 - index * 0.05) * (1 - fadeProgress));
            });
          } else {
            shockwaves.forEach((wave) => {
              wave.material.opacity = 0;
            });
          }
        }

        const cubeScale = elapsed < explosionDuration ? explosionPhase * 0.1 : 0.1 + (1 - 0.1) * Math.pow(Math.min((elapsed - explosionDuration) / 2, 1), 0.7);

        for (let i = 0; i < maxGalaxies; i++) {
          const data = galaxyData[i];
          const launchTime = data.launchTime;
          const speed = data.speed;

          if (elapsed > launchTime) {
            const travelTime = elapsed - launchTime;

            const progress = Math.min(travelTime * speed, 1);
            const smoothProgress = Math.pow(progress, 0.8);

            galaxyPositions[i * 3] = data.x * smoothProgress * cubeScale;
            galaxyPositions[i * 3 + 1] = data.y * smoothProgress * cubeScale;
            galaxyPositions[i * 3 + 2] = data.z * smoothProgress * cubeScale;
          } else {
            galaxyPositions[i * 3] = 0;
            galaxyPositions[i * 3 + 1] = 0;
            galaxyPositions[i * 3 + 2] = 0;
          }
        }

        galaxyGeometry.attributes.position.needsUpdate = true;
        galaxyMaterial.opacity = Math.min(elapsed * 1.2, 1);

        if (elapsed < explosionDuration * 0.3) {
          universeCube.scale.setScalar(0.01);
          universeCube.rotation.x = 0;
          universeCube.rotation.y = 0;
          universeCube.rotation.z = 0;
        } else if (elapsed < explosionDuration) {
          const expansionPhase = (explosionPhase - 0.3) / 0.7;

          const explosiveGrowth = Math.pow(expansionPhase, 0.3) * 0.8;

          const shakeIntensity = (1 - expansionPhase) * 0.5;
          const shake = {
            x: (Math.random() - 0.5) * shakeIntensity,
            y: (Math.random() - 0.5) * shakeIntensity,
            z: (Math.random() - 0.5) * shakeIntensity,
          };

          universeCube.scale.setScalar(explosiveGrowth);
          universeCube.position.set(shake.x, shake.y, shake.z);

          universeCube.rotation.x = elapsed * (1.5 + Math.sin(elapsed * 20) * 1);
          universeCube.rotation.y = elapsed * (2 + Math.cos(elapsed * 15) * 1.5);
          universeCube.rotation.z = elapsed * (1 + Math.sin(elapsed * 25) * 0.5);
        } else {
          const postExplosionTime = elapsed - explosionDuration;

          const stabilizationTime = 0.8;
          if (postExplosionTime < stabilizationTime) {
            const stabilizationProgress = postExplosionTime / stabilizationTime;
            const dampening = 1 - Math.pow(stabilizationProgress, 2);
            universeCube.position.multiplyScalar(dampening);
          } else {
            universeCube.position.set(0, 0, 0);
          }

          const inertiaGrowth = 0.8 + Math.pow(Math.min(postExplosionTime / 3, 1), 0.5) * 0.2;
          universeCube.scale.setScalar(inertiaGrowth);

          const rotationStabilization = Math.min(postExplosionTime / 1, 1);
          const stableSpeed = 0.2 + postExplosionTime * 0.7;

          const rotationSpeed = elapsed * stableSpeed * rotationStabilization;
          universeCube.rotation.x = Math.sin(rotationSpeed * 0.7) * 0.3;
          universeCube.rotation.y = rotationSpeed * 0.8;
          universeCube.rotation.z = Math.cos(rotationSpeed * 0.5) * 0.25;
        }

        galaxies.rotation.copy(universeCube.rotation);

        anchorCube.position.set(0, 0, 0);
        anchorCube.rotation.copy(universeCube.rotation);

        if (!isExploding) {
          const postExplosionTime = elapsed - explosionDuration;
          if (postExplosionTime > 0) {
            const scale = 1 + postExplosionTime * 50;
            anchorCube.scale.setScalar(scale);

            const opacity = Math.max(0, 0.9 - postExplosionTime * 0.4);
            anchorCube.children.forEach((edge) => {
              const material = (edge as THREE.Mesh).material as THREE.MeshBasicMaterial;
              material.opacity = opacity;
            });
          } else {
            anchorCube.children.forEach((edge) => {
              const material = (edge as THREE.Mesh).material as THREE.MeshBasicMaterial;
              material.opacity = 0;
            });
          }
        } else {
          anchorCube.children.forEach((edge) => {
            const material = (edge as THREE.Mesh).material as THREE.MeshBasicMaterial;
            material.opacity = 0;
          });
        }

        let baseCameraDistance = 8;

        if (!isExploding) {
          const postExplosionTime = elapsed - explosionDuration;

          if (elapsed >= fadeStartTime) {
            const fadeProgress = Math.min((elapsed - fadeStartTime) / fadeDuration, 1);
            const zoomProgress = Math.pow(fadeProgress, 2);
            baseCameraDistance = Math.max(0.5, 2 - zoomProgress * 1.8);
          } else {
            const approachSpeed = 0.8;
            baseCameraDistance = Math.max(2, 8 - postExplosionTime * approachSpeed);
          }
        }

        const cameraDistance = baseCameraDistance + Math.sin(elapsed * 0.3) * 1;

        const cameraAngle = elapsed * 0.15;
        const cameraHeight = Math.sin(elapsed * 0.08) * 2;

        let finalCameraX = Math.cos(cameraAngle) * cameraDistance;
        let finalCameraY = cameraHeight;
        let finalCameraZ = Math.sin(cameraAngle) * cameraDistance;

        if (isExploding) {
          const shakeIntensity = Math.sin(explosionPhase * Math.PI) * 0.8;
          finalCameraX += (Math.random() - 0.5) * shakeIntensity;
          finalCameraY += (Math.random() - 0.5) * shakeIntensity;
          finalCameraZ += (Math.random() - 0.5) * shakeIntensity;
        }

        camera.position.set(finalCameraX, finalCameraY, finalCameraZ);

        camera.lookAt(0, 0, 0);

        if (composerRef.current) {
          composerRef.current.render();
        } else {
          renderer.render(scene, camera);
        }

        if (elapsed >= fadeStartTime && fadeOverlayRef.current) {
          const fadeProgress = Math.min((elapsed - fadeStartTime) / fadeDuration, 1);
          const easedProgress = Math.pow(fadeProgress, 2);
          fadeOverlayRef.current.style.opacity = easedProgress.toString();
        }

        if (elapsed > totalDuration && onAnimationComplete) {
          onAnimationComplete();
          return;
        }

        animationIdRef.current = requestAnimationFrame(animate);
      };

      animate();
    } catch (error) {}
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
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  };

  useEffect(() => {
    if (animationType && !isVisible && canStartAnimation) {
      setIsVisible(true);

      setTimeout(() => {
        initScene();
      }, 100);
    }
  }, [animationType, isVisible, canStartAnimation]);

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

export default UniverseAnimationCanvas;
