// atlas-ui/react/static/js/3DComponents/ModularPlanetRendererWrapper.tsx

import { forwardRef, Component, type ReactNode, type ErrorInfo } from "react";
import { ModularPlanetRenderer } from "./ModularPlanetRenderer";

interface ModularPlanetRendererProps {
  planetName: string;
  containerClassName?: string;
  width?: number;
  height?: number;
  autoRotate?: boolean;
  enableControls?: boolean;
  showDebugInfo?: boolean;
  planetData?: {
    name?: string;
    diameter: number;
    density: number;
    gravity: number;
    mass: number;
    orbital_radius: number;
    orbital_period_seconds?: number;
    rotation_period_seconds: number;
    surface_temperature: number;
    axial_tilt: number;
    planet_type: string;
    atmosphere: string;
    elements: string[];
    initial_orbital_angle?: number;
  };
  cosmicOriginTime?: number;
  initialAngleRotation?: number;
  timeOffset?: number;
  onDataLoaded?: (data: any) => void;
  onError?: (error: string) => void;
  onEffectsCreated?: (effects: any[]) => void;
  onScreenshotReady?: (captureFunction: () => void) => void;
  onMoonSelected?: (moon: any | null) => void;
  planetUrl?: string;
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {}

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-900/50 rounded">
          <div className="text-center p-4">
            <div className="text-red-400 text-sm mb-2">3D Renderer Error</div>
            <div className="text-xs text-gray-400">{this.state.error}</div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ModularPlanetRendererWrapper = forwardRef<{ captureScreenshot: () => void; isGeneratingImage: boolean; toggleEffect: (effectId: string, enabled: boolean) => void }, ModularPlanetRendererProps>((props, ref) => {
  return (
    <ErrorBoundary>
      <ModularPlanetRenderer ref={ref} {...props} />
    </ErrorBoundary>
  );
});
