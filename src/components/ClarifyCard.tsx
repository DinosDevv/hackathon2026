import { View } from "react-native";
import type { HelperAnswer } from "../api";
import { Chip, Chips, HelperBubble } from "./Chat";
import { Txt } from "./ui";

/** Helper wasn't sure the question was meant: a short question with quick replies instead of a full answer. */
export function ClarifyCard({ answer, onChoose }: { answer: HelperAnswer; onChoose?: (choice: string) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <HelperBubble mood="calm">
        <Txt size="large" bold>
          {answer.headline}
        </Txt>
        {answer.explanation ? <Txt>{answer.explanation}</Txt> : null}
      </HelperBubble>
      {onChoose ? (
        <Chips>
          {(answer.choices ?? []).map((choice, i) => (
            <Chip key={choice} primary={i === 0} label={choice} onPress={() => onChoose(choice)} />
          ))}
        </Chips>
      ) : null}
    </View>
  );
}
