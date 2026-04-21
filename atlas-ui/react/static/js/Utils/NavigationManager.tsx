// atlas-ui/react/static/js/Utils/NavigationManager.tsx
import { UnifiedSpaceshipStorage } from "./UnifiedSpaceshipStorage.tsx";
import { NavigationHelper } from "./NavigationHelper.tsx";

export class NavigationManager {
  private static instance: NavigationManager;
  private isInitialized = false;

  static getInstance(): NavigationManager {
    if (!NavigationManager.instance) {
      NavigationManager.instance = new NavigationManager();
    }
    return NavigationManager.instance;
  }

  initialize(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    document.addEventListener("click", this.handleClick.bind(this), true);
  }

  checkAndConsume(destination: any, currentCoords: number[], type: "galaxy" | "system" | "planet"): boolean {
    const destCoords = [destination.x, destination.y, destination.z];
    const distance = NavigationHelper.calculateDistance(currentCoords, destCoords);
    const cost = NavigationHelper.calculateTravelCost(distance, type);
    const resources = UnifiedSpaceshipStorage.getResources();
    const upgrade = UnifiedSpaceshipStorage.getUpgrade();

    const actualCost = {
      antimatter: Math.floor(cost.antimatter / upgrade.efficiency),
      element115: Math.floor(cost.element115 / upgrade.efficiency),
      deuterium: Math.floor(cost.deuterium / upgrade.efficiency),
    };

    const canAfford = resources.antimatter >= actualCost.antimatter && resources.element115 >= actualCost.element115 && resources.deuterium >= actualCost.deuterium;

    const withinRange = distance <= upgrade.range;

    if (canAfford && withinRange) {
      const consumed = UnifiedSpaceshipStorage.consumeResources(cost);
      if (consumed) {
        this.showNavigationSuccess(actualCost, type);
        return true;
      }
    }

    const check = NavigationHelper.checkNavigationResources(currentCoords, destCoords, type);
    NavigationHelper.showNavigationError(check);
    return false;
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const link = target.closest("a") as HTMLAnchorElement;

    if (!link || !link.href) return;

    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;

    const navigation = this.parseNavigation(url);
    if (!navigation) return;

    const canNavigate = this.checkAndConsumeResources(navigation);

    if (!canNavigate) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private parseNavigation(url: URL): any {
    const pathname = url.pathname;

    if (pathname.includes("/stargate/")) {
      const encodedData = pathname.split("/stargate/")[1];
      try {
        const decoded = atob(encodedData);
        const data = JSON.parse(decoded);
        return {
          type: data.type || "galaxy",
          destination: data.coordinates || [0, 0, 0],
          url: url.href,
        };
      } catch {
        return null;
      }
    }

    if (pathname.match(/^\/galaxy\/\d+$/)) {
      const page = parseInt(pathname.split("/")[2]);
      return {
        type: "galaxy",
        destination: [page * 1000, page * 1000, page * 1000],
        url: url.href,
      };
    }

    if (pathname.match(/^\/system\/\d+$/)) {
      return {
        type: "system",
        destination: this.estimateSystemCoordinates(),
        url: url.href,
      };
    }

    if (pathname.match(/^\/planet\//)) {
      return {
        type: "planet",
        destination: this.estimatePlanetCoordinates(),
        url: url.href,
      };
    }

    return null;
  }

  private getCurrentCoordinates(): number[] {
    const pathMatch = window.location.pathname.match(/\/galaxy\/(\d+)/);
    if (pathMatch) {
      const page = parseInt(pathMatch[1]);
      return [page * 1000, page * 1000, page * 1000];
    }

    return [0, 0, 0];
  }

  private estimateSystemCoordinates(): number[] {
    const current = this.getCurrentCoordinates();
    return [current[0] + 100, current[1] + 100, current[2] + 100];
  }

  private estimatePlanetCoordinates(): number[] {
    const current = this.getCurrentCoordinates();
    return [current[0] + 10, current[1] + 10, current[2] + 10];
  }

  private checkAndConsumeResources(navigation: any): boolean {
    const currentCoords = this.getCurrentCoordinates();
    const distance = NavigationHelper.calculateDistance(currentCoords, navigation.destination);
    const cost = NavigationHelper.calculateTravelCost(distance, navigation.type);
    const resources = UnifiedSpaceshipStorage.getResources();
    const upgrade = UnifiedSpaceshipStorage.getUpgrade();

    const actualCost = {
      antimatter: Math.floor(cost.antimatter / upgrade.efficiency),
      element115: Math.floor(cost.element115 / upgrade.efficiency),
      deuterium: Math.floor(cost.deuterium / upgrade.efficiency),
    };

    const canAfford = resources.antimatter >= actualCost.antimatter && resources.element115 >= actualCost.element115 && resources.deuterium >= actualCost.deuterium;

    const withinRange = distance <= upgrade.range;

    if (canAfford && withinRange) {
      const consumed = UnifiedSpaceshipStorage.consumeResources(cost);
      if (consumed) {
        this.showNavigationSuccess(actualCost, navigation.type);
        return true;
      }
    }

    const check = NavigationHelper.checkNavigationResources(currentCoords, navigation.destination, navigation.type);
    NavigationHelper.showNavigationError(check);
    return false;
  }

  private showNavigationSuccess(cost: any, type: string): void {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-4 left-4 z-50 bg-green-900/90 text-white px-4 py-3 rounded-lg shadow-lg border border-green-500/50 animate-slideInLeft";

    const typeEmoji =
      {
        galaxy: "🌌",
        system: "⭐",
        planet: "🪐",
      }[type] || "🚀";

    const container = document.createElement("div");
    container.className = "flex items-center space-x-2";

    const emojiSpan = document.createElement("span");
    emojiSpan.className = "text-green-300";
    emojiSpan.textContent = typeEmoji;

    const contentDiv = document.createElement("div");

    const titleDiv = document.createElement("div");
    titleDiv.className = "text-sm font-semibold";
    titleDiv.textContent = "Navigation Engaged!";

    const costDiv = document.createElement("div");
    costDiv.className = "text-xs text-green-200";
    costDiv.textContent = `Consumed: ${cost.antimatter} AM | ${cost.element115} E115 | ${cost.deuterium} D`;

    contentDiv.appendChild(titleDiv);
    contentDiv.appendChild(costDiv);

    container.appendChild(emojiSpan);
    container.appendChild(contentDiv);
    toast.appendChild(container);

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.className = toast.className.replace("animate-slideInLeft", "animate-slideOutLeft");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }
}

if (typeof window !== "undefined") {
  NavigationManager.getInstance().initialize();
}
