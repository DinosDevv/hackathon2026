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
import { AnswerCard, spokenText } from "../src/components/AnswerCard";
import { Txt } from "../src/components/ui";
import { addToHistory } from "../src/history";
import { useSettings } from "../src/settings";
import { speak, stopSpeaking } from "../src/speech";
import { colors, useFontSizes } from "../src/theme";
import { useVoiceInput } from "../src/useVoiceInput";

type Entry = { question: string; answer?: HelperAnswer; error?: string };

const SUGGESTIONS = [
  "How do I make the writing bigger on my phone?",
  "Someone called saying they are from my bank. What should I do?",
  "How do I video call my family?",
];

export default function Ask() {
  const params = useLocalSearchParams<{ question?: string; listen?: string }>();
  const { settings } = useSettings();
  const fonts = useFontSizes();
  const serverUrl = resolveServerUrl(settings.serverUrl);
  const [attachment] = useState(getPendingAttachment);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState("");
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
      const index = entries.length;
      const history: Turn[] = entries
        .filter((e) => e.answer)
        .flatMap((e) => [
          { role: "user" as const, text: e.question },
          { role: "assistant" as const, text: spokenText(e.answer!) },
        ]);
      setEntries((prev) => [...prev, { question: q }]);
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
            ? "I couldn't reach Helper. Check that the Helper server is running and the phone is on the same Wi-Fi."
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

  const startListening = useCallback(async () => {
    try {
      await voice.start();
    } catch (e) {
      Alert.alert("Microphone", e instanceof Error ? e.message : String(e));
    }
  }, [voice]);

  const onMicPress = async () => {
    if (voice.status === "listening") {
      try {
        const text = await voice.finish();
        if (text) send(text);
        else Alert.alert("I didn't hear anything", "Press the microphone and try again.");
      } catch (e) {
        Alert.alert("Sorry", e instanceof Error ? e.message : String(e));
      }
      return;
    }
    if (sttAvailable) {
      startListening();
    } else {
      // No server-side speech-to-text: use the keyboard's own dictation button instead.
      inputRef.current?.focus();
      Alert.alert("Speak using the keyboard", "Tap the small microphone at the bottom of the keyboard and speak your question.");
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    checkHealth(serverUrl)
      .then((health) => {
        setSttAvailable(health.stt);
        if (params.question) send(params.question);
        else if (params.listen && health.stt) startListening();
        else if (params.listen) inputRef.current?.focus();
      })
      .catch(() => {
        setServerDown(true);
        setSttAvailable(false);
      });
    return () => stopSpeaking();
    // Runs once when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listening = voice.status === "listening";
  const transcribing = voice.status === "transcribing";

  return (
    <SafeAreaView style={styles.screen} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={100}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {serverDown && (
            <View style={styles.warning}>
              <Txt bold color={colors.verdict.danger.fg}>
                Helper can't connect right now.
              </Txt>
              <Txt size="small">
                Make sure the Helper server is running on the laptop and the phone is on the same Wi-Fi. Address: {serverUrl}
              </Txt>
            </View>
          )}

          {attachment?.kind === "image" && (
            <View style={styles.attachment}>
              <Txt size="small" color={colors.muted}>
                {attachment.source === "photo" ? "Your photo" : "Your screenshot"}
              </Txt>
              <Image source={{ uri: attachment.uri }} style={styles.image} resizeMode="contain" />
            </View>
          )}
          {attachment?.kind === "text" && (
            <View style={styles.attachment}>
              <Txt size="small" color={colors.muted}>
                What you copied
              </Txt>
              <Txt>{attachment.text.length > 400 ? attachment.text.slice(0, 400) + "…" : attachment.text}</Txt>
            </View>
          )}

          {entries.length === 0 && !attachment && !listening && !loading && (
            <View style={{ gap: 12 }}>
              <Txt size="large" bold>
                Ask me anything, or try:
              </Txt>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} onPress={() => send(s)} style={styles.suggestion} accessibilityRole="button">
                  <Txt>{s}</Txt>
                </Pressable>
              ))}
            </View>
          )}

          {entries.map((entry, i) => (
            <View key={i} style={{ gap: 12 }}>
              <View style={styles.question}>
                <Txt size="small" color={colors.muted}>
                  You asked
                </Txt>
                <Txt size="large">{entry.question}</Txt>
              </View>
              {entry.answer && (
                <AnswerCard
                  answer={entry.answer}
                  speaking={speakingIndex === i}
                  onSpeakingChange={(on) => setSpeakingIndex(on ? i : null)}
                />
              )}
              {entry.error && (
                <View style={styles.warning}>
                  <Txt>{entry.error}</Txt>
                </View>
              )}
            </View>
          ))}

          {loading && (
            <View style={styles.thinking}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Txt size="large">Helper is thinking…</Txt>
            </View>
          )}
        </ScrollView>

        <View style={styles.bar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={listening ? "Stop listening and send" : "Speak your question"}
            onPress={onMicPress}
            disabled={loading || transcribing}
            style={[styles.micButton, listening && { backgroundColor: colors.listening }, (loading || transcribing) && { opacity: 0.5 }]}
          >
            {transcribing ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Txt size="large" bold color={colors.primaryText} center>
                {listening ? "⏹️  I'm listening… tap when done" : entries.length ? "🎤  Ask another question" : "🎤  Speak your question"}
              </Txt>
            )}
          </Pressable>
          <View style={styles.typeRow}>
            <TextInput
              ref={inputRef}
              value={typed}
              onChangeText={setTyped}
              placeholder="Or type here"
              placeholderTextColor="#8A8A8A"
              style={[styles.input, { fontSize: fonts.body }]}
              returnKeyType="send"
              onSubmitEditing={() => send(typed)}
              multiline={false}
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 16, paddingBottom: 24 },
  attachment: { gap: 8, backgroundColor: colors.card, borderRadius: 16, padding: 12, borderWidth: 2, borderColor: colors.border },
  image: { width: "100%", height: 260, borderRadius: 10 },
  question: { alignSelf: "flex-end", maxWidth: "90%", backgroundColor: "#E4E2DC", borderRadius: 16, padding: 14 },
  thinking: { flexDirection: "row", gap: 14, alignItems: "center", padding: 12 },
  warning: { backgroundColor: colors.verdict.danger.bg, borderRadius: 14, padding: 14, gap: 4 },
  suggestion: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 2, borderColor: colors.border, padding: 14 },
  bar: { padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  micButton: { backgroundColor: colors.primary, borderRadius: 20, minHeight: 72, justifyContent: "center", paddingHorizontal: 16 },
  typeRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    color: colors.text,
  },
  sendButton: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 18, justifyContent: "center" },
});
