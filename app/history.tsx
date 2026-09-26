import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import Reanimated, { LinearTransition } from "react-native-reanimated";
import { VerdictLabel } from "../src/components/AnswerCard";
import { HelperFace } from "../src/components/HelperFace";
import { Icon } from "../src/components/Icon";
import { PressableScale, appear } from "../src/components/motion";
import { BigButton, QuietButton, Screen, Txt, tap } from "../src/components/ui";
import { clearHistory, loadHistory, type HistoryEntry } from "../src/history";
import { useSettings } from "../src/settings";
import { speak, spokenText } from "../src/speech";
import { colors, radius } from "../src/theme";

function friendlyDate(iso: string) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("el-GR", { hour: "numeric", minute: "2-digit" });
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 0) return `Σήμερα στις ${time}`;
  if (days === 1) return `Χθες στις ${time}`;
  return `${date.toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long" })} στις ${time}`;
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
      <Screen title="Παλιές απαντήσεις">
        <View style={styles.empty}>
          <HelperFace size={96} />
          <Txt size="large" bold center>
            Τίποτα ακόμα. Καθαρό μητρώο!
          </Txt>
          <Txt center color={colors.muted}>
            Όταν με ρωτάς κάτι, κρατάω την απάντηση εδώ για να τη διαβάσεις ξανά.
          </Txt>
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Παλιές απαντήσεις">
      <Txt color={colors.muted}>Πάτα μια απάντηση για να τη διαβάσεις ξανά.</Txt>
      {entries.map((e) => {
        const v = colors.verdict[e.answer.verdict];
        const isOpen = open === e.id;
        return (
          <Reanimated.View key={e.id} layout={LinearTransition.duration(250)}>
            <PressableScale
              scaleTo={0.98}
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
              <Txt color={colors.muted}>Ρώτησες: {e.question}</Txt>
              <Txt size="small" color={colors.muted}>
                {friendlyDate(e.date)}
              </Txt>
              {isOpen && (
                <Reanimated.View entering={appear()} style={styles.detail}>
                  <Txt>{e.answer.explanation}</Txt>
                  {e.answer.steps.map((s, i) => (
                    <Txt key={i}>
                      {i + 1}. {s}
                    </Txt>
                  ))}
                  <BigButton icon="speaker" label="Διάβασέ το μου" onPress={() => speak(spokenText(e.answer, settings.language), settings)} />
                </Reanimated.View>
              )}
            </PressableScale>
          </Reanimated.View>
        );
      })}
      <QuietButton
        icon="trash"
        label="Σβήσε όλες τις παλιές απαντήσεις"
        color={colors.danger}
        onPress={() =>
          Alert.alert("Να σβηστούν όλες οι παλιές απαντήσεις;", "Δεν γίνεται αναίρεση.", [
            { text: "Άκυρο", style: "cancel" },
            {
              text: "Διαγραφή",
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
