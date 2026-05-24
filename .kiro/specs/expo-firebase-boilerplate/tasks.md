# Implementation Plan: Expo Firebase Boilerplate

## Overview

Implementasi boilerplate Expo v56 dengan Firebase Authentication + Google Sign-In secara bertahap. Setiap task membangun di atas task sebelumnya, dimulai dari fondasi (dependencies, env, Firebase init), lalu AuthContext, kemudian navigasi terproteksi, dan diakhiri dengan screen-screen UI. Semua kode ditulis dalam TypeScript.

> **Catatan penting sebelum memulai:** `@react-native-google-signin/google-signin` tidak dapat digunakan di Expo Go — wajib menggunakan development build. Baca docs Expo v56 di https://docs.expo.dev/versions/v56.0.0/ sebelum menulis kode apapun.

---

## Tasks

- [x] 1. Install dependencies dan konfigurasi environment
  - [x] 1.1 Install package dependencies yang dibutuhkan
    - Jalankan: `npx expo install firebase @react-native-async-storage/async-storage @react-native-google-signin/google-signin`
    - Verifikasi semua package masuk ke `package.json` dengan versi yang kompatibel dengan Expo SDK 56
    - _Requirements: 6.1, 6.4, 2.2, 2.9_

  - [x] 1.2 Buat file `.env` dan `.env.example`
    - Buat `.env.example` dengan enam kunci: `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID` — semua dengan nilai placeholder
    - Buat `.env` (tidak di-commit) dengan nilai aktual dari Firebase Console
    - Verifikasi `.env` sudah ada di `.gitignore`
    - _Requirements: 6.4, 6.5_

  - [x] 1.3 Update `app.json` dengan plugin Google Sign-In dan file konfigurasi native
    - Tambahkan `@react-native-google-signin/google-signin` ke array `plugins` di `app.json`
    - Tambahkan `android.googleServicesFile` yang menunjuk ke `./google-services.json`
    - Tambahkan `ios.googleServicesFile` yang menunjuk ke `./GoogleService-Info.plist`
    - _Requirements: 2.9, 6.1_

- [x] 2. Implementasi Firebase initialization (`src/lib/firebase.ts`)
  - [x] 2.1 Buat `src/lib/firebase.ts` dengan singleton pattern
    - Baca enam env vars dengan prefix `EXPO_PUBLIC_` untuk membangun `FirebaseConfig`
    - Gunakan pola `getApps().length === 0 ? initializeApp(config) : getApp()` untuk memastikan singleton
    - Inisialisasi auth menggunakan `initializeAuth` dengan `getReactNativePersistence(AsyncStorage)` dari `firebase/auth`
    - Export `auth` instance
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 2.2 Tulis property test untuk Firebase singleton (Property 4)
    - **Property 4: Firebase singleton initialization**
    - **Validates: Requirements 6.2**
    - Gunakan `fast-check` dengan generator jumlah panggilan inisialisasi (1 hingga N)
    - Mock `initializeApp` dan `getApps` dari `firebase/app`
    - Verifikasi `getApps().length` selalu 1 setelah satu atau lebih panggilan ke modul inisialisasi
    - Tag komentar: `// Feature: expo-firebase-boilerplate, Property 4: Firebase singleton initialization`

  - [x] 2.3 Tulis unit test untuk `src/lib/firebase.ts`
    - Test: Firebase diinisialisasi dengan 6 konfigurasi yang benar dari env vars
    - Test: Panggilan kedua mengembalikan instance yang sama (tidak membuat instance baru)
    - Test: `auth` instance yang diekspor valid dan menggunakan `AsyncStorage` persistence
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 3. Implementasi AuthContext (`src/context/auth-context.tsx`)
  - [x] 3.1 Buat interface dan struktur dasar `AuthContext`
    - Definisikan interface `AuthUser` (`uid`, `email`, `displayName`, `photoURL`)
    - Definisikan interface `AuthContextValue` (`user`, `loading`, `signInWithGoogle`, `signOut`)
    - Buat `AuthContext` dengan `createContext` dan nilai default
    - _Requirements: 3.1, 3.5_

  - [x] 3.2 Implementasi `AuthProvider` dengan `onAuthStateChanged` listener
    - Daftarkan `onAuthStateChanged` listener saat mount, simpan unsubscribe function
    - Set `user` dan `loading: false` saat state auth resolved
    - Batalkan listener (unsubscribe) saat unmount di cleanup function `useEffect`
    - Implementasi timeout 10 detik: jika `loading` masih `true` setelah 10 detik, paksa `loading: false` dan `user: null`
    - _Requirements: 3.1, 3.4, 3.5, 3.6_

  - [x] 3.3 Tulis property test untuk auth state listener cleanup (Property 1)
    - **Property 1: Auth state listener cleanup**
    - **Validates: Requirements 3.1**
    - Gunakan `fast-check` dengan generator mock `onAuthStateChanged` yang dapat di-unsubscribe
    - Render `AuthProvider` lalu unmount, verifikasi unsubscribe function dipanggil tepat sekali
    - Tag komentar: `// Feature: expo-firebase-boilerplate, Property 1: Auth state listener cleanup`

  - [x] 3.4 Implementasi `signInWithGoogle` di `AuthContext`
    - Panggil `GoogleSignin.configure({ webClientId })` sebelum sign-in
    - Panggil `GoogleSignin.hasPlayServices()` lalu `GoogleSignin.signIn()`
    - Handle response types: `success` → ekstrak `idToken`, `cancelled` → return tanpa error
    - Jika `idToken` kosong/null → throw error "Authentication failed. Please try again."
    - Panggil `signInWithCredential(auth, GoogleAuthProvider.credential(idToken))`
    - Handle error codes: `IN_PROGRESS`, `PLAY_SERVICES_NOT_AVAILABLE`, network error, Firebase auth errors
    - Implementasi timeout 30 detik untuk reset `isSigningIn`
    - _Requirements: 2.2, 2.3, 2.4, 2.6, 2.7, 2.8, 2.9_

  - [x] 3.5 Tulis property test untuk idToken forwarding ke Firebase credential (Property 6)
    - **Property 6: idToken forwarded to Firebase credential**
    - **Validates: Requirements 2.3**
    - Gunakan `fast-check` dengan generator berbagai non-empty idToken string
    - Mock `GoogleSignin.signIn` untuk mengembalikan `{ type: 'success', data: { idToken } }`
    - Mock `signInWithCredential` dan `GoogleAuthProvider.credential`
    - Verifikasi `signInWithCredential` selalu dipanggil dengan credential yang dibuat dari idToken yang sama
    - Tag komentar: `// Feature: expo-firebase-boilerplate, Property 6: idToken forwarded to Firebase credential`

  - [x] 3.6 Implementasi `signOut` di `AuthContext`
    - Panggil `GoogleSignin.signOut()` — jika gagal, log error dan lanjutkan
    - Panggil Firebase `signOut(auth)` — jika gagal, tampilkan alert dengan pesan error
    - Dalam semua kasus (termasuk error), set `user: null` untuk memastikan sesi lokal dihapus
    - _Requirements: 5.2, 5.3, 5.5_

  - [x] 3.7 Tulis property test untuk logout selalu membersihkan user state (Property 3)
    - **Property 3: Logout always clears user state**
    - **Validates: Requirements 5.3, 5.5**
    - Gunakan `fast-check` dengan generator berbagai `user` object valid dan kombinasi error (throw/resolve) dari Google/Firebase signOut
    - Verifikasi setelah `signOut()` dipanggil, `user` selalu `null` terlepas dari error yang terjadi
    - Tag komentar: `// Feature: expo-firebase-boilerplate, Property 3: Logout always clears user state`

  - [x] 3.8 Tulis unit test untuk `AuthContext`
    - Test: `onAuthStateChanged` listener didaftarkan saat mount
    - Test: Listener dibatalkan saat unmount
    - Test: `loading` berubah ke `false` setelah state auth resolved
    - Test: Timeout 10 detik memaksa `loading: false` dan `user: null`
    - Test: `signInWithGoogle` memanggil `GoogleSignin.configure`, `hasPlayServices`, `signIn`, dan `signInWithCredential` secara berurutan
    - Test: `signOut` memanggil `GoogleSignin.signOut` lalu Firebase `signOut`
    - Test: Error saat logout tetap mengeset `user: null`
    - _Requirements: 2.2, 2.3, 2.8, 2.9, 3.1, 5.2, 5.3, 5.5_

  - [x] 3.9 Buat hook `useAuth`
    - Implementasi `useAuth()` yang membaca dari `AuthContext`
    - Throw error jika digunakan di luar `AuthProvider`
    - Export `AuthProvider` dan `useAuth` dari `src/context/auth-context.tsx`
    - _Requirements: 3.1_

- [x] 4. Checkpoint — Verifikasi fondasi
  - Pastikan semua test untuk task 2 dan 3 lulus. Tanyakan kepada user jika ada pertanyaan sebelum melanjutkan.

- [x] 5. Implementasi Root Layout dengan `Stack.Protected` (`src/app/_layout.tsx`)
  - [x] 5.1 Refactor `src/app/_layout.tsx` untuk mengintegrasikan `AuthProvider` dan `Stack.Protected`
    - Bungkus seluruh layout dengan `AuthProvider`
    - Gunakan `useAuth()` untuk mendapatkan `user` dan `loading`
    - Implementasi `Stack.Protected` sesuai Expo Router v56:
      - `<Stack.Protected guard={!isLoggedIn}>` → `<Stack.Screen name="login" />`
      - `<Stack.Protected guard={isLoggedIn}>` → `<Stack.Screen name="(tabs)" />`
    - Pertahankan `ThemeProvider` yang sudah ada
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 5.2 Implementasi kontrol splash screen di root layout
    - Panggil `SplashScreen.preventAutoHideAsync()` di luar komponen (module level) atau di `_layout.tsx`
    - Tambahkan `useEffect` yang memantau `loading === false` → panggil `SplashScreen.hideAsync()` dalam blok `try/finally`
    - Pastikan `SplashScreen.hideAsync()` selalu dipanggil meskipun terjadi error
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 5.3 Tulis property test untuk splash screen hiding (Property 7)
    - **Property 7: Splash screen hides when loading completes**
    - **Validates: Requirements 1.2, 1.3**
    - Gunakan `fast-check` dengan generator berbagai kombinasi outcome loading (success/error) untuk fonts, assets, dan Firebase auth
    - Mock `SplashScreen.hideAsync` dan `SplashScreen.preventAutoHideAsync`
    - Verifikasi `SplashScreen.hideAsync` dipanggil tepat sekali setelah `loading` menjadi `false`
    - Tag komentar: `// Feature: expo-firebase-boilerplate, Property 7: Splash screen hides when loading completes`

  - [x] 5.4 Tulis property test untuk auth-based routing (Property 2)
    - **Property 2: Auth-based routing**
    - **Validates: Requirements 3.2, 3.3**
    - Gunakan `fast-check` dengan generator berbagai kombinasi `user` (null atau valid object) dan route name (login, index, setting)
    - Mock `Stack.Protected` dan verifikasi guard values
    - Verifikasi: `user=null` → guard untuk login screen `true`, guard untuk tabs `false`; `user!=null` → guard untuk login screen `false`, guard untuk tabs `true`
    - Tag komentar: `// Feature: expo-firebase-boilerplate, Property 2: Auth-based routing`

  - [x] 5.5 Tulis unit test untuk `src/app/_layout.tsx`
    - Test: `Stack.Protected` dengan `guard={false}` tidak merender screen yang dilindungi
    - Test: `Stack.Protected` dengan `guard={true}` merender screen yang dilindungi
    - Test: `SplashScreen.hideAsync` dipanggil saat `loading === false`
    - Test: `SplashScreen.hideAsync` dipanggil dalam `finally` block (dipanggil meski ada error)
    - _Requirements: 1.2, 1.3, 3.2, 3.3_

- [x] 6. Implementasi AuthScreen (`src/app/login.tsx`)
  - [x] 6.1 Buat `src/app/login.tsx` dengan tombol Google Sign-In
    - Tampilkan tombol "Sign in with Google" menggunakan `GoogleSigninButton` dari `@react-native-google-signin/google-signin` atau tombol custom
    - Gunakan `useAuth()` untuk mengakses `signInWithGoogle`
    - Kelola state lokal `isSigningIn` dan `errorMessage`
    - Nonaktifkan tombol saat `isSigningIn === true`
    - Tampilkan `ActivityIndicator` saat `isSigningIn === true`
    - Tampilkan `errorMessage` jika sign-in gagal (tidak tampilkan jika user membatalkan)
    - _Requirements: 2.1, 2.4, 2.6, 2.7, 2.8_

  - [x] 6.2 Tulis unit test untuk `src/app/login.tsx`
    - Test: Tombol dinonaktifkan saat `isSigningIn === true`
    - Test: `ActivityIndicator` tampil saat `isSigningIn === true`
    - Test: Error message ditampilkan saat sign-in gagal
    - Test: Tidak ada error message saat user membatalkan (response type `cancelled`)
    - _Requirements: 2.1, 2.6, 2.7, 2.8_

- [x] 7. Implementasi Tab Layout dengan NativeTabs (`src/app/(tabs)/_layout.tsx`)
  - [x] 7.1 Buat direktori `src/app/(tabs)/` dan file `_layout.tsx`
    - Import `NativeTabs` dari `expo-router/unstable-native-tabs`
    - Definisikan dua trigger: `name="index"` (Home) dan `name="setting"` (Setting)
    - Gunakan `NativeTabs.Trigger.Icon` dengan prop `sf` untuk iOS SF Symbol dan `md` untuk Android Material icon:
      - Home: `sf="house"` / `md="home"`
      - Setting: `sf="gearshape"` / `md="settings"`
    - Gunakan `NativeTabs.Trigger.Label` untuk label teks setiap tab
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 7.2 Update `src/components/app-tabs.tsx` untuk tab Home dan Setting
    - Ganti trigger `explore` dengan trigger `setting`
    - Update icon untuk tab Setting: `sf="gearshape"` / `md="settings"` (atau gunakan `src` dengan `renderingMode="template"` jika menggunakan custom image)
    - Update label dari "Explore" menjadi "Setting"
    - Pertahankan styling dan theming yang sudah ada
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x] 7.3 Update `src/components/app-tabs.web.tsx` untuk tab Home dan Setting
    - Ganti `TabTrigger` untuk "explore" dengan "setting" yang mengarah ke `/setting`
    - Update label dari "Explore" menjadi "Setting"
    - _Requirements: 4.2, 4.4, 4.5_

- [x] 8. Implementasi HomeScreen (`src/app/(tabs)/index.tsx`)
  - [x] 8.1 Refactor `src/app/(tabs)/index.tsx` untuk menampilkan data user
    - Gunakan `useAuth()` untuk mendapatkan `user`
    - Tampilkan `user.displayName` jika non-null, atau `user.email` sebagai fallback
    - Tampilkan foto profil menggunakan `expo-image` (`Image` component) dari `user.photoURL` jika non-null
    - Tampilkan avatar placeholder (misalnya `View` dengan inisial atau ikon default) jika `user.photoURL` null
    - _Requirements: 4.1, 4.4, 4.6, 4.7_

  - [x] 8.2 Tulis property test untuk user data display dengan fallback (Property 5)
    - **Property 5: User data display with fallback**
    - **Validates: Requirements 4.6, 4.7**
    - Gunakan `fast-check` dengan generator `user` object dengan kombinasi `displayName` (string/null), `email` (string/null), `photoURL` (string/null)
    - Render `HomeScreen` dengan berbagai kombinasi user data
    - Verifikasi: teks yang dirender adalah `displayName` jika non-null, atau `email` sebagai fallback
    - Verifikasi: komponen `Image` dirender saat `photoURL` non-null; placeholder dirender saat `photoURL` null
    - Tag komentar: `// Feature: expo-firebase-boilerplate, Property 5: User data display with fallback`

  - [x] 8.3 Tulis unit test untuk `src/app/(tabs)/index.tsx`
    - Test: Menampilkan `displayName` jika tersedia
    - Test: Menampilkan `email` sebagai fallback jika `displayName` null
    - Test: Menampilkan komponen image saat `photoURL` non-null
    - Test: Menampilkan avatar placeholder saat `photoURL` null
    - _Requirements: 4.6, 4.7_

- [x] 9. Implementasi SettingScreen (`src/app/(tabs)/setting.tsx`)
  - [x] 9.1 Buat `src/app/(tabs)/setting.tsx` dengan tombol Logout
    - Gunakan `useAuth()` untuk mengakses `signOut`
    - Tampilkan tombol "Logout"
    - Kelola state lokal `isSigningOut`
    - Nonaktifkan tombol saat `isSigningOut === true`
    - Tampilkan `ActivityIndicator` saat `isSigningOut === true`
    - Panggil `signOut()` saat tombol ditekan, set `isSigningOut` sebelum dan sesudah
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 9.2 Tulis unit test untuk `src/app/(tabs)/setting.tsx`
    - Test: Tombol "Logout" tampil dan dapat ditekan
    - Test: Tombol dinonaktifkan saat `isSigningOut === true`
    - Test: `ActivityIndicator` tampil saat `isSigningOut === true`
    - Test: `signOut()` dari `AuthContext` dipanggil saat tombol ditekan
    - _Requirements: 5.1, 5.2, 5.6_

- [x] 10. Checkpoint — Verifikasi integrasi lengkap
  - Pastikan semua test lulus. Verifikasi bahwa `Stack.Protected` routing bekerja dengan benar untuk semua kombinasi auth state. Tanyakan kepada user jika ada pertanyaan sebelum melanjutkan.

- [x] 11. Setup testing framework dan konfigurasi fast-check
  - [x] 11.1 Setup Jest dan React Testing Library untuk Expo
    - Install dev dependencies: `jest`, `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native`, `fast-check`
    - Buat atau update `jest.config.js` dengan preset `jest-expo`
    - Tambahkan script `"test": "jest --run"` ke `package.json`
    - Buat `src/__tests__/` direktori untuk test files
    - _Requirements: (testing infrastructure)_

  - [x] 11.2 Buat mock files untuk native modules
    - Buat `__mocks__/@react-native-google-signin/google-signin.ts` dengan mock `GoogleSignin` dan `statusCodes`
    - Buat `__mocks__/firebase/app.ts` dengan mock `initializeApp`, `getApps`, `getApp`
    - Buat `__mocks__/firebase/auth.ts` dengan mock `initializeAuth`, `onAuthStateChanged`, `signInWithCredential`, `signOut`, `GoogleAuthProvider`, `getReactNativePersistence`
    - Buat `__mocks__/expo-splash-screen.ts` dengan mock `preventAutoHideAsync` dan `hideAsync`
    - _Requirements: (testing infrastructure)_

---

## Notes

- Task yang ditandai `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk traceability
- Checkpoint memastikan validasi inkremental sebelum melanjutkan ke fase berikutnya
- Property tests memvalidasi correctness properties universal menggunakan `fast-check`
- Unit tests memvalidasi contoh spesifik dan edge cases
- `@react-native-google-signin/google-signin` **tidak dapat digunakan di Expo Go** — wajib development build
- Urutan task 11 (testing setup) dapat dilakukan lebih awal jika ingin TDD approach; letakkan di wave 0 jika demikian
- Baca docs Expo v56 di https://docs.expo.dev/versions/v56.0.0/ sebelum menulis kode apapun (sesuai AGENTS.md)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "11.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "11.2"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["3.3", "3.4"] },
    { "id": 6, "tasks": ["3.5", "3.6", "3.9"] },
    { "id": 7, "tasks": ["3.7", "3.8"] },
    { "id": 8, "tasks": ["5.1"] },
    { "id": 9, "tasks": ["5.2"] },
    { "id": 10, "tasks": ["5.3", "5.4", "5.5", "6.1"] },
    { "id": 11, "tasks": ["6.2", "7.1"] },
    { "id": 12, "tasks": ["7.2", "7.3"] },
    { "id": 13, "tasks": ["8.1", "9.1"] },
    { "id": 14, "tasks": ["8.2", "8.3", "9.2"] }
  ]
}
```
