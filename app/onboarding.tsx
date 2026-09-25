import { requestRecordingPermissionsAsync } from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, type IconName } from "../src/components/Icon";
import { OnePressGuide } from "../src/components/OnePressGuide";
import { BigButton, Card, Choice, Field, IconBadge, QuietButton, Screen, Txt } from "../src/components/ui";
import { emergencyNumber } from "../src/emergency";
import { useSettings, type AnswerMode } from "../src/settings";
import { speak } from "../src/speech";
import { colors } from "../src/theme";

// Written for the guardian (a family member or friend) who sets Helper up, ideally sitting next to the person.
const STEPS = 7;

function Progress({ step }: { step: number }) {
  return (
    <View accessible accessibilityLabel={`Step ${step + 1} of ${STEPS}`} style={{ gap: 8 }}>
      <View style={styles.progress}>
        {Array.from({ length: STEPS }, (_, i) => (
          <View key={i} style={[styles.segment, i <= step && { backgroundColor: colors.primary }]} />
        ))}
      </View>
      <Txt size="small" bold color={colors.muted}>
        Step {step + 1} of {STEPS}
      </Txt>
    </View>
  );
}

function Point({ icon, children }: { icon: IconName; children: string }) {
  return (
    <View style={styles.point}>
      <IconBadge name={icon} size={48} />
      <Txt style={{ flex: 1 }}>{children}</Txt>
    </View>
  );
}

function Access() {
  const [mic, setMic] = useState<boolean | null>(null);
  const [camera, setCamera] = useState<boolean | null>(null);
  const ask = async () => {
    setMic((await requestRecordingPermissionsAsync()).granted);
    setCamera((await ImagePicker.requestCameraPermissionsAsync()).granted);
  };
  const row = (label: string, granted: boolean | null) => (
    <View style={styles.point}>
      <Icon
        name={granted ? "safe" : granted === false ? "caution" : "tap"}
        size={26}
        color={granted ? colors.verdict.safe.fg : granted === false ? colors.verdict.caution.fg : colors.muted}
      />
      <Txt style={{ flex: 1 }}>
        {label}: {granted ? "allowed" : granted === false ? "not allowed, turn it on in the phone's Settings" : "not asked yet"}
      </Txt>
    </View>
  );
  return (
    <>
      <Txt size="title" bold header>
        Let Helper hear and see
      </Txt>
      <Txt size="large">
        The phone will ask twice. Tap Allow both times, so these questions never surprise them later.
      </Txt>
      <BigButton variant="primary" icon="check" label="Allow microphone and camera" onPress={ask} />
      <Card>
        {row("Microphone, to hear questions", mic)}
        {row("Camera, to read letters and signs", camera)}
      </Card>
    </>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { settings, update } = useSettings();
  const [step, setStep] = useState(0);
  const them = settings.name || "them";

  const next = () => (step < STEPS - 1 ? setStep(step + 1) : finish());
  const finish = (practice = false) => {
    update({ onboarded: true });
    router.replace("/");
    if (practice) router.push({ pathname: "/ask", params: { question: "What can you help me with?" } });
  };

  const footer =
    step === STEPS - 1 ? (
      <>
        <BigButton variant="primary" icon="mic" label="Try it now" onPress={() => finish(true)} />
        <QuietButton label="Go to the home screen" onPress={() => finish()} />
      </>
    ) : (
      <View style={{ flexDirection: "row", gap: 10 }}>
        {step > 0 && <BigButton label="Back" style={{ flex: 1 }} onPress={() => setStep(step - 1)} />}
        <BigButton variant="primary" label={step === 0 ? "Let's start" : "Next"} style={{ flex: 2 }} onPress={next} />
      </View>
    );

  return (
    <Screen back={false} footer={footer}>
      <View style={{ height: 12 }} />
      <Progress step={step} />

      {step === 0 && (
        <>
          <Txt size="huge" bold header>
            A guardian in their pocket
          </Txt>
          <Txt size="large">
            Helper is always there to explain what's on the phone, in plain words, out loud. No menus to learn.
          </Txt>
          <Point icon="chat">Answers any question about the phone, letters, bills or messages.</Point>
          <Point icon="safe">Spots scams and says clearly what's safe and what isn't.</Point>
          <Point icon="people">Offers to call you when something looks wrong.</Point>
          <Card>
            <Txt>
              Setting this up for a parent, grandparent or friend? Sit together and do it on their phone. It takes about 5
              minutes.
            </Txt>
          </Card>
        </>
      )}

      {step === 1 && (
        <>
          <Txt size="title" bold header>
            Who will use Helper?
          </Txt>
          <Field
            label="Their first name"
            placeholder="e.g. Eleni"
            value={settings.name}
            onChangeText={(name) => update({ name })}
            autoCapitalize="words"
          />
          <Txt bold>Which language should Helper speak?</Txt>
          <Choice
            value={settings.language}
            onChange={(language) => update({ language })}
            options={[
              { label: "English", value: "English" },
              { label: "Ελληνικά", value: "Greek" },
            ]}
          />
        </>
      )}

      {step === 2 && (
        <>
          <Txt size="title" bold header>
            Make it comfortable
          </Txt>
          <Txt bold>Writing size</Txt>
          <Choice<number>
            value={settings.textScale}
            onChange={(textScale) => update({ textScale })}
            options={[
              { label: "Big", value: 1 },
              { label: "Bigger", value: 1.2 },
              { label: "Biggest", value: 1.4 },
            ]}
          />
          <Card>
            <Txt size="large">Pick the size {settings.name || "they"} can read without glasses.</Txt>
          </Card>
          <Txt bold>Answers</Txt>
          <Choice<AnswerMode>
            value={settings.answerMode}
            onChange={(answerMode) => update({ answerMode })}
            options={[
              { label: "Speak", value: "voice" },
              { label: "Write", value: "text" },
              { label: "Both", value: "both" },
            ]}
          />
          <Txt bold>Speaking speed</Txt>
          <Choice<boolean>
            value={settings.slowSpeech}
            onChange={(slowSpeech) => update({ slowSpeech })}
            options={[
              { label: "Slower", value: true },
              { label: "Normal", value: false },
            ]}
          />
          <BigButton
            icon="speaker"
            label="Hear the voice"
            onPress={() => speak(`Hello${settings.name ? " " + settings.name : ""}. I'm Helper. I'm here whenever you need me.`, settings)}
          />
        </>
      )}

      {step === 3 && (
        <>
          <Txt size="title" bold header>
            You, the guardian
          </Txt>
          <Txt size="large">
            When something looks like a scam, or {them} may need urgent help, Helper offers to call you.
          </Txt>
          <Field
            label="Your name, as they call you"
            placeholder="e.g. Maria"
            value={settings.familyName}
            onChangeText={(familyName) => update({ familyName })}
            autoCapitalize="words"
          />
          <Field
            label="Your phone number"
            placeholder="e.g. +30 69..."
            value={settings.familyPhone}
            onChangeText={(familyPhone) => update({ familyPhone })}
            keyboardType="phone-pad"
          />
          <Txt color={colors.muted}>
            In a real emergency Helper also shows a button to call {emergencyNumber(settings)}. You can change this number in
            Settings.
          </Txt>
        </>
      )}

      {step === 4 && <Access />}

      {step === 5 && (
        <>
          <Txt size="title" bold header>
            Helper with one press
          </Txt>
          <Txt size="large">
            Set up a button so {them} can open Helper without looking for the app. It opens ready to listen.
          </Txt>
          <OnePressGuide />
          <Txt color={colors.muted}>No time now? Press Next. You'll find this later in Settings, under One-press access.</Txt>
        </>
      )}

      {step === 6 && (
        <>
          <IconBadge name="safe" size={88} color={colors.verdict.safe.fg} bg={colors.verdict.safe.bg} />
          <Txt size="huge" bold header>
            All set
          </Txt>
          <Txt size="large">
            Let {them} try it now while you're there. Helper will explain what it can do.
          </Txt>
          <Card>
            <Txt bold>The one thing to remember</Txt>
            <Txt size="large">Press the big circle in the middle of the screen and talk. That's all.</Txt>
          </Card>
          <Txt color={colors.muted}>
            Everything else is next door: Show me (photos and screenshots) to the left, More to the right. Slide the screen
            sideways, or tap the words at the bottom.
          </Txt>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: "row", gap: 6 },
  segment: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.border },
  point: { flexDirection: "row", alignItems: "center", gap: 14 },
});
