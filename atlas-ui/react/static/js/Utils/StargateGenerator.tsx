// atlas-ui/react/static/js/Utils/StargateGenerator.tsx

export class StargateGenerator {
  private static encodeUrl(data: string): string {
    return btoa(data).replace(/\+/g, "-").replace(/\//g, "_");
  }

  public static generateGalaxyUrl(galaxyCoordinates: number[], page: number = 1): string {
    const data = `coordinates=${galaxyCoordinates[0]},${galaxyCoordinates[1]},${galaxyCoordinates[2]}&page=${page}`;
    const encodedData = this.encodeUrl(data);
    return `/stargate/${encodedData}`;
  }

  public static generateSystemUrl(galaxyCoordinates: number[], systemIndex: number, page?: number): string {
    const data = `coordinates=${galaxyCoordinates[0]},${galaxyCoordinates[1]},${galaxyCoordinates[2]}&system=${systemIndex}`;
    const encodedData = this.encodeUrl(data);
    return `/stargate/${encodedData}`;
  }

  public static generatePlanetUrl(galaxyCoordinates: number[], systemIndex: number, planetName: string, page?: number): string {
    const data = `coordinates=${galaxyCoordinates[0]},${galaxyCoordinates[1]},${galaxyCoordinates[2]}&system=${systemIndex}&planet=${planetName.toLowerCase()}`;
    const encodedData = this.encodeUrl(data);
    return `/stargate/${encodedData}`;
  }

  public static getCurrentPage(): number {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const pageParam = urlParams.get("page");
      if (pageParam) {
        return parseInt(pageParam, 10);
      }

      const pathMatch = window.location.pathname.match(/\/galaxy\/(\d+)/);
      if (pathMatch) {
        return parseInt(pathMatch[1], 10);
      }

      return 1;
    } catch (error) {
      return 1;
    }
  }
}
