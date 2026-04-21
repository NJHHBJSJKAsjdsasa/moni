// atlas-ui/react/static/js/Components/MiningIndicator.tsx
import React from "react";

interface MiningIndicatorProps {
  isOnCooldown: boolean;
  isSaved: boolean;
  isCollecting: boolean;
  className?: string;
}

const MiningIndicator: React.FC<MiningIndicatorProps> = ({ isOnCooldown, isSaved, isCollecting, className = "" }) => {
  if (isCollecting) {
    return (
      <div className={`flex items-center justify-center w-8 h-8 relative ${className}`}>
        <svg className="w-6 h-6 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="absolute w-8 h-8 rounded-full border-2 border-blue-400 animate-ping opacity-50"></div>
      </div>
    );
  }

  if (isOnCooldown) {
    return (
      <div className={`flex items-center justify-center w-8 h-8 relative ${className}`}>
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            className="w-6 h-6 text-orange-400"
            style={{
              animation: "drill-hammer 1.5s ease-in-out infinite",
            }}
          >
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.3}>
              <path d="m14 13l-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999m4.973-5.972A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024m4 4.001a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069"></path>
              <path d="M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z"></path>
            </g>
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse">
            <div className="w-full h-full bg-red-400 rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isSaved) {
    return (
      <div className={`flex items-center justify-center w-8 h-8 relative ${className}`}>
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            className="w-6 h-6 text-green-400"
            style={{
              animation: "auto-mining 2s ease-in-out infinite",
            }}
          >
            <path fill="currentColor" d="M6.75 3A2.75 2.75 0 0 0 4 5.75V20.5h-.25a.75.75 0 0 0 0 1.5h13.5a.75.75 0 0 0 0-1.5H17v-1.803a2.745 2.745 0 0 0 4-2.442v-5.838a2.75 2.75 0 0 0-.55-1.65L19.35 7.3a.75.75 0 0 0-1.2.9l1.1 1.467c.162.216.25.48.25.75v5.838a1.245 1.245 0 1 1-2.49 0V14.5a1 1 0 0 0-.01-.121V5.75A2.75 2.75 0 0 0 14.25 3zM7 6.75A.75.75 0 0 1 7.75 6h5.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75z"></path>
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full">
            <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div
          className="absolute top-1 left-1"
          style={{
            animation: "processing-dots 1.5s ease-in-out infinite",
          }}
        >
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-emerald-300 rounded-full" style={{ animationDelay: "0s" }}></div>
            <div className="w-1 h-1 bg-emerald-300 rounded-full" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-1 h-1 bg-emerald-300 rounded-full" style={{ animationDelay: "0.4s" }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center w-8 h-8 ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 256 256" className="w-6 h-6 text-gray-400 opacity-60">
        <g fill="currentColor" strokeWidth={6.5} stroke="currentColor">
          <path d="M216 96v120H96l-56-56V40h120Z" opacity={0.2}></path>
          <path d="m221.66 90.34l-56-56A8 8 0 0 0 160 32H40a8 8 0 0 0-8 8v120a8 8 0 0 0 2.3 5.61l56 56A8 8 0 0 0 96 224h120a8 8 0 0 0 8-8V96a8 8 0 0 0-2.34-5.66M168 59.31L196.69 88H168ZM88 196.69L59.31 168H88ZM88 152H48V59.31l40 40ZM59.31 48H152v40H99.31ZM152 104v48h-48v-48Zm-48 104v-40h52.69l40 40Zm104-11.31l-40-40V104h40Z"></path>
        </g>
      </svg>
    </div>
  );
};

export default MiningIndicator;
