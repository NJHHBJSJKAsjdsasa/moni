// atlas-ui/react/static/js/Components/StorageDebug.tsx
import React, { useState, useEffect } from "react";
import { getStorageStats } from "../Utils/VisitHistory.tsx";

const StorageDebug: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("debug") === "storage" || process.env.NODE_ENV === "development") {
      setShow(true);
      const updateStats = () => {
        setStats(getStorageStats());
      };
      updateStats();

      const interval = setInterval(updateStats, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  if (!show || !stats) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStorageColor = (size: number): string => {
    const mbSize = size / (1024 * 1024);
    if (mbSize > 4) return "text-red-400";
    if (mbSize > 2) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-lg rounded-lg border border-white/20 p-3 text-xs font-mono z-50">
      <div className="text-white mb-2 font-bold">📦 Atlas Archive</div>
      <div className="grid grid-cols-2 gap-2 text-gray-300">
        <div>Size:</div>
        <div className={getStorageColor(stats.size)}>{formatBytes(stats.size)}</div>

        <div>Galaxies:</div>
        <div className="text-blue-400">{stats.galaxies.toLocaleString()}</div>

        <div>Systems:</div>
        <div className="text-purple-400">{stats.systems.toLocaleString()}</div>

        <div>Planets:</div>
        <div className="text-cyan-400">{stats.planets.toLocaleString()}</div>
      </div>
    </div>
  );
};

export default StorageDebug;
