import * as Clipboard from "expo-clipboard";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useState, type ReactNode } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";
import { hasActionButton, isSamsung, listenLink } from "../onePress";
import { useSettings } from "../settings";
import { colors, radius } from "../theme";
import { Icon } from "./Icon";
import { BigButton, Card, SectionTitle, Txt } from "./ui";

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

function IosGuide() {
  const { settings } = useSettings();
  const [copied, setCopied] = useState(false);
  const action = hasActionButton();
  const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  const actionPath = (
    <Path key="action" title="The Action button" recommended={action}>
      <Txt color={colors.muted}>The small button on the left side, above the volume buttons.</Txt>
      <Step n={1}>Open Settings and tap Action Button.</Step>
      <Step n={2}>Swipe sideways until you see Shortcut, then tap Choose a Shortcut.</Step>
      <Step n={3}>Pick Helper.</Step>
    </Path>
  );
  const backTapPath = (
    <Path key="backtap" title="Tap the back of the phone" recommended={!action}>
      <Txt color={colors.muted}>Two quick taps on the back of the phone open Helper.</Txt>
      <Step n={1}>Open Settings, then Accessibility, then Touch.</Step>
      <Step n={2}>Scroll to the bottom and tap Back Tap, then Double Tap.</Step>
      <Step n={3}>Scroll down to Shortcuts and pick Helper.</Step>
    </Path>
  );

  return (
    <>
      <SectionTitle>1. Make the Helper shortcut</SectionTitle>
      <Card>
        <Step n={1}>Copy Helper's link with the button below.</Step>
        <BigButton
          icon={copied ? "check" : "copy"}
          label={copied ? "Link copied" : "Copy Helper's link"}
          onPress={async () => {
            await Clipboard.setStringAsync(listenLink());
            setCopied(true);
          }}
        />
        <Step n={2}>Open the Shortcuts app and tap + in the top right corner.</Step>
        <BigButton icon="forward" label="Open Shortcuts" onPress={() => Linking.openURL("shortcuts://").catch(() => {})} />
        <Step n={3}>Tap Search Actions, type Open URLs, and tap it.</Step>
        <Step n={4}>Tap the pale word URL, then press and hold and tap Paste.</Step>
        <Step n={5}>Tap the name at the top, choose Rename and type Helper. Tap Done.</Step>
        {inExpoGo ? (
          <Txt size="small" color={colors.muted}>
            Test version: this link only works while the laptop is running Expo. The installed app gets a permanent link.
          </Txt>
        ) : null}
      </Card>

      <SectionTitle>2. Put it on a button</SectionTitle>
      {action ? [actionPath, backTapPath] : [backTapPath]}

      <SectionTitle>3. Try it together</SectionTitle>
      <Card>
        <Txt>
          {action ? "Press the Action button" : "Tap the back of the phone twice"}. Helper should open and start listening
          straight away.
        </Txt>
        <View style={[styles.status, settings.shortcutTested && { backgroundColor: colors.verdict.safe.bg }]}>
          <Icon
            name={settings.shortcutTested ? "safe" : "tap"}
            size={26}
            color={settings.shortcutTested ? colors.verdict.safe.fg : colors.muted}
          />
          <Txt bold style={{ flex: 1 }} color={settings.shortcutTested ? colors.verdict.safe.fg : colors.muted}>
            {settings.shortcutTested ? "It works. Helper opened from the shortcut." : "Not tried yet"}
          </Txt>
        </View>
        <Txt color={colors.muted}>Siri works too: hold the side button and say "Helper".</Txt>
      </Card>
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

/** Guardian-facing guide for opening Helper with one press, tailored to this phone. */
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
