# Fitur — Jelajahi Contoh (Featured / Showcase Trees)

> Status: ✅ Terimplementasi (kode) · Tanggal: 28 Juni 2026

## Tujuan
Menampilkan beberapa contoh pohon keluarga tokoh publik (Jokowi, Prabowo, Soekarno) sebagai **inspirasi/onboarding**, agar pengguna baru langsung paham bagaimana pohon keluarga digunakan — tanpa harus membuat datanya sendiri dulu.

## UX
- Di **Home**, ada baris **horizontal-scroll** berjudul "Jelajahi Contoh" berisi kartu (nama + jumlah anggota).
- Muncul di **empty state** (pengguna baru) dan di **atas daftar** pohon milik pengguna.
- Tap kartu → membuka **viewer read-only** (`/showcase/{id}`) yang merender pohon dengan `FamilyTreeCanvas` (zoom/pan/search aktif), diberi banner "Contoh · hanya lihat · data ilustratif publik".
- Node tidak bisa di-tap ke detail (read-only).

## Keputusan Arsitektur
- **Data lokal bundled** (`src/data/sampleFamilyData.ts`), bukan Firestore:
  - Gratis, instan, offline, read-only alami, tanpa biaya read / aturan keamanan.
  - Cocok untuk katalog kurasi kecil. Bisa dimigrasikan ke koleksi Firestore publik nanti jika katalog membesar.
- **Label ilustratif/publik** agar tidak rancu dengan pohon milik pengguna dan tidak menyiratkan klaim silsilah resmi.
- **Satu sumber data** dipakai bersama dengan dev-seed (lihat di bawah).

## File Terkait
| File | Peran |
|------|-------|
| `src/data/sampleFamilyData.ts` | Data contoh (3 pohon) + `SHOWCASE_SUMMARIES`, `getSampleTree` |
| `src/components/family/FeaturedTreesRow.tsx` | Baris horizontal-scroll di Home |
| `src/app/showcase/[id].tsx` | Viewer read-only |
| `src/app/(tabs)/index.tsx` | Menyematkan `FeaturedTreesRow` |

## Catatan
- Selalu tampil (tidak di-flag) karena bernilai untuk onboarding. Mudah digerbang flag bila perlu.
- Data ilustratif berdasarkan informasi publik — bukan catatan genealogis resmi.

---

## Terkait: Dev Seed (testing)

Untuk menguji **alur editable** (bukan read-only), ada tombol dev opsional yang menulis contoh yang sama ke Firestore di bawah akun yang login.

- Flag: `FEATURE_DEV_SEED` (env `EXPO_PUBLIC_DEV_SEED=true`, default off — jangan aktifkan di produksi).
- Tombol "🌱 Muat Contoh (Jokowi & Prabowo)" muncul di Home saat flag aktif.
- File: `src/services/sampleSeed.ts` (`seedSampleData(uid)` — idempotent, ID deterministik).
- Beda dengan showcase: dev-seed membuat data Firestore yang **bisa diedit**; showcase murni read-only lokal.
