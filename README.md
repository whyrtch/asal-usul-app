# Expo Firebase Boilerplate

A production-ready boilerplate for Expo v56 apps with Firebase Authentication, Google Sign-In, protected routing, and a glassmorphism tab bar. Use this as a starting point for any new Expo project.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 56 + Expo Router v56 |
| Language | TypeScript |
| Auth | Firebase Authentication + Google Sign-In |
| Navigation | Expo Router `Stack.Protected` + `expo-router/ui` |
| UI | React Native + Reanimated + expo-blur |
| State | React Context (AuthContext) |
| Storage | AsyncStorage (Firebase session persistence) |
| Testing | Jest + React Testing Library + fast-check (PBT) |

## Features

- **Google Sign-In** via `@react-native-google-signin/google-signin`
- **Firebase Auth** with AsyncStorage persistence (stays logged in after app restart)
- **Protected routing** — unauthenticated users redirected to login, authenticated users redirected to home
- **Animated splash screen** with Reanimated keyframe animation
- **Glassmorphism tab bar** — floating glass bottom navigation with blur effect, spring animations, and dark/light mode support
- **Auth timeout** — 10s timeout prevents infinite loading state
- **Full test suite** — unit tests + property-based tests for all correctness properties

## Project Structure

```
src/
├── app/
│   ├── _layout.tsx          # Root layout: AuthProvider + Stack.Protected
│   ├── login.tsx            # Login screen (Google Sign-In)
│   └── (tabs)/
│       ├── _layout.tsx      # Tab layout → delegates to AppTabs
│       ├── index.tsx        # Home screen (user profile)
│       └── setting.tsx      # Setting screen (logout)
├── components/
│   ├── app-tabs.tsx         # Glassmorphism tab bar (native)
│   └── app-tabs.web.tsx     # Tab bar (web)
├── context/
│   └── auth-context.tsx     # AuthContext + AuthProvider + useAuth
├── lib/
│   └── firebase.ts          # Firebase singleton initialization
└── constants/
    └── theme.ts             # Colors, spacing, fonts
```

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/whyrtch/auth-fb-boilerplate.git my-app
cd my-app
yarn install
```

### 2. Set up Firebase

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** → Sign-in method → **Google**
3. Add an Android app with your package name
4. Download `google-services.json` → place at project root
5. For iOS: download `GoogleService-Info.plist` → place at project root

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env` with your Firebase project values:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID=
```

### 4. Update app config

In `app.json`, update:
- `expo.name` — your app name
- `expo.slug` — your app slug
- `expo.android.package` — your Android package name (e.g. `com.yourcompany.appname`)
- `expo.scheme` — your deep link scheme

### 5. Run development build

> ⚠️ `@react-native-google-signin/google-signin` requires a development build — it does not work in Expo Go.

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

### 6. Register SHA-1 fingerprint (Android)

Get your debug SHA-1:
```bash
keytool -list -v \
  -keystore android/app/debug.keystore \
  -alias androiddebugkey \
  -storepass android -keypass android
```

Add the SHA-1 to Firebase Console → Project Settings → Your apps → Android app → SHA certificate fingerprints.

Then download the updated `google-services.json` and replace the file at project root.

## Customizing for Your Project

| What to change | Where |
|----------------|-------|
| App name & package | `app.json` |
| Firebase config | `.env` |
| Tab items (add/remove tabs) | `src/components/app-tabs.tsx` → `TABS` array |
| Home screen content | `src/app/(tabs)/index.tsx` |
| Setting screen content | `src/app/(tabs)/setting.tsx` |
| Theme colors | `src/constants/theme.ts` |
| Auth logic | `src/context/auth-context.tsx` |

## Running Tests

```bash
yarn test
```

Covers:
- Firebase singleton initialization (Property 4)
- Auth state listener cleanup (Property 1)
- Auth-based routing (Property 2)
- Logout always clears user state (Property 3)
- idToken forwarding to Firebase credential (Property 6)
- Splash screen hiding (Property 7)
- User data display with fallback (Property 5)

## Dependencies

```bash
# Core
expo ~56.0.4
expo-router ~56.2.6
firebase ^12.13.0
@react-native-google-signin/google-signin ^16.1.2
@react-native-async-storage/async-storage 2.2.0

# UI
expo-blur ~56.0.3
expo-image ~56.0.9
expo-splash-screen ~56.0.10
react-native-reanimated 4.3.1
react-native-safe-area-context ~5.7.0
@expo/vector-icons ^15.0.2

# Testing
jest ~29.7.0
jest-expo ~56.0.4
@testing-library/react-native ^13.3.3
fast-check ^4.8.0
```

## License

MIT
