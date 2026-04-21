// atlas-ui/react/static/js/Utils/MultiverseEmitter.tsx

export class MultiverseEmitter {
  private static glitchChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()[]{}|;:,.<>?";
  private static baseText = "MULTIVERSE ONLINE";

  static createGlitchText(): string {
    let result = this.baseText;

    const numGlitches = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < numGlitches; i++) {
      const randomIndex = Math.floor(Math.random() * result.length);
      const randomChar = this.glitchChars[Math.floor(Math.random() * this.glitchChars.length)];

      result = result.substring(0, randomIndex) + randomChar + result.substring(randomIndex + 1);
    }

    return result;
  }

  static shouldGlitch(): boolean {
    return Math.random() < 0.3;
  }

  static getRandomInterval(): number {
    return Math.floor(Math.random() * 2000) + 2000;
  }

  static getGlitchAnimationSpeed(): number {
    return Math.floor(Math.random() * 50) + 50;
  }
}
