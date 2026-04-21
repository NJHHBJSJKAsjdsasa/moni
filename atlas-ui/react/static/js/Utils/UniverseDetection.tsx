// atlas-ui/react/static/js/Utils/UniverseDetection.tsx

export class UniverseDetection {
  static isRemoteUniverse(): boolean {
    try {
      const configElement = document.getElementById("data-universe-config");
      if (configElement) {
        const config = JSON.parse(configElement.textContent || "{}");
        return config.remote === true;
      }
      return false;
    } catch (error) {
      console.error("Error checking universe type:", error);
      return false;
    }
  }

  static getUniverseConfig(): any {
    try {
      const configElement = document.getElementById("data-universe-config");
      if (configElement) {
        return JSON.parse(configElement.textContent || "{}");
      }
      return null;
    } catch (error) {
      console.error("Error parsing universe config:", error);
      return null;
    }
  }
}