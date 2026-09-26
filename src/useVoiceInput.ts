import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeAudio } from "./api";
import { stopSpeaking } from "./speech";

type Status = "idle" | "listening" | "transcribing";

/** Quiet this long after they've spoken, and we take it they're done. */
const SILENCE_MS = 1600;
/** Nobody said anything for this long: give up rather than send silence. */
const NOTHING_HEARD_MS = 8000;
/** Hard stop for very long messages. */
const MAX_MS = 60000;
/** The first few readings measure the room's background noise. */
const CALIBRATION_SAMPLES = 5;

/**
 * Tap to talk. It stops by itself when the person goes quiet (`onSilence`), or when nobody speaks at all
 * (`onNothingHeard`). finish() stops and returns the transcript; cancel() throws the recording away.
 */
export function useVoiceInput(
  baseUrl: string,
  language: string,
  events: { onSilence?: () => void; onNothingHeard?: () => void } = {},
) {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const [status, setStatus] = useState<Status>("idle");
  // Loudness in dB (about -60 quiet to 0 loud), turned into 0–1 so the UI can show that Helper hears you.
  const { metering } = useAudioRecorderState(recorder, 80);
  const level = status === "listening" && metering != null ? Math.min(1, Math.max(0, (metering + 55) / 50)) : 0;

  // Latest callbacks, so the silence check never calls a stale one.
  const eventsRef = useRef(events);
  eventsRef.current = events;
  // Bumped by cancel(), so a transcription that was already on its way gets ignored.
  const turn = useRef(0);
  const vad = useRef({ startedAt: 0, lastVoiceAt: 0, heard: false, floor: 0, samples: 0, fired: false });

  // Voice activity: speech is anything clearly louder than the room's background noise.
  useEffect(() => {
    if (status !== "listening" || metering == null) return;
    const v = vad.current;
    const now = Date.now();
    if (v.samples < CALIBRATION_SAMPLES) {
      v.floor = v.samples === 0 ? metering : Math.min(v.floor, metering);
      v.samples++;
      return;
    }
    // Capped at -30 dB: if they started talking straight away the "background" reading was really their
    // voice, and normal speech (around -25 dB and up) must still count.
    const threshold = Math.min(-30, Math.max(-42, v.floor + 12));
    if (metering > threshold) {
      v.heard = true;
      v.lastVoiceAt = now;
    }
    if (v.fired) return;
    if ((v.heard && now - v.lastVoiceAt > SILENCE_MS) || now - v.startedAt > MAX_MS) {
      v.fired = true;
      eventsRef.current.onSilence?.();
    } else if (!v.heard && now - v.startedAt > NOTHING_HEARD_MS) {
      v.fired = true;
      eventsRef.current.onNothingHeard?.();
    }
  }, [metering, status]);

  const start = useCallback(async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Ο HelpNona χρειάζεται το μικρόφωνο για να σε ακούει. Μπορείς να το επιτρέψεις από τις Ρυθμίσεις του κινητού.");
    }
    stopSpeaking();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    vad.current = { startedAt: Date.now(), lastVoiceAt: 0, heard: false, floor: 0, samples: 0, fired: false };
    setStatus("listening");
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    vad.current.fired = true;
    if (recorder.isRecording) await recorder.stop();
    // Switch back to playback mode, otherwise iOS plays speech through the quiet earpiece.
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  }, [recorder]);

  /** Stops and returns what they said, "" if nothing was understood, or null if it was cancelled meanwhile. */
  const finish = useCallback(async (): Promise<string | null> => {
    if (status !== "listening") return null;
    const mine = ++turn.current;
    await stopRecording();
    const uri = recorder.uri;
    if (!uri) {
      setStatus("idle");
      return "";
    }
    setStatus("transcribing");
    try {
      const text = await transcribeAudio(baseUrl, uri, language);
      return mine === turn.current ? text : null;
    } finally {
      if (mine === turn.current) setStatus("idle");
    }
  }, [status, stopRecording, recorder, baseUrl, language]);

  /** Throws the recording away, whether still listening or already being written down. */
  const cancel = useCallback(async () => {
    turn.current++;
    setStatus("idle");
    await stopRecording().catch(() => {});
  }, [stopRecording]);

  return { status, level, start, finish, cancel };
}
