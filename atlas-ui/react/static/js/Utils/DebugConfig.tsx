// atlas-ui/react/static/js/Utils/DebugConfig.tsx

class DebugConfigManager {
  private static instance: DebugConfigManager;
  private _effectsControlEnabled = false;
  private _effectsLoggingEnabled = true;
  private _debugLogsEnabled = true;
  private listeners: (() => void)[] = [];

  static getInstance(): DebugConfigManager {
    if (!DebugConfigManager.instance) {
      DebugConfigManager.instance = new DebugConfigManager();
    }
    return DebugConfigManager.instance;
  }

  get ENABLE_EFFECTS_CONTROL() {
    return this._effectsControlEnabled;
  }

  get ENABLE_EFFECTS_LOGGING() {
    return this._effectsLoggingEnabled;
  }

  get ENABLE_DEBUG_LOGS() {
    return this._debugLogsEnabled;
  }

  toggleEffectsControl() {
    this._effectsControlEnabled = !this._effectsControlEnabled;
    this.notifyListeners();
  }

  enableEffectsControl() {
    this._effectsControlEnabled = true;
    this.notifyListeners();
  }

  disableEffectsControl() {
    this._effectsControlEnabled = false;
    this.notifyListeners();
  }

  addListener(callback: () => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: () => void) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback());
  }
}

const debugConfig = DebugConfigManager.getInstance();

export const DebugConfig = {
  get ENABLE_EFFECTS_CONTROL() { return debugConfig.ENABLE_EFFECTS_CONTROL; },
  get ENABLE_EFFECTS_LOGGING() { return debugConfig.ENABLE_EFFECTS_LOGGING; },
  get ENABLE_DEBUG_LOGS() { return debugConfig.ENABLE_DEBUG_LOGS; },
};

export const ENABLE_EFFECTS_CONTROL = debugConfig.ENABLE_EFFECTS_CONTROL;
export const ENABLE_EFFECTS_LOGGING = debugConfig.ENABLE_EFFECTS_LOGGING;
export const ENABLE_DEBUG_LOGS = debugConfig.ENABLE_DEBUG_LOGS;

export { debugConfig };
