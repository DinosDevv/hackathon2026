import Constants from "expo-constants";
import { File } from "expo-file-system";
import type { Verdict } from "./theme";

export type HelperAnswer = {
  verdict: Verdict;
  headline: string;
  explanation: string;
  steps: string[];
  draftReply: string;
  tellFamily: boolean;
  /** Missing on answers saved before this field existed. */
  emergency?: boolean;
};

export type Turn = { role: "user" | "assistant"; text: string };

export type AskRequest = {
  question: string;
  image?: { data: string; mediaType: "image/jpeg" | "image/png" };
  contextText?: string;
  history?: Turn[];
  name?: string;
  language?: string;
};

const SERVER_PORT = 3001;

/**
 * In development the backend runs on the same laptop as the Expo dev server,
 * so reuse the host Expo Go connected to. A URL in Settings overrides this.
 */
export function resolveServerUrl(override: string): string {
  if (override.trim()) return override.trim().replace(/\/+$/, "");
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return `http://${host ?? "localhost"}:${SERVER_PORT}`;
}

async function readError(res: Response) {
  try {
    const body = await res.json();
    return body.error ?? `Server error ${res.status}`;
  } catch {
    return `Server error ${res.status}`;
  }
}

export async function checkHealth(baseUrl: string): Promise<{ ok: boolean; stt: boolean; model: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${baseUrl}/api/health`, { signal: controller.signal });
    if (!res.ok) throw new Error(await readError(res));
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function askHelper(baseUrl: string, req: AskRequest): Promise<HelperAnswer> {
  const res = await fetch(`${baseUrl}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function transcribeAudio(baseUrl: string, uri: string, language: string): Promise<string> {
  const form = new FormData();
  // Expo's global fetch doesn't accept React Native's { uri, name, type } descriptor; File implements Blob.
  form.append("audio", new File(uri), "question.m4a");
  form.append("language", language);
  const res = await fetch(`${baseUrl}/api/transcribe`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await readError(res));
  const body: { text: string } = await res.json();
  return body.text;
}
