import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pickScreenshot, readClipboard, setPendingAttachment, takePhoto, type Attachment } from "../attachments";
import { EMERGENCY_BUTTON_SPACE } from "../components/EmergencyButton";
import { PressableScale } from "../components/motion";
import { IconBadge, Txt, tap } from "../components/ui";
import type { IconName } from "../components/Icon";
import { colors, radius } from "../theme";

// Helper always says whether something is safe, so one question per source is enough.
const SOURCES = {
  photo: {
    icon: "camera",
    label: "Βγάλε φωτογραφία",
    hint: "Ένα γράμμα, έναν λογαριασμό ή μια πινακίδα",
    question: "Διάβασέ μου το και εξήγησέ μου τι σημαίνει και τι πρέπει να κάνω.",
    get: takePhoto,
  },
  screenshot: {
    icon: "screenshot",
    label: "Διάλεξε στιγμιότυπο οθόνης",
    hint: "Ένα μήνυμα, ένα email ή μια ιστοσελίδα",
    question: "Τι είναι αυτό; Είναι ασφαλές και τι να κάνω;",
    get: pickScreenshot,
  },
  copied: {
    icon: "paste",
    label: "Έλεγξε αυτό που αντέγραψα",
    hint: "Ένα μήνυμα ή ένα λινκ που αντέγραψες",
    question: "Είναι ασφαλές αυτό το μήνυμα ή το λινκ; Μήπως είναι απάτη; Τι να κάνω;",
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
            "Δεν έχεις αντιγράψει τίποτα",
            "Πάτα παρατεταμένα πάνω στο μήνυμα ή στο λινκ, διάλεξε Αντιγραφή, και μετά γύρνα εδώ και πάτα ξανά αυτό το κουμπί.",
          );
        }
        return;
      }
      setPendingAttachment(attachment);
      router.push({ pathname: "/ask", params: { question: SOURCES[key].question } });
    } catch (e) {
      Alert.alert("Κάτι πήγε στραβά", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView style={{ width }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Txt size="title" bold header style={{ paddingRight: EMERGENCY_BUTTON_SPACE - 20 }}>
        Δείξε μου κάτι
      </Txt>
      <Txt size="large" color={colors.muted}>
        Θα σου πω τι είναι, αν είναι ασφαλές και τι να κάνεις.
      </Txt>
      {(Object.keys(SOURCES) as Source[]).map((key) => {
        const s = SOURCES[key];
        return (
          <PressableScale
            key={key}
            accessibilityRole="button"
            accessibilityLabel={`${s.label}. ${s.hint}`}
            accessibilityState={{ busy: busy === key }}
            disabled={busy !== null}
            onPress={() => start(key)}
            style={styles.card}
          >
            <IconBadge name={s.icon} size={72} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt size="large" bold>
                {s.label}
              </Txt>
              <Txt color={colors.muted}>{s.hint}</Txt>
            </View>
            {busy === key ? <ActivityIndicator color={colors.primary} /> : null}
          </PressableScale>
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
