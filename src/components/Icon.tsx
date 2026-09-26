import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { View } from "react-native";

// One place that maps what an icon means to SF Symbols (iOS) and Material Symbols (Android).
const ICONS = {
  mic: { ios: "mic.fill", android: "mic" },
  stop: { ios: "stop.fill", android: "stop" },
  camera: { ios: "camera.fill", android: "photo_camera" },
  screenshot: { ios: "photo.on.rectangle.angled", android: "photo_library" },
  paste: { ios: "doc.on.clipboard.fill", android: "content_paste" },
  back: { ios: "chevron.left", android: "arrow_back" },
  forward: { ios: "chevron.right", android: "chevron_right" },
  history: { ios: "clock.arrow.circlepath", android: "history" },
  settings: { ios: "gearshape.fill", android: "settings" },
  more: { ios: "square.grid.2x2.fill", android: "grid_view" },
  home: { ios: "house.fill", android: "home" },
  call: { ios: "phone.fill", android: "call" },
  emergency: { ios: "staroflife.fill", android: "emergency" },
  message: { ios: "message.fill", android: "sms" },
  speaker: { ios: "speaker.wave.2.fill", android: "volume_up" },
  keyboard: { ios: "keyboard", android: "keyboard" },
  copy: { ios: "doc.on.doc.fill", android: "content_copy" },
  share: { ios: "square.and.arrow.up", android: "share" },
  tap: { ios: "hand.tap.fill", android: "touch_app" },
  check: { ios: "checkmark", android: "check" },
  close: { ios: "xmark", android: "close" },
  retry: { ios: "arrow.clockwise", android: "refresh" },
  wifi: { ios: "wifi", android: "wifi" },
  trash: { ios: "trash.fill", android: "delete" },
  chat: { ios: "text.bubble.fill", android: "chat" },
  text: { ios: "text.alignleft", android: "text_fields" },
  people: { ios: "person.2.fill", android: "group" },
  phone: { ios: "iphone", android: "smartphone" },
  safe: { ios: "checkmark.shield.fill", android: "verified_user" },
  caution: { ios: "exclamationmark.triangle.fill", android: "warning" },
  danger: { ios: "xmark.octagon.fill", android: "dangerous" },
  info: { ios: "info.circle.fill", android: "info" },
} satisfies Record<string, Extract<SymbolViewProps["name"], object>>;

export type IconName = keyof typeof ICONS;

/** Decorative icon: screen readers skip it, the text next to it carries the meaning. */
export function Icon({ name, size = 28, color }: { name: IconName; size?: number; color: string }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <SymbolView name={ICONS[name]} size={size} tintColor={color} weight="semibold" />
    </View>
  );
}
