import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { useCallback, useState } from "react";
import { transcribeAudio } from "./api";
import { stopSpeaking } from "./speech";

type Status = "idle" | "listening" | "transcribing";

/** Push-to-talk: start() begins recording, finish() stops and returns the transcript. */
export function useVoiceInput(baseUrl: string, language: string) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [status, setStatus] = useState<Status>("idle");

  const start = useCallback(async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Helper needs the microphone to hear you. You can allow it in Settings.");
    }
    stopSpeaking();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setStatus("listening");
  }, [recorder]);

  const finish = useCallback(async (): Promise<string> => {
    await recorder.stop();
    // Switch back to playback mode, otherwise iOS plays speech through the quiet earpiece.
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    const uri = recorder.uri;
    if (!uri) {
      setStatus("idle");
      return "";
    }
    setStatus("transcribing");
    try {
      return await transcribeAudio(baseUrl, uri, language);
    } finally {
      setStatus("idle");
    }
  }, [recorder, baseUrl, language]);

  return { status, start, finish };
}
