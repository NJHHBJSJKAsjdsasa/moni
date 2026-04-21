// atlas-ui/react/static/js/Components/ExportingOverlay.tsx

import React from "react";

interface ExportingOverlayProps {
  isVisible: boolean;
  message?: string;
}

const ExportingOverlay: React.FC<ExportingOverlayProps> = ({ isVisible, message = "Exporting view, please wait..." }) => {
  return (
    <div className={`absolute inset-0 bg-black flex flex-col items-center justify-center z-10 transition-all duration-300 ${isVisible ? "opacity-100 visible" : "opacity-0 invisible"}`}>
      <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6" />
      <p className="text-white text-xl font-medium text-center px-4">{message}</p>
    </div>
  );
};

export default ExportingOverlay;
