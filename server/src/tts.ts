// Helper's spoken voice: a designed teenage-grandson voice from ElevenLabs.
// Without ELEVENLABS_API_KEY the app falls back to the phone's own voice.

// Not a secret: just which ElevenLabs voice to use. Override in .env to try another.
const DEFAULT_VOICE_ID = "eadgjmk4R4uojdsheG9t";
// Fast multilingual model (covers Greek). Use eleven_multilingual_v2 for a little more polish, a little slower.
const DEFAULT_MODEL = "eleven_flash_v2_5";

const LANGUAGE_CODES: Record<string, string> = { English: "en", Greek: "el" };

export const ttsEnabled = () => Boolean(process.env.ELEVENLABS_API_KEY);

/** Returns MP3 audio of `text` spoken in Helper's voice. */
export async function synthesize(text: string, language?: string): Promise<ArrayBuffer> {
  const voice = process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "",
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL ?? DEFAULT_MODEL,
      language_code: language ? LANGUAGE_CODES[language] : undefined,
      // A bit quicker than normal: a teenager talks fast. ElevenLabs allows 0.7 to 1.2.
      voice_settings: { speed: Number(process.env.ELEVENLABS_SPEED ?? 1.15) },
    }),
  });
  if (!res.ok) throw new Error(`Voice failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return res.arrayBuffer();
}
