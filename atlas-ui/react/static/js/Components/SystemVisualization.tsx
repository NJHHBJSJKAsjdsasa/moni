// atlas-ui/react/static/js/Components/SystemVisualization.tsx
import React, { useEffect, useRef, useState } from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import StargateButton from "./StargateButton";
import AdaptivePreloadCanvas from "./AdaptivePreloadCanvas.tsx";

interface SystemVisualizationProps {
  systemUrl: string;
  imageUrl?: string;
}

const SystemVisualization: React.FC<SystemVisualizationProps> = ({ systemUrl, imageUrl }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const decelerateRef = useRef(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasHidden, setCanvasHidden] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      [data-rmiz-modal-overlay="visible"] {
        background-color: rgba(0, 0, 0, 0.8) !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        transition: backdrop-filter 0.3s ease-in-out !important;
      }
      
      [data-rmiz-modal-img] {
        border-radius: 1rem !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8) !important;
      }
      
      [data-rmiz-modal-overlay="hidden"] {
        backdrop-filter: blur(0px) !important;
        -webkit-backdrop-filter: blur(0px) !important;
        transition: backdrop-filter 0.3s ease-in-out !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (imageUrl) {
      const highResImg = new Image();

      highResImg.onload = () => {
        if (imageRef.current) {
          imageRef.current.src = imageUrl;
          setImageLoaded(true);
          setCanvasHidden(true);
          decelerateRef.current = true;
        }
      };

      highResImg.onerror = () => {
        setTimeout(() => {
          setImageLoaded(true);
          setCanvasHidden(true);
          decelerateRef.current = true;
        }, 800);
      };

      highResImg.src = imageUrl;
    } else {
      setTimeout(() => {
        setImageLoaded(true);
        setCanvasHidden(true);
        decelerateRef.current = true;
      }, 800);
    }
  }, [imageUrl]);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg sm:text-xl font-bold text-white mb-3">System Visualization</h3>

      <div className="relative w-full max-w-80 sm:max-w-96 aspect-square mx-auto bg-black/50 flex justify-center items-center rounded-xl overflow-hidden border-2 border-blue-400/30 mb-4">
        <AdaptivePreloadCanvas hidden={canvasHidden} decelerateRef={decelerateRef} />

        <div className={`absolute inset-0 w-full h-full transition-all duration-500 ${imageLoaded ? "opacity-100 blur-0" : "opacity-0 blur-[25px]"}`}>
          {imageLoaded && imageUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <Zoom zoomMargin={20} classDialog="backdrop-blur-3xl">
                <img
                  ref={imageRef}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl shadow-blue-500/20"
                  src={imageUrl}
                  alt="System visualization"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    backgroundColor: "transparent",
                  }}
                />
              </Zoom>
            </div>
          ) : (
            <img ref={imageRef} className="w-full h-full object-cover" src="/static/images/placeholder-min.jpg" alt="System visualization" />
          )}
        </div>
      </div>

      <div className="text-center mt-auto">
        <StargateButton href={systemUrl} />

        <div className="mt-2 text-xs text-gray-500 text-center">Gateway to the stars</div>
      </div>
    </div>
  );
};

export default SystemVisualization;
