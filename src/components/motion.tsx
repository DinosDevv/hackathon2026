import type { ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

// Calm, consistent motion. Reanimated skips these when the phone's Reduce Motion setting is on.
const SPRING = { damping: 18, stiffness: 260, mass: 0.8 };

/** A message arriving: rises a little and fades in. */
export const arrive = (delay = 0) => FadeInDown.duration(320).delay(delay).springify().damping(20).stiffness(180);
/** Secondary content (quick replies, details) fading in after the main thing. */
export const appear = (delay = 0) => FadeIn.duration(260).delay(delay);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that gives a soft squeeze when touched, so every tap feels acknowledged. */
export function PressableScale({
  children,
  style,
  scaleTo = 0.96,
  ...props
}: Omit<PressableProps, "style" | "children"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, SPRING);
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING);
        props.onPressOut?.(e);
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}
