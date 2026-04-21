// atlas-ui/react/static/js/Components/CoordinateSelector.tsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import AntimatterIcon from "../Icons/AntimatterIcon.tsx";
import Element115Icon from "../Icons/Element115Icon.tsx";
import DeuteriumIcon from "../Icons/DeuteriumIcon.tsx";
import GalaxyIcon from "../Icons/GalaxyIcon.tsx";
import SystemIcon from "../Icons/SystemIcon.tsx";
import PlanetIcon from "../Icons/PlanetIcon.tsx";
import CoordinatesIcon from "../Icons/CoordinatesIcon.tsx";

interface Coordinates {
  x: number;
  y: number;
  z: number;
}

interface CoordinateSelectorProps {
  onCoordinateChange?: (coordinates: Coordinates, isUserInteraction?: boolean) => void;
  travelCost?: { antimatter: number; element115: number; deuterium: number } | null;
  canAfford?: boolean;
  formatResource?: (value: number) => string;
  efficiency?: number;
}

const MATRIX_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!·$%&/()=?#+-*<>[]{}^°@€<>~";
const ANIMATION_TIMINGS = {
  TYPEWRITER: 30,
  MATRIX_REVEAL: 15,
  MATRIX_CHANGE: 40,
  COORDINATE_JUMP_BASE: 1,
  COORDINATE_JUMP_MAX: 200,
} as const;

const AXIS_CONFIGS = {
  x: { label: "X", className: "axis-x", edges: ["The Edge", "The Unknown"] },
  y: { label: "Y", className: "axis-y", edges: ["The Edge", "The Unknown"] },
  z: { label: "Z", className: "axis-z", edges: ["The Edge", "The Unknown"] },
} as const;

const useTypewriter = (text: string, delay = 0, onComplete?: () => void) => {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) return;

    const timeout = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
          onComplete?.();
        }
      }, ANIMATION_TIMINGS.TYPEWRITER);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, delay, onComplete]);

  return { displayText, isComplete };
};

const TypewriterText: React.FC<{
  text: string;
  className?: string;
  delay?: number;
  onComplete?: () => void;
}> = ({ text, className = "", delay = 0, onComplete }) => {
  const { displayText, isComplete } = useTypewriter(text, delay, onComplete);

  return (
    <span className={className}>
      {displayText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
};

const useMatrixReveal = (text: string, delay = 0, matrixColor = "inherit") => {
  const [revealedChars, setRevealedChars] = useState<boolean[]>([]);
  const [matrixChars, setMatrixChars] = useState<string[]>([]);

  useEffect(() => {
    if (!text) return;

    const initialRevealed = new Array(text.length).fill(false);
    setRevealedChars(initialRevealed);
    setMatrixChars(text.split("").map(() => MATRIX_CHARSET[Math.floor(Math.random() * MATRIX_CHARSET.length)]));

    const timeout = setTimeout(() => {
      let currentIndex = 0;
      let currentRevealed = [...initialRevealed];

      const matrixInterval = setInterval(() => {
        setMatrixChars((prev) =>
          prev.map((_, index) => {
            if (currentRevealed[index]) return prev[index];
            return MATRIX_CHARSET[Math.floor(Math.random() * MATRIX_CHARSET.length)];
          })
        );
      }, ANIMATION_TIMINGS.MATRIX_CHANGE);

      const revealInterval = setInterval(() => {
        if (currentIndex < text.length) {
          currentRevealed[currentIndex] = true;
          setRevealedChars([...currentRevealed]);
          currentIndex++;
        } else {
          clearInterval(revealInterval);
          clearInterval(matrixInterval);
        }
      }, ANIMATION_TIMINGS.MATRIX_REVEAL);

      return () => {
        clearInterval(revealInterval);
        clearInterval(matrixInterval);
      };
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, delay]);

  return { revealedChars, matrixChars };
};

const MatrixRevealText: React.FC<{
  text: string;
  className?: string;
  delay?: number;
  matrixColor?: string;
}> = ({ text, className = "", delay = 0, matrixColor = "inherit" }) => {
  const { revealedChars, matrixChars } = useMatrixReveal(text, delay, matrixColor);

  return (
    <span className={className}>
      {text.split("").map((char, index) => (
        <span key={index} className={revealedChars[index] ? "" : "animate-pulse opacity-70"} style={revealedChars[index] ? {} : { color: matrixColor }}>
          {revealedChars[index] ? char : char === " " ? " " : matrixChars[index]}
        </span>
      ))}
    </span>
  );
};

const ButtonParticles: React.FC = () => (
  <div className="absolute inset-0">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="coordinate-selector-particle absolute w-1 h-1 bg-white/60 rounded-full"
        style={{
          left: `${15 + i * 12}%`,
          top: `${20 + (i % 2) * 60}%`,
          animationDelay: `${i * 0.2}s`,
        }}
      ></div>
    ))}
  </div>
);

const ButtonGroup: React.FC<{
  showInitializeJump: boolean;
  slideUpInitializeJump: boolean;
  isRandomJumping: boolean;
  showSpinner: boolean;
  randomJumpText: string;
  shouldCollapseButton: boolean;
  onRandomJump: () => void;
}> = ({ showInitializeJump, slideUpInitializeJump, isRandomJumping, showSpinner, randomJumpText, shouldCollapseButton, onRandomJump }) => (
  <div className={`w-full flex relative z-10 transition-all duration-800 ${shouldCollapseButton ? "justify-center animate-accordionCollapse" : ""}`}>
    <button
      type="submit"
      className={`
        bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800
        text-white font-bold rounded-xl shadow-lg backdrop-blur-sm transition-all duration-500 transform hover:scale-95 overflow-hidden
        ${slideUpInitializeJump ? "animate-accordionCollapse" : ""}
        ${showInitializeJump && !isRandomJumping ? "w-1/2 max-h-20 opacity-100 px-6 sm:px-8 py-3 sm:py-4 mr-4" : "w-0 max-h-0 opacity-0 px-0 py-0 mr-0 overflow-hidden"}
      `}
      disabled={!showInitializeJump || isRandomJumping}
    >
      <span className="relative z-10 flex items-center justify-center gap-3">
        <span className={`text-base sm:text-lg transition-opacity duration-200 ${showInitializeJump && !isRandomJumping ? "opacity-100" : "opacity-0"}`}>🚀 Initialize Jump</span>
      </span>
    </button>
    <button
      type="button"
      className={`
        group relative overflow-hidden font-bold text-lg rounded-xl shadow-lg backdrop-blur-sm
        transition-all duration-500 transform hover:scale-95
        ${isRandomJumping || !showInitializeJump ? "w-full" : "w-1/2"}
        ${isRandomJumping ? "bg-gradient-to-r from-cyan-500/20 via-purple-500/30 to-cyan-500/20 text-cyan-400 cursor-wait" : "bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white hover:from-purple-700 hover:via-pink-700 hover:to-purple-800"}
        px-6 sm:px-8 py-3 sm:py-4
      `}
      onClick={isRandomJumping ? undefined : onRandomJump}
      disabled={isRandomJumping}
    >
      {!isRandomJumping && (
        <div
          className="coordinate-selector-energy-wave absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/20 to-cyan-400/0
                        translate-x-[-100%] group-hover:translate-x-[100%]"
        ></div>
      )}

      {!isRandomJumping && <ButtonParticles />}

      <span className="relative z-10 flex items-center justify-center gap-3">
        {isRandomJumping ? (
          <>
            {showSpinner && <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>}
            <span className="font-mono text-cyan-300">{randomJumpText}</span>
          </>
        ) : (
          <span className="text-base sm:text-lg">🎲 Random Location</span>
        )}
      </span>

      {!isRandomJumping && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300
                        bg-gradient-to-r from-white via-transparent to-white blur-sm"
        ></div>
      )}
    </button>
  </div>
);

const CoordinateSelector: React.FC<CoordinateSelectorProps> = ({ onCoordinateChange, travelCost, canAfford, formatResource }) => {
  const [coordinates, setCoordinates] = useState({
    x: 1000000,
    y: 1000000,
    z: 1000000,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRandomJumping, setIsRandomJumping] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showInitializeJump, setShowInitializeJump] = useState(true);
  const [slideUpInitializeJump, setSlideUpInitializeJump] = useState(false);
  const [randomJumpText, setRandomJumpText] = useState("🎲 Random Location");
  const [shouldCollapseButton, setShouldCollapseButton] = useState(false);
  const [coordinateGlitchStates, setCoordinateGlitchStates] = useState({
    x: false,
    y: false,
    z: false,
  });

  const coordinateOptions = useMemo(
    () => ({
      x: [
        { value: 0, name: "The Edge" },
        { value: 1000000, name: "Alpha" },
        { value: 2000000, name: "Beta" },
        { value: 3000000, name: "Gamma" },
        { value: 4000000, name: "Delta" },
        { value: 5000000, name: "Epsilon" },
        { value: 6000000, name: "Zeta" },
        { value: 7000000, name: "Eta" },
        { value: 8000000, name: "Theta" },
        { value: 9000000, name: "Iota" },
        { value: 10000000, name: "The Unknown" },
      ],
      y: [
        { value: 0, name: "The Edge" },
        { value: 1000000, name: "Lambda" },
        { value: 2000000, name: "Mu" },
        { value: 3000000, name: "Nu" },
        { value: 4000000, name: "Xi" },
        { value: 5000000, name: "Omicron" },
        { value: 6000000, name: "Pi" },
        { value: 7000000, name: "Rho" },
        { value: 8000000, name: "Sigma" },
        { value: 9000000, name: "Tau" },
        { value: 10000000, name: "The Unknown" },
      ],
      z: [
        { value: 0, name: "The Edge" },
        { value: 1000000, name: "Phi" },
        { value: 2000000, name: "Chi" },
        { value: 3000000, name: "Psi" },
        { value: 4000000, name: "Omega" },
        { value: 5000000, name: "Vega" },
        { value: 6000000, name: "Rigel" },
        { value: 7000000, name: "Sirius" },
        { value: 8000000, name: "Antares" },
        { value: 9000000, name: "Procyon" },
        { value: 10000000, name: "The Unknown" },
      ],
    }),
    []
  );

  const updateSelectOption = (coordinate, value) => {
    const options = coordinateOptions[coordinate];
    for (let i = 0; i < options.length; i++) {
      const optionValue = options[i].value;
      const nextOptionValue = i < options.length - 1 ? options[i + 1].value : 10000001;

      if ((i === 0 && value <= 999999) || (value >= optionValue && value < nextOptionValue) || (i === options.length - 1 && value >= 9000000 && value <= 10000000)) {
        return i;
      }
    }
    return -1;
  };

  const handleSliderChange = (coordinate, value) => {
    const numValue = parseInt(value, 10);
    setCoordinates((prev) => ({
      ...prev,
      [coordinate]: numValue,
    }));
    if (isInitialized && onCoordinateChange) {
      onCoordinateChange({ ...coordinates, [coordinate]: numValue }, true);
    }
  };

  const handleInputChange = (coordinate, value) => {
    let numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) {
      numValue = 0;
    } else if (numValue > 10000000) {
      numValue = 10000000;
    }

    setCoordinates((prev) => ({
      ...prev,
      [coordinate]: numValue,
    }));
    if (isInitialized && onCoordinateChange) {
      onCoordinateChange({ ...coordinates, [coordinate]: numValue }, true);
    }
  };

  const handleSelectChange = (coordinate, value) => {
    const numValue = parseInt(value, 10);
    setCoordinates((prev) => ({
      ...prev,
      [coordinate]: numValue,
    }));
    if (isInitialized && onCoordinateChange) {
      onCoordinateChange({ ...coordinates, [coordinate]: numValue }, true);
    }
  };

  const randomizeCoordinates = () => {
    const maxCoordinate = 10000000;
    const newCoordinates = {
      x: Math.floor(Math.random() * maxCoordinate),
      y: Math.floor(Math.random() * maxCoordinate),
      z: Math.floor(Math.random() * maxCoordinate),
    };
    setCoordinates(newCoordinates);
    if (isInitialized && onCoordinateChange) {
      onCoordinateChange(newCoordinates, true);
    }
  };

  const getRandomString = (chars: string, length: number) => {
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const cleanName = (name: string) => {
    return name.replace(/_/g, " ");
  };

  const renderGlitchCoordinate = (value: number, axis: "x" | "y" | "z") => {
    const isGlitching = coordinateGlitchStates[axis];

    if (isGlitching) {
      return <span className="font-mono text-xl sm:text-2xl text-cyan-400 drop-shadow-sm animate-pulse">{value.toLocaleString()}</span>;
    }

    return <span className="font-mono text-xl sm:text-2xl text-cyan-400 drop-shadow-sm transition-all duration-300">{value.toLocaleString()}</span>;
  };

  const handleRandomLocationJump = async () => {
    setIsRandomJumping(true);
    setShowSpinner(true);
    setRandomJumpText("Jump Protocol");

    if ((window as any).setRandomLocationActive) {
      (window as any).setRandomLocationActive(true);
    }

    setCoordinateGlitchStates({ x: true, y: true, z: true });

    let matrixIntervalId: NodeJS.Timeout | null = null;
    let isMatrixRunning = true;

    try {
      const locationResponse = await fetch("/api/generate-random-location");
      if (!locationResponse.ok) {
        throw new Error("Failed to generate random location");
      }

      const locationData = await locationResponse.json();

      const finalCoordinates = {
        x: locationData.coordinates.x,
        y: locationData.coordinates.y,
        z: locationData.coordinates.z,
      };

      const galaxyData = {
        galaxy_name: locationData.galaxy_name,
        galaxy_type: locationData.galaxy_type,
        num_systems: locationData.num_systems,
      };

      const navigationData = locationData.navigation_data;
      const finalSystemName = locationData.system_name || "";
      const finalPlanetName = locationData.planet_name || "";

      const matrixChars = MATRIX_CHARSET;

      const startMatrixEffect = () => {
        matrixIntervalId = setInterval(() => {
          if (isMatrixRunning) {
            setRandomJumpText(getRandomString(matrixChars, 15));
          }
        }, 10);
      };

      const stopMatrixEffect = () => {
        isMatrixRunning = false;
        if (matrixIntervalId) {
          clearInterval(matrixIntervalId);
          matrixIntervalId = null;
        }
      };

      startMatrixEffect();

      const numJumps = 40 + Math.floor(Math.random() * 21);
      for (let jump = 0; jump < numJumps; jump++) {
        const progress = jump / (numJumps - 1);

        const baseDelay = 1;
        const maxDelay = 200;
        const exponentialFactor = 4;
        const currentDelay = baseDelay + Math.pow(progress, exponentialFactor) * (maxDelay - baseDelay);

        const randomCoords = {
          x: Math.floor(Math.random() * 10000001),
          y: Math.floor(Math.random() * 10000001),
          z: Math.floor(Math.random() * 10000001),
        };
        setCoordinates(randomCoords);
        if (onCoordinateChange) {
          onCoordinateChange(randomCoords, true);
        }

        await sleep(currentDelay);
      }

      setCoordinates(finalCoordinates);
      if (onCoordinateChange) {
        onCoordinateChange(finalCoordinates, true);
      }

      await sleep(1500);

      stopMatrixEffect();
      setRandomJumpText("...");
      setShowSpinner(false);
      setShouldCollapseButton(true);
      setCoordinateGlitchStates({ x: false, y: false, z: false });

      setSlideUpInitializeJump(true);
      setTimeout(() => {
        setShowInitializeJump(false);
      }, 600);

      await sleep(300);

      const toast = document.createElement("div");
      toast.className = "fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] w-[90vw] max-w-lg opacity-0 scale-95 transition-all duration-500 ease-out";

      setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translate(-50%, 0) scale(1)";
      }, 100);

      const popup = document.createElement("div");
      popup.className = "relative rounded-lg shadow-lg border px-4 py-3 transition-all duration-1000 bg-gradient-to-r from-slate-900/90 to-blue-900/90 border-cyan-500/50";

      const overlay = document.createElement("div");
      overlay.className = "absolute inset-0 rounded-lg transition-all duration-1000 ease-in-out";
      overlay.style.background = "transparent";
      overlay.style.opacity = "0";
      popup.appendChild(overlay);

      const container = document.createElement("div");
      container.className = "flex items-center space-x-3 relative z-10";

      const iconDiv = document.createElement("div");
      iconDiv.className = "flex items-center justify-center w-8 h-8 transition-all duration-500 ease-in-out";

      const iconRoot = createRoot(iconDiv);
      iconRoot.render(React.createElement(CoordinatesIcon, { size: 24, color: "#60A5FA" }));

      const contentDiv = document.createElement("div");
      contentDiv.className = "flex-1 min-w-0 overflow-hidden";

      const flashDiv = document.createElement("div");
      flashDiv.className = "text-sm font-medium transition-all duration-500 ease-in-out overflow-hidden";

      contentDiv.appendChild(flashDiv);
      container.appendChild(iconDiv);
      container.appendChild(contentDiv);
      popup.appendChild(container);
      toast.appendChild(popup);

      document.body.appendChild(toast);

      const contentRoot = createRoot(contentDiv);

      const updateFlash = (type: string) => {
        iconDiv.style.transform = "scale(0.5)";
        iconDiv.style.opacity = "0";
        flashDiv.style.transform = "translateX(-20px)";
        flashDiv.style.opacity = "0";

        setTimeout(() => {
          if (type === "coordinates") {
            iconRoot.render(React.createElement(CoordinatesIcon, { size: 24, color: "#60A5FA" }));
            contentRoot.render(
              React.createElement("div", { className: "flex items-center gap-1.5 min-w-0" }, [
                React.createElement(
                  "span",
                  {
                    key: "label",
                    className: "px-2 py-1 bg-blue-900/50 text-blue-300 text-[10px] font-mono uppercase rounded border border-blue-500/30 flex-shrink-0",
                  },
                  "COORDS"
                ),
                React.createElement(
                  "span",
                  {
                    key: "value",
                    className: "text-sm text-blue-200 truncate flex-1 min-w-0",
                  },
                  `[${finalCoordinates.x.toLocaleString()}, ${finalCoordinates.y.toLocaleString()}, ${finalCoordinates.z.toLocaleString()}]`
                ),
              ])
            );
          } else if (type === "galaxy") {
            iconRoot.render(React.createElement(GalaxyIcon, { size: 24, color: "#C084FC" }));
            contentRoot.render(
              React.createElement("div", { className: "flex items-center gap-1.5 min-w-0" }, [
                React.createElement(
                  "span",
                  {
                    key: "label",
                    className: "px-2 py-1 bg-purple-900/50 text-purple-300 text-[10px] font-mono uppercase rounded border border-purple-500/30 flex-shrink-0",
                  },
                  "GALAXY"
                ),
                React.createElement(
                  "span",
                  {
                    key: "value",
                    className: "text-sm text-purple-200 truncate flex-1 min-w-0",
                  },
                  cleanName(galaxyData.galaxy_name)
                ),
              ])
            );
          } else if (type === "system" && finalSystemName) {
            iconRoot.render(React.createElement(SystemIcon, { size: 24, color: "#67E8F9" }));
            contentRoot.render(
              React.createElement("div", { className: "flex items-center gap-1.5 min-w-0" }, [
                React.createElement(
                  "span",
                  {
                    key: "label",
                    className: "px-2 py-1 bg-cyan-900/50 text-cyan-300 text-[10px] font-mono uppercase rounded border border-cyan-500/30 flex-shrink-0",
                  },
                  "SYSTEM"
                ),
                React.createElement(
                  "span",
                  {
                    key: "value",
                    className: "text-sm text-cyan-200 truncate flex-1 min-w-0",
                  },
                  cleanName(finalSystemName)
                ),
              ])
            );
          } else if (type === "planet" && finalPlanetName) {
            iconRoot.render(React.createElement(PlanetIcon, { size: 24, color: "#F9A8D4" }));
            contentRoot.render(
              React.createElement("div", { className: "flex items-center gap-1.5 min-w-0" }, [
                React.createElement(
                  "span",
                  {
                    key: "label",
                    className: "px-2 py-1 bg-pink-900/50 text-pink-300 text-[10px] font-mono uppercase rounded border border-pink-500/30 flex-shrink-0",
                  },
                  "PLANET"
                ),
                React.createElement(
                  "span",
                  {
                    key: "value",
                    className: "text-sm text-pink-200 truncate flex-1 min-w-0",
                  },
                  cleanName(finalPlanetName)
                ),
              ])
            );
          }

          setTimeout(() => {
            iconDiv.style.transform = "scale(1)";
            iconDiv.style.opacity = "1";
            flashDiv.style.transform = "translateX(0)";
            flashDiv.style.opacity = "1";
          }, 50);
        }, 250);
      };

      updateFlash("coordinates");
      await sleep(1000);

      updateFlash("galaxy");
      await sleep(900);

      if (finalSystemName) {
        updateFlash("system");
        await sleep(900);
      }

      if (finalPlanetName) {
        updateFlash("planet");
        await sleep(900);
      }

      overlay.style.background = "linear-gradient(to right, rgb(20 83 45 / 0.9), rgb(30 58 138 / 0.9))";
      overlay.style.opacity = "1";
      popup.style.borderColor = "rgb(34 197 94 / 0.5)";

      await sleep(500);

      setTimeout(() => {
        if ((window as any).setRandomLocationActive) {
          (window as any).setRandomLocationActive(false);
        }

        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/api/random-jump";
        form.style.display = "none";

        Object.keys(navigationData).forEach((key) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = navigationData[key];
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      }, 1000);
    } catch (error) {
      console.error("Random jump failed:", error);

      if ((window as any).setRandomLocationActive) {
        (window as any).setRandomLocationActive(false);
      }

      if (matrixIntervalId) {
        clearInterval(matrixIntervalId);
      }
      setRandomJumpText("❌ Jump failed");
      setShowSpinner(false);
      setCoordinateGlitchStates({ x: false, y: false, z: false });
      setSlideUpInitializeJump(false);
      setShouldCollapseButton(false);
      setTimeout(() => {
        setIsRandomJumping(false);
        setShowInitializeJump(true);
        setRandomJumpText("🎲 Random Location");
      }, 2000);
    }
  };

  useEffect(() => {
    if (onCoordinateChange && isInitialized) {
      onCoordinateChange(coordinates, false);
    }
  }, [coordinates, onCoordinateChange, isInitialized]);

  useEffect(() => {
    randomizeCoordinates();
    setIsInitialized(true);
  }, []);

  const renderCoordinateGroup = useCallback(
    (coordinate: keyof Coordinates, label: string) => {
      const selectedIndex = updateSelectOption(coordinate, coordinates[coordinate]);
      const config = AXIS_CONFIGS[coordinate];
      const axisClass = config.className;

      return (
        <div className={`space-y-3 ${axisClass}`} key={coordinate}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-white truncate flex-1 min-w-0">{label} Coordinate</h3>
            <div className="font-bold flex-shrink-0" style={{ color: "var(--accent-color)" }}>
              {renderGlitchCoordinate(coordinates[coordinate], coordinate)}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              id={`${coordinate}-name`}
              className="flex-1 bg-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:border-transparent backdrop-blur-sm"
              style={
                {
                  borderColor: "var(--border-color)",
                  "--tw-ring-color": "var(--ring-color)",
                } as React.CSSProperties
              }
              value={selectedIndex >= 0 ? coordinateOptions[coordinate][selectedIndex].value : ""}
              onChange={(e) => handleSelectChange(coordinate, e.target.value)}
            >
              {coordinateOptions[coordinate].map((option: any, index: any) => (
                <option key={index} value={option.value} className="bg-gray-800 text-white truncate">
                  {option.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              id={`${coordinate}-value`}
              name={coordinate}
              value={coordinates[coordinate]}
              className="flex-1 bg-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:border-transparent backdrop-blur-sm"
              style={
                {
                  borderColor: "var(--border-color)",
                  "--tw-ring-color": "var(--ring-color)",
                } as React.CSSProperties
              }
              min="0"
              max="10000000"
              onChange={(e) => handleInputChange(coordinate, e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 opacity-20 rounded-xl blur-sm" style={{ background: "var(--gradient-colors)" }}></div>
              <div className="relative p-2 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                <div className="relative">
                  <div className="absolute top-1 left-3 right-3 h-3 bg-white/10 rounded-xl"></div>
                  <div
                    className="absolute top-1 left-3 right-3 h-3 rounded-xl transition-all duration-200 pointer-events-none z-10"
                    style={{
                      background: "var(--gradient-colors)",
                      width: `calc(${(coordinates[coordinate] / 10000000) * 100}% - 12px)`,
                    }}
                  ></div>
                  <input type="range" id={`${coordinate}-slider`} name={coordinate} min="0" max="10000000" value={coordinates[coordinate]} className="relative z-20 w-full h-3 bg-transparent rounded-xl appearance-none cursor-pointer transition-all duration-200" onChange={(e) => handleSliderChange(coordinate, e.target.value)} />
                  <div className="flex justify-between items-center mt-2 text-xs font-medium">
                    <span className="drop-shadow-sm flex-shrink-0" style={{ color: "var(--text-color)" }}>
                      The Edge
                    </span>
                    <span className="text-center truncate flex-1 min-w-0 px-2" style={{ color: "var(--text-color)" }}>
                      {coordinateOptions[coordinate][selectedIndex >= 0 ? selectedIndex : 0]?.name || "Unknown Region"}
                    </span>
                    <span className="drop-shadow-sm flex-shrink-0" style={{ color: "var(--text-color)" }}>
                      The Unknown
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    },
    [coordinates, coordinateOptions, updateSelectOption, renderGlitchCoordinate, handleSelectChange, handleInputChange, handleSliderChange]
  );

  return (
    <>
      <div className="w-full space-y-6 sm:space-y-8 relative">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 relative">
          <div className="w-full bg-white/5 rounded-xl p-3 sm:p-4 lg:p-6 border border-blue-500/30 backdrop-blur-sm">{renderCoordinateGroup("x", "X")}</div>
          <div className="w-full bg-white/5 rounded-xl p-3 sm:p-4 lg:p-6 border border-purple-500/30 backdrop-blur-sm">{renderCoordinateGroup("y", "Y")}</div>
          <div className="w-full bg-white/5 rounded-xl p-3 sm:p-4 lg:p-6 border border-pink-500/30 backdrop-blur-sm md:col-span-2 lg:col-span-1">{renderCoordinateGroup("z", "Z")}</div>
        </div>

        <ButtonGroup showInitializeJump={showInitializeJump} slideUpInitializeJump={slideUpInitializeJump} isRandomJumping={isRandomJumping} showSpinner={showSpinner} randomJumpText={randomJumpText} shouldCollapseButton={shouldCollapseButton} onRandomJump={handleRandomLocationJump} />

        {travelCost && formatResource && (
          <div className="w-full relative z-10">
            <div className={`w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 border backdrop-blur-sm text-sm ${canAfford ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
              <div className="flex items-center gap-1 text-xl">
                <AntimatterIcon size={20} color="#a855f7" />
                <span className="text-purple-400 font-medium">{formatResource(travelCost.antimatter)}</span>
              </div>
              <div className="flex items-center gap-1 text-xl">
                <Element115Icon size={20} color="#06b6d4" />
                <span className="text-cyan-400 font-medium">{formatResource(travelCost.element115)}</span>
              </div>
              <div className="flex items-center gap-1 text-xl">
                <DeuteriumIcon size={20} color="#fb7185" />
                <span className="text-orange-400 font-medium">{formatResource(travelCost.deuterium)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CoordinateSelector;
