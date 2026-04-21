// atlas-ui/react/static/js/Icons/Element115Icon.tsx

import React from "react";

interface Element115IconProps {
  size?: number;
  className?: string;
  color?: string;
}

const Element115Icon: React.FC<Element115IconProps> = ({ size = 24, className = "", color = "currentColor" }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={className}>
      <g fill="none" stroke={color} strokeLinecap="round" strokeWidth={1.3}>
        <path fill={color} fillOpacity={0} strokeDasharray={28} strokeDashoffset={28} d="M12 10l4 7h-8Z">
          <animate fill="freeze" attributeName="fill-opacity" begin="0.7s" dur="0.5s" values="0;1"></animate>
          <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="28;0"></animate>
        </path>
        <path d="M12 10l4 7h-8Z" opacity={0}>
          <animate attributeName="d" begin="0.4s" dur="0.8s" keyTimes="0;0.25;1" repeatCount="indefinite" values="M12 10l4 7h-8Z;M12 4l9.25 16h-18.5Z;M12 4l9.25 16h-18.5Z"></animate>
          <animate attributeName="opacity" begin="0.4s" dur="0.8s" keyTimes="0;0.1;0.75;1" repeatCount="indefinite" values="0;1;1;0"></animate>
        </path>
      </g>
    </svg>
  );
};

export default Element115Icon;
