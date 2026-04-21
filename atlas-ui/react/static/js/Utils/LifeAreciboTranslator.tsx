// atlas-ui/react/static/js/Utils/LifeAreciboTranslator.tsx

export interface AreciboConfig {
  lifeForm: string;
  planetName: string;
  width: number;
  height: number;
}

export interface AreciboMessage {
  bitmap: number[];
  colorMap: number[];
  width: number;
  height: number;
  lifeForm: string;
  planetName: string;
}

export class AreciboGenerator {
  private static readonly WIDTH = 23;
  private static readonly HEIGHT = 73;

  private static readonly COLORS = {
    BLACK: 0,
    WHITE: 1,
    PURPLE: 2,
    GREEN: 3,
    BLUE: 4,
    ORANGE: 5,
    RED: 6,
    YELLOW: 7,
    LILAC: 8,
  };

  public static async generate(config: AreciboConfig): Promise<AreciboMessage> {
    const bitmap = new Array(this.WIDTH * this.HEIGHT).fill(0);
    const colorMap = new Array(this.WIDTH * this.HEIGHT).fill(0);

    this.drawNumbers(bitmap, colorMap);

    this.drawBlankLine(bitmap, colorMap, 4);

    this.drawChemicalElements(bitmap, colorMap, config.lifeForm, config.planetName);

    this.drawBlankLine(bitmap, colorMap, 10);

    this.drawBlankLine(bitmap, colorMap, 11);

    this.drawNucleotides(bitmap, colorMap, config.lifeForm, config.planetName);

    this.drawBlankLine(bitmap, colorMap, 28);

    this.drawDNADoubleHelix(bitmap, colorMap, config.lifeForm, config.planetName, 29, 15);

    this.drawBlankLine(bitmap, colorMap, 44);

    this.drawLifeFormSection(bitmap, colorMap, config.lifeForm, config.planetName, 45, 9);

    this.drawBlankLine(bitmap, colorMap, 54);

    await this.drawSolarSystem(bitmap, colorMap, config.planetName, 55);

    this.drawBlankLine(bitmap, colorMap, 63);

    this.drawTransmissionMethod(bitmap, colorMap, config.lifeForm, config.planetName, 64, 9);

    return {
      bitmap,
      colorMap,
      width: this.WIDTH,
      height: this.HEIGHT,
      lifeForm: config.lifeForm,
      planetName: config.planetName,
    };
  }

  private static setPixel(bitmap: number[], colorMap: number[], col: number, row: number, value: number = 1, color: number = 1): void {
    if (col >= 0 && col < this.WIDTH && row >= 0 && row < this.HEIGHT) {
      const index = row * this.WIDTH + col;
      bitmap[index] = value;
      if (value > 0) {
        colorMap[index] = color;
      }
    }
  }

  // Section 1: Números del 1 al 10
  private static drawNumbers(bitmap: number[], colorMap: number[]): void {
    const columnPositions = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

    for (let i = 0; i < 10; i++) {
      const number = i + 1;
      const col = columnPositions[i];
      const binary = number.toString(2);

      for (let bit = 0; bit < binary.length && bit < 4; bit++) {
        const row = 3 - bit;
        const bitValue = parseInt(binary[binary.length - 1 - bit]);
        this.setPixel(bitmap, colorMap, col, row, bitValue, this.COLORS.WHITE);
      }
    }
  }

  // Seccion 2: Elementos químicos
  private static drawChemicalElements(bitmap: number[], colorMap: number[], lifeForm: string, planetName?: string): void {
    const elements = this.getElementsForLifeForm(lifeForm, planetName || "Earth");
    const category = this.getLifeCategory(lifeForm);

    switch (category) {
      case "carbon-based":
        this.drawCarbonBasedElements(bitmap, colorMap, elements);
        break;
      case "silicon-based":
        this.drawSiliconBasedElements(bitmap, colorMap, elements);
        break;
      case "robotic":
        this.drawRoboticElements(bitmap, colorMap, elements);
        break;
      case "gaseous":
        this.drawGaseousElements(bitmap, colorMap, elements);
        break;
      case "energy":
        this.drawEnergyElements(bitmap, colorMap, elements);
        break;
      case "divine":
        this.drawDivineElements(bitmap, colorMap, elements);
        break;
      default:
        this.drawCarbonBasedElements(bitmap, colorMap, elements);
    }
  }

  // Nucleótidos o análogos
  private static drawNucleotides(bitmap: number[], colorMap: number[], lifeForm: string, planetName?: string): void {
    const category = this.getLifeCategory(lifeForm);

    switch (category) {
      case "carbon-based":
        this.drawCarbonBasedGenetics(bitmap, colorMap, lifeForm, planetName);
        break;
      case "silicon-based":
        this.drawSiliconBasedGenetics(bitmap, colorMap, lifeForm, planetName);
        break;
      case "robotic":
        this.drawRoboticInformation(bitmap, colorMap, lifeForm, planetName);
        break;
      case "gaseous":
        this.drawGaseousInformation(bitmap, colorMap, lifeForm, planetName);
        break;
      case "energy":
        this.drawEnergyInformation(bitmap, colorMap, lifeForm, planetName);
        break;
      case "divine":
        this.drawDivineInformation(bitmap, colorMap);
        break;
      default:
        this.drawCarbonBasedGenetics(bitmap, colorMap, lifeForm);
    }
  }

  // Vida basada en carbono - Nucleótidos estándar
  private static drawCarbonBasedGenetics(bitmap: number[], colorMap: number[], lifeForm: string, planetName?: string): void {
    const elements = this.getElementsForLifeForm(lifeForm, planetName || "Earth");
    const bases = this.getNitrogenBases(lifeForm, planetName || "Earth");

    this.drawNucleotideFormulas(bitmap, colorMap, bases, elements, lifeForm);

    this.drawBlankLine(bitmap, colorMap, 16);

    this.drawSugarPhosphateBackbone(bitmap, colorMap, elements);

    this.drawBlankLine(bitmap, colorMap, 21);

    this.drawGenomeSize(bitmap, colorMap, elements, lifeForm);

    this.drawBlankLine(bitmap, colorMap, 26);

    this.drawDNAHelixBorders(bitmap, colorMap);
  }

  // Vida basada en silicio - Bases de silicato análogas a nucleótidos
  private static getSilicateBonds(element: string): number[] {
    const bondPatterns: { [key: string]: number[] } = {
      Si: [1, 1, 0, 4, 0],
      O: [0, 2, 0, 2, 0],
      Al: [2, 0, 1, 3, 0],
      Fe: [1, 0, 2, 3, 0],
      Mg: [0, 1, 0, 2, 1],
      Ca: [1, 1, 1, 2, 1],
      K: [0, 0, 1, 1, 0],
      Na: [0, 0, 1, 1, 0],
      H: [1, 0, 0, 1, 0],
      S: [0, 1, 1, 2, 2],
      P: [0, 1, 0, 3, 1],
      Ti: [2, 1, 0, 4, 0],
      V: [1, 2, 1, 3, 0],
      Cr: [2, 0, 2, 2, 0],
      Mn: [1, 1, 2, 2, 0],
      Co: [1, 0, 1, 2, 1],
      Ni: [0, 2, 1, 2, 0],
      Cu: [2, 0, 0, 2, 0],
      Zn: [0, 1, 1, 2, 0],
      Li: [0, 0, 0, 1, 0],
      Be: [0, 0, 1, 2, 0],
      B: [0, 1, 2, 3, 0],
      F: [1, 0, 0, 1, 0],
      Cl: [1, 0, 0, 1, 0],
      Sr: [1, 1, 0, 2, 2],
      Y: [2, 1, 1, 3, 0],
      Zr: [2, 2, 0, 4, 0],
    };

    return bondPatterns[element] || [1, 1, 1, 2, 0];
  }

  // Vida basada en energía - Estados energéticos análogos a nucleótidos
  private static getEnergyFrequency(state: string): number {
    const freqMap: { [key: string]: number } = {
      α: 1,
      β: 2,
      γ: 3,
      δ: 4,
      ε: 1.5,
      ζ: 2.5,
      η: 3.5,
      θ: 4.5,
      ι: 1.2,
      κ: 2.2,
      λ: 3.2,
      μ: 4.2,
      ν: 1.8,
      ξ: 2.8,
      ο: 3.8,
      π: 4.8,
      ρ: 2.3,
      σ: 3.3,
      τ: 4.3,
      υ: 1.7,
      φ: 2.7,
      χ: 3.7,
      ψ: 4.7,
      ω: 5,
      "∆": 6,
      "∇": 7,
      "∞": 8,
      Ω: 9,
      Φ: 10,
      Ψ: 11,
      "≈": 12,
      "∼": 13,
      "※": 14,
      "⟨⟩": 15,
      "◊": 16,
      "◎": 17,
    };

    return freqMap[state] || Math.abs(state.charCodeAt(0) % 10) + 1;
  }

  // Obtiene el patrón visual para un estado energético
  private static getEnergyPattern(state: string): string {
    const patterns: { [key: string]: string } = {
      α: "wave",
      β: "pulse",
      γ: "spiral",
      δ: "zigzag",
      ε: "sine",
      ζ: "square",
      η: "triangle",
      θ: "sawtooth",
      ι: "burst",
      κ: "ripple",
      λ: "vortex",
      μ: "standing",
      ν: "modulated",
      ξ: "interference",
      ο: "resonance",
      π: "harmonic",
      ρ: "quantum",
      σ: "coherent",
      τ: "entangled",
      υ: "superposed",
      φ: "phase",
      χ: "amplitude",
      ψ: "frequency",
      ω: "complex",
      "∆": "dimensional",
      "∇": "gradient",
      "∞": "infinite",
      Ω: "omega",
      Φ: "phi",
      Ψ: "psi",
      "≈": "approximate",
      "∼": "similar",
      "※": "reference",
      "⟨⟩": "bracket",
      "◊": "diamond",
      "◎": "target",
    };

    return patterns[state] || "default";
  }

  // Calcula si se debe dibujar un píxel según el patrón energético
  private static calculateEnergyPattern(pattern: string, phase: number, step: number): boolean {
    switch (pattern) {
      case "wave":
        return Math.sin(phase) > 0;
      case "pulse":
        return step % 2 === 0;
      case "spiral":
        return Math.sin(phase) + Math.cos(phase * 1.5) > 0;
      case "zigzag":
        return step % 2 === Math.floor(phase) % 2;
      case "sine":
        return Math.sin(phase * 2) > 0.5;
      case "square":
        return Math.sin(phase) > 0;
      case "triangle":
        return Math.abs(Math.sin(phase)) > 0.5;
      case "burst":
        return step === 0 || step === 3;
      case "ripple":
        return Math.sin(phase + step) > 0.3;
      case "vortex":
        return (step + Math.floor(phase * 2)) % 3 !== 0;
      case "quantum":
        return Math.random() > 0.3;
      case "interference":
        return Math.sin(phase) + Math.sin(phase * 1.7) > 0;
      case "dimensional":
        return step < 2;
      case "infinite":
        return true;
      default:
        return Math.sin(phase) > 0;
    }
  }

  // Vida basada en silicio - Información cristalina análoga a nucleótidos
  private static drawSiliconBasedGenetics(bitmap: number[], colorMap: number[], lifeForm: string, planetName: string): void {
    const silicateBases = this.getNitrogenBases(lifeForm, planetName);

    const siliconUnits = silicateBases.map((base, index) => ({
      col: 4 + index * 4,
      base: base,
      bonds: this.getSilicateBonds(base),
    }));

    for (const unit of siliconUnits) {
      this.drawChemicalFormula(bitmap, colorMap, unit.col, 12, unit.bonds);
    }

    this.drawBlankLine(bitmap, colorMap, 16);

    const centerCol = 11;
    for (let row = 17; row <= 20; row++) {
      this.setPixel(bitmap, colorMap, centerCol, row, 1, this.COLORS.GREEN);

      const offset = (row - 17) % 2 === 0 ? 3 : 4;
      this.setPixel(bitmap, colorMap, centerCol - offset, row, 1, this.COLORS.GREEN);
      this.setPixel(bitmap, colorMap, centerCol + offset, row, 1, this.COLORS.GREEN);

      if (row % 2 === 1) {
        this.setPixel(bitmap, colorMap, 6, row, 1, this.COLORS.GREEN);
        this.setPixel(bitmap, colorMap, 16, row, 1, this.COLORS.GREEN);
      }
    }

    this.drawBlankLine(bitmap, colorMap, 21);

    for (let row = 22; row <= 25; row++) {
      const layer = row - 22;
      for (let col = 9 - layer; col <= 13 + layer; col++) {
        if ((col + row) % 2 === 0) {
          this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
        }
      }
    }

    this.drawBlankLine(bitmap, colorMap, 26);

    this.drawDNAHelixBorders(bitmap, colorMap);
  }

  // Entidades robóticas - Información digital análoga a nucleótidos - Procedural
  private static drawRoboticInformation(bitmap: number[], colorMap: number[], lifeForm: string, planetName?: string): void {
    const hash = this.hashString(lifeForm + (planetName || "Earth") + "digital");
    const rng = this.createSeededRandom(hash);

    const digitalArchitectures = [
      [
        { col: 4, code: [0, 0] },
        { col: 8, code: [0, 1] },
        { col: 12, code: [1, 0] },
        { col: 16, code: [1, 1] },
      ],
      [
        { col: 4, code: [1, 0] },
        { col: 8, code: [1, 1] },
        { col: 12, code: [0, 0] },
        { col: 16, code: [0, 1] },
      ],
      [
        { col: 4, code: [0, 1] },
        { col: 8, code: [1, 0] },
        { col: 12, code: [1, 1] },
        { col: 16, code: [0, 0] },
      ],
      [
        { col: 4, code: [1, 1] },
        { col: 8, code: [0, 0] },
        { col: 12, code: [0, 1] },
        { col: 16, code: [1, 0] },
      ],
    ];

    const archIndex = Math.floor(rng.random() * digitalArchitectures.length);
    const digitalCodes = digitalArchitectures[archIndex];

    for (const dc of digitalCodes) {
      const colVariation = Math.floor(rng.random() * 3) - 1;
      const adjustedCol = Math.max(3, Math.min(19, dc.col + colVariation));

      const headerIntensity = rng.random() > 0.2 ? 1 : 0;
      if (headerIntensity) {
        this.setPixel(bitmap, colorMap, adjustedCol, 12, 1, this.COLORS.GREEN);
        this.setPixel(bitmap, colorMap, adjustedCol + 1, 12, 1, this.COLORS.GREEN);
      }

      for (let i = 0; i < dc.code.length; i++) {
        if (dc.code[i] === 1) {
          const bitReliability = 0.85 + (rng.random() - 0.5) * 0.2;
          if (rng.random() < bitReliability) {
            this.setPixel(bitmap, colorMap, adjustedCol + i, 13 + i, 1, this.COLORS.GREEN);
          }

          if (rng.random() > 0.7) {
            const errorCorrectionCol = adjustedCol + (Math.floor(rng.random() * 3) - 1);
            if (errorCorrectionCol >= 3 && errorCorrectionCol <= 19) {
              this.setPixel(bitmap, colorMap, errorCorrectionCol, 14, 1, this.COLORS.GREEN);
            }
          }
        }
      }

      if (rng.random() > 0.15) {
        this.setPixel(bitmap, colorMap, adjustedCol, 15, 1, this.COLORS.GREEN);
      }
    }

    this.drawBlankLine(bitmap, colorMap, 16);

    const busArchitecture = Math.floor(rng.random() * 4);

    for (let row = 17; row <= 20; row++) {
      switch (busArchitecture) {
        case 0:
          for (let col = 9; col <= 13; col++) {
            this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
          }
          if (row % 2 === 0) {
            this.setPixel(bitmap, colorMap, 6, row, 1, this.COLORS.GREEN);
            this.setPixel(bitmap, colorMap, 7, row, 1, this.COLORS.GREEN);
            this.setPixel(bitmap, colorMap, 15, row, 1, this.COLORS.GREEN);
            this.setPixel(bitmap, colorMap, 16, row, 1, this.COLORS.GREEN);
          }
          break;

        case 1:
          const spread = row - 17 + 1;
          for (let col = 11 - spread; col <= 11 + spread; col++) {
            if (col >= 6 && col <= 16) {
              this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
            }
          }
          break;

        case 2:
          if (row === 17 || row === 20) {
            for (let col = 8; col <= 14; col++) {
              this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
            }
          } else {
            this.setPixel(bitmap, colorMap, 8, row, 1, this.COLORS.GREEN);
            this.setPixel(bitmap, colorMap, 11, row, 1, this.COLORS.GREEN);
            this.setPixel(bitmap, colorMap, 14, row, 1, this.COLORS.GREEN);
          }
          break;

        case 3:
          this.setPixel(bitmap, colorMap, 11, row, 1, this.COLORS.GREEN);
          if (rng.random() > 0.3) {
            this.setPixel(bitmap, colorMap, 11 - (row - 16), row, 1, this.COLORS.GREEN);
          }
          if (rng.random() > 0.3) {
            this.setPixel(bitmap, colorMap, 11 + (row - 16), row, 1, this.COLORS.GREEN);
          }
          break;
      }

      if (rng.random() > 0.6) {
        const controlCol = 5 + Math.floor(rng.random() * 13);
        if (controlCol >= 5 && controlCol <= 17) {
          this.setPixel(bitmap, colorMap, controlCol, row, 1, this.COLORS.GREEN);
        }
      }
    }

    this.drawBlankLine(bitmap, colorMap, 21);

    const complexityPattern = Math.floor(rng.random() * 4);

    for (let row = 22; row <= 25; row++) {
      const level = row - 22;

      switch (complexityPattern) {
        case 0:
          for (let col = 8; col <= 8 + level * 3; col++) {
            if (col <= 14) {
              this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
            }
          }
          break;

        case 1:
          const exponentialWidth = Math.pow(2, level);
          for (let col = 11 - exponentialWidth; col <= 11 + exponentialWidth; col++) {
            if (col >= 8 && col <= 14) {
              this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
            }
          }
          break;

        case 2:
          const moduleSize = level + 1;
          for (let module = 0; module < moduleSize; module++) {
            const moduleCol = 8 + module * 2;
            if (moduleCol <= 14) {
              this.setPixel(bitmap, colorMap, moduleCol, row, 1, this.COLORS.GREEN);
              if (moduleCol + 1 <= 14) {
                this.setPixel(bitmap, colorMap, moduleCol + 1, row, 1, this.COLORS.GREEN);
              }
            }
          }
          break;

        case 3:
          const totalWidth = level * 2 + 2;
          for (let col = 9; col <= 9 + totalWidth; col++) {
            if (col <= 14 && rng.random() > 0.3) {
              this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
            }
          }
          break;
      }
    }

    this.drawBlankLine(bitmap, colorMap, 26);

    this.drawDNAHelixBorders(bitmap, colorMap);
  }

  // Gas consciente - Estados cuánticos análogos a nucleótidos
  private static drawGaseousInformation(bitmap: number[], colorMap: number[], lifeForm: string, planetName?: string): void {
    const hash = this.hashString(lifeForm + (planetName || "Earth") + "quantum");
    const rng = this.createSeededRandom(hash);

    const quantumConfigurations = [
      [
        { col: 4, state: [0, 0] },
        { col: 8, state: [0, 1] },
        { col: 12, state: [1, 0] },
        { col: 16, state: [1, 1] },
      ],
      [
        { col: 4, state: [1, 0] },
        { col: 8, state: [0, 0] },
        { col: 12, state: [1, 1] },
        { col: 16, state: [0, 1] },
      ],
      [
        { col: 4, state: [0, 1] },
        { col: 8, state: [1, 1] },
        { col: 12, state: [0, 0] },
        { col: 16, state: [1, 0] },
      ],
      [
        { col: 4, state: [1, 1] },
        { col: 8, state: [1, 0] },
        { col: 12, state: [0, 1] },
        { col: 16, state: [0, 0] },
      ],
    ];

    const configIndex = Math.floor(rng.random() * quantumConfigurations.length);
    const quantumStates = quantumConfigurations[configIndex];

    for (const qs of quantumStates) {
      const colVariation = Math.floor(rng.random() * 3) - 1;
      const adjustedCol = Math.max(3, Math.min(19, qs.col + colVariation));

      this.setPixel(bitmap, colorMap, adjustedCol, 12, 1, this.COLORS.GREEN);
      this.setPixel(bitmap, colorMap, adjustedCol + 1, 12, 1, this.COLORS.GREEN);

      for (let i = 0; i < qs.state.length; i++) {
        if (qs.state[i] === 1) {
          const intensityVariation = rng.random() > 0.3 ? 1 : 0;
          if (intensityVariation) {
            this.setPixel(bitmap, colorMap, adjustedCol + i, 13 + i, 1, this.COLORS.GREEN);
          }

          if (rng.random() > 0.6) {
            const interferenceCol = adjustedCol + (Math.floor(rng.random() * 3) - 1);
            if (interferenceCol >= 3 && interferenceCol <= 19) {
              this.setPixel(bitmap, colorMap, interferenceCol, 14, 1, this.COLORS.GREEN);
            }
          }
        }
      }

      if (rng.random() > 0.2) {
        this.setPixel(bitmap, colorMap, adjustedCol, 15, 1, this.COLORS.GREEN);
      }
    }

    this.drawBlankLine(bitmap, colorMap, 16);

    const entanglementPattern = Math.floor(rng.random() * 3);

    for (let row = 17; row <= 20; row++) {
      this.setPixel(bitmap, colorMap, 11, row, 1, this.COLORS.GREEN);

      const baseSpread = row - 17 + 2;
      const spreadVariation = Math.floor(rng.random() * 2);
      const spread = baseSpread + spreadVariation;

      switch (entanglementPattern) {
        case 0:
          this.setPixel(bitmap, colorMap, 11 - spread, row, 1, this.COLORS.GREEN);
          this.setPixel(bitmap, colorMap, 11 + spread, row, 1, this.COLORS.GREEN);
          break;

        case 1:
          if (row % 2 === 0) {
            this.setPixel(bitmap, colorMap, 11 - spread, row, 1, this.COLORS.GREEN);
            this.setPixel(bitmap, colorMap, 11 + (spread - 1), row, 1, this.COLORS.GREEN);
          } else {
            this.setPixel(bitmap, colorMap, 11 - (spread - 1), row, 1, this.COLORS.GREEN);
            this.setPixel(bitmap, colorMap, 11 + spread, row, 1, this.COLORS.GREEN);
          }
          break;

        case 2:
          for (let i = 1; i <= spread; i++) {
            if (rng.random() > 0.4) {
              this.setPixel(bitmap, colorMap, 11 - i, row, 1, this.COLORS.GREEN);
            }
            if (rng.random() > 0.4) {
              this.setPixel(bitmap, colorMap, 11 + i, row, 1, this.COLORS.GREEN);
            }
          }
          break;
      }

      if ((row % 2 === 1 && entanglementPattern <= 1) || (entanglementPattern === 2 && rng.random() > 0.5)) {
        for (let col = 11 - spread; col <= 11 + spread; col += Math.floor(rng.random() * 3) + 1) {
          if (col >= 6 && col <= 16) {
            this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
          }
        }
      }
    }

    this.drawBlankLine(bitmap, colorMap, 21);

    const coherencePattern = Math.floor(rng.random() * 4);

    for (let row = 22; row <= 25; row++) {
      const coherence = row - 22;

      switch (coherencePattern) {
        case 0:
          for (let col = 9; col <= 13; col++) {
            if ((col + row + coherence) % 3 === 0) {
              this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
            }
          }
          break;

        case 1:
          for (let col = 9; col <= 13; col++) {
            if ((col * row + coherence) % 4 === 0) {
              this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
            }
          }
          break;

        case 2:
          const centerCol = 11;
          const distance = Math.abs(coherence - 1.5);
          for (let col = 9; col <= 13; col++) {
            if (Math.abs(col - centerCol) <= 2 - distance) {
              if (rng.random() > 0.3) {
                this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
              }
            }
          }
          break;

        case 3:
          for (let col = 9; col <= 13; col++) {
            if (rng.random() > 0.3 + coherence * 0.1) {
              this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
            }
          }
          break;
      }
    }

    this.drawBlankLine(bitmap, colorMap, 26);

    this.drawDNAHelixBorders(bitmap, colorMap);
  }

  // Entidad de energía - Patrones ondulatorios análogos a nucleótidos
  private static drawEnergyInformation(bitmap: number[], colorMap: number[], lifeForm: string, planetName: string): void {
    const energyStates = this.getNitrogenBases(lifeForm, planetName);

    const stateConfigs = energyStates.map((state, index) => ({
      col: 4 + index * 4,
      state: state,
      freq: this.getEnergyFrequency(state),
      pattern: this.getEnergyPattern(state),
    }));

    for (const config of stateConfigs) {
      for (let row = 12; row <= 15; row++) {
        const phase = ((row - 12) * Math.PI) / config.freq;
        const shouldDraw = this.calculateEnergyPattern(config.pattern, phase, row - 12);

        if (shouldDraw) {
          this.setPixel(bitmap, colorMap, config.col, row, 1, this.COLORS.GREEN);
          if (config.freq > 3) {
            this.setPixel(bitmap, colorMap, config.col + 1, row, 1, this.COLORS.GREEN);
          }
        }
      }
    }

    this.drawBlankLine(bitmap, colorMap, 16);

    for (let row = 17; row <= 20; row++) {
      this.setPixel(bitmap, colorMap, 11, row, 1, this.COLORS.GREEN);

      const intensity = row - 17;
      for (let i = 1; i <= 2 + intensity; i++) {
        if (11 - i >= 6) this.setPixel(bitmap, colorMap, 11 - i, row, 1, this.COLORS.GREEN);
        if (11 + i <= 16) this.setPixel(bitmap, colorMap, 11 + i, row, 1, this.COLORS.GREEN);
      }
    }

    this.drawBlankLine(bitmap, colorMap, 21);

    for (let row = 22; row <= 25; row++) {
      const level = row - 22;
      for (let col = 10 - level; col <= 12 + level; col++) {
        if (col >= 6 && col <= 16) {
          this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
        }
      }
    }

    this.drawBlankLine(bitmap, colorMap, 26);

    this.drawDNAHelixBorders(bitmap, colorMap);
  }

  // Entidad divina - Geometría sagrada análoga a nucleótidos con cruces católicas
  private static drawDivineInformation(bitmap: number[], colorMap: number[]): void {
    const crossPositions = [4, 8, 12, 16];

    for (const col of crossPositions) {
      for (let row = 12; row <= 15; row++) {
        this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
      }
      this.setPixel(bitmap, colorMap, col - 1, 13, 1, this.COLORS.GREEN);
      this.setPixel(bitmap, colorMap, col + 1, 13, 1, this.COLORS.GREEN);
    }

    this.drawBlankLine(bitmap, colorMap, 16);

    for (let row = 17; row <= 20; row++) {
      this.setPixel(bitmap, colorMap, 11, row, 1, this.COLORS.GREEN);

      const harmony = row - 17 + 1;
      for (let i = 1; i <= harmony; i++) {
        if (11 - i * 2 >= 6) this.setPixel(bitmap, colorMap, 11 - i * 2, row, 1, this.COLORS.GREEN);
        if (11 + i * 2 <= 16) this.setPixel(bitmap, colorMap, 11 + i * 2, row, 1, this.COLORS.GREEN);
      }
    }

    this.drawBlankLine(bitmap, colorMap, 21);

    const fibLevels = [1, 2, 3, 5];

    for (let row = 22; row <= 25; row++) {
      const level = fibLevels[row - 22];
      for (let col = 11 - level; col <= 11 + level; col++) {
        if (col >= 6 && col <= 16) {
          this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
        }
      }
    }

    this.drawBlankLine(bitmap, colorMap, 26);

    this.drawDNAHelixBorders(bitmap, colorMap);
  }

  // Vida basada en carbono - Nucleótidos estándar (A, T/U, C, G) con variaciones según el planeta y el esqueleto azúcar-fosfato del ADN
  private static drawNucleotideFormulas(bitmap: number[], colorMap: number[], bases: string[], elements: number[], lifeForm: string): void {
    const nucleotideData = this.getNucleotideVariation(lifeForm, elements);

    for (let i = 0; i < Math.min(nucleotideData.bases.length, 4); i++) {
      const base = nucleotideData.bases[i];
      const col = 3 + i * 4;

      this.drawAdaptedNucleotidePattern(bitmap, colorMap, base, col, elements);
    }

    const sugarFormula = nucleotideData.usesRNA ? [9, 5, 0, 4, 0] : [7, 5, 0, 1, 0];
    this.drawChemicalFormula(bitmap, colorMap, 1, 12, sugarFormula);
  }

  // Dibuja patrones visuales únicos de nucleótidos según los elementos del planeta
  private static drawAdaptedNucleotidePattern(bitmap: number[], colorMap: number[], base: any, col: number, elements: number[]): void {
    const fifthElement = elements[4];

    for (let elementIdx = 0; elementIdx < Math.min(4, base.formula.length); elementIdx++) {
      const count = base.formula[elementIdx];
      const row = 12 + elementIdx;

      if (count > 0) {
        this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);

        if (count >= 4) {
          this.setPixel(bitmap, colorMap, col + 1, row, 1, this.COLORS.GREEN);
        }
        if (count >= 7) {
          this.setPixel(bitmap, colorMap, col - 1, row, 1, this.COLORS.GREEN);
        }
      }
    }

    const fifthElementCount = base.formula[4] || 0;
    if (fifthElementCount > 0) {
      this.drawFifthElementPattern(bitmap, colorMap, col, 16, fifthElement, fifthElementCount);
    }
  }

  // Dibuja patrones visuales únicos para cada tipo de quinto elemento
  private static drawFifthElementPattern(bitmap: number[], colorMap: number[], col: number, row: number, element: number, count: number): void {
    switch (element) {
      case 15:
        this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
        if (count >= 2) this.setPixel(bitmap, colorMap, col + 1, row, 1, this.COLORS.GREEN);
        break;

      case 16:
        this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
        this.setPixel(bitmap, colorMap, col, row + 1, 1, this.COLORS.GREEN);
        if (count >= 2) this.setPixel(bitmap, colorMap, col + 1, row, 1, this.COLORS.GREEN);
        break;

      case 12:
        this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
        this.setPixel(bitmap, colorMap, col - 1, row, 1, this.COLORS.GREEN);
        this.setPixel(bitmap, colorMap, col + 1, row, 1, this.COLORS.GREEN);
        break;

      case 20:
        this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
        this.setPixel(bitmap, colorMap, col + 1, row, 1, this.COLORS.GREEN);
        this.setPixel(bitmap, colorMap, col, row + 1, 1, this.COLORS.GREEN);
        this.setPixel(bitmap, colorMap, col + 1, row + 1, 1, this.COLORS.GREEN);
        break;

      case 26:
        this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
        this.setPixel(bitmap, colorMap, col - 1, row, 1, this.COLORS.GREEN);
        this.setPixel(bitmap, colorMap, col + 1, row, 1, this.COLORS.GREEN);
        this.setPixel(bitmap, colorMap, col, row - 1, 1, this.COLORS.GREEN);
        this.setPixel(bitmap, colorMap, col, row + 1, 1, this.COLORS.GREEN);
        break;

      case 19:
        this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
        if (count >= 2) this.setPixel(bitmap, colorMap, col + 2, row, 1, this.COLORS.GREEN);
        break;

      case 11:
        this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
        if (count >= 2) this.setPixel(bitmap, colorMap, col + 1, row + 1, 1, this.COLORS.GREEN);
        break;

      default:
        this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
    }
  }

  // Dibuja el esqueleto azúcar-fosfato del ADN
  private static drawSugarPhosphateBackbone(bitmap: number[], colorMap: number[], elements: number[]): void {
    this.setPixel(bitmap, colorMap, 11, 18, 1, this.COLORS.GREEN);
    this.setPixel(bitmap, colorMap, 11, 19, 1, this.COLORS.GREEN);

    this.setPixel(bitmap, colorMap, 10, 17, 1, this.COLORS.GREEN);
    this.setPixel(bitmap, colorMap, 12, 17, 1, this.COLORS.GREEN);
    this.setPixel(bitmap, colorMap, 10, 20, 1, this.COLORS.GREEN);
    this.setPixel(bitmap, colorMap, 12, 20, 1, this.COLORS.GREEN);

    this.setPixel(bitmap, colorMap, 6, 18, 1, this.COLORS.GREEN);
    this.setPixel(bitmap, colorMap, 7, 18, 1, this.COLORS.GREEN);
    this.setPixel(bitmap, colorMap, 15, 18, 1, this.COLORS.GREEN);
    this.setPixel(bitmap, colorMap, 16, 18, 1, this.COLORS.GREEN);
  }

  // Dibuja el número total de nucleótidos en el genoma, el contenido GC, el número de cromosomas y el tamaño total del genoma
  private static drawGenomeSize(bitmap: number[], colorMap: number[], elements: number[], lifeForm: string): void {
    const nucleotideData = this.getNucleotideVariation(lifeForm, elements);
    const genomeSizeData = this.getGenomeSizeData(lifeForm, "Earth", elements);

    const geneCount = Math.floor(genomeSizeData.genes / 1000);
    for (let col = 8; col <= Math.min(14, 8 + geneCount); col++) {
      this.setPixel(bitmap, colorMap, col, 22, 1, this.COLORS.GREEN);
    }

    const gcPattern = genomeSizeData.gcContent;
    for (let col = 9; col <= 13; col++) {
      if (gcPattern === "high" && col % 2 === 1) {
        this.setPixel(bitmap, colorMap, col, 23, 1, this.COLORS.GREEN);
      } else if (gcPattern === "moderate" && (col === 10 || col === 12)) {
        this.setPixel(bitmap, colorMap, col, 23, 1, this.COLORS.GREEN);
      } else if (gcPattern === "variable") {
        this.setPixel(bitmap, colorMap, col, 23, 1, this.COLORS.GREEN);
      }
    }

    const chromosomes = genomeSizeData.chromosomes;
    for (let i = 0; i < Math.min(chromosomes, 7); i++) {
      this.setPixel(bitmap, colorMap, 8 + i, 24, 1, this.COLORS.GREEN);
    }

    const totalSize = Math.floor(Math.log10(genomeSizeData.totalBases / 1000000));
    for (let col = 9; col <= Math.min(15, 9 + totalSize); col++) {
      this.setPixel(bitmap, colorMap, col, 25, 1, this.COLORS.GREEN);
    }

    this.setPixel(bitmap, colorMap, 5, 22, 1, this.COLORS.GREEN);
    this.setPixel(bitmap, colorMap, 17, 25, 1, this.COLORS.GREEN);
  }

  // Dibuja solo los bordes de la doble hélice, dejando el centro libre
  private static drawDNAHelixBorders(bitmap: number[], colorMap: number[]): void {
    this.setPixel(bitmap, colorMap, 3, 27, 1, this.COLORS.GREEN);
    this.setPixel(bitmap, colorMap, 4, 27, 1, this.COLORS.GREEN);

    this.setPixel(bitmap, colorMap, 18, 27, 1, this.COLORS.GREEN);
    this.setPixel(bitmap, colorMap, 19, 27, 1, this.COLORS.GREEN);
  }

  // Dibuja la doble hélice de ADN adaptada según el tipo de vida
  private static drawDNADoubleHelix(bitmap: number[], colorMap: number[], lifeForm: string, planetName: string, startRow: number = 28, height: number = 15): void {
    const category = this.getLifeCategory(lifeForm);
    const centerCol = 11;

    switch (category) {
      case "carbon-based":
        this.drawCarbonBasedDoubleHelix(bitmap, colorMap, lifeForm, planetName, centerCol, startRow, height);
        break;
      case "silicon-based":
        this.drawSiliconBasedStructure(bitmap, colorMap, centerCol, startRow, height, lifeForm, planetName);
        break;
      case "robotic":
        this.drawDigitalDataStructure(bitmap, colorMap, centerCol, startRow, height, lifeForm, planetName);
        break;
      case "gaseous":
        this.drawQuantumFieldStructure(bitmap, colorMap, centerCol, startRow, height, lifeForm, planetName);
        break;
      case "energy":
        this.drawEnergyFieldStructure(bitmap, colorMap, centerCol, startRow, height, lifeForm, planetName);
        break;
      case "divine":
        this.drawCosmicGeometryStructure(bitmap, colorMap, centerCol, startRow, height);
        break;
      default:
        this.drawCarbonBasedDoubleHelix(bitmap, colorMap, lifeForm, planetName, centerCol, startRow, height);
    }
  }

  // Doble hélice de ADN para vida basada en carbono
  private static drawCarbonBasedDoubleHelix(bitmap: number[], colorMap: number[], lifeForm: string, planetName: string, centerCol: number, startRow: number, height: number): void {
    const genomicData = this.getGenomeSizeData(lifeForm, planetName, this.getElementsForLifeForm(lifeForm, planetName));

    const centerCol1 = 11;
    const centerCol2 = 12;

    const totalBases = genomicData.totalBases;
    const binaryString = totalBases.toString(2);

    const helixHash = this.hashString(lifeForm + planetName + "helix");
    const helixRng = this.createSeededRandom(helixHash);

    const baseTurnsPerHeight = 10.5;
    const baseAmplitude = 0.5;

    const turnVariation = (helixRng.random() - 0.5) * 2.0;
    const amplitudeVariation = (helixRng.random() - 0.5) * 0.3;
    const phaseShift = helixRng.random() * Math.PI;

    const planetTurnsPerHeight = baseTurnsPerHeight + turnVariation;
    const planetAmplitude = baseAmplitude + amplitudeVariation;

    for (let i = 0; i < height; i++) {
      const row = startRow + i;
      if (row >= this.HEIGHT) break;

      const leftBitIndex = i * 2;
      if (leftBitIndex < binaryString.length) {
        const leftBit = parseInt(binaryString[leftBitIndex]);
        if (leftBit === 1) {
          this.setPixel(bitmap, colorMap, centerCol1, row, 1, this.COLORS.WHITE);
        }
      }

      const rightBitIndex = i * 2 + 1;
      if (rightBitIndex < binaryString.length) {
        const rightBit = parseInt(binaryString[rightBitIndex]);
        if (rightBit === 1) {
          this.setPixel(bitmap, colorMap, centerCol2, row, 1, this.COLORS.WHITE);
        }
      }

      const helixPhase = (i * Math.PI * 2) / planetTurnsPerHeight + phaseShift;

      const leftHelixRange = 9 - 0;
      const leftHelixPosition = 0 + Math.round(leftHelixRange / 2 + (leftHelixRange / 2) * planetAmplitude * Math.cos(helixPhase));
      this.setPixel(bitmap, colorMap, Math.max(0, Math.min(9, leftHelixPosition)), row, 1, this.COLORS.BLUE);

      const rightHelixRange = 22 - 14;
      const rightHelixPosition = 14 + Math.round(rightHelixRange / 2 + (rightHelixRange / 2) * planetAmplitude * Math.cos(helixPhase + Math.PI));
      this.setPixel(bitmap, colorMap, Math.max(14, Math.min(22, rightHelixPosition)), row, 1, this.COLORS.BLUE);

      if (lifeForm === "Intelligent Life") {
        const secondaryPhase = helixPhase + Math.PI;
        const leftSecondary = Math.round(centerCol1 - 3 - planetAmplitude * Math.cos(secondaryPhase));
        const rightSecondary = Math.round(centerCol2 + 3 + planetAmplitude * Math.cos(secondaryPhase));

        const secondaryFreq = Math.max(3, Math.floor(planetTurnsPerHeight / 2));
        if (leftSecondary >= 5 && leftSecondary <= 9 && i % secondaryFreq === 0) {
          this.setPixel(bitmap, colorMap, leftSecondary, row, 1, this.COLORS.BLUE);
        }
        if (rightSecondary >= 14 && rightSecondary <= 18 && i % (secondaryFreq + 1) === 0) {
          this.setPixel(bitmap, colorMap, rightSecondary, row, 1, this.COLORS.BLUE);
        }
      } else if (lifeForm === "Vegetation") {
        const rnaFreq = Math.max(4, Math.floor(planetTurnsPerHeight));
        if (i % rnaFreq === Math.floor(rnaFreq / 2)) {
          const rnaCol = leftHelixPosition - Math.round(planetAmplitude);
          if (rnaCol >= 0 && rnaCol <= 9) {
            this.setPixel(bitmap, colorMap, rnaCol, row, 1, this.COLORS.BLUE);
          }
        }
      }
    }
  }

  // Estructura cristalina para vida basada en silicio
  private static drawSiliconBasedStructure(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, lifeForm: string, planetName: string): void {
    const hash = this.hashString(lifeForm + planetName + "crystalline");
    const rng = this.createSeededRandom(hash);

    const structureTypes = [
      { units: 500000, name: "Cuarzo simple" },
      { units: 1200000, name: "Feldespato complejo" },
      { units: 800000, name: "Olivino" },
      { units: 2000000, name: "Zeolita porosa" },
      { units: 1500000, name: "Granate denso" },
      { units: 900000, name: "Piroxeno cadena" },
      { units: 1800000, name: "Matriz silicática" },
    ];

    const structureIndex = Math.floor(rng.random() * structureTypes.length);
    const selectedStructure = structureTypes[structureIndex];
    const crystallineUnits = selectedStructure.units;
    const binaryString = crystallineUnits.toString(2);

    const patternType = Math.floor(rng.random() * 3);

    const centerCol1 = 11;
    const centerCol2 = 12;

    for (let i = 0; i < height; i++) {
      const row = startRow + i;
      if (row >= this.HEIGHT) break;

      const leftBitIndex = i * 2;
      if (leftBitIndex < binaryString.length) {
        const leftBit = parseInt(binaryString[leftBitIndex]);
        if (leftBit === 1) {
          this.setPixel(bitmap, colorMap, centerCol1, row, 1, this.COLORS.WHITE);
        }
      }

      const rightBitIndex = i * 2 + 1;
      if (rightBitIndex < binaryString.length) {
        const rightBit = parseInt(binaryString[rightBitIndex]);
        if (rightBit === 1) {
          this.setPixel(bitmap, colorMap, centerCol2, row, 1, this.COLORS.WHITE);
        }
      }

      let crystalPhase: number;

      switch (patternType) {
        case 0:
          crystalPhase = (i * Math.PI * 2) / 6;
          break;
        case 1:
          crystalPhase = (i * Math.PI * 2) / 4;
          break;
        default:
          crystalPhase = (i * Math.PI * 2) / 8 + rng.random() * 0.5;
      }

      const leftCrystalRange = 9 - 0;
      const leftCrystalPosition = 0 + Math.round(leftCrystalRange / 2 + (leftCrystalRange / 2) * Math.sin(crystalPhase));
      this.setPixel(bitmap, colorMap, Math.max(0, Math.min(9, leftCrystalPosition)), row, 1, this.COLORS.BLUE);

      const rightCrystalRange = 22 - 14;
      const rightCrystalPosition = 14 + Math.round(rightCrystalRange / 2 + (rightCrystalRange / 2) * Math.sin(crystalPhase + Math.PI));
      this.setPixel(bitmap, colorMap, Math.max(14, Math.min(22, rightCrystalPosition)), row, 1, this.COLORS.BLUE);
    }
  }

  // Estructura de datos digitales para vida robótica
  private static drawDigitalDataStructure(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, lifeForm: string, planetName?: string): void {
    const hash = this.hashString(lifeForm + (planetName || "Earth") + "datastructure");
    const rng = this.createSeededRandom(hash);

    const codeComplexityVariations = [2147483647, Math.floor(2147483647 * 0.5), Math.floor(2147483647 * 0.25), 2147483647 * 2, Math.floor(2147483647 * 0.75)];

    const complexityIndex = Math.floor(rng.random() * codeComplexityVariations.length);
    const codeLines = codeComplexityVariations[complexityIndex];
    const binaryString = Math.abs(codeLines).toString(2);

    const busPatterns = [
      { type: "synchronized", frequency: 4, phase: 0 },
      { type: "asynchronous", frequency: 6, phase: Math.PI / 3 },
      { type: "pipelined", frequency: 8, phase: Math.PI / 2 },
      { type: "burst", frequency: 3, phase: 0 },
      { type: "differential", frequency: 5, phase: Math.PI / 4 },
    ];

    const patternIndex = Math.floor(rng.random() * busPatterns.length);
    const busPattern = busPatterns[patternIndex];

    const centerCol1 = 11;
    const centerCol2 = 12;

    for (let i = 0; i < height; i++) {
      const row = startRow + i;
      if (row >= this.HEIGHT) break;

      const leftBitIndex = i * 2;
      if (leftBitIndex < binaryString.length) {
        const leftBit = parseInt(binaryString[leftBitIndex]);
        const codeQuality = 0.9 + (rng.random() - 0.5) * 0.15;
        if (leftBit === 1 && rng.random() < codeQuality) {
          this.setPixel(bitmap, colorMap, centerCol1, row, 1, this.COLORS.WHITE);
        }
      }

      const rightBitIndex = i * 2 + 1;
      if (rightBitIndex < binaryString.length) {
        const rightBit = parseInt(binaryString[rightBitIndex]);
        const codeQuality = 0.9 + (rng.random() - 0.5) * 0.15;
        if (rightBit === 1 && rng.random() < codeQuality) {
          this.setPixel(bitmap, colorMap, centerCol2, row, 1, this.COLORS.WHITE);
        }
      }

      let digitalPhase: number;

      switch (busPattern.type) {
        case "synchronized":
          digitalPhase = (i * Math.PI * 2) / busPattern.frequency + busPattern.phase;
          break;
        case "asynchronous":
          digitalPhase = (i * Math.PI * 2) / busPattern.frequency + busPattern.phase + rng.random() * 0.5;
          break;
        case "pipelined":
          digitalPhase = (i * Math.PI * 2) / busPattern.frequency + busPattern.phase + ((i % 3) * Math.PI) / 6;
          break;
        case "burst":
          digitalPhase = i % 4 < 2 ? (i * Math.PI * 2) / busPattern.frequency + busPattern.phase : (i * Math.PI * 2) / (busPattern.frequency * 2) + busPattern.phase;
          break;
        case "differential":
          digitalPhase = (i * Math.PI * 2) / busPattern.frequency + busPattern.phase + Math.sin(i * 0.3) * 0.2;
          break;
        default:
          digitalPhase = (i * Math.PI * 2) / 4;
      }

      const leftBusRange = 9 - 0;
      let leftBusPosition: number;

      if (busPattern.type === "synchronized" || busPattern.type === "pipelined") {
        leftBusPosition = 0 + Math.round(leftBusRange / 2 + (leftBusRange / 2) * Math.sin(digitalPhase));
      } else if (busPattern.type === "asynchronous") {
        leftBusPosition = 0 + Math.round(leftBusRange / 2 + (leftBusRange / 3) * Math.sin(digitalPhase));
      } else {
        leftBusPosition = 0 + Math.round(leftBusRange / 2 + (leftBusRange / 2) * Math.sin(digitalPhase) * Math.cos(digitalPhase * 0.7));
      }

      const finalLeftBusPosition = Math.max(0, Math.min(9, leftBusPosition));
      this.setPixel(bitmap, colorMap, finalLeftBusPosition, row, 1, this.COLORS.BLUE);

      const rightBusRange = 22 - 14;
      let rightBusPosition: number;

      if (busPattern.type === "synchronized") {
        rightBusPosition = 14 + Math.round(rightBusRange / 2 + (rightBusRange / 2) * Math.sin(digitalPhase + Math.PI));
      } else if (busPattern.type === "asynchronous") {
        rightBusPosition = 14 + Math.round(rightBusRange / 2 + (rightBusRange / 3) * Math.cos(digitalPhase + Math.PI / 2));
      } else if (busPattern.type === "pipelined") {
        rightBusPosition = 14 + Math.round(rightBusRange / 2 + (rightBusRange / 2) * Math.sin(digitalPhase + Math.PI + ((i % 4) * Math.PI) / 8));
      } else {
        rightBusPosition = 14 + Math.round(rightBusRange / 2 + (rightBusRange / 2) * Math.cos(digitalPhase) * Math.sin(digitalPhase * 0.5));
      }

      const finalRightBusPosition = Math.max(14, Math.min(22, rightBusPosition));
      this.setPixel(bitmap, colorMap, finalRightBusPosition, row, 1, this.COLORS.BLUE);

      if (busPattern.type === "burst" && i % 4 === 0 && rng.random() > 0.5) {
        const burstLeftCol = Math.max(0, Math.min(9, finalLeftBusPosition + Math.floor(rng.random() * 3) - 1));
        const burstRightCol = Math.max(14, Math.min(22, finalRightBusPosition + Math.floor(rng.random() * 3) - 1));
        this.setPixel(bitmap, colorMap, burstLeftCol, row, 1, this.COLORS.BLUE);
        this.setPixel(bitmap, colorMap, burstRightCol, row, 1, this.COLORS.BLUE);
      }

      if (busPattern.type === "differential" && rng.random() > 0.7) {
        const diffCol = Math.floor(rng.random() * 23);
        if (diffCol < 10 || diffCol > 13) {
          this.setPixel(bitmap, colorMap, diffCol, row, 1, this.COLORS.BLUE);
        }
      }
    }
  }

  // Estructura de campo cuántico para vida gaseosa
  private static drawQuantumFieldStructure(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, lifeForm: string, planetName?: string): void {
    const hash = this.hashString(lifeForm + (planetName || "Earth") + "quantumfield");
    const rng = this.createSeededRandom(hash);

    const baseQuantumStates = 1048576;
    const quantumVariations = [baseQuantumStates, baseQuantumStates * 2, Math.floor(baseQuantumStates * 0.5), baseQuantumStates * 4, Math.floor(baseQuantumStates * 1.5)];

    const quantumConfigIndex = Math.floor(rng.random() * quantumVariations.length);
    const quantumStates = quantumVariations[quantumConfigIndex];
    const binaryString = quantumStates.toString(2);

    const oscillationPatterns = [
      { type: "sine", frequency: 12, phase: 0 },
      { type: "cosine", frequency: 10, phase: Math.PI / 4 },
      { type: "mixed", frequency: 8, phase: Math.PI / 2 },
      { type: "chaos", frequency: 15, phase: 0 },
      { type: "entangled", frequency: 6, phase: Math.PI / 3 },
    ];

    const patternIndex = Math.floor(rng.random() * oscillationPatterns.length);
    const pattern = oscillationPatterns[patternIndex];

    const centerCol1 = 11;
    const centerCol2 = 12;

    for (let i = 0; i < height; i++) {
      const row = startRow + i;
      if (row >= this.HEIGHT) break;

      const leftBitIndex = i * 2;
      if (leftBitIndex < binaryString.length) {
        const leftBit = parseInt(binaryString[leftBitIndex]);
        const showProbability = 0.8 + (rng.random() - 0.5) * 0.3;
        if (leftBit === 1 && rng.random() < showProbability) {
          this.setPixel(bitmap, colorMap, centerCol1, row, 1, this.COLORS.WHITE);
        }
      }

      const rightBitIndex = i * 2 + 1;
      if (rightBitIndex < binaryString.length) {
        const rightBit = parseInt(binaryString[rightBitIndex]);
        const showProbability = 0.8 + (rng.random() - 0.5) * 0.3;
        if (rightBit === 1 && rng.random() < showProbability) {
          this.setPixel(bitmap, colorMap, centerCol2, row, 1, this.COLORS.WHITE);
        }
      }

      let quantumPhase: number;

      switch (pattern.type) {
        case "sine":
          quantumPhase = (i * Math.PI * 2) / pattern.frequency + pattern.phase;
          break;
        case "cosine":
          quantumPhase = (i * Math.PI * 2) / pattern.frequency + pattern.phase;
          break;
        case "mixed":
          quantumPhase = (i * Math.PI * 2) / pattern.frequency + pattern.phase + Math.sin(i * 0.5) * 0.5;
          break;
        case "chaos":
          quantumPhase = (i * Math.PI * 2) / pattern.frequency + rng.random() * Math.PI * 0.3;
          break;
        case "entangled":
          quantumPhase = (i * Math.PI * 2) / pattern.frequency + pattern.phase + Math.cos(i * 0.3) * 0.7;
          break;
        default:
          quantumPhase = (i * Math.PI * 2) / 12;
      }

      const leftFieldRange = 9 - 0;
      let leftFieldPosition: number;

      if (pattern.type === "sine" || pattern.type === "mixed") {
        leftFieldPosition = 0 + Math.round(leftFieldRange / 2 + (leftFieldRange / 2) * Math.sin(quantumPhase));
      } else if (pattern.type === "cosine") {
        leftFieldPosition = 0 + Math.round(leftFieldRange / 2 + (leftFieldRange / 2) * Math.cos(quantumPhase));
      } else {
        leftFieldPosition = 0 + Math.round(leftFieldRange / 2 + (leftFieldRange / 2) * Math.sin(quantumPhase) * Math.cos(quantumPhase * 0.7));
      }

      const finalLeftPosition = Math.max(0, Math.min(9, leftFieldPosition));
      this.setPixel(bitmap, colorMap, finalLeftPosition, row, 1, this.COLORS.BLUE);

      const rightFieldRange = 22 - 14;
      let rightFieldPosition: number;

      if (pattern.type === "sine" || pattern.type === "mixed") {
        rightFieldPosition = 14 + Math.round(rightFieldRange / 2 + (rightFieldRange / 2) * Math.cos(quantumPhase + Math.PI));
      } else if (pattern.type === "cosine") {
        rightFieldPosition = 14 + Math.round(rightFieldRange / 2 + (rightFieldRange / 2) * Math.sin(quantumPhase + Math.PI));
      } else {
        rightFieldPosition = 14 + Math.round(rightFieldRange / 2 + (rightFieldRange / 2) * Math.cos(quantumPhase) * Math.sin(quantumPhase * 0.5));
      }

      const finalRightPosition = Math.max(14, Math.min(22, rightFieldPosition));
      this.setPixel(bitmap, colorMap, finalRightPosition, row, 1, this.COLORS.BLUE);

      if (pattern.type === "entangled" && rng.random() > 0.7) {
        const entangledLeftCol = Math.max(0, Math.min(9, finalLeftPosition + Math.floor(rng.random() * 3) - 1));
        const entangledRightCol = Math.max(14, Math.min(22, finalRightPosition + Math.floor(rng.random() * 3) - 1));
        this.setPixel(bitmap, colorMap, entangledLeftCol, row, 1, this.COLORS.BLUE);
        this.setPixel(bitmap, colorMap, entangledRightCol, row, 1, this.COLORS.BLUE);
      }

      if (pattern.type === "chaos" && rng.random() > 0.8) {
        const chaosCol = Math.floor(rng.random() * 23);
        if (chaosCol < 10 || chaosCol > 13) {
          this.setPixel(bitmap, colorMap, chaosCol, row, 1, this.COLORS.BLUE);
        }
      }
    }
  }

  // Estructura de campo energético para vida basada en energía
  private static drawEnergyFieldStructure(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, lifeForm: string, planetName: string): void {
    const energyTypes = this.getElementsForLifeForm(lifeForm, planetName);
    const energyStates = this.getNitrogenBases(lifeForm, planetName);

    const hash = this.hashString(lifeForm + planetName + "energy");
    const rng = this.createSeededRandom(hash);

    const energyConstants = [299792458, 6626070e-34, 16605390e-27, 96485340, 13806490e-23, 20181970, 25812807, 48359775, 11263490e-6];

    const energyConstantIndex = Math.floor(rng.random() * energyConstants.length);
    const energyUnits = energyConstants[energyConstantIndex];
    const binaryString = energyUnits.toString(2);

    const centerCol1 = 11;
    const centerCol2 = 12;

    const fieldPattern = this.getEnergyPattern(energyStates[0]);
    const fieldFrequency = this.getEnergyFrequency(energyStates[1] || energyStates[0]);

    for (let i = 0; i < height; i++) {
      const row = startRow + i;
      if (row >= this.HEIGHT) break;

      const leftBitIndex = i * 2;
      if (leftBitIndex < binaryString.length) {
        const leftBit = parseInt(binaryString[leftBitIndex]);
        if (leftBit === 1) {
          this.setPixel(bitmap, colorMap, centerCol1, row, 1, this.COLORS.WHITE);
        }
      }

      const rightBitIndex = i * 2 + 1;
      if (rightBitIndex < binaryString.length) {
        const rightBit = parseInt(binaryString[rightBitIndex]);
        if (rightBit === 1) {
          this.setPixel(bitmap, colorMap, centerCol2, row, 1, this.COLORS.WHITE);
        }
      }

      const energyPhase = (i * Math.PI * 2) / fieldFrequency;

      const leftFieldIntensity = this.calculateFieldIntensity(fieldPattern, energyPhase, i, "left");
      if (leftFieldIntensity > 0) {
        const leftRange = 9;
        const leftPosition = Math.round(leftRange * leftFieldIntensity);
        this.setPixel(bitmap, colorMap, Math.max(0, Math.min(9, leftPosition)), row, 1, this.COLORS.BLUE);
      }

      const rightFieldIntensity = this.calculateFieldIntensity(fieldPattern, energyPhase + Math.PI, i, "right");
      if (rightFieldIntensity > 0) {
        const rightRange = 8;
        const rightPosition = 14 + Math.round(rightRange * rightFieldIntensity);
        this.setPixel(bitmap, colorMap, Math.max(14, Math.min(22, rightPosition)), row, 1, this.COLORS.BLUE);
      }
    }
  }

  // Calcula la intensidad del campo energético basado en el patrón y la fase
  private static calculateFieldIntensity(pattern: string, phase: number, step: number, side: string): number {
    const baseIntensity = (Math.sin(phase) + 1) / 2;

    switch (pattern) {
      case "wave":
        return baseIntensity;
      case "pulse":
        return step % 3 === 0 ? 1 : 0;
      case "spiral":
        return Math.abs(Math.sin(phase + step * 0.3));
      case "zigzag":
        return side === "left" ? baseIntensity : 1 - baseIntensity;
      case "interference":
        return Math.abs(Math.sin(phase) + Math.sin(phase * 1.618)) / 2;
      case "quantum":
        return Math.random() > 0.4 ? Math.random() : 0;
      case "vortex":
        return Math.abs(Math.cos(phase + step * 0.1)) * baseIntensity;
      case "standing":
        return step % 4 < 2 ? baseIntensity : 0;
      case "dimensional":
        return Math.pow(baseIntensity, 2);
      case "infinite":
        return 0.7;
      case "phase":
        return Math.abs(Math.sin(phase + Math.PI / 4));
      case "resonance":
        return baseIntensity > 0.8 ? 1 : baseIntensity * 0.3;
      default:
        return baseIntensity * 0.6;
    }
  }

  // Estructura geométrica cósmica para vida divina
  private static drawCosmicGeometryStructure(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    const centerCol1 = 11;
    const centerCol2 = 12;

    for (let i = 0; i < height; i++) {
      const row = startRow + i;
      if (row >= this.HEIGHT) break;

      if (i % 2 === 0) {
        this.setPixel(bitmap, colorMap, centerCol2, row, 1, this.COLORS.WHITE);
      } else {
        this.setPixel(bitmap, colorMap, centerCol1, row, 1, this.COLORS.WHITE);
      }

      const goldenPhase = (i * Math.PI * 2) / 13;
      const fibonacciPhase = (i * 1.618033988749) % (2 * Math.PI);

      const leftGeometryRange = 9 - 0;
      const leftGeometryPosition = 0 + Math.round(leftGeometryRange / 2 + (leftGeometryRange / 2) * Math.sin(goldenPhase));
      this.setPixel(bitmap, colorMap, Math.max(0, Math.min(9, leftGeometryPosition)), row, 1, this.COLORS.BLUE);

      const rightGeometryRange = 22 - 14;
      const rightGeometryPosition = 14 + Math.round(rightGeometryRange / 2 + (rightGeometryRange / 2) * Math.cos(fibonacciPhase));
      this.setPixel(bitmap, colorMap, Math.max(14, Math.min(22, rightGeometryPosition)), row, 1, this.COLORS.BLUE);
    }
  }

  // Dibuja una fórmula química en formato vertical
  private static drawChemicalFormula(bitmap: number[], colorMap: number[], col: number, startRow: number, formula: number[]): void {
    for (let i = 0; i < formula.length; i++) {
      const count = formula[i];
      const row = startRow + i;

      if (count > 0) {
        this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
        if (count >= 3) {
          this.setPixel(bitmap, colorMap, col + 1, row, 1, this.COLORS.GREEN);
        }
        if (count >= 5) {
          this.setPixel(bitmap, colorMap, col - 1, row, 1, this.COLORS.GREEN);
        }
      }
    }
  }

  // Dibuja un bloque compacto de píxeles
  private static drawCompactBlock(bitmap: number[], colorMap: number[], startCol: number, startRow: number, width: number, height: number): void {
    for (let row = startRow; row < startRow + height; row++) {
      for (let col = startCol; col < startCol + width; col++) {
        this.setPixel(bitmap, colorMap, col, row, 1, this.COLORS.GREEN);
      }
    }
  }

  // Obtiene las bases complementarias para el ADN de doble cadena
  private static getComplementaryBases(bases: string[]): string[] {
    const complements: { [key: string]: string } = {
      A: "T",
      T: "A",
      G: "C",
      C: "G",
      U: "A",
      X: "X",
    };

    return bases.map((base) => complements[base] || "X");
  }

  // Obtiene el elemento equivalente al fosfato según la forma de vida
  private static getPhosphateEquivalent(elements: number[]): number {
    return elements.includes(15) ? 15 : elements[elements.length - 1];
  }

  private static drawCarbonBasedElements(bitmap: number[], colorMap: number[], elements: number[]): void {
    const centerCol = 11;
    const startRow = 5;

    this.drawElementBinary(bitmap, colorMap, elements[0], 9, startRow + 4, 4);
    this.drawElementBinary(bitmap, colorMap, elements[1], 11, startRow + 3, 5);
    this.setPixel(bitmap, colorMap, 10, startRow + 1, 1, this.COLORS.PURPLE);
    this.setPixel(bitmap, colorMap, 12, startRow + 1, 1, this.COLORS.PURPLE);
    this.drawElementBinary(bitmap, colorMap, elements[2], 13, startRow + 4, 4);
    this.drawElementBinary(bitmap, colorMap, elements[3], 7, startRow + 3, 4);
    this.drawElementBinary(bitmap, colorMap, elements[4], 15, startRow + 2, 5);
  }

  private static drawSiliconBasedElements(bitmap: number[], colorMap: number[], elements: number[]): void {
    const centerCol = 11;
    const startRow = 5;

    for (let i = 0; i < elements.length && i < 5; i++) {
      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, Math.PI / 4];
      const radius = 3 + (i % 2);
      const col = Math.floor(centerCol + radius * Math.cos(angles[i]));
      const rowOffset = Math.floor(radius * Math.sin(angles[i]) * 0.5);

      this.drawElementBinary(bitmap, colorMap, elements[i], col, startRow + 2 + rowOffset, 4);

      if (i > 0) {
        this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.PURPLE);
      }
    }
  }

  private static drawRoboticElements(bitmap: number[], colorMap: number[], elements: number[]): void {
    const startRow = 5;

    const robotHash = elements.join("");
    const robotRng = this.createSeededRandom(this.hashString(robotHash + "robotic"));

    const layoutPatterns = [
      [5, 8, 11, 14, 17],
      [4, 7, 11, 15, 18],
      [6, 9, 11, 13, 16],
      [3, 8, 11, 14, 19],
      [5, 9, 11, 13, 17],
    ];

    const patternIndex = Math.floor(robotRng.random() * layoutPatterns.length);
    const positions = layoutPatterns[patternIndex];

    for (let i = 0; i < elements.length && i < 5; i++) {
      const baseCol = positions[i];
      const colVariation = Math.floor(robotRng.random() * 3) - 1;
      const col = Math.max(3, Math.min(19, baseCol + colVariation));

      const heightVariation = Math.floor(robotRng.random() * 2);
      const componentHeight = 3 + heightVariation;

      this.drawElementBinary(bitmap, colorMap, elements[i], col, startRow + 2, componentHeight);

      if (i > 0) {
        const prevCol = Math.max(3, Math.min(19, positions[i - 1] + (Math.floor(robotRng.random() * 3) - 1)));
        const connectionType = Math.floor(robotRng.random() * 3);

        switch (connectionType) {
          case 0:
            for (let c = Math.min(prevCol, col) + 1; c < Math.max(prevCol, col); c++) {
              this.setPixel(bitmap, colorMap, c, startRow + 4, 1, this.COLORS.PURPLE);
            }
            break;
          case 1:
            const midPoint = Math.floor((prevCol + col) / 2);
            for (let c = prevCol + 1; c <= midPoint; c++) {
              if (c % 2 === 0) this.setPixel(bitmap, colorMap, c, startRow + 4, 1, this.COLORS.PURPLE);
            }
            for (let c = midPoint + 1; c < col; c++) {
              if (c % 2 === 1) this.setPixel(bitmap, colorMap, c, startRow + 4, 1, this.COLORS.PURPLE);
            }
            break;
          case 2:
            this.setPixel(bitmap, colorMap, Math.floor((prevCol + col) / 2), startRow + 3, 1, this.COLORS.PURPLE);
            this.setPixel(bitmap, colorMap, Math.floor((prevCol + col) / 2), startRow + 4, 1, this.COLORS.PURPLE);
            this.setPixel(bitmap, colorMap, Math.floor((prevCol + col) / 2), startRow + 5, 1, this.COLORS.PURPLE);
            break;
        }
      }

      this.setPixel(bitmap, colorMap, col, startRow + 4, 1, this.COLORS.PURPLE);
      this.setPixel(bitmap, colorMap, col, startRow + 1, 1, this.COLORS.PURPLE);

      if (elements[i] >= 29) {
        if (robotRng.random() > 0.5) {
          this.setPixel(bitmap, colorMap, col, startRow, 1, this.COLORS.PURPLE);
        }
        if (robotRng.random() > 0.5) {
          this.setPixel(bitmap, colorMap, col, startRow + 5, 1, this.COLORS.PURPLE);
        }
      }

      if (elements[i] === 14 || elements[i] === 32) {
        if (robotRng.random() > 0.6) {
          this.setPixel(bitmap, colorMap, col - 1, startRow + 2, 1, this.COLORS.PURPLE);
          this.setPixel(bitmap, colorMap, col + 1, startRow + 2, 1, this.COLORS.PURPLE);
        }
      }
    }
  }

  private static drawGaseousElements(bitmap: number[], colorMap: number[], elements: number[]): void {
    const centerCol = 11;
    const startRow = 5;

    const gasHash = elements.join("");
    const gasRng = this.createSeededRandom(this.hashString(gasHash + "gaseous"));

    for (let i = 0; i < elements.length && i < 5; i++) {
      const baseSpread = 2 + i;
      const spreadVariation = Math.floor(gasRng.random() * 3) - 1;
      const spread = Math.max(1, baseSpread + spreadVariation);

      const baseCol = centerCol + (i % 2 === 0 ? -spread : spread);
      const colVariation = Math.floor(gasRng.random() * 3) - 1;
      const col = Math.max(0, Math.min(22, baseCol + colVariation));

      const baseRowOffset = Math.floor(i / 2);
      const rowVariation = Math.floor(gasRng.random() * 2);
      const rowOffset = baseRowOffset + rowVariation;

      this.drawElementBinary(bitmap, colorMap, elements[i], col, startRow + rowOffset, 3);

      if (gasRng.random() > 0.3) {
        const particleCol = Math.max(0, Math.min(22, col + Math.floor(gasRng.random() * 3) - 1));
        const particleRow = Math.max(startRow, Math.min(this.HEIGHT - 1, startRow + rowOffset + Math.floor(gasRng.random() * 3) - 1));
        this.setPixel(bitmap, colorMap, particleCol, particleRow, 1, this.COLORS.PURPLE);
      }
    }
  }

  private static drawEnergyElements(bitmap: number[], colorMap: number[], elements: number[]): void {
    const centerCol = 11;
    const startRow = 5;

    for (let i = 0; i < elements.length && i < 5; i++) {
      const phase = (i * Math.PI) / 2;
      const amplitude = 3;

      for (let step = 0; step < 5; step++) {
        const col = centerCol + Math.floor(amplitude * Math.sin(phase + step * 0.5)) - 2 + i;
        const row = startRow + step;

        if (col >= 0 && col < 23) {
          const binary = elements[i].toString(2);
          if (step < binary.length) {
            const bitValue = parseInt(binary[binary.length - 1 - step]);
            this.setPixel(bitmap, colorMap, col, row, bitValue, this.COLORS.PURPLE);
          }
        }
      }
    }
  }

  private static drawDivineElements(bitmap: number[], colorMap: number[], elements: number[]): void {
    const centerCol = 11;
    const centerRow = 7;

    for (let i = 0; i < elements.length && i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5;
      const innerRadius = 2;
      const outerRadius = 4;

      const innerCol = Math.floor(centerCol + innerRadius * Math.cos(angle));
      const innerRow = Math.floor(centerRow + innerRadius * Math.sin(angle) * 0.5);

      const outerCol = Math.floor(centerCol + outerRadius * Math.cos(angle));
      const outerRow = Math.floor(centerRow + outerRadius * Math.sin(angle) * 0.5);

      this.drawElementBinary(bitmap, colorMap, elements[i], innerCol, innerRow, 2);
      this.drawElementBinary(bitmap, colorMap, elements[i], outerCol, outerRow, 2);

      this.drawLine(bitmap, colorMap, innerCol, innerRow, outerCol, outerRow, this.COLORS.PURPLE);
      this.drawLine(bitmap, colorMap, centerCol, centerRow, innerCol, innerRow, this.COLORS.PURPLE);
    }
  }

  private static drawElementBinary(bitmap: number[], colorMap: number[], value: number, col: number, startRow: number, maxBits: number): void {
    const binary = value.toString(2);

    for (let bit = 0; bit < Math.min(binary.length, maxBits); bit++) {
      const row = startRow - bit;
      const bitValue = parseInt(binary[binary.length - 1 - bit]);
      if (row >= 5 && row <= 9) {
        this.setPixel(bitmap, colorMap, col, row, bitValue, this.COLORS.PURPLE);
      }
    }
  }

  private static drawLine(bitmap: number[], colorMap: number[], x1: number, y1: number, x2: number, y2: number, color: number): void {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let x = x1;
    let y = y1;

    while (true) {
      if (x >= 0 && x < 23 && y >= 5 && y <= 9) {
        this.setPixel(bitmap, colorMap, x, y, 1, color);
      }

      if (x === x2 && y === y2) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  private static drawBinaryNumber(bitmap: number[], colorMap: number[], value: number, startCol: number, row: number, color: number): void {
    const binary = value.toString(2);
    const maxLength = Math.min(binary.length, 23 - startCol);

    for (let bit = 0; bit < maxLength; bit++) {
      const bitValue = parseInt(binary[bit]);
      this.setPixel(bitmap, colorMap, startCol + bit, row, bitValue, color);
    }
  }

  private static drawBlankLine(bitmap: number[], colorMap: number[], row: number): void {
    for (let col = 0; col < this.WIDTH; col++) {
      this.setPixel(bitmap, colorMap, col, row, 0);
    }
  }

  private static getLifeCategory(lifeForm: string): string {
    const categories: { [key: string]: string } = {
      Bacteria: "carbon-based",
      Vegetation: "carbon-based",
      "Animal Life": "carbon-based",
      "Intelligent Life": "carbon-based",
      "Vegetable Animals": "carbon-based",
      "Silicon-Based Life": "silicon-based",
      "Robotic Entities": "robotic",
      "Conscious Gas": "gaseous",
      "Non-Physical Entity": "energy",
      "Have I just found God?": "divine",
    };

    return categories[lifeForm] || "carbon-based";
  }

  private static getElementsForLifeForm(lifeForm: string, planetName?: string): number[] {
    const elementSets: { [key: string]: number[] } = {
      Bacteria: [1, 6, 7, 8, 15],
      Vegetation: [1, 6, 7, 8, 12],
      "Animal Life": [1, 6, 7, 8, 20],
      "Intelligent Life": [1, 6, 7, 8, 15],
      "Vegetable Animals": [1, 6, 7, 8, 26],

      "Silicon-Based Life": [1, 14, 8, 13, 16],
      "Robotic Entities": [14, 29, 79, 47, 6],
      "Conscious Gas": [1, 2, 10, 18, 36],
      "Non-Physical Entity": [1, 3, 11, 19, 37],
      "Have I just found God?": [1, 2, 3, 4, 5],
    };

    let baseElements = elementSets[lifeForm] || [1, 6, 7, 8, 15];

    if (!planetName || planetName === "Earth") {
      return baseElements;
    }

    const hash = this.hashString(lifeForm + planetName + "elements");
    const rng = this.createSeededRandom(hash);

    if (lifeForm === "Intelligent Life") {
      const coreElements = [1, 6, 7, 8];

      const possibleFifthElements = [15, 16, 12, 20, 26, 19, 11];

      const fifthElementIndex = Math.floor(rng.random() * possibleFifthElements.length);
      const fifthElement = possibleFifthElements[fifthElementIndex];

      const variedElements = [...coreElements, fifthElement];
      const elementNames = { 11: "Na", 12: "Mg", 15: "P", 16: "S", 19: "K", 20: "Ca", 26: "Fe" };

      return variedElements;
    }

    if (lifeForm === "Bacteria") {
      const coreElements = [1, 6, 7, 8];

      const possibleBacterialElements = [15, 16, 26, 25, 24, 28, 27, 42, 74];

      const fifthElementIndex = Math.floor(rng.random() * possibleBacterialElements.length);
      const fifthElement = possibleBacterialElements[fifthElementIndex];

      const variedElements = [...coreElements, fifthElement];
      const elementNames = { 15: "P", 16: "S", 24: "Cr", 25: "Mn", 26: "Fe", 27: "Co", 28: "Ni", 42: "Mo", 74: "W" };

      return variedElements;
    }

    if (lifeForm === "Vegetable Animals") {
      const coreElements = [1, 6, 7, 8];

      const possibleHybridElements = [26, 12, 20, 29, 25, 30, 42, 27, 28];

      const fifthElementIndex = Math.floor(rng.random() * possibleHybridElements.length);
      const fifthElement = possibleHybridElements[fifthElementIndex];

      const variedElements = [...coreElements, fifthElement];
      const elementNames = { 12: "Mg", 20: "Ca", 25: "Mn", 26: "Fe", 27: "Co", 28: "Ni", 29: "Cu", 30: "Zn", 42: "Mo" };

      return variedElements;
    }

    if (lifeForm === "Vegetation") {
      const coreElements = [1, 6, 7, 8];

      const possiblePlantElements = [12, 26, 29, 30, 25, 42, 16, 20];

      const fifthElementIndex = Math.floor(rng.random() * possiblePlantElements.length);
      const fifthElement = possiblePlantElements[fifthElementIndex];

      const variedElements = [...coreElements, fifthElement];
      const elementNames = { 12: "Mg", 16: "S", 20: "Ca", 25: "Mn", 26: "Fe", 29: "Cu", 30: "Zn", 42: "Mo" };

      return variedElements;
    }

    if (lifeForm === "Silicon-Based Life") {
      const coreElements = [14, 8];

      const possibleSiliconElements = [
        [1, 13, 16],
        [13, 26, 12],
        [20, 19, 11],
        [26, 24, 28],
        [12, 25, 30],
        [22, 23, 27],
        [40, 39, 38],
        [3, 4, 9],
        [5, 15, 17],
      ];

      const elementSetIndex = Math.floor(rng.random() * possibleSiliconElements.length);
      const additionalElements = possibleSiliconElements[elementSetIndex];

      const variedElements = [...coreElements, ...additionalElements];

      return variedElements;
    }

    if (lifeForm === "Non-Physical Entity") {
      const energyTypeCodes = [
        [1, 2, 7, 10],
        [3, 4, 8, 11],
        [5, 6, 9, 12],
        [13, 14, 15, 16],
        [17, 18, 19, 20],
        [21, 22, 23, 24],
        [25, 26, 27, 28],
        [29, 30, 31, 32],
        [33, 34, 35, 36],
      ];

      const energySetIndex = Math.floor(rng.random() * energyTypeCodes.length);
      const selectedEnergyTypes = energyTypeCodes[energySetIndex];

      return selectedEnergyTypes;
    }

    if (lifeForm === "Conscious Gas") {
      const coreElements = [1, 2];

      const possibleGaseousElements = [10, 18, 36, 54, 7, 8, 9, 17, 35];

      const selectedElements = [...coreElements];
      const shuffledElements = [...possibleGaseousElements];

      for (let i = shuffledElements.length - 1; i > 0; i--) {
        const j = Math.floor(rng.random() * (i + 1));
        [shuffledElements[i], shuffledElements[j]] = [shuffledElements[j], shuffledElements[i]];
      }

      selectedElements.push(...shuffledElements.slice(0, 3));

      const elementNames = {
        1: "H",
        2: "He",
        7: "N",
        8: "O",
        9: "F",
        10: "Ne",
        17: "Cl",
        18: "Ar",
        35: "Br",
        36: "Kr",
        54: "Xe",
      };
      const selectedNames = selectedElements.map((e) => elementNames[e] || e).join(", ");

      return selectedElements;
    }

    if (lifeForm === "Robotic Entities") {
      const coreElements = [14, 6];

      const possibleRoboticElements = [29, 79, 47, 13, 26, 28, 22, 31, 32, 33, 49, 50, 74];

      const selectedElements = [...coreElements];
      const shuffledElements = [...possibleRoboticElements];

      for (let i = shuffledElements.length - 1; i > 0; i--) {
        const j = Math.floor(rng.random() * (i + 1));
        [shuffledElements[i], shuffledElements[j]] = [shuffledElements[j], shuffledElements[i]];
      }

      selectedElements.push(...shuffledElements.slice(0, 3));

      const elementNames = {
        6: "C",
        13: "Al",
        14: "Si",
        22: "Ti",
        26: "Fe",
        28: "Ni",
        29: "Cu",
        31: "Ga",
        32: "Ge",
        33: "As",
        47: "Ag",
        49: "In",
        50: "Sn",
        74: "W",
        79: "Au",
      };
      const selectedNames = selectedElements.map((e) => elementNames[e] || e).join(", ");

      return selectedElements;
    }

    return baseElements;
  }

  private static getNitrogenBases(lifeForm: string, planetName?: string): string[] {
    const baseSets: { [key: string]: string[] } = {
      Bacteria: ["A", "T", "G", "C"],
      Vegetation: ["A", "T", "G", "C"],
      "Animal Life": ["A", "T", "G", "C"],
      "Intelligent Life": ["A", "T", "G", "C"],
      "Vegetable Animals": ["A", "T", "G", "C"],

      "Silicon-Based Life": ["Si", "Al", "O", "S"],
      "Robotic Entities": ["0", "1", "X", "Z"],
      "Conscious Gas": ["|0⟩", "|1⟩", "|+⟩", "|-⟩"],
      "Non-Physical Entity": ["α", "β", "γ", "δ"],
      "Have I just found God?": ["∞", "Ω", "Φ", "Ψ"],
    };

    let baseBases = baseSets[lifeForm] || ["A", "T", "G", "C"];

    if (!planetName || planetName === "Earth") {
      return baseBases;
    }

    if (lifeForm === "Silicon-Based Life") {
      const planetElements = this.getElementsForLifeForm(lifeForm, planetName);

      const elementSymbols: { [key: number]: string } = {
        1: "H",
        3: "Li",
        4: "Be",
        5: "B",
        8: "O",
        9: "F",
        11: "Na",
        12: "Mg",
        13: "Al",
        14: "Si",
        15: "P",
        16: "S",
        17: "Cl",
        19: "K",
        20: "Ca",
        22: "Ti",
        23: "V",
        24: "Cr",
        25: "Mn",
        26: "Fe",
        27: "Co",
        28: "Ni",
        29: "Cu",
        30: "Zn",
        38: "Sr",
        39: "Y",
        40: "Zr",
      };

      const silicateBases = planetElements.slice(0, 4).map((atomicNumber) => elementSymbols[atomicNumber] || atomicNumber.toString());

      while (silicateBases.length < 4) {
        silicateBases.push("Si");
      }

      return silicateBases;
    }

    if (lifeForm === "Non-Physical Entity") {
      const energyTypes = this.getElementsForLifeForm(lifeForm, planetName);

      const energyStateSymbols: { [key: number]: string } = {
        1: "α",
        2: "β",
        3: "γ",
        4: "δ",
        5: "ε",
        6: "ζ",
        7: "η",
        8: "θ",
        9: "ι",
        10: "κ",
        11: "λ",
        12: "μ",
        13: "ν",
        14: "ξ",
        15: "ο",
        16: "π",
        17: "ρ",
        18: "σ",
        19: "τ",
        20: "υ",
        21: "φ",
        22: "χ",
        23: "ψ",
        24: "ω",
        25: "∆",
        26: "∇",
        27: "∞",
        28: "Ω",
        29: "Φ",
        30: "Ψ",
        31: "≈",
        32: "∼",
        33: "※",
        34: "⟨⟩",
        35: "◊",
        36: "◎",
      };

      const energyStates = energyTypes.slice(0, 4).map((code) => energyStateSymbols[code] || `E${code}`);

      while (energyStates.length < 4) {
        energyStates.push("∅");
      }

      return energyStates;
    }

    if (lifeForm === "Intelligent Life") {
      const hash = this.hashString(lifeForm + planetName + "bases");
      const rng = this.createSeededRandom(hash);

      const standardBases = ["A", "T", "G", "C"];

      const alternativeBases = ["U", "I", "X", "D", "P", "M"];

      if (rng.random() < 0.85) {
        return standardBases;
      } else {
        const numReplacements = Math.floor(rng.random() * 2) + 1;
        const modifiedBases = [...standardBases];

        for (let i = 0; i < numReplacements; i++) {
          const indexToReplace = Math.floor(rng.random() * 4);
          const alternativeIndex = Math.floor(rng.random() * alternativeBases.length);
          modifiedBases[indexToReplace] = alternativeBases[alternativeIndex];
        }

        return modifiedBases;
      }
    }

    return baseBases;
  }

  // Genera variaciones en la información genética basadas en los elementos disponibles
  private static getNucleotideVariation(lifeForm: string, elements: number[]): any {
    const elementMap = this.createElementMap(elements);

    const nucleotideData = this.generateElementBasedNucleotides(elementMap, lifeForm);

    return nucleotideData;
  }

  // Crea un mapa de elementos para una búsqueda rápida
  private static createElementMap(elements: number[]): { [key: string]: boolean } {
    const elementNames: { [key: number]: string } = {
      1: "H",
      6: "C",
      7: "N",
      8: "O",
      15: "P",
      16: "S",
      14: "Si",
      13: "Al",
      20: "Ca",
      26: "Fe",
      12: "Mg",
      32: "Ge",
      31: "Ga",
      49: "In",
      73: "Ta",
      11: "Na",
      2: "He",
      10: "Ne",
      18: "Ar",
      36: "Kr",
      54: "Xe",
      115: "Mc",
      118: "Og",
      119: "Uue",
      120: "Ubn",
      126: "Ubh",
    };

    const elementMap: { [key: string]: boolean } = {};

    for (const atomicNumber of elements) {
      const elementSymbol = elementNames[atomicNumber];
      if (elementSymbol) {
        elementMap[elementSymbol] = true;
      }
    }

    return elementMap;
  }

  // Genera estructuras de información genética basadas en elementos específicos
  private static generateElementBasedNucleotides(elementMap: { [key: string]: boolean }, lifeForm: string): any {
    if (elementMap["C"] && elementMap["N"] && elementMap["O"] && elementMap["H"]) {
      return this.generateCarbonBasedNucleotides(elementMap, lifeForm);
    } else if (elementMap["Si"] && elementMap["O"] && !elementMap["C"]) {
      return this.generateSiliconBasedNucleotides(elementMap);
    } else if (elementMap["Ga"] || elementMap["Ge"] || elementMap["In"] || elementMap["Ta"]) {
      return this.generateMetallicNucleotides(elementMap);
    } else if (elementMap["He"] || elementMap["Ne"] || elementMap["Ar"] || elementMap["Kr"] || elementMap["Xe"]) {
      return this.generateGaseousInformation(elementMap);
    } else if (elementMap["Mc"] || elementMap["Og"] || elementMap["Uue"]) {
      return this.generateExoticInformation(elementMap);
    }

    return this.generateGenericInformation(elementMap);
  }

  // Nucleótidos de carbono clásicos con variaciones según elementos específicos
  private static generateCarbonBasedNucleotides(elementMap: { [key: string]: boolean }, lifeForm: string): any {
    const hasPhosphorus = elementMap["P"];
    const hasSulfur = elementMap["S"];
    const hasMagnesium = elementMap["Mg"];

    const bases = [
      { name: "A", formula: this.adaptFormulaToElements([5, 5, 5, 0, 1], elementMap) },
      { name: elementMap["O"] && lifeForm !== "Vegetation" ? "T" : "U", formula: this.adaptFormulaToElements(elementMap["O"] ? [6, 5, 2, 2, 1] : [4, 4, 2, 2, 1], elementMap) },
      { name: "G", formula: this.adaptFormulaToElements([5, 5, 5, elementMap["O"] ? 1 : 0, 1], elementMap) },
      { name: "C", formula: this.adaptFormulaToElements([5, 4, 3, elementMap["O"] ? 1 : 0, 1], elementMap) },
    ];

    return {
      bases: bases,
      usesRNA: !elementMap["O"] || lifeForm === "Vegetation",
      gcContent: hasSulfur ? "high" : "moderate",
      backbone: hasPhosphorus ? "phosphate" : hasSulfur ? "sulfate" : "alternative",
      sugarType: elementMap["O"] ? "deoxyribose" : "modified_ribose",
    };
  }

  // Adapta la fórmula molecular para incluir solo los elementos disponibles
  private static generateSiliconBasedNucleotides(elementMap: { [key: string]: boolean }): any {
    const siliconBases = [
      { name: "SiO4", formula: [0, 0, 0, 4, 0, 1] },
      { name: "Si2O3", formula: [0, 0, 0, 3, 0, 2] },
      { name: "SiO3Al", formula: [0, 0, 0, 3, 0, 1, 1] },
      { name: "SiO2", formula: [0, 0, 0, 2, 0, 1] },
    ];

    return {
      bases: siliconBases,
      usesRNA: false,
      gcContent: "crystalline",
      backbone: "silicate_chain",
      sugarType: "silicon_cage",
    };
  }

  // Nucleótidos basados en metales para entidades robóticas
  private static generateMetallicNucleotides(elementMap: { [key: string]: boolean }): any {
    const metallicBases = [
      { name: "00", formula: [0, 0, 0, 0, 0, 0, 0, 1] },
      { name: "01", formula: [0, 0, 0, 0, 0, 0, 1, 0] },
      { name: "10", formula: [0, 0, 0, 0, 0, 0, 0, 0, 1] },
      { name: "11", formula: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1] },
    ];

    return {
      bases: metallicBases,
      usesRNA: false,
      gcContent: "digital",
      backbone: "metallic_conductor",
      sugarType: "none",
    };
  }

  // Estados cuánticos para gases conscientes
  private static generateGaseousInformation(elementMap: { [key: string]: boolean }): any {
    const gasStates = [
      { name: "|0⟩", formula: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1] },
      { name: "|1⟩", formula: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] },
      { name: "|+⟩", formula: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] },
      { name: "|-⟩", formula: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] },
    ];

    return {
      bases: gasStates,
      usesRNA: false,
      gcContent: "quantum",
      backbone: "field_interaction",
      sugarType: "none",
    };
  }

  // Estados exóticos para entidades no físicas
  private static generateExoticInformation(elementMap: { [key: string]: boolean }): any {
    const exoticStates = [
      { name: "α", formula: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] },
      { name: "β", formula: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] },
      { name: "γ", formula: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] },
      { name: "δ", formula: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] },
    ];

    return {
      bases: exoticStates,
      usesRNA: false,
      gcContent: "cosmic",
      backbone: "spacetime_fabric",
      sugarType: "none",
    };
  }

  // Información genética genérica cuando faltan elementos clave
  private static generateGenericInformation(elementMap: { [key: string]: boolean }): any {
    const availableElements = Object.keys(elementMap);
    const genericBases = [];

    for (let i = 0; i < Math.min(4, availableElements.length); i++) {
      const formula = new Array(15).fill(0);
      formula[i] = 1;

      genericBases.push({
        name: availableElements[i],
        formula: formula,
      });
    }

    return {
      bases: genericBases,
      usesRNA: false,
      gcContent: "variable",
      backbone: "elemental",
      sugarType: "adapted",
    };
  }

  // Adapta la fórmula molecular para incluir solo los elementos disponibles
  private static adaptFormulaToElements(baseFormula: number[], elementMap: { [key: string]: boolean }): number[] {
    const elementOrder = ["H", "C", "N", "O", "P"];
    const adaptedFormula = [...baseFormula];

    if (adaptedFormula[4] > 0) {
      const substitutions: { [key: string]: number } = {
        S: 1,
        Mg: 0.5,
        Ca: 0.5,
        Fe: 1,
        K: 1,
        Na: 1,
      };

      for (const [element, multiplier] of Object.entries(substitutions)) {
        if (elementMap[element] && !elementMap["P"]) {
          const originalP = adaptedFormula[4];
          adaptedFormula[4] = Math.max(1, Math.floor(originalP * multiplier));
          break;
        }
      }
    }

    if (elementMap["S"] && adaptedFormula[4] > 0) {
      adaptedFormula[3] = Math.max(1, adaptedFormula[3] - 1);
      adaptedFormula[4] = adaptedFormula[4] + 1;
    }

    if (elementMap["Mg"] && adaptedFormula[3] > 0) {
      adaptedFormula[3] = adaptedFormula[3] + 1;
    }

    return adaptedFormula;
  }

  // Genera datos de tamaño del genoma con variaciones basadas en el nombre del planeta y la forma de vida
  private static getGenomeSizeData(lifeForm: string, planetName: string, elements: number[]): any {
    const genomicData: { [key: string]: any } = {
      Bacteria: {
        totalBases: 4641652,
        genes: 4288,
        gcContent: "high",
        chromosomes: 1,
        complexity: "simple",
        modification: "methylation",
        plasmids: true,
        repetitiveElements: 3.2,
      },

      Vegetation: {
        totalBases: 125000000,
        genes: 27416,
        gcContent: "moderate",
        chromosomes: 5,
        complexity: "moderate",
        modification: "chloroplast",
        mitochondrial: 367808,
        repetitiveElements: 14,
      },

      "Animal Life": {
        totalBases: 3200000000,
        genes: 19969,
        gcContent: "variable",
        chromosomes: 23,
        complexity: "very_high",
        modification: "epigenetic",
        introns: 95,
        repetitiveElements: 45,
      },

      "Intelligent Life": {
        totalBases: 3200000000,
        genes: 19969,
        gcContent: "optimized",
        chromosomes: 23,
        complexity: "enhanced",
        modification: "advanced_epigenetic",
        enhancedRegulation: true,
        repetitiveElements: 35,
      },

      "Vegetable Animals": {
        totalBases: 600000000,
        genes: 23000,
        gcContent: "mixed",
        chromosomes: 16,
        complexity: "chimeric",
        modification: "dual_system",
        chloroplasts: true,
        repetitiveElements: 25,
      },
    };

    const speculativeData: { [key: string]: any } = {
      "Silicon-Based Life": {
        totalBases: 2000000,
        genes: 8000,
        gcContent: "crystalline",
        chromosomes: 3,
        complexity: "moderate",
        modification: "doping",
        repetitiveElements: 60,
      },

      "Robotic Entities": {
        totalBases: 2147483647,
        genes: 65536,
        gcContent: "binary",
        chromosomes: 8,
        complexity: "digital",
        modification: "compilation",
        repetitiveElements: 20,
      },

      "Conscious Gas": {
        totalBases: 1048576,
        genes: 256,
        gcContent: "quantum",
        chromosomes: 4,
        complexity: "quantum",
        modification: "entanglement",
        repetitiveElements: 0,
      },

      "Non-Physical Entity": {
        totalBases: 299792458,
        genes: 2000,
        gcContent: "energy",
        chromosomes: 7,
        complexity: "energetic",
        modification: "resonance",
        repetitiveElements: 10,
      },

      "Have I just found God?": {
        totalBases: 3141592653,
        genes: 137,
        gcContent: "infinite",
        chromosomes: 11,
        complexity: "cosmic",
        modification: "omnipresence",
        repetitiveElements: 0,
      },
    };

    let baseData: any;
    if (genomicData[lifeForm]) {
      baseData = genomicData[lifeForm];
    } else if (speculativeData[lifeForm]) {
      baseData = speculativeData[lifeForm];
    } else {
      const complexity = elements.reduce((sum, atomic) => sum + atomic, 0);
      if (complexity < 100) baseData = genomicData["Bacteria"];
      else if (complexity < 200) baseData = genomicData["Vegetation"];
      else baseData = genomicData["Animal Life"];
    }

    const hash = this.hashString(lifeForm + planetName);
    const rng = this.createSeededRandom(hash);

    const variedData = { ...baseData };

    const variationRange = lifeForm === "Intelligent Life" ? 0.1 : 0.2;
    const baseVariation = (rng.random() - 0.5) * 2 * variationRange;
    variedData.totalBases = Math.floor(baseData.totalBases * (1 + baseVariation));

    const geneVariation = (rng.random() - 0.5) * 2 * 0.15;
    variedData.genes = Math.floor(baseData.genes * (1 + geneVariation));

    if (typeof baseData.repetitiveElements === "number") {
      const repVariation = (rng.random() - 0.5) * 2 * 0.05;
      variedData.repetitiveElements = Math.max(0, baseData.repetitiveElements * (1 + repVariation));
    }

    return variedData;
  }

  private static getGenomeSize(elements: number[]): number {
    const complexity = elements.reduce((sum, atomic) => sum + atomic, 0);

    if (complexity < 50) return 4000000;
    if (complexity < 100) return 150000000;
    if (complexity < 150) return 1000000000;
    if (complexity < 200) return 3000000000;
    if (complexity < 250) return 3200000000;
    if (complexity < 500) return 2147483647;
    return 4294967295;
  }

  public static renderToCanvas(message: AreciboMessage, canvas: HTMLCanvasElement, scale: number = 10): void {
    canvas.width = message.width * scale;
    canvas.height = message.height * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const colors = ["#000000", "#FFFFFF", "#9966CC", "#00FF00", "#0066FF", "#FF6600", "#FF0000", "#FFFF00", "#B19CD9"];

    for (let y = 0; y < message.height; y++) {
      for (let x = 0; x < message.width; x++) {
        const index = y * message.width + x;
        if (message.bitmap[index] === 1) {
          const colorIndex = message.colorMap[index] || 1;
          ctx.fillStyle = colors[colorIndex] || "#FFFFFF";
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  }

  public static exportToPNG(message: AreciboMessage, scale: number = 10): string {
    const canvas = document.createElement("canvas");
    this.renderToCanvas(message, canvas, scale);
    return canvas.toDataURL("image/png");
  }

  // Forma de Vida
  private static drawLifeFormSection(bitmap: number[], colorMap: number[], lifeForm: string, planetName: string, startRow: number, height: number): void {
    this.drawLifeFormHeight(bitmap, colorMap, lifeForm, planetName, startRow, height);

    this.drawLifeFormRepresentation(bitmap, colorMap, lifeForm, planetName, startRow, height);

    this.drawLifeFormPopulation(bitmap, colorMap, lifeForm, planetName, startRow, height);
  }

  // Dibuja la estatura de la forma de vida como una barra con valor binario
  private static drawLifeFormHeight(bitmap: number[], colorMap: number[], lifeForm: string, planetName: string, startRow: number, height: number): void {
    if (lifeForm === "Have I just found God?") {
      return;
    }

    const heightValue = this.generateLifeFormHeight(lifeForm, planetName);

    const barCol = 3;

    const binaryHeight = heightValue.toString(2);
    const barMiddleRow = startRow + Math.floor(height / 2);
    const binaryStartCol = barCol - 2;

    const barHeight = height;

    for (let i = 0; i < barHeight; i++) {
      const currentRow = startRow + i;
      if (currentRow === barMiddleRow - 1 || currentRow === barMiddleRow || currentRow === barMiddleRow + 1) {
        continue;
      }
      this.setPixel(bitmap, colorMap, barCol, currentRow, 1, this.COLORS.BLUE);
    }

    this.setPixel(bitmap, colorMap, binaryStartCol, barMiddleRow, 1, this.COLORS.WHITE);

    for (let i = 0; i < binaryHeight.length && i < 4; i++) {
      const bit = parseInt(binaryHeight[i]);

      const bitCol = binaryStartCol + 1 + i;

      if (bitCol === barCol) {
        continue;
      }

      if (bit === 1) {
        this.setPixel(bitmap, colorMap, bitCol, barMiddleRow, 1, this.COLORS.WHITE);
      }
    }
  }

  // Dibuja una representación simbólica de la forma de vida basada en su categoría
  private static drawLifeFormRepresentation(bitmap: number[], colorMap: number[], lifeForm: string, planetName: string, startRow: number, height: number): void {
    const category = this.getLifeCategory(lifeForm);

    const centerCols = [8, 9, 10, 11, 12, 13, 14];
    const centerCol = centerCols[Math.floor(centerCols.length / 2)];

    if (lifeForm === "Intelligent Life") {
      const hash = this.hashString(lifeForm + planetName);
      const rng = this.createSeededRandom(hash);

      const headType = Math.floor(rng.random() * 5);
      const torsoType = Math.floor(rng.random() * 5);
      const legsType = Math.floor(rng.random() * 5);

      this.drawModularLifeForm(bitmap, colorMap, centerCol, startRow, height, headType, torsoType, legsType);
    } else {
      const hash = this.hashString(lifeForm + planetName);
      const rng = this.createSeededRandom(hash);

      switch (category) {
        case "carbon-based":
          this.drawCarbonBasedForm(bitmap, colorMap, centerCols, centerCol, startRow, height, lifeForm, rng);
          break;
        case "silicon-based":
          this.drawSiliconBasedForm(bitmap, colorMap, centerCols, centerCol, startRow, height, rng);
          break;
        case "robotic":
          this.drawRoboticForm(bitmap, colorMap, centerCols, centerCol, startRow, height, rng);
          break;
        case "gaseous":
          this.drawGaseousForm(bitmap, colorMap, centerCols, centerCol, startRow, height, rng);
          break;
        case "energy":
          this.drawEnergyForm(bitmap, colorMap, centerCols, centerCol, startRow, height, rng, lifeForm, planetName);
          break;
        case "divine":
          this.drawDivineForm(bitmap, colorMap, centerCols, centerCol, startRow, height, rng);
          break;
        default:
          this.drawHumanoidForm(bitmap, colorMap, centerCols, centerCol, startRow, height);
      }
    }
  }

  // Dibuja la población de la forma de vida como una cuadrícula binaria
  private static drawLifeFormPopulation(bitmap: number[], colorMap: number[], lifeForm: string, planetName: string, startRow: number, height: number): void {
    const population = this.generatePlanetaryPopulation(lifeForm, planetName);

    const binaryPopulation = population.toString(2);

    const startCol = 16;
    const maxCols = 6;
    const maxRows = height;

    let bitIndex = binaryPopulation.length - 1;

    for (let row = 0; row < maxRows && bitIndex >= 0; row++) {
      for (let col = 0; col < maxCols && bitIndex >= 0; col++) {
        const bit = parseInt(binaryPopulation[bitIndex]);

        if (bit === 1) {
          this.setPixel(bitmap, colorMap, startCol + col, startRow + row, 1, this.COLORS.WHITE);
        }

        bitIndex--;
      }
    }
  }

  // Genera la altura de la forma de vida con variaciones basadas en el nombre del planeta
  private static generateLifeFormHeight(lifeForm: string, planetName: string): number {
    if (lifeForm === "Intelligent Life") {
      const hash = this.hashString(lifeForm + planetName);
      const rng = this.createSeededRandom(hash);

      const heightVariations = [12, 14, 18, 22, 26];

      const index = Math.floor(rng.random() * heightVariations.length);
      return heightVariations[index];
    }

    const category = this.getLifeCategory(lifeForm);
    const hash = this.hashString(lifeForm + planetName);
    const rng = this.createSeededRandom(hash);

    switch (category) {
      case "carbon-based":
        return Math.floor(10 + rng.random() * 15);
      case "silicon-based":
        return Math.floor(25 + rng.random() * 25);
      case "robotic":
        return Math.floor(5 + rng.random() * 95);
      case "gaseous":
        return Math.floor(100 + rng.random() * 100);
      case "energy":
        return Math.floor(1 + rng.random() * 9);
      case "divine":
        return Math.floor(200 + rng.random() * 55);
      default:
        return Math.floor(12 + rng.random() * 6);
    }
  }

  // Genera la población planetaria con variaciones basadas en el nombre del planeta
  private static generatePlanetaryPopulation(lifeForm: string, planetName: string): number {
    const category = this.getLifeCategory(lifeForm);
    const combinedHash = this.hashString(lifeForm + planetName);
    const rng = this.createSeededRandom(combinedHash);

    switch (category) {
      case "carbon-based":
        return Math.floor(1000000000 + rng.random() * 9000000000);
      case "silicon-based":
        return Math.floor(100000000 + rng.random() * 1900000000);
      case "robotic":
        return Math.floor(1000000 + rng.random() * 4999000000);
      case "gaseous":
        return Math.floor(10000000 + rng.random() * 490000000);
      case "energy":
        return Math.floor(100000 + rng.random() * 49900000);
      case "divine":
        return 1;
      default:
        return Math.floor(3000000000 + rng.random() * 3000000000);
    }
  }

  // Genera un hash numérico a partir de una cadena para uso en seeded random
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Crea una función de número aleatorio con semilla basada en un valor numérico
  private static createSeededRandom(seed: number): { random: () => number } {
    return {
      random: () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      },
    };
  }

  // Dibuja una forma de vida modular compuesta por cabeza, torso y piernas
  private static drawModularLifeForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, headType: number, torsoType: number, legsType: number): void {
    this.drawHead(bitmap, colorMap, centerCol, startRow, headType);
    this.drawTorso(bitmap, colorMap, centerCol, startRow + 3, torsoType);
    this.drawLegs(bitmap, colorMap, centerCol, startRow + 6, legsType);
  }

  // Dibuja diferentes tipos de cabezas (5 variaciones)
  private static drawHead(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, headType: number): void {
    switch (headType) {
      case 0:
        this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
        break;

      case 1:
        this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
        break;

      case 2:
        for (let r = 0; r < 3; r++) {
          for (let c = -1; c <= 1; c++) {
            this.setPixel(bitmap, colorMap, centerCol + c, startRow + r, 1, this.COLORS.RED);
          }
        }
        break;

      case 3:
        this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
        break;

      case 4:
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
        break;
    }
  }

  // Dibuja diferentes tipos de torsos (5 variaciones)
  private static drawTorso(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, torsoType: number): void {
    switch (torsoType) {
      case 0:
        for (let r = 0; r < 3; r++) {
          this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
        }
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
        break;

      case 1:
        for (let r = 0; r < 3; r++) {
          for (let c = -1; c <= 1; c++) {
            this.setPixel(bitmap, colorMap, centerCol + c, startRow + r, 1, this.COLORS.RED);
          }
        }
        this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.RED);
        break;

      case 2:
        for (let r = 0; r < 3; r++) {
          this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
        }
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
        break;

      case 3:
        this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.RED);
        break;

      case 4:
        this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.RED);
        break;
    }
  }

  // Dibuja diferentes tipos de piernas (5 variaciones)
  private static drawLegs(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, legsType: number): void {
    switch (legsType) {
      case 0:
        for (let r = 0; r < 3; r++) {
          this.setPixel(bitmap, colorMap, centerCol - 1, startRow + r, 1, this.COLORS.RED);
          this.setPixel(bitmap, colorMap, centerCol + 1, startRow + r, 1, this.COLORS.RED);
        }
        break;

      case 1:
        for (let r = 0; r < 2; r++) {
          this.setPixel(bitmap, colorMap, centerCol - 1, startRow + r, 1, this.COLORS.RED);
          this.setPixel(bitmap, colorMap, centerCol + 1, startRow + r, 1, this.COLORS.RED);
        }
        this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 2, 1, this.COLORS.RED);
        break;

      case 2:
        this.setPixel(bitmap, colorMap, centerCol - 2, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 2, startRow, 1, this.COLORS.RED);

        this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.RED);

        this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 2, 1, this.COLORS.RED);
        break;

      case 3:
        this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
        break;

      case 4:
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
        break;
    }
  }

  // Dibuja una forma humanoide simple como representación predeterminada
  private static drawHumanoidForm(bitmap: number[], colorMap: number[], cols: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);

    for (let r = 2; r <= 5; r++) {
      this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 3, 1, this.COLORS.RED);

    for (let r = 6; r < height; r++) {
      this.setPixel(bitmap, colorMap, centerCol - 1, startRow + r, 1, this.COLORS.RED);
      this.setPixel(bitmap, colorMap, centerCol + 1, startRow + r, 1, this.COLORS.RED);
    }
  }

  // Forma basada en carbono, bacterias, vegetación, animales, vida inteligente
  private static drawCarbonBasedForm(bitmap: number[], colorMap: number[], cols: number[], centerCol: number, startRow: number, height: number, lifeForm: string, rng: { random: () => number }): void {
    switch (lifeForm) {
      case "Bacteria":
        this.drawBacteriaForm(bitmap, colorMap, centerCol, startRow, height, rng);
        break;
      case "Vegetation":
        this.drawVegetationForm(bitmap, colorMap, centerCol, startRow, height, rng);
        break;
      case "Animal Life":
        this.drawAnimalForm(bitmap, colorMap, centerCol, startRow, height, rng);
        break;
      case "Vegetable Animals":
        this.drawVegetableAnimalForm(bitmap, colorMap, centerCol, startRow, height, rng);
        break;
      case "Intelligent Life":
        this.drawHumanoidForm(bitmap, colorMap, cols, centerCol, startRow, height);
        break;
      default:
        this.drawHumanoidForm(bitmap, colorMap, cols, centerCol, startRow, height);
    }
  }

  // Dibuja diferentes estructuras cristalinas y minerales basados en silicio
  private static drawSiliconBasedForm(bitmap: number[], colorMap: number[], cols: number[], centerCol: number, startRow: number, height: number, rng: { random: () => number }): void {
    const crystalType = Math.floor(rng.random() * 7);

    switch (crystalType) {
      case 0:
        this.drawQuartzCrystal(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 1:
        this.drawFeldsparStructure(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 2:
        this.drawOlivineNetwork(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 3:
        this.drawZeoliteFramework(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 4:
        this.drawGarnetStructure(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 5:
        this.drawPyroxeneChain(bitmap, colorMap, centerCol, startRow, height);
        break;
      default:
        this.drawSilicateMatrix(bitmap, colorMap, centerCol, startRow, height);
    }
  }

  // Dibuja una estructura de cristal de cuarzo
  private static drawQuartzCrystal(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 2, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 3, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 5, 1, this.COLORS.RED);
  }

  // Dibuja una estructura de feldespato
  private static drawFeldsparStructure(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 4, 1, this.COLORS.RED);
  }

  // Dibuja una estructura de red de olivino
  private static drawOlivineNetwork(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 3, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 4, 1, this.COLORS.RED);
  }

  // Dibuja una estructura de marco de zeolita
  private static drawZeoliteFramework(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 2, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 4, 1, this.COLORS.RED);
  }

  // Estructura de granate con simetría cúbica
  private static drawGarnetStructure(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);

    for (let c = -2; c <= 2; c++) {
      this.setPixel(bitmap, colorMap, centerCol + c, startRow + 1, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 2, 1, this.COLORS.RED);

    for (let c = -1; c <= 1; c++) {
      this.setPixel(bitmap, colorMap, centerCol + c, startRow + 3, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol, startRow + 4, 1, this.COLORS.RED);
  }

  // Estructura lineal repetitiva piroxeno cadena de tetraedros
  private static drawPyroxeneChain(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    for (let r = 0; r < Math.min(6, height); r++) {
      this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
      if (r % 2 === 0) {
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + r, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + r, 1, this.COLORS.RED);
      }
    }
  }

  // Estructura amorfa con patrones repetitivos matriz de silicatos
  private static drawSilicateMatrix(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);

    for (let c = -2; c <= 2; c++) {
      this.setPixel(bitmap, colorMap, centerCol + c, startRow + 2, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 5, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 5, 1, this.COLORS.RED);
  }

  // Selecciona aleatoriamente tipos de cabeza, torso y piernas para una forma robótica
  private static drawRoboticForm(bitmap: number[], colorMap: number[], cols: number[], centerCol: number, startRow: number, height: number, rng: { random: () => number }): void {
    const headType = Math.floor(rng.random() * 3);
    const torsoType = Math.floor(rng.random() * 3);
    const legsType = Math.floor(rng.random() * 3);

    this.drawModularRoboticForm(bitmap, colorMap, centerCol, startRow, height, headType, torsoType, legsType);
  }

  // Dibuja una forma robótica modular combinando cabeza, torso y piernas
  private static drawModularRoboticForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, headType: number, torsoType: number, legsType: number): void {
    switch (headType) {
      case 0:
        for (let c = -1; c <= 1; c++) {
          this.setPixel(bitmap, colorMap, centerCol + c, startRow, 1, this.COLORS.RED);
          this.setPixel(bitmap, colorMap, centerCol + c, startRow + 1, 1, this.COLORS.RED);
        }
        this.setPixel(bitmap, colorMap, centerCol, startRow - 1, 1, this.COLORS.RED);
        break;

      case 1:
        this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 2, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 2, startRow, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
        break;

      case 2:
        this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
        for (let c = -1; c <= 1; c++) {
          this.setPixel(bitmap, colorMap, centerCol + c, startRow + 1, 1, this.COLORS.RED);
        }
        this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 2, 1, this.COLORS.RED);
        break;
    }

    switch (torsoType) {
      case 0:
        for (let r = 3; r <= 5; r++) {
          this.setPixel(bitmap, colorMap, centerCol - 1, startRow + r, 1, this.COLORS.RED);
          this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
          this.setPixel(bitmap, colorMap, centerCol + 1, startRow + r, 1, this.COLORS.RED);
        }
        this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 4, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 4, 1, this.COLORS.RED);
        break;

      case 1:
        for (let r = 3; r <= 5; r++) {
          this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
        }
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 3, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 5, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 5, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 3, startRow + 4, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 3, startRow + 4, 1, this.COLORS.RED);
        break;

      case 2:
        this.setPixel(bitmap, colorMap, centerCol, startRow + 4, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 3, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 4, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 4, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 5, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 5, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 3, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 3, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 5, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 5, 1, this.COLORS.RED);
        break;
    }

    switch (legsType) {
      case 0:
        for (let r = 6; r < Math.min(height, 9); r++) {
          this.setPixel(bitmap, colorMap, centerCol - 1, startRow + r, 1, this.COLORS.RED);
          this.setPixel(bitmap, colorMap, centerCol + 1, startRow + r, 1, this.COLORS.RED);
        }
        break;

      case 1:
        for (let r = 6; r < Math.min(height, 9); r++) {
          this.setPixel(bitmap, colorMap, centerCol - 1, startRow + r, 1, this.COLORS.RED);
          this.setPixel(bitmap, colorMap, centerCol + 1, startRow + r, 1, this.COLORS.RED);
          if ((r - 6) % 2 === 0) {
            this.setPixel(bitmap, colorMap, centerCol - 2, startRow + r, 1, this.COLORS.RED);
            this.setPixel(bitmap, colorMap, centerCol + 2, startRow + r, 1, this.COLORS.RED);
          }
        }
        break;

      case 2:
        for (let r = 6; r < Math.min(height, 9); r++) {
          for (let c = -2; c <= 2; c++) {
            this.setPixel(bitmap, colorMap, centerCol + c, startRow + r, 1, this.COLORS.RED);
          }
          if ((r - 6) % 2 === 1) {
            this.setPixel(bitmap, colorMap, centerCol, startRow + r, 0, this.COLORS.BLACK);
          }
        }
        break;
    }
  }

  // Selecciona aleatoriamente un tipo de forma gaseosa para dibujar
  private static drawGaseousForm(bitmap: number[], colorMap: number[], cols: number[], centerCol: number, startRow: number, height: number, rng: { random: () => number }): void {
    const gasType = Math.floor(rng.random() * 8);

    switch (gasType) {
      case 0:
        this.drawGlobularGas(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 1:
        this.drawStreamingGas(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 2:
        this.drawTurbulentGas(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 3:
        this.drawLayeredGas(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 4:
        this.drawSpiralGas(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 5:
        this.drawClusteredGas(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 6:
        this.drawFilamentaryGas(bitmap, colorMap, centerCol, startRow, height);
        break;
      default:
        this.drawDiffuseGas(bitmap, colorMap, centerCol, startRow, height);
    }
  }

  // Dibuja una forma de gas globular
  private static drawGlobularGas(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 4, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 5, 1, this.COLORS.RED);
  }

  // Dibuja una forma de gas en corriente
  private static drawStreamingGas(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 5, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.RED);
  }

  /**
   * Gas turbulento - remolinos y vórtices
   */
  private static drawTurbulentGas(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 5, 1, this.COLORS.RED);
  }

  /**
   * Gas estratificado - capas horizontales
   */
  private static drawLayeredGas(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);

    for (let col = centerCol - 2; col <= centerCol + 2; col++) {
      this.setPixel(bitmap, colorMap, col, startRow + 3, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 5, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 5, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 5, 1, this.COLORS.RED);
  }

  // Gas en espiral - estructura helicoidal tipo galaxia
  private static drawSpiralGas(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 5, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
  }

  // Dibuja una forma de gas agrupado con múltiples núcleos
  private static drawClusteredGas(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 5, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.RED);
  }

  // Estructuras alargadas y delgadas gas filamentario
  private static drawFilamentaryGas(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    for (let r = 1; r <= 5; r++) {
      this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 3, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 5, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 5, 1, this.COLORS.RED);
  }

  // Patrón ampliado para una apariencia más completa gas difuso
  private static drawDiffuseGas(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);

    for (let r = 2; r < 5; r++) {
      this.setPixel(bitmap, colorMap, centerCol - 2, startRow + r, 1, this.COLORS.RED);
      this.setPixel(bitmap, colorMap, centerCol - 1, startRow + r, 1, this.COLORS.RED);
      this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
      this.setPixel(bitmap, colorMap, centerCol + 1, startRow + r, 1, this.COLORS.RED);
      this.setPixel(bitmap, colorMap, centerCol + 2, startRow + r, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 5, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 5, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 5, 1, this.COLORS.RED);
  }

  // Selecciona y dibuja un patrón energético basado en los estados de energía
  private static drawEnergyForm(bitmap: number[], colorMap: number[], cols: number[], centerCol: number, startRow: number, height: number, rng: { random: () => number }, lifeForm: string, planetName: string): void {
    const energyStates = this.getNitrogenBases(lifeForm, planetName);
    const primaryState = energyStates[0];
    const manifestationType = this.getEnergyPattern(primaryState);

    switch (manifestationType) {
      case "wave":
        this.drawWaveManifesta(bitmap, colorMap, centerCol, startRow, height);
        break;
      case "spiral":
        this.drawSpiralField(bitmap, colorMap, centerCol, startRow, height);
        break;
      case "vortex":
        this.drawVortexManifesta(bitmap, colorMap, centerCol, startRow, height);
        break;
      case "pulse":
        this.drawPulseManifesta(bitmap, colorMap, centerCol, startRow, height);
        break;
      case "interference":
        this.drawInterferencePattern(bitmap, colorMap, centerCol, startRow, height);
        break;
      case "quantum":
        this.drawQuantumState(bitmap, colorMap, centerCol, startRow, height);
        break;
      case "dimensional":
        this.drawDimensionalRift(bitmap, colorMap, centerCol, startRow, height);
        break;
      case "infinite":
        this.drawInfiniteField(bitmap, colorMap, centerCol, startRow, height);
        break;
      default:
        this.drawEnergyZigzag(bitmap, colorMap, centerCol, startRow, height);
    }
  }

  // Dibuja un patrón de onda sinusoidal
  private static drawWaveManifesta(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    for (let r = 0; r < Math.min(8, height); r++) {
      const wave = Math.round(2 * Math.sin((r * Math.PI) / 3));
      this.setPixel(bitmap, colorMap, centerCol + wave, startRow + r, 1, this.COLORS.RED);
    }
  }

  // Patrón en espiral que simula un campo energético dinámico
  private static drawSpiralField(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    let angle = 0;
    for (let r = 0; r < Math.min(7, height); r++) {
      const radius = Math.floor(r / 2) + 1;
      const x = Math.round(radius * Math.cos(angle));
      const y = Math.round(radius * Math.sin(angle));
      this.setPixel(bitmap, colorMap, centerCol + x, startRow + r, 1, this.COLORS.RED);
      angle += Math.PI / 2.5;
    }
  }

  // Dibuja un patrón de vórtice energético
  private static drawVortexManifesta(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);
    for (let ring = 1; ring <= 2; ring++) {
      for (let offset = -ring; offset <= ring; offset++) {
        if (Math.abs(offset) === ring) {
          this.setPixel(bitmap, colorMap, centerCol + offset, startRow + 3 - ring, 1, this.COLORS.RED);
          this.setPixel(bitmap, colorMap, centerCol + offset, startRow + 3 + ring, 1, this.COLORS.RED);
        }
      }
    }
  }

  // Dibuja un patrón de pulsos energéticos
  private static drawPulseManifesta(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    for (let r = 0; r < Math.min(8, height); r += 2) {
      for (let c = -1; c <= 1; c++) {
        this.setPixel(bitmap, colorMap, centerCol + c, startRow + r, 1, this.COLORS.RED);
      }
    }
  }

  // Dibuja un patrón de interferencia de ondas
  private static drawInterferencePattern(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    for (let r = 0; r < Math.min(7, height); r++) {
      const wave1 = Math.sin((r * Math.PI) / 2);
      const wave2 = Math.sin((r * Math.PI) / 3 + Math.PI / 4);
      const interference = wave1 + wave2;

      if (interference > 0.5) {
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + r, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + r, 1, this.COLORS.RED);
      }
      if (Math.abs(interference) > 1) {
        this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
      }
    }
  }

  // Dibuja un patrón que representa un estado cuántico
  private static drawQuantumState(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 4, 1, this.COLORS.RED);
  }

  // Dibuja un patrón que representa una fisura dimensional
  private static drawDimensionalRift(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    for (let r = 1; r < 6; r++) {
      this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
    }
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 4, 1, this.COLORS.RED);
  }

  // Dibuja un patrón que representa un campo energético infinito
  private static drawInfiniteField(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    for (let c = -1; c <= 1; c++) {
      this.setPixel(bitmap, colorMap, centerCol + c, startRow + 2, 1, this.COLORS.RED);
      this.setPixel(bitmap, colorMap, centerCol + c, startRow + 3, 1, this.COLORS.RED);
    }
    this.setPixel(bitmap, colorMap, centerCol, startRow + 4, 1, this.COLORS.RED);
  }

  // Zigzag energético - patrón original como fallback
  private static drawEnergyZigzag(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 4, 1, this.COLORS.RED);
  }

  // Patrón fijo para representar una forma divina illuminati rojo
  private static drawDivineForm(bitmap: number[], colorMap: number[], cols: number[], centerCol: number, startRow: number, height: number, rng: { random: () => number }): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 2, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 3, 1, this.COLORS.RED);

    for (let c = -3; c <= 3; c++) {
      this.setPixel(bitmap, colorMap, centerCol + c, startRow + 4, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.WHITE);
  }

  // Selecciona aleatoriamente un tipo de forma animal para dibujar
  private static drawAnimalForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, rng: { random: () => number }): void {
    const animalType = Math.floor(rng.random() * 5);

    switch (animalType) {
      case 0:
        this.drawQuadrupedMammal(bitmap, colorMap, centerCol, startRow);
        break;
      case 1:
        this.drawBirdForm(bitmap, colorMap, centerCol, startRow);
        break;
      case 2:
        this.drawFishForm(bitmap, colorMap, centerCol, startRow);
        break;
      case 3:
        this.drawInsectForm(bitmap, colorMap, centerCol, startRow);
        break;
      case 4:
        this.drawReptileForm(bitmap, colorMap, centerCol, startRow);
        break;
    }
  }

  // Mamifero cuadrúpedo perro, gato, caballo
  private static drawQuadrupedMammal(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);

    for (let c = 0; c <= 2; c++) {
      this.setPixel(bitmap, colorMap, centerCol + c, startRow + 2, 1, this.COLORS.RED);
      this.setPixel(bitmap, colorMap, centerCol + c, startRow + 3, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 5, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 5, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol + 3, startRow + 2, 1, this.COLORS.RED);
  }

  // Forma de ave
  private static drawBirdForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 4, 1, this.COLORS.RED);
  }

  // Pez genérico
  private static drawFishForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.RED);

    for (let c = -1; c <= 2; c++) {
      this.setPixel(bitmap, colorMap, centerCol + c, startRow + 2, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol + 3, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 3, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 3, startRow + 3, 1, this.COLORS.RED);
  }

  // Forma de insecto mariposa, escarabajo, libélula
  private static drawInsectForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 3, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 4, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
  }

  // Forma de reptil - lagarto, serpiente
  private static drawReptileForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 5, 1, this.COLORS.RED);
  }

  // Forma de bacteria, múltiples tipos según morfología bacterial real
  private static drawBacteriaForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, rng: { random: () => number }): void {
    const bacteriaType = Math.floor(rng.random() * 7);

    switch (bacteriaType) {
      case 0:
        this.drawCoccusBacteria(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 1:
        this.drawBacillusBacteria(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 2:
        this.drawSpirillusBacteria(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 3:
        this.drawStreptococcusBacteria(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 4:
        this.drawStaphylococcusBacteria(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 5:
        this.drawVibroBacteria(bitmap, colorMap, centerCol, startRow, height);
        break;
      default:
        this.drawFilamentousBacteria(bitmap, colorMap, centerCol, startRow, height);
    }
  }

  // Coccus - bacteria esférica
  private static drawCoccusBacteria(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);
  }

  // Bacillus - bacteria en forma de barra
  private static drawBacillusBacteria(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    for (let r = 0; r < Math.min(5, height); r++) {
      this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
      if (r === 1 || r === 3) {
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + r, 1, this.COLORS.RED);
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + r, 1, this.COLORS.RED);
      }
    }
  }

  // Spirillum - bacteria espiral
  private static drawSpirillusBacteria(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 4, 1, this.COLORS.RED);
  }

  // Streptococcus - cadena de bacterias esféricas
  private static drawStreptococcusBacteria(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 4, 1, this.COLORS.RED);
  }

  // Staphylococcus - racimo de bacterias esféricas
  private static drawStaphylococcusBacteria(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);
  }

  // Vibrio - bacteria en forma de coma
  private static drawVibroBacteria(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 4, 1, this.COLORS.RED);
  }

  /**
   * Bacteria filamentosa - cadena larga
   */
  private static drawFilamentousBacteria(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    for (let r = 0; r < Math.min(6, height); r++) {
      this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
      if (r === 2) {
        this.setPixel(bitmap, colorMap, centerCol - 1, startRow + r, 1, this.COLORS.RED);
      }
      if (r === 4) {
        this.setPixel(bitmap, colorMap, centerCol + 1, startRow + r, 1, this.COLORS.RED);
      }
    }
  }

  // Forma de vegetación - estructura de planta con múltiples variaciones
  private static drawVegetationForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, rng: { random: () => number }): void {
    const hash = Math.floor(rng.random() * 6);

    switch (hash) {
      case 0:
        this.drawTreeForm(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 1:
        this.drawBushForm(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 2:
        this.drawPalmTreeForm(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 3:
        this.drawFlowerForm(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 4:
        this.drawConiferForm(bitmap, colorMap, centerCol, startRow, height);
        break;
      default:
        this.drawFernForm(bitmap, colorMap, centerCol, startRow, height);
    }
  }

  // Árbol con forma de conífera
  private static drawTreeForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.RED);

    for (let r = 2; r < height - 1; r++) {
      this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + height - 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + height - 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + height - 1, 1, this.COLORS.RED);
  }

  // Arbusto bajo y frondoso
  private static drawBushForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    const midHeight = Math.floor(height / 2);

    for (let r = 0; r < midHeight; r++) {
      const width = Math.max(1, 3 - Math.abs(r - 1));
      for (let c = -width; c <= width; c++) {
        if (Math.abs(c) <= width) {
          this.setPixel(bitmap, colorMap, centerCol + c, startRow + r, 1, this.COLORS.RED);
        }
      }
    }

    for (let r = midHeight; r < height - 1; r++) {
      this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + height - 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + height - 1, 1, this.COLORS.RED);
  }

  // Palmera con hojas largas
  private static drawPalmTreeForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 3, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 3, startRow, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.RED);

    for (let r = 2; r < height - 1; r++) {
      const offset = r % 2 === 0 ? 0 : r % 4 === 2 ? 1 : -1;
      this.setPixel(bitmap, colorMap, centerCol + offset, startRow + r, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + height - 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + height - 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + height - 1, 1, this.COLORS.RED);
  }

  // Flor con pétalos
  private static drawFlowerForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow - 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);

    for (let r = 2; r < height - 1; r++) {
      this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol, startRow + height - 1, 1, this.COLORS.RED);
  }

  // Conífera con forma triangular
  private static drawConiferForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    const midHeight = Math.floor(height * 0.8);

    for (let r = 0; r < midHeight; r++) {
      const width = Math.min(2, Math.floor(r / 2));
      for (let c = -width; c <= width; c++) {
        this.setPixel(bitmap, colorMap, centerCol + c, startRow + r, 1, this.COLORS.RED);
      }
    }

    for (let r = midHeight; r < height - 1; r++) {
      this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol, startRow + height - 1, 1, this.COLORS.RED);
  }

  // Helecho con frondas
  private static drawFernForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);

    for (let r = 3; r < height - 1; r++) {
      this.setPixel(bitmap, colorMap, centerCol, startRow + r, 1, this.COLORS.RED);
    }

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + height - 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + height - 1, 1, this.COLORS.RED);
  }

  // Forma de animal-vegetal - múltiples tipos de organismos híbridos
  private static drawVegetableAnimalForm(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, rng: { random: () => number }): void {
    const hybridType = Math.floor(rng.random() * 6);

    switch (hybridType) {
      case 0:
        this.drawTreentHybrid(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 1:
        this.drawCoralAnimalHybrid(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 2:
        this.drawWalkingPlantHybrid(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 3:
        this.drawPhotosynthethicAnimalHybrid(bitmap, colorMap, centerCol, startRow, height);
        break;
      case 4:
        this.drawMyceliaNeuralHybrid(bitmap, colorMap, centerCol, startRow, height);
        break;
      default:
        this.drawFlowerBeastHybrid(bitmap, colorMap, centerCol, startRow, height);
    }
  }

  // Treeent/Ent - árbol con capacidades animales
  private static drawTreentHybrid(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 2, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 4, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 5, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 5, 1, this.COLORS.RED);
  }

  // Coral animal - estructura coral con capacidades de movimiento
  private static drawCoralAnimalHybrid(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 2, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.RED);
  }

  // Planta caminante - planta con patas
  private static drawWalkingPlantHybrid(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 2, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 5, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 5, 1, this.COLORS.RED);
  }

  // Animal fotosintético - animal que realiza fotosíntesis
  private static drawPhotosynthethicAnimalHybrid(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 4, 1, this.COLORS.RED);
  }

  // Red micelial neural - organismo tipo hongo con inteligencia distribuida
  private static drawMyceliaNeuralHybrid(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 2, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 4, 1, this.COLORS.RED);
  }

  // Bestia-flor - criatura animal que se camufla como flor
  private static drawFlowerBeastHybrid(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow - 1, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.RED);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 4, 1, this.COLORS.RED);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 4, 1, this.COLORS.RED);
  }

  // Agrega características aleatorias para crear variaciones
  private static addRandomFeatures(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, rng: { random: () => number }): void {
    for (let i = 0; i < 3; i++) {
      const randomRow = startRow + Math.floor(rng.random() * height);
      const randomCol = centerCol + Math.floor(rng.random() * 6) - 3;

      if (rng.random() < 0.5) {
        this.setPixel(bitmap, colorMap, randomCol, randomRow, 1, this.COLORS.RED);
      }
    }
  }

  // Dibuja un sistema solar básico si no hay datos disponibles
  private static async drawSolarSystem(bitmap: number[], colorMap: number[], planetName: string, startRow: number): Promise<void> {
    try {
      const response = await fetch("/api/arecibo");
      const data = await response.json();

      if (!data.success || !data.system_data) {
        console.warn("No system data available from /api/arecibo");
        this.drawBasicSolarSystem(bitmap, colorMap, startRow);
        return;
      }

      const systemData = data.system_data;
      const totalPlanets = systemData.total_planets;
      const currentPlanetIndex = systemData.current_planet_index;
      const planets = systemData.planets || [];

      this.drawAreciboStyleSolarSystem(bitmap, colorMap, totalPlanets, currentPlanetIndex, startRow, planets);
    } catch (error) {
      console.warn("Error fetching data from /api/arecibo:", error);
      this.drawBasicSolarSystem(bitmap, colorMap, startRow);
    }
  }

  // Dibuja un sistema solar básico con una estrella y algunos planetas
  private static drawAreciboStyleSolarSystem(bitmap: number[], colorMap: number[], totalPlanets: number, currentPlanetIndex: number, startRow: number, planets: any[] = []): void {
    const starStartCol = 1;
    const starStartRow = startRow + 1;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        this.setPixel(bitmap, colorMap, starStartCol + col, starStartRow + row, 1, this.COLORS.YELLOW);
      }
    }

    let currentCol = starStartCol + 3 + 1;

    for (let i = 0; i < totalPlanets; i++) {
      const planetSize = this.getRealPlanetSize(i, currentPlanetIndex, planets);
      const planetStartRow = starStartRow;

      for (let row = 0; row < planetSize; row++) {
        this.setPixel(bitmap, colorMap, currentCol, planetStartRow + row, 1, this.COLORS.YELLOW);
      }

      currentCol += 1 + 1;

      if (currentCol >= this.WIDTH - 1) {
        break;
      }
    }
  }

  // Si el planeta es el actual, siempre es grande (3)
  private static getRealPlanetSize(planetIndex: number, currentPlanetIndex: number, planets: any[]): number {
    if (planetIndex === currentPlanetIndex) {
      return 3;
    }

    const planetData = planets.find((p) => p.index === planetIndex);
    if (planetData && planetData.size_category) {
      switch (planetData.size_category) {
        case "small":
          return 1;
        case "medium":
          return 2;
        case "large":
          return 3;
        default:
          return 1;
      }
    }

    if (planetIndex === 0) return 1;
    if (planetIndex === 1) return 2;
    return (planetIndex % 2) + 1;
  }

  // Dibuja diferentes tipos de antenas según el tipo de forma de vida
  private static drawTransmissionMethod(bitmap: number[], colorMap: number[], lifeForm: string, planetName: string, startRow: number, height: number): void {
    const centerCol = Math.floor(this.WIDTH / 2);

    const rng = this.createPlanetRNG(planetName);

    switch (lifeForm) {
      case "Intelligent Life":
        this.drawIntelligentLifeAntenna(bitmap, colorMap, centerCol, startRow - 1, height - 2, rng);
        break;
      case "Silicon-Based Life":
        this.drawSiliconBasedAntenna(bitmap, colorMap, centerCol, startRow - 1, height - 2, rng);
        break;
      case "Conscious Gas":
        this.drawTelepathicWaves(bitmap, colorMap, centerCol, startRow - 1, height - 2, rng);
        break;
      case "Non-Physical Entity":
        this.drawNonPhysicalTransmission(bitmap, colorMap, centerCol, startRow - 1, height - 2, rng);
        break;
      case "Robotic Entities":
        this.drawRoboticAntenna(bitmap, colorMap, centerCol, startRow - 1, height - 2, rng);
        break;
      case "Have I just found God?":
        this.drawDoubleSlitExperiment(bitmap, colorMap, centerCol, startRow - 1, height - 2);
        break;
      case "Animal Life":
      case "Vegetation":
      case "Bacteria":
      case "Vegetable Animals":
      default:
        break;
    }

    if (lifeForm !== "Animal Life" && lifeForm !== "Vegetation" && lifeForm !== "Bacteria" && lifeForm !== "Vegetable Animals") {
      this.drawAntennaSize(bitmap, colorMap, lifeForm, planetName, startRow + height - 2, rng);
    }
  }

  // Dibuja el tamaño de la antena en binario
  private static drawAntennaSize(bitmap: number[], colorMap: number[], lifeForm: string, planetName: string, startRow: number, rng: { random: () => number }): void {
    let antennaSize: number;

    switch (lifeForm) {
      case "Intelligent Life":
        antennaSize = Math.floor(50 + rng.random() * 450);
        break;
      case "Silicon-Based Life":
        antennaSize = Math.floor(100 + rng.random() * 900);
        break;
      case "Conscious Gas":
        antennaSize = Math.floor(10 + rng.random() * 190);
        break;
      case "Non-Physical Entity":
        antennaSize = Math.floor(1 + rng.random() * 1999);
        break;
      case "Robotic Entities":
        antennaSize = Math.floor(200 + rng.random() * 600);
        break;
      case "Have I just found God?":
        antennaSize = 137;
        break;
      default:
        antennaSize = 305;
        break;
    }

    if (antennaSize > 1023) antennaSize = 1023;
    const binary = antennaSize.toString(2).padStart(10, "0");

    for (let i = 0; i < 5; i++) {
      if (binary[i] === "1") {
        const col = 7 + i * 2;
        this.setPixel(bitmap, colorMap, col, startRow, 1, this.COLORS.WHITE);
      }
    }

    for (let i = 0; i < 4; i++) {
      this.setPixel(bitmap, colorMap, i, startRow + 1, 1, this.COLORS.WHITE);
    }

    for (let i = 5; i < 10; i++) {
      if (binary[i] === "1") {
        const col = 6 + (i - 5) * 2;
        this.setPixel(bitmap, colorMap, col, startRow + 1, 1, this.COLORS.WHITE);
      }
    }

    for (let i = 0; i < 4; i++) {
      this.setPixel(bitmap, colorMap, 19 + i, startRow + 1, 1, this.COLORS.WHITE);
    }
  }

  // Crea un generador de números aleatorios basado en el nombre del planeta
  private static createPlanetRNG(planetName: string): { random: () => number } {
    let seed = 0;
    for (let i = 0; i < planetName.length; i++) {
      seed += planetName.charCodeAt(i);
    }

    return {
      random: () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      },
    };
  }

  // Antena para vida inteligente - elige entre varios diseños terrestres
  private static drawIntelligentLifeAntenna(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, rng: { random: () => number }): void {
    const antennaType = Math.floor(rng.random() * 3);

    switch (antennaType) {
      case 0:
        this.drawParabolicAntenna(bitmap, colorMap, centerCol, startRow + 2);
        break;
      case 1:
        this.drawRadioTower(bitmap, colorMap, centerCol, startRow + 1);
        break;
      case 2:
        this.drawAntennaArray(bitmap, colorMap, centerCol, startRow + 2);
        break;
    }
  }

  // Antena parabólica simple
  private static drawParabolicAntenna(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.LILAC);
  }

  // Torre de radio con antenas
  private static drawRadioTower(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    for (let i = 0; i < 6; i++) {
      this.setPixel(bitmap, colorMap, centerCol, startRow + i, 1, this.COLORS.LILAC);
    }

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 3, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.LILAC);
  }

  // Array de antenas pequeñas
  private static drawAntennaArray(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    for (let i = -1; i <= 1; i++) {
      const col = centerCol + i * 2;
      this.setPixel(bitmap, colorMap, col, startRow + 2, 1, this.COLORS.LILAC);
      this.setPixel(bitmap, colorMap, col, startRow + 1, 1, this.COLORS.LILAC);
      this.setPixel(bitmap, colorMap, col, startRow, 1, this.COLORS.LILAC);
    }
  }

  // Antena para vida basada en silicio - elige entre varios diseños geométricos
  private static drawSiliconBasedAntenna(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, rng: { random: () => number }): void {
    const antennaType = Math.floor(rng.random() * 3);

    switch (antennaType) {
      case 0:
        this.drawCrystallineAntenna(bitmap, colorMap, centerCol, startRow + 1);
        break;
      case 1:
        this.drawSiliconPyramid(bitmap, colorMap, centerCol, startRow + 1);
        break;
      case 2:
        this.drawHexagonalArray(bitmap, colorMap, centerCol, startRow + 2);
        break;
    }
  }

  // Estructura cristalina
  private static drawCrystallineAntenna(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 3, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 3, 1, this.COLORS.LILAC);
  }

  // Pirámide de silicio
  private static drawSiliconPyramid(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 2, 1, this.COLORS.LILAC);
  }

  // Array hexagonal
  private static drawHexagonalArray(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.LILAC);
  }

  // Transmisión no física - elige entre varios diseños etéreos
  private static drawNonPhysicalTransmission(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, rng: { random: () => number }): void {
    const transmissionType = Math.floor(rng.random() * 3);

    switch (transmissionType) {
      case 0:
        this.drawDimensionalVortex(bitmap, colorMap, centerCol, startRow + 2);
        break;
      case 1:
        this.drawEnergyField(bitmap, colorMap, centerCol, startRow + 1, rng);
        break;
      case 2:
        this.drawInterdimensionalPortal(bitmap, colorMap, centerCol, startRow + 2);
        break;
    }
  }

  // Vórtice dimensional - espiral hacia el centro
  private static drawDimensionalVortex(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol, startRow - 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow - 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow - 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow - 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.LILAC);
  }

  // Patrón central con puntos aleatorios alrededor campo de energía pura
  private static drawEnergyField(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, rng: { random: () => number }): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.LILAC);

    for (let i = 0; i < 8; i++) {
      if (rng.random() > 0.4) {
        const offsetX = Math.floor(rng.random() * 5) - 2;
        const offsetY = Math.floor(rng.random() * 5) - 2;

        if (offsetX !== 0 || offsetY !== 0) {
          this.setPixel(bitmap, colorMap, centerCol + offsetX, startRow + 2 + offsetY, 1, this.COLORS.LILAC);
        }
      }
    }

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.LILAC);
  }

  // Portal interdimensional - marco con centro vacío
  private static drawInterdimensionalPortal(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow - 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow - 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow - 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow - 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow - 1, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 2, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 2, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.LILAC);
  }

  // Ondas telepáticas para Conscious Gas - círculo central con ondas procedurales
  private static drawTelepathicWaves(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, rng: { random: () => number }): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.LILAC);

    const waveCount = 3 + Math.floor(rng.random() * 3);

    for (let wave = 0; wave < waveCount; wave++) {
      const radius = wave + 1;
      const intensity = rng.random();

      if (intensity > 0.3) {
        if (radius === 1) {
          this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.LILAC);
          this.setPixel(bitmap, colorMap, centerCol, startRow + 4, 1, this.COLORS.LILAC);
          this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 3, 1, this.COLORS.LILAC);
          this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 3, 1, this.COLORS.LILAC);
        } else if (radius === 2) {
          this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.LILAC);
          this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.LILAC);
          this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 5, 1, this.COLORS.LILAC);
          this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 5, 1, this.COLORS.LILAC);
          this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 3, 1, this.COLORS.LILAC);
          this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 3, 1, this.COLORS.LILAC);
        } else if (radius >= 3) {
          const angle = wave * 1.5 + rng.random() * 0.5;
          const x = Math.round(Math.cos(angle) * radius);
          const y = Math.round(Math.sin(angle) * radius);
          this.setPixel(bitmap, colorMap, centerCol + x, startRow + 3 + y, 1, this.COLORS.LILAC);
        }
      }
    }
  }

  // Antena robótica - cuadrado central con múltiples pinchos
  private static drawRoboticAntenna(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number, rng: { random: () => number }): void {
    const antennaType = Math.floor(rng.random() * 3);

    switch (antennaType) {
      case 0:
        this.drawSymmetricSpikes(bitmap, colorMap, centerCol, startRow + 2);
        break;
      case 1:
        this.drawSensorGrid(bitmap, colorMap, centerCol, startRow + 1);
        break;
      case 2:
        this.drawMultiArmAntenna(bitmap, colorMap, centerCol, startRow + 1);
        break;
    }
  }

  // Pinchos simétricos
  private static drawSymmetricSpikes(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol, startRow - 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol - 1, startRow - 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow - 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.LILAC);
  }

  // Grid de sensores
  private static drawSensorGrid(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        this.setPixel(bitmap, colorMap, centerCol - 1 + x, startRow + y, 1, this.COLORS.LILAC);
      }
    }

    this.setPixel(bitmap, colorMap, centerCol, startRow - 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.LILAC);
  }

  // Antena con múltiples brazos extendiéndose desde el centro
  private static drawMultiArmAntenna(bitmap: number[], colorMap: number[], centerCol: number, startRow: number): void {
    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow + 1, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 2, startRow, 1, this.COLORS.LILAC);
  }

  // Experimento de doble rendija - la representación más precisa posible xd
  private static drawDoubleSlitExperiment(bitmap: number[], colorMap: number[], centerCol: number, startRow: number, height: number): void {
    this.setPixel(bitmap, colorMap, centerCol - 4, startRow + 3, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol, startRow, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 3, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 5, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol, startRow + 6, 1, this.COLORS.LILAC);

    const screenCol = centerCol + 3;

    this.setPixel(bitmap, colorMap, screenCol, startRow + 3, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, screenCol, startRow + 1, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, screenCol, startRow + 5, 1, this.COLORS.LILAC);

    this.setPixel(bitmap, colorMap, centerCol - 2, startRow + 3, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.LILAC);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 4, 1, this.COLORS.LILAC);
  }

  // Dibuja un sistema solar básico con una estrella y algunos planetas si no hay datos disponibles
  private static drawBasicSolarSystem(bitmap: number[], colorMap: number[], startRow: number): void {
    const centerCol = Math.floor(this.WIDTH / 2);

    this.setPixel(bitmap, colorMap, centerCol, startRow + 2, 1, this.COLORS.YELLOW);
    this.setPixel(bitmap, colorMap, centerCol - 1, startRow + 2, 1, this.COLORS.YELLOW);
    this.setPixel(bitmap, colorMap, centerCol + 1, startRow + 2, 1, this.COLORS.YELLOW);

    const orbits = [
      { col: centerCol - 3, row: startRow + 4 },
      { col: centerCol - 1, row: startRow + 6 },
      { col: centerCol + 2, row: startRow + 5 },
      { col: centerCol + 4, row: startRow + 7 },
    ];

    orbits.forEach((orbit, index) => {
      if (index === 2) {
        this.setPixel(bitmap, colorMap, orbit.col, orbit.row, 1, this.COLORS.YELLOW);
        this.setPixel(bitmap, colorMap, orbit.col, orbit.row - 1, 1, this.COLORS.YELLOW);
        this.setPixel(bitmap, colorMap, orbit.col, orbit.row + 1, 1, this.COLORS.YELLOW);
      } else {
        this.setPixel(bitmap, colorMap, orbit.col, orbit.row, 1, this.COLORS.YELLOW);
      }
    });
  }
}
