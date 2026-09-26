// Recognises "call Maria"-style requests. Kept free of phone APIs so it can be tested on its own.

// Greek letters to their usual Latin spelling, so "Μαρία" matches a guardian saved as "Maria".
const GREEK: Record<string, string> = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m", ν: "n",
  ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o",
};

/** Lower case, no accents, Greek spelled in Latin letters. */
function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[α-ω]/g, (c) => GREEK[c] ?? c);
}

// Words that mean "get them on the phone", in English and (normalised) Greek.
const CALL_WORDS =
  /\b(call|ring|phone|dial|talk to|speak to|speak with|talk with|get me|put me through|tilefonise|tilefono|pare|kalese|milise|milao|thelo)\b/;

/**
 * True when the user is asking to call their guardian by name ("Call Maria", "I want to talk to Maria",
 * or just "Maria!"). Mentioning the name alone ("Maria sent me this, is it safe?") doesn't count.
 */
export function asksForGuardian(text: string, settings: { familyName: string }) {
  const first = normalize(settings.familyName.trim().split(/\s+/)[0] ?? "");
  if (first.length < 2) return false;
  const said = normalize(text).replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
  const words = said.split(" ");
  if (!words.includes(first)) return false;
  // Just the name, maybe with "please" or "now": they want that person.
  if (words.length <= 3 && words.every((w) => [first, "please", "now", "tora", "parakalo"].includes(w))) return true;
  // "I want Maria", "I need Maria": only right before the name, so "I want to know if Maria…" doesn't count.
  return CALL_WORDS.test(said) || new RegExp(`\\b(want|need)\\s+${first}\\b`).test(said);
}
