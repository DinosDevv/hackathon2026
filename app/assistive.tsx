import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { resolveServerUrl } from "../src/api";
import { OnePressGuide, Step } from "../src/components/OnePressGuide";
import { BigButton, Card, QuietButton, Screen, SectionTitle, Txt } from "../src/components/ui";
import { useSettings } from "../src/settings";
import { colors } from "../src/theme";

/** The Shortcut that screenshots whatever app is open and speaks Helper's answer, without opening Helper. */
function ScreenShortcut() {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shortcutUrl = `${resolveServerUrl(settings.serverUrl)}/api/shortcut`;

  if (!open) {
    return <QuietButton icon="phone" label="Extra: help with any screen" onPress={() => setOpen(true)} />;
  }
  return (
    <>
      <SectionTitle>Extra: help with any screen</SectionTitle>
      <Card>
        <Txt>
          A second shortcut that looks at whatever is on the screen, listens to the question and answers out loud, without
          opening Helper. Put it on Back Tap if the Action button already opens Helper.
        </Txt>
        <Step n={1}>In Shortcuts, tap + and name the new shortcut "Helper, look".</Step>
        <Step n={2}>Add the actions Take Screenshot, then Dictate Text.</Step>
        <Step n={3}>
          Add Get Contents of URL and paste the address below. Set Method to POST and Request Body to Form. Add a File field
          named "image" set to Screenshot, and a Text field named "question" set to Dictated Text.
        </Step>
        <Step n={4}>Add Speak Text and set it to Contents of URL.</Step>
        <View style={styles.address}>
          <Txt size="small" style={{ fontFamily: "Courier" }}>
            {shortcutUrl}
          </Txt>
        </View>
        <BigButton
          icon={copied ? "check" : "copy"}
          label={copied ? "Address copied" : "Copy the address"}
          onPress={async () => {
            await Clipboard.setStringAsync(shortcutUrl);
            setCopied(true);
          }}
        />
      </Card>
    </>
  );
}

export default function OnePressAccess() {
  return (
    <Screen title="One-press access">
      <Txt size="large">Set up a button so Helper opens with one press, ready to listen. No need to find the app.</Txt>
      <Txt color={colors.muted}>For the guardian: this takes about 3 minutes. Do it once, together.</Txt>
      <OnePressGuide />
      {Platform.OS === "ios" ? <ScreenShortcut /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  address: { backgroundColor: colors.sunken, borderRadius: 12, padding: 12 },
});
