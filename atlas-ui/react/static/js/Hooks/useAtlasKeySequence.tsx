// atlas-ui/react/static/js/Hooks/useAtlasKeySequence.tsx
import { useEffect } from "react";
import { debugConfig } from "../Utils/DebugConfig.tsx";

export const useAtlasKeySequence = () => {
  useEffect(() => {
    let sequence = "";
    let timeoutId: NodeJS.Timeout;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.match(/^[a-zA-Z]$/)) {
        sequence += event.key.toUpperCase();

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          sequence = "";
        }, 2000);

        if (sequence.includes("ATLAS")) {
          debugConfig.enableEffectsControl();
          sequence = "";
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        }

        if (sequence.length > 10) {
          sequence = sequence.slice(-10);
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);
};
