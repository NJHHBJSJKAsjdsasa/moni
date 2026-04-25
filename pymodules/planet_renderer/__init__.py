# pymodules/planet_renderer/__init__.py

from .main_translator import PlanetRenderingTranslator
from .api_endpoints import PlanetRendererAPI

planet_translator = PlanetRenderingTranslator()


def get_planet_rendering_data(planet):
    return planet_translator.translate_planet_rendering(planet)


def translate_planet_to_json(planet):
    return planet_translator.translate_planet_rendering(planet)


def register_planet_renderer_api(app):
    api = PlanetRendererAPI(planet_translator)
    api.register_endpoints(app)


__all__ = ["PlanetRenderingTranslator", "PlanetRendererAPI", "planet_translator", "get_planet_rendering_data", "translate_planet_to_json", "register_planet_renderer_api"]
