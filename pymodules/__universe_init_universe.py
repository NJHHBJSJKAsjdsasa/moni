# pymodules/__universe_init_universe.py

import hashlib
import random

from pymodules.__atlas_seedmaster import seedmaster
from pymodules.__atlas_config import config
from pymodules.__universe_name_generator import generate_name


class Universe:
    def __init__(self, seed, constants):
        self.seed = seed
        self.constants = constants
        self.galaxies = {}

    def generate_galaxy_seed(self, x, y, z):
        return int(
            hashlib.sha256(f"{self.seed}-{seedmaster(12)}-{x}-{y}-{z}".encode()).hexdigest(),
            16,
        )

    def get_galaxy(self, x, y, z):
        max_coordinate = 10**7
        if not (0 <= x <= max_coordinate and 0 <= y <= max_coordinate and 0 <= z <= max_coordinate):
            raise ValueError(f"Coordinates out of range. Must be between 0 and {max_coordinate}.")

        if (x, y, z) not in self.galaxies:
            from pymodules.__universe_init_galaxy import Galaxy

            galaxy_seed = self.generate_galaxy_seed(x, y, z)
            galaxy_name = generate_name(galaxy_seed, "galaxy")
            galaxy_type = random.choice(["Dwarf", "Spiral", "Elliptical"])

            self.galaxies[(x, y, z)] = Galaxy(
                galaxy_seed,
                galaxy_name,
                self.constants,
                galaxy_type,
                coordinates=(x, y, z),
                cosmic_origin_time=config.cosmic_origin_time,
            )
        return self.galaxies[(x, y, z)]
