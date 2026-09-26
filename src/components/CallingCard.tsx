import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { callGuardian } from "../guardian";
import { useSettings } from "../settings";
import { speak, stopSpeaking } from "../speech";
import { Chip, Chips, HelperBubble } from "./Chat";
import { Txt } from "./ui";

const COUNTDOWN = 3;

/**
 * "Calling Maria…": counts down a few seconds, then opens the call to the guardian.
 * The pause lets them see what's happening and tap "Don't call" if it was a mistake.
 */
export function CallingCard({ active, announce, first = false }: { active: boolean; announce?: boolean; first?: boolean }) {
  const { settings } = useSettings();
  const name = settings.familyName || "τον κηδεμόνα σου";
  const [left, setLeft] = useState(COUNTDOWN);
  const [state, setState] = useState<"counting" | "called" | "cancelled" | "past">(active ? "counting" : "past");
  const started = useRef(false);

  useEffect(() => {
    if (!active || !settings.familyPhone || started.current) return;
    started.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (announce) speak(`Σε συνδέω με ${name}.`, settings);
  }, [active, announce, name, settings]);

  // Asking something else during the countdown cancels the call.
  useEffect(() => {
    if (!active && state === "counting") setState("cancelled");
  }, [active, state]);

  useEffect(() => {
    if (state !== "counting" || !active || !settings.familyPhone) return;
    if (left === 0) {
      stopSpeaking();
      callGuardian(settings).catch(() => {});
      setState("called");
      return;
    }
    const timer = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, state, active, settings]);

  if (!settings.familyPhone) {
    return (
      <HelperBubble first={first} mood="calm">
        <Txt>
          Θα σε συνέδεα με {name}, αλλά δεν έχω ακόμα τον αριθμό. Ζήτα από κάποιον να τον βάλει στις Ρυθμίσεις.
        </Txt>
      </HelperBubble>
    );
  }

  return (
    <>
      <HelperBubble first={first}>
        <Txt size="large">
          {state === "counting"
            ? `Καλώ: ${name} σε ${left}…`
            : state === "cancelled"
              ? `Εντάξει, δεν καλώ.`
              : state === "past"
                ? `Σε συνέδεσα με ${name}.`
                : `Άνοιξα την κλήση. Αν σε ρωτήσει το κινητό, πάτα Κλήση.`}
        </Txt>
      </HelperBubble>
      {state === "counting" ? (
        <Chips>
          <Chip primary icon="call" label="Κάλεσε τώρα" onPress={() => setLeft(0)} />
          <Chip icon="close" label="Μην καλέσεις" onPress={() => setState("cancelled")} />
        </Chips>
      ) : (
        <Chips>
          <Chip icon="call" label={`Κάλεσε: ${name}`} onPress={() => callGuardian(settings).catch(() => {})} />
        </Chips>
      )}
    </>
  );
}
