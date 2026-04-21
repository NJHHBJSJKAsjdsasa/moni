// atlas-ui/react/static/js/Icons/PlanetIcon.tsx

import React from "react";

interface PlanetIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const PlanetIcon: React.FC<PlanetIconProps> = ({ size = 16, color = "currentColor", className = "" }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="8" fill={color} opacity="0.6" stroke={color} strokeWidth="1" />

      <circle cx="9" cy="10" r="1.5" fill={color} opacity="0.3" />
      <circle cx="15" cy="14" r="1" fill={color} opacity="0.3" />
      <circle cx="12" cy="8" r="0.8" fill={color} opacity="0.3" />

      <ellipse cx="12" cy="12" rx="11" ry="3" stroke={color} strokeWidth="1.2" fill="none" opacity="0.4" />
      <ellipse cx="12" cy="12" rx="11" ry="3" stroke={color} strokeWidth="0.6" fill="none" opacity="0.2" transform="rotate(15 12 12)" />

      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="0.5" fill="none" opacity="0.2" />
    </svg>
  );
};

export default PlanetIcon;
