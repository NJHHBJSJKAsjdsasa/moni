// atlas-ui/react/static/js/Components/AdaptivePreloadCanvas.tsx

import React, { useRef, useEffect, useState } from "react";
import { PhotosensitivityManager } from "../Utils/PhotosensitivityManager.tsx";

interface AdaptivePreloadCanvasProps {
  hidden: boolean;
  decelerateRef: { current: boolean };
}

const AdaptivePreloadCanvas: React.FC<AdaptivePreloadCanvasProps> = ({ hidden, decelerateRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPhotosensitive, setIsPhotosensitive] = useState(() => {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    return PhotosensitivityManager.isEnabled() || prefersReduced;
  });

  useEffect(() => {
    const handlePhotosensitivityChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ enabled: boolean }>;
      setIsPhotosensitive(customEvent.detail.enabled);
    };

    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches && !PhotosensitivityManager.isEnabled()) {
        setIsPhotosensitive(true);
      }
    };

    window.addEventListener("photosensitivityChange", handlePhotosensitivityChange);
    mediaQuery?.addEventListener("change", handleMotionChange);

    return () => {
      window.removeEventListener("photosensitivityChange", handlePhotosensitivityChange);
      mediaQuery?.removeEventListener("change", handleMotionChange);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const starClasses = [
      { color: [155, 176, 255], temp: "O", weight: 0.005, luminosity: 1.8 },
      { color: [170, 191, 255], temp: "B", weight: 0.025, luminosity: 1.5 },
      { color: [202, 215, 255], temp: "A", weight: 0.04, luminosity: 1.3 },
      { color: [248, 247, 255], temp: "F", weight: 0.08, luminosity: 1.1 },
      { color: [255, 244, 234], temp: "G", weight: 0.2, luminosity: 1.0 },
      { color: [255, 210, 161], temp: "K", weight: 0.25, luminosity: 0.7 },
      { color: [255, 204, 111], temp: "M", weight: 0.4, luminosity: 0.5 },
    ];

    const cumulativeWeights: number[] = [];
    let cumulative = 0;
    for (const sc of starClasses) {
      cumulative += sc.weight;
      cumulativeWeights.push(cumulative);
    }

    function pickStarClass() {
      const r = Math.random();
      for (let i = 0; i < cumulativeWeights.length; i++) {
        if (r <= cumulativeWeights[i]) return starClasses[i];
      }
      return starClasses[starClasses.length - 1];
    }

    interface Star {
      x: number;
      y: number;
      z: number;
      o: number;
      baseOpacity: number;
      color: number[];
      luminosity: number;
      size: number;
      twinkleSpeed: number;
      twinkleSpeed2: number;
      twinkleOffset: number;
      twinkleOffset2: number;
    }

    let stars: Star[] = [];
    const numStars = isPhotosensitive ? 200 : 1600;
    let centerX: number, centerY: number;
    const maxCanvasSize = 800;
    let animationId: number;
    let speed = 0.5;
    let frame = 0;

    const maxSpeed = isPhotosensitive ? 5 : 60;
    const acceleration = isPhotosensitive ? 0.5 : 1;
    const deceleration = isPhotosensitive ? 0.5 : 2;
    const enableMotionBlur = !isPhotosensitive;
    const twinkleIntensity = isPhotosensitive ? 0.08 : 0.18;

    function resizeCanvas() {
      const container = canvas?.parentElement;
      if (!container || !canvas) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      canvas.width = Math.min(containerWidth, maxCanvasSize);
      canvas.height = Math.min(containerHeight, maxCanvasSize);

      centerX = canvas.width / 2;
      centerY = canvas.height / 2;
    }

    function createStar(canvasW: number, canvasH: number): Star {
      const starClass = pickStarClass();
      const baseSize = (0.3 + Math.random() * 0.8) * starClass.luminosity;
      const baseOpacity = isPhotosensitive ? 0.5 + Math.random() * 0.3 : (0.15 + Math.random() * 0.5) * starClass.luminosity;

      return {
        x: Math.random() * canvasW,
        y: Math.random() * canvasH,
        z: Math.random() * canvasW,
        o: baseOpacity,
        baseOpacity: baseOpacity,
        color: starClass.color,
        luminosity: starClass.luminosity,
        size: baseSize,

        twinkleSpeed: 0.3 + Math.random() * 1.2,
        twinkleSpeed2: 0.7 + Math.random() * 2.0,
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleOffset2: Math.random() * Math.PI * 2,
      };
    }

    function init() {
      resizeCanvas();
      stars = [];
      const w = canvas?.width || 800;
      const h = canvas?.height || 800;

      for (let i = 0; i < numStars; i++) {
        stars.push(createStar(w, h));
      }

      animate();
    }

    function animate() {
      if (!canvas || !ctx) return;

      frame++;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (enableMotionBlur && speed > 30) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const canvasW = canvas.width;

      stars.forEach((star) => {
        star.z -= speed;

        if (star.z <= 0) {
          const starClass = pickStarClass();
          star.z = canvasW;
          star.x = Math.random() * canvasW;
          star.y = Math.random() * canvas.height;
          star.color = starClass.color;
          star.luminosity = starClass.luminosity;
          star.size = (0.3 + Math.random() * 0.8) * starClass.luminosity;
          const baseOpacity = isPhotosensitive ? 0.5 + Math.random() * 0.3 : (0.15 + Math.random() * 0.5) * starClass.luminosity;
          star.baseOpacity = baseOpacity;
          star.o = baseOpacity;
        }

        const k = canvasW / star.z;
        const x = (star.x - centerX) * k + centerX;
        const y = (star.y - centerY) * k + centerY;

        const nearThreshold = canvasW * 0.08;
        const nearFade = star.z < nearThreshold ? star.z / nearThreshold : 1;
        if (nearFade < 0.01) return;

        const depthFactor = 1 - (star.z / canvasW) * 0.6;

        const baseRadius = (isPhotosensitive ? 1.0 : 1.3) * k * star.size;

        const dimnessFactor = 1 + (1 - star.luminosity) * 0.8;
        const twinkle1 = Math.sin(frame * 0.04 * star.twinkleSpeed + star.twinkleOffset);
        const twinkle2 = Math.sin(frame * 0.09 * star.twinkleSpeed2 + star.twinkleOffset2) * 0.4;
        const twinkle = (twinkle1 + twinkle2) * twinkleIntensity * dimnessFactor;

        const currentOpacity = Math.max(0, Math.min(1, (star.baseOpacity + twinkle) * depthFactor * nearFade));
        const currentRadius = Math.max(0.2, baseRadius * (1 + twinkle * 0.2));

        const [r, g, b] = star.color;

        if (currentRadius > 1) {
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, currentRadius * 2);
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${currentOpacity * 0.3})`);
          gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${currentOpacity * 0.08})`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, currentRadius * 2, 0, 2 * Math.PI);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentOpacity})`;
        ctx.beginPath();
        ctx.arc(x, y, currentRadius, 0, 2 * Math.PI);
        ctx.fill();

        if (enableMotionBlur && speed > 10) {
          const prevK = canvasW / (star.z + speed * 2);
          const prevX = (star.x - centerX) * prevK + centerX;
          const prevY = (star.y - centerY) * prevK + centerY;

          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${currentOpacity * 0.6})`;
          ctx.lineWidth = currentRadius * 0.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      });

      if (!decelerateRef.current && speed < maxSpeed) {
        speed += acceleration;
      }

      if (decelerateRef.current && speed > 2) {
        speed -= deceleration;
      }

      animationId = requestAnimationFrame(animate);
    }

    init();

    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPhotosensitive, decelerateRef]);

  return <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2500ms] ${hidden ? "opacity-0" : "opacity-100"}`} style={{ filter: hidden ? "blur(50px)" : "none" }} />;
};

export default AdaptivePreloadCanvas;
