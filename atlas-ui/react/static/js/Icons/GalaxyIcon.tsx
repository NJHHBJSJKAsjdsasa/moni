// atlas-ui/react/static/js/Icons/GalaxyIcon.tsx

import React from "react";

interface GalaxyIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const GalaxyIcon: React.FC<GalaxyIconProps> = ({ size = 16, color = "currentColor", className = "" }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1" fill="none" opacity="0.3" />
      <circle cx="12" cy="12" r="7" stroke={color} strokeWidth="1" fill="none" opacity="0.4" />
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1" fill="none" opacity="0.5" />

      <path d="M12 2 C6 6, 6 12, 12 12 C18 12, 18 18, 12 22" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M22 12 C18 6, 12 6, 12 12 C12 18, 6 18, 2 12" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />

      <circle cx="12" cy="12" r="2" fill={color} opacity="0.8" />

      <circle cx="8" cy="8" r="0.5" fill={color} opacity="0.7" />
      <circle cx="16" cy="8" r="0.5" fill={color} opacity="0.7" />
      <circle cx="8" cy="16" r="0.5" fill={color} opacity="0.7" />
      <circle cx="16" cy="16" r="0.5" fill={color} opacity="0.7" />
    </svg>
  );
};

export default GalaxyIcon;
