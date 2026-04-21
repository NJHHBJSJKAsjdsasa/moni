// atlas-ui/react/static/js/Components/QRGenerator.tsx

import QRCode from "qrcode";
import { StargateGenerator } from "../Utils/StargateGenerator.tsx";
import { UniverseDetection } from "../Utils/UniverseDetection.tsx";

export interface QRGeneratorOptions {
  url: string;
  size: number;
}

interface StargateContext {
  type: "galaxy" | "system" | "planet";
  coordinates: string;
  systemIndex?: number;
  planetName?: string;
}

export const extractStargateContext = (stargateUrl: string, type: "galaxy" | "system" | "planet"): StargateContext | null => {
  try {
    const parts = stargateUrl.split("/stargate/")[1];
    if (!parts) return null;

    const decoded = atob(parts.replace(/-/g, "+").replace(/_/g, "/"));
    const params = new URLSearchParams(decoded);
    const coordinates = params.get("coordinates");
    const systemIndex = params.get("system");
    const planetName = params.get("planet");

    if (!coordinates) return null;

    const context: StargateContext = {
      type,
      coordinates,
    };

    if (systemIndex) {
      context.systemIndex = parseInt(systemIndex);
    }

    if (planetName) {
      context.planetName = planetName;
    }

    return context;
  } catch (error) {
    return null;
  }
};

export const generateStargateUrlForQR = (context: StargateContext): string => {
  try {
    const galaxyCoords = context.coordinates.split(",").map(Number);
    const currentPage = StargateGenerator.getCurrentPage();

    let relativeUrl: string;
    switch (context.type) {
      case "galaxy":
        relativeUrl = StargateGenerator.generateGalaxyUrl(galaxyCoords, currentPage);
        break;
      case "system":
        if (context.systemIndex !== undefined) {
          relativeUrl = StargateGenerator.generateSystemUrl(galaxyCoords, context.systemIndex, currentPage);
        } else {
          return window.location.href;
        }
        break;
      case "planet":
        if (context.systemIndex !== undefined && context.planetName) {
          relativeUrl = StargateGenerator.generatePlanetUrl(galaxyCoords, context.systemIndex, context.planetName, currentPage);
        } else {
          return window.location.href;
        }
        break;
      default:
        return window.location.href;
    }

    return `${window.location.origin}${relativeUrl}`;
  } catch (error) {
    return window.location.href;
  }
};

export const createQRWithLogo = async (options: QRGeneratorOptions): Promise<HTMLCanvasElement> => {
  const { url, size } = options;

  return new Promise((resolve, reject) => {
    const qrCanvas = document.createElement("canvas");
    const containerSize = size;
    const qrSize = Math.floor(size * 0.8);

    QRCode.toCanvas(
      qrCanvas,
      url,
      {
        width: qrSize,
        margin: 0,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H",
      },
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        const finalCanvas = document.createElement("canvas");
        const ctx = finalCanvas.getContext("2d");
        const scanMeSpace = Math.floor(containerSize * 0.17);
        finalCanvas.width = containerSize;
        finalCanvas.height = containerSize + scanMeSpace;

        if (ctx) {
          const radius = Math.floor(containerSize * 0.1);
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.roundRect(0, 0, finalCanvas.width, finalCanvas.height, radius);
          ctx.fill();

          const qrOffset = (containerSize - qrSize) / 2;
          ctx.drawImage(qrCanvas, qrOffset, qrOffset);

          ctx.fillStyle = "#000000";
          ctx.font = `bold ${Math.floor(containerSize * 0.13)}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("VIEW IT LIVE", containerSize / 2, containerSize + scanMeSpace * 0.2);

          resolve(finalCanvas);
        }
      }
    );
  });
};

export const addQRToScreenshot = async (ctx: CanvasRenderingContext2D, imageWidth: number, imageHeight: number, contextOrUrl: StargateContext | { type: "galaxy" | "system" | "planet"; stargateUrl: string }) => {
  try {
    if (UniverseDetection.isRemoteUniverse()) {
      return;
    }

    let url: string;

    if ("coordinates" in contextOrUrl) {
      url = generateStargateUrlForQR(contextOrUrl);
    } else {
      const context = extractStargateContext(contextOrUrl.stargateUrl, contextOrUrl.type);
      if (context) {
        url = generateStargateUrlForQR(context);
      } else {
        url = contextOrUrl.stargateUrl;
      }
    }

    // Replace localhost URL with Koyeb production URL for QR codes, only for The Core Continuum (preshared seed and cosmic origin time)
    if (url.startsWith("http://localhost/")) {
      try {
        const response = await fetch("/api/universe/config");
        const data = await response.json();
        const CORE_CONTINUUM_SEED_DECIMAL = 45156749731585371360938718175484539659389209313560548011495000289036640085049n;
        const CORE_CONTINUUM_SEED_SCIENTIFIC = 4.515674973158537e76;

        const configSeed = data.config_seed;
        const isCoreContinuum = configSeed === CORE_CONTINUUM_SEED_SCIENTIFIC || configSeed === CORE_CONTINUUM_SEED_DECIMAL || BigInt(configSeed) === CORE_CONTINUUM_SEED_DECIMAL;

        if (isCoreContinuum) {
          url = url.replace("http://localhost/", "https://the-atlas.koyeb.app/");
        }
      } catch (error) {
        console.warn("Failed to check config seed:", error);
      }
    }

    const qrSize = Math.floor(imageWidth / 8);
    const qrCanvas = await createQRWithLogo({ url, size: qrSize });

    const margin = Math.floor(imageWidth / 100);
    const qrX = imageWidth - qrCanvas.width - margin;
    const qrY = imageHeight - qrCanvas.height - margin;

    ctx.drawImage(qrCanvas, qrX, qrY);
  } catch (error) {
    console.warn("Failed to generate QR code:", error);
  }
};
