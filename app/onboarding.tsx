import { requestRecordingPermissionsAsync } from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Reanimated, { FadeInLeft, FadeInRight, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { HelperFace } from "../src/components/HelperFace";
import { Icon, type IconName } from "../src/components/Icon";
import { BigButton, Card, Choice, Field, IconBadge, QuietButton, Screen, Txt } from "../src/components/ui";
import { emergencyNumber } from "../src/emergency";
import { callName, useSettings, type AnswerMode } from "../src/settings";
import { speak } from "../src/speech";
import { colors } from "../src/theme";

// Written for the guardian (a family member or friend) who sets HelpNona up, ideally sitting next to the person.
const STEPS = 6;

/** One piece of the progress bar; fills from the left when its step is reached. */
function Segment({ filled }: { filled: boolean }) {
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: withTiming(filled ? 1 : 0, { duration: 350 }) }] }));
  return (
    <View style={styles.segment}>
      <Reanimated.View style={[styles.segmentFill, fill]} />
    </View>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <View accessible accessibilityLabel={`Βήμα ${step + 1} από ${STEPS}`} style={{ gap: 8 }}>
      <View style={styles.progress}>
        {Array.from({ length: STEPS }, (_, i) => (
          <Segment key={i} filled={i <= step} />
        ))}
      </View>
      <Txt size="small" bold color={colors.muted}>
        Βήμα {step + 1} από {STEPS}
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
        {label}: {granted ? "επιτρέπεται" : granted === false ? "δεν επιτρέπεται, άνοιξέ το από τις Ρυθμίσεις του κινητού" : "δεν έχει ζητηθεί ακόμα"}
      </Txt>
    </View>
  );
  return (
    <>
      <Txt size="title" bold header>
        Άφησε τον HelpNona να ακούει και να βλέπει
      </Txt>
      <Txt size="large">
        Το κινητό θα ρωτήσει δύο φορές. Πάτα «Να επιτρέπεται» και τις δύο, για να μην ξαφνιαστεί κανείς αργότερα.
      </Txt>
      <BigButton variant="primary" icon="check" label="Επίτρεψε μικρόφωνο και κάμερα" onPress={ask} />
      <Card>
        {row("Μικρόφωνο, για να ακούει ερωτήσεις", mic)}
        {row("Κάμερα, για να διαβάζει γράμματα και πινακίδες", camera)}
      </Card>
    </>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { settings, update } = useSettings();
  const [step, setStepState] = useState(0);
  // Steps slide in from the side you are moving towards.
  const direction = useRef(1);
  const setStep = (n: number) => {
    direction.current = n > step ? 1 : -1;
    setStepState(n);
  };

  const next = () => (step < STEPS - 1 ? setStep(step + 1) : finish());
  const finish = (practice = false) => {
    update({ onboarded: true });
    router.replace("/");
    if (practice) router.push({ pathname: "/ask", params: { question: "Σε τι μπορείς να με βοηθήσεις;" } });
  };

  const footer =
    step === STEPS - 1 ? (
      <>
        <BigButton variant="primary" icon="mic" label="Δοκίμασέ το τώρα" onPress={() => finish(true)} />
        <QuietButton label="Πήγαινε στην αρχική" onPress={() => finish()} />
      </>
    ) : (
      <View style={{ flexDirection: "row", gap: 10 }}>
        {step > 0 && <BigButton label="Πίσω" style={{ flex: 1 }} onPress={() => setStep(step - 1)} />}
        <BigButton variant="primary" label={step === 0 ? "Ξεκινάμε" : "Επόμενο"} style={{ flex: 2 }} onPress={next} />
      </View>
    );

  return (
    <Screen back={false} footer={footer}>
      <View style={{ height: 12 }} />
      <Progress step={step} />
      <Reanimated.View
        key={step}
        entering={(direction.current > 0 ? FadeInRight : FadeInLeft).duration(300)}
        style={{ gap: 16 }}
      >

      {step === 0 && (
        <>
          <View style={styles.meet}>
            <HelperFace size={96} />
            <View style={styles.speech}>
              <Txt size="large" bold>
                Γεια! Είμαι ο HelpNona.
              </Txt>
              <Txt>Το εγγόνι που είναι πάντα εδώ, ξέρει τα κινητά απ' έξω κι ανακατωτά, και δεν βαριέται ποτέ τις ερωτήσεις.</Txt>
            </View>
          </View>
          <Txt size="huge" bold header>
            Ένας φύλακας άγγελος στην τσέπη
          </Txt>
          <Txt size="large">
            Ο HelpNona εξηγεί τι δείχνει το κινητό με απλά λόγια, φωναχτά, και με λίγο πείραγμα. Χωρίς μενού για να μάθεις.
          </Txt>
          <Point icon="chat">Απαντάει σε κάθε ερώτηση για το κινητό, γράμματα, λογαριασμούς ή μηνύματα.</Point>
          <Point icon="safe">Εντοπίζει απάτες και λέει καθαρά τι είναι ασφαλές και τι όχι.</Point>
          <Point icon="people">Προτείνει να σε καλέσει όταν κάτι δεν πάει καλά.</Point>
          <Card>
            <Txt>
              Το ρυθμίζεις για γονιό, παππού, γιαγιά ή φίλο; Κάτσε μαζί τους και κάν' το στο δικό τους κινητό. Θέλει
              περίπου 5 λεπτά.
            </Txt>
          </Card>
        </>
      )}

      {step === 1 && (
        <>
          <Txt size="title" bold header>
            Ποιος θα χρησιμοποιεί τον HelpNona;
          </Txt>
          <Field
            label="Το μικρό του/της όνομα"
            placeholder="π.χ. Ελένη"
            value={settings.name}
            onChangeText={(name) => update({ name })}
            autoCapitalize="words"
          />
          <Field
            label="Πώς τον/τη λένε τα εγγόνια;"
            placeholder="π.χ. Γιαγιά, Νόνα, Παππού"
            value={settings.nickname}
            onChangeText={(nickname) => update({ nickname })}
            autoCapitalize="words"
          />
          <Txt color={colors.muted}>Έτσι θα τον/τη φωνάζει ο HelpNona, όπως η οικογένεια.</Txt>
        </>
      )}

      {step === 2 && (
        <>
          <Txt size="title" bold header>
            Να είναι άνετο
          </Txt>
          <Txt bold>Μέγεθος γραμμάτων</Txt>
          <Choice<number>
            value={settings.textScale}
            onChange={(textScale) => update({ textScale })}
            options={[
              { label: "Μεγάλα", value: 1 },
              { label: "Πιο μεγάλα", value: 1.2 },
              { label: "Πολύ μεγάλα", value: 1.4 },
            ]}
          />
          <Card>
            <Txt size="large">Διάλεξε το μέγεθος που διαβάζεται άνετα χωρίς γυαλιά.</Txt>
          </Card>
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
            label="Άκου τη φωνή"
            onPress={() => speak(`Γεια σου${callName(settings) ? ", " + callName(settings) : ""}! Ο HelpNona είμαι. Είμαι εδώ όποτε με χρειαστείς.`, settings)}
          />
        </>
      )}

      {step === 3 && (
        <>
          <Txt size="title" bold header>
            Εσύ, ο κηδεμόνας
          </Txt>
          <Txt size="large">
            Όταν κάτι μοιάζει με απάτη ή χρειάζεται επείγουσα βοήθεια, ο HelpNona προτείνει να καλέσει εσένα.
          </Txt>
          <Field
            label="Το όνομά σου, όπως σε φωνάζουν"
            placeholder="π.χ. Μαρία"
            value={settings.familyName}
            onChangeText={(familyName) => update({ familyName })}
            autoCapitalize="words"
          />
          <Field
            label="Το τηλέφωνό σου"
            placeholder="π.χ. +30 69..."
            value={settings.familyPhone}
            onChangeText={(familyPhone) => update({ familyPhone })}
            keyboardType="phone-pad"
          />
          <Txt color={colors.muted}>
            Σε πραγματική έκτακτη ανάγκη, ο HelpNona δείχνει κι ένα κουμπί για το {emergencyNumber(settings)}. Μπορείς να
            αλλάξεις τον αριθμό στις Ρυθμίσεις.
          </Txt>
        </>
      )}

      {step === 4 && <Access />}

      {step === 5 && (
        <>
          <IconBadge name="safe" size={88} color={colors.verdict.safe.fg} bg={colors.verdict.safe.bg} />
          <Txt size="huge" bold header>
            Έτοιμοι
          </Txt>
          <Txt size="large">
            Δοκιμάστε το τώρα μαζί, όσο είσαι εκεί. Ο HelpNona θα εξηγήσει τι μπορεί να κάνει.
          </Txt>
          <Card>
            <Txt bold>Το ένα πράγμα που πρέπει να θυμάσαι</Txt>
            <Txt size="large">
              Κάτι στο κινητό σε μπερδεύει; Μην το πατήσεις. Άνοιξε τον HelpNona και ρώτα.
            </Txt>
          </Card>
          <Txt color={colors.muted}>
            Όλα τα άλλα είναι δίπλα: «Δείξε μου» (φωτογραφίες και στιγμιότυπα) αριστερά, «Περισσότερα» δεξιά. Σύρε την
            οθόνη στο πλάι ή πάτα τις λέξεις κάτω κάτω.
          </Txt>
        </>
      )}
      </Reanimated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: "row", gap: 6 },
  segment: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden" },
  segmentFill: { flex: 1, backgroundColor: colors.primary, transformOrigin: "left" },
  meet: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  speech: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 22,
    borderTopLeftRadius: 6,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  point: { flexDirection: "row", alignItems: "center", gap: 14 },
});
