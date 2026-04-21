// atlas-ui/react/static/js/Utils/NavigationHelper.tsx
import { UnifiedSpaceshipStorage } from "./UnifiedSpaceshipStorage.tsx";
import { TravelCost } from "./SpaceshipTypes.tsx";

export interface NavigationCheckResult {
  canTravel: boolean;
  cost: TravelCost;
  actualCost: TravelCost;
  missingResources?: {
    antimatter?: number;
    element115?: number;
    deuterium?: number;
  };
  exceedsRange?: boolean;
}

export class NavigationHelper {
  static calculateDistance(from: number[], to: number[]): number {
    const dx = Math.abs(to[0] - from[0]);
    const dy = Math.abs(to[1] - from[1]);
    const dz = Math.abs(to[2] - from[2]);

    const rawDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    return Math.floor(rawDistance / 100000);
  }

  static calculateTravelCost(distance: number, locationType: "galaxy" | "system" | "planet"): TravelCost {
    const baseMultipliers = {
      galaxy: { antimatter: 0.5, element115: 0.3, deuterium: 0.2 },
      system: { antimatter: 0.2, element115: 0.4, deuterium: 0.4 },
      planet: { antimatter: 0.1, element115: 0.2, deuterium: 0.7 },
    };

    const multiplier = baseMultipliers[locationType];
    const baseCost = Math.min(distance, 1000);

    return {
      antimatter: Math.floor(baseCost * multiplier.antimatter),
      element115: Math.floor(baseCost * multiplier.element115),
      deuterium: Math.floor(baseCost * multiplier.deuterium),
    };
  }

  static checkNavigationResources(from: number[], to: number[], locationType: "galaxy" | "system" | "planet"): NavigationCheckResult {
    const distance = this.calculateDistance(from, to);
    const cost = this.calculateTravelCost(distance, locationType);
    const resources = UnifiedSpaceshipStorage.getResources();
    const upgrade = UnifiedSpaceshipStorage.getUpgrade();

    const actualCost = {
      antimatter: Math.floor(cost.antimatter / upgrade.efficiency),
      element115: Math.floor(cost.element115 / upgrade.efficiency),
      deuterium: Math.floor(cost.deuterium / upgrade.efficiency),
    };

    const canAfford = resources.antimatter >= actualCost.antimatter && resources.element115 >= actualCost.element115 && resources.deuterium >= actualCost.deuterium;

    const withinRange = distance <= upgrade.range;

    const result: NavigationCheckResult = {
      canTravel: canAfford && withinRange,
      cost,
      actualCost,
    };

    if (!canAfford) {
      result.missingResources = {
        antimatter: Math.max(0, actualCost.antimatter - resources.antimatter),
        element115: Math.max(0, actualCost.element115 - resources.element115),
        deuterium: Math.max(0, actualCost.deuterium - resources.deuterium),
      };
    }

    if (!withinRange) {
      result.exceedsRange = true;
    }

    return result;
  }

  static performNavigation(coordinates: { x: number; y: number; z: number }, currentCoordinates: number[], locationType: "galaxy" | "system" | "planet"): boolean {
    const to = [coordinates.x, coordinates.y, coordinates.z];
    const check = this.checkNavigationResources(currentCoordinates, to, locationType);

    if (check.canTravel) {
      const consumed = UnifiedSpaceshipStorage.consumeResources(check.cost);

      if (consumed) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/navigate";

        Object.entries(coordinates).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value.toString();
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        return true;
      }
    }

    return false;
  }

  static showNavigationError(check: NavigationCheckResult): void {
    let message = "Cannot travel: ";

    if (check.exceedsRange) {
      message += "Destination exceeds ship range. Upgrade your ship to travel further.";
    } else if (check.missingResources) {
      const missing: string[] = [];
      if (check.missingResources.antimatter! > 0) {
        missing.push(`${check.missingResources.antimatter} Antimatter`);
      }
      if (check.missingResources.element115! > 0) {
        missing.push(`${check.missingResources.element115} Element 115`);
      }
      if (check.missingResources.deuterium! > 0) {
        missing.push(`${check.missingResources.deuterium} Deuterium`);
      }
      message += `Insufficient resources. Need: ${missing.join(", ")}`;
    }

    const toast = document.createElement("div");
    toast.className = "fixed top-4 right-4 z-50 bg-red-900/90 text-white px-4 py-3 rounded-lg shadow-lg border border-red-500/50 animate-slideInRight";

    const container = document.createElement("div");
    container.className = "flex items-center space-x-2";

    const warningSpan = document.createElement("span");
    warningSpan.className = "text-red-300";
    warningSpan.textContent = "⚠️";

    const messageSpan = document.createElement("span");
    messageSpan.className = "text-sm";
    messageSpan.textContent = message;

    container.appendChild(warningSpan);
    container.appendChild(messageSpan);
    toast.appendChild(container);

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.className = toast.className.replace("animate-slideInRight", "animate-slideOutRight");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 5000);
  }
}
