// atlas-ui/react/static/js/Components/MiningAnimationOverlay.tsx

import React, { useEffect, useState } from "react";

interface MiningAnimationOverlayProps {
  isActive: boolean;
  onAnimationComplete?: () => void;
}

const MiningAnimationOverlay: React.FC<MiningAnimationOverlayProps> = ({ isActive, onAnimationComplete }) => {
  const [showExtractor, setShowExtractor] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; angle: number; delay: number }>>([]);

  useEffect(() => {
    if (isActive) {
      setShowExtractor(true);

      const newParticles = [];
      for (let i = 0; i < 12; i++) {
        newParticles.push({
          id: Date.now() + i,
          angle: (360 / 12) * i,
          delay: i * 0.1,
        });
      }
      setParticles(newParticles);

      const cleanupTimeout = setTimeout(() => {
        setShowExtractor(false);
        setParticles([]);
        if (onAnimationComplete) onAnimationComplete();
      }, 3000);

      return () => {
        clearTimeout(cleanupTimeout);
      };
    }
  }, [isActive, onAnimationComplete]);

  if (!isActive && !showExtractor) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {showExtractor && (
        <>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="mining-extraction-core" />
            <div className="mining-extraction-ring" />
            <div className="mining-extraction-ring mining-ring-delay-1" />
            <div className="mining-extraction-ring mining-ring-delay-2" />
          </div>

          <div className="mining-scan-grid" />

          <div className="absolute inset-0">
            <div className="mining-extraction-beam mining-beam-vertical" />
            <div className="mining-extraction-beam mining-beam-horizontal" />
            <div className="mining-extraction-beam mining-beam-diagonal-1" />
            <div className="mining-extraction-beam mining-beam-diagonal-2" />
          </div>

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="absolute mining-resource-particle"
                style={{
                  transform: `rotate(${particle.angle}deg)`,
                  animationDelay: `${particle.delay}s`,
                }}
              >
                <div className="mining-particle-trail" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MiningAnimationOverlay;
