# pymodules/__atlas_cache_proxy.py

from pymodules.__universe_init_galaxy import Galaxy
from pymodules.__universe_init_solarsystem import SolarSystem
from pymodules.__universe_init_planet import Planet
from pymodules.__atlas_sqlite_cache import sqlite_cache
from typing import Optional, Dict, Any

class CachedGalaxy(Galaxy):
    """Cached version of Galaxy class"""
    def __init__(self, seed, name, constants, galaxy_type="spiral", coordinates=(0, 0, 0), cosmic_origin_time=None):
        x, y, z = coordinates
        
        # Check if galaxy is in cache
        cached_data = sqlite_cache.get_galaxy(x, y, z)
        if cached_data:
            # Load from cache
            self.seed = cached_data['seed']
            self.name = cached_data['name']
            self.constants = constants  # Constants are not cached
            self.coordinates = tuple(cached_data['coordinates'])
            self.galaxy_type = cached_data['galaxy_type']
            self.cosmic_origin_time = cached_data['cosmic_origin_time']
            self.base_min_systems = cached_data['base_min_systems']
            self.base_max_systems = cached_data['base_max_systems']
            self.distance_to_origin = cached_data['distance_to_origin']
            self.max_distance = cached_data['max_distance']
            self.proximity_factor = cached_data['proximity_factor']
            self.num_systems = cached_data['num_systems']
            self.black_holes = cached_data['black_holes']
            self.pulsars = cached_data['pulsars']
            self.quasars = cached_data['quasars']
            self.solar_systems = {}
        else:
            # Create new galaxy
            super().__init__(seed, name, constants, galaxy_type, coordinates, cosmic_origin_time)
            
            # Save to cache
            galaxy_data = {
                'seed': self.seed,
                'name': self.name,
                'coordinates': list(self.coordinates),
                'galaxy_type': self.galaxy_type,
                'cosmic_origin_time': self.cosmic_origin_time,
                'base_min_systems': self.base_min_systems,
                'base_max_systems': self.base_max_systems,
                'distance_to_origin': self.distance_to_origin,
                'max_distance': self.max_distance,
                'proximity_factor': self.proximity_factor,
                'num_systems': self.num_systems,
                'black_holes': self.black_holes,
                'pulsars': self.pulsars,
                'quasars': self.quasars
            }
            sqlite_cache.save_galaxy(x, y, z, galaxy_data)
    
    def get_solar_system(self, index):
        x, y, z = self.coordinates
        
        # Check if system is in cache
        cached_data = sqlite_cache.get_system(x, y, z, index)
        if cached_data:
            # Load from cache
            from pymodules.__universe_init_solarsystem import SolarSystem
            system_seed = cached_data['seed']
            if index not in self.solar_systems:
                # Create system with cached seed
                system = CachedSolarSystem(system_seed, index, self.constants, (x, y, z))
                self.solar_systems[index] = system
            return self.solar_systems[index]
        else:
            # Create new system
            system = super().get_solar_system(index)
            # Wrap in cached version
            cached_system = CachedSolarSystem(system.seed, index, self.constants, (x, y, z))
            self.solar_systems[index] = cached_system
            return cached_system

class CachedSolarSystem(SolarSystem):
    """Cached version of SolarSystem class"""
    def __init__(self, seed, index, constants, galaxy_coordinates):
        self.galaxy_coordinates = galaxy_coordinates
        x, y, z = galaxy_coordinates
        
        # Check if system is in cache
        cached_data = sqlite_cache.get_system(x, y, z, index)
        if cached_data:
            # Load from cache
            self.seed = cached_data['seed']
            self.index = cached_data['index']
            self.constants = constants  # Constants are not cached
            self.name = cached_data['name']
            self.num_planets = cached_data['num_planets']
            self.planets = {}
            # 初始化 stars 属性
            self.stars = cached_data.get('stars', [])
            self.star_system_type = cached_data.get('star_system_type', 'single')
        else:
            # Create new system
            super().__init__(seed, index, constants)
            
            # Save to cache
            system_data = {
                'seed': self.seed,
                'index': self.index,
                'name': self.name,
                'num_planets': self.num_planets,
                'stars': self.stars,
                'star_system_type': self.star_system_type
            }
            sqlite_cache.save_system(x, y, z, index, system_data)
    
    def get_planet(self, index):
        # 首先尝试从缓存加载
        x, y, z = self.galaxy_coordinates
        
        # 检查行星是否已存在
        if index in self.planets:
            return self.planets[index]
        
        # 调用父类方法获取行星
        planet = super().get_planet(index)
        
        # 缓存行星
        if planet:
            # 包装为缓存版本
            cached_planet = CachedPlanet(planet.seed, planet.name, self.constants, (x, y, z), self.index)
            self.planets[index] = cached_planet
            return cached_planet
        
        return None

class CachedPlanet(Planet):
    """Cached version of Planet class"""
    def __init__(self, seed, name, constants, galaxy_coordinates, system_index):
        self.galaxy_coordinates = galaxy_coordinates
        self.system_index = system_index
        x, y, z = galaxy_coordinates
        
        # Check if planet is in cache
        cached_data = sqlite_cache.get_planet(x, y, z, system_index, name)
        if cached_data:
            # Load from cache
            self.seed = cached_data['seed']
            self.name = cached_data['name']
            self.constants = constants  # Constants are not cached
            self.planet_type = cached_data['planet_type']
            self.diameter = cached_data['diameter']
            self.orbital_radius = cached_data['orbital_radius']
            self.elements = cached_data['elements']
            self.life_forms = cached_data['life_forms']
            self.atmosphere = cached_data['atmosphere']
            # 处理 num_moons 属性
            self.num_moons = cached_data.get('num_moons', 0)
            # 初始化其他必要的属性
            self.star_mass = constants.M_SUN
            # 为了确保兼容性，创建一个简单的 moon_system 结构
            self.moon_system = type('MoonSystem', (), {'moons': []})()
        else:
            # Create new planet
            super().__init__(seed, name, constants)
            
            # 计算卫星数量
            self.num_moons = len(self.moon_system.moons) if hasattr(self, 'moon_system') else 0
            
            # Save to cache
            planet_data = {
                'seed': self.seed,
                'name': self.name,
                'planet_type': self.planet_type,
                'diameter': self.diameter,
                'orbital_radius': self.orbital_radius,
                'elements': self.elements,
                'life_forms': self.life_forms,
                'atmosphere': self.atmosphere,
                'num_moons': self.num_moons
            }
            sqlite_cache.save_planet(x, y, z, system_index, name, planet_data)

# Override the Universe.get_galaxy method to use CachedGalaxy
def patch_universe_get_galaxy():
    from pymodules.__universe_init_universe import Universe
    
    original_get_galaxy = Universe.get_galaxy
    
    def cached_get_galaxy(self, x, y, z):
        galaxy_key = f"{x}_{y}_{z}"
        if galaxy_key not in self.galaxies:
            from pymodules.__universe_name_generator import generate_galaxy_name
            galaxy_seed = self.generate_galaxy_seed(x, y, z)
            galaxy_name = generate_galaxy_name(galaxy_seed)
            
            # Use CachedGalaxy instead of Galaxy
            galaxy = CachedGalaxy(
                galaxy_seed,
                galaxy_name,
                self.constants,
                coordinates=(x, y, z),
                cosmic_origin_time=self.cosmic_origin_time
            )
            self.galaxies[galaxy_key] = galaxy
        return self.galaxies[galaxy_key]
    
    Universe.get_galaxy = cached_get_galaxy
