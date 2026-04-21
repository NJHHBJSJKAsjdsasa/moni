// atlas-ui/react/static/js/Utils/UniverseTime.tsx

let globalTimeOffset: number = 0;

export function setGlobalTimeOffset(offset: number): void {
  globalTimeOffset = offset;
}

export function getGlobalTimeOffset(): number {
  return globalTimeOffset;
}

export function getUniverseTime(cosmicOriginTime: number): number {
  return Date.now() / 1000 - cosmicOriginTime + globalTimeOffset;
}

export function getAnimatedUniverseTime(cosmicOriginTime: number, timeSpeed: number = 1.0, startOffset: number = 0): number {
  const universeTime = getUniverseTime(cosmicOriginTime);
  return startOffset + universeTime * timeSpeed;
}

export const DEFAULT_COSMIC_ORIGIN_TIME = 514080000;
