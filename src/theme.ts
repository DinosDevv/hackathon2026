import { useSettings } from "./settings";

export const colors = {
  bg: "#F6F5F2",
  card: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#4F4F4F",
  border: "#D4D2CC",
  primary: "#1F5FBF",
  primaryText: "#FFFFFF",
  listening: "#B3261E",
  verdict: {
    safe: { fg: "#1E7B34", bg: "#E4F3E8", label: "Looks safe", icon: "✅" },
    caution: { fg: "#9A5B00", bg: "#FFF1DB", label: "Be careful", icon: "⚠️" },
    danger: { fg: "#B3261E", bg: "#FCE6E4", label: "Don't trust this", icon: "⛔" },
    info: { fg: "#1F5FBF", bg: "#E6EEFB", label: "Here's what I found", icon: "💡" },
  },
} as const;

export type Verdict = keyof typeof colors.verdict;

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
