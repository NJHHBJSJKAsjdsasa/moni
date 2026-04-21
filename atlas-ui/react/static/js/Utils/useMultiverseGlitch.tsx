// atlas-ui/react/static/js/Utils/useMultiverseGlitch.tsx

import { useState, useEffect } from "react";
import { MultiverseEmitter } from "./MultiverseEmitter.tsx";

export const useMultiverseGlitch = (isActive: boolean = false) => {
  const [glitchText, setGlitchText] = useState("MULTIVERSE ONLINE");

  useEffect(() => {
    if (!isActive) {
      setGlitchText("MULTIVERSE ONLINE");
      return;
    }

    const runGlitchSequence = async () => {
      const glitchDuration = 500;
      const changeInterval = MultiverseEmitter.getGlitchAnimationSpeed();
      const iterations = Math.floor(glitchDuration / changeInterval);

      for (let i = 0; i < iterations; i++) {
        setGlitchText(MultiverseEmitter.createGlitchText());
        await new Promise((resolve) => setTimeout(resolve, changeInterval));
      }

      setGlitchText("MULTIVERSE ONLINE");
    };

    const scheduleNext = () => {
      const interval = MultiverseEmitter.getRandomInterval();
      setTimeout(() => {
        runGlitchSequence();
        scheduleNext();
      }, interval);
    };

    scheduleNext();

    return () => {
      setGlitchText("MULTIVERSE ONLINE");
    };
  }, [isActive]);

  return glitchText;
};
