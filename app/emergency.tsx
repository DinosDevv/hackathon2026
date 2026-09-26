import { EmergencyPanel } from "../src/components/EmergencyPanel";
import { Screen, Txt } from "../src/components/ui";
import { colors } from "../src/theme";

export default function Emergency() {
  return (
    <Screen title="Βοήθεια τώρα">
      <EmergencyPanel />
      <Txt color={colors.muted}>
        Το κινητό σε ρωτάει πριν καλέσει, οπότε τίποτα δεν γίνεται κατά λάθος. Αν το άνοιξες κατά λάθος, πάτα Πίσω.
      </Txt>
    </Screen>
  );
}
