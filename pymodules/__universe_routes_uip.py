# pymodules/__universe_routes_uip.py

import __main__
from pymodules.__universe_base import Universe
from pymodules.__universe_constants import PhysicalConstants


class UniverseInitializationProtocol:

    def __init__(self, config):
        self.config = config
        self.universe = None
        self.constants = PhysicalConstants()

    def initialize_if_needed(self):
        if not self.config.is_initialized:
            if not self.config.initialize():
                return False

        if self.universe is None:
            self.universe = Universe(self.config.seed, self.constants, self.config.cosmic_origin_time)
            __main__.universe = self.universe

        return True

    def get_universe(self):
        if self.universe is None:
            self.initialize_if_needed()
        return self.universe


_uip = None


def initialize_uip(config):
    global _uip
    _uip = UniverseInitializationProtocol(config)
    return _uip


def get_uip():
    return _uip


def get_universe():
    if _uip is None:
        return None

    from pymodules.__atlas_config import config

    if config.remote:
        from pymodules.__universe_constants import PhysicalConstants

        constants = PhysicalConstants()
        remote_universe = Universe(config.seed, constants, config.cosmic_origin_time)
        return remote_universe

    return _uip.get_universe()
