import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { colors } from "../theme";
import { Icon } from "./Icon";
import { PressableScale } from "./motion";
import { Txt, tap } from "./ui";

/** Width the page titles leave free on the right, so they never run under the button. */
export const EMERGENCY_BUTTON_SPACE = 150;

/** The red Emergency (Επείγον) button, in the same corner on every page. Opens the Get help screen. */
export function EmergencyButton({ style }: { style?: object }) {
  const router = useRouter();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Επείγον. Κάλεσε για βοήθεια."
      hitSlop={8}
      onPress={() => {
        tap();
        router.push("/emergency");
      }}
      style={[styles.button, style]}
    >
      <Icon name="emergency" size={20} color={colors.primaryText} />
      <Txt bold color={colors.primaryText}>
        Επείγον
      </Txt>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#7A1010",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
