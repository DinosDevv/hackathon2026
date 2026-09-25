import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { setPendingAttachment } from "../attachments";
import { Icon } from "../components/Icon";
import { Txt, tap } from "../components/ui";
import { useSettings } from "../settings";
import { colors } from "../theme";

function greetingFor(date: Date) {
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** A slow, calm "breathing" ring: Helper is present and ready. */
function Breathing({ size }: { size: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <>
      <Animated.View
        style={[styles.ring, styles.outer, { width: size + 120, height: size + 120, transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }] }]}
      />
      <Animated.View
        style={[styles.ring, styles.inner, { width: size + 56, height: size + 56, transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}
      />
    </>
  );
}

/** The centre page: the whole screen is one button that starts a conversation. */
export function TalkPage({ width }: { width: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  // Smaller phones (iPhone SE, mini) get a smaller circle so the text still fits.
  const mic = useWindowDimensions().height < 740 ? 128 : 170;
  const now = new Date();
  const today = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  const talk = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPendingAttachment(null);
    router.push({ pathname: "/ask", params: { listen: "1" } });
  };

  return (
    <View style={[styles.page, { width, paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Txt size="small" bold color="#BFDAD6">
          {today}
        </Txt>
        <Txt size="title" bold color={colors.primaryText} header>
          {greetingFor(now)}
          {settings.name ? `, ${settings.name}` : ""}
        </Txt>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Talk to Helper. Tap, then say what you need."
        onPress={talk}
        style={({ pressed }) => [styles.talk, pressed && { opacity: 0.85 }]}
      >
        <View style={[styles.presence, { width: mic + 120, height: mic + 120 }]}>
          <Breathing size={mic} />
          <View style={[styles.mic, { width: mic, height: mic, borderRadius: mic / 2 }]}>
            <Icon name="mic" size={mic * 0.42} color={colors.primary} />
          </View>
        </View>
        <Txt size="huge" bold color={colors.primaryText} center>
          I'm here for you
        </Txt>
        <Txt size="large" color="#D5E8E5" center>
          Tap and tell me what you need
        </Txt>
        <View style={styles.available}>
          <View style={styles.dot} />
          <Txt size="small" bold color={colors.primaryText}>
            Here for you, day or night
          </Txt>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Emergency. Call for help."
        onPress={() => {
          tap();
          router.push("/emergency");
        }}
        hitSlop={10}
        style={({ pressed }) => [styles.emergency, pressed && { opacity: 0.7 }]}
      >
        <Icon name="emergency" size={20} color={colors.danger} />
        <Txt bold color={colors.danger}>
          Emergency
        </Txt>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.primary, paddingHorizontal: 24, paddingBottom: 18 },
  header: { gap: 2 },
  talk: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  presence: { alignItems: "center", justifyContent: "center", marginBottom: 12 },
  ring: { position: "absolute", borderRadius: 999 },
  outer: { backgroundColor: "rgba(255,255,255,0.08)" },
  inner: { backgroundColor: "rgba(255,255,255,0.14)" },
  mic: {
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  available: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#7FE0A6" },
  emergency: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 26,
    backgroundColor: colors.card,
  },
});
