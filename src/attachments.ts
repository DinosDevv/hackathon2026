import * as Clipboard from "expo-clipboard";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export type Attachment =
  | { kind: "image"; uri: string; base64: string; source: "screenshot" | "photo" }
  | { kind: "text"; text: string };

// Claude downsizes anything larger, so send at most this many pixels on the long edge.
const MAX_EDGE = 1568;

async function prepareImage(asset: ImagePicker.ImagePickerAsset, source: "screenshot" | "photo"): Promise<Attachment> {
  const longEdge = Math.max(asset.width, asset.height);
  const context = ImageManipulator.manipulate(asset.uri);
  if (longEdge > MAX_EDGE) {
    context.resize(asset.width >= asset.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ base64: true, compress: 0.7, format: SaveFormat.JPEG });
  return { kind: "image", uri: result.uri, base64: result.base64 ?? "", source };
}

/** Lets the user choose a screenshot (newest photos are shown first). */
export async function pickScreenshot(): Promise<Attachment | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
  if (result.canceled || !result.assets[0]) return null;
  return prepareImage(result.assets[0], "screenshot");
}

/** Takes a photo of a letter, sign or another screen. */
export async function takePhoto(): Promise<Attachment | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error("Helper needs the camera to read things for you. You can allow it in Settings.");
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 });
  if (result.canceled || !result.assets[0]) return null;
  return prepareImage(result.assets[0], "photo");
}

/** Reads whatever text the user copied (a message, email or link). */
export async function readClipboard(): Promise<Attachment | null> {
  const text = (await Clipboard.getStringAsync()).trim();
  return text ? { kind: "text", text } : null;
}

// Screens pass attachments to the Ask screen through here; images are too large for route params.
let pending: Attachment | null = null;
export function setPendingAttachment(a: Attachment | null) {
  pending = a;
}
export function getPendingAttachment(): Attachment | null {
  return pending;
}
