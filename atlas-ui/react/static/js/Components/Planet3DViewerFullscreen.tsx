// atlas-ui/react/static/js/Components/Planet3DViewerFullscreen.tsx
import React, { useEffect, useState } from "react";
import { ModularPlanetRendererWrapper } from "../3DComponents/ModularPlanetRendererWrapper";
import { VerticalTimeSlider, sliderToTimeOffset, timeOffsetToSlider, formatTimeOffset } from "./VerticalTimeSlider";

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

interface Planet3DViewerFullscreenProps {
  planet: Planet;
  cosmicOriginTime?: number;
  initialAngleRotation?: number;
  onEffectsCreated?: (effects: any[]) => void;
}

const Planet3DViewerFullscreen: React.FC<Planet3DViewerFullscreenProps> = ({ planet, cosmicOriginTime, initialAngleRotation, onEffectsCreated }) => {
  const [sliderPosition, setSliderPosition] = useState(0); // -100 to 100
  const [timeOffset, setTimeOffset] = useState(0); // actual seconds

  const minTimeOffset = cosmicOriginTime !== undefined ? cosmicOriginTime - Date.now() / 1000 : undefined;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      document.dispatchEvent(new CustomEvent("planet-close-fullscreen"));
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSliderChange = (newPosition: number) => {
    const minSliderPos = minTimeOffset !== undefined ? Math.max(-100, timeOffsetToSlider(minTimeOffset)) : -100;
    const clampedPosition = Math.max(minSliderPos, Math.min(100, newPosition));
    setSliderPosition(clampedPosition);
    setTimeOffset(sliderToTimeOffset(clampedPosition));
  };

  const resetToNow = () => {
    setSliderPosition(0);
    setTimeOffset(0);
  };

  return (
    <div className="w-full h-full relative">
      <ModularPlanetRendererWrapper
        planetName={planet.name}
        containerClassName="w-full h-full"
        autoRotate={false}
        enableControls={true}
        showDebugInfo={false}
        {...(onEffectsCreated && { onEffectsCreated })}
        planetData={{
          name: planet.name,
          diameter: planet.diameter,
          density: planet.density,
          gravity: planet.gravity,
          mass: planet.mass,
          orbital_radius: planet.orbital_radius,
          orbital_period_seconds: planet.orbital_period_seconds,
          rotation_period_seconds: planet.rotation_period_seconds,
          surface_temperature: planet.surface_temperature,
          axial_tilt: planet.axial_tilt,
          planet_type: planet.planet_type,
          atmosphere: planet.atmosphere,
          elements: planet.elements,
          initial_orbital_angle: (planet as any).initial_orbital_angle || 0,
        }}
        cosmicOriginTime={cosmicOriginTime}
        initialAngleRotation={initialAngleRotation}
        timeOffset={timeOffset}
      />

      <VerticalTimeSlider sliderPosition={sliderPosition} timeOffset={timeOffset} onSliderChange={handleSliderChange} onReset={resetToNow} minTimeOffset={minTimeOffset} />
    </div>
  );
};

export default Planet3DViewerFullscreen;
