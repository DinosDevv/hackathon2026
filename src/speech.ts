import * as Speech from "expo-speech";
import type { Settings } from "./settings";

const VOICE_LANGUAGE: Record<Settings["language"], string> = { English: "en-US", Greek: "el-GR" };

export function speak(text: string, settings: Settings, onDone?: () => void) {
  Speech.stop();
  Speech.speak(text, {
    language: VOICE_LANGUAGE[settings.language],
    rate: settings.slowSpeech ? 0.85 : 1,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

export function stopSpeaking() {
  Speech.stop();
}
