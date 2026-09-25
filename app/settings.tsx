import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import { checkHealth, resolveServerUrl } from "../src/api";
import { BigButton, Card, Choice, Field, Screen, Txt } from "../src/components/ui";
import { useSettings, type AnswerMode } from "../src/settings";
import { speak } from "../src/speech";
import { colors } from "../src/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, update, reset } = useSettings();
  const [status, setStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const serverUrl = resolveServerUrl(settings.serverUrl);

  const testConnection = async () => {
    setChecking(true);
    setStatus(null);
    try {
      const health = await checkHealth(serverUrl);
      setStatus(`✅ Connected. Voice input ${health.stt ? "is on" : "uses the keyboard microphone"}.`);
    } catch {
      setStatus(`❌ Can't reach ${serverUrl}`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Txt size="large" bold>
          About you
        </Txt>
        <Field label="Your name" value={settings.name} onChangeText={(name) => update({ name })} autoCapitalize="words" />
      </Card>

      <Card>
        <Txt size="large" bold>
          Answers
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
        <BigButton icon="🔊" label="Test my voice" onPress={() => speak("This is how I will sound.", settings)} />
      </Card>

      <Card>
        <Txt size="large" bold>
          Writing size
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
      </Card>

      <Card>
        <Txt size="large" bold>
          Someone you trust
        </Txt>
        <Field label="Name" value={settings.familyName} onChangeText={(familyName) => update({ familyName })} autoCapitalize="words" />
        <Field
          label="Phone number"
          value={settings.familyPhone}
          onChangeText={(familyPhone) => update({ familyPhone })}
          keyboardType="phone-pad"
        />
      </Card>

      <Card>
        <Txt size="large" bold>
          Connection (for helpers)
        </Txt>
        <Txt size="small" color={colors.muted}>
          Leave empty to use the laptop running Expo. Currently: {serverUrl}
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
        <BigButton icon="📡" label="Test connection" loading={checking} onPress={testConnection} />
        {status && <Txt>{status}</Txt>}
      </Card>

      <View style={{ marginTop: 8 }}>
        <BigButton
          variant="danger"
          label="Start setup again"
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
      </View>
    </Screen>
  );
}
