import * as Clipboard from "expo-clipboard";
import * as SMS from "expo-sms";
import { useState } from "react";
import { Alert, Share, StyleSheet, View } from "react-native";
import type { HelperAnswer } from "../api";
import { callGuardian, textGuardian } from "../guardian";
import { useSettings } from "../settings";
import { sentence, speak, spokenText, stopSpeaking } from "../speech";
import { colors } from "../theme";
import { Chip, Chips, HelperBubble } from "./Chat";
import { Icon } from "./Icon";
import { Txt } from "./ui";

async function sendText(recipients: string[], message: string) {
  if (await SMS.isAvailableAsync()) {
    await SMS.sendSMSAsync(recipients, message);
  } else {
    await Share.share({ message });
  }
}

/** Small coloured tag with the verdict, e.g. "Don't trust this". */
export function VerdictLabel({ verdict }: { verdict: HelperAnswer["verdict"] }) {
  const v = colors.verdict[verdict];
  return (
    <View style={[styles.tag, { backgroundColor: v.bg }]}>
      <Icon name={v.icon} size={18} color={v.fg} />
      <Txt size="small" bold color={v.fg}>
        {v.label}
      </Txt>
    </View>
  );
}

/** Helper's reply as chat messages: the answer, then any follow-ups (talk to the guardian, a drafted reply). */
export function AnswerCard({ answer, speaking, onSpeakingChange, onMore, imageUri }: {
  answer: HelperAnswer;
  /** The screenshot or photo they asked about, attached when texting the guardian. */
  imageUri?: string;
  speaking: boolean;
  onSpeakingChange: (speaking: boolean) => void;
  /** Shown as "Tell me more" when set: asks Helper to go into more detail. */
  onMore?: () => void;
}) {
  const { settings } = useSettings();
  const [expanded, setExpanded] = useState(settings.answerMode !== "voice");
  const v = colors.verdict[answer.verdict];
  // Helper's face mirrors the news: pleased when it's fine, concerned when it isn't.
  const mood = answer.emergency || answer.verdict === "danger" || answer.verdict === "caution" ? "concerned" : "happy";
  const guardian = settings.familyName || "τον κηδεμόνα σου";
  // Helper can't fix this one: offer the drafted text to the guardian, or a call.
  const needsGuardian = answer.guardianHelp === "text" && Boolean(answer.guardianMessage);
  // Otherwise a gentler offer. Not in an emergency (the EmergencyPanel offers the call) or when a call is
  // already starting (the CallingCard below).
  const showFamily =
    Boolean(settings.familyPhone) &&
    !answer.emergency &&
    !needsGuardian &&
    answer.guardianHelp !== "call" &&
    (answer.tellFamily || answer.verdict === "danger");

  const toggleSpeech = () => {
    if (speaking) {
      stopSpeaking();
      onSpeakingChange(false);
    } else {
      onSpeakingChange(true);
      speak(spokenText(answer, settings.language), settings, () => onSpeakingChange(false));
    }
  };

  // A short summary for the gentle "want me to get Maria?" offer; the "needs the guardian" case uses Claude's own text.
  const summary = () => {
    const from = settings.name ? `${settings.name} εδώ. ` : "";
    return `Γεια σου, ${from}Ο HelpNona μου έλεγξε κάτι: "${answer.headline}". ${answer.explanation} Μπορείς να με βοηθήσεις;`;
  };
  const text = (message: string) =>
    textGuardian(settings, message, imageUri).catch(() => Alert.alert("Δεν άνοιξαν τα Μηνύματα"));

  return (
    <View style={{ gap: 8 }}>
      <HelperBubble mood={mood}>
        {answer.verdict !== "info" ? <VerdictLabel verdict={answer.verdict} /> : null}
        {/* One natural message, the way a person texts: no bold title above a paragraph. */}
        <Txt size="large">
          {sentence(answer.headline)}
          {expanded && answer.explanation ? ` ${answer.explanation}` : ""}
        </Txt>
        {expanded ? (
          <>
            {answer.steps.map((step, i) => (
              <View key={i} style={styles.step}>
                <Txt bold color={v.fg} style={styles.stepNumber}>
                  {i + 1}.
                </Txt>
                <Txt style={{ flex: 1 }}>{step}</Txt>
              </View>
            ))}
          </>
        ) : null}
      </HelperBubble>
      <Chips>
        {!expanded ? <Chip icon="text" label="Δείξ' το γραπτά" onPress={() => setExpanded(true)} /> : null}
        <Chip icon={speaking ? "stop" : "speaker"} label={speaking ? "Σταμάτα" : "Διάβασέ το"} onPress={toggleSpeech} />
        {onMore ? <Chip icon="chat" label="Πες μου κι άλλα" onPress={onMore} /> : null}
      </Chips>

      {needsGuardian ? (
        settings.familyPhone ? (
          <>
            <HelperBubble first={false} mood={mood}>
              <Txt>Αυτό θα στείλω σε {guardian}{imageUri ? ", μαζί με τη φωτογραφία σου" : ""}:</Txt>
              <View style={styles.quote}>
                <Txt>{answer.guardianMessage}</Txt>
              </View>
            </HelperBubble>
            <Chips>
              <Chip primary icon="message" label={`Μήνυμα: ${settings.familyName || "κηδεμόνας"}`} onPress={() => text(answer.guardianMessage!)} />
              <Chip icon="call" label="Καλύτερα κλήση" onPress={() => callGuardian(settings).catch(() => {})} />
            </Chips>
          </>
        ) : (
          <HelperBubble first={false} mood="calm">
            <Txt>Εδώ χρειαζόμαστε {guardian}, αλλά δεν έχω ακόμα τον αριθμό. Ζήτα από κάποιον να τον βάλει στις Ρυθμίσεις.</Txt>
          </HelperBubble>
        )
      ) : null}

      {showFamily ? (
        <>
          <HelperBubble first={false} mood={mood}>
            <Txt>Θες να ειδοποιήσω {guardian};</Txt>
          </HelperBubble>
          <Chips>
            <Chip
              primary
              icon="call"
              label={`Κάλεσε: ${settings.familyName || "κηδεμόνας"}`}
              onPress={() => callGuardian(settings).catch(() => {})}
            />
            <Chip icon="message" label="Στείλε μήνυμα" onPress={() => text(summary())} />
          </Chips>
        </>
      ) : null}

      {answer.draftReply ? (
        <>
          <HelperBubble first={false} mood={mood}>
            <Txt>Να ένα μήνυμα που μπορείς να στείλεις:</Txt>
            <View style={styles.quote}>
              <Txt>{answer.draftReply}</Txt>
            </View>
          </HelperBubble>
          <Chips>
            <Chip primary icon="message" label="Στείλ' το" onPress={() => sendText([], answer.draftReply).catch(() => {})} />
            <Chip
              icon="copy"
              label="Αντιγραφή"
              onPress={async () => {
                await Clipboard.setStringAsync(answer.draftReply);
                Alert.alert("Αντιγράφηκε", "Πάτα παρατεταμένα εκεί που θες να γράψεις και μετά Επικόλληση.");
              }}
            />
            <Chip icon="share" label="Άλλες εφαρμογές" onPress={() => Share.share({ message: answer.draftReply }).catch(() => {})} />
          </Chips>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  step: { flexDirection: "row", gap: 8 },
  stepNumber: { minWidth: 22 },
  quote: { backgroundColor: colors.sunken, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: colors.primary, padding: 12 },
});
