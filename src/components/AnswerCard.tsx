import * as Clipboard from "expo-clipboard";
import * as SMS from "expo-sms";
import { useState } from "react";
import { Alert, Linking, Share, StyleSheet, View } from "react-native";
import type { HelperAnswer } from "../api";
import { useSettings } from "../settings";
import { speak, stopSpeaking } from "../speech";
import { colors } from "../theme";
import { BigButton, Txt } from "./ui";

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

export function AnswerCard({ answer, speaking, onSpeakingChange }: {
  answer: HelperAnswer;
  speaking: boolean;
  onSpeakingChange: (speaking: boolean) => void;
}) {
  const { settings } = useSettings();
  const [expanded, setExpanded] = useState(settings.answerMode !== "voice");
  const v = colors.verdict[answer.verdict];
  const family = settings.familyName || "my family";
  const hasFamily = Boolean(settings.familyPhone);

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
    <View style={[styles.card, { backgroundColor: v.bg, borderColor: v.fg }]}>
      <View style={styles.header}>
        <Txt size="huge">{v.icon}</Txt>
        <View style={{ flex: 1 }}>
          <Txt size="small" bold color={v.fg}>
            {v.label.toUpperCase()}
          </Txt>
          <Txt size="title" bold color={v.fg}>
            {answer.headline}
          </Txt>
        </View>
      </View>

      {expanded ? (
        <>
          <Txt size="large">{answer.explanation}</Txt>
          {answer.steps.length > 0 && (
            <View style={{ gap: 8 }}>
              <Txt bold>What to do:</Txt>
              {answer.steps.map((step, i) => (
                <View key={i} style={styles.step}>
                  <Txt size="large" bold color={v.fg}>
                    {i + 1}.
                  </Txt>
                  <Txt size="large" style={{ flex: 1 }}>
                    {step}
                  </Txt>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <BigButton label="Show me in writing" icon="📖" onPress={() => setExpanded(true)} />
      )}

      <BigButton
        label={speaking ? "Stop reading" : "Read it to me"}
        icon={speaking ? "⏹️" : "🔊"}
        onPress={toggleSpeech}
      />

      {answer.draftReply ? (
        <View style={styles.draft}>
          <Txt bold>Message ready to send:</Txt>
          <Txt size="large">{answer.draftReply}</Txt>
          <BigButton
            label="Send as a text message"
            hint="You choose who, then press send"
            icon="💬"
            variant="primary"
            onPress={() => sendText([], answer.draftReply).catch(() => {})}
          />
          <BigButton
            label="Copy the message"
            hint="Then paste it in any app"
            icon="📋"
            onPress={async () => {
              await Clipboard.setStringAsync(answer.draftReply);
              Alert.alert("Copied", "Press and hold where you want to write, then tap Paste.");
            }}
          />
          <BigButton
            label="Share with another app"
            icon="📤"
            onPress={() => Share.share({ message: answer.draftReply }).catch(() => {})}
          />
        </View>
      ) : null}

      {hasFamily && (answer.tellFamily || answer.verdict === "danger") ? (
        <View style={{ gap: 10 }}>
          <BigButton label={`Tell ${family}`} hint="Sends them a text about this" icon="👪" variant="primary" onPress={tellFamily} />
          <BigButton
            label={`Call ${family}`}
            icon="📞"
            onPress={() => Linking.openURL(`tel:${settings.familyPhone}`).catch(() => {})}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 3, padding: 18, gap: 14 },
  header: { flexDirection: "row", gap: 12, alignItems: "center" },
  step: { flexDirection: "row", gap: 10 },
  draft: { gap: 10, backgroundColor: colors.card, borderRadius: 14, padding: 14 },
});
