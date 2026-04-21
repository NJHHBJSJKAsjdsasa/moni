# pymodules/__atlas_config.py

import os
import time
import random
import hashlib
import configparser

from pymodules.__atlas_fixed_vars import VERSION, VERSION_HASH, PORT
from pymodules.__atlas_boot_message import display_boot_message, display_intro_message
from pymodules.__atlas_config_helpers import custom_timestamp_to_date


class Config:
    _instance = None
    display_intro_message(PORT)

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Config, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def initialize(self):

        if self._initialized:
            return True

        if not os.path.exists("atlas.ini"):
            return False

        config = configparser.ConfigParser()
        config.read("atlas.ini")

        self._seed_str = config.get("Settings", "seed")

        self.seed_hash = hashlib.sha256(self._seed_str.encode("utf-8")).hexdigest()
        self._seed = int(self.seed_hash, 16)

        self._cosmic_origin_time = config.get("Settings", "cosmic_origin_time")
        self._cosmic_origin_time = int(self._cosmic_origin_time)

        self.cosmic_origin_datetime = custom_timestamp_to_date(self._cosmic_origin_time)

        display_boot_message(
            self.seed_str,
            self.seed_hash,
            self.seed,
            self.cosmic_origin_time,
            self.cosmic_origin_datetime,
            VERSION,
            VERSION_HASH,
        )

        self._initialized = True
        return True

    def create_atlas_ini(self, seed_str, cosmic_origin_time):
        config = configparser.ConfigParser()
        config["Settings"] = {
            "seed": seed_str,
            "cosmic_origin_time": str(cosmic_origin_time),
            "image_quality": "100",
            "enable_cache": "False",
            "cache_cleanup_time": "900",
        }
        with open("atlas.ini", "w") as configfile:
            config.write(configfile)

    def generate_hex_seed(self):
        hex_seed = f"0x{random.randint(0, 0xFFFFFFFF):08X}"
        return hex_seed

    def setup_universe(self, universe_type, custom_seed=None):
        if universe_type == "default":
            seed_str = "1.618033988749895"
            cosmic_origin_time = 514080000
        else:
            if custom_seed and len(custom_seed) <= 20:
                seed_str = custom_seed
            else:
                seed_str = f"{self.generate_hex_seed()}-{self.generate_hex_seed()}-{self.generate_hex_seed()}"
            cosmic_origin_time = int(time.time())

        self.create_atlas_ini(seed_str, cosmic_origin_time)

        return self.initialize()

    @property
    def is_initialized(self):
        return self._initialized

    @property
    def remote(self):
        try:
            from flask import session

            return session.get("remote_mode") is not None
        except RuntimeError:
            return False

    @property
    def seed(self):
        try:
            from flask import session

            remote_data = session.get("remote_mode")
            if remote_data:
                return remote_data.get("seed")
            return getattr(self, "_seed", None)
        except RuntimeError:
            return getattr(self, "_seed", None)

    @property
    def seed_str(self):
        try:
            from flask import session

            remote_data = session.get("remote_mode")
            if remote_data:
                return remote_data.get("seed_str")
            return getattr(self, "_seed_str", None)
        except RuntimeError:
            return getattr(self, "_seed_str", None)

    @property
    def cosmic_origin_time(self):
        try:
            from flask import session

            remote_data = session.get("remote_mode")
            if remote_data:
                return remote_data.get("cosmic_origin_time")
            return getattr(self, "_cosmic_origin_time", None)
        except RuntimeError:
            return getattr(self, "_cosmic_origin_time", None)

    @property
    def seed_name(self):
        try:
            from flask import session

            remote_data = session.get("remote_mode")
            if remote_data:
                return remote_data.get("seed_name", "Unknown Remote Universe")
            return "Local Universe"
        except RuntimeError:
            return "Local Universe"

    @property
    def node_id(self):
        try:
            from flask import session

            remote_data = session.get("remote_mode")
            if remote_data:
                return remote_data.get("node_id")
            return None
        except RuntimeError:
            return None

    def set_remote_mode(self, node_id, seed_str, cosmic_origin_time, seed_name=None):
        import hashlib
        from flask import session

        seed_hash = hashlib.sha256(seed_str.encode("utf-8")).hexdigest()
        seed = int(seed_hash, 16)

        session["remote_mode"] = {"node_id": node_id, "seed_str": seed_str, "seed": seed, "cosmic_origin_time": int(cosmic_origin_time), "seed_name": seed_name or "Unknown Remote Universe"}

        print(f"ATLAS MULTIVERSE: Switched to remote universe '{seed_str}' - (Node: {node_id})")

    def set_local_mode(self):
        from flask import session

        session.pop("remote_mode", None)

        print(f"ATLAS MULTIVERSE: Switched to local universe {self.seed_str} - (Node: Local)")


config = Config()
