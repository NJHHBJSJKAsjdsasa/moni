// atlas-ui/react/static/js/Components/EffectsControl.tsx
import React, { useState, useEffect } from "react";

interface EffectInfo {
  id: string;
  type: string;
  enabled: boolean;
}

interface EffectsControlProps {
  effects: EffectInfo[];
  onToggleEffect: (effectId: string, enabled: boolean) => void;
}

const EffectsControl: React.FC<EffectsControlProps> = ({ effects, onToggleEffect }) => {
  const [localEffects, setLocalEffects] = useState<EffectInfo[]>(effects);
  const [showEffects, setShowEffects] = useState(false);

  useEffect(() => {
    setLocalEffects(effects);
  }, [effects]);

  const handleToggle = (effectId: string, enabled: boolean) => {
    setLocalEffects((prev) => prev.map((e) => (e.id === effectId ? { ...e, enabled } : e)));
    onToggleEffect(effectId, enabled);
  };

  const formatEffectName = (type: string): string => {
    const effectNames: Record<string, string> = {
      crystalline_surface: "Crystalline Surface",
      fire_eruption: "Fire Eruption",
      carbon_trails: "Carbon Trails",
      radiation_rings: "Radiation Rings",
      molten_lava: "Molten Lava",
      lava_flows: "Lava Flows",
      lava_rivers: "Lava Rivers",
      aquifer_water: "Aquifer Water",
      ocean_currents: "Ocean Currents",
      atmosphere_clouds: "Atmosphere Clouds",
      crystal_formations: "Crystal Formations",
      cloud_layers: "Cloud Layers",
      storm_systems: "Storm Systems",
      volcanic_activity: "Volcanic Activity",
      aurora: "Aurora",
      magnetic_field: "Magnetic Field",
      city_lights: "City Lights",
      bioluminescence: "Bioluminescence",
      thermal_emissions: "Thermal Emissions",
    };

    return (
      effectNames[type] ||
      type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
        .replace("Layer", "")
        .replace("Effect", "")
        .trim()
    );
  };

  if (localEffects.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-3 border-t border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-400">3D Effects Control</div>
        <button onClick={() => setShowEffects(!showEffects)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
          {showEffects ? "Hide" : "Show"} ({localEffects.filter((e) => e.enabled).length}/{localEffects.length})
        </button>
      </div>

      {showEffects && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {localEffects.map((effect) => (
            <div key={effect.id} className="bg-white/5 rounded p-2 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input type="checkbox" checked={effect.enabled} onChange={(e) => handleToggle(effect.id, e.target.checked)} className="rounded border-gray-400 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 bg-white/10" />
                <span className={`${effect.enabled ? "text-white" : "text-gray-500"} transition-colors`}>{formatEffectName(effect.type)}</span>
              </label>
              <span className={`text-[10px] ${effect.enabled ? "text-green-400" : "text-gray-600"}`}>{effect.enabled ? "ON" : "OFF"}</span>
            </div>
          ))}
        </div>
      )}

      {showEffects && localEffects.length > 3 && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => {
              localEffects.forEach((e) => handleToggle(e.id, true));
            }}
            className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
          >
            Enable All
          </button>
          <button
            onClick={() => {
              localEffects.forEach((e) => handleToggle(e.id, false));
            }}
            className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
          >
            Disable All
          </button>
        </div>
      )}
    </div>
  );
};

export default EffectsControl;
