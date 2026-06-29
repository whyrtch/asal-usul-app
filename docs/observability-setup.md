# Observability Setup (Analytics + Crashlytics)

> Phase 1 — 4.4. How to activate real analytics & crash reporting on top of the
> provider abstraction already wired into the app.

## What's already in the codebase

- A provider-based facade at `src/services/analytics/`:
  - `logEvent(name, params)`, `recordError(error, context)`, `setAnalyticsUserId(uid)`, `setAnalyticsEnabled(enabled)`.
  - Default provider is **no-op** (safe on every platform, zero native deps, never throws).
- The key funnel is already instrumented (no-op until a provider is set):
  | Event | Where |
  |-------|-------|
  | `sign_in` / `sign_out` | `src/context/auth-context.tsx` |
  | `tree_created` / `tree_deleted` | `src/store/useFamilyTreeStore.ts` |
  | `member_added` (`{ hasPhoto }`) / `member_deleted` | `src/store/useMemberStore.ts` |
  | `photo_added` | `src/hooks/usePhotoUpload.ts` |
  | `recordError(...)` | store catch blocks, photo upload, sign-in |
- `setAnalyticsUserId` is called automatically on auth state change.

To see events during development without any backend, set the console provider once at startup:

```ts
import { setAnalyticsProvider, ConsoleAnalyticsProvider } from '@/services/analytics';
if (__DEV__) setAnalyticsProvider(ConsoleAnalyticsProvider);
```

## Why a native provider is required

This app uses the **Firebase JS SDK**. In React Native:
- `firebase/analytics` is **web-only** (no-op/unsupported on native).
- **Crashlytics is not available** in the JS SDK at all.

Production Analytics + Crashlytics need native modules via **`@react-native-firebase`**, which requires a **development build** (not Expo Go).

## Activation steps

### 1. Install native Firebase modules

```bash
npx expo install @react-native-firebase/app @react-native-firebase/analytics @react-native-firebase/crashlytics
```

### 2. Add config plugins (app.json)

```jsonc
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/crashlytics"
      // ...existing plugins
    ],
    "ios": { "useFrameworks": "static" }
  }
}
```

`google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are already present at the project root.

### 3. Create the Firebase provider

Create `src/services/analytics/firebaseProvider.ts`:

```ts
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import type { AnalyticsProvider } from './index';

export const FirebaseAnalyticsProvider: AnalyticsProvider = {
  logEvent: (name, params) => {
    void analytics().logEvent(name, params as Record<string, object> | undefined);
  },
  setUserId: (uid) => {
    void analytics().setUserId(uid);
    if (uid) void crashlytics().setUserId(uid);
  },
  recordError: (error, context) => {
    if (context) crashlytics().log(JSON.stringify(context));
    crashlytics().recordError(
      error instanceof Error ? error : new Error(String(error)),
    );
  },
  setEnabled: (enabled) => {
    void analytics().setAnalyticsCollectionEnabled(enabled);
    void crashlytics().setCrashlyticsCollectionEnabled(enabled);
  },
};
```

### 4. Wire it once at app startup

In `src/app/_layout.tsx` (top-level, before rendering):

```ts
import { setAnalyticsProvider } from '@/services/analytics';
import { FirebaseAnalyticsProvider } from '@/services/analytics/firebaseProvider';

setAnalyticsProvider(FirebaseAnalyticsProvider);
```

### 5. Rebuild the dev client

```bash
npx expo run:ios
npx expo run:android
```

## Notes

- Because every call site uses the facade, **no business code changes** are needed to activate — only steps 1–4.
- Keep `setAnalyticsEnabled` behind a user consent toggle if you add a privacy setting (recommended before monetization / store review).
- Consider adding a Jest mock for `@react-native-firebase/*` if you later import the provider in tested modules.
