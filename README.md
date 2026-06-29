# AsalUsul — Pohon Keluarga Digital

Aplikasi pohon keluarga modern untuk keluarga Indonesia. Dokumentasikan sejarah, silsilah, dan warisan keluarga dalam satu pohon digital yang indah.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 56 + Expo Router v56 |
| Language | TypeScript |
| Auth | Firebase Authentication + Google Sign-In |
| Navigation | Expo Router (tabs + modal) + Reanimated |
| UI | shadcn/ui principles adapted for RN, Reanimated 4.x |
| State | Zustand (stores) + React Context (auth) |
| Backend | Firebase Firestore + Firebase Storage |
| Testing | Jest + React Testing Library + fast-check (PBT) |

## Fitur

- **Pohon Keluarga Interaktif** — buat, lihat, dan edit pohon keluarga dengan visual canvas
- **Auth Google** — login cepat dengan akun Google
- **Soft Auth Gate** — home screen selalu terlihat, login hanya saat perlu (create tree)
- **UI Primitives** — shadcn-style component system: Button, Card, Sheet, Dialog, Badge, Avatar, dll
- **Premium Design System** — warm heritage color palette dengan terracotta accent
- **Contoh Pohon Keluarga** — lihat contoh pohon keluarga tokoh publik (Jokowi, Prabowo) di fitur "Jelajahi"
- **Berbagi & Kolaborasi** (flag-gated) — undang anggota keluarga sebagai editor/viewer
- **Mode Luring** (coming soon) — akses pohon keluarga tanpa internet
- **Monetisasi** (coming soon) — freemium model dengan batasan jumlah pohon

## Project Structure

```
src/
├── app/                  # Expo Router pages
│   ├── _layout.tsx       # Root layout: AuthProvider + soft auth gate
│   ├── login.tsx         # Login screen (Google Sign-In)
│   ├── family/[id].tsx   # Family tree detail screen
│   ├── invitations.tsx   # Sharing invitations (flag-gated)
│   └── (tabs)/
│       ├── _layout.tsx   # Tab layout
│       ├── index.tsx     # Home screen (daftar pohon keluarga)
│       └── setting.tsx   # Setting screen (akun, tentang app)
├── components/
│   ├── ui/               # shadcn-style primitives (Button, Card, Sheet, dll)
│   ├── family/           # Family tree components
│   └── member/           # Member components
├── constants/
│   └── theme.ts          # Design system: colors, spacing, typography, shadows
├── context/
│   └── auth-context.tsx  # Auth state management
├── store/                # Zustand stores
├── repositories/         # Firestore data access layer
├── services/             # Firebase, analytics, entitlements
├── hooks/                # Custom hooks (photo upload, dll)
└── types/                # TypeScript types & interfaces
```

## Theme & Color System

AsalUsul menggunakan palette warna **jewel-tone** yang hangat dan premium:

| Role | Color | Hex |
|------|-------|-----|
| Primary | Rich Teal-Emerald | `#0D5E48` |
| Primary Light | Bright Emerald | `#1A8C6E` |
| Accent | Warm Terracotta | `#D4634A` |
| Gold | Warm Gold | `#D4A025` |
| Background | Warm Beige | `#F7F2EA` |
| Card | Cream Off-white | `#FFFCF7` |
| Text Body | Dark Charcoal | `#2E2E2E` |

Dokumentasi lengkap: [docs/theme-color-system.md](docs/theme-color-system.md)

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/whyrtch/asal-usul-app.git
cd asal-usul-app
yarn install
```

### 2. Set up Firebase

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** → Sign-in method → **Google**
3. Enable **Cloud Firestore**
4. Enable **Storage** (for photo uploads)

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env` with your Firebase project values:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- etc.

### 4. Run development build

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios

# Expo Go (limited native modules)
npx expo start
```

> ⚠️ Google Sign-In requires a development build — does not work in Expo Go.

### 5. Feature Flags

Setel di `.env`:

```env
EXPO_PUBLIC_DEV_SEED=false        # Tampilkan tombol "Muat Contoh" (Jokowi/Prabowo)
EXPO_PUBLIC_ENABLE_PHOTO_UPLOAD=false  # Aktifkan upload foto anggota
```

## Running Tests

```bash
yarn test
```

Test suite mencakup:
- 48 test suites
- 437+ unit & property-based tests
- Coverage: layout, auth, stores, repositories, components, utils

## Customizing

| What | Where |
|------|-------|
| Theme colors | `src/constants/theme.ts` |
| UI primitives | `src/components/ui/` |
| Tab items | `src/app/(tabs)/_layout.tsx` |
| Feature flags | `.env` + `src/constants/features.ts` |

## Dependencies

### Core
- `expo ~56.0.4`
- `expo-router ~56.2.6`
- `firebase ^12.13.0`
- `react-native-reanimated 4.3.1`

### UI
- `expo-image ~56.0.9`
- `expo-image-picker ~56.0.18`
- `@expo/vector-icons ^15.0.2`
- `react-native-safe-area-context ~5.7.0`

### State & Data
- `zustand ^5.0.0`

### Testing
- `jest ~29.7.0`
- `@testing-library/react-native ^13.3.3`
- `fast-check ^4.8.0`

## License

MIT
