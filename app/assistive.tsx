import * as Clipboard from "expo-clipboard";
import { Alert, Linking, View } from "react-native";
import { resolveServerUrl } from "../src/api";
import { BigButton, Card, Screen, Txt } from "../src/components/ui";
import { useSettings } from "../src/settings";
import { colors } from "../src/theme";

function Step({ n, children }: { n: number; children: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <Txt bold color={colors.primary}>
        {n}.
      </Txt>
      <Txt style={{ flex: 1 }}>{children}</Txt>
    </View>
  );
}

export default function Assistive() {
  const { settings } = useSettings();
  const shortcutUrl = `${resolveServerUrl(settings.serverUrl)}/api/shortcut`;

  return (
    <Screen>
      <Txt size="large">
        Put a Helper button on top of every app. Tap it on any screen, ask your question out loud, and Helper looks at
        your screen and answers.
      </Txt>
      <Txt color={colors.muted}>Ask a family member to do this setup once. It takes about 5 minutes.</Txt>

      <Card>
        <Txt size="large" bold>
          Part 1 — Make the "Helper" shortcut
        </Txt>
        <Step n={1}>Open the Shortcuts app and tap + to make a new shortcut. Name it "Helper".</Step>
        <Step n={2}>Add the action "Take Screenshot".</Step>
        <Step n={3}>Add the action "Dictate Text" (this listens to the question).</Step>
        <Step n={4}>
          Add "Get Contents of URL". Paste the address below. Tap the arrow: set Method to POST, Request Body to Form.
          Add a File field named "image" set to Screenshot, and a Text field named "question" set to Dictated Text.
        </Step>
        <Step n={5}>Add "Speak Text" and set it to "Contents of URL".</Step>
        <Txt bold>Address to paste:</Txt>
        <Txt size="small" style={{ fontFamily: "Courier" }}>
          {shortcutUrl}
        </Txt>
        <BigButton
          icon="📋"
          label="Copy the address"
          onPress={async () => {
            await Clipboard.setStringAsync(shortcutUrl);
            Alert.alert("Copied");
          }}
        />
        <BigButton icon="🧩" label="Open the Shortcuts app" onPress={() => Linking.openURL("shortcuts://").catch(() => {})} />
      </Card>

      <Card>
        <Txt size="large" bold>
          Part 2 — Put it on the floating button
        </Txt>
        <Step n={1}>Open Settings → Accessibility → Touch → AssistiveTouch, and turn it on. A round button appears.</Step>
        <Step n={2}>Under "Custom Actions", choose "Single-Tap" (or "Double-Tap") and pick "Helper" from the Shortcuts list.</Step>
        <Step n={3}>Now tap the round button on any screen and ask, for example: "Is this message safe?"</Step>
      </Card>

      <Card>
        <Txt size="large" bold>
          Other ways to start Helper
        </Txt>
        <Txt>• Back Tap: Settings → Accessibility → Touch → Back Tap → Double Tap → Helper. Then tap the back of the phone twice.</Txt>
        <Txt>• Siri: say "Hey Siri, Helper".</Txt>
      </Card>
    </Screen>
  );
}
