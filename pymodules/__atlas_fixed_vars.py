# pymodules/__atlas_fixed_vars.py

import hashlib
import os


PORT = 6424
RUN = "PROD"
VERSION = "2.10.434"
VERSION_HASH = hashlib.sha256(VERSION.encode("utf-8")).hexdigest()
MAX_PILLOW_WORKERS = 2
VISUAL_DEBUG = False


def get_external_p2p_port():
    return int(os.getenv("EXTERNAL_P2P_OPEN_PORT", PORT))
