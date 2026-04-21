"""
__atlas_ui_file_delivery.py
Copyright 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import os

from flask import send_from_directory

from pymodules.__atlas_fixed_vars import RUN


def send_static_images(path):
    return send_from_directory(os.path.join(os.getcwd(), "atlas-ui", "static", "images"), path)


def send_static_favicon(path):
    return send_from_directory(os.path.join(os.getcwd(), "atlas-ui", "static", "favicon"), path)


def send_src_static(path):
    if RUN != "DEV":
        raise RuntimeError("Access to static React components is forbidden in production.")
    return send_from_directory(os.path.join(os.getcwd(), "atlas-ui", "react", "static"), path)


def send_src_dist(path):
    return send_from_directory(os.path.join(os.getcwd(), "atlas-ui", "react", "dist"), path)
