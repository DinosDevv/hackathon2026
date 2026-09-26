import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { setPendingAttachment } from "../attachments";
import { EMERGENCY_BUTTON_SPACE } from "../components/EmergencyButton";
import { HelperFace } from "../components/HelperFace";
import { Icon } from "../components/Icon";
import { greetingLine } from "../personality";
import { PressableScale } from "../components/motion";
import { Txt } from "../components/ui";
import { callName, useSettings } from "../settings";
import { colors } from "../theme";

function greetingFor(date: Date) {
  return date.getHours() < 13 ? "Καλημέρα" : "Καλησπέρα";
}

// The opening animation plays once per app launch, not every time they come back to this page.
let introPlayed = false;

/** A slow, calm "breathing" ring: HelpNona is present and ready. Stays still with Reduce Motion on. */
function Breathing({ size }: { size: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [t]);
  const outer = useAnimatedStyle(() => ({ transform: [{ scale: 0.82 + t.value * 0.18 }] }));
  const inner = useAnimatedStyle(() => ({ transform: [{ scale: 0.9 + t.value * 0.1 }] }));
  return (
    <>
      <Reanimated.View style={[styles.ring, styles.outer, { width: size + 120, height: size + 120 }, outer]} />
      <Reanimated.View style={[styles.ring, styles.inner, { width: size + 56, height: size + 56 }, inner]} />
    </>
  );
}

/** "Tap here and talk", a speech bubble pointing down at HelpNona that bobs gently so the eye finds it. */
function TapHint() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [t]);
  const bob = useAnimatedStyle(() => ({ transform: [{ translateY: t.value * 6 }] }));
  return (
    <Reanimated.View style={[styles.hint, bob]}>
      <View style={styles.hintBubble}>
        <Txt size="large" bold color={colors.primary}>
          Πάτα εδώ και μίλα
        </Txt>
      </View>
      <View style={styles.hintTail} />
    </Reanimated.View>
  );
}

/** The centre page: the whole screen is one button that starts a conversation. */
export function TalkPage({ width }: { width: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  // Smaller phones (iPhone SE, mini) get a smaller avatar so the text still fits.
  const face = useWindowDimensions().height < 740 ? 150 : 200;
  const now = new Date();
  const today = now.toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long" });

  // A fresh cheeky greeting each time they come back to this page.
  const [line, setLine] = useState(() => greetingLine());
  useFocusEffect(useCallback(() => setLine(greetingLine()), []));

  // Opening: the HelpNona name shows, then drifts up and fades while the avatar grows to full size
  // and the rest of the page fades in. 0 = opening, 1 = normal page.
  const intro = useSharedValue(introPlayed ? 1 : 0);
  useEffect(() => {
    if (introPlayed) return;
    introPlayed = true;
    intro.value = withDelay(1300, withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.cubic) }));
  }, [intro]);
  const titleStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, intro.value * 1.6),
    transform: [{ translateY: -90 * intro.value }, { scale: 1 - 0.08 * intro.value }],
  }));
  const avatarStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.62 + 0.38 * intro.value }] }));
  // Everything else comes in during the second half of the opening.
  const restStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, (intro.value - 0.45) / 0.55) }));

  const talk = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPendingAttachment(null);
    router.push({ pathname: "/ask", params: { listen: "1" } });
  };

  return (
    <View style={[styles.page, { width, paddingTop: insets.top + 16 }]}>
      <Reanimated.View style={[styles.header, restStyle]}>
        <Txt size="small" bold color="#BFDAD6">
          {today}
        </Txt>
        <Txt size="title" bold color={colors.primaryText} header>
          {greetingFor(now)}
          {callName(settings) ? `, ${callName(settings)}` : ""}
        </Txt>
      </Reanimated.View>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Μίλα στον HelpNona. Πάτα και πες τι χρειάζεσαι."
        onPress={talk}
        scaleTo={0.97}
        style={styles.talk}
      >
        <Reanimated.View style={restStyle}>
          <TapHint />
        </Reanimated.View>
        <Reanimated.View style={[styles.presence, { width: face + 120, height: face + 120 }, avatarStyle]}>
          <Breathing size={face} />
          <View style={[styles.face, { borderRadius: face / 2 }]}>
            <HelperFace size={face} tone="light" />
            {/* Small microphone badge: this face is the button you talk to. */}
            <View style={[styles.micBadge, { width: face * 0.3, height: face * 0.3, borderRadius: face * 0.15 }]}>
              <Icon name="mic" size={face * 0.15} color={colors.primaryText} />
            </View>
          </View>
        </Reanimated.View>
        <Reanimated.View style={restStyle}>
          <Txt size="title" bold color={colors.primaryText} center>
            {line}
          </Txt>
        </Reanimated.View>
      </PressableScale>

      {/* The opening title, above everything; it leaves by drifting up and fading out. */}
      <Reanimated.View pointerEvents="none" style={[styles.intro, { top: insets.top + 70 }, titleStyle]}>
        <Txt size="huge" bold color={colors.primaryText} center style={styles.wordmark}>
          HelpNona
        </Txt>
        <Txt size="large" color="#D5E8E5" center>
          Το εγγόνι στο κινητό σου
        </Txt>
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.primary, paddingHorizontal: 24, paddingBottom: 18 },
  header: { gap: 2, paddingRight: EMERGENCY_BUTTON_SPACE - 24 },
  talk: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  presence: { alignItems: "center", justifyContent: "center", marginBottom: 12 },
  ring: { position: "absolute", borderRadius: 999 },
  outer: { backgroundColor: "rgba(255,255,255,0.08)" },
  inner: { backgroundColor: "rgba(255,255,255,0.14)" },
  face: {
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  micBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0703F",
    borderWidth: 4,
    borderColor: colors.primary,
  },
  hint: { alignItems: "center", marginBottom: -18, zIndex: 1 },
  hintBubble: { backgroundColor: colors.card, borderRadius: 22, paddingVertical: 10, paddingHorizontal: 20 },
  hintTail: { width: 16, height: 16, backgroundColor: colors.card, transform: [{ rotate: "45deg" }], marginTop: -9 },
  intro: { position: "absolute", left: 24, right: 24, alignItems: "center", gap: 6 },
  wordmark: { fontSize: 52, lineHeight: 60, letterSpacing: -1 },
});
