import AsyncStorage from "@react-native-async-storage/async-storage";
import type { HelperAnswer } from "./api";

export type HistoryEntry = {
  id: string;
  date: string;
  question: string;
  answer: HelperAnswer;
};

const STORAGE_KEY = "helper.history.v1";
const MAX_ENTRIES = 50;

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addToHistory(question: string, answer: HelperAnswer) {
  const entries = await loadHistory();
  const entry: HistoryEntry = { id: String(Date.now()), date: new Date().toISOString(), question, answer };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...entries].slice(0, MAX_ENTRIES)));
}

export async function clearHistory() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
