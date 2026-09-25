import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { pickScreenshot, readClipboard, setPendingAttachment, takePhoto, type Attachment } from "../src/attachments";
import { BigButton, Screen, Txt } from "../src/components/ui";
import { useSettings } from "../src/settings";
import { colors } from "../src/theme";

const QUESTIONS = {
  safe: "Is this safe? Could it be a scam? What should I do?",
  explain: "Please explain what is on this screen and what I should do.",
  read: "Please read this to me and explain what it means in simple words.",
  link: "Is this message or link safe? Could it be a scam?",
};

export default function Home() {
  const router = useRouter();
  const { settings } = useSettings();
  const [busy, setBusy] = useState<string | null>(null);

  if (!settings.onboarded) return <Redirect href="/onboarding" />;

  const startWith = async (key: keyof typeof QUESTIONS, get: () => Promise<Attachment | null>, emptyMessage?: string) => {
    setBusy(key);
    try {
      const attachment = await get();
      if (!attachment) {
        if (emptyMessage) Alert.alert("Nothing to check yet", emptyMessage);
        return;
      }
      setPendingAttachment(attachment);
      router.push({ pathname: "/ask", params: { question: QUESTIONS[key] } });
    } catch (e) {
      Alert.alert("Something went wrong", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const greeting = settings.name ? `Hello, ${settings.name}` : "Hello";

  return (
    <Screen>
      <Txt size="title" bold>
        {greeting} 👋
      </Txt>
      <Txt color={colors.muted}>What can I help you with?</Txt>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ask Helper. Press and speak your question."
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setPendingAttachment(null);
          router.push({ pathname: "/ask", params: { listen: "1" } });
        }}
        style={({ pressed }) => [styles.mic, pressed && { opacity: 0.8 }]}
      >
        <Txt size="huge">🎤</Txt>
        <Txt size="title" bold color={colors.primaryText}>
          Ask Helper
        </Txt>
        <Txt color={colors.primaryText}>Press and speak your question</Txt>
      </Pressable>

      <Txt size="large" bold style={{ marginTop: 8 }}>
        Is something suspicious?
      </Txt>
      <BigButton
        icon="🛡️"
        label="Check a screenshot"
        hint="A message, email or website you saved"
        loading={busy === "safe"}
        onPress={() => startWith("safe", pickScreenshot)}
      />
      <BigButton
        icon="🔗"
        label="Check a copied message or link"
        hint="Press and hold on it, tap Copy, then come here"
        loading={busy === "link"}
        onPress={() =>
          startWith(
            "link",
            readClipboard,
            "Nothing has been copied. Press and hold on the message or link, tap Copy, then come back and press this button.",
          )
        }
      />

      <Txt size="large" bold style={{ marginTop: 8 }}>
        Help me understand
      </Txt>
      <BigButton
        icon="📷"
        label="Read a letter or sign"
        hint="Take a photo and I'll explain it"
        loading={busy === "read"}
        onPress={() => startWith("read", takePhoto)}
      />
      <BigButton
        icon="📱"
        label="Explain a screenshot"
        hint="I'll tell you what's on it and what to do"
        loading={busy === "explain"}
        onPress={() => startWith("explain", pickScreenshot)}
      />

      <View style={styles.footer}>
        <BigButton icon="✨" label="Use Helper in any app" onPress={() => router.push("/assistive")} />
        <BigButton icon="🕘" label="Past questions" onPress={() => router.push("/history")} />
        <BigButton icon="⚙️" label="Settings" onPress={() => router.push("/settings")} />
        {settings.familyPhone ? (
          <BigButton
            icon="📞"
            label={`Call ${settings.familyName || "family"}`}
            onPress={() => Linking.openURL(`tel:${settings.familyPhone}`).catch(() => {})}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mic: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 28,
    alignItems: "center",
    gap: 4,
  },
  footer: { gap: 12, marginTop: 16 },
});
