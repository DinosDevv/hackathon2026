import { setStatusBarStyle } from "expo-status-bar";
import { Redirect, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Reanimated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { EmergencyButton } from "../src/components/EmergencyButton";
import { Icon, type IconName } from "../src/components/Icon";
import { PressableScale } from "../src/components/motion";
import { Txt, tap } from "../src/components/ui";
import { MorePage } from "../src/home/MorePage";
import { ShowPage } from "../src/home/ShowPage";
import { TalkPage } from "../src/home/TalkPage";
import { useSettings } from "../src/settings";
import { colors } from "../src/theme";

// Swipe between pages like Instagram. Home (talking to Helper) sits in the middle and is where the app opens.
// The bar only shows where you are: it must not look like the button you press to talk.
const PAGES: { label: string; icon: IconName }[] = [
  { label: "Δείξε μου", icon: "camera" },
  { label: "Αρχική", icon: "home" },
  { label: "Περισσότερα", icon: "more" },
];
const TALK = 1;
const BAR_PADDING = 12;

export default function Home() {
  const { settings } = useSettings();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<Reanimated.ScrollView>(null);
  const [page, setPage] = useState(TALK);
  const offset = useSharedValue(TALK * width);
  const shownPage = useSharedValue(TALK);

  // Light status bar over the teal Talk page, dark everywhere else.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(page === TALK ? "light" : "dark");
      return () => setStatusBarStyle("dark");
    }, [page]),
  );

  const onScroll = useAnimatedScrollHandler((e) => {
    offset.value = e.contentOffset.x;
    const p = Math.round(e.contentOffset.x / width);
    if (p !== shownPage.value && p >= 0 && p < PAGES.length) {
      shownPage.value = p;
      scheduleOnRN(setPage, p);
    }
  });

  // A thin line marks the current page and slides along with the finger while swiping.
  const tabWidth = (width - BAR_PADDING * 2) / PAGES.length;
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: (offset.value / width) * tabWidth }] }));

  if (!settings.onboarded) return <Redirect href="/onboarding" />;

  const goTo = (i: number) => {
    tap();
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  };

  return (
    <View style={styles.screen}>
      <Reanimated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: TALK * width, y: 0 }}
        onLayout={() => scrollRef.current?.scrollTo({ x: shownPage.value * width, animated: false })}
        scrollEventThrottle={16}
        onScroll={onScroll}
        style={{ flex: 1 }}
      >
        <ShowPage width={width} />
        <TalkPage width={width} />
        <MorePage width={width} />
      </Reanimated.ScrollView>

      {/* Same place on every page, above whatever page is showing. */}
      <EmergencyButton style={{ position: "absolute", top: insets.top + 10, right: 16 }} />

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]} accessibilityRole="tablist">
        <Reanimated.View style={[styles.indicator, { width: tabWidth * 0.4, marginLeft: tabWidth * 0.3 }, indicator]} />
        {PAGES.map((p, i) => {
          const active = i === page;
          return (
            <PressableScale
              key={p.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={p.label}
              onPress={() => goTo(i)}
              style={styles.tab}
            >
              <Icon name={p.icon} size={22} color={active ? colors.primary : colors.muted} />
              <Txt size="small" bold={active} color={active ? colors.primary : colors.muted}>
                {p.label}
              </Txt>
            </PressableScale>
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
    paddingTop: 6,
    paddingHorizontal: BAR_PADDING,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  indicator: {
    position: "absolute",
    top: 0,
    left: BAR_PADDING,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.primary,
  },
  // Still a comfortable 56pt to tap, but no filled shape, so it reads as a place, not an action.
  tab: { flex: 1, height: 56, alignItems: "center", justifyContent: "center", gap: 2 },
});
