# AsalUsul — Dokumentasi Project

> Aplikasi mobile (iOS, Android, Web) untuk mencatat dan memvisualisasikan silsilah keluarga dalam bentuk Pohon Keluarga.

Terakhir diperbarui: 28 Juni 2026

---

## 1. Ringkasan Project

**AsalUsul** adalah aplikasi pencatat silsilah keluarga. Pengguna login dengan akun Google, membuat satu atau beberapa "Pohon Keluarga", lalu menambahkan anggota keluarga beserta relasinya (ayah, ibu, pasangan, anak). Aplikasi kemudian merender anggota tersebut sebagai diagram pohon generasional secara otomatis.

Visi jangka panjang:
1. **Sekarang** — pencatatan silsilah pribadi (single owner per tree).
2. **Berikutnya** — kolaborasi: meng-*invite* pengguna lain untuk mengakses/berkontribusi ke pohon keluarga (fondasi sudah disiapkan lewat field `shareWith`).
3. **Nanti** — monetisasi (belum sekarang, tapi mulai dipersiapkan secara arsitektural).

---

## 2. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Expo SDK 56 + Expo Router v56 (typed routes, React Compiler) |
| Bahasa | TypeScript |
| Runtime | React 19.2 + React Native 0.85 |
| Auth | Firebase Authentication + Google Sign-In (`@react-native-google-signin`) |
| Database | Cloud Firestore (`firebase` v12) |
| State management | Zustand v5 |
| Navigation | Expo Router `Stack.Protected` + `expo-router/ui` |
| Animasi | React Native Reanimated v4 + Worklets |
| UI | React Native + `@expo/ui`, expo-blur, expo-glass-effect, expo-image, expo-symbols |
| Persistensi sesi | AsyncStorage (persistensi sesi Firebase Auth) |
| Testing | Jest + jest-expo + React Testing Library + fast-check (property-based testing) |

Konfigurasi penting (`app.json`):
- `scheme: asalusul`, orientasi `portrait`, `userInterfaceStyle: automatic`.
- Plugin: `expo-router`, `expo-splash-screen`, `@react-native-google-signin/google-signin`.
- Experiments: `typedRoutes: true`, `reactCompiler: true`.
- Android package: `com.asalusul`.

> Catatan: `@react-native-google-signin/google-signin` butuh **development build** — tidak jalan di Expo Go.

---

## 3. Arsitektur

Aplikasi memakai arsitektur berlapis yang ketat. Semua pemanggilan SDK Firebase diisolasi di layer service & repository; komponen UI bebas dari Firebase.

```
┌─────────────────────────────────────────────────────┐
│  Screens / Components (src/app, src/components)        │  ← bebas Firebase
├─────────────────────────────────────────────────────┤
│  Zustand Stores (src/store)                           │  ← optimistic updates + rollback
├─────────────────────────────────────────────────────┤
│  Repositories (src/repositories)                      │  ← CRUD Firestore, mapping, validasi
├─────────────────────────────────────────────────────┤
│  Firebase Services (src/services/firebase)            │  ← config, retry, klasifikasi error
├─────────────────────────────────────────────────────┤
│  Firebase SDK (Auth + Firestore)                      │
└─────────────────────────────────────────────────────┘
```

Aliran data umum (contoh: membuat pohon):
1. Screen memanggil `useFamilyTreeStore.createFamilyTree(name, uid)`.
2. Store melakukan **optimistic insert** (entry sementara dengan `temp_<timestamp>`).
3. Store memanggil `familyTreeRepository.createFamilyTree(...)`.
4. Repository memvalidasi input, memanggil Firestore dengan `withRetry`, mengembalikan dokumen real.
5. Store mengganti entry sementara dengan dokumen real, atau **rollback** + set pesan error jika gagal.

---

## 4. Struktur Folder

```
src/
├── app/                          # Routing (Expo Router, file-based)
│   ├── _layout.tsx               # Root: AuthProvider + Stack.Protected
│   ├── login.tsx                 # Layar login (Google Sign-In)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab layout → AppTabs
│   │   ├── index.tsx             # Home: daftar pohon keluarga / empty state
│   │   └── setting.tsx           # Pengaturan (logout)
│   ├── family/[id].tsx           # Detail pohon keluarga + kanvas pohon
│   └── member/[id].tsx           # Detail anggota
├── components/
│   ├── family/                   # Card, modal create/edit, kanvas, form anggota, dialog hapus
│   ├── member/                   # Komponen terkait anggota
│   ├── ui/                       # Komponen UI generik
│   ├── app-tabs.tsx(.web)        # Tab bar glassmorphism
│   ├── google-sign-in-button.tsx
│   ├── splash-screen.tsx
│   └── ...                       # themed-text/view, primary-button, dsb.
├── context/
│   └── auth-context.tsx          # AuthProvider + useAuth (Google + Firebase)
├── store/                        # Zustand stores
│   ├── useAuthStore.ts           # uid, isAuthenticated, authError
│   ├── useFamilyTreeStore.ts     # daftar pohon + CRUD
│   └── useMemberStore.ts         # anggota per-tree + CRUD
├── repositories/                 # Akses Firestore
│   ├── userRepository.ts         # users/{uid}
│   ├── familyTreeRepository.ts   # family_trees/{treeId}
│   └── memberRepository.ts       # family_trees/{treeId}/members/{memberId}
├── services/firebase/
│   ├── config.ts                 # singleton db & auth
│   ├── auth.ts                   # upsertUserDocument (side-effect pasca login)
│   └── firestore.ts              # toISOString, withRetry, klasifikasi error
├── types/
│   ├── familyTree.ts             # FamilyTree, Member, tipe store & form
│   └── firestore.ts              # *Document & *Input (tipe native Firestore)
├── utils/
│   ├── treeLayoutEngine.ts       # Engine layout pohon (pure TS, tanpa React)
│   ├── familyTreeUtils.ts        # validasi nama, format tanggal relatif
│   └── validationUtils.ts        # validasi form
├── hooks/                        # use-color-scheme, use-theme
├── lib/firebase.ts               # initializeApp + initializeAuth (AsyncStorage)
├── constants/theme.ts            # warna, spacing, radii, shadows, fonts
└── __tests__/                    # unit + property-based tests
```

---

## 5. Model Data (Firestore)

Struktur koleksi Firestore:

```
users/{uid}
family_trees/{treeId}
family_trees/{treeId}/members/{memberId}
```

### 5.1 `users/{uid}` — UserDocument
Dibuat saat pertama kali Google Sign-In; `lastLoginAt` diperbarui di login berikutnya.

| Field | Tipe | Catatan |
|-------|------|---------|
| `id` | string | sama dengan Firebase Auth UID |
| `name` | string | dari akun Google (bisa kosong) |
| `email` | string | email utama |
| `photoUrl` | string | foto profil (bisa kosong) |
| `provider` | `'google'` | selalu google |
| `createdAt` / `updatedAt` / `lastLoginAt` | Timestamp | server timestamp |

### 5.2 `family_trees/{treeId}` — FamilyTreeDocument

| Field | Tipe | Catatan |
|-------|------|---------|
| `id` | string | id dokumen Firestore |
| `name` | string | wajib, ≤ 100 karakter (trim) |
| `description` | string \| null | opsional |
| `ownerId` | string | UID pemilik |
| `totalMembers` | number | denormalisasi jumlah anggota, dijaga via transaction |
| `shareWith` | string[] | **fondasi sharing** — array UID yang diberi akses (default `[]`) |
| `createdAt` / `updatedAt` | Timestamp | server timestamp |

Catatan: tipe app-level `FamilyTree` juga punya `coverImage: string \| null` (saat ini selalu `null` dari repository, disiapkan untuk masa depan).

### 5.3 `family_trees/{treeId}/members/{memberId}` — MemberDocument

| Field | Tipe | Catatan |
|-------|------|---------|
| `id` | string | id dokumen |
| `familyTreeId` | string | referensi tree induk |
| `fullName` | string | wajib (trim) |
| `gender` | `'male'` \| `'female'` | enum ketat |
| `role` | string | mis. "Ayah", "Ibu", "Anak", "Kakek" |
| `birthDate` | string \| null | format `YYYY-MM-DD` |
| `fatherId` / `motherId` | string \| null | referensi member di tree yang sama |
| `spouseIds` / `childrenIds` | string[] | relasi (dijaga simetris via batch write) |
| `createdAt` / `updatedAt` | Timestamp | server timestamp |

Catatan: tipe app-level `Member` punya `photoUrl` & `bio` (saat ini default `null`, belum dipersistenkan ke Firestore).

---

## 6. Fitur Utama

### 6.1 Autentikasi
- Google Sign-In native → tukar idToken ke kredensial Firebase.
- Sesi persisten via AsyncStorage (tetap login setelah app ditutup).
- Timeout: 10 detik untuk resolve auth state awal; 30 detik untuk proses sign-in.
- Pasca login, `upsertUserDocument` membuat/memperbarui dokumen `users/{uid}` (kegagalannya tidak memblok navigasi).

### 6.2 Protected Routing
- `src/app/_layout.tsx` membungkus app dengan `AuthProvider` dan `Stack.Protected`.
- User belum login diarahkan ke `login`, user sudah login diarahkan ke `(tabs)`.

### 6.3 Manajemen Pohon Keluarga (Home)
- Daftar pohon dalam `FlatList` dengan `FamilyTreeCard`, atau `EmptyState` bila kosong.
- Buat pohon via `CreateFamilyTreeModal`; edit & hapus via settings sheet di layar detail.
- Semua operasi optimistic + rollback; error ditampilkan via banner berbahasa Indonesia.

### 6.4 Manajemen Anggota & Relasi
- Tambah/edit/hapus anggota lewat form di layar detail pohon.
- Relasi dijaga simetris: menambah pasangan/anak memperbarui kedua sisi via `batchUpdateRelationships`.
- Menghapus anggota membersihkan semua referensi di anggota lain (spouse/children/father/mother).
- `totalMembers` dijaga konsisten via Firestore transaction (increment/decrement, floor di 0).

### 6.5 Visualisasi Pohon (Tree Layout Engine)
`src/utils/treeLayoutEngine.ts` — modul TypeScript murni (tanpa React):
- Menetapkan **generasi** tiap anggota via BFS dari root (anggota tanpa orang tua di tree).
- Menyelaraskan pasangan agar berada di generasi yang sama.
- Menyusun baris per generasi, mengelompokkan pasangan berdampingan.
- Menghasilkan posisi node (`x`, `y`), garis parent→child (termasuk edge dari titik tengah pasangan), dan garis pasangan.
- Mengembalikan ukuran kanvas total untuk rendering scroll/zoom.

### 6.6 Ketahanan & Error Handling
- `withRetry`: exponential backoff + jitter untuk error transient (`unavailable`, `deadline-exceeded`); tidak retry untuk permission/auth error.
- Klasifikasi error → pesan lokal Bahasa Indonesia: "Akses ditolak…", "Tidak ada koneksi internet.", "Terjadi kesalahan…".
- Fallback query: bila composite index Firestore belum ada, jatuh ke query sederhana + sort di klien.

### 6.7 Jelajahi Contoh (Featured Trees)
- Baris horizontal-scroll di Home berisi contoh pohon tokoh publik (Jokowi, Prabowo, Soekarno) sebagai onboarding/inspirasi.
- Data lokal bundled (read-only, gratis, offline); viewer read-only di `/showcase/[id]`.
- Detail: `docs/feature-featured-trees.md`.

> Catatan: dokumen ini ditulis di awal project. Beberapa fitur fase berikutnya (detail anggota kaya, foto, navigasi pohon, sharing, featured trees) sudah diimplementasikan setelahnya. Untuk status terbaru lihat `docs/phase-1-completion.md`, `docs/phase-2-completion.md`, `docs/feature-featured-trees.md`, dan `docs/roadmap.md`.

---

## 7. Keamanan (Firestore Rules)

File `firestore.rules` (owner-only):

- `users/{uid}` — read/write hanya jika `request.auth.uid == uid`.
- `family_trees/{treeId}` — read/update/delete hanya jika `request.auth.uid == resource.data.ownerId`; create hanya jika `request.auth.uid == request.resource.data.ownerId`.
- `family_trees/{treeId}/members/{memberId}` — akses hanya jika pemilik tree induk (`get(...).data.ownerId == request.auth.uid`).
- Default deny untuk semua path lain.

> Penting untuk roadmap sharing: rules saat ini **owner-only** dan belum mempertimbangkan field `shareWith`. Saat fitur invite diaktifkan, rules harus diperluas (lihat dokumen brainstorming).

---

## 8. Manajemen State (Zustand)

| Store | State | Tanggung jawab |
|-------|-------|----------------|
| `useAuthStore` | `uid`, `isAuthenticated`, `authError` | Sumber kebenaran uid; disinkronkan dari AuthContext |
| `useFamilyTreeStore` | `familyTrees`, `loading`, `error` | CRUD pohon dengan optimistic update + rollback |
| `useMemberStore` | `membersByTreeId`, `loadingTreeId`, `memberError` | Anggota per-tree (independen antar pohon) |

Pola umum: optimistic update → panggil repository → ganti dengan data real / rollback ke state sebelumnya pada kegagalan.

---

## 9. Setup & Menjalankan

### Prasyarat
- Node.js, package manager (npm/yarn), dan development build (bukan Expo Go).
- Project Firebase dengan Authentication (Google) dan Firestore aktif.

### Langkah
1. Install dependency: `npm install`.
2. Salin env: `cp .env.example .env`, isi nilai Firebase:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   EXPO_PUBLIC_FIREBASE_APP_ID=
   EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID=
   ```
3. Letakkan `google-services.json` (Android) dan `GoogleService-Info.plist` (iOS) di root.
4. Jalankan development build:
   - Android: `npx expo run:android`
   - iOS: `npx expo run:ios`
5. Untuk Android, daftarkan SHA-1 debug ke Firebase Console, unduh ulang `google-services.json`.

### Script (`package.json`)
| Script | Fungsi |
|--------|--------|
| `npm start` | Expo dev server |
| `npm run android` / `ios` / `web` | Jalankan per platform |
| `npm run lint` | Linting (`expo lint`) |
| `npm test` | Jest (single run) |

---

## 10. Testing

- Framework: Jest + jest-expo, React Testing Library, dan fast-check (property-based testing).
- Cakupan di `src/__tests__/` dan `src/repositories/__tests__/`, `src/store/__tests__/`.
- Properti yang diuji antara lain: singleton Firebase, cleanup auth listener, routing berbasis auth, logout selalu clear state, simetri relasi anggota, konsistensi `totalMembers`, non-amplifikasi retry, dan layout engine.
- Git hook: `prepare` mengatur `core.hooksPath .githooks` (ada gate review PR via `.kiro/hooks`).

---

## 11. Spesifikasi (Kiro Specs)

Riwayat pengembangan terdokumentasi sebagai spec di `.kiro/specs/`:
1. `expo-firebase-boilerplate` — fondasi auth + routing.
2. `asalUsul-ui-foundation` — fondasi UI & tema.
3. `create-family-tree` — pembuatan pohon keluarga.
4. `family-tree-detail` — layar detail + kanvas pohon.
5. `family-member-management` — CRUD anggota & relasi.
6. `firebase-firestore-integration` — migrasi dari state lokal ke arsitektur berlapis Firestore.

Tiap spec berisi `requirements.md`, `design.md`, dan `tasks.md`.

---

## 12. Status & Catatan Penting

- `coverImage` (tree) dan `photoUrl`/`bio` (member) sudah ada di tipe app-level tapi **belum dipersistenkan** ke Firestore — disiapkan untuk pengembangan berikutnya.
- Field `shareWith` sudah ada di model & input tapi **belum ada UI sharing** dan **belum tercermin di security rules**.
- Tidak ada Firebase Storage yang dikonfigurasi untuk upload foto (meski `storageBucket` ada di env).
- Belum ada analytics/crash reporting yang terpasang.

Untuk arah pengembangan, lihat `docs/BRAINSTORMING.md`.
