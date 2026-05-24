# Requirements Document

## Introduction

Fitur "Create Family Tree" mengimplementasikan alur pembuatan pohon keluarga pertama pada aplikasi mobile AsalUsul. Ketika pengguna mengetuk tombol "Buat Sekarang" di Home Screen, sebuah modal animasi muncul dari bawah layar. Pengguna memasukkan nama pohon keluarga, lalu mengirimkan formulir. Pohon keluarga yang baru dibuat kemudian muncul sebagai kartu dalam daftar di Home Screen. Seluruh state dikelola secara lokal menggunakan Zustand (tanpa Firebase pada tahap ini), namun struktur data dirancang agar siap untuk sinkronisasi Firebase di masa mendatang.

Setiap pohon keluarga dapat memiliki banyak anggota (`Member`). Setiap anggota menyimpan informasi pribadi lengkap serta referensi relasional ke anggota lain (ayah, ibu, pasangan, anak-anak), membentuk graf keluarga yang dapat ditelusuri.

## Glossary

- **HomeScreen**: Layar utama aplikasi yang menampilkan daftar pohon keluarga atau empty state
- **EmptyState**: Komponen UI yang ditampilkan ketika belum ada pohon keluarga yang dibuat
- **FamilyTreeCard**: Komponen kartu yang menampilkan satu entri pohon keluarga dalam daftar
- **CreateFamilyTreeModal**: Modal animasi bottom-sheet untuk memasukkan nama pohon keluarga baru
- **FamilyTree**: Model data yang merepresentasikan satu pohon keluarga beserta metadata-nya
- **Member**: Model data yang merepresentasikan satu anggota dalam sebuah pohon keluarga
- **FamilyTreeStore**: Zustand store yang menjadi sumber kebenaran tunggal untuk semua data pohon keluarga dan anggota
- **PrimaryButton**: Komponen tombol yang sudah ada, mendukung varian `filled` dan `outline`
- **HomeHeader**: Komponen header yang sudah ada di Home Screen
- **HeroIllustration**: Komponen ilustrasi dekoratif yang sudah ada
- **ThemedText**: Komponen teks yang sudah ada, mendukung berbagai tipe tipografi
- **ISO_8601**: Format string tanggal-waktu standar internasional, contoh: `"2025-01-15T10:30:00.000Z"`
- **DateString**: Format string tanggal `"YYYY-MM-DD"`, contoh: `"1970-03-12"`
- **Validator**: Fungsi `validateFamilyTreeName` yang memvalidasi input nama pohon keluarga
- **Formatter**: Fungsi `formatRelativeDate` yang mengubah ISO date menjadi label relatif berbahasa Indonesia

---

## Requirements

### Requirement 1: Home Screen — Conditional Rendering

**User Story:** Sebagai pengguna, saya ingin Home Screen menampilkan konten yang sesuai berdasarkan apakah saya sudah memiliki pohon keluarga atau belum, sehingga saya selalu mendapatkan tampilan yang relevan dengan kondisi saya.

#### Acceptance Criteria

1. WHEN `familyTrees.length === 0`, THE HomeScreen SHALL render the EmptyState component and SHALL NOT render a FlatList
2. WHEN `familyTrees.length > 0`, THE HomeScreen SHALL render a FlatList of FamilyTreeCard components and SHALL NOT render the EmptyState component
3. WHEN `familyTrees.length > 0`, THE HomeScreen SHALL display a create button in the header area alongside the existing HomeHeader
4. WHEN the EmptyState "Buat Sekarang" button is pressed, THE HomeScreen SHALL open the CreateFamilyTreeModal
5. WHEN the header create button is pressed, THE HomeScreen SHALL open the CreateFamilyTreeModal
6. THE HomeScreen SHALL always render the CreateFamilyTreeModal component regardless of `familyTrees.length`
7. WHEN the CreateFamilyTreeModal `onSubmit` callback is invoked with a name, THE HomeScreen SHALL call `FamilyTreeStore.addFamilyTree` with that name and then close the modal
8. WHEN the CreateFamilyTreeModal `onClose` callback is invoked, THE HomeScreen SHALL set modal visibility to false

---

### Requirement 2: CreateFamilyTreeModal — Behavior and Interaction

**User Story:** Sebagai pengguna, saya ingin modal pembuatan pohon keluarga yang mudah digunakan dengan animasi yang halus, sehingga pengalaman memasukkan nama pohon keluarga terasa menyenangkan dan intuitif.

#### Acceptance Criteria

1. WHEN `visible` prop transitions from `false` to `true`, THE CreateFamilyTreeModal SHALL trigger a slide-up animation using `withSpring` on the `translateY` shared value
2. WHEN the close action is triggered, THE CreateFamilyTreeModal SHALL trigger a slide-down animation using `withTiming` with duration 250ms before invoking `onClose`
3. WHEN the close animation completes, THE CreateFamilyTreeModal SHALL invoke the `onClose` callback exactly once via `runOnJS`
4. WHEN the "Buat" button is pressed with a valid name, THE CreateFamilyTreeModal SHALL invoke `onSubmit` with the trimmed name value
5. IF the name input is empty or contains only whitespace characters, THEN THE CreateFamilyTreeModal SHALL disable the "Buat" submit button
6. IF the name input is empty or contains only whitespace characters, THEN THE CreateFamilyTreeModal SHALL NOT invoke `onSubmit`
7. WHEN the "Batal" button is pressed, THE CreateFamilyTreeModal SHALL trigger the close animation and invoke `onClose` after animation completes
8. WHEN the dark overlay area is pressed, THE CreateFamilyTreeModal SHALL trigger the close animation and invoke `onClose` after animation completes
9. WHEN the close animation completes, THE CreateFamilyTreeModal SHALL reset the `inputValue` state to an empty string `""`
10. THE CreateFamilyTreeModal SHALL render a React Native `Modal` with `transparent={true}` and `animationType="none"`
11. THE CreateFamilyTreeModal SHALL render a dark overlay with `rgba(0,0,0,0.5)` background as a full-screen `Pressable`
12. THE CreateFamilyTreeModal SHALL render a title `"Buat Pohon Keluarga"`, a helper description text, and a `TextInput` with placeholder `"Contoh: Keluarga Sastrawinata"`
13. THE CreateFamilyTreeModal SHALL render a `PrimaryButton variant="outline"` labeled `"Batal"` and a `PrimaryButton variant="filled"` labeled `"Buat"`

---

### Requirement 3: FamilyTreeStore — State Management

**User Story:** Sebagai pengembang, saya ingin store Zustand yang andal dan terstruktur dengan baik, sehingga state pohon keluarga dan anggota dikelola secara konsisten dan siap untuk sinkronisasi Firebase di masa mendatang.

#### Acceptance Criteria

1. THE FamilyTreeStore SHALL initialize with an empty `familyTrees` array
2. WHEN `addFamilyTree(name)` is called with a valid name, THE FamilyTreeStore SHALL prepend a new `FamilyTree` object to the `familyTrees` array so that the newest entry appears at index 0
3. WHEN `addFamilyTree(name)` is called, THE FamilyTreeStore SHALL increase `familyTrees.length` by exactly 1
4. WHEN `addFamilyTree(name)` is called, THE FamilyTreeStore SHALL store the name as `name.trim()`
5. WHEN `addFamilyTree(name)` is called, THE FamilyTreeStore SHALL generate a unique `id` for each new entry
6. WHEN `addFamilyTree(name)` is called, THE FamilyTreeStore SHALL set `totalMembers` to `0` on the new entry
7. WHEN `addFamilyTree(name)` is called, THE FamilyTreeStore SHALL set `createdAt` to a valid ISO 8601 date string representing the current time
8. WHEN `addFamilyTree(name)` is called, THE FamilyTreeStore SHALL set `updatedAt` to the same ISO 8601 date string as `createdAt` at creation time
9. WHEN `removeFamilyTree(id)` is called with an existing `id`, THE FamilyTreeStore SHALL remove the entry with that `id` from `familyTrees`
10. WHEN `removeFamilyTree(id)` is called with a non-existent `id`, THE FamilyTreeStore SHALL leave `familyTrees` unchanged
11. WHEN `removeFamilyTree(id)` is called, THE FamilyTreeStore SHALL preserve all entries whose `id` does not match the given `id` in their original order
12. WHEN `removeFamilyTree(id)` is called twice with the same `id`, THE FamilyTreeStore SHALL produce the same `familyTrees` state as calling it once
13. THE FamilyTreeStore SHALL initialize with an empty `members` array
14. WHEN `addMember(member)` is called with a valid Member object, THE FamilyTreeStore SHALL append the member to the `members` array
15. WHEN `addMember(member)` is called, THE FamilyTreeStore SHALL increment `totalMembers` on the corresponding FamilyTree by exactly 1
16. WHEN `removeMember(memberId)` is called with an existing `memberId`, THE FamilyTreeStore SHALL remove the member from the `members` array
17. WHEN `removeMember(memberId)` is called, THE FamilyTreeStore SHALL decrement `totalMembers` on the corresponding FamilyTree by exactly 1

---

### Requirement 4: FamilyTreeCard — Display Component

**User Story:** Sebagai pengguna, saya ingin setiap pohon keluarga ditampilkan sebagai kartu yang informatif dan menarik, sehingga saya dapat dengan mudah mengidentifikasi dan memilih pohon keluarga yang ingin saya buka.

#### Acceptance Criteria

1. THE FamilyTreeCard SHALL render `item.name` as the primary heading text
2. THE FamilyTreeCard SHALL render the member count as the string `"${item.totalMembers} Anggota"`
3. THE FamilyTreeCard SHALL render a relative date label produced by `Formatter.formatRelativeDate(item.createdAt)`
4. WHEN the FamilyTreeCard is pressed and `onPress` prop is provided, THE FamilyTreeCard SHALL invoke `onPress` with `item.id` as the argument
5. THE FamilyTreeCard SHALL render a left avatar area containing an `Ionicons "git-network-outline"` icon on an `AsalUsulColors.backgroundOverlay` background
6. THE FamilyTreeCard SHALL render a right `Ionicons "chevron-forward"` icon in `AsalUsulColors.textMuted` color
7. THE FamilyTreeCard SHALL apply `borderRadius: Radii.lg`, `backgroundColor: AsalUsulColors.backgroundCard`, and `Shadows.card` styles
8. THE FamilyTreeCard SHALL NOT mutate the `item` prop

---

### Requirement 5: Input Validation

**User Story:** Sebagai pengguna, saya ingin sistem mencegah saya membuat pohon keluarga tanpa nama yang valid, sehingga setiap pohon keluarga selalu memiliki nama yang bermakna.

#### Acceptance Criteria

1. THE Validator SHALL return `true` when `name.trim().length >= 1`
2. THE Validator SHALL return `false` when `name` is an empty string `""`
3. THE Validator SHALL return `false` when `name` consists entirely of whitespace characters
4. WHEN the CreateFamilyTreeModal input value changes, THE CreateFamilyTreeModal SHALL re-evaluate validity using the Validator and update the submit button's disabled state reactively
5. THE FamilyTreeStore `addFamilyTree` action SHALL only be called from the CreateFamilyTreeModal when the Validator returns `true` for the current input value

---

### Requirement 6: `formatRelativeDate` Utility

**User Story:** Sebagai pengguna, saya ingin melihat kapan pohon keluarga dibuat dalam bahasa yang mudah dipahami, sehingga saya dapat mengetahui usia setiap pohon keluarga dengan cepat.

#### Acceptance Criteria

1. WHEN `formatRelativeDate` is called with an ISO 8601 date string representing today, THE Formatter SHALL return the string `"Dibuat hari ini"`
2. WHEN `formatRelativeDate` is called with an ISO 8601 date string representing a past date N days ago (N ≥ 1), THE Formatter SHALL return the string `"Dibuat N hari lalu"` where N is the integer number of days difference
3. THE Formatter SHALL always return a string that starts with `"Dibuat "`
4. WHEN `formatRelativeDate` is called with any valid ISO 8601 date string, THE Formatter SHALL return a non-empty string

---

### Requirement 7: EmptyState Component

**User Story:** Sebagai pengguna baru, saya ingin melihat tampilan yang ramah dan informatif ketika belum ada pohon keluarga, sehingga saya termotivasi untuk membuat pohon keluarga pertama saya.

#### Acceptance Criteria

1. THE EmptyState SHALL render the `HeroIllustration` component
2. THE EmptyState SHALL render the heading text `"Belum ada pohon keluarga"`
3. THE EmptyState SHALL render a description text that explains the purpose of creating a family tree
4. THE EmptyState SHALL render a `PrimaryButton variant="filled"` labeled `"Buat Sekarang"`
5. WHEN the "Buat Sekarang" button is pressed, THE EmptyState SHALL invoke the `onCreatePress` prop callback
6. THE EmptyState SHALL apply `FadeInDown` entrance animations to its child elements using `react-native-reanimated`

---

### Requirement 8: FamilyTree Data Model

**User Story:** Sebagai pengembang, saya ingin model data `FamilyTree` yang konsisten dan tervalidasi, sehingga data pohon keluarga dapat diandalkan di seluruh aplikasi dan siap untuk disinkronkan ke Firebase.

#### Acceptance Criteria

1. THE FamilyTree data model SHALL contain the fields: `id` (string), `name` (string), `createdAt` (string), `updatedAt` (string), `totalMembers` (number), `ownerId` (string), `description` (string | null), and `coverImage` (string | null)
2. THE FamilyTree `id` field SHALL be a non-empty string that is unique within the FamilyTreeStore
3. THE FamilyTree `name` field SHALL be a trimmed, non-empty string with length ≥ 1 character
4. THE FamilyTree `createdAt` field SHALL be a valid ISO 8601 date string parseable by `new Date()`
5. THE FamilyTree `totalMembers` field SHALL be a non-negative integer, defaulting to `0` upon creation
6. THE FamilyTree `ownerId` field SHALL be a non-empty string referencing the user who owns the tree
7. THE FamilyTree `description` field SHALL be either `null` or a non-empty string
8. THE FamilyTree `coverImage` field SHALL be either `null` or a valid URL string
9. THE FamilyTree `updatedAt` field SHALL be a valid ISO 8601 date string that is greater than or equal to `createdAt`
10. THE FamilyTree data model structure SHALL map 1:1 to a Firestore document under the path `users/{uid}/familyTrees/{id}` to support future Firebase sync with minimal refactoring

---

### Requirement 9: Member Data Model

**User Story:** Sebagai pengguna, saya ingin setiap anggota pohon keluarga menyimpan informasi pribadi lengkap dan relasi keluarga yang akurat, sehingga pohon keluarga dapat merepresentasikan struktur keluarga yang sesungguhnya.

#### Acceptance Criteria

1. THE Member data model SHALL contain the fields: `id` (string), `familyTreeId` (string), `fullName` (string), `gender` ("male" | "female"), `role` (string), `birthDate` (string | null), `photoUrl` (string | null), `bio` (string | null), `fatherId` (string | null), `motherId` (string | null), `spouseIds` (string[]), `childrenIds` (string[]), and `createdAt` (string)
2. THE Member `id` field SHALL be a non-empty string that is unique within the FamilyTreeStore
3. THE Member `familyTreeId` field SHALL reference the `id` of an existing FamilyTree in the FamilyTreeStore
4. THE Member `fullName` field SHALL be a non-empty string
5. THE Member `gender` field SHALL be exactly `"male"` or `"female"`
6. THE Member `role` field SHALL be a non-empty string (e.g., `"Ayah"`, `"Ibu"`, `"Anak"`, `"Cucu"`, `"Kakek"`)
7. THE Member `birthDate` field SHALL be either `null` or a string in `"YYYY-MM-DD"` format
8. THE Member `photoUrl` field SHALL be either `null` or a valid URL string
9. THE Member `bio` field SHALL be either `null` or a string
10. THE Member `fatherId` field SHALL be either `null` or a string referencing the `id` of another Member in the same FamilyTree
11. THE Member `motherId` field SHALL be either `null` or a string referencing the `id` of another Member in the same FamilyTree
12. THE Member `spouseIds` field SHALL be an array of strings, each referencing the `id` of another Member in the same FamilyTree
13. THE Member `childrenIds` field SHALL be an array of strings, each referencing the `id` of another Member in the same FamilyTree
14. THE Member `createdAt` field SHALL be a valid ISO 8601 date string
15. THE Member data model structure SHALL map 1:1 to a Firestore document under the path `users/{uid}/familyTrees/{familyTreeId}/members/{id}` to support future Firebase sync

---

### Requirement 10: Member Relationship Integrity

**User Story:** Sebagai pengguna, saya ingin relasi antar anggota keluarga (pasangan, orang tua, anak) selalu konsisten secara dua arah, sehingga pohon keluarga tidak memiliki data relasi yang bertentangan.

#### Acceptance Criteria

1. WHEN member A lists member B in `spouseIds`, THE FamilyTreeStore SHALL ensure member B also lists member A in `spouseIds`
2. WHEN member A lists member B in `childrenIds`, THE FamilyTreeStore SHALL ensure member B's `fatherId` or `motherId` references member A's `id`
3. WHEN a Member is added to a FamilyTree, THE FamilyTreeStore SHALL ensure `member.familyTreeId` equals the target FamilyTree's `id`
4. WHEN `removeMember(memberId)` is called, THE FamilyTreeStore SHALL remove all references to `memberId` from `spouseIds`, `childrenIds`, `fatherId`, and `motherId` fields of all other members in the same FamilyTree

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Home Screen conditional rendering invariant

*For any* FamilyTreeStore state, the HomeScreen SHALL render EmptyState if and only if `familyTrees.length === 0`, and SHALL render a FlatList of FamilyTreeCard components if and only if `familyTrees.length > 0`.

**Validates: Requirements 1.1, 1.2**

---

### Property 2: Modal submit calls onSubmit with trimmed name

*For any* non-empty, non-whitespace string entered into the CreateFamilyTreeModal input, pressing "Buat" SHALL invoke `onSubmit` with exactly `name.trim()`.

**Validates: Requirements 2.4, 5.1**

---

### Property 3: Modal blocks submission for whitespace-only input

*For any* string composed entirely of whitespace characters (including empty string), the CreateFamilyTreeModal submit button SHALL be disabled and `onSubmit` SHALL NOT be invoked.

**Validates: Requirements 2.5, 2.6, 5.2, 5.3**

---

### Property 4: addFamilyTree length invariant

*For any* sequence of N calls to `addFamilyTree` with valid names, `familyTrees.length` SHALL equal N.

**Validates: Requirements 3.3**

---

### Property 5: addFamilyTree name preservation invariant

*For any* non-empty string `name`, the FamilyTree stored by `addFamilyTree(name)` SHALL have `name` equal to `name.trim()`.

**Validates: Requirements 3.4, 8.3**

---

### Property 6: addFamilyTree prepend invariant

*For any* sequence of `addFamilyTree` calls, the most recently added FamilyTree SHALL always be at index 0 of `familyTrees`.

**Validates: Requirements 3.2**

---

### Property 7: addFamilyTree unique ID invariant

*For any* sequence of N `addFamilyTree` calls, all resulting `id` values SHALL be unique (no duplicates).

**Validates: Requirements 3.5, 8.2**

---

### Property 8: addFamilyTree correct shape invariant

*For any* valid name and ownerId, the FamilyTree created by `addFamilyTree(name, ownerId)` SHALL have `totalMembers === 0`, a valid ISO 8601 `createdAt` string, a valid ISO 8601 `updatedAt` string equal to `createdAt`, a non-empty `id`, `name === name.trim()`, `ownerId` equal to the provided ownerId, `description === null`, and `coverImage === null`.

**Validates: Requirements 3.6, 3.7, 3.8, 8.1, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9**

---

### Property 9: removeFamilyTree idempotency invariant

*For any* `id`, calling `removeFamilyTree(id)` twice SHALL produce the same `familyTrees` state as calling it once.

**Validates: Requirements 3.12**

---

### Property 10: removeFamilyTree preserves other entries invariant

*For any* FamilyTreeStore state with N entries, calling `removeFamilyTree(id)` for one entry SHALL leave all other N-1 entries unchanged and in their original order.

**Validates: Requirements 3.11**

---

### Property 11: validateFamilyTreeName correctness invariant

*For any* string `name`, `validateFamilyTreeName(name)` SHALL return `true` if and only if `name.trim().length >= 1`.

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 12: formatRelativeDate format invariant

*For any* valid ISO 8601 date string, `formatRelativeDate` SHALL return a non-empty string that starts with `"Dibuat "`.

**Validates: Requirements 6.3, 6.4**

---

### Property 13: FamilyTreeCard renders all required data

*For any* valid `FamilyTree` object, the FamilyTreeCard SHALL render `item.name`, the string `"${item.totalMembers} Anggota"`, and a relative date string starting with `"Dibuat "`.

**Validates: Requirements 4.1, 4.2, 4.3**

---

### Property 14: FamilyTreeCard onPress passes correct id

*For any* valid `FamilyTree` object, pressing the FamilyTreeCard SHALL invoke `onPress` with exactly `item.id`.

**Validates: Requirements 4.4**

---

### Property 15: Member correct shape invariant

*For any* Member object created via `addMember`, the member SHALL have a non-empty `id`, a non-empty `fullName`, a `gender` value of exactly `"male"` or `"female"`, a non-empty `role` string, `spouseIds` and `childrenIds` as arrays, and a valid ISO 8601 `createdAt` string.

**Validates: Requirements 9.1, 9.2, 9.4, 9.5, 9.6, 9.12, 9.13, 9.14**

---

### Property 16: Member familyTreeId consistency invariant

*For any* Member added to a FamilyTree, `member.familyTreeId` SHALL equal the target FamilyTree's `id`.

**Validates: Requirements 9.3, 10.3**

---

### Property 17: addMember increments totalMembers invariant

*For any* sequence of N calls to `addMember` on the same FamilyTree, the FamilyTree's `totalMembers` SHALL equal N.

**Validates: Requirements 3.15**

---

### Property 18: Member birthDate format invariant

*For any* Member whose `birthDate` is non-null, `birthDate` SHALL match the pattern `"YYYY-MM-DD"` and SHALL be parseable as a valid calendar date.

**Validates: Requirements 9.7**

---

### Property 19: Spouse relationship symmetry invariant

*For any* two Members A and B in the same FamilyTree, if A's `spouseIds` contains B's `id`, then B's `spouseIds` SHALL contain A's `id`.

**Validates: Requirements 10.1**

---

### Property 20: Parent-child relationship consistency invariant

*For any* two Members A and B in the same FamilyTree, if A's `childrenIds` contains B's `id`, then B's `fatherId` or B's `motherId` SHALL equal A's `id`.

**Validates: Requirements 10.2**
