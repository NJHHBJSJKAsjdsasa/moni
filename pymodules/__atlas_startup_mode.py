# pymodules/__atlas_startup_mode.py


class AtlasStartupMode:

    def __init__(self):
        self.startup_mode = True
        self.p2p_discovery_enabled = False

    def is_startup_mode(self) -> bool:
        return self.startup_mode

    def is_p2p_discovery_enabled(self) -> bool:
        return self.p2p_discovery_enabled

    def set_startup_complete(self):
        self.startup_mode = False
        self.p2p_discovery_enabled = True

    def startup_print(self, message: str):
        if not self.startup_mode:
            print(message)


_startup_mode = AtlasStartupMode()


def is_startup_mode() -> bool:
    return _startup_mode.is_startup_mode()


def is_p2p_discovery_enabled() -> bool:
    return _startup_mode.is_p2p_discovery_enabled()


def set_startup_complete():
    _startup_mode.set_startup_complete()


def startup_print(message: str):
    _startup_mode.startup_print(message)
