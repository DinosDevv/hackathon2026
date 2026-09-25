import { setStatusBarStyle } from "expo-status-bar";
import { Redirect, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "../src/components/Icon";
import { Txt, tap } from "../src/components/ui";
import { MorePage } from "../src/home/MorePage";
import { ShowPage } from "../src/home/ShowPage";
import { TalkPage } from "../src/home/TalkPage";
import { useSettings } from "../src/settings";
import { colors } from "../src/theme";

// Swipe between pages like Instagram. Talk sits in the middle and is where the app opens.
const PAGES: { label: string; icon: IconName }[] = [
  { label: "Show me", icon: "camera" },
  { label: "Talk", icon: "mic" },
  { label: "More", icon: "more" },
];
const TALK = 1;

export default function Home() {
  const { settings } = useSettings();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(TALK);
  const pageRef = useRef(TALK);

  // Light status bar over the teal Talk page, dark everywhere else.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(page === TALK ? "light" : "dark");
      return () => setStatusBarStyle("dark");
    }, [page]),
  );

  if (!settings.onboarded) return <Redirect href="/onboarding" />;

  const goTo = (i: number) => {
    tap();
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: TALK * width, y: 0 }}
        onLayout={() => scrollRef.current?.scrollTo({ x: pageRef.current * width, animated: false })}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const p = Math.round(e.nativeEvent.contentOffset.x / width);
          if (p !== pageRef.current && p >= 0 && p < PAGES.length) {
            pageRef.current = p;
            setPage(p);
          }
        }}
        style={{ flex: 1 }}
      >
        <ShowPage width={width} />
        <TalkPage width={width} />
        <MorePage width={width} />
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]} accessibilityRole="tablist">
        {PAGES.map((p, i) => {
          const active = i === page;
          return (
            <Pressable
              key={p.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={p.label}
              onPress={() => goTo(i)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Icon name={p.icon} size={24} color={active ? colors.primaryText : colors.muted} />
              <Txt size="small" bold color={active ? colors.primaryText : colors.muted}>
                {p.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  bar: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: { flex: 1, minHeight: 60, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 2 },
  tabActive: { backgroundColor: colors.primary },
});
