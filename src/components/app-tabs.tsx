/**
 * GlassTabBar — Glassmorphism floating bottom navigation for native (iOS & Android).
 * Uses expo-router/ui Tabs + TabList for routing, expo-blur for glass effect,
 * and react-native-reanimated for smooth press/active animations.
 *
 * Navigation logic is unchanged — only UI is redesigned.
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { TabList, Tabs, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import {
    Platform,
    Pressable,
    StyleSheet,
    useColorScheme,
    View,
} from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabItem = {
  name: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
};

// ─── Tab config — add/remove tabs here only ───────────────────────────────────

const TABS: TabItem[] = [
  {
    name: 'index',
    href: '/',
    icon: 'home-outline',
    iconActive: 'home',
    label: 'Home',
  },
  {
    name: 'setting',
    href: '/setting',
    icon: 'settings-outline',
    iconActive: 'settings',
    label: 'Setting',
  },
];

// ─── Spring config ────────────────────────────────────────────────────────────

const SPRING = { damping: 18, stiffness: 200, mass: 0.8 };

// ─── GlassTabButton ───────────────────────────────────────────────────────────

type GlassTabButtonProps = TabTriggerSlotProps & {
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
  isDark: boolean;
};

function GlassTabButton({
  icon,
  iconActive,
  label,
  isFocused,
  isDark,
  ...props
}: GlassTabButtonProps) {
  const pressed = useSharedValue(0);
  const focused = useSharedValue(isFocused ? 1 : 0);

  // Sync focused shared value when isFocused prop changes
  if (focused.value !== (isFocused ? 1 : 0)) {
    focused.value = withSpring(isFocused ? 1 : 0, SPRING);
  }

  const animatedContainer = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(
          interpolate(pressed.value, [0, 1], [1, 0.92]),
          SPRING
        ),
      },
    ],
  }));

  const animatedCapsule = useAnimatedStyle(() => ({
    opacity: withTiming(focused.value, { duration: 200 }),
    transform: [
      { scaleX: withSpring(interpolate(focused.value, [0, 1], [0.7, 1]), SPRING) },
      { scaleY: withSpring(interpolate(focused.value, [0, 1], [0.7, 1]), SPRING) },
    ],
  }));

  const animatedIcon = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(
          interpolate(focused.value, [0, 1], [1, 1.12]),
          SPRING
        ),
      },
    ],
  }));

  const iconColor = isFocused
    ? isDark ? '#ffffff' : '#000000'
    : isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)';

  return (
    <Pressable
      {...props}
      onPressIn={() => { pressed.value = withSpring(1, SPRING); }}
      onPressOut={() => { pressed.value = withSpring(0, SPRING); }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      style={styles.tabButtonOuter}
    >
      <Animated.View style={[styles.tabButtonInner, animatedContainer]}>
        {/* Active capsule background */}
        <Animated.View
          style={[
            styles.activeCapsule,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.18)'
                : 'rgba(255,255,255,0.55)',
              borderColor: isDark
                ? 'rgba(255,255,255,0.22)'
                : 'rgba(255,255,255,0.7)',
            },
            animatedCapsule,
          ]}
        />

        {/* Icon */}
        <Animated.View style={animatedIcon}>
          <Ionicons
            name={isFocused ? iconActive : icon}
            size={22}
            color={iconColor}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── GlassTabBar ─────────────────────────────────────────────────────────────

function GlassTabBar({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';

  const bottomPadding = Math.max(insets.bottom, 8);

  const barStyle = {
    backgroundColor: isDark
      ? 'rgba(20,20,20,0.45)'
      : 'rgba(255,255,255,0.12)',
    borderColor: isDark
      ? 'rgba(255,255,255,0.12)'
      : 'rgba(255,255,255,0.18)',
  };

  const androidStyle = {
    backgroundColor: isDark
      ? 'rgba(18,18,18,0.88)'
      : 'rgba(245,245,245,0.92)',
    borderColor: isDark
      ? 'rgba(255,255,255,0.10)'
      : 'rgba(255,255,255,0.60)',
  };

  return (
    <View
      style={[styles.barWrapper, { bottom: bottomPadding + 8 }]}
      pointerEvents="box-none"
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.glassBar, barStyle]}
        >
          <View style={styles.tabRow}>{children}</View>
        </BlurView>
      ) : (
        <View style={[styles.glassBar, androidStyle]}>
          <View style={styles.tabRow}>{children}</View>
        </View>
      )}
    </View>
  );
}

// ─── AppTabs (default export) ─────────────────────────────────────────────────

export default function AppTabs() {
  const isDark = useColorScheme() === 'dark';

  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <GlassTabBar>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <GlassTabButton
                icon={tab.icon}
                iconActive={tab.iconActive}
                label={tab.label}
                isDark={isDark}
              />
            </TabTrigger>
          ))}
        </GlassTabBar>
      </TabList>
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  slot: {
    flex: 1,
  },
  barWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    paddingHorizontal: 20,
  },
  glassBar: {
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
    // Shadow — iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    // Elevation — Android
    elevation: 16,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabButtonOuter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 44,
  },
  activeCapsule: {
    position: 'absolute',
    width: 56,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
});
