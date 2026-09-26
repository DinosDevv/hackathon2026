import * as Clipboard from "expo-clipboard";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useEffect, useState, type ReactNode } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";
import { checkHealth, resolveServerUrl } from "../api";
import { hasActionButton, isSamsung, listenLink, lookUrl } from "../onePress";
import { useSettings } from "../settings";
import { colors, radius } from "../theme";
import { Icon } from "./Icon";
import { BigButton, Card, QuietButton, SectionTitle, Txt } from "./ui";

export function Step({ n, children }: { n: number; children: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.number}>
        <Txt bold color={colors.primaryText}>
          {n}
        </Txt>
      </View>
      <Txt style={{ flex: 1 }}>{children}</Txt>
    </View>
  );
}

function Path({ title, recommended, children }: { title: string; recommended?: boolean; children: ReactNode }) {
  return (
    <Card style={recommended ? { borderColor: colors.primary, borderWidth: 2 } : undefined}>
      {recommended ? (
        <Txt size="small" bold color={colors.primary}>
          BEST FOR THIS PHONE
        </Txt>
      ) : null}
      <Txt size="large" bold>
        {title}
      </Txt>
      {children}
    </Card>
  );
}

function Status({ done, doneText }: { done: boolean; doneText: string }) {
  return (
    <View style={[styles.status, done && { backgroundColor: colors.verdict.safe.bg }]}>
      <Icon name={done ? "safe" : "tap"} size={26} color={done ? colors.verdict.safe.fg : colors.muted} />
      <Txt bold style={{ flex: 1 }} color={done ? colors.verdict.safe.fg : colors.muted}>
        {done ? doneText : "Not tried yet"}
      </Txt>
    </View>
  );
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <BigButton
      icon={copied ? "check" : "copy"}
      label={copied ? "Copied" : label}
      onPress={async () => {
        await Clipboard.setStringAsync(value);
        setCopied(true);
      }}
    />
  );
}

/** While the guide is open, watch the server for the first screenshot from the shortcut. */
function useLookTest() {
  const { settings, update } = useSettings();
  const [openedAt] = useState(() => Date.now());
  useEffect(() => {
    if (settings.lookTested) return;
    const server = resolveServerUrl(settings.serverUrl);
    const timer = setInterval(() => {
      checkHealth(server)
        .then((h) => {
          // A minute of slack in case the laptop and phone clocks disagree.
          if (h.lastLookAt && Date.parse(h.lastLookAt) > openedAt - 60_000) update({ lookTested: true });
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(timer);
  }, [settings.lookTested, settings.serverUrl, openedAt, update]);
  return settings.lookTested;
}

/** Second, optional shortcut: opens Helper already listening (for Siri or a triple back tap). */
function TalkShortcut() {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (!open) return <QuietButton icon="mic" label="Also: open Helper ready to talk" onPress={() => setOpen(true)} />;
  return (
    <>
      <SectionTitle>Also: open Helper ready to talk</SectionTitle>
      <Card>
        <Txt color={colors.muted}>A second shortcut that opens Helper already listening, for Siri or a triple tap.</Txt>
        <CopyButton label="Copy Helper's link" value={listenLink()} />
        <Step n={1}>In Shortcuts, tap +, search for Open URLs and tap it.</Step>
        <Step n={2}>Tap the pale word URL, then press and hold and tap Paste.</Step>
        <Step n={3}>Rename the shortcut to "Talk to Helper" and tap Done.</Step>
        <Step n={4}>Optional: Back Tap, then Triple Tap, then pick Talk to Helper. Or say "Hey Siri, talk to Helper".</Step>
        <Status done={settings.shortcutTested} doneText="It works. Helper opened from the shortcut." />
        {inExpoGo ? (
          <Txt size="small" color={colors.muted}>
            Test version: this link only works while the laptop is running Expo. The installed app gets a permanent link.
          </Txt>
        ) : null}
      </Card>
    </>
  );
}

function IosGuide() {
  const { settings } = useSettings();
  const action = hasActionButton();
  const tested = useLookTest();
  const trigger = action ? "Press the Action button" : "Tap the back of the phone twice";

  const actionPath = (
    <Path key="action" title="The Action button" recommended={action}>
      <Txt color={colors.muted}>The small button on the left side, above the volume buttons.</Txt>
      <Step n={1}>Open Settings and tap Action Button.</Step>
      <Step n={2}>Swipe sideways until you see Shortcut, then tap Choose a Shortcut.</Step>
      <Step n={3}>Pick Helper, look.</Step>
    </Path>
  );
  const backTapPath = (
    <Path key="backtap" title="Tap the back of the phone" recommended={!action}>
      <Txt color={colors.muted}>Two quick taps on the back of the phone, on any screen.</Txt>
      <Step n={1}>Open Settings, then Accessibility, then Touch.</Step>
      <Step n={2}>Scroll to the bottom and tap Back Tap, then Double Tap.</Step>
      <Step n={3}>Scroll down to Shortcuts and pick Helper, look.</Step>
    </Path>
  );

  return (
    <>
      <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }}>
        <Txt size="large" bold>
          How it works
        </Txt>
        <Txt>
          On any screen, like a message, an email or a pop-up,{" "}
          {action ? "one press of the Action button" : "two taps on the back of the phone"} is all it takes. Helper looks
          at the screen and says out loud what it is, if it's safe, and what to do. No screenshots, no typing.
        </Txt>
      </Card>

      <SectionTitle>1. Make the "Helper, look" shortcut</SectionTitle>
      <Card>
        <Step n={1}>Copy Helper's address with this button.</Step>
        <CopyButton label="Copy Helper's address" value={lookUrl(settings)} />
        <Step n={2}>Open the Shortcuts app and tap + in the top right corner.</Step>
        <BigButton icon="forward" label="Open Shortcuts" onPress={() => Linking.openURL("shortcuts://").catch(() => {})} />
        <Step n={3}>Tap Search Actions, type Take Screenshot, and tap it.</Step>
        <Step n={4}>Search again for Get Contents of URL and tap it. Tap the pale word URL, press and hold, and tap Paste.</Step>
        <Step n={5}>
          Tap the small arrow next to it. Set Method to POST and Request Body to Form. Tap Add new field, choose File, type
          image as the key, and choose Screenshot as the value.
        </Step>
        <Step n={6}>Search for Speak Text and tap it. It reads out Helper's answer.</Step>
        <Step n={7}>Tap the name at the top, choose Rename, and type Helper, look. Tap Done.</Step>
      </Card>

      <SectionTitle>2. Put it on a button</SectionTitle>
      {action ? [actionPath, backTapPath] : [backTapPath]}

      <SectionTitle>3. Try it together</SectionTitle>
      <Card>
        <Txt>Open a message or an email. {trigger}. After a few seconds Helper says what it is.</Txt>
        <Status done={tested} doneText="It works. Helper got the screenshot." />
      </Card>

      <TalkShortcut />
    </>
  );
}

function AndroidGuide() {
  if (isSamsung()) {
    return (
      <Path title="Press the side button twice" recommended>
        <Step n={1}>Open Settings, then Advanced features, then Side button.</Step>
        <Step n={2}>Turn on Double press and choose Open app.</Step>
        <Step n={3}>Pick Helper. Now two quick presses on the side button open Helper.</Step>
      </Path>
    );
  }
  return (
    <>
      <Path title="Keep Helper on the home screen" recommended>
        <Step n={1}>Find the Helper icon, press and hold it.</Step>
        <Step n={2}>Drag it to the bottom row of the home screen, where it's always visible.</Step>
      </Path>
      <Path title="Ask Google">
        <Txt>Say "Hey Google, open Helper".</Txt>
      </Path>
    </>
  );
}

/** Guardian-facing guide: one press on any screen and Helper explains it (iPhone), or opens Helper (Android). */
export function OnePressGuide() {
  return Platform.OS === "ios" ? <IosGuide /> : <AndroidGuide />;
}

const styles = StyleSheet.create({
  step: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  number: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  status: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.sunken, borderRadius: radius.sm, padding: 14 },
});
