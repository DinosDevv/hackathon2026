import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type AnswerMode = "voice" | "text" | "both";
export type Language = "English" | "Greek";

export type Settings = {
  onboarded: boolean;
  name: string;
  answerMode: AnswerMode;
  textScale: number;
  slowSpeech: boolean;
  language: Language;
  familyName: string;
  familyPhone: string;
  /** Empty means: pick the number for the phone's country. */
  emergencyNumber: string;
  /** Set the first time Helper is opened from the one-press shortcut, so the setup guide can confirm it works. */
  shortcutTested: boolean;
  /** Overrides the auto-detected backend address, e.g. a tunnel URL for demos. */
  serverUrl: string;
};

export const defaultSettings: Settings = {
  onboarded: false,
  name: "",
  answerMode: "both",
  textScale: 1,
  slowSpeech: true,
  language: "English",
  familyName: "",
  familyPhone: "",
  emergencyNumber: "",
  shortcutTested: false,
  serverUrl: "",
};

const STORAGE_KEY = "helper.settings.v1";

type SettingsContextValue = {
  settings: Settings;
  loaded: boolean;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setSettings({ ...defaultSettings, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(defaultSettings);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loaded, update, reset }}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
