# Implementation Plan: AsalUsul UI Foundation

## Overview

Replace the generic boilerplate screens with a premium, heritage-inspired Indonesian UI. The work proceeds in four phases: (1) extend the theme system, (2) build the six new shared components, (3) redesign the three screens, and (4) write tests. All code uses `StyleSheet.create`, Reanimated 4.x `entering`/`exiting` props, and the existing `ThemedText`, `ThemedView`, `useTheme`, and `useAuth` primitives. No new npm packages are introduced.

---

## Tasks

- [x] 1. Extend theme system in `src/constants/theme.ts`
  - [x] 1.1 Add `AsalUsulColors`, `Radii`, `Shadows` constants and type aliases
    - Export `AsalUsulColors` with all 12 keys (`backgroundWarm`, `backgroundCard`, `backgroundOverlay`, `primary`, `primaryLight`, `primaryMuted`, `textHeading`, `textBody`, `textMuted`, `textOnPrimary`, `goldAccent`, `borderSubtle`) — all values must be valid `#RRGGBB` hex strings
    - Export `Radii` with keys `sm` (8), `md` (16), `lg` (24), `pill` (999) — all positive integers
    - Export `Shadows` with keys `card` and `button`, each containing `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`
    - Export type aliases `AsalUsulColor`, `RadiusToken`, `ShadowToken`
    - Preserve all existing exports: `Colors`, `ThemeColor`, `Fonts`, `Spacing`, `BottomTabInset`, `MaxContentWidth`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [x] 1.2 Write property tests for theme tokens
    - **Property 7: `AsalUsulColors` hex color format invariant** — for any key in `AsalUsulColors`, value matches `#[0-9A-Fa-f]{6}`
    - **Validates: Requirements 4.2**
    - **Property 8: `Radii` tokens are positive integers invariant** — for any key in `Radii`, value is a positive integer > 0
    - **Validates: Requirements 4.4**
    - **Property 9: `Shadows` tokens have required shape fields invariant** — for any key in `Shadows`, value contains all required fields with correct types
    - **Validates: Requirements 4.6**
    - Create `src/__tests__/theme.property.test.ts`

- [x] 2. Implement `LogoHeader` component (`src/components/logo-header.tsx`)
  - [x] 2.1 Create `LogoHeader` component with `LogoHeaderProps` interface
    - Export `interface LogoHeaderProps { showTagline?: boolean; logoSize?: number; style?: StyleProp<ViewStyle> }`
    - Render `expo-image` `<Image>` with `source={require('@/assets/images/asal-usul-logo.png')}`, `contentFit="contain"`, `width` and `height` equal to `logoSize` (default 96)
    - Always render app name "AsalUsul" using `ThemedText type="title"`
    - Conditionally render tagline "Jejak Keluarga dalam Satu Pohon" using `ThemedText type="small"` only when `showTagline === true`
    - Apply `style` prop to outer container `View`
    - Use `StyleSheet.create` for all styles
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2_

  - [x] 2.2 Write property tests for `LogoHeader`
    - **Property 1: tagline visibility invariant** — for any boolean `showTagline`, tagline is rendered iff `showTagline === true`
    - **Validates: Requirements 5.3, 5.4**
    - **Property 2: app name always present invariant** — for any valid prop combination, "AsalUsul" is always rendered
    - **Validates: Requirements 5.2**
    - Create `src/__tests__/logo-header.property.test.tsx`

  - [x] 2.3 Write unit tests for `LogoHeader`
    - Test: renders logo image with default size 96
    - Test: renders logo image with custom `logoSize`
    - Test: renders app name "AsalUsul" always
    - Test: renders tagline when `showTagline={true}`
    - Test: does NOT render tagline when `showTagline={false}` or omitted
    - Test: applies `style` prop to outer container
    - Create `src/__tests__/logo-header.test.tsx`

- [x] 3. Implement `GoogleSignInButton` component (`src/components/google-sign-in-button.tsx`)
  - [x] 3.1 Create `GoogleSignInButton` component with `GoogleSignInButtonProps` interface
    - Export `interface GoogleSignInButtonProps { onPress: () => void; isLoading?: boolean; disabled?: boolean; label?: string }`
    - Render a `Pressable` with `backgroundColor: AsalUsulColors.primary`, `borderRadius: Radii.pill`, and `Shadows.button` applied
    - When `isLoading` is `false` (or omitted): render `AntDesign "google"` icon (size 20, color white) and label text using `ThemedText type="smallBold"` in white
    - When `isLoading` is `true`: render `ActivityIndicator` with `testID="activity-indicator"`; do NOT render icon or label
    - Default label: "Masuk dengan Google"; use `label` prop if provided
    - Set `accessibilityRole="button"`, `accessibilityLabel` equal to resolved label text
    - Set `accessibilityState.disabled` to `disabled || isLoading`; set `accessibilityState.busy` to `isLoading`
    - When `disabled || isLoading`, do NOT invoke `onPress` on tap
    - Press state: `opacity: 0.85` via `Pressable` `style` callback
    - Use `StyleSheet.create` for all styles
    - _Requirements: 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13, 5.14, 5.15, 5.16, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 3.2 Write property tests for `GoogleSignInButton`
    - **Property 3: loading state invariant** — for any boolean `isLoading`, `ActivityIndicator` present iff `isLoading === true`; label present iff `isLoading === false`
    - **Validates: Requirements 5.8, 5.9**
    - **Property 4: accessibility disabled invariant** — for any combination of `disabled` and `isLoading`, `accessibilityState.disabled` is `true` iff `disabled || isLoading`
    - **Validates: Requirements 5.12, 5.14, 6.6**
    - Create `src/__tests__/google-sign-in-button.property.test.tsx`

  - [x] 3.3 Write unit tests for `GoogleSignInButton`
    - Test: renders Google icon and default label when not loading
    - Test: renders custom `label` prop text
    - Test: renders `ActivityIndicator` and hides icon+label when `isLoading={true}`
    - Test: calls `onPress` when tapped and not disabled/loading
    - Test: does NOT call `onPress` when `disabled={true}`
    - Test: does NOT call `onPress` when `isLoading={true}`
    - Test: `accessibilityLabel` equals label text
    - Create `src/__tests__/google-sign-in-button.test.tsx`

- [x] 4. Implement `PrimaryButton` component (`src/components/primary-button.tsx`)
  - [x] 4.1 Create `PrimaryButton` component with `PrimaryButtonProps` interface
    - Export `interface PrimaryButtonProps { label: string; onPress: () => void; isLoading?: boolean; disabled?: boolean; variant?: 'filled' | 'outline'; style?: StyleProp<ViewStyle> }`
    - `filled` variant (default): `backgroundColor: AsalUsulColors.primary`, white label text, `Shadows.button` applied
    - `outline` variant: transparent background, `borderColor: AsalUsulColors.primary`, `AsalUsulColors.primary` label text, no shadow
    - Apply `borderRadius: Radii.pill`, `paddingVertical: 16`, `minHeight: 52` to both variants
    - When `isLoading` is `false` (or omitted): render `label` text
    - When `isLoading` is `true`: render `ActivityIndicator` (white for `filled`, `AsalUsulColors.primary` for `outline`) in place of label
    - When `disabled || isLoading`: apply `opacity: 0.5`, do NOT invoke `onPress` on tap
    - Set `accessibilityRole="button"`, `accessibilityState.disabled` and `accessibilityState.busy` per loading/disabled state
    - Apply `style` prop to outer `Pressable` container
    - Use `StyleSheet.create` for all styles
    - _Requirements: 5.17, 5.18, 5.19, 5.20, 5.21, 5.22, 5.23, 5.24, 6.1, 6.2, 6.3, 6.5, 6.6_

  - [x] 4.2 Write property tests for `PrimaryButton`
    - **Property 5: label invariant** — for any non-empty string `label`, `PrimaryButton` always renders that exact text when `isLoading={false}`
    - **Validates: Requirements 5.20, 5.23**
    - **Property 6: non-interactive when disabled or loading** — for any combination where `disabled || isLoading`, `onPress` is never invoked on press
    - **Validates: Requirements 5.22**
    - Create `src/__tests__/primary-button.property.test.tsx`

  - [x] 4.3 Write unit tests for `PrimaryButton`
    - Test: renders label text when not loading
    - Test: renders `ActivityIndicator` (white) when `isLoading={true}` and `variant="filled"`
    - Test: renders `ActivityIndicator` (primary color) when `isLoading={true}` and `variant="outline"`
    - Test: `filled` variant has correct background and shadow styles
    - Test: `outline` variant has transparent background and border styles
    - Test: applies `opacity: 0.5` when `disabled={true}`
    - Test: does NOT call `onPress` when `disabled={true}` or `isLoading={true}`
    - Create `src/__tests__/primary-button.test.tsx`

- [x] 5. Implement `HeroIllustration` component (`src/components/hero-illustration.tsx`)
  - [x] 5.1 Create `HeroIllustration` component with `HeroIllustrationProps` interface
    - Export `interface HeroIllustrationProps { size?: number; style?: StyleProp<ViewStyle> }`
    - Render a rounded rectangle container: `backgroundColor: AsalUsulColors.backgroundCard`, `borderRadius: Radii.lg`, `borderWidth: 1`, `borderColor: AsalUsulColors.borderSubtle`
    - Container `width` equals `size` prop (default 240); `height` equals `(3 / 4) * width` for 4:3 aspect ratio
    - Render centered `Ionicons "git-network-outline"` icon with `size={64}` and `color={AsalUsulColors.primaryMuted}`
    - Apply `style` prop to outer container
    - Use `StyleSheet.create` for all styles
    - _Requirements: 5.25, 5.26, 5.27, 5.28, 5.29, 6.1, 6.2_

  - [x] 5.2 Write unit tests for `HeroIllustration`
    - Test: renders container with default width 240 and height 180 (4:3)
    - Test: renders container with custom `size` prop and correct 4:3 height
    - Test: renders `Ionicons "git-network-outline"` icon
    - Test: applies `style` prop to outer container
    - Create `src/__tests__/hero-illustration.test.tsx`

- [x] 6. Implement `HomeHeader` component (`src/components/home-header.tsx`)
  - [x] 6.1 Create `HomeHeader` component with `HomeHeaderProps` interface
    - Export `interface HomeHeaderProps { actionIcon?: keyof typeof Ionicons.glyphMap; onActionPress?: () => void }`
    - Render "AsalUsul" left-aligned using `ThemedText type="subtitle"` with `color: AsalUsulColors.primary`
    - When `actionIcon` is provided: render an `Ionicons` icon button on the right with `accessibilityRole="button"`
    - When `onActionPress` is provided alongside `actionIcon`: invoke `onActionPress` on tap
    - When `actionIcon` is not provided: do NOT render a right-side icon button
    - Use `StyleSheet.create` for all styles
    - _Requirements: 5.30, 5.31, 5.32, 5.33, 6.1, 6.2_

  - [x] 6.2 Write unit tests for `HomeHeader`
    - Test: renders "AsalUsul" text
    - Test: renders action icon button when `actionIcon` is provided
    - Test: does NOT render action icon button when `actionIcon` is omitted
    - Test: calls `onActionPress` when icon button is tapped
    - Create `src/__tests__/home-header.test.tsx`

- [x] 7. Checkpoint — Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement `SplashScreen` component (`src/components/splash-screen.tsx`)
  - [x] 8.1 Create `SplashScreen` component with `SplashScreenProps` interface
    - Export `interface SplashScreenProps { isReady: boolean; onAnimationComplete: () => void }`
    - Render full-screen `View` with `backgroundColor: AsalUsulColors.backgroundWarm` and `StyleSheet.absoluteFill`
    - Wrap logo `<Image>` in `Animated.View` with `entering={FadeInDown.duration(800)}`; use `expo-image` `<Image>` with `source={require('@/assets/images/asal-usul-logo.png')}`, `contentFit="contain"`, `width={96}`, `height={96}`
    - Wrap app name "AsalUsul" in `Animated.View` with `entering={FadeInDown.duration(600).delay(300)}`
    - Wrap tagline "Jejak Keluarga dalam Satu Pohon" in `Animated.View` with `entering={FadeIn.duration(500).delay(450)}`
    - Wrap loading text "Memuat..." in `Animated.View` with `entering={FadeIn.duration(400).delay(600)}`; apply `opacity: 0.6` to the text
    - When `isReady` transitions to `true`: apply `exiting={FadeOut.duration(400)}` to the root overlay and call `onAnimationComplete` exactly once after the animation finishes using a `useEffect` with a ref guard to prevent double-invocation
    - Use `StyleSheet.create` for all styles; no NativeWind
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 6.7, 6.8, 6.9_

  - [x] 8.2 Write property test for `SplashScreen`
    - **Property 10: `onAnimationComplete` called exactly once** — for any number of re-renders (1–5) before animation completes, `onAnimationComplete` is called exactly once in total
    - **Validates: Requirements 1.10, 1.11**
    - Create `src/__tests__/splash-screen.property.test.tsx`

  - [x] 8.3 Write unit tests for `SplashScreen`
    - Test: renders full-screen background with `AsalUsulColors.backgroundWarm`
    - Test: renders logo image
    - Test: renders app name "AsalUsul"
    - Test: renders tagline "Jejak Keluarga dalam Satu Pohon"
    - Test: renders loading text "Memuat..."
    - Test: calls `onAnimationComplete` when `isReady` becomes `true`
    - Create `src/__tests__/splash-screen.test.tsx`

- [x] 9. Update `src/app/_layout.tsx` — swap `AnimatedSplashOverlay` for `SplashScreen`
  - [x] 9.1 Integrate `SplashScreen` into `RootLayout`
    - Remove `import { AnimatedSplashOverlay } from '@/components/animated-icon'`
    - Add `import { SplashScreen } from '@/components/splash-screen'`
    - Add local state `const [splashDone, setSplashDone] = useState(false)` in `RootLayout`
    - Render `<SplashScreen isReady={!loading} onAnimationComplete={() => setSplashDone(true)} />` conditionally when `!splashDone`
    - Remove the old `<AnimatedSplashOverlay />` usage
    - Keep all existing `SplashScreen.preventAutoHideAsync()` and `SplashScreen.hideAsync()` logic in `RootLayoutNav` unchanged
    - _Requirements: 1.10, 1.12_

  - [x] 9.2 Write unit tests for updated `_layout.tsx`
    - Test: `SplashScreen` is rendered while `loading` is `true`
    - Test: `SplashScreen` is removed after `onAnimationComplete` fires
    - Update `src/__tests__/layout.test.tsx`

- [x] 10. Redesign `src/app/login.tsx` — full LoginScreen rebuild
  - [x] 10.1 Rewrite `LoginScreen` using new components and brand tokens
    - Set screen background to `AsalUsulColors.backgroundWarm`
    - Render `<LogoHeader showTagline={true} logoSize={80} />` as the first visible element
    - Render heading "Selamat Datang" using `ThemedText type="subtitle"`
    - Render description "Masuk untuk melanjutkan perjalanan keluarga Anda" in `AsalUsulColors.textMuted`
    - Render `<GoogleSignInButton onPress={handleSignIn} isLoading={isSigningIn} />` wired to `signInWithGoogle` from `useAuth()`
    - Implement `handleSignIn`: set `isSigningIn(true)`, clear error, start 30 000 ms timeout, `await signInWithGoogle()`, handle error with Indonesian messages ("Masuk gagal. Coba lagi." fallback, "Waktu habis. Coba lagi." for timeout), always reset `isSigningIn` in `finally`
    - Display error message above `GoogleSignInButton` in color `#C0392B` when present; clear on new attempt
    - Render footer with tappable "Syarat Layanan" and "Kebijakan Privasi" links using `ThemedText type="small"` in `AsalUsulColors.textMuted`; each link opens URL via `expo-web-browser` `openBrowserAsync`
    - Double-tap guard: if `isSigningIn` is `true`, return early from `handleSignIn`
    - Use `StyleSheet.create` for all styles; no NativeWind; no new npm packages
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 6.7, 6.8, 6.9_

  - [x] 10.2 Write integration tests for redesigned `LoginScreen`
    - Test: renders `LogoHeader` with tagline
    - Test: renders "Selamat Datang" heading
    - Test: renders `GoogleSignInButton`
    - Test: sets `isLoading={true}` on `GoogleSignInButton` while signing in
    - Test: displays Indonesian error message on failure
    - Test: displays "Masuk gagal. Coba lagi." for non-Error thrown values
    - Test: displays "Waktu habis. Coba lagi." on 30 s timeout
    - Test: clears error on new sign-in attempt
    - Test: double-tap guard prevents second `signInWithGoogle` call
    - Test: footer links are rendered
    - Update `src/__tests__/login.test.tsx`

- [x] 11. Redesign `src/app/(tabs)/index.tsx` — full HomeScreen rebuild
  - [x] 11.1 Rewrite `HomeScreen` with empty state layout and animations
    - Set screen background to `AsalUsulColors.backgroundWarm`
    - Render `<HomeHeader actionIcon="notifications-outline" />` at the top (inside `SafeAreaView`)
    - Render `<HeroIllustration />` wrapped in `Animated.View` with `entering={FadeInDown.duration(400)}`
    - Render heading "Belum ada pohon keluarga" centered, wrapped in `Animated.View` with `entering={FadeInDown.duration(400)}`
    - Render description "Mulai buat pohon keluarga Anda dan hubungkan dengan anggota keluarga lainnya" in `AsalUsulColors.textMuted` centered, wrapped in `Animated.View` with `entering={FadeInDown.duration(400)}`
    - Render `<PrimaryButton variant="filled" label="Buat Sekarang" onPress={() => {}} />` wrapped in `Animated.View` with `entering={FadeInDown.duration(400)}`
    - Remove old profile/avatar section entirely
    - Use `StyleSheet.create` for all styles; no NativeWind; no new npm packages
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 6.7, 6.8, 6.9_

  - [x] 11.2 Write integration tests for redesigned `HomeScreen`
    - Test: renders `HomeHeader`
    - Test: renders `HeroIllustration`
    - Test: renders "Belum ada pohon keluarga" heading
    - Test: renders description text
    - Test: renders "Buat Sekarang" `PrimaryButton`
    - Test: `PrimaryButton` `onPress` is invokable (placeholder handler)
    - Update `src/__tests__/home.test.tsx`

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using `fast-check` (already installed)
- Unit tests validate specific examples and edge cases
- Test files follow the existing naming convention: `*.test.tsx` for unit/integration, `*.property.test.tsx` for property-based tests
- All new test files go in `src/__tests__/`
- Reanimated 4.x: use `entering` / `exiting` props on `Animated.View` — do NOT use the deprecated `useAnimatedStyle` + `withTiming` pattern for enter/exit
- `expo-image` `<Image>` (not React Native's `Image`) must be used for all logo rendering
- `@expo/vector-icons` `AntDesign` for the Google icon; `Ionicons` for `HomeHeader` and `HeroIllustration`
- `expo-web-browser` `openBrowserAsync` for footer links in `LoginScreen`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "4.1", "5.1", "6.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1", "4.2", "4.3", "5.2", "6.2"] },
    { "id": 3, "tasks": ["3.2", "3.3", "8.1"] },
    { "id": 4, "tasks": ["8.2", "8.3", "9.1"] },
    { "id": 5, "tasks": ["9.2", "10.1", "11.1"] },
    { "id": 6, "tasks": ["10.2", "11.2"] }
  ]
}
```
