# pymodules/__universe_remote_explorer.py

import hashlib
from pymodules.__universe_constants import PhysicalConstants


class RemoteUniverseConfig:

    def __init__(self, node_id, seed_str, cosmic_origin_time):
        self.node_id = node_id
        self.seed_str = seed_str
        self.cosmic_origin_time = int(cosmic_origin_time)

        self.seed_hash = hashlib.sha256(self.seed_str.encode("utf-8")).hexdigest()
        self.seed = int(self.seed_hash, 16)
        self._initialized = True

    @property
    def is_initialized(self):
        return self._initialized


class RemoteUniverse:

    def __init__(self, seed, constants, cosmic_origin_time):
        self.seed = seed
        self.constants = constants
        self.cosmic_origin_time = cosmic_origin_time
        self.galaxies = {}

    def get_galaxy(self, x, y, z):
        from pymodules.__universe_init_galaxy import Galaxy
        from pymodules.__universe_name_generator import generate_name
        from pymodules.__atlas_seedmaster import seedmaster
        import random

        max_coordinate = 10**7
        if not (0 <= x <= max_coordinate and 0 <= y <= max_coordinate and 0 <= z <= max_coordinate):
            raise ValueError(f"Coordinates out of range. Must be between 0 and {max_coordinate}.")

        if (x, y, z) not in self.galaxies:
            galaxy_seed = int(
                hashlib.sha256(f"{self.seed}-{seedmaster(12)}-{x}-{y}-{z}".encode()).hexdigest(),
                16,
            )
            galaxy_name = generate_name(galaxy_seed, "galaxy")

            random.seed(galaxy_seed)
            galaxy_type = random.choice(["Dwarf", "Spiral", "Elliptical"])

            self.galaxies[(x, y, z)] = Galaxy(
                galaxy_seed,
                galaxy_name,
                self.constants,
                galaxy_type,
                coordinates=(x, y, z),
                cosmic_origin_time=self.cosmic_origin_time,
            )
        return self.galaxies[(x, y, z)]


class RemoteUniverseExplorer:

    def __init__(self):
        self.remote_universes = {}
        self.constants = PhysicalConstants()

    def get_remote_universe(self, node_id, seed_str, cosmic_origin_time):
        cache_key = f"{node_id}_{seed_str}_{cosmic_origin_time}"

        if cache_key not in self.remote_universes:
            remote_config = RemoteUniverseConfig(node_id, seed_str, cosmic_origin_time)

            universe = RemoteUniverse(remote_config.seed, self.constants, remote_config.cosmic_origin_time)

            self.remote_universes[cache_key] = {"config": remote_config, "universe": universe}

        return self.remote_universes[cache_key]

    def clear_cache(self):
        self.remote_universes.clear()

    def get_cached_count(self):
        return len(self.remote_universes)


_remote_explorer = RemoteUniverseExplorer()


def get_remote_universe(node_id, seed_str, cosmic_origin_time):
    return _remote_explorer.get_remote_universe(node_id, seed_str, cosmic_origin_time)


def clear_remote_cache():
    _remote_explorer.clear_cache()
