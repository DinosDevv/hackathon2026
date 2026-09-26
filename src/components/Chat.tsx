import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { colors } from "../theme";
import { HelperFace, type Mood } from "./HelperFace";
import { Icon, type IconName } from "./Icon";
import Reanimated from "react-native-reanimated";
import { PressableScale, appear, arrive } from "./motion";
import { Txt, tap } from "./ui";

const AVATAR = 36;

/**
 * A message from Helper: left side, white, with Helper's face beside it like a contact photo.
 * `first` shows the face (the first bubble of a group); `mood` sets its expression.
 */
export function HelperBubble({ children, first = true, mood = "happy" }: { children: ReactNode; first?: boolean; mood?: Mood }) {
  return (
    <Reanimated.View entering={arrive(first ? 0 : 220)} style={styles.helperRow}>
      {first ? <HelperFace size={AVATAR} mood={mood} /> : <View style={{ width: AVATAR }} />}
      <View style={[styles.bubble, styles.helperBubble, !first && { borderTopLeftRadius: 22 }]}>{children}</View>
    </Reanimated.View>
  );
}

/** A message from the user: right side, teal. */
export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <Reanimated.View entering={arrive()} style={[styles.bubble, styles.userBubble]}>
      {children}
    </Reanimated.View>
  );
}

/** Tappable replies and actions under a Helper message, like quick replies in a messaging app. */
export function Chips({ children }: { children: ReactNode }) {
  return (
    <Reanimated.View entering={appear(180)} style={styles.chips}>
      {children}
    </Reanimated.View>
  );
}

export function Chip({ label, icon, onPress, primary, color }: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  primary?: boolean;
  color?: string;
}) {
  const fg = primary ? colors.primaryText : (color ?? colors.primary);
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[
        styles.chip,
        primary && { backgroundColor: color ?? colors.primary, borderColor: color ?? colors.primary },
      ]}
    >
      {icon ? <Icon name={icon} size={20} color={fg} /> : null}
      <Txt bold color={fg}>
        {label}
      </Txt>
    </PressableScale>
  );
}

function Dot({ delay }: { delay: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, { toValue: 1, duration: 350, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 350, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.delay(600 - delay),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay]);
  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
        },
      ]}
    />
  );
}

/** "Helper is typing…" */
export function TypingBubble({ label, lines }: { label: string; lines: string[] }) {
  // Cycle through a few playful status lines so waiting feels like someone is on it.
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => Math.min(i + 1, lines.length - 1)), 2200);
    return () => clearInterval(timer);
  }, [lines.length]);
  return (
    <View accessible accessibilityLabel={label} accessibilityLiveRegion="polite">
      <HelperBubble mood="calm">
        <View style={styles.typing}>
          <View style={styles.dots}>
            <Dot delay={0} />
            <Dot delay={150} />
            <Dot delay={300} />
          </View>
          <Reanimated.View key={index} entering={appear()}>
            <Txt color={colors.muted}>{lines[index]}</Txt>
          </Reanimated.View>
        </View>
      </HelperBubble>
    </View>
  );
}

const styles = StyleSheet.create({
  helperRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bubble: { maxWidth: "84%", borderRadius: 22, paddingVertical: 12, paddingHorizontal: 16, gap: 8 },
  helperBubble: { backgroundColor: colors.card, borderTopLeftRadius: 6, flexShrink: 1 },
  userBubble: { alignSelf: "flex-end", backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginLeft: AVATAR + 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  typing: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  dots: { flexDirection: "row", gap: 6, paddingVertical: 8, paddingHorizontal: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.muted },
});
