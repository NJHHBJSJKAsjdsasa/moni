// atlas-ui/react/static/js/Icons/CoordinatesIcon.tsx

import React from "react";

interface CoordinatesIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const CoordinatesIcon: React.FC<CoordinatesIconProps> = ({ size = 16, color = "currentColor", className = "" }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12h20" stroke={color} strokeWidth="1" opacity="0.4" />
      <path d="M2 8h20" stroke={color} strokeWidth="0.6" opacity="0.3" />
      <path d="M2 16h20" stroke={color} strokeWidth="0.6" opacity="0.3" />

      <path d="M12 2v20" stroke={color} strokeWidth="1" opacity="0.4" />
      <path d="M8 2v20" stroke={color} strokeWidth="0.6" opacity="0.3" />
      <path d="M16 2v20" stroke={color} strokeWidth="0.6" opacity="0.3" />

      <path d="M6 6L18 18" stroke={color} strokeWidth="0.8" opacity="0.3" />
      <path d="M6 18L18 6" stroke={color} strokeWidth="0.8" opacity="0.3" />

      <circle cx="12" cy="12" r="2" fill={color} opacity="0.7" />

      <text x="20" y="12" fill={color} fontSize="8" opacity="0.6" dy="3">
        X
      </text>
      <text x="12" y="4" fill={color} fontSize="8" opacity="0.6" textAnchor="middle">
        Y
      </text>
      <text x="17" y="7" fill={color} fontSize="8" opacity="0.6">
        Z
      </text>
    </svg>
  );
};

export default CoordinatesIcon;
