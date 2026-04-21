// atlas-ui/react/static/js/Components/AreciboMessage.tsx

import React, { useState, useEffect, useRef, useMemo } from "react";
import { AreciboGenerator, AreciboConfig, AreciboMessage as AreciboMessageType } from "../Utils/LifeAreciboTranslator";

interface AreciboMessageProps {
  lifeForm: string;
  planetName: string;
  className?: string;
  scale?: number;
  showControls?: boolean;
  showInfo?: boolean;
}

const AreciboMessage: React.FC<AreciboMessageProps> = ({ lifeForm, planetName, className = "", scale = 32, showControls = true, showInfo = true }) => {
  const [messageData, setMessageData] = useState<AreciboMessageType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const revealProgressRef = useRef(0);
  const staticNoiseRef = useRef<number[][]>([]);
  const revealedPixelsRef = useRef<Set<number>>(new Set());
  const revealedBackgroundRef = useRef<Set<number>>(new Set());
  const signalStrengthRef = useRef(0);

  useEffect(() => {
    const generateMessage = async () => {
      setIsLoading(true);
      try {
        const config: AreciboConfig = {
          lifeForm,
          planetName,
          width: 23,
          height: 73,
        };
        const data = await AreciboGenerator.generate(config);
        setMessageData(data);
      } catch (error) {
        console.error("Error generating Arecibo message:", error);
      } finally {
        setIsLoading(false);
      }
    };

    generateMessage();
  }, [lifeForm, planetName]);

  useEffect(() => {
    if (!canvasRef.current || !messageData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = messageData.width * scale;
    canvas.height = messageData.height * scale;

    const initializeRadioStatic = () => {
      const staticNoise: number[][] = [];

      for (let y = 0; y < messageData.height; y++) {
        staticNoise[y] = [];
        for (let x = 0; x < messageData.width; x++) {
          staticNoise[y][x] = Math.random();
        }
      }

      staticNoiseRef.current = staticNoise;
      revealedPixelsRef.current = new Set();
      revealedBackgroundRef.current = new Set();
      signalStrengthRef.current = 0;
    };

    const drawGrid = () => {
      if (!ctx) return;

      ctx.strokeStyle = "#222222";
      ctx.lineWidth = 0.3;
      ctx.globalAlpha = 0.15;

      for (let x = 0; x <= messageData.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * scale, 0);
        ctx.lineTo(x * scale, messageData.height * scale);
        ctx.stroke();
      }

      for (let y = 0; y <= messageData.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * scale);
        ctx.lineTo(messageData.width * scale, y * scale);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    };

    const animate = () => {
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const progress = revealProgressRef.current;
      const colors = ["#000000", "#FFFFFF", "#9966CC", "#00FF00", "#0066FF", "#FF6600", "#FF0000", "#FFFF00", "#B19CD9"];

      signalStrengthRef.current = Math.min(1, progress * 1.5);
      const signalStrength = signalStrengthRef.current;

      for (let y = 0; y < messageData.height; y++) {
        for (let x = 0; x < messageData.width; x++) {
          const index = y * messageData.width + x;

          if (Math.random() < 0.15) {
            staticNoiseRef.current[y][x] = Math.random();
          }

          const noiseValue = staticNoiseRef.current[y][x];

          if (progress < 0.467) {
            const grayLevel = Math.floor(noiseValue * 255);
            ctx.fillStyle = `rgb(${grayLevel}, ${grayLevel}, ${grayLevel})`;
            ctx.fillRect(x * scale, y * scale, scale - 1, scale - 1);
          } else {
            const revealProgress = (progress - 0.467) / 0.533;
            const pixelIndex = index;

            if (messageData.bitmap[index] === 1) {
              if (!revealedPixelsRef.current.has(pixelIndex) && Math.random() < 0.06) {
                revealedPixelsRef.current.add(pixelIndex);
              }

              if (revealedPixelsRef.current.has(pixelIndex)) {
                const colorIndex = messageData.colorMap[index] || 1;
                ctx.fillStyle = colors[colorIndex] || "#FFFFFF";
                ctx.fillRect(x * scale, y * scale, scale - 1, scale - 1);
              } else {
                const grayLevel = Math.floor(noiseValue * 255);
                ctx.fillStyle = `rgb(${grayLevel}, ${grayLevel}, ${grayLevel})`;
                ctx.fillRect(x * scale, y * scale, scale - 1, scale - 1);
              }
            } else {
              if (revealProgress > 0.3 && !revealedBackgroundRef.current.has(pixelIndex) && Math.random() < 0.04) {
                revealedBackgroundRef.current.add(pixelIndex);
              }

              if (!revealedBackgroundRef.current.has(pixelIndex)) {
                const grayLevel = Math.floor(noiseValue * 255);
                ctx.fillStyle = `rgb(${grayLevel}, ${grayLevel}, ${grayLevel})`;
                ctx.fillRect(x * scale, y * scale, scale - 1, scale - 1);
              }
            }
          }
        }
      }

      const totalMessagePixels = messageData.bitmap.filter((p) => p === 1).length;
      const totalBackgroundPixels = messageData.bitmap.filter((p) => p === 0).length;
      const revealedMessageCount = revealedPixelsRef.current.size;
      const revealedBackgroundCount = revealedBackgroundRef.current.size;
      const isPhase2 = progress >= 0.467;

      const animationComplete = isPhase2 && revealedMessageCount >= totalMessagePixels && revealedBackgroundCount >= totalBackgroundPixels;

      if (!animationComplete && revealProgressRef.current < 3) {
        revealProgressRef.current += 1 / 90;
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    if (isAnimating) {
      revealProgressRef.current = 0;
      initializeRadioStatic();
      requestAnimationFrame(() => animate());
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const colors = ["#000000", "#FFFFFF", "#9966CC", "#00FF00", "#0066FF", "#FF6600", "#FF0000", "#FFFF00", "#B19CD9"];
      for (let y = 0; y < messageData.height; y++) {
        for (let x = 0; x < messageData.width; x++) {
          const index = y * messageData.width + x;
          if (messageData.bitmap[index] === 1) {
            const colorIndex = messageData.colorMap[index] || 1;
            ctx.fillStyle = colors[colorIndex] || "#FFFFFF";
            ctx.fillRect(x * scale, y * scale, scale - 1, scale - 1);
          }
        }
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [messageData, scale, isAnimating]);

  const handleReplay = () => {
    setIsAnimating(true);
    revealProgressRef.current = 0;
  };

  if (isLoading) {
    return (
      <div className={`arecibo-message-container ${className}`}>
        <div className="relative border border-blue-400/30 rounded bg-black flex items-center justify-center" style={{ minHeight: "300px" }}>
          <div className="text-blue-400 text-sm">
            <div className="animate-pulse">Generating Arecibo Message...</div>
            <div className="text-xs text-gray-400 mt-2 text-center">Fetching solar system data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!messageData) {
    return (
      <div className={`arecibo-message-container ${className}`}>
        <div className="relative border border-red-500/30 rounded bg-black flex items-center justify-center" style={{ minHeight: "300px" }}>
          <div className="text-red-400 text-sm">Error generating Arecibo message</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`arecibo-message-container ${className}`}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border border-blue-400/30 rounded bg-black"
          style={{
            imageRendering: "pixelated",
            width: "auto",
            height: "auto",
          }}
        />
        {showControls && !isAnimating && (
          <button onClick={handleReplay} className="absolute top-2 right-2 px-2 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400 rounded transition-colors">
            Replay
          </button>
        )}
      </div>

      {showInfo && (
        <div className="mt-2 text-xs text-gray-400">
          <div className="flex justify-between items-center">
            <span>
              Life Form: <span className="text-green-400">{messageData.lifeForm}</span>
            </span>
            <span>
              Planet: <span className="text-green-400">{messageData.planetName}</span>
            </span>
          </div>
          <div className="mt-1 text-[10px] text-center">
            <span>73×23 Procedural Arecibo Message</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreciboMessage;
