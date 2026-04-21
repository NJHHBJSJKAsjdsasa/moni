// atlas-ui/react/static/js/Utils/SeedSanitizer.tsx

export class SeedSanitizer {
  private static readonly MAX_DISPLAY_LENGTH = 45;

  static sanitizeForDisplay(seed: string): string {
    if (!seed) {
      return "";
    }

    const seedStr = String(seed);

    const sanitized = seedStr.replace(/[<>"'&]/g, "");

    if (sanitized.length > this.MAX_DISPLAY_LENGTH) {
      return sanitized.substring(0, this.MAX_DISPLAY_LENGTH - 3) + "...";
    }

    return sanitized;
  }
}
