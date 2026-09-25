// Speech-to-text for the in-app microphone button. Claude doesn't take audio
// input, so this uses OpenAI's transcription endpoint when a key is configured.
// Without a key the app falls back to the iOS keyboard's dictation button.

export const sttEnabled = () => Boolean(process.env.OPENAI_API_KEY);

const LANGUAGE_CODES: Record<string, string> = { English: "en", Greek: "el" };

export async function transcribe(audio: Buffer, filename: string, mimeType: string, language?: string) {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), filename);
  form.append("model", process.env.STT_MODEL ?? "gpt-4o-mini-transcribe");
  const code = language ? LANGUAGE_CODES[language] : undefined;
  if (code) form.append("language", code);

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Transcription failed (${res.status}): ${await res.text()}`);
  const json = (await res.json()) as { text: string };
  return json.text.trim();
}
