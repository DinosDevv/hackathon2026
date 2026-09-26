import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { askHelper, checkHealth, resolveServerUrl, type HelperAnswer, type Turn } from "../src/api";
import { getPendingAttachment } from "../src/attachments";
import { AnswerCard } from "../src/components/AnswerCard";
import { Chip, Chips, HelperBubble, TypingBubble, UserBubble } from "../src/components/Chat";
import { PressableScale } from "../src/components/motion";
import Reanimated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { CallingCard } from "../src/components/CallingCard";
import { ClarifyCard } from "../src/components/ClarifyCard";
import { asksForGuardian } from "../src/guardian";
import { EmergencyPanel } from "../src/components/EmergencyPanel";
import { soundsUrgent } from "../src/emergency";
import { Icon } from "../src/components/Icon";
import { BigButton, QuietButton, TopBar, Txt, tap } from "../src/components/ui";
import { addToHistory } from "../src/history";
import { chatOpener, thinkingLines } from "../src/personality";
import { callName, useSettings } from "../src/settings";
import { setCloudVoice, speak, spokenText, stopSpeaking } from "../src/speech";
import { colors, radius, useFontSizes } from "../src/theme";
import { useVoiceInput } from "../src/useVoiceInput";

/** `call`: they asked for their guardian by name, so Helper calls straight away without asking the server. */
type Entry = { question: string; answer?: HelperAnswer; error?: string; call?: boolean };

const SUGGESTIONS = [
  "Πώς μεγαλώνω τα γράμματα στο κινητό μου;",
  "Με πήρε κάποιος και είπε ότι είναι από την τράπεζα. Τι να κάνω;",
  "Πώς κάνω βιντεοκλήση στην οικογένειά μου;",
];

/** A ring behind the microphone that grows with the user's voice, so they can see Helper hears them. */
function VoiceRing({ level }: { level: number }) {
  const style = useAnimatedStyle(() => ({
    opacity: withTiming(0.35 + level * 0.4, { duration: 90 }),
    transform: [{ scale: withSpring(1.15 + level * 0.9, { damping: 12, stiffness: 220 }) }],
  }));
  return <Reanimated.View pointerEvents="none" style={[styles.pulse, style]} />;
}

/** The dock button's colour glides between ready (teal), listening (orange) and busy (grey). */
function TalkBackground({ mode }: { mode: 0 | 1 | 2 }) {
  const style = useAnimatedStyle(() => ({
    backgroundColor: withTiming([colors.primary, colors.listening, colors.muted][mode], { duration: 250 }),
  }));
  return <Reanimated.View style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }, style]} />;
}

export default function Ask() {
  const params = useLocalSearchParams<{ question?: string; listen?: string; from?: string }>();
  const { settings, update } = useSettings();
  const fonts = useFontSizes();
  const serverUrl = resolveServerUrl(settings.serverUrl);
  const [attachment] = useState(getPendingAttachment);
  const [opener] = useState(() => chatOpener(callName(settings)));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState("");
  const [typing, setTyping] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [sttAvailable, setSttAvailable] = useState<boolean | null>(null);
  const [serverDown, setServerDown] = useState(false);
  // Shown under the talk button after a voice attempt that didn't go through (nothing heard, cancelled).
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const voice = useVoiceInput(serverUrl, settings.language, {
    // They stopped talking: send it, as if they had tapped the button.
    onSilence: () => finishAndSend(),
    onNothingHeard: () => {
      voice.cancel();
      setVoiceHint("Δεν άκουσα τίποτα. Πάτα το κουμπί όταν θες.");
    },
  });
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const started = useRef(false);

  const send = useCallback(
    async (question: string, detail: "short" | "full" = settings.detail) => {
      const q = question.trim();
      if (!q || loading) return;
      stopSpeaking();
      setSpeakingIndex(null);
      setTyped("");
      setTyping(false);
      // A failed last question is replaced rather than left above the new attempt.
      const base = entries.at(-1)?.error ? entries.slice(0, -1) : entries;
      if (asksForGuardian(q, settings)) {
        setEntries([...base, { question: q, call: true }]);
        return;
      }
      const index = base.length;
      const history: Turn[] = base
        .filter((e) => e.answer)
        .flatMap((e) => [
          { role: "user" as const, text: e.question },
          { role: "assistant" as const, text: spokenText(e.answer!, settings.language) },
        ]);
      setEntries([...base, { question: q }]);
      setLoading(true);
      try {
        const answer = await askHelper(serverUrl, {
          question: q,
          history,
          image: attachment?.kind === "image" ? { data: attachment.base64, mediaType: "image/jpeg" } : undefined,
          contextText: attachment?.kind === "text" ? attachment.text : undefined,
          name: settings.name || undefined,
          nickname: settings.nickname || undefined,
          guardianName: settings.familyName || undefined,
          language: settings.language,
          detail,
        });
        setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, answer } : e)));
        // Feel the verdict before reading it: a warning buzz for danger, a light tick for good news.
        const feel = answer.emergency || answer.verdict === "danger"
          ? Haptics.NotificationFeedbackType.Error
          : answer.verdict === "caution"
            ? Haptics.NotificationFeedbackType.Warning
            : answer.verdict === "safe"
              ? Haptics.NotificationFeedbackType.Success
              : null;
        if (feel) Haptics.notificationAsync(feel).catch(() => {});
        // Check-first questions ("Did you mean to send this?") aren't worth keeping.
        if (!answer.clarify) addToHistory(q, answer).catch(() => {});
        if (settings.answerMode !== "text") {
          setSpeakingIndex(index);
          speak(spokenText(answer, settings.language), settings, () => setSpeakingIndex((cur) => (cur === index ? null : cur)));
        }
      } catch (e) {
        const error =
          e instanceof TypeError
            ? "Ωχ, το ίντερνετ παίζει κρυφτό. Δοκιμάζουμε ξανά σε λίγο;"
            : e instanceof Error
              ? e.message
              : String(e);
        setEntries((prev) => prev.map((en, i) => (i === index ? { ...en, error } : en)));
      } finally {
        setLoading(false);
      }
    },
    [entries, loading, serverUrl, attachment, settings],
  );

  const startTyping = () => {
    setTyping(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const startListening = useCallback(async () => {
    try {
      await voice.start();
    } catch (e) {
      Alert.alert("Μικρόφωνο", e instanceof Error ? e.message : String(e));
    }
  }, [voice]);

  const finishAndSend = async () => {
    try {
      const text = await voice.finish();
      if (text === null) return; // Cancelled while it was being written down.
      if (text) send(text);
      else setVoiceHint("Δεν το έπιασα. Πάτα το κουμπί και ξαναπές το.");
    } catch (e) {
      Alert.alert("Συγγνώμη", e instanceof Error ? e.message : String(e));
    }
  };

  const cancelVoice = () => {
    tap();
    voice.cancel();
    setVoiceHint("Εντάξει, δεν το έστειλα. Πάτα το κουμπί όταν θες.");
  };

  const onTalkPress = async () => {
    tap();
    if (voice.status === "listening") {
      finishAndSend();
      return;
    }
    setVoiceHint(null);
    // Without server speech-to-text, the keyboard's own dictation microphone does the listening.
    if (sttAvailable) startListening();
    else startTyping();
  };

  const connect = useCallback(
    (onReady?: (stt: boolean) => void) =>
      checkHealth(serverUrl)
        .then((health) => {
          setServerDown(false);
          setSttAvailable(health.stt);
          setCloudVoice(health.tts ? serverUrl : null);
          onReady?.(health.stt);
        })
        .catch(() => {
          setServerDown(true);
          setSttAvailable(false);
        }),
    [serverUrl],
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // Lets the setup guide confirm that the one-press shortcut works.
    if (params.from === "shortcut" && !settings.shortcutTested) update({ shortcutTested: true });
    connect((stt) => {
      if (params.question) send(params.question);
      else if (params.listen && stt) startListening();
      else if (params.listen) startTyping();
    });
    return () => stopSpeaking();
    // Runs once when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listening = voice.status === "listening";
  const transcribing = voice.status === "transcribing";
  const busy = loading || transcribing;
  const talkLabel = listening
    ? "Σε ακούω… πάτα για αποστολή"
    : transcribing
      ? "Γράφω αυτά που είπες…"
      : entries.length
        ? "Ρώτα κάτι άλλο"
        : "Πάτα και μίλα";

  return (
    <SafeAreaView style={styles.screen}>
      <TopBar backLabel="Αρχική" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {serverDown && (
            <View style={styles.notice}>
              <View style={styles.row}>
                <Icon name="wifi" size={26} color={colors.danger} />
                <Txt size="large" bold style={{ flex: 1 }}>
                  Ο HelpNona δεν μπορεί να συνδεθεί τώρα
                </Txt>
              </View>
              <Txt>Ζήτα από αυτόν που έστησε τον HelpNona να ελέγξει τη σύνδεση.</Txt>
              <Txt size="small" color={colors.muted}>
                Διεύθυνση: {serverUrl}
              </Txt>
              <BigButton icon="retry" label="Ξαναδοκίμασε" onPress={() => connect()} />
            </View>
          )}

          {attachment?.kind === "image" && (
            <Image
              source={{ uri: attachment.uri }}
              style={styles.sentImage}
              resizeMode="cover"
              accessibilityLabel={attachment.source === "photo" ? "Η φωτογραφία σου" : "Το στιγμιότυπό σου"}
              accessibilityIgnoresInvertColors
            />
          )}
          {attachment?.kind === "text" && (
            <UserBubble>
              <Txt size="small" bold color="#CFE3E0">
                Αντιγραμμένο μήνυμα
              </Txt>
              <Txt color={colors.primaryText}>
                {attachment.text.length > 400 ? attachment.text.slice(0, 400) + "…" : attachment.text}
              </Txt>
            </UserBubble>
          )}

          {entries.length === 0 && !attachment && !listening && !loading && (
            <View style={{ gap: 8 }}>
              <HelperBubble>
                <Txt size="large">{opener}</Txt>
              </HelperBubble>
              <Chips>
                {SUGGESTIONS.map((s) => (
                  <Chip key={s} label={s} onPress={() => send(s)} />
                ))}
              </Chips>
            </View>
          )}

          {listening && entries.length === 0 && (
            <View style={styles.listeningHint}>
              <Txt size="title" bold center header>
                Σε ακούω
              </Txt>
              <Txt size="large" center color={colors.muted}>
                Πες μου τι χρειάζεσαι και μετά πάτα το κουμπί από κάτω.
              </Txt>
            </View>
          )}

          {entries.map((entry, i) => (
            <View key={i} style={{ gap: 10 }}>
              <UserBubble>
                <Txt color={colors.primaryText}>{entry.question}</Txt>
              </UserBubble>
              {(entry.answer?.emergency || (entry.error && soundsUrgent(entry.question))) && <EmergencyPanel />}
              {entry.answer?.clarify ? (
                <ClarifyCard answer={entry.answer} onChoose={i === entries.length - 1 && !loading ? (c) => send(c) : undefined} />
              ) : entry.answer ? (
                <AnswerCard
                  answer={entry.answer}
                  speaking={speakingIndex === i}
                  onSpeakingChange={(on) => setSpeakingIndex(on ? i : null)}
                  onMore={
                    settings.detail === "short" && i === entries.length - 1 && !loading && !entry.answer.emergency
                      ? () => send("Πες μου κι άλλα γι' αυτό.", "full")
                      : undefined
                  }
                  imageUri={attachment?.kind === "image" ? attachment.uri : undefined}
                />
              ) : null}
              {entry.call && <CallingCard first announce active={i === entries.length - 1} />}
              {entry.answer?.guardianHelp === "call" && <CallingCard active={i === entries.length - 1} />}
              {entry.error && (
                <View style={{ gap: 8 }}>
                  <HelperBubble>
                    <Txt>{entry.error}</Txt>
                  </HelperBubble>
                  {i === entries.length - 1 && !loading && (
                    <Chips>
                      <Chip primary icon="retry" label="Ξαναδοκίμασε" onPress={() => send(entry.question)} />
                    </Chips>
                  )}
                </View>
              )}
            </View>
          ))}

          {loading && (
            <TypingBubble
              label={attachment ? "Ο HelpNona το κοιτάζει" : "Ο HelpNona σκέφτεται"}
              lines={thinkingLines(Boolean(attachment))}
            />
          )}
        </ScrollView>

        <View style={styles.dock}>
          {typing ? (
            <>
              {!sttAvailable && (
                <Txt size="small" color={colors.muted} center>
                  Για να μιλήσεις, πάτα το μικρόφωνο στο πληκτρολόγιο.
                </Txt>
              )}
              <View style={styles.typeRow}>
                <TextInput
                  ref={inputRef}
                  value={typed}
                  onChangeText={setTyped}
                  placeholder="Γράψε την ερώτησή σου"
                  placeholderTextColor="#7C7F85"
                  accessibilityLabel="Η ερώτησή σου"
                  style={[styles.input, { fontSize: fonts.body }]}
                  returnKeyType="send"
                  onSubmitEditing={() => send(typed)}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Αποστολή"
                  onPress={() => send(typed)}
                  disabled={!typed.trim() || loading}
                  style={[styles.sendButton, (!typed.trim() || loading) && { opacity: 0.4 }]}
                >
                  <Txt bold color={colors.primaryText}>
                    Αποστολή
                  </Txt>
                </Pressable>
              </View>
              {sttAvailable ? <QuietButton icon="mic" label="Καλύτερα με φωνή" onPress={() => setTyping(false)} /> : null}
            </>
          ) : (
            <>
              {listening ? (
                <Txt size="small" color={colors.muted} center>
                  Θα το στείλω μόλις σταματήσεις να μιλάς.
                </Txt>
              ) : voiceHint && !busy ? (
                <Txt size="small" color={colors.muted} center>
                  {voiceHint}
                </Txt>
              ) : null}
              <View style={styles.talkRow}>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={listening ? "Σταμάτα να ακούς και στείλε την ερώτησή μου" : talkLabel}
                  accessibilityState={{ busy, disabled: busy }}
                  onPress={onTalkPress}
                  disabled={busy}
                  scaleTo={0.97}
                  style={[styles.talk, { flex: 1 }]}
                >
                  <TalkBackground mode={listening ? 1 : busy ? 2 : 0} />
                  <View style={styles.talkIcon}>
                    {listening && <VoiceRing level={voice.level} />}
                    {transcribing ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <Icon name={listening ? "stop" : "mic"} size={30} color={listening ? colors.listening : colors.primary} />
                    )}
                  </View>
                  <Txt size="large" bold color={colors.primaryText} style={{ flexShrink: 1 }}>
                    {talkLabel}
                  </Txt>
                </PressableScale>
                {listening || transcribing ? (
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="Άκυρο. Μην το στείλεις."
                    onPress={cancelVoice}
                    style={styles.cancel}
                  >
                    <Icon name="close" size={28} color={colors.danger} />
                    <Txt size="small" bold color={colors.danger}>
                      Άκυρο
                    </Txt>
                  </PressableScale>
                ) : null}
              </View>
              {!listening && !busy && <QuietButton icon="keyboard" label="Καλύτερα γραπτά" onPress={startTyping} />}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, gap: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  sentImage: { alignSelf: "flex-end", width: "70%", aspectRatio: 0.8, borderRadius: 22, borderBottomRightRadius: 6, backgroundColor: colors.sunken },
  notice: { backgroundColor: colors.verdict.danger.bg, borderRadius: radius.md, padding: 16, gap: 10 },
  listeningHint: { paddingVertical: 48, gap: 10 },
  dock: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, gap: 6, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  talk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: radius.lg,
    minHeight: 88,
    paddingHorizontal: 16,
  },
  talkRow: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  cancel: {
    width: 88,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  talkIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  pulse: { position: "absolute", width: 60, height: 60, borderRadius: 30, backgroundColor: colors.card },
  typeRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    minHeight: 60,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    color: colors.text,
  },
  sendButton: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: 20, justifyContent: "center" },
});
