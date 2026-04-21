// atlas-ui/react/static/js/Components/PhotosensitivePlaceholder.tsx

import React, { useEffect, useState, useRef } from "react";

interface PhotosensitivePlaceholderProps {
  onComplete?: () => void;
  duration?: number;
}

const PhotosensitivePlaceholder: React.FC<PhotosensitivePlaceholderProps> = ({ onComplete, duration = 3000 }) => {
  const [opacity, setOpacity] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (hasCompletedRef.current) return;

    const fadeInTimer = setTimeout(() => setOpacity(1), 50);
    const fadeOutTimer = setTimeout(() => setOpacity(0), duration - 500);
    const completeTimer = setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    }, duration);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [duration]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999] transition-opacity duration-500" style={{ opacity }}>
      <div className="relative w-[400px] h-[400px]" style={{ animation: "planetRotate 3s linear" }}>
        {/* Glow */}
        <div
          className="absolute rounded-full"
          style={{
            inset: "-30px",
            background: "radial-gradient(circle at center, rgba(74, 144, 226, 0.3) 0%, rgba(74, 144, 226, 0.1) 40%, transparent 70%)",
          }}
        />

        {/* Atmosphere */}
        <div
          className="absolute rounded-full"
          style={{
            inset: "-15px",
            background: "radial-gradient(circle at 40% 40%, rgba(107, 179, 255, 0.5) 0%, rgba(74, 144, 226, 0.3) 30%, rgba(53, 122, 189, 0.15) 50%, transparent 70%)",
            animation: "atmospherePulse 3s ease-in-out infinite",
          }}
        />

        {/* Planet */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full overflow-hidden"
          style={{
            boxShadow: "inset -40px -40px 80px rgba(0, 0, 0, 0.9), inset 20px 20px 40px rgba(255, 255, 255, 0.05), 0 0 100px rgba(74, 144, 226, 0.4)",
          }}
        >
          {/* Surface */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(circle at 35% 35%, #6bb3ff 0%, transparent 50%),
                radial-gradient(circle at 65% 45%, #2d5f9a 0%, transparent 40%),
                linear-gradient(135deg, #1e3a5f 0%, #2d5f9a 20%, #357abd 40%, #4a90e2 60%, #5ba3f5 80%, #4a90e2 100%)
              `,
            }}
          />

          {/* Clouds */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(ellipse at 40% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 30%),
                radial-gradient(ellipse at 70% 50%, rgba(255, 255, 255, 0.2) 0%, transparent 25%),
                radial-gradient(ellipse at 30% 70%, rgba(255, 255, 255, 0.25) 0%, transparent 35%)
              `,
              animation: "cloudRotate 6s linear infinite",
            }}
          />

          {/* Shadow */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(135deg, transparent 0%, transparent 40%, rgba(0, 0, 0, 0.3) 60%, rgba(0, 0, 0, 0.6) 80%, rgba(0, 0, 0, 0.8) 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PhotosensitivePlaceholder;
