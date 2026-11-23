import type { Platform } from "@/lib/admin/types";

export type ViewportPreset = {
  width: number;
  height: number;
  devicePixelRatio: number;
  /** window.open features string (size + position) */
  windowFeatures: string;
  label: string;
  /** Short tip shown in Capture Stage */
  tip: string;
};

/** Locked viewports for hireable desktop vs mobile web capture. */
export const VIEWPORT_PRESETS: Record<Platform, ViewportPreset> = {
  desktop_web: {
    width: 1440,
    height: 900,
    devicePixelRatio: 1,
    windowFeatures: "popup=yes,width=1440,height=900,left=40,top=40",
    label: "Desktop",
    tip: "Record the desktop site window (~1440×900). Share that window when Chrome asks.",
  },
  mobile_web: {
    width: 390,
    height: 844,
    devicePixelRatio: 3,
    windowFeatures: "popup=yes,width=390,height=844,left=80,top=40",
    label: "Mobile",
    tip: "Phone-sized window (~390×844). Prefer responsive mobile web; DevTools device mode on that window is OK if the site needs a mobile UA.",
  },
};

export function viewportForPlatform(platform: Platform): ViewportPreset {
  return VIEWPORT_PRESETS[platform] ?? VIEWPORT_PRESETS.desktop_web;
}

export function platformLabel(platform: Platform): string {
  return viewportForPlatform(platform).label;
}
