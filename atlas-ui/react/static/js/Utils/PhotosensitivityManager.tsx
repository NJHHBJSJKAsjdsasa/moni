// atlas-ui/react/static/js/Utils/PhotosensitivityManager.tsx

const PHOTOSENSITIVITY_KEY = "atlas_photosensitivity_mode";

export const PhotosensitivityManager = {
  isEnabled(): boolean {
    try {
      const value = localStorage.getItem(PHOTOSENSITIVITY_KEY);
      return value === "true";
    } catch (error) {
      console.error("Error reading photosensitivity setting:", error);
      return false;
    }
  },

  enable(): void {
    try {
      localStorage.setItem(PHOTOSENSITIVITY_KEY, "true");
      window.dispatchEvent(new CustomEvent("photosensitivityChange", { detail: { enabled: true } }));
    } catch (error) {
      console.error("Error saving photosensitivity setting:", error);
    }
  },

  disable(): void {
    try {
      localStorage.setItem(PHOTOSENSITIVITY_KEY, "false");
      window.dispatchEvent(new CustomEvent("photosensitivityChange", { detail: { enabled: false } }));
    } catch (error) {
      console.error("Error saving photosensitivity setting:", error);
    }
  },

  toggle(): boolean {
    const newState = !this.isEnabled();
    if (newState) {
      this.enable();
    } else {
      this.disable();
    }
    return newState;
  },
};
