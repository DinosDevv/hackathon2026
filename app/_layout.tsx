import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { checkHealth, resolveServerUrl } from "../src/api";
import { SettingsProvider, useSettings } from "../src/settings";
import { setCloudVoice } from "../src/speech";
import { colors } from "../src/theme";

function RootStack() {
  const { loaded, settings } = useSettings();
  // Find out once whether the server offers Helper's own voice, so every screen can use it.
  useEffect(() => {
    if (!loaded) return;
    const server = resolveServerUrl(settings.serverUrl);
    checkHealth(server)
      .then((h) => setCloudVoice(h.tts ? server : null))
      .catch(() => setCloudVoice(null));
  }, [loaded, settings.serverUrl]);
  if (!loaded) return null;
  // Screens draw their own large, labelled Back button (see TopBar) instead of the small native header.
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="ask" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="history" />
      <Stack.Screen name="assistive" />
      <Stack.Screen name="emergency" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <StatusBar style="dark" />
        <RootStack />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
