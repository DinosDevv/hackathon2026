import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import { checkHealth, resolveServerUrl } from "../src/api";
import { emergencyNumber } from "../src/emergency";
import { Icon } from "../src/components/Icon";
import { BigButton, Card, Choice, Field, QuietButton, Screen, SectionTitle, Txt } from "../src/components/ui";
import { callName, useSettings, type AnswerMode } from "../src/settings";
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
      setStatus({
        ok: true,
        text: `Συνδέθηκε. Φωνητική εισαγωγή: ${health.stt ? "ενεργή" : "μέσω του μικροφώνου του πληκτρολογίου"}. Φωνή HelpNona: ${health.tts ? "ενεργή" : "η φωνή του κινητού"}.`,
      });
    } catch {
      setStatus({ ok: false, text: `Δεν βρίσκω το ${serverUrl}` });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Screen title="Ρυθμίσεις">
      <SectionTitle>Πώς απαντάει ο HelpNona</SectionTitle>
      <Card>
        <Txt bold>Απαντήσεις</Txt>
        <Choice<AnswerMode>
          value={settings.answerMode}
          onChange={(answerMode) => update({ answerMode })}
          options={[
            { label: "Φωνή", value: "voice" },
            { label: "Γραπτά", value: "text" },
            { label: "Και τα δύο", value: "both" },
          ]}
        />
        <Txt bold>Μήκος απάντησης</Txt>
        <Choice<"short" | "full">
          value={settings.detail}
          onChange={(detail) => update({ detail })}
          options={[
            { label: "Σύντομα", value: "short" },
            { label: "Αναλυτικά", value: "full" },
          ]}
        />
        <Txt size="small" color={colors.muted}>
          {settings.detail === "short"
            ? "Μόνο τα σημαντικά. Πάτα «Πες μου κι άλλα» κάτω από μια απάντηση για τα υπόλοιπα."
            : "Λίγο περισσότερη εξήγηση και περισσότερα βήματα."}
        </Txt>
        <Txt bold>Ταχύτητα ομιλίας</Txt>
        <Choice<boolean>
          value={settings.slowSpeech}
          onChange={(slowSpeech) => update({ slowSpeech })}
          options={[
            { label: "Πιο αργά", value: true },
            { label: "Κανονικά", value: false },
          ]}
        />
        <BigButton
          icon="speaker"
          label="Άκου τη φωνή μου"
          onPress={() => speak(`Γεια σου${callName(settings) ? ", " + callName(settings) : ""}! Έτσι ακούγομαι.`, settings)}
        />
      </Card>

      <SectionTitle>Μέγεθος γραμμάτων</SectionTitle>
      <Card>
        <Choice<number>
          value={settings.textScale}
          onChange={(textScale) => update({ textScale })}
          options={[
            { label: "Μεγάλα", value: 1 },
            { label: "Πιο μεγάλα", value: 1.2 },
            { label: "Πολύ μεγάλα", value: 1.4 },
          ]}
        />
      </Card>

      <SectionTitle>Όνομα και κηδεμόνας</SectionTitle>
      <Card>
        <Field
          label="Όνομα του χρήστη"
          value={settings.name}
          onChangeText={(name) => update({ name })}
          autoCapitalize="words"
        />
        <Field
          label="Πώς τον/τη λένε τα εγγόνια"
          placeholder="π.χ. Γιαγιά, Νόνα, Παππού"
          value={settings.nickname}
          onChangeText={(nickname) => update({ nickname })}
          autoCapitalize="words"
        />
        <Field
          label="Όνομα κηδεμόνα"
          placeholder="π.χ. Μαρία"
          value={settings.familyName}
          onChangeText={(familyName) => update({ familyName })}
          autoCapitalize="words"
        />
        <Field
          label="Τηλέφωνο κηδεμόνα"
          value={settings.familyPhone}
          onChangeText={(familyPhone) => update({ familyPhone })}
          keyboardType="phone-pad"
        />
      </Card>

      <SectionTitle>Σε έκτακτη ανάγκη</SectionTitle>
      <Card>
        <Txt>
          Αν ακούγεται ότι χρειάζεσαι επείγουσα βοήθεια, ο HelpNona δείχνει ένα κόκκινο κουμπί που καλεί το{" "}
          {emergencyNumber(settings)}
          {settings.familyPhone ? `, κι ένα που καλεί: ${settings.familyName || "τον κηδεμόνα"}` : ""}.
        </Txt>
        <Field
          label="Αριθμός έκτακτης ανάγκης"
          placeholder={`${emergencyNumber({ ...settings, emergencyNumber: "" })} (για τη χώρα σου)`}
          value={settings.emergencyNumber}
          onChangeText={(emergencyNumber) => update({ emergencyNumber })}
          keyboardType="phone-pad"
        />
      </Card>

      <SectionTitle>Για τον κηδεμόνα</SectionTitle>
      <Card>
        <Txt bold>Σύνδεση</Txt>
        <Txt size="small" color={colors.muted}>
          Άφησέ το κενό για να χρησιμοποιηθεί ο υπολογιστής που τρέχει το Expo. Τώρα: {serverUrl}
        </Txt>
        <Field
          label="Διεύθυνση server"
          placeholder="https://…"
          value={settings.serverUrl}
          onChangeText={(serverUrl) => update({ serverUrl })}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <BigButton icon="wifi" label="Έλεγχος σύνδεσης" loading={checking} onPress={testConnection} />
        {status && (
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Icon name={status.ok ? "safe" : "danger"} size={24} color={status.ok ? colors.verdict.safe.fg : colors.danger} />
            <Txt style={{ flex: 1 }}>{status.text}</Txt>
          </View>
        )}
      </Card>

      <QuietButton
        icon="retry"
        label="Ξεκίνα τη ρύθμιση από την αρχή"
        color={colors.danger}
        onPress={() =>
          Alert.alert("Από την αρχή;", "Θα σβηστούν οι ρυθμίσεις σου.", [
            { text: "Άκυρο", style: "cancel" },
            {
              text: "Από την αρχή",
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
