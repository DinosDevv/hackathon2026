import { useEffect } from "react";
import { View } from "react-native";
import Reanimated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { colors } from "../theme";
import { avatarParts, type Mood, type Part } from "./avatarParts";

export type { Mood } from "./avatarParts";

/**
 * Helper's avatar: a cheeky teenage grandson in a knit beanie and hoodie, who blinks now and then
 * and whose eyebrows and mouth follow the mood. "teal" sits on light backgrounds, "light" on teal ones.
 */
export function HelperFace({ size, mood = "happy", tone = "teal" }: { size: number; mood?: Mood; tone?: "teal" | "light" }) {
  const blink = useSharedValue(1);

  useEffect(() => {
    // A natural, slightly irregular blink every few seconds.
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        blink.value = withSequence(withTiming(0.1, { duration: 90 }), withTiming(1, { duration: 120 }));
        schedule();
      }, 2800 + Math.random() * 2600);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [blink]);

  const eyes = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));

  const style = (p: Part) => {
    const [tl, tr, br, bl] = (p.r ?? [0, 0, 0, 0]).map((v) => v * size);
    return {
      position: "absolute" as const,
      left: p.x * size,
      top: p.y * size,
      width: p.w * size,
      height: p.h * size,
      borderTopLeftRadius: tl,
      borderTopRightRadius: tr,
      borderBottomRightRadius: br,
      borderBottomLeftRadius: bl,
      backgroundColor: p.fill,
      opacity: p.opacity ?? 1,
      transform: p.rotate ? [{ rotate: `${p.rotate}deg` }] : undefined,
    };
  };

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: tone === "teal" ? colors.primary : colors.card,
      }}
    >
      {avatarParts(mood).map((p, i) =>
        p.id === "eye" ? <Reanimated.View key={i} style={[style(p), eyes]} /> : <View key={i} style={style(p)} />,
      )}
    </View>
  );
}
