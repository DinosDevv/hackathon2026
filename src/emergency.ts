import { getLocales } from "expo-localization";
import type { Settings } from "./settings";

// 112 works across the EU and on most GSM networks; these countries use something else first.
const NUMBERS: Record<string, string> = {
  US: "911",
  CA: "911",
  MX: "911",
  PR: "911",
  GB: "999",
  AU: "000",
  NZ: "111",
  JP: "119",
};

export function emergencyNumber(settings: Settings): string {
  const custom = settings.emergencyNumber.trim();
  if (custom) return custom;
  const region = getLocales()[0]?.regionCode ?? "";
  return NUMBERS[region] ?? "112";
}

// Backup for when Helper can't be reached to judge the situation itself.
const URGENT_PHRASES = [
  "emergency", "ambulance", "chest pain", "heart attack", "stroke", "can't breathe", "cannot breathe",
  "i fell", "i have fallen", "i've fallen", "bleeding", "unconscious", "overdose", "fire", "call the police",
  "breaking in", "attacking me", "kill myself", "end my life", "help me",
  "βοήθεια", "ασθενοφόρο", "έπεσα", "πόνο στο στήθος", "δεν μπορώ να αναπνεύσω", "φωτιά", "αιμορραγ", "αστυνομία",
];

export function soundsUrgent(text: string): boolean {
  const t = text.toLowerCase();
  return URGENT_PHRASES.some((p) => t.includes(p));
}
