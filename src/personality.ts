// HelpNona's own lines outside Claude's answers: the cheeky teenage grandson, in Greek.
// Teasing is about the phone, the tech, scammers and HelpNona himself, never the person.

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Big line on the Home page, depending on the time of day. */
export function greetingLine(date = new Date()) {
  const h = date.getHours();
  if (h < 12) {
    return pick([
      "Πρώτα καφεδάκι, μετά το κινητό;",
      "Καλημέρα! Τι έκανε πάλι το κινητό;",
      "Από νωρίς στο πόδι και ήδη νικάς τους απατεώνες;",
      "Καλημέρα! Εγώ ξύπνιος, το κινητό ξύπνιο, πάμε.",
    ]);
  }
  if (h < 18) {
    return pick([
      "Τι σκαρώνει πάλι το κινητό;",
      "Έχεις κανένα μυστήριο για μένα;",
      "Κάνει πάλι δράματα το κινητό;",
      "Εδώ είμαι. Πες μου ποιος σε ενοχλεί.",
    ]);
  }
  return pick([
    "Καλησπέρα! Φέρθηκε καλά σήμερα το κινητό;",
    "Δεν κοιμάσαι ακόμα; Ούτε εγώ. Δεν κοιμάμαι ποτέ, θέμα κινητού.",
    "Τι να σου φτιάξω πριν τον ύπνο;",
    "Σου στέλνει κανένας κλόουν μηνύματα απόψε;",
  ]);
}

/** Shown under the typing dots while HelpNona works, one after another. */
export function thinkingLines(looking: boolean) {
  return looking
    ? ["Ρίχνω μια ματιά…", "Φοράω το καπέλο του ντετέκτιβ…", "Διαβάζω τα ψιλά γράμματα για σένα…", "Σχεδόν έτοιμο…"]
    : ["Χμμ, για να σκεφτώ…", "Ρωτάω ευγενικά το μυαλό μου…", "Σχεδόν έτοιμο…"];
}

/** First message in an empty chat. */
export function chatOpener(name: string) {
  const hi = name ? `Γεια σου, ${name}!` : "Γεια σου!";
  return pick([
    `${hi} Τι έκανε πάλι το κινητό; Πάτα το μεγάλο κουμπί και πες μου, ή διάλεξε ένα από αυτά:`,
    `${hi} Ποιος σε ταλαιπωρεί σήμερα, το κινητό ή κανένας απατεώνας; Πάτα το μεγάλο κουμπί και πες μου, ή δοκίμασε ένα από αυτά:`,
    `${hi} Είμαι όλος δικός σου. Πάτα το μεγάλο κουμπί και πες μου, ή διάλεξε ένα από αυτά:`,
  ]);
}
