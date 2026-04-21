// atlas-ui/react/static/js/Layouts/__system__.tsx
import React, { useState, useEffect } from "react";
import Header from "../Components/Header.tsx";
import SystemInfo from "../Components/SystemInfo.tsx";
import SystemVisualizationUniversal from "../Components/SystemVisualizationUniversal.tsx";
import PlanetsList from "../Components/PlanetsList.tsx";
import SystemNavigation from "../Components/SystemNavigation.tsx";
import VersionFooter from "../Components/VersionFooter.tsx";
import SpaceshipPanel from "../Components/SpaceshipPanel.tsx";
import TreasureChest from "../Components/TreasureChest.tsx";
import FuelBars from "../Components/FuelBars.tsx";
import MultiverseBanner from "../Components/MultiverseBanner.jsx";
import TaskPanel from "../Components/TaskPanel.tsx";
import { markSystemAsVisited } from "../Utils/VisitHistory.tsx";
import DidYouKnow from "../Components/DidYouKnow.tsx";
import GalaxyIcon from "../Icons/GalaxyIcon.tsx";
import CoordinatesIcon from "../Icons/CoordinatesIcon.tsx";

interface System {
  name: string;
  index: number;
  star_system_type: string;
  num_planets: number;
  stars: Array<{
    Type: string;
    Size: string;
    Color: string;
  }>;
  planets: Array<{
    name: string;
    planet_type: string;
    diameter: number;
    orbital_radius: number;
    orbital_period_seconds: number;
    orbital_speed: number;
    axial_tilt: number;
    rotation_period_seconds: number;
    initial_orbital_angle: number;
    eccentricity_factor: number;
    mass: number;
  }>;
}

interface Galaxy {
  name: string;
  coordinates: number[];
}

interface SystemLayoutProps {
  system: System;
  galaxy: Galaxy;
  system_url: string;
  version: string;
  system_index: number;
  image_url?: string;
  page: number;
  cosmic_origin_time: number;
}

const SystemLayout: React.FC<SystemLayoutProps> = ({ system, galaxy, system_url, version, system_index, image_url, page, cosmic_origin_time }) => {
  const [coordinates] = useState<string>(galaxy.coordinates.join(","));

  useEffect(() => {
    document.body.setAttribute("data-coordinates", coordinates);
    document.body.setAttribute("data-system-index", system_index.toString());

    markSystemAsVisited(coordinates, system_index);
  }, [coordinates, system_index]);

  const formatSystemName = (name: string) => {
    return name.replace(/_/g, " ");
  };

  const formatGalaxyName = (name: string) => {
    return name.replace(/_/g, " ");
  };

  return (
    <>
      <MultiverseBanner />
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>

        <FuelBars />

        <div className="relative z-10 pt-1 flex-1 flex flex-col">
          <Header />

          <div className="w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-8 flex-1">
            <div className="text-center mb-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">System '{formatSystemName(system.name)}'</h1>
              <p className="text-[10px] sm:text-xs text-gray-300 flex items-center justify-center gap-x-4 gap-y-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <GalaxyIcon size={15} color="#ffffffff" />
                  {formatGalaxyName(galaxy.name)}
                </span>
                <span className="flex items-center gap-1">
                  <CoordinatesIcon size={15} color="#ffffffff" />
                  {galaxy.coordinates.join(", ")}
                </span>
              </p>
            </div>

            <SystemNavigation currentSystem={{ name: system.name, index: system_index }} galaxy={galaxy} />

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 mb-8 shadow-2xl p-4 sm:p-6">
              <div className="flex flex-col lg:grid lg:grid-cols-[400px_1fr] gap-6 lg:gap-8 relative">
                <div className="order-1 lg:order-1">
                  <SystemVisualizationUniversal systemUrl={system_url} system={system} cosmicOriginTime={cosmic_origin_time} />
                </div>

                <div className="hidden lg:block absolute left-[416px] top-0 bottom-0 w-1 rounded-full bg-white/10 -translate-x-1.5"></div>

                <div className="order-2 lg:order-2">
                  <SystemInfo system={system} galaxy={galaxy} systemIndex={system_index} cosmicOriginTime={cosmic_origin_time} />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Planets in '{formatSystemName(system.name)}'</h2>
              <PlanetsList planets={system.planets} coordinates={coordinates} systemIndex={system_index} />
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 mb-8 shadow-2xl p-4 sm:p-6 text-center">
              <button onClick={() => (window.location.href = `/galaxy/${page}`)} className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-gray-600 via-gray-700 to-gray-600 hover:from-gray-700 hover:via-gray-800 hover:to-gray-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm">
                <span className="text-base sm:text-lg">← Back to Galaxy '{formatGalaxyName(galaxy.name)}'</span>
              </button>
            </div>
          </div>

          <VersionFooter version={version} />
        </div>

        <TreasureChest />
        <SpaceshipPanel
          currentLocation={{
            type: "system",
            name: system.name,
            coordinates: galaxy.coordinates.join(","),
            systemIndex: system.index,
          }}
        />
        <TaskPanel />
        <DidYouKnow currentView="system" />
      </div>
    </>
  );
};

export default SystemLayout;
