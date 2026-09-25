import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, useFontSizes } from "../theme";

type Size = keyof ReturnType<typeof useFontSizes>;

export function Txt({
  children,
  size = "body",
  bold,
  color = colors.text,
  style,
  center,
}: {
  children: ReactNode;
  size?: Size;
  bold?: boolean;
  color?: string;
  style?: StyleProp<TextStyle>;
  center?: boolean;
}) {
  const fonts = useFontSizes();
  return (
    <Text
      style={[
        { fontSize: fonts[size], lineHeight: Math.round(fonts[size] * 1.35), color },
        bold && { fontWeight: "700" },
        center && { textAlign: "center" },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.screen} edges={["bottom", "left", "right"]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger";

export function BigButton({
  label,
  hint,
  icon,
  onPress,
  variant = "secondary",
  loading,
  disabled,
  style,
}: {
  label: string;
  hint?: string;
  icon?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fg = variant === "secondary" ? colors.text : colors.primaryText;
  const bg = variant === "primary" ? colors.primary : variant === "danger" ? colors.listening : colors.card;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      disabled={disabled || loading}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: variant === "secondary" ? colors.border : bg },
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}
    >
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <View style={{ flex: 1 }}>
        <Txt size="large" bold color={fg}>
          {label}
        </Txt>
        {hint ? (
          <Txt size="small" color={variant === "secondary" ? colors.muted : fg}>
            {hint}
          </Txt>
        ) : null}
      </View>
      {loading ? <ActivityIndicator color={fg} /> : null}
    </Pressable>
  );
}

export function Choice<T extends string | number | boolean>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.choiceRow}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.choice, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <Txt bold center color={selected ? colors.primaryText : colors.text}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const fonts = useFontSizes();
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      <Txt bold>{label}</Txt>
      <TextInput
        placeholderTextColor="#8A8A8A"
        {...rest}
        style={[styles.input, { fontSize: fonts.body }, style]}
      />
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  button: {
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  icon: { fontSize: 32 },
  choiceRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  choice: {
    flexGrow: 1,
    minHeight: 60,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    minHeight: 60,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
  },
});
