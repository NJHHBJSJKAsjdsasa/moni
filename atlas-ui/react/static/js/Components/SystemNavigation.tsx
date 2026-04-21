// atlas-ui/react/static/js/Components/SystemNavigation.tsx
import React, { useState, useEffect } from "react";
import { markSystemAsVisited } from "../Utils/VisitHistory.tsx";
import { SpaceshipTravelManager } from "../Utils/SpaceshipTravelCosts.tsx";

interface System {
  name: string;
  index: number;
}

interface Galaxy {
  coordinates: number[];
}

interface SystemNavigationProps {
  currentSystem: System;
  galaxy: Galaxy;
}

const SystemNavigation: React.FC<SystemNavigationProps> = ({ currentSystem, galaxy }) => {
  const [hasPrev, setHasPrev] = useState<boolean>(false);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setHasPrev(currentSystem.index > 0);
    setHasNext(true);
    setLoading(false);
  }, [currentSystem.index]);

  const handlePrevious = async () => {
    if (currentSystem.index > 0) {
      const distance = 1;

      if (!SpaceshipTravelManager.canAffordTravel("system", distance)) {
        SpaceshipTravelManager.executeTravel("system", distance);
        return;
      }

      if (!SpaceshipTravelManager.executeTravel("system", distance)) {
        return;
      }

      const coordinates = galaxy.coordinates.join(",");
      markSystemAsVisited(coordinates, currentSystem.index - 1);
      window.location.href = `/system/${currentSystem.index - 1}`;
    }
  };

  const handleNext = async () => {
    const distance = 1;
    if (!SpaceshipTravelManager.canAffordTravel("system", distance)) {
      SpaceshipTravelManager.executeTravel("system", distance);
      return;
    }

    if (!SpaceshipTravelManager.executeTravel("system", distance)) {
      return;
    }

    const coordinates = galaxy.coordinates.join(",");
    markSystemAsVisited(coordinates, currentSystem.index + 1);
    window.location.href = `/system/${currentSystem.index + 1}`;
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

export default SystemNavigation;
