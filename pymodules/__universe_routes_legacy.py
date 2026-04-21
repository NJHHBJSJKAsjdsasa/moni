# pymodules/__universe_routes_legacy.py (Legacy Pillow routes only for testing purposes with Semantic Kernel)

import os
import asyncio
from io import BytesIO
from flask import send_file


def register_blob_routes(app, universe, config):

    def get_current_galaxy():
        from flask import session

        galaxy_data = session.get("galaxy")
        if galaxy_data:
            galaxy = universe.get_galaxy(*galaxy_data["coordinates"])
            return galaxy
        return None

    def get_current_system():
        from flask import session

        galaxy = get_current_galaxy()
        system_index = session.get("system")
        if galaxy and system_index is not None:
            return galaxy.get_solar_system(system_index)
        return None

    @app.route("/galaxy_blob")
    def galaxy_blob():
        from pymodules.__atlas_cache import get_cached_image_path
        from pymodules.__drawer_base import handle_image_generation

        current_galaxy = get_current_galaxy()

        coordinates = f"{current_galaxy.coordinates[0]}_{current_galaxy.coordinates[1]}_{current_galaxy.coordinates[2]}"
        system_name = current_galaxy.name.lower()

        cache_filepath = get_cached_image_path("galaxy", coordinates, system_name)

        if config.enable_cache:
            if os.path.exists(cache_filepath):
                return send_file(cache_filepath, mimetype="image/webp")

            image = asyncio.run(handle_image_generation(current_galaxy))
            image.save(cache_filepath, "WEBP", quality=config.image_quality)
            return send_file(cache_filepath, mimetype="image/webp")
        else:
            image = asyncio.run(handle_image_generation(current_galaxy))
            img_io = BytesIO()
            image.save(img_io, "WEBP", quality=config.image_quality)
            img_io.seek(0)
            return send_file(img_io, mimetype="image/webp")

    @app.route("/system_blob")
    def system_blob():
        from pymodules.__atlas_cache import get_cached_image_path
        from pymodules.__drawer_base import handle_image_generation

        current_system = get_current_system()
        current_galaxy = get_current_galaxy()

        coordinates = f"{current_galaxy.coordinates[0]}_{current_galaxy.coordinates[1]}_{current_galaxy.coordinates[2]}"
        system_name = current_system.name.lower()

        cache_filepath = get_cached_image_path("system", coordinates, system_name)

        if config.enable_cache:
            if os.path.exists(cache_filepath):
                return send_file(cache_filepath, mimetype="image/webp")

            image = asyncio.run(handle_image_generation(current_system))
            image.save(cache_filepath, "WEBP", quality=config.image_quality)
            return send_file(cache_filepath, mimetype="image/webp")
        else:
            image = asyncio.run(handle_image_generation(current_system))
            img_io = BytesIO()
            image.save(img_io, "WEBP", quality=config.image_quality)
            img_io.seek(0)
            return send_file(img_io, mimetype="image/webp")

    @app.route("/planet_blob/<planet_name>")
    def planet_blob(planet_name):
        from pymodules.__atlas_cache import get_cached_image_path
        from pymodules.__drawer_base import handle_image_generation

        current_system = get_current_system()
        current_galaxy = get_current_galaxy()

        coordinates = f"{current_galaxy.coordinates[0]}_{current_galaxy.coordinates[1]}_{current_galaxy.coordinates[2]}"
        system_name = current_system.name.lower()

        planet_name = planet_name.lower()
        cache_filepath = get_cached_image_path("planet", coordinates, system_name, planet_name)

        if config.enable_cache:
            if os.path.exists(cache_filepath):
                return send_file(cache_filepath, mimetype="image/webp")

            for planet in current_system.planets.values():
                if planet.name.lower() == planet_name:
                    image = asyncio.run(handle_image_generation(planet))
                    image.save(cache_filepath, "WEBP", quality=config.image_quality)
                    return send_file(cache_filepath, mimetype="image/webp")
        else:
            for planet in current_system.planets.values():
                if planet.name.lower() == planet_name:
                    image = asyncio.run(handle_image_generation(planet))
                    img_io = BytesIO()
                    image.save(img_io, "WEBP", quality=config.image_quality)
                    img_io.seek(0)
                    return send_file(img_io, mimetype="image/webp")

        return "Planet not found", 404
