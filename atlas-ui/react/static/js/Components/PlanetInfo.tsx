// atlas-ui/react/static/js/Components/PlanetInfo.tsx
import React, { useState, useEffect } from "react";
import SaveLocationButton from "./SaveLocationButton.tsx";
import ResourceCollectionButton from "./ResourceCollectionButton.tsx";
import EffectsControl from "./EffectsControl.tsx";
import MiningIndicator from "./MiningIndicator.tsx";
import PeriodicElement from "./PeriodicElement.tsx";
import AreciboMessage from "./AreciboMessage.tsx";
import AreciboModal from "./AreciboModal.tsx";
import { SpaceshipResourceCollectionManager } from "../Utils/SpaceshipResourceCollection.tsx";
import { LocationBookmarks } from "../Utils/LocationBookmarks.tsx";
import { StargateGenerator } from "../Utils/StargateGenerator.tsx";
import { ResourceEventManager } from "../Utils/ResourceEventManager.tsx";

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

interface System {
  name: string;
  index: number;
}

interface Galaxy {
  name: string;
  coordinates: number[];
}

interface EffectInfo {
  id: string;
  type: string;
  enabled: boolean;
}

interface MoonData {
  name: string;
  properties: {
    mass_kg: number;
    radius_km: number;
    density_kg_m3: number;
    type: string;
    origin: string;
  };
  orbit: {
    semi_major_axis_km: number;
    eccentricity: number;
    inclination_deg: number;
    orbital_period_seconds: number;
    orbital_period_days: number;
    current_angle: number;
  };
  rotation: {
    rotation_period_s: number;
    rotation_period_hours: number;
    angular_velocity_rad_s: number;
    is_tidally_locked: boolean;
  };
  visuals: {
    base_color: string;
    roughness: number;
    metalness: number;
    normal_strength: number;
    relative_size: number;
    has_atmosphere: boolean;
    atmosphere_color?: string;
    atmosphere_opacity?: number;
  };
}

interface PlanetInfoProps {
  planet: Planet;
  system: System;
  galaxy: Galaxy;
  cosmicOriginTime?: number;
  initialAngleRotation?: number;
  effects?: EffectInfo[];
  onToggleEffect?: (effectId: string, enabled: boolean) => void;
  selectedMoon?: MoonData | null;
}

const PlanetInfo: React.FC<PlanetInfoProps> = ({ planet, system, galaxy, cosmicOriginTime, initialAngleRotation, effects, onToggleEffect, selectedMoon }) => {
  const [showAllElements, setShowAllElements] = useState(false);
  const [showAreciboModal, setShowAreciboModal] = useState(false);
  const [miningState, setMiningState] = useState({
    isOnCooldown: false,
    isSaved: false,
    isCollecting: false,
    timeUntilNext: 0,
  });

  useEffect(() => {
    let collectingTimeout: NodeJS.Timeout;

    const updateMiningState = () => {
      const fullLocationId = SpaceshipResourceCollectionManager.generateLocationId("planet", galaxy.coordinates.join(","), system.index, planet.name);

      const canCollect = SpaceshipResourceCollectionManager.canCollectFromLocation(fullLocationId);
      const timeRemaining = SpaceshipResourceCollectionManager.getTimeUntilNextCollection(fullLocationId);

      const galaxyCoords = galaxy.coordinates;
      const stargateUrl = StargateGenerator.generatePlanetUrl(galaxyCoords, system.index, planet.name, StargateGenerator.getCurrentPage());
      const savedLocations = LocationBookmarks.getLocations();
      const isSaved = savedLocations.some((loc) => loc.stargateUrl === stargateUrl);

      setMiningState((prev) => ({
        isOnCooldown: !canCollect && timeRemaining > 0,
        isSaved: isSaved,
        isCollecting: prev.isCollecting,
        timeUntilNext: timeRemaining,
      }));
    };

    const handleMiningCompleted = () => {
      setMiningState((prev) => ({
        ...prev,
        isCollecting: true,
      }));

      collectingTimeout = setTimeout(() => {
        setMiningState((prev) => ({
          ...prev,
          isCollecting: false,
        }));
      }, 1000);
    };

    updateMiningState();
    const interval = setInterval(updateMiningState, 1000);

    const unsubscribe = ResourceEventManager.subscribe("mining_completed", handleMiningCompleted);

    return () => {
      clearInterval(interval);
      if (collectingTimeout) clearTimeout(collectingTimeout);
      unsubscribe();
    };
  }, [planet.name, system.index, galaxy.coordinates]);

  const formatName = (name: string) => {
    return name.replace(/_/g, " ");
  };

  const formatPeriod = (seconds: number) => {
    const days = seconds / (60 * 60 * 24);
    if (days < 30) {
      return `${days.toFixed(2)} days`;
    } else if (days < 365) {
      return `${(days / 30).toFixed(2)} months`;
    } else {
      return `${(days / 365).toFixed(2)} years`;
    }
  };

  const formatTemperature = (celsius: number) => {
    const fahrenheit = (celsius * 9) / 5 + 32;
    return `${celsius.toFixed(1)}°C (${fahrenheit.toFixed(1)}°F)`;
  };

  const formatMass = (mass: number) => {
    return `${mass.toExponential(2)} kg`;
  };

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(2)} km`;
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="absolute top-0 right-0 flex gap-2 z-10">
        <ResourceCollectionButton locationType="planet" locationId={planet.name} coordinates={galaxy.coordinates.join(",")} systemIndex={system.index} planetName={planet.name} planetElements={planet.elements} className="text-xs" />
        <SaveLocationButton type="planet" name={planet.name} coordinates={galaxy.coordinates.join(",")} systemIndex={system.index} planetName={planet.name} className="text-xs" />
        <div className="inline-flex items-center bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-medium px-1.5 py-0.5 rounded h-[21px] box-border">VISITED</div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <MiningIndicator isOnCooldown={miningState.isOnCooldown} isSaved={miningState.isSaved} isCollecting={miningState.isCollecting} />
        <h3 className="text-lg sm:text-xl font-bold text-white">Details</h3>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/10 rounded-lg p-2 border border-blue-500/30">
          <div className="text-xs text-gray-200">Type</div>
          <div className="text-sm font-bold text-blue-300 capitalize">{planet.planet_type}</div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 border border-purple-500/30">
          <div className="text-xs text-gray-200">Atmosphere</div>
          <div className="text-sm font-bold text-purple-300 capitalize">{planet.atmosphere}</div>
        </div>
        {planet.life_forms !== "None" ? (
          <div className="relative">
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse z-20 border border-green-300">
              <div className="w-full h-full bg-green-400 rounded-full animate-ping absolute"></div>
            </div>
            {/* Clickable Life Forms div */}
            <button onClick={() => setShowAreciboModal(true)} className="w-full bg-white/10 hover:bg-green-500/20 rounded-lg p-2 border border-green-500/30 hover:border-green-400 transition-all duration-300 animate-pulse-glow hover:animate-bounce-subtle group cursor-pointer text-left" title="Click to view Arecibo message">
              <div className="text-xs text-gray-200 group-hover:text-green-200 transition-colors">Life Forms</div>
              <div className="text-sm font-bold text-green-300 group-hover:text-green-200 capitalize transition-colors">{planet.life_forms}</div>
            </button>
          </div>
        ) : (
          <div className="bg-white/10 rounded-lg p-2 border border-green-500/30">
            <div className="text-xs text-gray-200">Life Forms</div>
            <div className="text-sm font-bold text-green-300 capitalize">{planet.life_forms}</div>
          </div>
        )}
      </div>

      <div className="bg-white/10 rounded-lg p-2 border border-orange-500/30 mb-3">
        <div className="text-xs text-gray-200 mb-2">Physical Properties</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
          <div className="bg-white/5 rounded p-1.5 border border-orange-500/20">
            <div className="text-xs text-gray-300">Mass</div>
            <div className="text-xs font-bold text-orange-300">{formatMass(planet.mass)}</div>
          </div>
          <div className="bg-white/5 rounded p-1.5 border border-orange-500/20">
            <div className="text-xs text-gray-300">Diameter</div>
            <div className="text-xs font-bold text-orange-300">{formatDistance(planet.diameter)}</div>
          </div>
          <div className="bg-white/5 rounded p-1.5 border border-orange-500/20">
            <div className="text-xs text-gray-300">Density</div>
            <div className="text-xs font-bold text-orange-300">{planet.density.toFixed(2)} kg/m³</div>
          </div>
          <div className="bg-white/5 rounded p-1.5 border border-orange-500/20">
            <div className="text-xs text-gray-300">Gravity</div>
            <div className="text-xs font-bold text-orange-300">{planet.gravity.toFixed(2)} m/s²</div>
          </div>
        </div>
      </div>

      <div className="bg-white/10 rounded-lg p-2 border border-cyan-500/30 mb-3">
        <div className="text-xs text-gray-200 mb-2">Orbital Properties</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
          <div className="bg-white/5 rounded p-1.5 border border-cyan-500/20">
            <div className="text-xs text-gray-300">Radius</div>
            <div className="text-xs font-bold text-cyan-300">{planet.orbital_radius.toFixed(2)} AU</div>
          </div>
          <div className="bg-white/5 rounded p-1.5 border border-cyan-500/20">
            <div className="text-xs text-gray-300">Period</div>
            <div className="text-xs font-bold text-cyan-300">{formatPeriod(planet.orbital_period_seconds)}</div>
          </div>
          <div className="bg-white/5 rounded p-1.5 border border-cyan-500/20">
            <div className="text-xs text-gray-300">Speed</div>
            <div className="text-xs font-bold text-cyan-300">{planet.orbital_speed.toFixed(2)} m/s</div>
          </div>
          <div className="bg-white/5 rounded p-1.5 border border-cyan-500/20">
            <div className="text-xs text-gray-300">Tilt</div>
            <div className="text-xs font-bold text-cyan-300">{planet.axial_tilt.toFixed(2)}°</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <div className="bg-white/10 rounded-lg p-2 border border-red-500/30">
          <div className="text-xs text-gray-200 mb-2">Surface Conditions</div>
          <div className="grid grid-cols-2 gap-1">
            <div className="bg-white/5 rounded p-1.5 border border-red-500/20">
              <div className="text-xs text-gray-300">Temperature</div>
              <div className="text-xs font-bold text-red-300">{formatTemperature(planet.surface_temperature)}</div>
            </div>
            <div className="bg-white/5 rounded p-1.5 border border-red-500/20">
              <div className="text-xs text-gray-300">Rotation</div>
              <div className="text-xs font-bold text-red-300">{formatPeriod(planet.rotation_period_seconds)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-2 border border-yellow-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-200">Elements ({planet.elements.length})</div>
            <button onClick={() => setShowAllElements(!showAllElements)} className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors duration-300">
              {showAllElements ? "▲ Collapse" : "▼ Expand"}
            </button>
          </div>

          {showAllElements ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {planet.elements.map((element, index) => (
                <PeriodicElement key={index} elementName={element} expanded={true} showResources={true} className="min-w-0" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1 justify-center">
              {planet.elements.slice(0, 6).map((element, index) => (
                <PeriodicElement key={index} elementName={element} expanded={false} className="" />
              ))}
              {planet.elements.length > 6 && <div className="inline-flex items-center justify-center h-10 w-10 rounded border border-dashed border-yellow-500/50 text-yellow-400 text-xs">+{planet.elements.length - 6}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Selected Moon Information */}
      {selectedMoon && (
        <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🌙</span>
            <h4 className="text-sm font-bold text-blue-300">Selected Moon: {selectedMoon.name}</h4>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
            <div className="bg-white/5 rounded p-2 border border-blue-500/20">
              <div className="text-xs text-gray-300">Type</div>
              <div className="text-xs font-bold text-blue-300 capitalize">{selectedMoon.properties.type}</div>
            </div>
            <div className="bg-white/5 rounded p-2 border border-blue-500/20">
              <div className="text-xs text-gray-300">Origin</div>
              <div className="text-xs font-bold text-blue-300 capitalize">{selectedMoon.properties.origin.replace("_", " ")}</div>
            </div>
            <div className="bg-white/5 rounded p-2 border border-blue-500/20">
              <div className="text-xs text-gray-300">Radius</div>
              <div className="text-xs font-bold text-blue-300">{selectedMoon.properties.radius_km.toFixed(1)} km</div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
            <div className="bg-white/5 rounded p-2 border border-blue-500/20">
              <div className="text-xs text-gray-300">Orbital Period</div>
              <div className="text-xs font-bold text-blue-300">{formatPeriod(selectedMoon.orbit.orbital_period_seconds)}</div>
            </div>
            <div className="bg-white/5 rounded p-2 border border-blue-500/20">
              <div className="text-xs text-gray-300">Distance</div>
              <div className="text-xs font-bold text-blue-300">{(selectedMoon.orbit.semi_major_axis_km / 1000).toFixed(0)}k km</div>
            </div>
            <div className="bg-white/5 rounded p-2 border border-blue-500/20">
              <div className="text-xs text-gray-300">Eccentricity</div>
              <div className="text-xs font-bold text-blue-300">{selectedMoon.orbit.eccentricity.toFixed(3)}</div>
            </div>
          </div>

          {/* Moon Surface Conditions */}
          <div className="bg-white/5 rounded-lg p-2 border border-blue-500/20">
            <div className="text-xs text-gray-200 mb-2">Surface Conditions</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded p-1.5 border border-blue-500/20">
                <div className="text-xs text-gray-300">Rotation</div>
                <div className="text-xs font-bold text-blue-300">{selectedMoon.rotation ? formatPeriod(selectedMoon.rotation.rotation_period_s) : "Unknown"}</div>
              </div>
              <div className="bg-white/5 rounded p-1.5 border border-blue-500/20">
                <div className="text-xs text-gray-300">Tidal Lock</div>
                <div className={`text-xs font-bold ${selectedMoon.rotation?.is_tidally_locked ? "text-green-300" : "text-orange-300"}`}>{selectedMoon.rotation?.is_tidally_locked ? "Yes" : "No"}</div>
              </div>
            </div>
          </div>

          <div className="mt-2 text-xs text-blue-400/80 text-center">Click on planet to return to planet view</div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="text-xs text-gray-400 mb-2">Technical Data</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <div className="bg-white/5 rounded px-1.5 py-0.5">
            <span className="text-gray-400">Status:</span>
            <div className="text-green-400 font-medium">Visited</div>
          </div>
          <div className="bg-white/5 rounded px-1.5 py-0.5">
            <span className="text-gray-400">Planet:</span>
            <div className="text-white truncate font-medium">{formatName(planet.name)}</div>
          </div>
          <div className="bg-white/5 rounded px-1.5 py-0.5">
            <span className="text-gray-400">System:</span>
            <div className="text-white truncate font-medium">{formatName(system.name)}</div>
          </div>
          <div className="bg-white/5 rounded px-1.5 py-0.5">
            <span className="text-gray-400">System ID:</span>
            <div className="text-white font-medium">#{system.index + 1}</div>
          </div>
          <div className="bg-white/5 rounded px-1.5 py-0.5">
            <span className="text-gray-400">Galaxy:</span>
            <div className="text-white truncate font-medium">{formatName(galaxy.name)}</div>
          </div>
          <div className="bg-white/5 rounded px-1.5 py-0.5">
            <span className="text-gray-400">Coordinates:</span>
            <div className="text-white font-medium">{galaxy.coordinates.join(", ")}</div>
          </div>
        </div>
      </div>

      {effects && onToggleEffect && <EffectsControl effects={effects} onToggleEffect={onToggleEffect} />}

      {/* Arecibo Modal */}
      {planet.life_forms !== "None" && <AreciboModal isOpen={showAreciboModal} onClose={() => setShowAreciboModal(false)} lifeForm={planet.life_forms} planetName={planet.name} />}
    </div>
  );
};

export default PlanetInfo;
