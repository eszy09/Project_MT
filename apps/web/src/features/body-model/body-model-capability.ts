export type BodyModelCapability = {
  mode: "interactive" | "static";
  reason: string | null;
};

export function detectBodyModelCapability(): BodyModelCapability {
  if (typeof window === "undefined") {
    return {
      mode: "static",
      reason: "The interactive model loads in a browser.",
    };
  }
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return {
      mode: "static",
      reason: "A static model is shown because reduced motion is enabled.",
    };
  }
  const navigatorWithMemory = navigator as Navigator & {
    deviceMemory?: number;
  };
  if (
    (navigatorWithMemory.deviceMemory !== undefined &&
      navigatorWithMemory.deviceMemory <= 2) ||
    (navigator.hardwareConcurrency !== undefined &&
      navigator.hardwareConcurrency <= 2)
  ) {
    return {
      mode: "static",
      reason: "A static model is shown for this device's available resources.",
    };
  }
  if (
    typeof window.WebGLRenderingContext === "undefined" &&
    typeof window.WebGL2RenderingContext === "undefined"
  ) {
    return {
      mode: "static",
      reason: "A static model is shown because WebGL is unavailable.",
    };
  }
  return { mode: "interactive", reason: null };
}
