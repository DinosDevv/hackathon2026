import * as Clipboard from "expo-clipboard";
import * as SMS from "expo-sms";
import { useState } from "react";
import { Alert, Linking, Share, StyleSheet, View } from "react-native";
import type { HelperAnswer } from "../api";
import { useSettings } from "../settings";
import { speak, stopSpeaking } from "../speech";
import { colors, radius } from "../theme";
import { Icon } from "./Icon";
import { BigButton, QuietButton, Txt } from "./ui";

export function spokenText(answer: HelperAnswer) {
  const steps = answer.steps.map((s, i) => `Step ${i + 1}. ${s}`).join(" ");
  return [answer.headline + ".", answer.explanation, steps].filter(Boolean).join(" ");
}

async function sendText(recipients: string[], message: string) {
  if (await SMS.isAvailableAsync()) {
    await SMS.sendSMSAsync(recipients, message);
  } else {
    await Share.share({ message });
  }
}

/** The verdict's coloured label with its icon, used on answers and in history. */
export function VerdictLabel({ verdict }: { verdict: HelperAnswer["verdict"] }) {
  const v = colors.verdict[verdict];
  return (
    <View style={styles.verdictLabel}>
      <Icon name={v.icon} size={24} color={v.fg} />
      <Txt size="small" bold color={v.fg} style={{ letterSpacing: 0.8 }}>
        {v.label.toUpperCase()}
      </Txt>
    </View>
  );
}

export function AnswerCard({ answer, speaking, onSpeakingChange }: {
  answer: HelperAnswer;
  speaking: boolean;
  onSpeakingChange: (speaking: boolean) => void;
}) {
  const { settings } = useSettings();
  const [expanded, setExpanded] = useState(settings.answerMode !== "voice");
  const v = colors.verdict[answer.verdict];
  const family = settings.familyName || "your family";
  // In an emergency the EmergencyPanel above already offers to call them.
  const showFamily =
    Boolean(settings.familyPhone) && !answer.emergency && (answer.tellFamily || answer.verdict === "danger");

  const toggleSpeech = () => {
    if (speaking) {
      stopSpeaking();
      onSpeakingChange(false);
    } else {
      onSpeakingChange(true);
      speak(spokenText(answer), settings, () => onSpeakingChange(false));
    }
  };

  const tellFamily = () => {
    const from = settings.name ? `It's ${settings.name}. ` : "";
    sendText(
      [settings.familyPhone],
      `Hi, ${from}my Helper app checked something for me: "${answer.headline}". ${answer.explanation} Can you help me with this?`,
    ).catch(() => Alert.alert("Couldn't open Messages"));
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.card, { borderColor: v.fg }]}>
        <View style={[styles.band, { backgroundColor: v.bg }]}>
          <VerdictLabel verdict={answer.verdict} />
          <Txt size="title" bold color={colors.text}>
            {answer.headline}
          </Txt>
        </View>

        <View style={styles.body}>
          {expanded ? (
            <>
              <Txt size="large">{answer.explanation}</Txt>
              {answer.steps.length > 0 && (
                <View style={{ gap: 12 }}>
                  <Txt bold color={colors.muted}>
                    What to do
                  </Txt>
                  {answer.steps.map((step, i) => (
                    <View key={i} style={styles.step}>
                      <View style={[styles.stepNumber, { backgroundColor: v.fg }]}>
                        <Txt bold color={colors.primaryText}>
                          {i + 1}
                        </Txt>
                      </View>
                      <Txt size="large" style={{ flex: 1 }}>
                        {step}
                      </Txt>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <QuietButton icon="text" label="Show it in writing" onPress={() => setExpanded(true)} />
          )}

          <BigButton icon={speaking ? "stop" : "speaker"} label={speaking ? "Stop reading" : "Read it to me"} onPress={toggleSpeech} />
        </View>
      </View>

      {showFamily ? (
        <View style={[styles.panel, { backgroundColor: v.bg }]}>
          <View style={styles.panelTitle}>
            <Icon name="people" size={26} color={colors.text} />
            <Txt size="large" bold style={{ flex: 1 }}>
              Talk to {family} before you do anything
            </Txt>
          </View>
          <View style={styles.pair}>
            <BigButton icon="call" label="Call" variant="primary" style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${settings.familyPhone}`).catch(() => {})} />
            <BigButton icon="message" label="Text" style={{ flex: 1 }} onPress={tellFamily} />
          </View>
        </View>
      ) : null}

      {answer.draftReply ? (
        <View style={styles.panel}>
          <Txt bold color={colors.muted}>
            Your message is ready
          </Txt>
          <View style={styles.bubble}>
            <Txt size="large" color={colors.primaryText}>
              {answer.draftReply}
            </Txt>
          </View>
          <BigButton
            icon="message"
            label="Send it"
            hint="You choose who, then press send"
            variant="primary"
            onPress={() => sendText([], answer.draftReply).catch(() => {})}
          />
          <View style={styles.pair}>
            <QuietButton
              icon="copy"
              label="Copy"
              onPress={async () => {
                await Clipboard.setStringAsync(answer.draftReply);
                Alert.alert("Copied", "Press and hold where you want to write, then tap Paste.");
              }}
            />
            <QuietButton icon="share" label="Other apps" onPress={() => Share.share({ message: answer.draftReply }).catch(() => {})} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.md, borderWidth: 2, backgroundColor: colors.card, overflow: "hidden" },
  band: { padding: 18, gap: 6 },
  body: { padding: 18, gap: 18 },
  verdictLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  step: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  stepNumber: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginTop: 2 },
  panel: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  panelTitle: { flexDirection: "row", alignItems: "center", gap: 10 },
  pair: { flexDirection: "row", gap: 10, justifyContent: "center" },
  bubble: {
    alignSelf: "flex-start",
    maxWidth: "92%",
    backgroundColor: colors.primary,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
