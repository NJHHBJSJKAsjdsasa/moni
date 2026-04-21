// atlas-ui/react/static/js/Components/PlanetsList.tsx
import React, { useEffect, useState } from "react";
import { getVisitedPlanets, markPlanetAsVisited } from "../Utils/VisitHistory.tsx";
import EyeOpenIcon from "../Icons/EyeOpenIcon.tsx";

interface Planet {
  name: string;
  planet_type: string;
}

interface PlanetsListProps {
  planets: Planet[];
  coordinates: string;
  systemIndex: number;
}

const PlanetsList: React.FC<PlanetsListProps> = ({ planets, coordinates, systemIndex }) => {
  const [visitedPlanets, setVisitedPlanets] = useState<Set<string>>(new Set());

  const getPlanetColor = (planetType: string): string => {
    const fallbackColors: Record<string, string> = {
      "Gas Giant": "#FFA500",
      "气态巨行星": "#FFA500",
      Anomaly: "#FFFFFF",
      "异常行星": "#FFFFFF",
      Rocky: "#808080",
      "岩石行星": "#808080",
      Icy: "#ADD8E6",
      "冰态行星": "#ADD8E6",
      Oceanic: "#0000FF",
      "海洋行星": "#0000FF",
      Desert: "#FFD700",
      "沙漠行星": "#FFD700",
      Lava: "#FF0000",
      "熔岩行星": "#FF0000",
      Arid: "#800000",
      "干旱行星": "#800000",
      Swamp: "#008000",
      "沼泽行星": "#008000",
      Tundra: "#F0F8FF",
      "苔原行星": "#F0F8FF",
      Forest: "#006400",
      "森林行星": "#006400",
      Savannah: "#F4A460",
      "稀树草原行星": "#F4A460",
      Cave: "#D1D1D1",
      "洞穴行星": "#D1D1D1",
      Crystalline: "#00FFFF",
      "结晶行星": "#00FFFF",
      Metallic: "#C0C0C0",
      "金属行星": "#C0C0C0",
      Toxic: "#800080",
      "有毒行星": "#800080",
      Radioactive: "#00FF00",
      "放射性行星": "#00FF00",
      Magma: "#FF4500",
      "岩浆行星": "#FF4500",
      "Molten Core": "#FF8C00",
      "熔融核心行星": "#FF8C00",
      Carbon: "#090909",
      "碳行星": "#090909",
      Diamond: "#87CEFA",
      "钻石行星": "#87CEFA",
      "Super Earth": "#90EE90",
      "超级地球": "#90EE90",
      "Sub Earth": "#006400",
      "亚地球": "#006400",
      "Frozen Gas Giant": "#ADD8E6",
      "冰冻气态巨行星": "#ADD8E6",
      Nebulous: "#FFC0CB",
      "星云行星": "#FFC0CB",
      Aquifer: "#00FFFF",
      "含水层行星": "#00FFFF",
      Exotic: "#FF00FF",
      "奇异行星": "#FF00FF",
    };

    return fallbackColors[planetType] || "#FFFFFF";
  };

  useEffect(() => {
    const loadHistoricalData = () => {
      try {
        const visitedPlanetNames = getVisitedPlanets(coordinates, systemIndex, planets);
        const visited = new Set<string>();

        visitedPlanetNames.forEach((planetName: string) => {
          visited.add(planetName.toLowerCase());
        });

        setVisitedPlanets(visited);
      } catch (error) {}
    };

    loadHistoricalData();
  }, [coordinates, systemIndex, planets]);

  const formatPlanetName = (name: string) => {
    return name.replace(/_/g, " ");
  };

  const handlePlanetClick = (planetName: string) => {
    try {
      markPlanetAsVisited(coordinates, systemIndex, planetName, planets);
    } catch (error) {}

    window.location.href = `/planet/${planetName.toLowerCase()}`;
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl p-4 sm:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
        {planets.map((planet) => (
          <div key={planet.name} className="relative bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 group overflow-hidden">
            {visitedPlanets.has(planet.name.toLowerCase()) && (
              <div className="absolute top-1 right-1 z-10" title="Planet visited">
                <EyeOpenIcon className="text-green-400" />
              </div>
            )}

            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full border border-white/40 shadow-sm z-20 animate-pulse" style={{ backgroundColor: getPlanetColor(planet.planet_type) }}></div>

            <button onClick={() => handlePlanetClick(planet.name)} className="w-full text-left block p-2 sm:p-3 text-gray-200 hover:text-white transition-colors duration-300 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">行星</div>
                <div className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors duration-300">{formatPlanetName(planet.name)}</div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
        ))}
      </div>

      {planets.length === 0 && (
        <div className="col-span-full text-center py-12">
          <div className="text-gray-400 text-lg mb-2">未找到行星</div>
          <div className="text-gray-500 text-sm">该系统似乎为空</div>
        </div>
      )}
    </div>
  );
};

export default PlanetsList;
