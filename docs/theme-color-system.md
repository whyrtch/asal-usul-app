# AsalUsul Theme & Color System

> Documentasi perubahan warna tema — dari muted earth tones ke vibrant jewel tones.
> Tanggal: 29 Jun 2026

## Filosofi Warna

Sebagai aplikasi pohon keluarga untuk keluarga Indonesia, warna AsalUsul harus:

1. **Hangat & mengundang** — mencerminkan kehangatan keluarga
2. **Premium & modern** — tidak terlihat seperti apps jadul
3. **Catchy & berenergi** — tidak membosankan, enak dipandang
4. **Resonansi budaya** — nuansa heritage Indonesia yang kaya

## Palette Baru

### Background — Lebih bersih, kontras layer lebih jelas

| Token | Before | After | Keterangan |
|-------|--------|-------|------------|
| `backgroundWarm` | `#F5F0E8` | `#F7F2EA` | Lebih warm, lebih bersih |
| `backgroundCard` | `#FDFAF4` | `#FFFCF7` | Creamier off-white |
| `backgroundOverlay` | `#EDE8DC` | `#EBE2D2` | Kontras lebih dengan card |

### Brand — Rich teal-emerald (vibrant tapi tetap heritage)

| Token | Before | After | Keterangan |
|-------|--------|-------|------------|
| `primary` | `#1B4332` | `#0D5E48` | Lebih vibrant, mata langsung tertarik |
| `primaryLight` | `#2D6A4F` | `#1A8C6E` | Jauh lebih pop untuk aksen |
| `primaryMuted` | `#52796F` | `#529484` | Lebih cerah, tetap soft |

### Text — Kontras lebih baik untuk aksesibilitas

| Token | Before | After | Keterangan |
|-------|--------|-------|------------|
| `textHeading` | `#1A1A1A` | `#1A1A1A` | Tidak berubah |
| `textBody` | `#3D3D3D` | `#2E2E2E` | Lebih gelap, lebih terbaca |
| `textMuted` | `#8A8070` | `#7A7060` | Lebih terbaca, tetap muted |
| `textOnPrimary` | `#FFFFFF` | `#FFFFFF` | Tidak berubah |

### Accent — **BARU**: Warm Terracotta

| Token | Hex | Penggunaan |
|-------|-----|------------|
| `terracotta` | `#D4634A` | CTA buttons, highlights, badges |
| `terracottaLight` | `#FDF0EC` | Background untuk area terracotta |

Terracotta memberikan **energi** dan **kehangatan** yang tidak dimiliki palette sebelumnya. Cocok untuk tombol aksi utama dan elemen yang perlu menonjol.

### Gold — Lebih emas, bukan olive

| Token | Before | After | Keterangan |
|-------|--------|-------|------------|
| `goldAccent` | `#C9A84C` | `#D4A025` | Warm golden, nuansa premium |

### Border — Lebih terdefinisi

| Token | Before | After | Keterangan |
|-------|--------|-------|------------|
| `borderSubtle` | `#E0D9CC` | `#D9CFBF` | Lebih gelap, elemen lebih jelas |

### Semantic Colors — Lebih konsisten

| Token | Before | After | Keterangan |
|-------|--------|-------|------------|
| `destructive` | `#C0392B` | `#D1383A` | Merah lebih berani |
| `destructiveLight` | `#FDECEA` | `#FDEAED` | Minor adjustment |
| `success` | `#2D6A4F` | `#1A8C6E` | Sama dengan primaryLight |
| `warning` | `#C9A84C` | `#D4A025` | Sama dengan goldAccent |
| `info` | `#52796F` | `#529484` | Sama dengan primaryMuted |

## Shadows — Lebih premium

Shadow color berubah dari `#1B4332` → `#0A2E25` (lebih gelap, cocok primary baru).
Opacity dan radius ditingkatkan untuk efek yang lebih halus dan premium.

## Struktur File

```
src/constants/theme.ts        — Semua token warna, spacing, typography, shadows
```

Semua komponen UI mengacu pada token di file ini — tidak ada hardcoded hex values di komponen.

## Cara Menggunakan

### Di Komponen Baru

```typescript
import { AsalUsulColors } from '@/constants/theme';

// Untuk styling langsung
style={{ backgroundColor: AsalUsulColors.primary }}

// Untuk semantic usage
import { SemanticColors } from '@/constants/theme';
style={{ backgroundColor: SemanticColors.background }}
```

### Menambahkan Warna Baru

1. Tambahkan hex value di object `AsalUsulColors`
2. Tambahkan semantic mapping di `SemanticColors` jika perlu
3. Tipe `AsalUsulColor` akan otomatis terupdate (union type)

## Sebelum vs Sesudah

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| Kesan | Aman, hangat, tapi flat | Premium, vibrant, energik |
| Kontras | Kurang (bg terlalu dekat) | Lebih baik (layer jelas) |
| Gold | seperti olive | seperti emas |
| Aksen | Tidak ada | Terracotta untuk pop |
| Shadow | Kasar | Halus & premium |
