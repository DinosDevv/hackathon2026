import { EmergencyPanel } from "../src/components/EmergencyPanel";
import { Screen, Txt } from "../src/components/ui";
import { colors } from "../src/theme";

export default function Emergency() {
  return (
    <Screen title="Get help">
      <EmergencyPanel />
      <Txt color={colors.muted}>
        Your phone asks before it calls, so nothing happens by accident. If you opened this by mistake, press Back.
      </Txt>
    </Screen>
  );
}
