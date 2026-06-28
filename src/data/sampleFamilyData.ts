/**
 * Sample family-tree data for local testing (DEV only).
 *
 * Two illustrative trees based on widely-public information about Indonesian
 * public figures (Joko Widodo & Prabowo Subianto). Relationships are kept
 * internally consistent (symmetric spouse links; childrenIds ↔ father/mother)
 * so the layout engine renders couple + parent-child edges correctly.
 *
 * This is sample/illustrative data for testing the visualization — not an
 * authoritative genealogical record.
 *
 * @module src/data/sampleFamilyData
 */

/** A member spec without server-managed timestamps. */
export interface SampleMember {
  id: string;
  familyTreeId: string;
  fullName: string;
  gender: 'male' | 'female';
  role: string;
  birthDate: string | null;
  status: 'living' | 'deceased';
  deathDate: string | null;
  photoUrl: string | null;
  bio: string | null;
  fatherId: string | null;
  motherId: string | null;
  spouseIds: string[];
  childrenIds: string[];
}

export interface SampleTree {
  id: string;
  name: string;
  description: string | null;
  members: SampleMember[];
}

function m(
  treeId: string,
  id: string,
  fullName: string,
  gender: 'male' | 'female',
  role: string,
  rel: Partial<Pick<SampleMember, 'birthDate' | 'status' | 'deathDate' | 'fatherId' | 'motherId' | 'spouseIds' | 'childrenIds' | 'bio'>> = {},
): SampleMember {
  return {
    id: `${treeId}_${id}`,
    familyTreeId: treeId,
    fullName,
    gender,
    role,
    birthDate: rel.birthDate ?? null,
    status: rel.status ?? 'living',
    deathDate: rel.deathDate ?? null,
    photoUrl: null,
    bio: rel.bio ?? null,
    fatherId: rel.fatherId ? `${treeId}_${rel.fatherId}` : null,
    motherId: rel.motherId ? `${treeId}_${rel.motherId}` : null,
    spouseIds: (rel.spouseIds ?? []).map((s) => `${treeId}_${s}`),
    childrenIds: (rel.childrenIds ?? []).map((c) => `${treeId}_${c}`),
  };
}

// ---------------------------------------------------------------------------
// Tree 1 — Keluarga Jokowi
// ---------------------------------------------------------------------------

const JOKOWI = 'sample_jokowi';

const jokowiMembers: SampleMember[] = [
  m(JOKOWI, 'noto', 'Noto Mihardjo', 'male', 'Kakek', {
    status: 'deceased',
    childrenIds: ['jokowi'],
    spouseIds: ['sujiatmi'],
  }),
  m(JOKOWI, 'sujiatmi', 'Sujiatmi Notomihardjo', 'female', 'Nenek', {
    childrenIds: ['jokowi'],
    spouseIds: ['noto'],
  }),
  m(JOKOWI, 'jokowi', 'Joko Widodo', 'male', 'Ayah', {
    birthDate: '1961-06-21',
    fatherId: 'noto',
    motherId: 'sujiatmi',
    spouseIds: ['iriana'],
    childrenIds: ['gibran', 'kahiyang', 'kaesang'],
    bio: 'Presiden ke-7 Republik Indonesia.',
  }),
  m(JOKOWI, 'iriana', 'Iriana', 'female', 'Ibu', {
    spouseIds: ['jokowi'],
    childrenIds: ['gibran', 'kahiyang', 'kaesang'],
  }),
  m(JOKOWI, 'gibran', 'Gibran Rakabuming Raka', 'male', 'Anak', {
    fatherId: 'jokowi',
    motherId: 'iriana',
    spouseIds: ['selvi'],
  }),
  m(JOKOWI, 'selvi', 'Selvi Ananda', 'female', 'Menantu', {
    spouseIds: ['gibran'],
  }),
  m(JOKOWI, 'kahiyang', 'Kahiyang Ayu', 'female', 'Anak', {
    fatherId: 'jokowi',
    motherId: 'iriana',
    spouseIds: ['bobby'],
  }),
  m(JOKOWI, 'bobby', 'Bobby Nasution', 'male', 'Menantu', {
    spouseIds: ['kahiyang'],
  }),
  m(JOKOWI, 'kaesang', 'Kaesang Pangarep', 'male', 'Anak', {
    fatherId: 'jokowi',
    motherId: 'iriana',
    spouseIds: ['erina'],
  }),
  m(JOKOWI, 'erina', 'Erina Gudono', 'female', 'Menantu', {
    spouseIds: ['kaesang'],
  }),
];

// ---------------------------------------------------------------------------
// Tree 2 — Keluarga Prabowo
// ---------------------------------------------------------------------------

const PRABOWO = 'sample_prabowo';

const prabowoMembers: SampleMember[] = [
  m(PRABOWO, 'margono', 'Margono Djojohadikusumo', 'male', 'Kakek Buyut', {
    status: 'deceased',
    childrenIds: ['soemitro'],
  }),
  m(PRABOWO, 'soemitro', 'Soemitro Djojohadikoesoemo', 'male', 'Kakek', {
    status: 'deceased',
    fatherId: 'margono',
    spouseIds: ['dora'],
    childrenIds: ['prabowo', 'hashim'],
    bio: 'Ekonom dan begawan ekonomi Indonesia.',
  }),
  m(PRABOWO, 'dora', 'Dora Marie Sigar', 'female', 'Nenek', {
    spouseIds: ['soemitro'],
    childrenIds: ['prabowo', 'hashim'],
  }),
  m(PRABOWO, 'prabowo', 'Prabowo Subianto', 'male', 'Ayah', {
    birthDate: '1951-10-17',
    fatherId: 'soemitro',
    motherId: 'dora',
    spouseIds: ['titiek'],
    childrenIds: ['didit'],
    bio: 'Presiden ke-8 Republik Indonesia.',
  }),
  m(PRABOWO, 'titiek', 'Siti Hediati Hariyadi', 'female', 'Ibu', {
    spouseIds: ['prabowo'],
    childrenIds: ['didit'],
  }),
  m(PRABOWO, 'hashim', 'Hashim Djojohadikusumo', 'male', 'Anak', {
    fatherId: 'soemitro',
    motherId: 'dora',
  }),
  m(PRABOWO, 'didit', 'Didit Hediprasetyo', 'male', 'Anak', {
    fatherId: 'prabowo',
    motherId: 'titiek',
  }),
];

// ---------------------------------------------------------------------------
// Tree 3 — Keluarga Soekarno
// ---------------------------------------------------------------------------

const SOEKARNO = 'sample_soekarno';

const soekarnoMembers: SampleMember[] = [
  m(SOEKARNO, 'soekarno', 'Soekarno', 'male', 'Ayah', {
    status: 'deceased',
    spouseIds: ['fatmawati'],
    childrenIds: ['guntur', 'megawati', 'rachmawati', 'sukmawati', 'guruh'],
    bio: 'Presiden pertama Republik Indonesia.',
  }),
  m(SOEKARNO, 'fatmawati', 'Fatmawati', 'female', 'Ibu', {
    status: 'deceased',
    spouseIds: ['soekarno'],
    childrenIds: ['guntur', 'megawati', 'rachmawati', 'sukmawati', 'guruh'],
  }),
  m(SOEKARNO, 'guntur', 'Guntur Soekarnoputra', 'male', 'Anak', {
    fatherId: 'soekarno',
    motherId: 'fatmawati',
  }),
  m(SOEKARNO, 'megawati', 'Megawati Soekarnoputri', 'female', 'Anak', {
    fatherId: 'soekarno',
    motherId: 'fatmawati',
    spouseIds: ['taufiq'],
    childrenIds: ['puan'],
    bio: 'Presiden ke-5 Republik Indonesia.',
  }),
  m(SOEKARNO, 'taufiq', 'Taufiq Kiemas', 'male', 'Menantu', {
    status: 'deceased',
    spouseIds: ['megawati'],
    childrenIds: ['puan'],
  }),
  m(SOEKARNO, 'puan', 'Puan Maharani', 'female', 'Cucu', {
    fatherId: 'taufiq',
    motherId: 'megawati',
  }),
  m(SOEKARNO, 'rachmawati', 'Rachmawati Soekarnoputri', 'female', 'Anak', {
    status: 'deceased',
    fatherId: 'soekarno',
    motherId: 'fatmawati',
  }),
  m(SOEKARNO, 'sukmawati', 'Sukmawati Soekarnoputri', 'female', 'Anak', {
    fatherId: 'soekarno',
    motherId: 'fatmawati',
  }),
  m(SOEKARNO, 'guruh', 'Guruh Soekarnoputra', 'male', 'Anak', {
    fatherId: 'soekarno',
    motherId: 'fatmawati',
  }),
];

export const SAMPLE_TREES: SampleTree[] = [
  {
    id: JOKOWI,
    name: 'Keluarga Jokowi',
    description: 'Contoh pohon keluarga (data ilustratif publik).',
    members: jokowiMembers,
  },
  {
    id: PRABOWO,
    name: 'Keluarga Prabowo',
    description: 'Contoh pohon keluarga (data ilustratif publik).',
    members: prabowoMembers,
  },
  {
    id: 'sample_soekarno',
    name: 'Keluarga Soekarno',
    description: 'Contoh pohon keluarga (data ilustratif publik).',
    members: soekarnoMembers,
  },
];

// ---------------------------------------------------------------------------
// Lookups / summaries (for the Home "Jelajahi" showcase row)
// ---------------------------------------------------------------------------

export interface ShowcaseSummary {
  id: string;
  name: string;
  memberCount: number;
}

/** Lightweight list for rendering the showcase cards. */
export const SHOWCASE_SUMMARIES: ShowcaseSummary[] = SAMPLE_TREES.map((t) => ({
  id: t.id,
  name: t.name,
  memberCount: t.members.length,
}));

/** Returns a sample tree by id, or undefined. */
export function getSampleTree(id: string): SampleTree | undefined {
  return SAMPLE_TREES.find((t) => t.id === id);
}
