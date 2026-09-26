import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { emergencyNumber } from "../emergency";
import { useSettings } from "../settings";
import { colors, radius } from "../theme";
import { Icon } from "./Icon";
import Reanimated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { PressableScale, arrive } from "./motion";
import { BigButton, Txt } from "./ui";

// iOS asks "Call …?" before dialling and Android opens the dialler, so a stray tap never calls on its own.
function call(number: string) {
  Linking.openURL(`tel:${number.replace(/[^\d+]/g, "")}`).catch(() => {});
}

/** Shown when Helper thinks the user may need urgent help: one tap to emergency services or their guardian. */
export function EmergencyPanel() {
  const { settings } = useSettings();
  const number = emergencyNumber(settings);
  const guardian = settings.familyName || "την οικογένεια";

  // Two gentle pulses on the call button draw the eye without alarming anyone.
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    pulse.value = withDelay(400, withRepeat(withSequence(withTiming(1.04, { duration: 300 }), withTiming(1, { duration: 300 })), 2));
  }, [pulse]);

  return (
    <Reanimated.View entering={arrive()} style={styles.panel} accessibilityRole="alert">
      <View style={styles.title}>
        <Icon name="emergency" size={30} color={colors.danger} />
        <Txt size="large" bold style={{ flex: 1 }} header>
          Χρειάζεσαι βοήθεια τώρα;
        </Txt>
      </View>
      <Reanimated.View style={pulseStyle}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Κάλεσε το ${number}, υπηρεσίες έκτακτης ανάγκης`}
          onPress={() => call(number)}
          style={styles.sos}
        >
          <View style={styles.sosIcon}>
            <Icon name="call" size={34} color={colors.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt size="title" bold color={colors.primaryText}>
              Κάλεσε το {number}
            </Txt>
            <Txt color={colors.primaryText}>Υπηρεσίες έκτακτης ανάγκης</Txt>
          </View>
        </PressableScale>
      </Reanimated.View>
      {settings.familyPhone ? (
        <BigButton icon="call" label={`Κάλεσε: ${guardian}`} onPress={() => call(settings.familyPhone)} />
      ) : null}
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.verdict.danger.bg, borderRadius: radius.md, borderWidth: 2, borderColor: colors.danger, padding: 16, gap: 12 },
  title: { flexDirection: "row", alignItems: "center", gap: 10 },
  sos: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: colors.danger, borderRadius: radius.md, minHeight: 96, paddingHorizontal: 16 },
  sosIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
});
