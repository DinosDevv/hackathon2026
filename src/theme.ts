import type { IconName } from "./components/Icon";
import { useSettings } from "./settings";

// Warm paper background with deep ink text: high contrast without the glare of pure white.
export const colors = {
  bg: "#F4F1EA",
  card: "#FFFFFF",
  sunken: "#EAE5DA",
  text: "#1B1F24",
  muted: "#4A4F57",
  border: "#D9D2C3",
  primary: "#0F5E59",
  primarySoft: "#DDEBE8",
  primaryText: "#FFFFFF",
  listening: "#B8420F",
  danger: "#B42318",
  verdict: {
    safe: { fg: "#16703A", bg: "#E3F1E6", label: "Είναι ασφαλές", icon: "safe" },
    caution: { fg: "#8A5300", bg: "#FBEFD6", label: "Πρόσεξε", icon: "caution" },
    danger: { fg: "#B42318", bg: "#FBE4E1", label: "Μην το εμπιστεύεσαι", icon: "danger" },
    info: { fg: "#0F5E59", bg: "#DDEBE8", label: "Να τι βρήκα", icon: "info" },
  } satisfies Record<string, { fg: string; bg: string; label: string; icon: IconName }>,
} as const;

export type Verdict = keyof typeof colors.verdict;

export const radius = { sm: 14, md: 20, lg: 28 } as const;

// Font sizes scale with the user's text-size setting. Base sizes are already large.
export function useFontSizes() {
  const { settings } = useSettings();
  const s = settings.textScale;
  return {
    small: Math.round(17 * s),
    body: Math.round(20 * s),
    large: Math.round(24 * s),
    title: Math.round(30 * s),
    huge: Math.round(36 * s),
  };
}
