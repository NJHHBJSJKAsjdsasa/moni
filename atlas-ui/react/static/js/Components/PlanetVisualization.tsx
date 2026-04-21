// atlas-ui/react/static/js/Components/PlanetVisualization.tsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ModularPlanetRenderer } from "../3DComponents/ModularPlanetRenderer";
import StargateButton from "./StargateButton";
import AdaptivePreloadCanvas from "./AdaptivePreloadCanvas.tsx";

interface Planet {
  name: string;
  planet_type: string;
  atmosphere: string;
  life_forms: string;
  mass: number;
  diameter: number;
  density: number;
  gravity: number;
  orbital_radius: number;
  orbital_period_seconds: number;
  orbital_speed: number;
  axial_tilt: number;
  rotation_period_seconds: number;
  surface_temperature: number;
  elements: string[];
}

interface PlanetVisualizationProps {
  planetUrl: string;
  planet?: Planet;
  cosmicOriginTime?: number;
  initialAngleRotation?: number;
}

const PlanetVisualization: React.FC<PlanetVisualizationProps> = ({ planetUrl, planet, cosmicOriginTime, initialAngleRotation }) => {
  const decelerateRef = useRef(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasHidden, setCanvasHidden] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  const handleCloseFullscreen = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsFullscreen(false);
      setIsClosing(false);
    }, 300);
  };

  useEffect(() => {
    setTimeout(() => {
      setImageLoaded(true);
      setCanvasHidden(true);
      decelerateRef.current = true;
    }, 800);
  }, []);

  useEffect(() => {
    document.addEventListener("planet-close-fullscreen", handleCloseFullscreen);

    return () => {
      document.removeEventListener("planet-close-fullscreen", handleCloseFullscreen);
    };
  }, []);

  useEffect(() => {
    if (isEntering) {
      const timer = setTimeout(() => setIsEntering(false), 50);
      return () => clearTimeout(timer);
    }
  }, [isEntering]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white">{planet?.name || "Planet"}</h3>
      </div>

      <div className="relative w-full max-w-80 sm:max-w-96 aspect-square mx-auto bg-black/50 flex justify-center items-center rounded-xl overflow-hidden border-2 border-blue-400/30 mb-4">
        <AdaptivePreloadCanvas hidden={canvasHidden} decelerateRef={decelerateRef} />

        {imageLoaded && planet && (
          <div className={`absolute inset-0 w-full h-full transition-all duration-500 ${imageLoaded ? "opacity-100 blur-0" : "opacity-0 blur-[25px]"}`}>
            <ModularPlanetRenderer
              planetName={planet.name}
              containerClassName="w-full h-full"
              autoRotate={true}
              enableControls={true}
              showDebugInfo={true}
              planetData={{
                name: planet.name,
                diameter: planet.diameter,
                density: planet.density,
                gravity: planet.gravity,
                mass: planet.mass,
                orbital_radius: planet.orbital_radius,
                rotation_period_seconds: planet.rotation_period_seconds,
                surface_temperature: planet.surface_temperature,
                axial_tilt: planet.axial_tilt,
                planet_type: planet.planet_type,
                atmosphere: planet.atmosphere,
                elements: planet.elements,
              }}
              cosmicOriginTime={cosmicOriginTime}
              initialAngleRotation={initialAngleRotation}
            />

            <button
              onClick={() => {
                setIsFullscreen(true);
                setIsEntering(true);
              }}
              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 border border-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm shadow-lg z-10"
              title="Expand to fullscreen"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="text-center mt-auto">
        <StargateButton href={planetUrl} />

        <div className="mt-2 text-xs text-gray-500 text-center">Gateway to the stars</div>
      </div>

      {isFullscreen &&
        planet &&
        createPortal(
          <div className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-xl transition-all duration-300 ${isClosing ? "opacity-0 scale-95" : isEntering ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
            <div className={`w-full h-full flex flex-col p-1 sm:p-2 transition-all duration-300 delay-75 ${isClosing ? "opacity-0 translate-y-4" : isEntering ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="block sm:hidden">
                  <h2 className="text-xs font-medium text-white">Planet View</h2>
                </div>
                <div className="hidden sm:block">
                  <div>
                    <h2 className="text-lg font-bold text-white">Planet Visualization</h2>
                    <div className="text-sm text-gray-400">
                      Name: {planet.name} • Type: {planet.planet_type}
                    </div>
                  </div>
                </div>

                <button onClick={handleCloseFullscreen} className="p-0.5 sm:p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded transition-colors duration-200 text-red-400 hover:text-red-300" title="Close">
                  <svg className="w-3 h-3 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 border border-white/20 rounded-lg bg-black/20 overflow-hidden min-h-0">
                {isFullscreen && (
                  <ModularPlanetRenderer
                    planetName={planet.name}
                    containerClassName="w-full h-full"
                    autoRotate={false}
                    enableControls={true}
                    showDebugInfo={false}
                    planetData={{
                      name: planet.name,
                      diameter: planet.diameter,
                      density: planet.density,
                      gravity: planet.gravity,
                      mass: planet.mass,
                      orbital_radius: planet.orbital_radius,
                      rotation_period_seconds: planet.rotation_period_seconds,
                      surface_temperature: planet.surface_temperature,
                      axial_tilt: planet.axial_tilt,
                      planet_type: planet.planet_type,
                      atmosphere: planet.atmosphere,
                      elements: planet.elements,
                    }}
                    cosmicOriginTime={cosmicOriginTime}
                    initialAngleRotation={initialAngleRotation}
                  />
                )}
              </div>

              <div className="mt-2 sm:mt-4 text-center text-xs sm:text-sm text-gray-400">
                <div className="hidden sm:block">Mouse: Rotate • Scroll: Zoom • ESC: Close</div>
                <div className="sm:hidden">Pinch: Zoom • Drag: Rotate • ESC: Close</div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default PlanetVisualization;
