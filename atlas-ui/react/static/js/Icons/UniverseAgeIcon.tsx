// atlas-ui/react/static/js/Icons/UniverseAgeIcon.tsx

import React from "react";

interface UniverseAgeIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const UniverseAgeIcon: React.FC<UniverseAgeIconProps> = ({ size = 24, color = "currentColor", className = "" }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path fill={color} d="M12 20a8 8 0 0 0 8-8a8 8 0 0 0-8-8a8 8 0 0 0-8 8a8 8 0 0 0 8 8m0-18a10 10 0 0 1 10 10a10 10 0 0 1-10 10C6.47 22 2 17.5 2 12A10 10 0 0 1 12 2m.5 5v5.25l4.5 2.67l-.75 1.23L11 13V7z" />
    </svg>
  );
};

export default UniverseAgeIcon;
