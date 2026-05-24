# Requirements Document

## Introduction

AsalUsul UI Foundation replaces the generic boilerplate screens of the AsalUsul genealogy app with a premium, heritage-inspired Indonesian experience. The feature covers three screens — Splash, Login, and Home (empty state) — an extended theme system, and a set of shared, reusable UI components. All implementation uses `StyleSheet` + theme constants (no NativeWind), Reanimated 4.x entering/exiting animations, and the existing `ThemedText`, `ThemedView`, `useTheme`, and `useAuth` primitives. No new npm packages are introduced and no auth or Firebase logic is changed.

---

## Glossary

- **SplashScreen**: The full-screen branded splash component rendered in `_layout.tsx` while auth state is loading. File: `src/components/splash-screen.tsx`.
- **LoginScreen**: The authentication entry-point screen. File: `src/app/login.tsx`.
- **HomeScreen**: The main tab screen shown to authenticated users. File: `src/app/(tabs)/index.tsx`.
- **LogoHeader**: Shared component rendering the app logo, name, and optional tagline. File: `src/components/logo-header.tsx`.
- **GoogleSignInButton**: Branded pill button that triggers Google OAuth. File: `src/components/google-sign-in-button.tsx`.
- **PrimaryButton**: Reusable CTA button with `filled` and `outline` variants. File: `src/components/primary-button.tsx`.
- **HeroIllustration**: Placeholder hero graphic for the Home empty state. File: `src/components/hero-illustration.tsx`.
- **HomeHeader**: Top navigation bar for the Home screen. File: `src/components/home-header.tsx`.
- **AsalUsulColors**: Static brand color palette exported from `src/constants/theme.ts`.
- **Radii**: Border-radius token map exported from `src/constants/theme.ts`.
- **Shadows**: Shadow style token map exported from `src/constants/theme.ts`.
- **Reanimated**: `react-native-reanimated` 4.x library used for UI-thread animations.
- **FadeIn / FadeInDown / FadeOut**: Reanimated built-in `BaseAnimationBuilder` instances used as `entering`/`exiting` props on `Animated.View`.
- **GlassTabBar**: The existing `app-tabs.tsx` tab bar component — unchanged by this feature.
- **AuthProvider**: The existing `AuthProvider` from `auth-context.tsx` — unchanged by this feature.

---

## Requirements

### Requirement 1: Splash Screen

**User Story:** As a user launching the app, I want to see a branded animated splash screen, so that the app feels premium and culturally resonant while auth state is being resolved.

#### Acceptance Criteria

1. THE SplashScreen SHALL render a full-screen `View` with `backgroundColor` set to `AsalUsulColors.backgroundWarm` (`#F5F0E8`).
2. THE SplashScreen SHALL display the app logo using `expo-image` `<Image>` with `source={require('@/assets/images/asal-usul-logo.png')}`, `contentFit="contain"`, and explicit `width` and `height` of 96 pt.
3. THE SplashScreen SHALL display the app name text "AsalUsul".
4. THE SplashScreen SHALL display the tagline text "Jejak Keluarga dalam Satu Pohon".
5. THE SplashScreen SHALL display the loading text "Memuat..." at reduced opacity (0.6).
6. WHEN the SplashScreen mounts, THE SplashScreen SHALL animate the logo `Animated.View` using a `FadeInDown` entering animation with a duration of 800 ms.
7. WHEN the SplashScreen mounts, THE SplashScreen SHALL animate the app name `Animated.View` using a `FadeInDown` entering animation with a duration of 600 ms and a delay of 300 ms.
8. WHEN the SplashScreen mounts, THE SplashScreen SHALL animate the tagline `Animated.View` using a `FadeIn` entering animation with a duration of 500 ms and a delay of 450 ms.
9. WHEN the SplashScreen mounts, THE SplashScreen SHALL animate the loading text `Animated.View` using a `FadeIn` entering animation with a duration of 400 ms and a delay of 600 ms.
10. WHEN the `isReady` prop transitions to `true`, THE SplashScreen SHALL run a `FadeOut` exit animation with a duration of 400 ms and then invoke `onAnimationComplete` exactly once after the animation finishes.
11. IF the SplashScreen re-renders one or more times before the exit animation completes, THEN THE SplashScreen SHALL invoke `onAnimationComplete` exactly once in total.
12. THE SplashScreen SHALL accept an `isReady: boolean` prop that signals when auth has resolved and the exit sequence should begin, and an `onAnimationComplete: () => void` prop that is called after the exit animation finishes.

---

### Requirement 2: Login Screen

**User Story:** As an unauthenticated user, I want a welcoming, branded login screen, so that I can sign in with Google and begin using the app.

#### Acceptance Criteria

1. THE LoginScreen SHALL render a full-screen background with `backgroundColor` set to `AsalUsulColors.backgroundWarm`.
2. THE LoginScreen SHALL render a `LogoHeader` component with `showTagline={true}` as the first visible element in the scroll/layout order.
3. THE LoginScreen SHALL display the heading text "Selamat Datang" using `ThemedText type="subtitle"`.
4. THE LoginScreen SHALL display the onboarding description text "Masuk untuk melanjutkan perjalanan keluarga Anda" in `AsalUsulColors.textMuted` below the heading.
5. THE LoginScreen SHALL render a `GoogleSignInButton` component wired to the `signInWithGoogle` function from `useAuth()`.
6. WHEN `signInWithGoogle()` is called, THE LoginScreen SHALL set `isSigningIn` to `true` and pass `isLoading={true}` to `GoogleSignInButton`.
7. WHEN `signInWithGoogle()` resolves successfully and `isSigningIn` is still `true`, THE LoginScreen SHALL reset `isSigningIn` to `false`; navigation is handled automatically by `Stack.Protected` in `_layout.tsx`.
8. WHEN `signInWithGoogle()` throws an error, THE LoginScreen SHALL display the error message above the `GoogleSignInButton` in color `#C0392B`; IF the error has no message, THEN THE LoginScreen SHALL display the fallback text "Masuk gagal. Coba lagi.".
9. WHEN a new sign-in attempt begins, THE LoginScreen SHALL clear any previously displayed error message.
10. WHEN `signInWithGoogle()` does not resolve within 30 000 ms, THE LoginScreen SHALL reset `isSigningIn` to `false` and display the error message "Waktu habis. Coba lagi."; IF the promise subsequently resolves or rejects after the timeout, THEN THE LoginScreen SHALL NOT update `isSigningIn` again.
11. THE LoginScreen SHALL render footer text containing tappable links for "Syarat Layanan" and "Kebijakan Privasi" using `ThemedText type="small"` in `AsalUsulColors.textMuted`; each link SHALL open the corresponding URL in an in-app browser via `expo-web-browser` `openBrowserAsync`.
12. WHILE `isSigningIn` is `true`, THE LoginScreen SHALL prevent a second invocation of `handleSignIn` (double-tap guard).

---

### Requirement 3: Home Screen — Empty State

**User Story:** As an authenticated user with no family trees yet, I want to see an encouraging empty state on the Home screen, so that I understand what the app does and can take the first action.

#### Acceptance Criteria

1. THE HomeScreen SHALL render a `HomeHeader` component at the top of the screen.
2. THE HomeScreen SHALL render a `HeroIllustration` component below the header.
3. THE HomeScreen SHALL display the heading text "Belum ada pohon keluarga" centered on screen.
4. THE HomeScreen SHALL display the supporting description text "Mulai buat pohon keluarga Anda dan hubungkan dengan anggota keluarga lainnya" in `AsalUsulColors.textMuted` centered below the heading.
5. THE HomeScreen SHALL render a `PrimaryButton` with `variant="filled"` and `label="Buat Sekarang"`.
6. WHEN the HomeScreen mounts, THE HomeScreen SHALL animate the `HeroIllustration`, heading text, description text, and `PrimaryButton` each using a `FadeInDown` entering animation with a duration of 400 ms.
7. THE HomeScreen SHALL render the existing `GlassTabBar` (via `app-tabs.tsx`) at the bottom of the screen without modification.
8. THE HomeScreen SHALL use `AsalUsulColors.backgroundWarm` as the screen background color.
9. WHEN the "Buat Sekarang" `PrimaryButton` is pressed, THE HomeScreen SHALL invoke its `onPress` handler (placeholder — no navigation required for this feature).

---

### Requirement 4: Theme System Extension

**User Story:** As a developer building AsalUsul screens, I want a centralized brand token system, so that colors, radii, and shadows are consistent and easy to maintain.

#### Acceptance Criteria

1. THE `src/constants/theme.ts` file SHALL export an `AsalUsulColors` constant object containing at minimum the following keys: `backgroundWarm`, `backgroundCard`, `backgroundOverlay`, `primary`, `primaryLight`, `primaryMuted`, `textHeading`, `textBody`, `textMuted`, `textOnPrimary`, `goldAccent`, `borderSubtle`.
2. EVERY value in `AsalUsulColors` SHALL be a valid 6-digit hexadecimal color string matching the pattern `#[0-9A-Fa-f]{6}`.
3. THE `src/constants/theme.ts` file SHALL export a `Radii` constant object containing the keys `sm`, `md`, `lg`, and `pill` with positive integer values.
4. EVERY value in `Radii` SHALL be a positive integer greater than zero.
5. THE `src/constants/theme.ts` file SHALL export a `Shadows` constant object containing at minimum the keys `card` and `button`.
6. EVERY entry in `Shadows` SHALL contain: `shadowColor` (string), `shadowOffset` (object with non-negative number `width` and `height`), `shadowOpacity` (number in range 0.0–1.0), `shadowRadius` (non-negative number), and `elevation` (non-negative integer).
7. THE `src/constants/theme.ts` file SHALL export the type alias `AsalUsulColor` as `keyof typeof AsalUsulColors`.
8. THE `src/constants/theme.ts` file SHALL export the type alias `RadiusToken` as `keyof typeof Radii`.
9. THE `src/constants/theme.ts` file SHALL export the type alias `ShadowToken` as `keyof typeof Shadows`.
10. THE `src/constants/theme.ts` file SHALL continue to export `Colors`, `ThemeColor`, `Fonts`, `Spacing`, `BottomTabInset`, and `MaxContentWidth` with the same names, types, and values as before this feature.

---

### Requirement 5: Shared Components

**User Story:** As a developer, I want modular, typed, and accessible shared UI components, so that screens are built consistently and components can be reused across the app.

#### Acceptance Criteria

**LogoHeader** (`src/components/logo-header.tsx`)

1. THE LogoHeader SHALL render an `expo-image` `<Image>` with `source={require('@/assets/images/asal-usul-logo.png')}` and `contentFit="contain"`.
2. THE LogoHeader SHALL always render the app name text "AsalUsul" using `ThemedText type="title"` regardless of prop values.
3. WHEN `showTagline` is `true`, THE LogoHeader SHALL render the tagline text "Jejak Keluarga dalam Satu Pohon".
4. WHEN `showTagline` is `false` or not provided, THE LogoHeader SHALL NOT render the tagline text.
5. WHERE a `logoSize` prop is provided, THE LogoHeader SHALL apply that value as both the `width` and `height` of the logo `Image`; otherwise THE LogoHeader SHALL default to a size of 96.
6. WHERE a `style` prop is provided, THE LogoHeader SHALL apply it to the outer container `View`.

**GoogleSignInButton** (`src/components/google-sign-in-button.tsx`)

7. THE GoogleSignInButton SHALL render with `backgroundColor: AsalUsulColors.primary` and `borderRadius: Radii.pill`.
8. WHEN `isLoading` is `false` or not provided, THE GoogleSignInButton SHALL render a Google icon (`AntDesign "google"`, size 20, color white) and the label text.
9. WHEN `isLoading` is `true`, THE GoogleSignInButton SHALL render an `ActivityIndicator` and SHALL NOT render the Google icon or label text.
10. THE GoogleSignInButton SHALL apply `Shadows.button` shadow styles.
11. THE GoogleSignInButton SHALL have `accessibilityRole="button"` and an `accessibilityLabel` equal to the resolved label text (the `label` prop value if provided, otherwise "Masuk dengan Google").
12. WHEN `disabled` is `true` OR `isLoading` is `true`, THE GoogleSignInButton SHALL set `accessibilityState.disabled` to `true`.
13. WHEN `disabled` is `true` OR `isLoading` is `true`, THE GoogleSignInButton SHALL set `accessibilityState.busy` to mirror `isLoading`.
14. IF `disabled` is `false` AND `isLoading` is `false`, THEN THE GoogleSignInButton SHALL set `accessibilityState.disabled` to `false`.
15. IF `disabled` is `true` OR `isLoading` is `true`, THEN THE GoogleSignInButton SHALL NOT invoke `onPress` when tapped.
16. WHERE a `label` prop is provided, THE GoogleSignInButton SHALL display that text; otherwise THE GoogleSignInButton SHALL display the default label "Masuk dengan Google".

**PrimaryButton** (`src/components/primary-button.tsx`)

17. WHEN `variant` is `"filled"` or not provided, THE PrimaryButton SHALL render with `backgroundColor: AsalUsulColors.primary`, white label text, and `Shadows.button` applied.
18. WHEN `variant` is `"outline"`, THE PrimaryButton SHALL render with a transparent background, `borderColor: AsalUsulColors.primary`, `AsalUsulColors.primary` label text, and no shadow.
19. THE PrimaryButton SHALL apply `borderRadius: Radii.pill`, `paddingVertical: 16`, and `minHeight: 52`.
20. WHEN `isLoading` is `false` or not provided, THE PrimaryButton SHALL render the `label` text.
21. WHEN `isLoading` is `true`, THE PrimaryButton SHALL render an `ActivityIndicator` (white for `filled` variant, `AsalUsulColors.primary` for `outline` variant) in place of the label text.
22. IF `disabled` is `true` OR `isLoading` is `true`, THEN THE PrimaryButton SHALL apply `opacity: 0.5` and SHALL NOT invoke `onPress` when tapped.
23. THE PrimaryButton SHALL accept a non-empty `label` string prop and always render that exact text when `isLoading` is `false`.
24. WHERE a `style` prop is provided, THE PrimaryButton SHALL apply it to the outer `Pressable` container.

**HeroIllustration** (`src/components/hero-illustration.tsx`)

25. THE HeroIllustration SHALL render a rounded rectangle container with `backgroundColor: AsalUsulColors.backgroundCard`, `borderRadius: Radii.lg`, `borderWidth: 1`, and `borderColor: AsalUsulColors.borderSubtle`.
26. THE HeroIllustration SHALL set its container `height` to `(3 / 4) × width` to maintain a 4:3 aspect ratio.
27. THE HeroIllustration SHALL render a centered `Ionicons "git-network-outline"` icon with size 64 and color `AsalUsulColors.primaryMuted`.
28. WHERE a `size` prop is provided, THE HeroIllustration SHALL use that value as the container width; otherwise THE HeroIllustration SHALL default to a width of 240.
29. WHERE a `style` prop is provided, THE HeroIllustration SHALL apply it to the outer container.

**HomeHeader** (`src/components/home-header.tsx`)

30. THE HomeHeader SHALL render the text "AsalUsul" left-aligned using `ThemedText type="subtitle"` with color `AsalUsulColors.primary`.
31. WHEN an `actionIcon` prop is provided, THE HomeHeader SHALL render an `Ionicons` icon button on the right side with `accessibilityRole="button"`.
32. WHEN `onActionPress` is provided alongside `actionIcon`, THE HomeHeader SHALL invoke `onActionPress` when the icon button is tapped.
33. WHEN `actionIcon` is not provided, THE HomeHeader SHALL NOT render a right-side icon button.

---

### Requirement 6: TypeScript Types and Accessibility

**User Story:** As a developer, I want all new components to be fully typed and accessible, so that the codebase is maintainable and the app is usable by people with assistive technologies.

#### Acceptance Criteria

1. THE LogoHeader, GoogleSignInButton, PrimaryButton, HeroIllustration, and HomeHeader components SHALL each export a TypeScript `interface` or `type` for their props.
2. THE LogoHeader, GoogleSignInButton, PrimaryButton, HeroIllustration, and HomeHeader components SHALL compile without TypeScript errors under the project's existing `tsconfig.json`.
3. THE GoogleSignInButton and PrimaryButton SHALL have `accessibilityRole="button"` on their root interactive element.
4. THE GoogleSignInButton SHALL have an `accessibilityLabel` equal to the resolved label text: the `label` prop value if provided, otherwise the default "Masuk dengan Google".
5. WHEN `isLoading` is `true` on GoogleSignInButton or PrimaryButton, THE component SHALL set `accessibilityState.busy={true}`.
6. IF `disabled` is `true` or `isLoading` is `true` on GoogleSignInButton or PrimaryButton, THEN THE component SHALL set `accessibilityState.disabled={true}`.
7. THE SplashScreen, LoginScreen, and HomeScreen SHALL use `StyleSheet.create` for all style definitions (no inline style objects).
8. THE SplashScreen, LoginScreen, and HomeScreen SHALL NOT import or use NativeWind utility classes.
9. THE SplashScreen, LoginScreen, and HomeScreen SHALL NOT introduce any new npm package dependencies beyond those already listed in `package.json`.
