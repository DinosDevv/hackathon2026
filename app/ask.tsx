import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
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
import { AnswerCard, spokenText } from "../src/components/AnswerCard";
import { EmergencyPanel } from "../src/components/EmergencyPanel";
import { soundsUrgent } from "../src/emergency";
import { Icon } from "../src/components/Icon";
import { BigButton, QuietButton, TopBar, Txt, tap } from "../src/components/ui";
import { addToHistory } from "../src/history";
import { useSettings } from "../src/settings";
import { speak, stopSpeaking } from "../src/speech";
import { colors, radius, useFontSizes } from "../src/theme";
import { useVoiceInput } from "../src/useVoiceInput";

type Entry = { question: string; answer?: HelperAnswer; error?: string };

const SUGGESTIONS = [
  "How do I make the writing bigger on my phone?",
  "Someone called saying they are from my bank. What should I do?",
  "How do I video call my family?",
];

/** A soft ring that grows and fades behind the microphone while Helper is listening. */
function ListeningPulse() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulse,
        {
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
        },
      ]}
    />
  );
}

export default function Ask() {
  const params = useLocalSearchParams<{ question?: string; listen?: string; from?: string }>();
  const { settings, update } = useSettings();
  const fonts = useFontSizes();
  const serverUrl = resolveServerUrl(settings.serverUrl);
  const [attachment] = useState(getPendingAttachment);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState("");
  const [typing, setTyping] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [sttAvailable, setSttAvailable] = useState<boolean | null>(null);
  const [serverDown, setServerDown] = useState(false);
  const voice = useVoiceInput(serverUrl, settings.language);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const started = useRef(false);

  const send = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || loading) return;
      stopSpeaking();
      setSpeakingIndex(null);
      setTyped("");
      setTyping(false);
      // A failed last question is replaced rather than left above the new attempt.
      const base = entries.at(-1)?.error ? entries.slice(0, -1) : entries;
      const index = base.length;
      const history: Turn[] = base
        .filter((e) => e.answer)
        .flatMap((e) => [
          { role: "user" as const, text: e.question },
          { role: "assistant" as const, text: spokenText(e.answer!) },
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
          language: settings.language,
        });
        setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, answer } : e)));
        addToHistory(q, answer).catch(() => {});
        if (settings.answerMode !== "text") {
          setSpeakingIndex(index);
          speak(spokenText(answer), settings, () => setSpeakingIndex((cur) => (cur === index ? null : cur)));
        }
      } catch (e) {
        const error =
          e instanceof TypeError
            ? "I couldn't reach Helper just now. Please try again in a moment."
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
      Alert.alert("Microphone", e instanceof Error ? e.message : String(e));
    }
  }, [voice]);

  const onTalkPress = async () => {
    tap();
    if (voice.status === "listening") {
      try {
        const text = await voice.finish();
        if (text) send(text);
        else Alert.alert("I didn't hear anything", "Tap the button and try again.");
      } catch (e) {
        Alert.alert("Sorry", e instanceof Error ? e.message : String(e));
      }
      return;
    }
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
    ? "Listening… tap when done"
    : transcribing
      ? "Writing down your words…"
      : entries.length
        ? "Ask something else"
        : "Tap to talk";

  return (
    <SafeAreaView style={styles.screen}>
      <TopBar backLabel="Home" />
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
                  Helper can't connect right now
                </Txt>
              </View>
              <Txt>Ask the person who set up Helper to check the connection.</Txt>
              <Txt size="small" color={colors.muted}>
                Address: {serverUrl}
              </Txt>
              <BigButton icon="retry" label="Try again" onPress={() => connect()} />
            </View>
          )}

          {attachment?.kind === "image" && (
            <View style={styles.attachment}>
              <Image source={{ uri: attachment.uri }} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />
              <Txt size="small" bold color={colors.muted}>
                {attachment.source === "photo" ? "Your photo" : "Your screenshot"}
              </Txt>
            </View>
          )}
          {attachment?.kind === "text" && (
            <View style={styles.attachment}>
              <Txt size="small" bold color={colors.muted}>
                What you copied
              </Txt>
              <Txt>{attachment.text.length > 400 ? attachment.text.slice(0, 400) + "…" : attachment.text}</Txt>
            </View>
          )}

          {entries.length === 0 && !attachment && !listening && !loading && (
            <View style={{ gap: 12 }}>
              <Txt size="title" bold header>
                What would you like to know?
              </Txt>
              <Txt color={colors.muted}>Tap the big button below and speak, or try one of these:</Txt>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                >
                  <Icon name="chat" size={24} color={colors.primary} />
                  <Txt style={{ flex: 1 }}>{s}</Txt>
                </Pressable>
              ))}
            </View>
          )}

          {listening && entries.length === 0 && (
            <View style={styles.listeningHint}>
              <Txt size="title" bold center header>
                I'm listening
              </Txt>
              <Txt size="large" center color={colors.muted}>
                Say your question, then tap the button below.
              </Txt>
            </View>
          )}

          {entries.map((entry, i) => (
            <View key={i} style={{ gap: 14 }}>
              <View style={styles.question}>
                <Txt size="small" bold color={colors.muted}>
                  You asked
                </Txt>
                <Txt size="large">{entry.question}</Txt>
              </View>
              {(entry.answer?.emergency || (entry.error && soundsUrgent(entry.question))) && <EmergencyPanel />}
              {entry.answer && (
                <AnswerCard
                  answer={entry.answer}
                  speaking={speakingIndex === i}
                  onSpeakingChange={(on) => setSpeakingIndex(on ? i : null)}
                />
              )}
              {entry.error && (
                <View style={styles.notice}>
                  <Txt>{entry.error}</Txt>
                  {i === entries.length - 1 && !loading && (
                    <BigButton icon="retry" label="Try again" onPress={() => send(entry.question)} />
                  )}
                </View>
              )}
            </View>
          ))}

          {loading && (
            <View style={styles.thinking}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Txt size="large" bold>
                {attachment ? "Looking at it…" : "Thinking…"}
              </Txt>
            </View>
          )}
        </ScrollView>

        <View style={styles.dock}>
          {typing ? (
            <>
              {!sttAvailable && (
                <Txt size="small" color={colors.muted} center>
                  To speak, tap the microphone on the keyboard.
                </Txt>
              )}
              <View style={styles.typeRow}>
                <TextInput
                  ref={inputRef}
                  value={typed}
                  onChangeText={setTyped}
                  placeholder="Write your question"
                  placeholderTextColor="#7C7F85"
                  accessibilityLabel="Your question"
                  style={[styles.input, { fontSize: fonts.body }]}
                  returnKeyType="send"
                  onSubmitEditing={() => send(typed)}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send"
                  onPress={() => send(typed)}
                  disabled={!typed.trim() || loading}
                  style={[styles.sendButton, (!typed.trim() || loading) && { opacity: 0.4 }]}
                >
                  <Txt bold color={colors.primaryText}>
                    Send
                  </Txt>
                </Pressable>
              </View>
              {sttAvailable ? <QuietButton icon="mic" label="Speak instead" onPress={() => setTyping(false)} /> : null}
            </>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={listening ? "Stop listening and send my question" : talkLabel}
                accessibilityState={{ busy, disabled: busy }}
                onPress={onTalkPress}
                disabled={busy}
                style={({ pressed }) => [
                  styles.talk,
                  listening && { backgroundColor: colors.listening },
                  busy && { backgroundColor: colors.muted },
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={styles.talkIcon}>
                  {listening && <ListeningPulse />}
                  {transcribing ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Icon name={listening ? "stop" : "mic"} size={30} color={listening ? colors.listening : colors.primary} />
                  )}
                </View>
                <Txt size="large" bold color={colors.primaryText} style={{ flexShrink: 1 }}>
                  {talkLabel}
                </Txt>
              </Pressable>
              {!listening && !busy && <QuietButton icon="keyboard" label="Type instead" onPress={startTyping} />}
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
  attachment: { gap: 8, backgroundColor: colors.card, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.border },
  image: { width: "100%", height: 220, borderRadius: radius.sm, backgroundColor: colors.sunken },
  question: { alignSelf: "flex-end", maxWidth: "88%", backgroundColor: colors.sunken, borderRadius: 20, borderBottomRightRadius: 6, padding: 14, gap: 2 },
  thinking: { flexDirection: "row", gap: 14, alignItems: "center", padding: 18, backgroundColor: colors.card, borderRadius: radius.md },
  notice: { backgroundColor: colors.verdict.danger.bg, borderRadius: radius.md, padding: 16, gap: 10 },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    minHeight: 64,
  },
  listeningHint: { paddingVertical: 48, gap: 10 },
  dock: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, gap: 6, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  talk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    minHeight: 88,
    paddingHorizontal: 16,
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
