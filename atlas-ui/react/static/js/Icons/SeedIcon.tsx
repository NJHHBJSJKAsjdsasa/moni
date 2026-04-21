// atlas-ui/react/static/js/Icons/SeedIcon.tsx

import React from "react";

interface SeedIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const SeedIcon: React.FC<SeedIconProps> = ({ size = 24, color = "currentColor", className = "" }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
      <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.3}>
        <path d="M18.893 7.936a8.003 8.003 0 0 1-7.774 12.016m-6.012-3.888a8.003 8.003 0 0 1 7.774-12.016"></path>
        <circle cx={17.657} cy={6.343} r={2} fill={color} transform="rotate(45 17.657 6.343)"></circle>
        <circle cx={6.343} cy={17.657} r={2} fill={color} transform="rotate(45 6.343 17.657)"></circle>
        <circle cx={12} cy={12} r={2} fill={color} transform="rotate(45 12 12)"></circle>
      </g>
    </svg>
  );
};

export default SeedIcon;
