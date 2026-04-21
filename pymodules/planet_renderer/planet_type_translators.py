# pymodules/planet_renderer/planet_type_translators.py

import math
import random
from typing import Dict, Any
from .common_utils import CommonUtils


class PlanetTypeTranslators:

    def __init__(self):
        self.common_utils = CommonUtils()

    def translate_gas_giant(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str, orbital_period_years: float = 12.0) -> Dict[str, Any]:

        num_bands = rng.randint(3, 20)
        rotation_angle = rng.uniform(-15, 15) * math.pi / 180

        band_positions = []
        band_widths = []
        center_y = 200

        for i in range(num_bands):
            band_width = rng.randint(2, 4)
            band_position_y = rng.randint(center_y - planet_radius, center_y + planet_radius)

            normalized_y = 1.0 - 2.0 * (band_position_y - 100) / 200

            band_positions.append(normalized_y)
            band_widths.append(band_width / planet_radius)

        while len(band_positions) < 20:
            band_positions.append(0)
            band_widths.append(0)

        storms = []
        if rng.random() < 0.5:
            storm_radius = rng.randint(30, 50)
            storm_x = rng.uniform(-0.3, 0.3)
            storm_y = rng.uniform(-0.3, 0.3)
            storms.append({"position": [storm_x, storm_y], "radius": storm_radius / planet_radius, "color": [0.545, 0.0, 0.0, 0.6], "intensity": rng.uniform(0.5, 1.0)})

        polar_hexagon = None
        if rng.random() < 0.3:
            cycle_duration_years = rng.uniform(orbital_period_years * 0.3, orbital_period_years * 0.5)
            visible_duration_years = rng.uniform(cycle_duration_years * 0.3, cycle_duration_years * 0.7)
            phase_offset_years = rng.uniform(0, cycle_duration_years)

            pole = rng.choice(["north", "south"])

            polar_hexagon = {"enabled": True, "pole": pole, "radius": rng.uniform(0.15, 0.25), "rotation_speed": rng.uniform(0.001, 0.003), "color_darken_factor": rng.uniform(0.15, 0.25), "cycle_duration_years": cycle_duration_years, "visible_duration_years": visible_duration_years, "phase_offset_years": phase_offset_years, "opacity": rng.uniform(0.6, 0.9)}

        num_secondary_clouds = rng.randint(25, 40)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(25, 45)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(1.0, 2.5)})

        num_atmosphere_clouds = rng.randint(15, 25)
        clouds = []
        center_x, center_y = 200, 200

        for i in range(num_atmosphere_clouds):
            cloud_radius = rng.randint(30, 55)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = ["#ffffff", "#f5f5f5", "#e8e8e8", "#f0f8ff", "#fffaf0", "#f8f8ff", "#f5f5dc", "#faf0e6"]

            clouds.append({"x": normalized_coords[0], "y": normalized_coords[1], "radius": cloud_radius, "color": rng.choice(cloud_colors), "opacity": rng.uniform(0.6, 0.9), "type": "cloud", "seed": f"{planet_name}_atmosphere_cloud_{i}"})

        return {"type": "gas_giant", "cloud_bands": {"num_bands": num_bands, "positions": band_positions, "widths": band_widths, "rotation": rotation_angle}, "storms": storms, "polar_hexagon": polar_hexagon, "secondary_clouds": secondary_clouds, "atmosphere_clouds": {"clouds": clouds}, "debug": {"original_planet_radius": planet_radius, "center_y": center_y, "band_count": num_bands, "rotation_degrees": rotation_angle * 180 / math.pi, "has_hexagon": polar_hexagon is not None, "secondary_cloud_count": num_secondary_clouds, "atmosphere_cloud_count": num_atmosphere_clouds}}

    def translate_rocky(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        abstract_lands = [{"layer": 0, "color": [38 / 255.0, 38 / 255.0, 38 / 255.0, 165 / 255.0], "points_min": 8, "points_max": 10, "seg_min": 1, "seg_max": 2, "seed": f"{seed}-{planet_name}-abstract_land_0"}, {"layer": 1, "color": [80 / 255.0, 80 / 255.0, 80 / 255.0, 40 / 255.0], "points_min": 12, "points_max": 20, "seg_min": 1, "seg_max": 6, "seed": f"{seed}-{planet_name}-abstract_land_1"}]

        num_mountains = rng.randint(4, 30)
        mountains = []
        mountain_color = [130 / 255.0, 130 / 255.0, 130 / 255.0, 1.0]

        for _ in range(num_mountains):
            mountain_width = rng.randint(4, 8)
            mountain_height = rng.randint(4, 8)
            mountain_x = center_x + rng.randint(-planet_radius, planet_radius)
            mountain_y = center_y + rng.randint(-planet_radius, planet_radius)

            normalized_x = (mountain_x - center_x) / planet_radius
            normalized_y = (mountain_y - center_y) / planet_radius

            angle = math.radians(rng.uniform(-40, 40))

            mountains.append({"position": [normalized_x, normalized_y], "width": mountain_width / planet_radius, "height": mountain_height / planet_radius, "angle": angle, "color": mountain_color})

        num_clouds = rng.randint(5, 10)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(10, 30)
            cloud_x = center_x + rng.randint(-planet_radius, planet_radius)
            cloud_y = center_y + rng.randint(-planet_radius, planet_radius)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": [0.5, 0.5, 0.5, 0.7], "type": "cloud", "seed": f"{planet_name}_cloud_{i}"})

        crater = None
        if rng.random() < 0.7:
            crater_radius = rng.randint(15, 40)
            crater_x = center_x + rng.randint(-planet_radius, planet_radius)
            crater_y = center_y + rng.randint(-planet_radius, planet_radius)

            normalized_coords = self.common_utils.normalize_coordinates(crater_x, crater_y, center_x, center_y, planet_radius)

            crater = {"position": normalized_coords, "radius": crater_radius / planet_radius, "color": [0.3, 0.3, 0.3, 1.0], "type": "crater", "seed": f"{planet_name}_crater"}

        num_secondary_clouds = rng.randint(8, 15)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(15, 28)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(0.8, 1.5)})

        return {"type": "rocky", "abstract_lands": abstract_lands, "mountains": mountains, "clouds": clouds, "crater": crater, "secondary_clouds": secondary_clouds, "debug": {"original_planet_radius": planet_radius, "center_x": center_x, "center_y": center_y, "mountain_count": num_mountains, "cloud_count": num_clouds, "secondary_cloud_count": num_secondary_clouds, "has_crater": crater is not None}}

    def translate_icy(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200
        two_pi = 2 * math.pi

        abstract_lands = [{"layer": 0, "color": [126 / 255.0, 169 / 255.0, 214 / 255.0, 150 / 255.0], "points_min": 6, "points_max": 8, "seg_min": 8, "seg_max": 14, "seed": f"{seed}-{planet_name}-abstract_land_0"}, {"layer": 1, "color": [81 / 255.0, 106 / 255.0, 145 / 255.0, 1 / 255.0], "points_min": 40, "points_max": 60, "seg_min": 1, "seg_max": 1, "seed": f"{seed}-{planet_name}-abstract_land_1"}]

        num_crystals = rng.randint(20, 30)
        crystals = []

        for _ in range(num_crystals):
            crystal_length = rng.randint(5, 15)
            crystal_width = rng.randint(8, 20)
            crystal_angle = rng.uniform(0, two_pi)

            polar_bias = rng.choice([-1, 1])
            polar_offset = rng.uniform(0.5 * planet_radius, planet_radius) * polar_bias
            crystal_x = center_x + rng.uniform(-0.3 * planet_radius, 0.3 * planet_radius)
            crystal_y = center_y + polar_offset

            normalized_coords = self.common_utils.normalize_coordinates(crystal_x, crystal_y, center_x, center_y, planet_radius)

            crystals.append({"position": normalized_coords, "length": crystal_length / planet_radius, "width": crystal_width / planet_radius, "angle": crystal_angle, "color": [172 / 255.0, 215 / 255.0, 230 / 255.0, 1.0]})

        cracks = []
        if rng.random() < 0.5:
            crack_length = 200
            crack_angle = rng.uniform(0, two_pi)
            num_cracks = rng.randint(3, 12)

            for _ in range(num_cracks):
                adjusted_angle = crack_angle + rng.uniform(-1, 1)
                cracks.append({"angle": adjusted_angle, "length": crack_length / planet_radius, "color": [80 / 255.0, 80 / 255.0, 80 / 255.0, 40 / 255.0], "width": 1})

        num_ice_caps = rng.randint(2, 4)
        ice_caps = []
        for i in range(num_ice_caps):
            cap_radius = rng.randint(20, 50)
            cap_x = center_x + rng.randint(-planet_radius, planet_radius)
            cap_y = center_y + rng.randint(-planet_radius, planet_radius)

            normalized_coords = self.common_utils.normalize_coordinates(cap_x, cap_y, center_x, center_y, planet_radius)

            ice_caps.append({"position": normalized_coords, "radius": cap_radius / planet_radius, "color": [0.678, 0.847, 1.0, 0.8], "seed": f"{planet_name}_icecap_{i}"})

        num_clouds = rng.randint(8, 15)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(15, 35)
            cloud_x = center_x + rng.randint(-planet_radius, planet_radius)
            cloud_y = center_y + rng.randint(-planet_radius, planet_radius)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": [0.9, 0.95, 1.0, 0.6], "type": "cloud", "seed": f"{planet_name}_cloud_{i}"})

        num_secondary_clouds = rng.randint(12, 20)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(18, 32)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(0.6, 1.2)})

        return {"type": "icy", "abstract_lands": abstract_lands, "crystals": crystals, "cracks": cracks, "ice_caps": ice_caps, "clouds": clouds, "secondary_clouds": secondary_clouds, "debug": {"original_planet_radius": planet_radius, "center_x": center_x, "center_y": center_y, "crystal_count": num_crystals, "crack_count": len(cracks), "ice_cap_count": num_ice_caps, "cloud_count": num_clouds, "secondary_cloud_count": num_secondary_clouds}}

    def translate_oceanic(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        abstract_lands = [{"color": [0, 0, 139 / 255.0, 40 / 255.0], "points_min": 40, "points_max": 60, "seg_min": 1, "seg_max": 1, "seed": f"{seed}-{planet_name}-abstract_land_oceanic"}]

        base_green = [57, 92, 0]
        base_brown = [92, 58, 0]

        patch_color = [rng.randint(min(base_green[0], base_brown[0]), max(base_green[0], base_brown[0])) / 255.0, rng.randint(min(base_green[1], base_brown[1]), max(base_green[1], base_brown[1])) / 255.0, rng.randint(min(base_green[2], base_brown[2]), max(base_green[2], base_brown[2])) / 255.0, 150 / 255.0]

        num_green_patches = rng.randint(10, 20)
        green_patches = []
        for _ in range(num_green_patches):
            patch_size = rng.randint(6, 80)

            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            patch_3d_x = math.sin(phi) * math.cos(theta)
            patch_3d_y = math.sin(phi) * math.sin(theta)
            patch_3d_z = math.cos(phi)

            patch_angle = rng.uniform(0, 2 * math.pi)
            patch_distance = rng.uniform(0.3 * planet_radius, planet_radius)

            patch_x = center_x + patch_distance * math.cos(patch_angle)
            patch_y = center_y + patch_distance * math.sin(patch_angle)

            normalized_coords = self.common_utils.normalize_coordinates(patch_x, patch_y, center_x, center_y, planet_radius)

            green_patches.append({"position": normalized_coords, "position_3d": [patch_3d_x, patch_3d_y, patch_3d_z], "size": patch_size / planet_radius, "color": patch_color, "sides": rng.randint(20, 30)})

        num_clouds = rng.randint(3, 6)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(25, int(planet_radius * 0.3))
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": [244 / 255.0, 164 / 255.0, 96 / 255.0, 1.0], "seed": f"{planet_name}_cloud_{i}"})

        num_secondary_clouds = rng.randint(22, 32)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(28, 45)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(2.0, 3.0)})

        return {"type": "oceanic", "depths": {"enabled": True}, "abstract_lands": abstract_lands, "green_patches": green_patches, "clouds": clouds, "secondary_clouds": secondary_clouds, "debug": {"secondary_cloud_count": num_secondary_clouds}}

    def translate_metallic(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:

        base_gray = rng.uniform(0.3, 0.5)

        effects_3d = []

        effects_3d.append({"type": "atmospheric_streaks", "params": {"color": [rng.uniform(0.9, 1.0), rng.uniform(0.9, 1.0), rng.uniform(0.95, 1.0)], "particleCount": rng.randint(50, 150), "speed": rng.uniform(0.5, 1.5)}, "priority": 20})

        actions = []

        num_waves = rng.randint(3, 6)
        for i in range(num_waves):
            wave_radius = rng.uniform(0.2, 0.8)
            actions.append({"type": "draw_circle", "params": {"center": [0, 0], "radius": wave_radius, "color": [base_gray * 1.1, base_gray * 1.1, base_gray * 1.15, 0.1], "blend_mode": "add"}})

        num_secondary_clouds = rng.randint(10, 16)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(18, 30)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(1.0, 1.8)})

        return {"type": "metallic_3d", "effects_3d": effects_3d, "universal_actions": actions, "secondary_clouds": secondary_clouds, "debug": {"secondary_cloud_count": num_secondary_clouds}}

    def translate_desert(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        num_clouds = rng.randint(6, 12)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(20, 40)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = [
                [0.9, 0.85, 0.7, 0.6],
                [0.85, 0.8, 0.65, 0.7],
                [0.95, 0.9, 0.75, 0.5],
                [0.8, 0.75, 0.6, 0.8],
                [0.88, 0.82, 0.68, 0.65],
            ]

            cloud_color = rng.choice(cloud_colors)

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": cloud_color, "type": "cloud", "seed": f"{planet_name}_desert_cloud_{i}"})

        num_landmasses = rng.randint(6, 12)
        green_patches = []

        for i in range(num_landmasses):
            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            position_3d = [math.sin(phi) * math.cos(theta), math.sin(phi) * math.sin(theta), math.cos(phi)]

            if i < 3:
                size = rng.uniform(0.2, 0.32)
            elif i < 6:
                size = rng.uniform(0.15, 0.25)
            else:
                size = rng.uniform(0.1, 0.18)

            desert_color_choices = [
                [0.8, 0.7, 0.35],
                [0.85, 0.75, 0.4],
                [0.75, 0.65, 0.3],
                [0.9, 0.8, 0.45],
                [0.78, 0.68, 0.35],
                [0.7, 0.75, 0.4],
                [0.65, 0.7, 0.35],
            ]

            green_patches.append({"position_3d": position_3d, "size": size, "color": rng.choice(desert_color_choices) + [rng.uniform(0.8, 0.9)], "sides": rng.randint(12, 20), "height": rng.uniform(0.01, 0.025), "vegetation_density": rng.uniform(0.2, 0.5)})

        return {"type": "desert", "clouds": clouds, "green_patches": green_patches, "savannah_terrain_layer": True}

    def translate_lava(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        num_clouds = rng.randint(10, 18)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(30, 50)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = [
                [0.3, 0.25, 0.2, 0.9],
                [0.4, 0.3, 0.25, 0.85],
                [0.35, 0.28, 0.22, 0.8],
                [0.5, 0.35, 0.3, 0.75],
                [0.45, 0.32, 0.28, 0.8],
            ]

            cloud_color = rng.choice(cloud_colors)

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": cloud_color, "type": "cloud", "seed": f"{planet_name}_lava_cloud_{i}"})

        num_landmasses = rng.randint(8, 15)
        green_patches = []

        for i in range(num_landmasses):
            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            position_3d = [math.sin(phi) * math.cos(theta), math.sin(phi) * math.sin(theta), math.cos(phi)]

            if i < 4:
                size = rng.uniform(0.25, 0.40)
            elif i < 8:
                size = rng.uniform(0.15, 0.25)
            else:
                size = rng.uniform(0.08, 0.15)

            lava_colors = [
                [0.15, 0.12, 0.10],
                [0.25, 0.15, 0.12],
                [0.3, 0.18, 0.15],
                [0.35, 0.2, 0.15],
                [0.28, 0.16, 0.13],
            ]

            land_color = rng.choice(lava_colors)

            patch_angle = rng.uniform(0, 2 * math.pi)
            patch_distance = rng.uniform(0.3 * planet_radius, planet_radius)

            patch_x = center_x + patch_distance * math.cos(patch_angle)
            patch_y = center_y + patch_distance * math.sin(patch_angle)

            normalized_coords = self.common_utils.normalize_coordinates(patch_x, patch_y, center_x, center_y, planet_radius)

            green_patches.append({"position": normalized_coords, "position_3d": position_3d, "size": size, "color": land_color, "type": "land_mass", "seed": f"{planet_name}_lava_landmass_{i}"})

        num_lava_pools = rng.randint(6, 12)
        lava_pools = []

        for i in range(num_lava_pools):
            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            position_3d = [math.sin(phi) * math.cos(theta), math.sin(phi) * math.sin(theta), math.cos(phi)]

            pool_size = rng.uniform(0.05, 0.15)

            lava_pools.append({"position_3d": position_3d, "radius": pool_size, "color": [0.9, 0.3, 0.1, 1.0], "temperature": rng.uniform(1000, 1500), "glow_intensity": rng.uniform(0.7, 1.0)})

        num_secondary_clouds = rng.randint(18, 28)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(25, 40)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(2.0, 3.2)})

        return {
            "type": "lava",
            "clouds": clouds,
            "green_patches": green_patches,
            "lava_pools": lava_pools,
            "secondary_clouds": secondary_clouds,
            "surface_properties": {
                "heat_distortion": rng.uniform(0.4, 0.8),
                "volcanic_activity": rng.uniform(0.6, 1.0),
                "ash_density": rng.uniform(0.5, 0.9),
                "lava_glow": rng.uniform(0.7, 0.95),
            },
            "debug": {
                "original_planet_radius": planet_radius,
                "center_x": center_x,
                "center_y": center_y,
                "cloud_count": num_clouds,
                "landmass_count": num_landmasses,
                "lava_pool_count": num_lava_pools,
                "secondary_cloud_count": num_secondary_clouds,
                "avg_landmass_size": sum([lm["size"] for lm in green_patches]) / len(green_patches) if green_patches else 0,
            },
        }

    def translate_arid(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:

        num_secondary_clouds = rng.randint(6, 12)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(12, 25)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(0.6, 1.2)})

        return {"type": "arid", "secondary_clouds": secondary_clouds, "debug": {"secondary_cloud_count": num_secondary_clouds}}

    def translate_swamp(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        num_clouds = rng.randint(12, 20)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(25, 45)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            swamp_cloud_colors = [[0.7, 0.8, 0.6, 0.7], [0.8, 0.85, 0.75, 0.6], [0.6, 0.7, 0.5, 0.8], [0.75, 0.8, 0.7, 0.65]]

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": rng.choice(swamp_cloud_colors), "seed": f"{planet_name}_cloud_{i}"})

        num_green_patches = rng.randint(8, 16)
        green_patches = []
        for i in range(num_green_patches):
            patch_size = rng.uniform(0.15, 0.35)

            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            swamp_colors = [[0.3, 0.4, 0.2, 0.8], [0.4, 0.3, 0.2, 0.85], [0.2, 0.3, 0.2, 0.75], [0.35, 0.35, 0.25, 0.8], [0.25, 0.4, 0.3, 0.9]]

            green_patches.append({"position_3d": [x, y, z], "size": patch_size, "color": rng.choice(swamp_colors), "seed": f"{planet_name}_green_patch_{i}", "sides": rng.randint(8, 14)})

        num_secondary_clouds = rng.randint(16, 26)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(20, 38)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(1.6, 2.8)})

        num_bubble_areas = rng.randint(6, 12)
        toxic_bubbles = {"bubble_count": rng.randint(12, 18), "bubble_size": planet_radius * rng.uniform(0.006, 0.012), "rise_speed": rng.uniform(0.018, 0.028), "expansion_rate": rng.uniform(0.012, 0.022), "pop_distance": planet_radius * rng.uniform(0.28, 0.42), "color": [rng.uniform(0.4, 0.6), rng.uniform(0.6, 0.8), rng.uniform(0.3, 0.5)], "opacity": rng.uniform(0.5, 0.75), "emission_rate": rng.uniform(1.8, 3.2), "emission_areas": []}

        for i in range(num_bubble_areas):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            toxic_bubbles["emission_areas"].append({"position_3d": [x, y, z], "intensity": rng.uniform(0.6, 1.2), "radius": rng.uniform(0.05, 0.15), "seed": f"{planet_name}_bubble_area_{i}"})

        return {"type": "swamp", "clouds": clouds, "green_patches": green_patches, "secondary_clouds": secondary_clouds, "toxic_bubbles": toxic_bubbles, "surface_properties": {"humidity": rng.uniform(0.8, 0.95), "vegetation_density": rng.uniform(0.6, 0.9), "water_coverage": rng.uniform(0.3, 0.7), "mud_depth": rng.uniform(0.4, 0.8), "mist_density": rng.uniform(0.5, 0.85)}, "debug": {"original_planet_radius": planet_radius, "center_x": center_x, "center_y": center_y, "cloud_count": num_clouds, "green_patch_count": num_green_patches, "secondary_cloud_count": num_secondary_clouds, "bubble_area_count": num_bubble_areas, "swamp_coverage": "high_humidity_wetland_coverage"}}

    def translate_tundra(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        tundra_colors = [
            [0.85, 0.80, 0.75],
            [0.88, 0.85, 0.82],
            [0.80, 0.82, 0.78],
            [0.82, 0.85, 0.83],
            [0.90, 0.88, 0.88],
        ]

        num_land_patches = rng.randint(8, 15)
        green_patches = []

        for i in range(num_land_patches):
            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            patch_3d_x = math.sin(phi) * math.cos(theta)
            patch_3d_y = math.sin(phi) * math.sin(theta)
            patch_3d_z = math.cos(phi)

            patch_angle = rng.uniform(0, 2 * math.pi)
            patch_distance = rng.uniform(0.4 * planet_radius, planet_radius)

            patch_x = center_x + patch_distance * math.cos(patch_angle)
            patch_y = center_y + patch_distance * math.sin(patch_angle)

            normalized_coords = self.common_utils.normalize_coordinates(patch_x, patch_y, center_x, center_y, planet_radius)

            patch_color = rng.choice(tundra_colors) + [0.25]

            green_patches.append({"position": normalized_coords, "position_3d": [patch_3d_x, patch_3d_y, patch_3d_z], "size": rng.uniform(0.04, 0.12), "color": patch_color, "sides": rng.randint(12, 25)})

        num_snow_patches = rng.randint(8, 15)
        ice_caps = []

        for i in range(num_snow_patches):
            polar_bias = rng.choice([-1, 1])
            latitude_bias = rng.uniform(0.3, 0.8) * polar_bias

            cap_x = center_x + rng.uniform(-planet_radius * 0.6, planet_radius * 0.6)
            cap_y = center_y + latitude_bias * planet_radius

            normalized_coords = self.common_utils.normalize_coordinates(cap_x, cap_y, center_x, center_y, planet_radius)

            snow_colors = [
                [0.95, 0.95, 0.98, 0.7],
                [0.90, 0.94, 0.98, 0.6],
                [0.88, 0.92, 0.95, 0.5],
            ]

            if i < num_snow_patches // 2:
                radius = rng.uniform(0.04, 0.12)
                opacity_boost = rng.uniform(0.6, 0.9)
            else:
                radius = rng.uniform(0.12, 0.22)
                opacity_boost = rng.uniform(0.5, 0.7)

            snow_color = rng.choice(snow_colors).copy()
            snow_color[3] = opacity_boost

            ice_caps.append({"position": normalized_coords, "radius": radius, "color": snow_color, "seed": f"{planet_name}_snow_{i}"})

        num_crystals = rng.randint(3, 8)
        crystals = []

        for _ in range(num_crystals):
            crystal_length = rng.randint(3, 8)
            crystal_width = rng.randint(4, 12)
            crystal_angle = rng.uniform(0, 2 * math.pi)

            polar_bias = rng.choice([-1, 1])
            polar_offset = rng.uniform(0.2 * planet_radius, 0.7 * planet_radius) * polar_bias
            crystal_x = center_x + rng.uniform(-0.5 * planet_radius, 0.5 * planet_radius)
            crystal_y = center_y + polar_offset

            normalized_coords = self.common_utils.normalize_coordinates(crystal_x, crystal_y, center_x, center_y, planet_radius)

            crystals.append({"position": normalized_coords, "length": crystal_length / planet_radius, "width": crystal_width / planet_radius, "angle": crystal_angle, "color": [0.85, 0.90, 0.95, 0.8]})

        num_clouds = rng.randint(4, 10)
        clouds = []

        for i in range(num_clouds):
            cloud_radius = rng.randint(20, 40)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = [
                [0.85, 0.87, 0.90, 0.8],
                [0.80, 0.82, 0.85, 0.7],
                [0.90, 0.91, 0.93, 0.6],
            ]

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": rng.choice(cloud_colors), "type": "cloud", "seed": f"{planet_name}_cloud_{i}"})

        return {"type": "tundra", "green_patches": green_patches, "ice_caps": ice_caps, "crystals": crystals, "clouds": clouds, "debug": {"original_planet_radius": planet_radius, "center_x": center_x, "center_y": center_y, "land_patch_count": num_land_patches, "snow_patch_count": num_snow_patches, "small_mounds_count": num_snow_patches // 2, "large_patches_count": num_snow_patches - (num_snow_patches // 2), "crystal_count": num_crystals, "cloud_count": num_clouds}}

    def translate_forest(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        num_clouds = rng.randint(10, 18)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(25, 45)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = [
                [1.0, 1.0, 1.0, 0.8],
                [0.95, 1.0, 0.95, 0.7],
                [0.98, 1.0, 0.98, 0.9],
                [0.90, 0.98, 0.92, 0.6],
            ]

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": rng.choice(cloud_colors), "type": "cloud", "seed": f"{planet_name}_forest_cloud_{i}"})

        num_landmasses = rng.randint(8, 15)
        green_patches = []

        for i in range(num_landmasses):
            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            position_3d = [math.sin(phi) * math.cos(theta), math.sin(phi) * math.sin(theta), math.cos(phi)]

            if i < 4:
                size = rng.uniform(0.18, 0.35)
            elif i < 8:
                size = rng.uniform(0.12, 0.22)
            else:
                size = rng.uniform(0.08, 0.15)

            forest_color_choices = [[0.13, 0.35, 0.13], [0.18, 0.42, 0.16], [0.10, 0.30, 0.10], [0.20, 0.45, 0.18], [0.15, 0.38, 0.14]]

            green_patches.append({"position_3d": position_3d, "size": size, "color": rng.choice(forest_color_choices) + [rng.uniform(0.85, 0.95)], "sides": rng.randint(16, 24), "height": rng.uniform(0.015, 0.04), "vegetation_density": rng.uniform(0.8, 1.0)})

        num_vegetation_patches = rng.randint(15, 30)
        vegetation_patches = []

        for i in range(num_vegetation_patches):
            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            position_3d = [math.sin(phi) * math.cos(theta), math.sin(phi) * math.sin(theta), math.cos(phi)]

            vegetation_size = rng.uniform(0.08, 0.25)

            vegetation_colors = [[0.20, 0.45, 0.15], [0.15, 0.40, 0.12], [0.25, 0.50, 0.18], [0.12, 0.35, 0.10], [0.18, 0.42, 0.14]]

            vegetation_patches.append({"position_3d": position_3d, "size": vegetation_size, "color": rng.choice(vegetation_colors), "vegetation_type": rng.choice(["dense_forest", "mixed_forest", "woodland", "grove"]), "canopy_height": rng.uniform(0.02, 0.05), "tree_density": rng.uniform(0.7, 0.95)})

        num_secondary_clouds = rng.randint(16, 24)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(22, 38)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(1.4, 2.4)})

        return {"type": "forest", "clouds": clouds, "green_patches": green_patches, "vegetation": vegetation_patches, "secondary_clouds": secondary_clouds, "debug": {"original_planet_radius": planet_radius, "center_x": center_x, "center_y": center_y, "cloud_count": num_clouds, "landmass_count": num_landmasses, "vegetation_patch_count": num_vegetation_patches, "secondary_cloud_count": num_secondary_clouds, "largest_landmass_size": max([lm["size"] for lm in green_patches]) if green_patches else 0, "forest_coverage": "high_density_coverage"}}

    def translate_savannah(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        savannah_colors = [
            [244 / 255.0, 164 / 255.0, 96 / 255.0],
            [199 / 255.0, 113 / 255.0, 40 / 255.0],
            [110 / 255.0, 59 / 255.0, 16 / 255.0],
            [139 / 255.0, 69 / 255.0, 19 / 255.0],
            [222 / 255.0, 184 / 255.0, 135 / 255.0],
            [205 / 255.0, 133 / 255.0, 63 / 255.0],
        ]

        num_green_patches = rng.randint(12, 20)
        green_patches = []

        for _ in range(num_green_patches):
            patch_size = rng.randint(8, 60)

            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            patch_3d_x = math.sin(phi) * math.cos(theta)
            patch_3d_y = math.sin(phi) * math.sin(theta)
            patch_3d_z = math.cos(phi)

            patch_angle = rng.uniform(0, 2 * math.pi)
            patch_distance = rng.uniform(0.4 * planet_radius, planet_radius)

            patch_x = center_x + patch_distance * math.cos(patch_angle)
            patch_y = center_y + patch_distance * math.sin(patch_angle)

            normalized_coords = self.common_utils.normalize_coordinates(patch_x, patch_y, center_x, center_y, planet_radius)

            patch_color = rng.choice(savannah_colors) + [rng.uniform(0.6, 0.9)]

            green_patches.append({"position": normalized_coords, "position_3d": [patch_3d_x, patch_3d_y, patch_3d_z], "size": patch_size / planet_radius, "color": patch_color, "sides": rng.randint(15, 25)})

        num_clouds = rng.randint(6, 12)
        clouds = []

        for i in range(num_clouds):
            cloud_radius = rng.randint(30, int(planet_radius * 0.4))
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": [244 / 255.0, 164 / 255.0, 96 / 255.0, 0.8], "seed": f"{planet_name}_cloud_{i}"})

        num_secondary_clouds = rng.randint(12, 20)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(20, 35)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(1.2, 2.2)})

        return {
            "type": "savannah",
            "green_patches": green_patches,
            "clouds": clouds,
            "secondary_clouds": secondary_clouds,
            "surface_properties": {
                "dryness": rng.uniform(0.6, 0.8),
                "vegetation_density": rng.uniform(0.3, 0.6),
                "soil_color_variation": rng.uniform(0.7, 0.9),
                "wind_erosion": rng.uniform(0.4, 0.7),
            },
            "debug": {"original_planet_radius": planet_radius, "center_x": center_x, "center_y": center_y, "cloud_count": num_clouds, "terrain_patch_count": num_green_patches, "secondary_cloud_count": num_secondary_clouds, "largest_patch_size": max([lm["size"] for lm in green_patches]) if green_patches else 0, "savannah_coverage": "mixed_terrain_coverage"},
        }

    def translate_cave(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        num_clouds = rng.randint(8, 15)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(20, 40)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = ["#c0c0c0", "#a8a8a8", "#d0d0d0", "#b8b8b8", "#e0e0e0"]

            clouds.append({"position_3d": normalized_coords, "radius": cloud_radius / planet_radius, "density": rng.uniform(0.6, 0.9), "color": rng.choice(cloud_colors), "opacity": rng.uniform(0.5, 0.8), "movement_speed": rng.uniform(0.002, 0.008), "vertical_offset": rng.uniform(-0.1, 0.1)})

        num_landmasses = rng.randint(6, 12)
        green_patches = []
        for i in range(num_landmasses):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            position_3d = [math.sin(phi) * math.cos(theta), math.sin(phi) * math.sin(theta), math.cos(phi)]

            if i < 4:
                size = rng.uniform(0.20, 0.40)
            elif i < 8:
                size = rng.uniform(0.12, 0.25)
            else:
                size = rng.uniform(0.08, 0.15)

            landmass_color_choices = [[0.29, 0.25, 0.21], [0.36, 0.29, 0.23], [0.24, 0.20, 0.16], [0.32, 0.27, 0.22], [0.42, 0.36, 0.31]]

            green_patches.append({"position_3d": position_3d, "size": size, "color": rng.choice(landmass_color_choices) + [rng.uniform(0.75, 0.90)], "sides": rng.randint(12, 20), "height": rng.uniform(0.02, 0.06), "roughness": rng.uniform(0.6, 0.9)})

        num_holes = rng.randint(115, 130)
        cave_holes = []
        for i in range(num_holes):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            position_3d = [math.sin(phi) * math.cos(theta), math.sin(phi) * math.sin(theta), math.cos(phi)]

            cave_holes.append({"position_3d": position_3d, "radius": rng.uniform(0.03, 0.10), "depth": rng.uniform(0.02, 0.05), "roughness": rng.uniform(0.4, 0.8), "color_variation": rng.uniform(0.2, 0.5)})

        num_secondary_clouds = rng.randint(8, 16)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(15, 28)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(0.8, 1.4)})

        return {"type": "cave", "atmosphere_clouds": {"clouds": clouds}, "green_patches": green_patches, "secondary_clouds": secondary_clouds, "cave_holes": {"holes": cave_holes, "base_color": "#4a3f36", "hole_color": "#1a1512"}}

    def translate_crystalline(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        return {
            "type": "crystalline",
        }

    def translate_toxic(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        num_clouds = rng.randint(10, 16)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(20, 40)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = [
                [0.5, 0.0, 0.5, 0.85],
                [0.6, 0.1, 0.6, 0.8],
                [0.4, 0.0, 0.4, 0.9],
                [0.7, 0.2, 0.7, 0.75],
                [0.45, 0.05, 0.45, 0.88],
            ]

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": rng.choice(cloud_colors), "type": "cloud", "seed": f"{planet_name}_toxic_cloud_{i}"})

        num_toxic_patches = rng.randint(12, 20)
        green_patches = []

        for i in range(num_toxic_patches):
            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            patch_3d_x = math.sin(phi) * math.cos(theta)
            patch_3d_y = math.sin(phi) * math.sin(theta)
            patch_3d_z = math.cos(phi)

            patch_angle = rng.uniform(0, 2 * math.pi)
            patch_distance = rng.uniform(0.2 * planet_radius, planet_radius)

            patch_x = center_x + patch_distance * math.cos(patch_angle)
            patch_y = center_y + patch_distance * math.sin(patch_angle)

            normalized_coords = self.common_utils.normalize_coordinates(patch_x, patch_y, center_x, center_y, planet_radius)

            toxic_purples = [
                [0.5, 0.0, 0.5],
                [0.4, 0.0, 0.4],
                [0.6, 0.1, 0.6],
                [0.45, 0.05, 0.45],
                [0.55, 0.15, 0.55],
            ]

            green_patches.append({"position": normalized_coords, "position_3d": [patch_3d_x, patch_3d_y, patch_3d_z], "size": rng.uniform(0.1, 0.3), "color": rng.choice(toxic_purples) + [rng.uniform(0.7, 0.9)], "sides": rng.randint(15, 25), "toxicity_level": rng.uniform(0.6, 1.0), "glow_intensity": rng.uniform(0.4, 0.7)})

        return {"type": "toxic", "clouds": clouds, "green_patches": green_patches, "debug": {"original_planet_radius": planet_radius, "center_x": center_x, "center_y": center_y, "cloud_count": num_clouds, "toxic_patch_count": num_toxic_patches, "toxicity_coverage": "high_contamination_coverage"}}

    def translate_radioactive(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        num_clouds = rng.randint(12, 18)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(25, 45)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = [
                [0.4, 0.8, 0.2, 0.8],
                [0.5, 0.9, 0.1, 0.9],
                [0.3, 0.7, 0.15, 0.85],
                [0.6, 1.0, 0.3, 0.7],
            ]

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": rng.choice(cloud_colors), "type": "cloud", "seed": f"{planet_name}_radioactive_cloud_{i}"})

        num_green_patches = rng.randint(15, 25)
        green_patches = []

        for i in range(num_green_patches):
            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            patch_3d_x = math.sin(phi) * math.cos(theta)
            patch_3d_y = math.sin(phi) * math.sin(theta)
            patch_3d_z = math.cos(phi)

            patch_angle = rng.uniform(0, 2 * math.pi)
            patch_distance = rng.uniform(0.3 * planet_radius, planet_radius)

            patch_x = center_x + patch_distance * math.cos(patch_angle)
            patch_y = center_y + patch_distance * math.sin(patch_angle)

            normalized_coords = self.common_utils.normalize_coordinates(patch_x, patch_y, center_x, center_y, planet_radius)

            radioactive_greens = [[0.2, 0.8, 0.1], [0.15, 0.7, 0.05], [0.25, 0.9, 0.15], [0.3, 0.85, 0.2], [0.18, 0.75, 0.08]]

            green_patches.append({"position": normalized_coords, "position_3d": [patch_3d_x, patch_3d_y, patch_3d_z], "size": rng.uniform(0.15, 0.35), "color": rng.choice(radioactive_greens) + [rng.uniform(0.8, 0.95)], "sides": rng.randint(18, 30), "radiation_level": rng.uniform(0.7, 1.0), "glow_intensity": rng.uniform(0.6, 0.9)})

        num_secondary_clouds = rng.randint(15, 25)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(20, 35)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(1.5, 2.8)})

        return {"type": "radioactive", "clouds": clouds, "green_patches": green_patches, "secondary_clouds": secondary_clouds, "debug": {"original_planet_radius": planet_radius, "center_x": center_x, "center_y": center_y, "cloud_count": num_clouds, "green_patch_count": num_green_patches, "secondary_cloud_count": num_secondary_clouds, "radiation_coverage": "high_contamination_coverage"}}

    def translate_magma(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        num_clouds = rng.randint(10, 16)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(20, 40)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = [
                [0.85, 0.35, 0.05, 0.8],
                [0.75, 0.25, 0.02, 0.9],
                [0.90, 0.45, 0.10, 0.7],
                [0.65, 0.20, 0.01, 0.85],
            ]

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": rng.choice(cloud_colors), "type": "cloud", "seed": f"{planet_name}_magma_cloud_{i}"})

        num_landmasses = rng.randint(10, 18)
        green_patches = []

        for i in range(num_landmasses):
            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            position_3d = [math.sin(phi) * math.cos(theta), math.sin(phi) * math.sin(theta), math.cos(phi)]

            if i < 5:
                size = rng.uniform(0.15, 0.30)
            elif i < 10:
                size = rng.uniform(0.10, 0.20)
            else:
                size = rng.uniform(0.06, 0.12)

            magma_color_choices = [
                [0.53, 0.14, 0.0],
                [0.79, 0.22, 0.01],
                [0.85, 0.27, 0.0],
                [0.60, 0.18, 0.0],
                [0.70, 0.25, 0.05],
            ]

            green_patches.append({"position_3d": position_3d, "size": size, "color": rng.choice(magma_color_choices) + [rng.uniform(0.85, 0.95)], "sides": rng.randint(18, 28), "heat_intensity": rng.uniform(0.8, 1.0), "flow_speed": rng.uniform(0.002, 0.008), "temperature": rng.uniform(1200, 1800)})

        num_magma_lakes = rng.randint(10, 16)
        magma_lakes = []

        for i in range(num_magma_lakes):
            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            position_3d = [math.sin(phi) * math.cos(theta), math.sin(phi) * math.sin(theta), math.cos(phi)]

            lake_size = rng.uniform(0.45, 0.60)

            magma_lakes.append({"position_3d": position_3d, "radius": lake_size, "color": [0.85, 0.27, 0.0, 1.0], "temperature": rng.uniform(1500, 2000), "bubble_activity": rng.uniform(0.6, 1.0), "glow_intensity": rng.uniform(0.8, 1.0)})

        num_secondary_clouds = rng.randint(20, 30)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(22, 38)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(2.5, 3.5)})

        return {"type": "magma", "clouds": clouds, "green_patches": green_patches, "magma_lakes": magma_lakes, "secondary_clouds": secondary_clouds, "surface_properties": {"heat_distortion": rng.uniform(0.3, 0.7), "lava_glow": rng.uniform(0.8, 1.0), "flow_animation": True, "emission_intensity": rng.uniform(0.6, 0.9), "viscosity": rng.uniform(0.4, 0.8)}, "debug": {"original_planet_radius": planet_radius, "center_x": center_x, "center_y": center_y, "cloud_count": num_clouds, "landmass_count": num_landmasses, "magma_lake_count": num_magma_lakes, "secondary_cloud_count": num_secondary_clouds, "avg_landmass_size": sum([lm["size"] for lm in green_patches]) / len(green_patches) if green_patches else 0, "magma_coverage": "high_density_molten_coverage"}}

    def translate_molten_core(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        num_clouds = rng.randint(12, 20)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(35, 60)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = [
                [1.0, 0.9, 0.7, 0.85],
                [1.0, 0.85, 0.6, 0.8],
                [0.95, 0.82, 0.65, 0.9],
                [1.0, 0.88, 0.75, 0.75],
            ]

            cloud_color = rng.choice(cloud_colors)

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": cloud_color, "type": "cloud", "seed": f"{planet_name}_molten_cloud_{i}"})

        num_secondary_clouds = rng.randint(22, 32)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(30, 45)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(3.0, 4.0)})

        return {"type": "molten_core", "clouds": clouds, "secondary_clouds": secondary_clouds, "debug": {"cloud_count": len(clouds), "secondary_cloud_count": num_secondary_clouds, "avg_cloud_radius": sum(c["radius"] for c in clouds) / len(clouds) if clouds else 0, "planet_radius": planet_radius}}

    def translate_carbon(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str, orbital_period_years: float = 8.0) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        num_clouds = rng.randint(6, 12)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(15, 30)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = [
                [0.4, 0.4, 0.4, 0.7],
                [0.5, 0.5, 0.5, 0.6],
                [0.3, 0.3, 0.3, 0.8],
                [0.45, 0.45, 0.45, 0.5],
            ]

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": rng.choice(cloud_colors), "type": "cloud", "seed": f"{planet_name}_carbon_cloud_{i}"})

        num_landmasses = rng.randint(4, 10)
        green_patches = []

        for i in range(num_landmasses):
            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            position_3d = [math.sin(phi) * math.cos(theta), math.sin(phi) * math.sin(theta), math.cos(phi)]

            if i < 3:
                size = rng.uniform(0.25, 0.45)
            elif i < 6:
                size = rng.uniform(0.15, 0.28)
            else:
                size = rng.uniform(0.08, 0.18)

            carbon_grays = [
                [0.05, 0.05, 0.05],
                [0.04, 0.04, 0.04],
                [0.06, 0.06, 0.06],
                [0.03, 0.03, 0.03],
            ]

            green_patches.append({"position_3d": position_3d, "size": size, "color": rng.choice(carbon_grays) + [rng.uniform(0.7, 0.9)], "sides": rng.randint(12, 24), "roughness": rng.uniform(0.8, 0.95)})

        surface_properties = {"roughness": rng.uniform(0.85, 0.95), "metalness": rng.uniform(0.0, 0.08), "mineral_spots": rng.random() < 0.4, "mineral_intensity": rng.uniform(0.2, 0.4), "bump_scale": rng.uniform(0.015, 0.025), "normal_scale": rng.uniform(0.4, 0.6), "specular_intensity": rng.uniform(0.05, 0.12), "crater_density": rng.uniform(6.0, 10.0), "surface_roughness": rng.uniform(0.12, 0.18)}

        carbon_trails_data = None
        if rng.random() < 0.33:
            cycle_duration_years = rng.uniform(orbital_period_years * 0.3, orbital_period_years * 0.5)
            visible_duration_years = rng.uniform(cycle_duration_years * 0.4, cycle_duration_years * 0.7)
            phase_offset_years = rng.uniform(0, cycle_duration_years)

            carbon_trails_data = {"enabled": True, "cycle_duration_years": cycle_duration_years, "visible_duration_years": visible_duration_years, "phase_offset_years": phase_offset_years, "debug_orbital": {"orbital_period_years": orbital_period_years, "cycle_duration_years": cycle_duration_years, "visible_duration_years": visible_duration_years, "visible_percentage": (visible_duration_years / cycle_duration_years) * 100, "cycles_per_orbit": orbital_period_years / cycle_duration_years, "visibility_windows": f"Visible for {visible_duration_years:.2f} years every {cycle_duration_years:.2f} years"}}

        num_secondary_clouds = rng.randint(14, 22)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(18, 32)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(1.0, 1.8)})

        return {"type": "carbon", "clouds": clouds, "green_patches": green_patches, "secondary_clouds": secondary_clouds, "surface_properties": surface_properties, "carbon_trails_data": carbon_trails_data, "debug": {"original_planet_radius": planet_radius, "center_x": center_x, "center_y": center_y, "cloud_count": num_clouds, "landmass_count": num_landmasses, "secondary_cloud_count": num_secondary_clouds, "surface_roughness": surface_properties["roughness"], "mineral_spots_enabled": surface_properties["mineral_spots"], "has_carbon_trails": carbon_trails_data is not None}}

    def translate_diamond(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:

        base_color = [rng.uniform(0.95, 1.0), rng.uniform(0.95, 1.0), rng.uniform(0.95, 1.0)]

        surface_properties = {"refraction": rng.uniform(2.0, 2.8), "dispersion": rng.uniform(0.4, 0.8), "clarity": rng.uniform(0.7, 0.95), "facet_size": rng.uniform(8.0, 25.0), "brilliance": rng.uniform(1.8, 3.2), "prismatic": rng.uniform(0.5, 0.9)}

        effects_3d = []

        effects_3d.append({"type": "atmospheric_streaks", "params": {"color": [rng.uniform(0.9, 1.0), rng.uniform(0.9, 1.0), rng.uniform(0.95, 1.0)], "particleCount": rng.randint(80, 200), "speed": rng.uniform(0.3, 0.8), "sparkle": True}, "priority": 15})

        num_clouds = rng.randint(6, 12)
        clouds = []
        center_x, center_y = 200, 200

        for i in range(num_clouds):
            cloud_radius = rng.randint(18, 35)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = [
                [0.98, 0.98, 1.0, 0.7],
                [1.0, 0.95, 0.98, 0.8],
                [0.95, 0.98, 1.0, 0.6],
                [0.98, 1.0, 0.95, 0.9],
            ]

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": rng.choice(cloud_colors), "type": "cloud", "seed": f"{planet_name}_diamond_cloud_{i}"})

        num_secondary_clouds = rng.randint(10, 18)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(18, 30)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(0.8, 1.6)})

        return {"type": "diamond", "base_color": base_color, "surface": surface_properties, "effects_3d": effects_3d, "clouds": clouds, "secondary_clouds": secondary_clouds, "debug": {"original_planet_radius": planet_radius, "center_x": center_x, "center_y": center_y, "cloud_count": num_clouds, "secondary_cloud_count": num_secondary_clouds}}

    def translate_super_earth(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        num_clouds = rng.randint(12, 20)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(30, 50)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = [
                [1.0, 1.0, 1.0, 0.9],
                [0.95, 0.98, 1.0, 0.8],
                [0.98, 1.0, 0.98, 0.85],
                [0.90, 0.95, 1.0, 0.7],
            ]

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": rng.choice(cloud_colors), "type": "cloud", "seed": f"{planet_name}_super_earth_cloud_{i}"})

        num_landmasses = rng.randint(6, 12)
        green_patches = []

        for i in range(num_landmasses):
            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            position_3d = [math.sin(phi) * math.cos(theta), math.sin(phi) * math.sin(theta), math.cos(phi)]

            if i < 3:
                size = rng.uniform(0.35, 0.55)
            elif i < 6:
                size = rng.uniform(0.25, 0.40)
            else:
                size = rng.uniform(0.15, 0.28)

            landmass_color_choices = [
                [0.20, 0.40, 0.15],
                [0.35, 0.28, 0.18],
                [0.25, 0.45, 0.20],
                [0.18, 0.35, 0.12],
                [0.40, 0.32, 0.22],
                [0.22, 0.42, 0.18],
                [0.30, 0.25, 0.15],
            ]

            green_patches.append({"position_3d": position_3d, "size": size, "color": rng.choice(landmass_color_choices) + [rng.uniform(0.80, 0.95)], "sides": rng.randint(20, 35), "height": rng.uniform(0.025, 0.055), "biome_diversity": rng.uniform(0.7, 0.95), "continental_scale": True})

        num_secondary_clouds = rng.randint(18, 28)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(25, 40)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(1.5, 2.5)})

        return {"type": "super_earth", "clouds": clouds, "green_patches": green_patches, "secondary_clouds": secondary_clouds, "debug": {"original_planet_radius": planet_radius, "center_x": center_x, "center_y": center_y, "cloud_count": num_clouds, "landmass_count": num_landmasses, "secondary_cloud_count": num_secondary_clouds, "largest_landmass_size": max([lm["size"] for lm in green_patches]) if green_patches else 0, "continental_coverage": "massive_super_continental_scale"}}

    def translate_sub_earth(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        num_clouds = rng.randint(6, 10)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(15, 25)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = [
                [0.95, 0.95, 0.95, 0.7],
                [0.92, 0.95, 0.98, 0.6],
                [0.94, 0.98, 0.94, 0.65],
                [0.88, 0.92, 0.98, 0.5],
            ]

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": rng.choice(cloud_colors), "type": "cloud", "seed": f"{planet_name}_sub_earth_cloud_{i}"})

        num_landmasses = rng.randint(8, 15)
        green_patches = []

        for i in range(num_landmasses):
            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            position_3d = [math.sin(phi) * math.cos(theta), math.sin(phi) * math.sin(theta), math.cos(phi)]

            if i < 2:
                size = rng.uniform(0.15, 0.25)
            elif i < 6:
                size = rng.uniform(0.08, 0.18)
            else:
                size = rng.uniform(0.04, 0.12)

            landmass_color_choices = [
                [0.20, 0.40, 0.15],
                [0.35, 0.28, 0.18],
                [0.25, 0.45, 0.20],
                [0.18, 0.35, 0.12],
                [0.40, 0.32, 0.22],
                [0.22, 0.42, 0.18],
                [0.30, 0.25, 0.15],
            ]

            green_patches.append({"position_3d": position_3d, "size": size, "color": rng.choice(landmass_color_choices) + [rng.uniform(0.75, 0.90)], "sides": rng.randint(12, 25), "height": rng.uniform(0.015, 0.035), "biome_diversity": rng.uniform(0.5, 0.8), "continental_scale": False})

        num_secondary_clouds = rng.randint(12, 20)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(20, 35)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(1.2, 2.0)})

        return {"type": "sub_earth", "clouds": clouds, "green_patches": green_patches, "secondary_clouds": secondary_clouds, "savannah_terrain_layer": True, "debug": {"original_planet_radius": planet_radius, "center_x": center_x, "center_y": center_y, "cloud_count": num_clouds, "landmass_count": num_landmasses, "secondary_cloud_count": num_secondary_clouds, "largest_landmass_size": max([lm["size"] for lm in green_patches]) if green_patches else 0, "continental_coverage": "small_sub_earth_scale"}}

    def translate_frozen_gas_giant(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str, orbital_period_years: float = 30.0) -> Dict[str, Any]:

        num_bands = rng.randint(4, 15)
        rotation_angle = rng.uniform(-10, 10) * math.pi / 180

        band_positions = []
        band_widths = []
        center_y = 200

        for i in range(num_bands):
            band_width = rng.randint(3, 6)
            band_position_y = rng.randint(center_y - planet_radius, center_y + planet_radius)
            normalized_y = 1.0 - 2.0 * (band_position_y - 100) / 200
            band_positions.append(normalized_y)
            band_widths.append(band_width / planet_radius)

        while len(band_positions) < 20:
            band_positions.append(0)
            band_widths.append(0)

        polar_hexagon = None
        if rng.random() < 0.4:
            cycle_duration_years = rng.uniform(orbital_period_years * 0.3, orbital_period_years * 0.5)
            visible_duration_years = rng.uniform(cycle_duration_years * 0.4, cycle_duration_years * 0.8)
            phase_offset_years = rng.uniform(0, cycle_duration_years)

            pole = rng.choice(["north", "south"])

            polar_hexagon = {"enabled": True, "pole": pole, "radius": rng.uniform(0.18, 0.28), "rotation_speed": rng.uniform(0.0005, 0.002), "color_darken_factor": rng.uniform(0.12, 0.20), "cycle_duration_years": cycle_duration_years, "visible_duration_years": visible_duration_years, "phase_offset_years": phase_offset_years, "opacity": rng.uniform(0.7, 0.95)}

        num_secondary_clouds = rng.randint(20, 35)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(20, 40)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(0.8, 2.0)})

        num_atmosphere_clouds = rng.randint(12, 20)
        clouds = []
        center_x, center_y = 200, 200

        for i in range(num_atmosphere_clouds):
            cloud_radius = rng.randint(25, 50)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = ["#ffffff", "#f0f8ff", "#e6f3ff", "#f5f5ff", "#e0f6ff", "#f8f8ff", "#e8e8ff", "#f0f0ff"]

            clouds.append({"x": normalized_coords[0], "y": normalized_coords[1], "radius": cloud_radius, "color": rng.choice(cloud_colors), "opacity": rng.uniform(0.7, 0.95), "type": "cloud", "seed": f"{planet_name}_atmosphere_cloud_{i}"})

        return {"type": "frozen_gas_giant", "cloud_bands": {"num_bands": num_bands, "positions": band_positions, "widths": band_widths, "rotation": rotation_angle}, "polar_hexagon": polar_hexagon, "secondary_clouds": secondary_clouds, "atmosphere_clouds": {"clouds": clouds}, "icy_tint": True, "debug": {"has_hexagon": polar_hexagon is not None, "secondary_cloud_count": num_secondary_clouds, "atmosphere_cloud_count": num_atmosphere_clouds}}

    def translate_nebulous(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str, orbital_period_years: float = 20.0) -> Dict[str, Any]:
        import math

        num_swirls = rng.randint(5, 12)
        swirl_patterns = []

        for i in range(num_swirls):
            theta = rng.uniform(0, 2 * math.pi)
            radius = rng.uniform(0.2, 0.8)
            swirl_patterns.append({"angle": theta, "radius": radius, "intensity": rng.uniform(0.3, 0.8), "color_shift": rng.uniform(-0.2, 0.2)})

        num_clouds = rng.randint(12, 20)
        clouds = []
        for i in range(num_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(30, 50)

            cloud_colors = [
                [0.6, 0.4, 0.9, 0.7],
                [0.4, 0.6, 1.0, 0.6],
                [0.9, 0.5, 0.7, 0.8],
                [0.5, 0.8, 0.9, 0.65],
                [0.8, 0.6, 1.0, 0.75],
                [0.7, 0.9, 0.6, 0.7],
            ]

            clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "color": rng.choice(cloud_colors), "type": "cloud", "seed": f"{planet_name}_nebula_cloud_{i}"})

        num_secondary_clouds = rng.randint(20, 35)
        secondary_clouds = []
        for i in range(num_secondary_clouds):

            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(20, 40)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(0.8, 2.5)})

        polar_hexagon = None
        if rng.random() < 0.35:
            cycle_duration_years = rng.uniform(orbital_period_years * 0.3, orbital_period_years * 0.5)
            visible_duration_years = rng.uniform(cycle_duration_years * 0.35, cycle_duration_years * 0.75)
            phase_offset_years = rng.uniform(0, cycle_duration_years)

            pole = rng.choice(["north", "south"])

            polar_hexagon = {"enabled": True, "pole": pole, "radius": rng.uniform(0.16, 0.26), "rotation_speed": rng.uniform(0.0008, 0.0025), "color_darken_factor": rng.uniform(0.18, 0.28), "cycle_duration_years": cycle_duration_years, "visible_duration_years": visible_duration_years, "phase_offset_years": phase_offset_years, "opacity": rng.uniform(0.5, 0.85), "nebula_blend": True}

        return {"type": "nebulous", "swirl_patterns": swirl_patterns, "polar_hexagon": polar_hexagon, "clouds": clouds, "secondary_clouds": secondary_clouds, "nebula_density": rng.uniform(0.4, 0.8), "color_variance": rng.uniform(0.1, 0.3), "debug": {"has_hexagon": polar_hexagon is not None, "swirl_count": num_swirls, "cloud_count": num_clouds, "secondary_cloud_count": num_secondary_clouds}}

    def translate_aquifer(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        num_clouds = rng.randint(8, 15)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(20, 45)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            cloud_colors = [
                [1.0, 1.0, 1.0, 0.8],
                [0.95, 0.98, 1.0, 0.7],
                [0.90, 0.95, 1.0, 0.9],
                [0.98, 1.0, 1.0, 0.6],
            ]

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": rng.choice(cloud_colors), "type": "cloud", "seed": f"{planet_name}_aquifer_cloud_{i}"})

        ocean_currents = {
            "intensity": rng.uniform(0.3, 0.8),
            "scale": rng.uniform(1.0, 3.0),
            "speed": rng.uniform(0.1, 0.4),
            "opacity": rng.uniform(0.15, 0.35),
            "current_color": [
                rng.uniform(0.25, 0.35),
                rng.uniform(0.55, 0.65),
                rng.uniform(0.50, 0.60),
            ],
            "deep_current_color": [
                rng.uniform(0.15, 0.25),
                rng.uniform(0.35, 0.45),
                rng.uniform(0.30, 0.40),
            ],
        }

        num_secondary_clouds = rng.randint(20, 30)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(25, 40)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(1.8, 2.8)})

        return {"type": "aquifer", "clouds": clouds, "ocean_currents": ocean_currents, "secondary_clouds": secondary_clouds, "debug": {"original_planet_radius": planet_radius, "center_x": center_x, "center_y": center_y, "cloud_count": num_clouds, "secondary_cloud_count": num_secondary_clouds, "ocean_currents_intensity": ocean_currents["intensity"], "ocean_currents_scale": ocean_currents["scale"]}}

    def translate_exotic(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str, orbital_period_years: float = 15.0) -> Dict[str, Any]:
        center_x, center_y = 200, 200

        num_clouds = rng.randint(8, 16)
        clouds = []
        for i in range(num_clouds):
            cloud_radius = rng.randint(15, 40)
            max_offset = planet_radius - cloud_radius
            cloud_x = center_x + rng.randint(-max_offset, max_offset)
            cloud_y = center_y + rng.randint(-max_offset, max_offset)

            normalized_coords = self.common_utils.normalize_coordinates(cloud_x, cloud_y, center_x, center_y, planet_radius)

            exotic_color = [rng.uniform(0.3, 1.0), rng.uniform(0.3, 1.0), rng.uniform(0.3, 1.0), rng.uniform(0.5, 0.9)]

            clouds.append({"position": normalized_coords, "radius": cloud_radius / planet_radius, "color": exotic_color, "type": "cloud", "seed": f"{planet_name}_exotic_cloud_{i}"})

        num_small_shapes = rng.randint(12, 18)
        small_geometric_shapes = []

        for i in range(num_small_shapes):
            theta = rng.uniform(0, 2 * math.pi)
            phi = math.acos(rng.uniform(-1, 1))

            shape_3d_x = math.sin(phi) * math.cos(theta)
            shape_3d_y = math.sin(phi) * math.sin(theta)
            shape_3d_z = math.cos(phi)

            num_sides = rng.choice([3, 4, 5, 6, 7, 8])

            shape_color = [rng.uniform(0.4, 1.0), rng.uniform(0.4, 1.0), rng.uniform(0.4, 1.0), rng.uniform(0.6, 0.9)]

            small_geometric_shapes.append({"position_3d": [shape_3d_x, shape_3d_y, shape_3d_z], "sides": num_sides, "size": rng.uniform(0.02, 0.06), "rotation_speed": rng.uniform(-2.0, 2.0), "color": shape_color, "angle": rng.uniform(0, 2 * math.pi)})

        exotic_doodles = None
        doodle_roll = rng.random()
        if doodle_roll < 0.8:
            cycle_duration_years = rng.uniform(orbital_period_years * 0.3, orbital_period_years * 0.5)
            visible_duration_years = rng.uniform(cycle_duration_years * 0.25, cycle_duration_years * 0.6)
            phase_offset_years = rng.uniform(0, cycle_duration_years)

            exotic_doodles = {"enabled": True, "cycle_duration_years": cycle_duration_years, "visible_duration_years": visible_duration_years, "phase_offset_years": phase_offset_years, "debug_orbital": {"orbital_period_years": orbital_period_years, "cycle_duration_years": cycle_duration_years, "visible_duration_years": visible_duration_years, "visible_percentage": (visible_duration_years / cycle_duration_years) * 100, "cycles_per_orbit": orbital_period_years / cycle_duration_years, "visibility_windows": f"Visible for {visible_duration_years:.2f} years every {cycle_duration_years:.2f} years"}}

        num_secondary_clouds = rng.randint(15, 25)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(20, 35)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(1.8, 3.2)})

        return {"type": "exotic", "clouds": clouds, "small_geometric_shapes": small_geometric_shapes, "exotic_doodles": exotic_doodles, "secondary_clouds": secondary_clouds, "debug": {"original_planet_radius": planet_radius, "center_x": center_x, "center_y": center_y, "cloud_count": num_clouds, "small_shapes_count": num_small_shapes, "secondary_cloud_count": num_secondary_clouds, "has_exotic_doodles": exotic_doodles is not None, "doodles_generated_procedurally": True}}

    def translate_anomaly(self, planet_radius: int, rng: random.Random, seed: int, planet_name: str, orbital_period_years: float = 5.0) -> Dict[str, Any]:

        pulsating_cube = None
        if rng.random() < 0.7:
            cycle_duration_years = rng.uniform(orbital_period_years * 0.3, orbital_period_years * 0.5)
            visible_duration_years = rng.uniform(cycle_duration_years * 0.2, cycle_duration_years * 0.5)
            phase_offset_years = rng.uniform(0, cycle_duration_years)

            pulsating_cube = {"enabled": True, "cycle_duration_years": cycle_duration_years, "visible_duration_years": visible_duration_years, "phase_offset_years": phase_offset_years}

        num_secondary_clouds = rng.randint(10, 18)
        secondary_clouds = []
        for i in range(num_secondary_clouds):
            theta = rng.uniform(0, 2 * math.pi)
            phi = rng.uniform(0, math.pi)

            x = math.sin(phi) * math.cos(theta)
            y = math.sin(phi) * math.sin(theta)
            z = math.cos(phi)

            cloud_radius = rng.randint(16, 30)

            secondary_clouds.append({"position": [x, y, z], "radius": cloud_radius / planet_radius, "type": "secondary_cloud", "seed": f"{planet_name}_secondary_cloud_{i}", "turbulence": rng.uniform(2.0, 4.0)})

        return {"type": "anomaly", "pulsating_cube": pulsating_cube, "secondary_clouds": secondary_clouds, "debug": {"has_pulsating_cube": pulsating_cube is not None, "secondary_cloud_count": num_secondary_clouds}}
