// atlas-ui/react/static/js/Icons/BitBangIcon.tsx

import React from "react";

interface BitBangIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const BitBangIcon: React.FC<BitBangIconProps> = ({ size = 24, color = "currentColor", className = "" }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path fill={color} d="m19 1l-1.26 2.75L15 5l2.74 1.26L19 9l1.25-2.74L23 5l-2.75-1.25M9 4L6.5 9.5L1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5M19 15l-1.26 2.74L15 19l2.74 1.25L19 23l1.25-2.75L23 19l-2.75-1.26" />
    </svg>
  );
};

export default BitBangIcon;
