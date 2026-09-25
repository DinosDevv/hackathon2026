import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pickScreenshot, readClipboard, setPendingAttachment, takePhoto, type Attachment } from "../attachments";
import { IconBadge, Txt, tap } from "../components/ui";
import type { IconName } from "../components/Icon";
import { colors, radius } from "../theme";

// Helper always says whether something is safe, so one question per source is enough.
const SOURCES = {
  photo: {
    icon: "camera",
    label: "Take a photo",
    hint: "Of a letter, a bill or a sign",
    question: "Please read this to me and explain what it means and what I should do.",
    get: takePhoto,
  },
  screenshot: {
    icon: "screenshot",
    label: "Choose a screenshot",
    hint: "Of a message, an email or a website",
    question: "What is this? Is it safe, and what should I do?",
    get: pickScreenshot,
  },
  copied: {
    icon: "paste",
    label: "Check what I copied",
    hint: "A message or a link you copied",
    question: "Is this message or link safe? Could it be a scam? What should I do?",
    get: readClipboard,
  },
} satisfies Record<string, { icon: IconName; label: string; hint: string; question: string; get: () => Promise<Attachment | null> }>;

type Source = keyof typeof SOURCES;

/** Left page: show Helper a letter, a screenshot or something copied. */
export function ShowPage({ width }: { width: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<Source | null>(null);

  const start = async (key: Source) => {
    tap();
    setBusy(key);
    try {
      const attachment = await SOURCES[key].get();
      if (!attachment) {
        if (key === "copied") {
          Alert.alert(
            "Nothing copied yet",
            "Press and hold on the message or link, tap Copy, then come back and press this button again.",
          );
        }
        return;
      }
      setPendingAttachment(attachment);
      router.push({ pathname: "/ask", params: { question: SOURCES[key].question } });
    } catch (e) {
      Alert.alert("Something went wrong", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView style={{ width }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Txt size="title" bold header>
        Show me something
      </Txt>
      <Txt size="large" color={colors.muted}>
        I'll tell you what it is, if it's safe, and what to do.
      </Txt>
      {(Object.keys(SOURCES) as Source[]).map((key) => {
        const s = SOURCES[key];
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={`${s.label}. ${s.hint}`}
            accessibilityState={{ busy: busy === key }}
            disabled={busy !== null}
            onPress={() => start(key)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.75, transform: [{ scale: 0.985 }] }]}
          >
            <IconBadge name={s.icon} size={72} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt size="large" bold>
                {s.label}
              </Txt>
              <Txt color={colors.muted}>{s.hint}</Txt>
            </View>
            {busy === key ? <ActivityIndicator color={colors.primary} /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 112,
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
