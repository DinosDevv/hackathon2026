import * as Device from "expo-device";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { resolveServerUrl } from "./api";
import type { Settings } from "./settings";

/**
 * The link a phone shortcut opens: Helper, already listening.
 * helper://ask?… in the installed app; exp://<laptop>/--/ask?… while developing in Expo Go.
 */
export function listenLink() {
  return Linking.createURL("ask", { queryParams: { listen: "1", from: "shortcut" } });
}

/**
 * The address the "Helper, look" shortcut sends its screenshot to. Language and name ride along in the link,
 * so the shortcut only needs one form field (the screenshot).
 */
export function lookUrl(settings: Settings) {
  const query = new URLSearchParams({ language: settings.language });
  if (settings.name) query.set("name", settings.name);
  if (settings.nickname) query.set("nickname", settings.nickname);
  if (settings.familyName) query.set("guardian", settings.familyName);
  return `${resolveServerUrl(settings.serverUrl)}/api/look?${query}`;
}

// iPhone 15 Pro (iPhone16,1) and every model since have an Action button; earlier ones don't.
export function hasActionButton() {
  if (Platform.OS !== "ios") return false;
  const major = Number(/^iPhone(\d+),/.exec(String(Device.modelId ?? ""))?.[1]);
  return major >= 16;
}

export function isSamsung() {
  return Platform.OS === "android" && (Device.brand ?? "").toLowerCase() === "samsung";
}
