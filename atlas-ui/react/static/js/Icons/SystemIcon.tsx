// atlas-ui/react/static/js/Icons/SystemIcon.tsx

import React from "react";

interface SystemIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const SystemIcon: React.FC<SystemIconProps> = ({ size = 16, color = "currentColor", className = "" }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" fill={color} opacity="0.8" />

      <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" stroke={color} strokeWidth="1" opacity="0.6" />

      <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="0.8" fill="none" opacity="0.3" />
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="0.6" fill="none" opacity="0.2" />

      <circle cx="18" cy="12" r="1.2" fill={color} opacity="0.6" />
      <circle cx="6" cy="12" r="0.8" fill={color} opacity="0.5" />
      <circle cx="12" cy="3" r="0.6" fill={color} opacity="0.4" />
    </svg>
  );
};

export default SystemIcon;
