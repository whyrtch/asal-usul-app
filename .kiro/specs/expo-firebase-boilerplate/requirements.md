# Requirements Document

## Introduction

Fitur ini adalah boilerplate lengkap untuk aplikasi Expo v56 dengan Firebase Authentication. Boilerplate mencakup: splash screen animasi sebagai tampilan awal, alur login menggunakan Google Sign-In via Firebase Authentication, navigasi tab native (Home dan Setting) dengan tampilan floating/bottom tab bar setelah login berhasil, serta tombol logout di halaman Setting. Proyek menggunakan Expo Router v56 dengan file-based routing, `expo-router/unstable-native-tabs` untuk navigasi tab native, dan `@react-native-google-signin/google-signin` sebagai library Google Sign-In yang direkomendasikan Expo untuk production.

## Glossary

- **App**: Aplikasi Expo React Native yang dibangun di atas proyek ini.
- **SplashScreen**: Layar awal native yang ditampilkan saat App pertama kali dimuat, dikontrol oleh `expo-splash-screen`.
- **AuthScreen**: Layar login yang menampilkan tombol Google Sign-In.
- **HomeScreen**: Layar utama yang ditampilkan setelah pengguna berhasil login.
- **SettingScreen**: Layar pengaturan yang dapat diakses melalui tab Setting, berisi tombol Logout.
- **FloatingTabBar**: Tab bar native berbasis `NativeTabs` dari `expo-router/unstable-native-tabs` yang menampilkan tab Home dan Setting.
- **AuthContext**: React Context yang menyimpan dan mendistribusikan state autentikasi (user, loading) ke seluruh komponen.
- **FirebaseAuth**: Layanan Firebase Authentication yang memverifikasi identitas pengguna.
- **GoogleSignIn**: Library `@react-native-google-signin/google-signin` yang menangani alur OAuth Google.
- **ProtectedRoute**: Mekanisme Expo Router yang mencegah akses ke layar tertentu tanpa autentikasi.

---

## Requirements

### Requirement 1: Splash Screen

**User Story:** Sebagai pengguna, saya ingin melihat splash screen saat aplikasi pertama kali dibuka, sehingga ada transisi yang mulus sebelum konten utama ditampilkan.

#### Acceptance Criteria

1. THE App SHALL mencegah splash screen native disembunyikan secara otomatis selama proses inisialisasi berlangsung.
2. WHEN App selesai memuat font, image assets, dan status autentikasi awal dari FirebaseAuth, THE App SHALL menyembunyikan splash screen.
3. IF terjadi error saat memuat sumber daya awal, THEN THE App SHALL tetap menyembunyikan splash screen agar pengguna tidak terjebak di splash screen selamanya.
4. THE App SHALL menampilkan animasi fade-out dengan durasi 500ms saat splash screen disembunyikan.
5. WHILE App sedang memuat sumber daya awal dan splash screen belum disembunyikan, THE App SHALL tidak menampilkan konten UI apapun di belakang splash screen.
6. IF proses memuat sumber daya awal melebihi 10 detik, THEN THE App SHALL menyembunyikan splash screen dan menampilkan AuthScreen dengan pesan error.

---

### Requirement 2: Login dengan Google via Firebase Authentication

**User Story:** Sebagai pengguna baru, saya ingin login menggunakan akun Google saya, sehingga saya dapat mengakses aplikasi tanpa perlu membuat akun baru.

#### Acceptance Criteria

1. THE AuthScreen SHALL menampilkan tombol "Sign in with Google" yang dapat ditekan oleh pengguna.
2. WHEN pengguna menekan tombol "Sign in with Google", THE App SHALL memulai alur OAuth Google menggunakan library `@react-native-google-signin/google-signin`.
3. WHEN alur OAuth Google berhasil mendapatkan token identitas, THE App SHALL mengautentikasi pengguna ke FirebaseAuth menggunakan token tersebut.
4. IF token identitas yang diterima dari alur OAuth kosong atau tidak valid, THEN THE App SHALL menampilkan pesan error dan kembali ke AuthScreen tanpa crash.
5. WHEN FirebaseAuth berhasil mengautentikasi pengguna, THE AuthContext SHALL memperbarui state `user` dengan data pengguna dari Firebase dan menavigasi pengguna ke HomeScreen.
6. IF pengguna membatalkan alur OAuth Google, THEN THE App SHALL kembali ke AuthScreen tanpa menampilkan pesan error.
7. IF terjadi error jaringan atau error FirebaseAuth saat proses login, THEN THE App SHALL menampilkan pesan error yang menjelaskan penyebab kegagalan dan memungkinkan pengguna mencoba lagi.
8. WHILE proses login sedang berlangsung, THE AuthScreen SHALL menampilkan indikator loading dan menonaktifkan tombol "Sign in with Google" untuk mencegah klik ganda, dengan batas waktu maksimal 30 detik sebelum loading state direset.
9. WHEN App pertama kali dimuat, THE App SHALL mengkonfigurasi library Google Sign-In dengan `webClientId` berupa string non-kosong yang valid dari Firebase Console sebelum alur login dapat dimulai.

---

### Requirement 3: Proteksi Rute dan Manajemen State Autentikasi

**User Story:** Sebagai pengguna, saya ingin aplikasi secara otomatis mengarahkan saya ke halaman yang tepat berdasarkan status login saya, sehingga saya tidak perlu login ulang setiap kali membuka aplikasi.

#### Acceptance Criteria

1. THE AuthContext SHALL mendaftarkan listener perubahan state autentikasi saat komponen di-mount dan membatalkan pendaftaran listener tersebut saat komponen di-unmount.
2. WHEN pengguna belum login (state `user` adalah `null`) dan mencoba mengakses HomeScreen atau SettingScreen, THE App SHALL mengarahkan pengguna ke AuthScreen.
3. WHEN pengguna sudah login (state `user` bukan `null`) dan mencoba mengakses AuthScreen, THE App SHALL mengarahkan pengguna ke HomeScreen.
4. WHEN App dibuka kembali setelah ditutup dan pengguna sebelumnya sudah login, THE App SHALL secara otomatis menavigasi pengguna ke HomeScreen tanpa perlu login ulang.
5. WHILE AuthContext sedang memeriksa status autentikasi awal dari FirebaseAuth, THE App SHALL menampilkan splash screen dan tidak merender AuthScreen maupun HomeScreen, dengan batas waktu maksimal 10 detik.
6. IF FirebaseAuth tidak tersedia atau pemeriksaan status autentikasi awal melebihi 10 detik, THEN THE App SHALL menyembunyikan splash screen, memperlakukan state `user` sebagai `null`, dan menampilkan AuthScreen dengan pesan error.

---

### Requirement 4: Halaman Home dengan FloatingTabBar

**User Story:** Sebagai pengguna yang sudah login, saya ingin melihat halaman Home dengan navigasi tab yang mudah diakses, sehingga saya dapat berpindah antar halaman dengan cepat.

#### Acceptance Criteria

1. WHEN pengguna berhasil login, THE App SHALL menampilkan HomeScreen sebagai tab aktif pertama di dalam FloatingTabBar.
2. THE FloatingTabBar SHALL menampilkan dua tab: "Home" dan "Setting", menggunakan komponen `NativeTabs` dari `expo-router/unstable-native-tabs`.
3. THE FloatingTabBar SHALL menggunakan ikon native untuk setiap tab: ikon "house" di iOS (SF Symbol) dan "home" di Android (Material icon) untuk tab Home, serta ikon "gearshape" di iOS (SF Symbol) dan "settings" di Android (Material icon) untuk tab Setting.
4. WHEN pengguna menekan tab "Home" di FloatingTabBar, THE App SHALL menampilkan HomeScreen.
5. WHEN pengguna menekan tab "Setting" di FloatingTabBar, THE App SHALL menampilkan SettingScreen.
6. THE HomeScreen SHALL menampilkan nama pengguna yang sedang login dari field `displayName` di data `user` AuthContext, atau menampilkan `email` pengguna sebagai fallback jika `displayName` bernilai `null`.
7. THE HomeScreen SHALL menampilkan foto profil pengguna dari field `photoURL` di data `user` AuthContext, atau menampilkan avatar placeholder jika `photoURL` bernilai `null`.

---

### Requirement 5: Halaman Setting dengan Tombol Logout

**User Story:** Sebagai pengguna yang sudah login, saya ingin dapat logout dari aplikasi melalui halaman Setting, sehingga saya dapat mengamankan akun saya atau berganti akun.

#### Acceptance Criteria

1. THE SettingScreen SHALL menampilkan tombol "Logout" yang dapat ditekan oleh pengguna.
2. WHEN pengguna menekan tombol "Logout", THE App SHALL mengakhiri sesi Google dan sesi Firebase secara berurutan.
3. WHEN proses logout berhasil, THE AuthContext SHALL memperbarui state `user` menjadi `null`.
4. WHEN state `user` diperbarui menjadi `null` setelah logout, THE App SHALL menavigasi pengguna kembali ke AuthScreen.
5. IF terjadi error saat proses logout, THEN THE App SHALL menampilkan pesan error melalui alert atau modal dan tetap memperbarui state `user` menjadi `null` untuk memastikan pengguna keluar dari sesi lokal, lalu menavigasi ke AuthScreen.
6. WHILE proses logout sedang berlangsung, THE SettingScreen SHALL menampilkan indikator loading dan menonaktifkan tombol "Logout" untuk mencegah klik ganda.

---

### Requirement 6: Konfigurasi Firebase dan Inisialisasi

**User Story:** Sebagai developer, saya ingin Firebase diinisialisasi dengan benar satu kali saat aplikasi dimuat, sehingga semua layanan Firebase tersedia di seluruh aplikasi.

#### Acceptance Criteria

1. WHEN App pertama kali dimuat, THE App SHALL menginisialisasi Firebase menggunakan konfigurasi yang dibaca dari environment variables dengan prefix `EXPO_PUBLIC_`.
2. THE App SHALL memastikan Firebase hanya diinisialisasi satu kali; jika instance Firebase sudah ada, THE App SHALL menggunakan instance yang sudah ada tanpa membuat instance baru.
3. THE App SHALL mengekspor instance FirebaseAuth yang telah diinisialisasi untuk digunakan di seluruh aplikasi.
4. THE App SHALL membaca enam konfigurasi Firebase berikut dari environment variables: `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, dan `EXPO_PUBLIC_FIREBASE_APP_ID`.
5. THE App SHALL menyimpan konfigurasi Firebase di file `.env` yang dikecualikan dari version control melalui `.gitignore`, dan menyediakan file `.env.example` yang berisi semua enam kunci konfigurasi dengan nilai placeholder sebagai template.
