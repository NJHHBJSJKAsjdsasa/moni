// atlas-ui/react/static/js/Components/PlanetNavigation.tsx
import React, { useState, useEffect } from "react";
import { markPlanetAsVisited, markSystemAsVisited } from "../Utils/VisitHistory.tsx";
import { SpaceshipTravelManager } from "../Utils/SpaceshipTravelCosts.tsx";

interface Planet {
  name: string;
}

interface System {
  name: string;
  index: number;
  planets?: Planet[];
}

interface Galaxy {
  coordinates: number[];
}

interface PlanetNavigationProps {
  currentPlanet: string;
  system: System;
  galaxy: Galaxy;
  systemPlanets: Planet[];
}

const PlanetNavigation: React.FC<PlanetNavigationProps> = ({ currentPlanet, system, galaxy, systemPlanets }) => {
  const [prevPlanet, setPrevPlanet] = useState<string | null>(null);
  const [nextPlanet, setNextPlanet] = useState<string | null>(null);
  const [hasPrev, setHasPrev] = useState<boolean>(false);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (systemPlanets && systemPlanets.length > 0) {
      const currentIndex = systemPlanets.findIndex((p) => p.name.toLowerCase() === currentPlanet.toLowerCase());

      if (currentIndex !== -1) {
        if (currentIndex > 0) {
          setPrevPlanet(systemPlanets[currentIndex - 1].name.toLowerCase());
          setHasPrev(true);
        } else {
          if (system.index > 0) {
            setPrevPlanet("__prev_system__");
            setHasPrev(true);
          } else {
            setHasPrev(false);
          }
        }

        if (currentIndex < systemPlanets.length - 1) {
          setNextPlanet(systemPlanets[currentIndex + 1].name.toLowerCase());
          setHasNext(true);
        } else {
          setNextPlanet("__next_system__");
          setHasNext(true);
        }
      } else {
        setHasPrev(false);
        setHasNext(false);
      }
    } else {
      setHasPrev(false);
      setHasNext(false);
    }

    setLoading(false);
  }, [currentPlanet, system.index, systemPlanets]);

  const formatName = (name: string) => {
    return name.replace(/_/g, " ");
  };

  const handlePrevious = async () => {
    const coordinates = galaxy.coordinates.join(",");

    if (prevPlanet === "__prev_system__") {
      const distance = 1;
      if (!SpaceshipTravelManager.canAffordTravel("system", distance)) {
        SpaceshipTravelManager.executeTravel("system", distance);
        return;
      }

      if (!SpaceshipTravelManager.executeTravel("system", distance)) {
        return;
      }
      try {
        const response = await fetch(`/system/${system.index - 1}`, {
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.system && data.system.planets && data.system.planets.length > 0) {
            const lastPlanet = data.system.planets[data.system.planets.length - 1];
            const planetName = lastPlanet.name.toLowerCase();

            markPlanetAsVisited(coordinates, system.index - 1, planetName, data.system.planets);
            markSystemAsVisited(coordinates, system.index - 1);

            window.location.href = `/planet/${planetName}`;
            return;
          }
        }
        window.location.href = `/system/${system.index - 1}`;
      } catch (error) {
        window.location.href = `/system/${system.index - 1}`;
      }
    } else if (prevPlanet) {
      const distance = 1;
      if (!SpaceshipTravelManager.canAffordTravel("planet", distance)) {
        SpaceshipTravelManager.executeTravel("planet", distance);
        return;
      }

      if (!SpaceshipTravelManager.executeTravel("planet", distance)) {
        return;
      }
      markPlanetAsVisited(coordinates, system.index, prevPlanet, systemPlanets);
      window.location.href = `/planet/${prevPlanet}`;
    }
  };

  const handleNext = async () => {
    const coordinates = galaxy.coordinates.join(",");

    if (nextPlanet === "__next_system__") {
      const distance = 1;
      if (!SpaceshipTravelManager.canAffordTravel("system", distance)) {
        SpaceshipTravelManager.executeTravel("system", distance);
        return;
      }

      if (!SpaceshipTravelManager.executeTravel("system", distance)) {
        return;
      }
      try {
        const response = await fetch(`/system/${system.index + 1}`, {
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.system && data.system.planets && data.system.planets.length > 0) {
            const firstPlanet = data.system.planets[0];
            const planetName = firstPlanet.name.toLowerCase();

            markPlanetAsVisited(coordinates, system.index + 1, planetName, data.system.planets);
            markSystemAsVisited(coordinates, system.index + 1);

            window.location.href = `/planet/${planetName}`;
            return;
          }
        }
        window.location.href = `/system/${system.index + 1}`;
      } catch (error) {
        window.location.href = `/system/${system.index + 1}`;
      }
    } else if (nextPlanet) {
      const distance = 1;
      if (!SpaceshipTravelManager.canAffordTravel("planet", distance)) {
        SpaceshipTravelManager.executeTravel("planet", distance);
        return;
      }

      if (!SpaceshipTravelManager.executeTravel("planet", distance)) {
        return; // Travel failed
      }
      markPlanetAsVisited(coordinates, system.index, nextPlanet, systemPlanets);
      window.location.href = `/planet/${nextPlanet}`;
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrevious} disabled={!hasPrev} className={`flex items-center justify-center px-3 py-1.5 rounded-lg transition-all duration-200 ${hasPrev ? "bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:text-blue-300" : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button onClick={handleNext} disabled={!hasNext} className={`flex items-center justify-center px-3 py-1.5 rounded-lg transition-all duration-200 ${hasNext ? "bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:text-blue-300" : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PlanetNavigation;
