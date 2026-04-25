# pymodules/planet_renderer/main_translator.py

import math
import random
import time
from typing import Dict, List, Any, Optional, Tuple

from pymodules.__atlas_config import config
from pymodules.__atlas_seedmaster import consistent_hash
from pymodules.__atlas_fixed_vars import VISUAL_DEBUG
from pymodules.__drawer_cplanet_type import get_planet_color_map, get_procedural_planet_color

from .atmosphere_translator import AtmosphereTranslator
from .rings_translator import RingsTranslator
from .life_forms_translator import LifeFormsTranslator
from .moons_translator import MoonsTranslator
from .shader_utils import ShaderUtils
from .planet_type_translators import PlanetTypeTranslators


class PlanetRenderingTranslator:

    def __init__(self):
        self.atmosphere_translator = AtmosphereTranslator()
        self.rings_translator = RingsTranslator()
        self.life_forms_translator = LifeFormsTranslator()
        self.moons_translator = MoonsTranslator()
        self.planet_type_translators = PlanetTypeTranslators()

        self.planet_types = {
            "气体巨行星": self.planet_type_translators.translate_gas_giant,
            "异常行星": self.planet_type_translators.translate_anomaly,
            "岩石行星": self.planet_type_translators.translate_rocky,
            "冰冻行星": self.planet_type_translators.translate_icy,
            "海洋行星": self.planet_type_translators.translate_oceanic,
            "沙漠行星": self.planet_type_translators.translate_desert,
            "熔岩行星": self.planet_type_translators.translate_lava,
            "干旱行星": self.planet_type_translators.translate_arid,
            "沼泽行星": self.planet_type_translators.translate_swamp,
            "苔原行星": self.planet_type_translators.translate_tundra,
            "森林行星": self.planet_type_translators.translate_forest,
            "稀树草原行星": self.planet_type_translators.translate_savannah,
            "洞穴行星": self.planet_type_translators.translate_cave,
            "晶体行星": self.planet_type_translators.translate_crystalline,
            "金属行星": self.planet_type_translators.translate_metallic,
            "有毒行星": self.planet_type_translators.translate_toxic,
            "放射性行星": self.planet_type_translators.translate_radioactive,
            "岩浆行星": self.planet_type_translators.translate_magma,
            "熔融核心行星": self.planet_type_translators.translate_molten_core,
            "碳行星": self.planet_type_translators.translate_carbon,
            "钻石行星": self.planet_type_translators.translate_diamond,
            "超级地球": self.planet_type_translators.translate_super_earth,
            "次地球": self.planet_type_translators.translate_sub_earth,
            "冰冻气体巨行星": self.planet_type_translators.translate_frozen_gas_giant,
            "星云行星": self.planet_type_translators.translate_nebulous,
            "含水层行星": self.planet_type_translators.translate_aquifer,
            "奇异行星": self.planet_type_translators.translate_exotic,
        }

    def translate_planet_rendering(self, planet) -> Dict[str, Any]:
        print(f"DEBUG: translate_planet_rendering called with planet: {planet}")
        print(f"DEBUG: planet type: {type(planet)}")
        if planet:
            print(f"DEBUG: planet name: {planet.name}")
            print(f"DEBUG: planet has seed: {hasattr(planet, 'seed')}")
            if hasattr(planet, 'seed'):
                print(f"DEBUG: planet seed: {planet.seed}")

        spaced_planet_name = planet.name.replace("_", " ")
        planet_type = planet.planet_type.replace("_", " ")

        cosmic_origin_time = config.cosmic_origin_time or time.time()
        current_time = time.time()
        time_elapsed_seconds = current_time - cosmic_origin_time

        angle_velocity_rotation = 2 * math.pi / planet.rotation_period_seconds
        angle_rotation = (planet.initial_angle_rotation + time_elapsed_seconds * angle_velocity_rotation) % (2 * math.pi)

        angle_velocity_orbit = 2 * math.pi / planet.orbital_period_seconds
        orbital_angle = (planet.initial_orbital_angle + time_elapsed_seconds * angle_velocity_orbit) % (2 * math.pi)

        tilt_factor = math.sin(math.radians(planet.axial_tilt))
        
        # Get config seed or use a default value if None
        config_seed = config.seed or 123456789
        print(f"DEBUG: config_seed: {config_seed}")
        shape_seed = consistent_hash(f"{config_seed}-{spaced_planet_name}-{planet_type}-{planet.diameter}-{planet.density}-{planet.gravity}-_safe_shaper")

        planet_radius = int(200 * (planet.diameter / max(planet.diameter, 1)))
        rng = random.Random(shape_seed)

        planet_color_map = get_planet_color_map()
        base_color = planet_color_map.get(planet.planet_type, "#FFFFFF")
        planet_seed = getattr(planet, "seed", None)
        print(f"DEBUG: planet_seed: {planet_seed}")
        if planet_seed:
            print(f"DEBUG: calling get_procedural_planet_color with seed: {planet_seed}")
            base_color = get_procedural_planet_color(base_color, planet.planet_type, planet_seed)

        planet_specific_data = {}
        if planet_type in self.planet_types:
            orbital_period_years = planet.orbital_period_seconds / (365.25 * 24 * 3600) if planet.orbital_period_seconds else 1.0

            if planet_type in ["Gas Giant", "Frozen Gas Giant", "Nebulous", "Anomaly", "Exotic", "Carbon"]:
                planet_specific_data = self.planet_types[planet_type](planet_radius, rng, config_seed, spaced_planet_name, orbital_period_years)
            else:
                planet_specific_data = self.planet_types[planet_type](planet_radius, rng, config_seed, spaced_planet_name)

        if not planet_specific_data:
            planet_specific_data = {"type": "basic"}

        atmosphere_data = self.atmosphere_translator.translate_atmosphere(planet.atmosphere)

        rings_data = None
        if planet.planet_rings:
            rings_data = self.rings_translator.translate_rings(planet, planet_radius, rng, tilt_factor, angle_rotation)

        life_forms_data = self.life_forms_translator.translate_life_forms(planet.life_forms, planet_radius, rng, config_seed, spaced_planet_name)

        moons_data = None
        if hasattr(planet, "moon_system") and planet.moon_system:
            moons_data = self.moons_translator.translate_moon_system(planet.moon_system, planet, str(config_seed))

        return {
            "planet_info": {"name": spaced_planet_name, "type": planet_type, "base_color": base_color, "radius": planet_radius, "diameter": planet.diameter, "orbital_radius": planet.orbital_radius, "density": planet.density, "gravity": planet.gravity, "axial_tilt": planet.axial_tilt, "rotation_period": planet.rotation_period_seconds, "orbital_period": planet.orbital_period_seconds},
            "debug": {"visual_debug": VISUAL_DEBUG, "cosmic_origin_time": cosmic_origin_time, "initial_angle_rotation": planet.initial_angle_rotation},
            "seeds": {"shape_seed": shape_seed, "config_seed": str(config_seed), "planet_seed": planet_seed},
            "timing": {"current_rotation_angle": angle_rotation, "orbital_angle": orbital_angle, "initial_orbital_angle": planet.initial_orbital_angle, "tilt_factor": tilt_factor, "cosmic_origin_time": cosmic_origin_time, "time_elapsed_seconds": time_elapsed_seconds, "elapsed_time": time_elapsed_seconds},
            "surface_elements": planet_specific_data,
            "atmosphere": atmosphere_data,
            "rings": rings_data,
            "moons": moons_data,
            "life_forms": life_forms_data,
            "shader_uniforms": ShaderUtils.generate_shader_uniforms(planet_type, shape_seed, angle_rotation, base_color, planet_specific_data),
        }
