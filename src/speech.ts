import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { File, Paths } from "expo-file-system";
import * as Speech from "expo-speech";
import type { HelperAnswer } from "./api";
import type { Settings } from "./settings";

const VOICE_LANGUAGE: Record<Settings["language"], string> = { English: "en-US", Greek: "el-GR" };

const WORDS: Record<Settings["language"], { first: string; then: string; last: string }> = {
  English: { first: "First", then: "Then", last: "And then" },
  Greek: { first: "Πρώτα", then: "Μετά", last: "Και μετά" },
};

/** Ends a sentence with a full stop unless it already ends with punctuation. */
export const sentence = (text: string) => (/[.!?;…]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);

// A step may already start with "Then…"; drop it so we don't say "And then, then…".
const stripLead = (s: string) =>
  s.trim().replace(/^(and then|then|first|next|after that|finally|μετά|πρώτα|και μετά)[,:]?\s+/iu, "");
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** An answer as Helper says it out loud: steps as "First… Then… And then…", not "Step 1". */
export function spokenText(answer: HelperAnswer, language: Settings["language"] = "English") {
  const w = WORDS[language] ?? WORDS.English;
  const lead = (i: number) => (i === 0 ? w.first : i === answer.steps.length - 1 && i > 1 ? w.last : w.then);
  const steps = answer.steps.map((s, i) => `${lead(i)}, ${sentence(lowerFirst(stripLead(s)))}`);
  return [sentence(answer.headline), answer.explanation, ...steps].filter(Boolean).join(" ");
}

// The phone's default voice sounds like an automated phone line. Pick the most natural one installed:
// Premium, then Enhanced, then the default. Novelty and robotic voices are skipped.
const bestVoice: Partial<Record<string, string | null>> = {};
const ROBOTIC = /speech\.synthesis|eloquence|compact/i;

async function voiceFor(locale: string): Promise<string | undefined> {
  if (bestVoice[locale] !== undefined) return bestVoice[locale] ?? undefined;
  try {
    const lang = locale.split("-")[0];
    const voices = (await Speech.getAvailableVoicesAsync()).filter(
      (v) => v.language.replace("_", "-").startsWith(lang) && !ROBOTIC.test(v.identifier),
    );
    const score = (v: Speech.Voice) =>
      (/premium/i.test(v.identifier) ? 4 : v.quality === Speech.VoiceQuality.Enhanced ? 2 : 0) +
      (v.language.replace("_", "-") === locale ? 1 : 0);
    const best = voices.sort((a, b) => score(b) - score(a))[0];
    bestVoice[locale] = best && score(best) >= 2 ? best.identifier : null;
  } catch {
    bestVoice[locale] = null;
  }
  return bestVoice[locale] ?? undefined;
}

// Bumped on every speak/stop, so a stop during a voice lookup or download cancels the pending speech.
let turn = 0;

// Helper's own voice (the teenage grandson, from the server) when the server has it switched on.
let cloudVoiceUrl: string | null = null;
let player: AudioPlayer | null = null;
/** How long to wait for Helper's own voice to start before using the phone's voice instead. */
const CLOUD_START_TIMEOUT_MS = 8000;

/** Called after a health check: the server's address if it offers Helper's voice, otherwise null. */
export function setCloudVoice(serverUrl: string | null) {
  cloudVoiceUrl = serverUrl;
}

function releasePlayer() {
  if (!player) return;
  try {
    player.pause();
    player.remove();
  } catch {
    // Already released.
  }
  player = null;
}

/** The phone's built-in voice: always available, no internet needed. */
function speakWithPhone(text: string, settings: Settings, mine: number, onDone?: () => void) {
  const language = VOICE_LANGUAGE[settings.language];
  voiceFor(language).then((voice) => {
    if (mine !== turn) return;
    Speech.speak(text, {
      language,
      voice,
      // A bit brisk by default (a teenager talks fast); "Slower" brings it back down.
      rate: settings.slowSpeech ? 0.95 : 1.1,
      onDone,
      onStopped: onDone,
      onError: onDone,
    });
  });
}

/**
 * Plays Helper's voice from the server. The clip is downloaded to the phone first and played from there:
 * iPhones won't stream audio from a server that can't send it in chunks, and short clips download fast.
 * Falls back to the phone's voice if anything fails or takes too long.
 */
function speakWithCloud(base: string, text: string, settings: Settings, mine: number, onDone?: () => void) {
  const url = `${base}/api/speak?${new URLSearchParams({ text, language: settings.language })}`;
  let started = false;
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    if (mine === turn) releasePlayer();
    onDone?.();
  };
  const fallback = () => {
    if (started || finished || mine !== turn) return;
    releasePlayer();
    speakWithPhone(text, settings, mine, onDone);
  };
  const timer = setTimeout(fallback, CLOUD_START_TIMEOUT_MS);

  (async () => {
    const file = await File.downloadFileAsync(url, new File(Paths.cache, `helper-voice-${mine}.mp3`), { idempotent: true });
    // An error from the server is a few bytes of JSON, not audio.
    if ((file.size ?? 0) < 1024) throw new Error("No audio");
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
    if (mine !== turn) return;
    const p = createAudioPlayer({ uri: file.uri });
    player = p;
    if (settings.slowSpeech) p.setPlaybackRate(0.92, "high");
    p.addListener("playbackStatusUpdate", (status) => {
      if (mine !== turn) return;
      if (status.playing && !started) {
        started = true;
        clearTimeout(timer);
      }
      if (status.didJustFinish) {
        done();
        try {
          file.delete();
        } catch {
          // Only tidying the cache.
        }
      }
    });
    p.play();
  })().catch(() => {
    clearTimeout(timer);
    fallback();
  });
}

export function speak(text: string, settings: Settings, onDone?: () => void) {
  Speech.stop();
  releasePlayer();
  const mine = ++turn;
  if (cloudVoiceUrl) speakWithCloud(cloudVoiceUrl, text, settings, mine, onDone);
  else speakWithPhone(text, settings, mine, onDone);
}

export function stopSpeaking() {
  turn++;
  Speech.stop();
  releasePlayer();
}
