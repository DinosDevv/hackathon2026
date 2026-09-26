import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { colors, radius, useFontSizes } from "../theme";
import { Icon, type IconName } from "./Icon";
import Reanimated, { ZoomIn } from "react-native-reanimated";
import { PressableScale } from "./motion";

type Size = keyof ReturnType<typeof useFontSizes>;

export function tap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function Txt({
  children,
  size = "body",
  bold,
  color = colors.text,
  style,
  center,
  header,
}: {
  children: ReactNode;
  size?: Size;
  bold?: boolean;
  color?: string;
  style?: StyleProp<TextStyle>;
  center?: boolean;
  header?: boolean;
}) {
  const fonts = useFontSizes();
  const big = size === "title" || size === "huge";
  return (
    <Text
      accessibilityRole={header ? "header" : undefined}
      style={[
        { fontSize: fonts[size], lineHeight: Math.round(fonts[size] * (big ? 1.2 : 1.4)), color },
        bold && { fontWeight: big ? "800" : "700" },
        big && { letterSpacing: -0.4 },
        center && { textAlign: "center" },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Every screen but Home gets a big, labelled Back button instead of a small arrow. */
export function TopBar({ backLabel = "Πίσω", right }: { backLabel?: string; right?: ReactNode }) {
  const router = useRouter();
  return (
    <View style={styles.topBar}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        hitSlop={8}
        onPress={() => {
          tap();
          if (router.canGoBack()) router.back();
          else router.replace("/");
        }}
        style={styles.backButton}
      >
        <Icon name="back" size={22} color={colors.primary} />
        <Txt bold color={colors.primary}>
          {backLabel}
        </Txt>
      </PressableScale>
      <View style={{ flex: 1 }} />
      {right}
    </View>
  );
}

export function Screen({
  children,
  title,
  backLabel,
  back = true,
  footer,
}: {
  children: ReactNode;
  title?: string;
  backLabel?: string;
  back?: boolean;
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.screen}>
      {back && <TopBar backLabel={backLabel} />}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {title ? (
            <Txt size="title" bold header>
              {title}
            </Txt>
          ) : null}
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Rounded square behind an icon, tinted to match. */
export function IconBadge({ name, color = colors.primary, bg = colors.primarySoft, size = 56 }: {
  name: IconName;
  color?: string;
  bg?: string;
  size?: number;
}) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg }]}>
      <Icon name={name} size={size * 0.5} color={color} />
    </View>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger" | "row";

/**
 * primary/secondary/danger: solid action buttons.
 * row: a white card with an icon badge that takes you somewhere (shows a chevron).
 */
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
  icon?: IconName;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const solid = variant === "primary" || variant === "danger";
  const fg = solid ? colors.primaryText : variant === "row" ? colors.text : colors.primary;
  const bg = variant === "primary" ? colors.primary : variant === "danger" ? colors.danger : colors.card;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[
        styles.button,
        variant === "row" && styles.rowButton,
        { backgroundColor: bg, borderColor: solid ? bg : colors.border },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      {icon && variant === "row" ? <IconBadge name={icon} /> : null}
      {icon && variant !== "row" ? <Icon name={icon} size={26} color={fg} /> : null}
      <View style={{ flex: variant === "row" ? 1 : undefined, flexShrink: 1 }}>
        <Txt size="large" bold color={fg}>
          {label}
        </Txt>
        {hint ? (
          <Txt size="small" color={solid ? fg : colors.muted}>
            {hint}
          </Txt>
        ) : null}
      </View>
      {loading ? <ActivityIndicator color={fg} /> : variant === "row" ? <Icon name="forward" size={20} color={colors.muted} /> : null}
    </PressableScale>
  );
}

/** Low-emphasis text button for secondary choices ("Type instead", "Delete all"). */
export function QuietButton({ label, icon, onPress, color = colors.primary }: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  color?: string;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress();
      }}
      style={styles.quiet}
    >
      {icon ? <Icon name={icon} size={22} color={color} /> : null}
      <Txt bold color={color}>
        {label}
      </Txt>
    </PressableScale>
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
    <View style={styles.choiceRow} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <PressableScale
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={[styles.choice, selected && styles.choiceSelected]}
          >
            {selected ? (
              <Reanimated.View entering={ZoomIn.duration(200)}>
                <Icon name="check" size={20} color={colors.primaryText} />
              </Reanimated.View>
            ) : null}
            <Txt bold center color={selected ? colors.primaryText : colors.text}>
              {o.label}
            </Txt>
          </PressableScale>
        );
      })}
    </View>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const fonts = useFontSizes();
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 8 }}>
      <Txt bold>{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#7C7F85"
        {...rest}
        style={[styles.input, { fontSize: fonts.body }, style]}
      />
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <Txt size="small" bold color={colors.muted} header style={styles.section}>
      {children.toUpperCase()}
    </Txt>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 16 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 10, borderTopWidth: 1, borderTopColor: colors.border },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, minHeight: 60 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 52,
    paddingLeft: 12,
    paddingRight: 18,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
  },
  badge: { alignItems: "center", justifyContent: "center" },
  button: {
    minHeight: 68,
    borderRadius: radius.md,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  rowButton: { justifyContent: "flex-start", paddingHorizontal: 14, gap: 16, minHeight: 84, borderWidth: 1 },
  quiet: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 52, paddingHorizontal: 12 },
  choiceRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  choice: {
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 60,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  choiceSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  input: {
    minHeight: 60,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 14,
  },
  section: { letterSpacing: 1, marginTop: 8, marginBottom: -4 },
});
