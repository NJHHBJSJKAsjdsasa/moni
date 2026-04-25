# pymodules/__atlas_permanent_cache.py

import os
import json
import hashlib
from typing import Optional, Dict, Any

class PermanentCacheManager:
    def __init__(self):
        self.cache_dir = "internal_data/cache"
        self.galaxy_cache_dir = os.path.join(self.cache_dir, "galaxies")
        self.system_cache_dir = os.path.join(self.cache_dir, "systems")
        self.planet_cache_dir = os.path.join(self.cache_dir, "planets")
        
        # Create cache directories if they don't exist
        os.makedirs(self.galaxy_cache_dir, exist_ok=True)
        os.makedirs(self.system_cache_dir, exist_ok=True)
        os.makedirs(self.planet_cache_dir, exist_ok=True)
    
    def _generate_galaxy_cache_key(self, x: int, y: int, z: int) -> str:
        """Generate a cache key for a galaxy based on its coordinates"""
        return f"galaxy_{x}_{y}_{z}"
    
    def _generate_system_cache_key(self, x: int, y: int, z: int, system_index: int) -> str:
        """Generate a cache key for a system based on its coordinates and index"""
        return f"system_{x}_{y}_{z}_{system_index}"
    
    def _generate_planet_cache_key(self, x: int, y: int, z: int, system_index: int, planet_name: str) -> str:
        """Generate a cache key for a planet based on its coordinates, system index, and name"""
        return f"planet_{x}_{y}_{z}_{system_index}_{planet_name}"
    
    def _get_cache_file_path(self, cache_key: str, cache_type: str) -> str:
        """Get the cache file path based on cache key and type"""
        if cache_type == "galaxy":
            return os.path.join(self.galaxy_cache_dir, f"{cache_key}.json")
        elif cache_type == "system":
            return os.path.join(self.system_cache_dir, f"{cache_key}.json")
        elif cache_type == "planet":
            return os.path.join(self.planet_cache_dir, f"{cache_key}.json")
        else:
            raise ValueError(f"Invalid cache type: {cache_type}")
    
    def save_galaxy(self, x: int, y: int, z: int, galaxy_data: Dict[str, Any]) -> bool:
        """Save galaxy data to permanent cache"""
        try:
            cache_key = self._generate_galaxy_cache_key(x, y, z)
            file_path = self._get_cache_file_path(cache_key, "galaxy")
            
            with open(file_path, 'w') as f:
                json.dump(galaxy_data, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving galaxy to cache: {e}")
            return False
    
    def get_galaxy(self, x: int, y: int, z: int) -> Optional[Dict[str, Any]]:
        """Get galaxy data from permanent cache"""
        try:
            cache_key = self._generate_galaxy_cache_key(x, y, z)
            file_path = self._get_cache_file_path(cache_key, "galaxy")
            
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    return json.load(f)
            return None
        except Exception as e:
            print(f"Error reading galaxy from cache: {e}")
            return None
    
    def save_system(self, x: int, y: int, z: int, system_index: int, system_data: Dict[str, Any]) -> bool:
        """Save system data to permanent cache"""
        try:
            cache_key = self._generate_system_cache_key(x, y, z, system_index)
            file_path = self._get_cache_file_path(cache_key, "system")
            
            with open(file_path, 'w') as f:
                json.dump(system_data, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving system to cache: {e}")
            return False
    
    def get_system(self, x: int, y: int, z: int, system_index: int) -> Optional[Dict[str, Any]]:
        """Get system data from permanent cache"""
        try:
            cache_key = self._generate_system_cache_key(x, y, z, system_index)
            file_path = self._get_cache_file_path(cache_key, "system")
            
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    return json.load(f)
            return None
        except Exception as e:
            print(f"Error reading system from cache: {e}")
            return None
    
    def save_planet(self, x: int, y: int, z: int, system_index: int, planet_name: str, planet_data: Dict[str, Any]) -> bool:
        """Save planet data to permanent cache"""
        try:
            cache_key = self._generate_planet_cache_key(x, y, z, system_index, planet_name)
            file_path = self._get_cache_file_path(cache_key, "planet")
            
            with open(file_path, 'w') as f:
                json.dump(planet_data, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving planet to cache: {e}")
            return False
    
    def get_planet(self, x: int, y: int, z: int, system_index: int, planet_name: str) -> Optional[Dict[str, Any]]:
        """Get planet data from permanent cache"""
        try:
            cache_key = self._generate_planet_cache_key(x, y, z, system_index, planet_name)
            file_path = self._get_cache_file_path(cache_key, "planet")
            
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    return json.load(f)
            return None
        except Exception as e:
            print(f"Error reading planet from cache: {e}")
            return None
    
    def galaxy_exists(self, x: int, y: int, z: int) -> bool:
        """Check if galaxy exists in cache"""
        cache_key = self._generate_galaxy_cache_key(x, y, z)
        file_path = self._get_cache_file_path(cache_key, "galaxy")
        return os.path.exists(file_path)
    
    def system_exists(self, x: int, y: int, z: int, system_index: int) -> bool:
        """Check if system exists in cache"""
        cache_key = self._generate_system_cache_key(x, y, z, system_index)
        file_path = self._get_cache_file_path(cache_key, "system")
        return os.path.exists(file_path)
    
    def planet_exists(self, x: int, y: int, z: int, system_index: int, planet_name: str) -> bool:
        """Check if planet exists in cache"""
        cache_key = self._generate_planet_cache_key(x, y, z, system_index, planet_name)
        file_path = self._get_cache_file_path(cache_key, "planet")
        return os.path.exists(file_path)

# Create a global instance
permanent_cache = PermanentCacheManager()
