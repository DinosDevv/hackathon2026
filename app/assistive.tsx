import { OnePressGuide } from "../src/components/OnePressGuide";
import { Screen, Txt } from "../src/components/ui";
import { colors } from "../src/theme";

export default function OnePressHelp() {
  return (
    <Screen title="One-press help">
      <Txt size="large">Whatever is on the screen, one press and Helper explains it out loud.</Txt>
      <Txt color={colors.muted}>For the guardian: this takes about 5 minutes. Do it once, together.</Txt>
      <OnePressGuide />
    </Screen>
  );
}
