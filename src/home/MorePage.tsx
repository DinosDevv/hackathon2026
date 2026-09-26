import { useRouter } from "expo-router";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EMERGENCY_BUTTON_SPACE } from "../components/EmergencyButton";
import { BigButton, IconBadge, Txt } from "../components/ui";
import { useSettings } from "../settings";
import { colors, radius } from "../theme";

/** Right page: things that aren't needed every day. */
export function MorePage({ width }: { width: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const guardian = settings.familyName || "Ο κηδεμόνας σου";

  return (
    <ScrollView style={{ width }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Txt size="title" bold header style={{ paddingRight: EMERGENCY_BUTTON_SPACE - 20 }}>
        Περισσότερα
      </Txt>

      {settings.familyPhone ? (
        <View style={styles.guardian}>
          <View style={styles.guardianRow}>
            <IconBadge name="people" size={64} />
            <View style={{ flex: 1 }}>
              <Txt size="large" bold>
                {guardian}
              </Txt>
              <Txt color={colors.muted}>Ο κηδεμόνας σου</Txt>
            </View>
          </View>
          <BigButton
            variant="primary"
            icon="call"
            label={`Κάλεσε: ${settings.familyName || "κηδεμόνας"}`}
            onPress={() => Linking.openURL(`tel:${settings.familyPhone}`).catch(() => {})}
          />
        </View>
      ) : null}

      <BigButton
        variant="row"
        icon="history"
        label="Παλιές απαντήσεις"
        hint="Διάβασέ τες ή άκουσέ τες ξανά"
        onPress={() => router.push("/history")}
      />
      <BigButton
        variant="row"
        icon="settings"
        label="Ρυθμίσεις"
        hint="Μέγεθος γραμμάτων, φωνή, κηδεμόνας"
        onPress={() => router.push("/settings")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  guardian: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 16,
  },
  guardianRow: { flexDirection: "row", alignItems: "center", gap: 14 },
});
