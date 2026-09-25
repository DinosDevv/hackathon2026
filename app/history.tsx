import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { spokenText } from "../src/components/AnswerCard";
import { BigButton, Screen, Txt } from "../src/components/ui";
import { clearHistory, loadHistory, type HistoryEntry } from "../src/history";
import { useSettings } from "../src/settings";
import { speak } from "../src/speech";
import { colors } from "../src/theme";

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
      <Screen>
        <Txt size="large">You haven't asked anything yet. Your questions and answers will appear here.</Txt>
      </Screen>
    );
  }

  return (
    <Screen>
      {entries.map((e) => {
        const v = colors.verdict[e.answer.verdict];
        const isOpen = open === e.id;
        return (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            onPress={() => setOpen(isOpen ? null : e.id)}
            style={{ backgroundColor: v.bg, borderColor: v.fg, borderWidth: 2, borderRadius: 16, padding: 14, gap: 6 }}
          >
            <Txt size="small" color={colors.muted}>
              {new Date(e.date).toLocaleString()}
            </Txt>
            <Txt size="large" bold color={v.fg}>
              {v.icon} {e.answer.headline}
            </Txt>
            <Txt color={colors.muted}>“{e.question}”</Txt>
            {isOpen && (
              <View style={{ gap: 10, marginTop: 6 }}>
                <Txt>{e.answer.explanation}</Txt>
                {e.answer.steps.map((s, i) => (
                  <Txt key={i}>
                    {i + 1}. {s}
                  </Txt>
                ))}
                <BigButton icon="🔊" label="Read it to me" onPress={() => speak(spokenText(e.answer), settings)} />
              </View>
            )}
          </Pressable>
        );
      })}
      <BigButton
        variant="danger"
        label="Delete all"
        onPress={() =>
          Alert.alert("Delete all past questions?", undefined, [
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
