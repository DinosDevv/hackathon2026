import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SettingsProvider, useSettings } from "../src/settings";
import { colors, useFontSizes } from "../src/theme";

function RootStack() {
  const { loaded } = useSettings();
  const fonts = useFontSizes();
  if (!loaded) return null;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontSize: fonts.large, fontWeight: "700" },
        headerTintColor: colors.primary,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Helper" }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="ask" options={{ title: "Helper" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="history" options={{ title: "Past questions" }} />
      <Stack.Screen name="assistive" options={{ title: "Helper everywhere" }} />
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
