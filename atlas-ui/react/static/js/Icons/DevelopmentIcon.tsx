// atlas-ui/react/static/js/Icons/DevelopmentIcon.tsx

import React from "react";

interface DevelopmentIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const DevelopmentIcon: React.FC<DevelopmentIconProps> = ({ size = 24, color = "currentColor", className = "" }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path fill={color} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4l8-8z" />
    </svg>
  );
};

export default DevelopmentIcon;
