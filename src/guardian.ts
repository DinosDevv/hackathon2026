import * as SMS from "expo-sms";
import { Linking, Platform, Share } from "react-native";
import type { Settings } from "./settings";

export { asksForGuardian } from "./guardianMatch";

export function callGuardian(settings: Settings) {
  // iOS asks "Call …?" before dialling and Android opens the dialler, so nothing happens without a tap.
  return Linking.openURL(`tel:${settings.familyPhone.replace(/[^\d+]/g, "")}`);
}

/**
 * Opens Messages addressed to the guardian with the text filled in, and the screenshot or photo attached
 * when there is one. iPhones never let an app send a text on its own: the user taps Send.
 */
export async function textGuardian(settings: Settings, message: string, imageUri?: string) {
  if (!(await SMS.isAvailableAsync())) {
    await Share.share({ message });
    return;
  }
  // Android needs a content:// address for attachments, so only iPhone gets the picture.
  const attachments =
    imageUri && Platform.OS === "ios" ? { uri: imageUri, mimeType: "image/jpeg", filename: "screen.jpg" } : undefined;
  await SMS.sendSMSAsync([settings.familyPhone], message, attachments ? { attachments } : undefined);
}
