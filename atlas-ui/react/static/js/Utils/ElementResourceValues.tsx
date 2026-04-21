// atlas-ui/react/static/js/Utils/ElementResourceValues.tsx

import React from "react";

export interface ElementValue {
  antimatter: number;
  element115: number;
  deuterium: number;
}

export const ELEMENT_RESOURCE_VALUES: { [key: string]: ElementValue } = {
  "Z-Divinium": { antimatter: 100, element115: 150, deuterium: 80 },

  Oganesson: { antimatter: 80, element115: 95, deuterium: 40 },
  Tennessine: { antimatter: 50, element115: 70, deuterium: 40 },
  Livermorium: { antimatter: 50, element115: 70, deuterium: 40 },
  Moscovium: { antimatter: 50, element115: 70, deuterium: 40 },
  Flerovium: { antimatter: 50, element115: 70, deuterium: 40 },
  Nihonium: { antimatter: 50, element115: 70, deuterium: 40 },
  Copernicium: { antimatter: 50, element115: 70, deuterium: 40 },

  Roentgenium: { antimatter: 40, element115: 55, deuterium: 35 },
  Darmstadtium: { antimatter: 40, element115: 55, deuterium: 35 },
  Meitnerium: { antimatter: 40, element115: 55, deuterium: 35 },

  Hassium: { antimatter: 35, element115: 45, deuterium: 30 },
  Bohrium: { antimatter: 35, element115: 45, deuterium: 30 },
  Seaborgium: { antimatter: 35, element115: 45, deuterium: 30 },
  Dubnium: { antimatter: 35, element115: 45, deuterium: 30 },
  Rutherfordium: { antimatter: 35, element115: 45, deuterium: 30 },

  Lawrencium: { antimatter: 30, element115: 40, deuterium: 25 },
  Nobelium: { antimatter: 30, element115: 40, deuterium: 25 },
  Mendelevium: { antimatter: 30, element115: 40, deuterium: 25 },
  Fermium: { antimatter: 30, element115: 40, deuterium: 25 },
  Einsteinium: { antimatter: 30, element115: 40, deuterium: 25 },
  Californium: { antimatter: 30, element115: 40, deuterium: 25 },
  Berkelium: { antimatter: 30, element115: 40, deuterium: 25 },

  Curium: { antimatter: 25, element115: 35, deuterium: 20 },
  Americium: { antimatter: 25, element115: 35, deuterium: 20 },
  Plutonium: { antimatter: 25, element115: 35, deuterium: 20 },
  Neptunium: { antimatter: 25, element115: 35, deuterium: 20 },
  Uranium: { antimatter: 25, element115: 35, deuterium: 20 },
  Protactinium: { antimatter: 25, element115: 35, deuterium: 20 },
  Thorium: { antimatter: 25, element115: 35, deuterium: 20 },
  Actinium: { antimatter: 25, element115: 35, deuterium: 20 },
  Radium: { antimatter: 25, element115: 35, deuterium: 20 },
  Francium: { antimatter: 25, element115: 35, deuterium: 20 },

  Radon: { antimatter: 20, element115: 28, deuterium: 18 },
  Astatine: { antimatter: 20, element115: 28, deuterium: 18 },
  Polonium: { antimatter: 20, element115: 28, deuterium: 18 },

  Bismuth: { antimatter: 18, element115: 25, deuterium: 15 },
  Lead: { antimatter: 18, element115: 25, deuterium: 15 },
  Thallium: { antimatter: 18, element115: 25, deuterium: 15 },
  Mercury: { antimatter: 18, element115: 25, deuterium: 15 },
  Gold: { antimatter: 18, element115: 25, deuterium: 15 },
  Platinum: { antimatter: 16, element115: 22, deuterium: 14 },
  Iridium: { antimatter: 16, element115: 22, deuterium: 14 },
  Osmium: { antimatter: 16, element115: 22, deuterium: 14 },

  Rhenium: { antimatter: 15, element115: 20, deuterium: 12 },
  Tungsten: { antimatter: 15, element115: 20, deuterium: 12 },
  Tantalum: { antimatter: 15, element115: 20, deuterium: 12 },
  Hafnium: { antimatter: 15, element115: 20, deuterium: 12 },

  Lutetium: { antimatter: 12, element115: 16, deuterium: 10 },
  Ytterbium: { antimatter: 12, element115: 16, deuterium: 10 },
  Thulium: { antimatter: 12, element115: 16, deuterium: 10 },
  Erbium: { antimatter: 11, element115: 15, deuterium: 9 },
  Holmium: { antimatter: 11, element115: 15, deuterium: 9 },
  Dysprosium: { antimatter: 11, element115: 15, deuterium: 9 },
  Terbium: { antimatter: 10, element115: 14, deuterium: 8 },
  Gadolinium: { antimatter: 10, element115: 14, deuterium: 8 },
  Europium: { antimatter: 9, element115: 12, deuterium: 7 },
  Samarium: { antimatter: 9, element115: 12, deuterium: 7 },
  Promethium: { antimatter: 9, element115: 12, deuterium: 7 },
  Neodymium: { antimatter: 9, element115: 12, deuterium: 7 },
  Praseodymium: { antimatter: 9, element115: 12, deuterium: 7 },
  Cerium: { antimatter: 8, element115: 11, deuterium: 6 },
  Lanthanum: { antimatter: 8, element115: 11, deuterium: 6 },

  Barium: { antimatter: 7, element115: 9, deuterium: 5 },
  Cesium: { antimatter: 7, element115: 9, deuterium: 5 },
  Xenon: { antimatter: 7, element115: 9, deuterium: 5 },
  Iodine: { antimatter: 7, element115: 9, deuterium: 5 },
  Tellurium: { antimatter: 7, element115: 9, deuterium: 5 },
  Antimony: { antimatter: 6, element115: 8, deuterium: 4 },
  Tin: { antimatter: 6, element115: 8, deuterium: 4 },
  Indium: { antimatter: 6, element115: 8, deuterium: 4 },
  Cadmium: { antimatter: 5, element115: 7, deuterium: 4 },
  Silver: { antimatter: 5, element115: 7, deuterium: 4 },
  Palladium: { antimatter: 5, element115: 7, deuterium: 4 },
  Rhodium: { antimatter: 5, element115: 7, deuterium: 4 },
  Ruthenium: { antimatter: 4, element115: 6, deuterium: 3 },
  Technetium: { antimatter: 4, element115: 6, deuterium: 3 },
  Molybdenum: { antimatter: 4, element115: 6, deuterium: 3 },
  Niobium: { antimatter: 4, element115: 6, deuterium: 3 },

  Tritium: { antimatter: 8, element115: 10, deuterium: 15 },

  Zirconium: { antimatter: 3, element115: 4, deuterium: 2 },
  Yttrium: { antimatter: 3, element115: 4, deuterium: 2 },
  Strontium: { antimatter: 3, element115: 4, deuterium: 2 },
  Rubidium: { antimatter: 3, element115: 4, deuterium: 2 },
  Krypton: { antimatter: 3, element115: 4, deuterium: 2 },
  Bromine: { antimatter: 3, element115: 4, deuterium: 2 },
  Selenium: { antimatter: 3, element115: 4, deuterium: 2 },
  Arsenic: { antimatter: 3, element115: 4, deuterium: 2 },
  Beryllium: { antimatter: 3, element115: 4, deuterium: 2 },
  Scandium: { antimatter: 3, element115: 4, deuterium: 2 },

  Germanium: { antimatter: 2, element115: 3, deuterium: 2 },
  Gallium: { antimatter: 2, element115: 3, deuterium: 2 },
  Zinc: { antimatter: 2, element115: 3, deuterium: 2 },
  Copper: { antimatter: 2, element115: 3, deuterium: 2 },
  Lithium: { antimatter: 2, element115: 3, deuterium: 2 },
  Fluorine: { antimatter: 2, element115: 3, deuterium: 2 },
  Titanium: { antimatter: 2, element115: 3, deuterium: 2 },
  Vanadium: { antimatter: 2, element115: 3, deuterium: 2 },
  Chromium: { antimatter: 2, element115: 3, deuterium: 2 },

  Cobalt: { antimatter: 1, element115: 2, deuterium: 1 },
  Manganese: { antimatter: 1, element115: 2, deuterium: 1 },
  Nickel: { antimatter: 1, element115: 2, deuterium: 1 },
  Calcium: { antimatter: 1, element115: 2, deuterium: 1 },

  Argon: { antimatter: 1, element115: 1, deuterium: 1 },
  Chlorine: { antimatter: 1, element115: 1, deuterium: 1 },
  Phosphorus: { antimatter: 1, element115: 1, deuterium: 1 },
  Boron: { antimatter: 1, element115: 1, deuterium: 1 },
  Potassium: { antimatter: 1, element115: 1, deuterium: 1 },
  Sodium: { antimatter: 1, element115: 1, deuterium: 1 },
  Aluminum: { antimatter: 1, element115: 1, deuterium: 1 },

  Sulfur: { antimatter: 0, element115: 1, deuterium: 1 },
  Magnesium: { antimatter: 0, element115: 1, deuterium: 1 },
  Silicon: { antimatter: 0, element115: 1, deuterium: 1 },
  Iron: { antimatter: 0, element115: 1, deuterium: 1 },
  Neon: { antimatter: 0, element115: 1, deuterium: 0 },

  Nitrogen: { antimatter: 0, element115: 0, deuterium: 1 },
  Carbon: { antimatter: 0, element115: 0, deuterium: 1 },
  Oxygen: { antimatter: 0, element115: 1, deuterium: 1 },
  Helium: { antimatter: 1, element115: 0, deuterium: 0 },
  Hydrogen: { antimatter: 0, element115: 1, deuterium: 0 },
};

export function calculatePlanetResources(elements: string[]): ElementValue {
  let totalResources = { antimatter: 0, element115: 0, deuterium: 0 };

  elements.forEach((element) => {
    const elementName = element.trim();
    const value = ELEMENT_RESOURCE_VALUES[elementName];

    if (value) {
      totalResources.antimatter += value.antimatter;
      totalResources.element115 += value.element115;
      totalResources.deuterium += value.deuterium;
    }
  });

  if (totalResources.antimatter === 0 && totalResources.element115 === 0 && totalResources.deuterium === 0) {
    totalResources = { antimatter: 1, element115: 1, deuterium: 2 };
  }

  return totalResources;
}

export function getElementRarityTier(elementName: string): string {
  const value = ELEMENT_RESOURCE_VALUES[elementName];
  if (!value) return "未知";

  if (elementName === "Z-Divinium") return "特殊";

  const totalValue = value.antimatter + value.element115 + value.deuterium;

  if (totalValue >= 200) return "极其稀有";
  if (totalValue >= 100) return "非常稀有";
  if (totalValue >= 75) return "稀有";
  if (totalValue >= 50) return "较稀有";
  if (totalValue >= 30) return "不常见";
  if (totalValue >= 15) return "常见";
  if (totalValue >= 5) return "非常常见";
  if (totalValue >= 2) return "丰富";
  return "基础";
}
