# pymodules/planet_renderer/common_utils.py

import hashlib
import math
import random
from typing import Dict, Any, List


class CommonUtils:

    @staticmethod
    def generate_abstract_land_data(planet_radius: int, seed: int, planet_name: str, color: tuple, points_min: int, points_max: int, seg_min: int, seg_max: int) -> List[Dict[str, Any]]:

        planet_seed_string = f"{seed}-{planet_name}-{planet_radius}-{color}-{points_max}-{points_min}-{seg_min}-{seg_max}-abstract_land"
        planet_seed = int(hashlib.md5(planet_seed_string.encode()).hexdigest(), 16) & 0x7FFFFFFF

        rng = random.Random(planet_seed)
        center_x, center_y = 100, 100

        num_segments = rng.randint(seg_min, seg_max)
        segments = []

        for _ in range(num_segments):
            num_points = rng.randint(points_min, points_max)
            angle_offset = rng.uniform(0, 2 * math.pi)
            angle_step = 2 * math.pi / num_points

            origin_angle = rng.uniform(0, 2 * math.pi)
            origin_distance = rng.uniform(planet_radius * 0.8, planet_radius * 1.1)
            origin_x = center_x + origin_distance * math.cos(origin_angle)
            origin_y = center_y + origin_distance * math.sin(origin_angle)

            points = []
            for i in range(num_points):
                angle = angle_offset + i * angle_step + rng.uniform(-0.05, 0.05)
                dist = rng.uniform(0.3 * planet_radius, 0.6 * planet_radius)
                x = origin_x + dist * math.cos(angle)
                y = origin_y + dist * math.sin(angle)

                norm_x = (x - center_x) / planet_radius
                norm_y = (y - center_y) / planet_radius
                points.append([norm_x, norm_y])

            segments.append({"points": points, "color": [color[0] / 255.0, color[1] / 255.0, color[2] / 255.0, color[3] / 255.0], "origin": [(origin_x - center_x) / planet_radius, (origin_y - center_y) / planet_radius]})

        return segments

    @staticmethod
    def normalize_coordinates(x: float, y: float, center_x: float, center_y: float, planet_radius: int) -> List[float]:
        normalized_x = (x - center_x) / planet_radius
        normalized_y = (y - center_y) / planet_radius
        return [normalized_x, normalized_y]
