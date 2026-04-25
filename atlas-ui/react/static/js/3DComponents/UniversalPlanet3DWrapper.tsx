// atlas-ui/react/static/js/3DComponents/UniversalPlanet3DWrapper.tsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { UniversalPlanetRenderer } from "./UniversalPlanetRenderer";

interface UniversalPlanet3DProps {
  planetName: string;
  containerClassName?: string;
  width?: number;
  height?: number;
  autoRotate?: boolean;
  enableControls?: boolean;
  showDebugInfo?: boolean;
  planetData?: {
    diameter: number;
    density: number;
    gravity: number;
    mass: number;
    orbital_radius: number;
    rotation_period_seconds: number;
    surface_temperature: number;
    axial_tilt: number;
    planet_type: string;
    atmosphere: string;
    elements: string[];
  };
  cosmicOriginTime?: number;
  initialAngleRotation?: number;
  onDataLoaded?: (data: any) => void;
  onError?: (error: string) => void;
}

interface RendererStats {
  frameRate: number;
  renderTime: number;
  renderCalls: number;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode; onError?: (error: string) => void }, { hasError: boolean; error: string | null }> {
  constructor(props: { children: React.ReactNode; onError?: (error: string) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error.message);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-900/50 rounded">
          <div className="text-center p-4">
            <div className="text-red-400 text-sm mb-2">3D Renderer Error</div>
            <div className="text-xs text-gray-400 max-w-xs">{this.state.error}</div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const UniversalPlanet3DWrapper: React.FC<UniversalPlanet3DProps> = ({ planetName, containerClassName = "", width = 800, height = 600, autoRotate = true, enableControls = true, showDebugInfo = false, planetData, cosmicOriginTime, initialAngleRotation, onDataLoaded, onError }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const planetMeshRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const universalRendererRef = useRef<UniversalPlanetRenderer | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RendererStats>({
    frameRate: 0,
    renderTime: 0,
    renderCalls: 0,
  });

  const initializeThreeJS = useCallback(() => {
    if (!mountRef.current) {
      return false;
    }

    try {
      while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }

      const container = mountRef.current;
      const containerWidth = container.clientWidth || width;
      const containerHeight = container.clientHeight || height;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000511);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(45, containerWidth / containerHeight, 0.1, 1000);
      camera.position.set(0, 0, 5);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });

      renderer.setSize(containerWidth, containerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      setupLighting(scene);

      const planetMesh = createBasePlanet(scene);
      planetMeshRef.current = planetMesh;

      if (enableControls) {
        setupControls(camera, renderer.domElement);
      }

      universalRendererRef.current = new UniversalPlanetRenderer(scene, planetMesh);

      return true;
    } catch (error) {
      return false;
    }
  }, [width, height, enableControls]);

  const setupLighting = (scene: THREE.Scene) => {
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(5, 3, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x4466ff, 0.4);
    fillLight.position.set(-5, -3, -5);
    scene.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
    scene.add(ambientLight);
  };

  const createBasePlanet = (scene: THREE.Scene): THREE.Mesh => {
    const planetGeometry = new THREE.SphereGeometry(1, 128, 64);
    const planetMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      metalness: 0.1,
      roughness: 0.8,
    });

    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    planetMesh.castShadow = true;
    planetMesh.receiveShadow = true;
    scene.add(planetMesh);

    return planetMesh;
  };

  const setupControls = (camera: THREE.PerspectiveCamera, domElement: HTMLElement) => {
    const controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.3;
    controls.maxDistance = 10;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;
  };

  const loadPlanetData = useCallback(async () => {
    if (!universalRendererRef.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (planetData) {
        await universalRendererRef.current.loadPlanetData(planetName);

        if (onDataLoaded) {
          onDataLoaded({
            planet_info: {
              name: planetName,
              type: planetData.planet_type,
              base_color: "#808080",
              radius: planetData.diameter / 2,
            },
            universal_actions: [],
            source: "local_data",
          });
        }
      } else {
        await universalRendererRef.current.loadPlanetData(planetName);

        if (onDataLoaded) {
          onDataLoaded({
            planet_info: {
              name: planetName,
              type: "unknown",
              base_color: "#808080",
              radius: 1,
            },
            universal_actions: [],
            source: "api",
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error loading planet";
      setError(errorMessage);

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [planetName, planetData, onDataLoaded, onError]);

  const animate = useCallback(() => {
    frameIdRef.current = requestAnimationFrame(animate);

    const currentTime = performance.now();

    if (controlsRef.current) {
      controlsRef.current.update();
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      const renderStartTime = performance.now();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      const renderTime = performance.now() - renderStartTime;

      if (currentTime - lastFrameTimeRef.current > 1000) {
        const frameRate = 1000 / (currentTime - lastFrameTimeRef.current);
        setStats((prevStats) => ({
          frameRate: Math.round(frameRate),
          renderTime: Math.round(renderTime * 100) / 100,
          renderCalls: prevStats.renderCalls + 1,
        }));
        lastFrameTimeRef.current = currentTime;
      }
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (!initializeThreeJS()) {
          setError("Failed to initialize 3D renderer");
          return;
        }

        animate();

        await loadPlanetData();
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown initialization error");
      }
    };

    initialize();

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      if (universalRendererRef.current) {
        universalRendererRef.current.dispose();
      }

      if (rendererRef.current && mountRef.current) {
        try {
          if (mountRef.current.contains(rendererRef.current.domElement)) {
            mountRef.current.removeChild(rendererRef.current.domElement);
          }
          rendererRef.current.dispose();
        } catch (error) {}
      }
    };
  }, [initializeThreeJS, animate, loadPlanetData, planetName]);

  const handleError = useCallback(
    (errorMessage: string) => {
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    },
    [onError]
  );

  return (
    <ErrorBoundary onError={handleError}>
      <div className={`relative ${containerClassName}`}>
        <div ref={mountRef} className="w-full h-full" style={{ width, height }} />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
              <div className="text-sm">Loading Universal 3D planet...</div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-0 left-0 right-0 p-2 bg-red-500 text-white text-sm rounded-t">
            <strong>3D Error:</strong> {error}
          </div>
        )}

        {!loading && !error && (
          <div className="absolute bottom-0 left-0 p-4 text-white bg-black bg-opacity-50 max-w-xs rounded-tr">
            <h3 className="text-lg font-bold">{planetName}</h3>
            <p className="text-sm opacity-80">Universal 3D Renderer</p>
            <p className="text-xs mt-1 opacity-60">Active • {stats.renderCalls} renders</p>
          </div>
        )}

        {showDebugInfo && !loading && (
          <div className="absolute top-0 right-0 p-4 text-white bg-black bg-opacity-70 text-xs font-mono rounded-bl">
            <h4 className="font-bold mb-2">Universal 3D Debug</h4>
            <div>Frame Rate: {stats.frameRate} FPS</div>
            <div>Render Time: {stats.renderTime}ms</div>
            <div>Render Calls: {stats.renderCalls}</div>
            <div>Renderer: Universal</div>
            <div className="mt-2">
              <div className="text-green-400">Status: Active</div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};
