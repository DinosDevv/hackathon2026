import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { emergencyNumber } from "../emergency";
import { useSettings } from "../settings";
import { colors, radius } from "../theme";
import { Icon } from "./Icon";
import { BigButton, Txt } from "./ui";

// iOS asks "Call …?" before dialling and Android opens the dialler, so a stray tap never calls on its own.
function call(number: string) {
  Linking.openURL(`tel:${number.replace(/[^\d+]/g, "")}`).catch(() => {});
}

/** Shown when Helper thinks the user may need urgent help: one tap to emergency services or their guardian. */
export function EmergencyPanel() {
  const { settings } = useSettings();
  const number = emergencyNumber(settings);
  const guardian = settings.familyName || "your family";

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }, []);

  return (
    <View style={styles.panel} accessibilityRole="alert">
      <View style={styles.title}>
        <Icon name="emergency" size={30} color={colors.danger} />
        <Txt size="large" bold style={{ flex: 1 }} header>
          Do you need help right now?
        </Txt>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Call ${number}, emergency services`}
        onPress={() => call(number)}
        style={({ pressed }) => [styles.sos, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}
      >
        <View style={styles.sosIcon}>
          <Icon name="call" size={34} color={colors.danger} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt size="title" bold color={colors.primaryText}>
            Call {number}
          </Txt>
          <Txt color={colors.primaryText}>Emergency services</Txt>
        </View>
      </Pressable>
      {settings.familyPhone ? (
        <BigButton icon="call" label={`Call ${guardian}`} onPress={() => call(settings.familyPhone)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.verdict.danger.bg, borderRadius: radius.md, borderWidth: 2, borderColor: colors.danger, padding: 16, gap: 12 },
  title: { flexDirection: "row", alignItems: "center", gap: 10 },
  sos: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: colors.danger, borderRadius: radius.md, minHeight: 96, paddingHorizontal: 16 },
  sosIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
});
