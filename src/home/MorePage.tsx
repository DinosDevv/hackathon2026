import { useRouter } from "expo-router";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BigButton, IconBadge, Txt } from "../components/ui";
import { useSettings } from "../settings";
import { colors, radius } from "../theme";

/** Right page: things that aren't needed every day. */
export function MorePage({ width }: { width: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const guardian = settings.familyName || "Your guardian";

  return (
    <ScrollView style={{ width }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Txt size="title" bold header>
        More
      </Txt>

      {settings.familyPhone ? (
        <View style={styles.guardian}>
          <View style={styles.guardianRow}>
            <IconBadge name="people" size={64} />
            <View style={{ flex: 1 }}>
              <Txt size="large" bold>
                {guardian}
              </Txt>
              <Txt color={colors.muted}>Your guardian</Txt>
            </View>
          </View>
          <BigButton
            variant="primary"
            icon="call"
            label={`Call ${settings.familyName || "them"}`}
            onPress={() => Linking.openURL(`tel:${settings.familyPhone}`).catch(() => {})}
          />
        </View>
      ) : null}

      <BigButton
        variant="row"
        icon="history"
        label="Past answers"
        hint="Read or hear them again"
        onPress={() => router.push("/history")}
      />
      <BigButton
        variant="row"
        icon="tap"
        label="One-press access"
        hint="Open Helper with a button on the phone"
        onPress={() => router.push("/assistive")}
      />
      <BigButton
        variant="row"
        icon="settings"
        label="Settings"
        hint="Writing size, voice, guardian"
        onPress={() => router.push("/settings")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  guardian: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 16,
  },
  guardianRow: { flexDirection: "row", alignItems: "center", gap: 14 },
});
