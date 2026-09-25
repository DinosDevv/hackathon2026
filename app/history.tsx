import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { VerdictLabel, spokenText } from "../src/components/AnswerCard";
import { Icon } from "../src/components/Icon";
import { BigButton, IconBadge, QuietButton, Screen, Txt, tap } from "../src/components/ui";
import { clearHistory, loadHistory, type HistoryEntry } from "../src/history";
import { useSettings } from "../src/settings";
import { speak } from "../src/speech";
import { colors, radius } from "../src/theme";

function friendlyDate(iso: string) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 0) return `Today at ${time}`;
  if (days === 1) return `Yesterday at ${time}`;
  return `${date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} at ${time}`;
}

export default function History() {
  const { settings } = useSettings();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setEntries);
    }, []),
  );

  if (entries.length === 0) {
    return (
      <Screen title="Past answers">
        <View style={styles.empty}>
          <IconBadge name="history" size={88} />
          <Txt size="large" center>
            Nothing here yet. When you ask Helper something, the answer is saved here so you can read it again.
          </Txt>
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Past answers">
      <Txt color={colors.muted}>Tap an answer to read it again.</Txt>
      {entries.map((e) => {
        const v = colors.verdict[e.answer.verdict];
        const isOpen = open === e.id;
        return (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            accessibilityState={{ expanded: isOpen }}
            onPress={() => {
              tap();
              setOpen(isOpen ? null : e.id);
            }}
            style={[styles.item, { borderLeftColor: v.fg }]}
          >
            <View style={styles.itemHeader}>
              <VerdictLabel verdict={e.answer.verdict} />
              <Icon name={isOpen ? "close" : "forward"} size={18} color={colors.muted} />
            </View>
            <Txt size="large" bold>
              {e.answer.headline}
            </Txt>
            <Txt color={colors.muted}>You asked: {e.question}</Txt>
            <Txt size="small" color={colors.muted}>
              {friendlyDate(e.date)}
            </Txt>
            {isOpen && (
              <View style={styles.detail}>
                <Txt>{e.answer.explanation}</Txt>
                {e.answer.steps.map((s, i) => (
                  <Txt key={i}>
                    {i + 1}. {s}
                  </Txt>
                ))}
                <BigButton icon="speaker" label="Read it to me" onPress={() => speak(spokenText(e.answer), settings)} />
              </View>
            )}
          </Pressable>
        );
      })}
      <QuietButton
        icon="trash"
        label="Delete all past answers"
        color={colors.danger}
        onPress={() =>
          Alert.alert("Delete all past answers?", "This can't be undone.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                await clearHistory();
                setEntries([]);
              },
            },
          ])
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", gap: 20, paddingVertical: 40, paddingHorizontal: 8 },
  item: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 6,
    padding: 16,
    gap: 6,
  },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detail: { gap: 10, marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
});
