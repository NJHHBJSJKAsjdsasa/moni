# pymodules/planet_renderer/atmosphere_translator.py

from typing import Dict, Any, Optional


class AtmosphereTranslator:

    def __init__(self):
        self.atmosphere_configs = {
            "Breathable": {"color": [144, 238, 144, 150], "width": 13},
            "Thick": {"color": [169, 169, 169, 200], "width": 17},
            "Thin": {"color": [211, 211, 211, 100], "width": 11},
            "Carbon Dioxide": {"color": [165, 42, 42, 150], "width": 15},
            "Methane": {"color": [0, 0, 139, 150], "width": 15},
            "Nitrogen": {"color": [0, 0, 255, 150], "width": 15},
            "Oxygen-Rich": {"color": [255, 255, 255, 150], "width": 15},
            "Sulfur Dioxide": {"color": [255, 255, 0, 150], "width": 15},
            "Superheated": {"color": [255, 0, 0, 200], "width": 18},
            "Acidic": {"color": [0, 100, 0, 150], "width": 15},
            "Toxic": {"color": [128, 0, 128, 150], "width": 15},
            "Hydrogen": {"color": [255, 182, 193, 150], "width": 15},
            "Helium": {"color": [255, 255, 224, 150], "width": 15},
            "Ammonia": {"color": [240, 230, 140, 150], "width": 15},
            "Ionic": {"color": [0, 191, 255, 150], "width": 18},
            "Plasma": {"color": [255, 105, 180, 200], "width": 18},
            "Exotic Gases": {"color": [186, 85, 211, 150], "width": 18},
            "Water Vapor": {"color": [173, 216, 230, 150], "width": 15},
            "Frozen": {"color": [240, 248, 255, 150], "width": 15},
        }

    def translate_atmosphere(self, atmosphere_type: str) -> Optional[Dict[str, Any]]:
        if atmosphere_type == "None":
            return None

        config = self.atmosphere_configs.get(atmosphere_type, {"color": [169, 169, 169, 150], "width": 15})

        return {"type": atmosphere_type, "color": [c / 255.0 for c in config["color"][:3]] + [config["color"][3] / 255.0], "width": config["width"], "blur_radius": 5}
