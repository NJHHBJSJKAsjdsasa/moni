# __universe_routes_static.py

from flask import send_from_directory
from pymodules.__atlas_ui_file_delivery import send_static_images, send_static_favicon, send_src_static, send_src_dist


def register_static_routes(app):

    @app.route("/atlas-ui/static/images/<path:path>")
    def atlas_ui_static_images(path):
        return send_static_images(path)

    @app.route("/atlas-ui/static/favicon/<path:path>")
    def atlas_ui_static_favicon(path):
        return send_static_favicon(path)

    @app.route("/atlas-ui/react/static/<path:path>")
    def atlas_ui_src_static(path):
        return send_src_static(path)

    @app.route("/atlas-ui/react/dist/<path:path>")
    def atlas_ui_src_dist(path):
        return send_src_dist(path)

    @app.route("/static/<path:filename>", endpoint="static")
    def send_static_files(filename):
        return send_from_directory("static", filename)

    @app.route("/papers/<path:filename>")
    def send_papers(filename):
        return send_from_directory("static/papers", filename)
