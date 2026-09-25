import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import { checkHealth, resolveServerUrl } from "../src/api";
import { emergencyNumber } from "../src/emergency";
import { Icon } from "../src/components/Icon";
import { BigButton, Card, Choice, Field, QuietButton, Screen, SectionTitle, Txt } from "../src/components/ui";
import { useSettings, type AnswerMode } from "../src/settings";
import { speak } from "../src/speech";
import { colors } from "../src/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, update, reset } = useSettings();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const serverUrl = resolveServerUrl(settings.serverUrl);

  const testConnection = async () => {
    setChecking(true);
    setStatus(null);
    try {
      const health = await checkHealth(serverUrl);
      setStatus({ ok: true, text: `Connected. Voice input ${health.stt ? "is on" : "uses the keyboard microphone"}.` });
    } catch {
      setStatus({ ok: false, text: `Can't reach ${serverUrl}` });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Screen title="Settings">
      <SectionTitle>How Helper answers</SectionTitle>
      <Card>
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
        <Txt bold>Language</Txt>
        <Choice
          value={settings.language}
          onChange={(language) => update({ language })}
          options={[
            { label: "English", value: "English" },
            { label: "Ελληνικά", value: "Greek" },
          ]}
        />
        <BigButton icon="speaker" label="Hear my voice" onPress={() => speak("This is how I will sound.", settings)} />
      </Card>

      <SectionTitle>Writing size</SectionTitle>
      <Card>
        <Choice<number>
          value={settings.textScale}
          onChange={(textScale) => update({ textScale })}
          options={[
            { label: "Big", value: 1 },
            { label: "Bigger", value: 1.2 },
            { label: "Biggest", value: 1.4 },
          ]}
        />
      </Card>

      <SectionTitle>Name and guardian</SectionTitle>
      <Card>
        <Field label="Name of the person using Helper" value={settings.name} onChangeText={(name) => update({ name })} autoCapitalize="words" />
        <Field
          label="Guardian's name"
          placeholder="e.g. Maria"
          value={settings.familyName}
          onChangeText={(familyName) => update({ familyName })}
          autoCapitalize="words"
        />
        <Field
          label="Guardian's phone number"
          value={settings.familyPhone}
          onChangeText={(familyPhone) => update({ familyPhone })}
          keyboardType="phone-pad"
        />
      </Card>

      <SectionTitle>In an emergency</SectionTitle>
      <Card>
        <Txt>
          If you sound like you need urgent help, Helper shows a red button that calls {emergencyNumber(settings)}
          {settings.familyPhone ? `, and one that calls ${settings.familyName || "the guardian"}` : ""}.
        </Txt>
        <Field
          label="Emergency number"
          placeholder={`${emergencyNumber({ ...settings, emergencyNumber: "" })} (for your country)`}
          value={settings.emergencyNumber}
          onChangeText={(emergencyNumber) => update({ emergencyNumber })}
          keyboardType="phone-pad"
        />
      </Card>

      <SectionTitle>For the guardian</SectionTitle>
      <BigButton
        variant="row"
        icon="tap"
        label="One-press access"
        hint="Open Helper with a button on the phone"
        onPress={() => router.push("/assistive")}
      />
      <Card>
        <Txt bold>Connection</Txt>
        <Txt size="small" color={colors.muted}>
          Leave empty to use the laptop running Expo. Now using: {serverUrl}
        </Txt>
        <Field
          label="Server address"
          placeholder="https://…"
          value={settings.serverUrl}
          onChangeText={(serverUrl) => update({ serverUrl })}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <BigButton icon="wifi" label="Test connection" loading={checking} onPress={testConnection} />
        {status && (
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Icon name={status.ok ? "safe" : "danger"} size={24} color={status.ok ? colors.verdict.safe.fg : colors.danger} />
            <Txt style={{ flex: 1 }}>{status.text}</Txt>
          </View>
        )}
      </Card>

      <QuietButton
        icon="retry"
        label="Start setup again"
        color={colors.danger}
        onPress={() =>
          Alert.alert("Start again?", "This clears your settings.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Start again",
              style: "destructive",
              onPress: () => {
                reset();
                router.replace("/onboarding");
              },
            },
          ])
        }
      />
    </Screen>
  );
}
