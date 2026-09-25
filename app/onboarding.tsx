import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { BigButton, Choice, Field, Screen, Txt } from "../src/components/ui";
import { useSettings, type AnswerMode } from "../src/settings";
import { speak } from "../src/speech";
import { colors } from "../src/theme";

const STEPS = 4;

export default function Onboarding() {
  const router = useRouter();
  const { settings, update } = useSettings();
  const [step, setStep] = useState(0);

  const next = () => (step < STEPS - 1 ? setStep(step + 1) : finish());
  const finish = () => {
    update({ onboarded: true });
    router.replace("/");
  };

  return (
    <Screen>
      <View style={{ height: 40 }} />
      <Txt size="small" color={colors.muted}>
        Step {step + 1} of {STEPS}
      </Txt>

      {step === 0 && (
        <>
          <Txt size="huge" bold>
            Welcome to Helper 👋
          </Txt>
          <Txt size="large">
            I'm here to help you with your phone. You can ask me about a message, an email or a website, and I'll tell you
            if it's safe and what to do.
          </Txt>
          <Txt size="large">This takes one minute to set up. A family member can help you.</Txt>
          <Field
            label="What should I call you?"
            placeholder="Your first name"
            value={settings.name}
            onChangeText={(name) => update({ name })}
            autoCapitalize="words"
          />
        </>
      )}

      {step === 1 && (
        <>
          <Txt size="title" bold>
            How should I answer you?
          </Txt>
          <Choice<AnswerMode>
            value={settings.answerMode}
            onChange={(answerMode) => update({ answerMode })}
            options={[
              { label: "🔊 Speak", value: "voice" },
              { label: "📖 Write", value: "text" },
              { label: "Both", value: "both" },
            ]}
          />
          <Txt size="title" bold>
            Speaking speed
          </Txt>
          <Choice<boolean>
            value={settings.slowSpeech}
            onChange={(slowSpeech) => update({ slowSpeech })}
            options={[
              { label: "Slower", value: true },
              { label: "Normal", value: false },
            ]}
          />
          <BigButton
            icon="🔊"
            label="Test my voice"
            onPress={() => speak(`Hello${settings.name ? " " + settings.name : ""}. This is how I will sound.`, settings)}
          />
          <Txt size="title" bold>
            Language
          </Txt>
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
          <Txt size="title" bold>
            How big should the writing be?
          </Txt>
          <Choice<number>
            value={settings.textScale}
            onChange={(textScale) => update({ textScale })}
            options={[
              { label: "Big", value: 1 },
              { label: "Bigger", value: 1.2 },
              { label: "Biggest", value: 1.4 },
            ]}
          />
          <Txt size="large">This is how the writing will look.</Txt>
        </>
      )}

      {step === 3 && (
        <>
          <Txt size="title" bold>
            Someone you trust
          </Txt>
          <Txt size="large">
            If something looks like a scam, I can help you send a message to a family member or friend. You can skip this.
          </Txt>
          <Field
            label="Their name"
            placeholder="e.g. Maria"
            value={settings.familyName}
            onChangeText={(familyName) => update({ familyName })}
            autoCapitalize="words"
          />
          <Field
            label="Their phone number"
            placeholder="e.g. +30 69..."
            value={settings.familyPhone}
            onChangeText={(familyPhone) => update({ familyPhone })}
            keyboardType="phone-pad"
          />
        </>
      )}

      <View style={{ gap: 12, marginTop: 12 }}>
        <BigButton variant="primary" label={step === STEPS - 1 ? "Start using Helper" : "Next"} onPress={next} />
        {step > 0 && <BigButton label="Back" onPress={() => setStep(step - 1)} />}
      </View>
    </Screen>
  );
}
