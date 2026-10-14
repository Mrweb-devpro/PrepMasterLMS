// Mock data for the PrepMaster prototype. No backend — everything is local.

export type FileType = "pdf" | "doc" | "slides" | "video" | "image";

export type CategorySlug = "lecture-notes" | "past-questions" | "textbooks";

export interface DriveFile {
  id: string;
  name: string;
  type: FileType;
  size: string;
  addedAt: string;
  paid: boolean;
  price?: number;
  courseSlug: string;
  category: CategorySlug;
  subfolderSlug: string;
}

export interface Subfolder {
  slug: string;
  name: string;
}

export interface Course {
  /** Database id (real backend only). */
  id?: string;
  slug: string;
  code: string;
  title: string;
  color: string;
  subfolders: Record<CategorySlug, Subfolder[]>;
}

export interface Question {
  id: string;
  courseSlug: string;
  text: string;
  options: string[];
  answerIndex: number;
  topic?: string;
}

export type CbtStatus = "upcoming" | "live" | "past-results-held" | "past-results-shown";

export interface Cbt {
  id: string;
  title: string;
  courseSlug: string;
  kind: "practice" | "live";
  paid: boolean;
  price?: number;
  questionCount: number;
  minutes: number;
  retakePolicy: string;
  status?: CbtStatus;
  scheduledFor?: string;
  revealResults?: boolean;
  score?: number;
  /** Real backend only: hidden from students until published. */
  published?: boolean;
  /** Admin set it to "Pending release": students see it but can't start it. */
  paused?: boolean;
  /** Real backend only: how many times the student has started it. */
  myAttempts?: number;
  questions: Question[];
}

export interface Transaction {
  id: string;
  student: string;
  item: string;
  amount: number;
  status: "verified" | "initiated" | "failed";
  date: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  verified: boolean;
}

export const CATEGORIES: { slug: CategorySlug; name: string }[] = [
  { slug: "lecture-notes", name: "Lecture Notes" },
  { slug: "past-questions", name: "Past Questions" },
  { slug: "textbooks", name: "Textbooks" },
];

export const courses: Course[] = [
  {
    slug: "biology",
    code: "BIO 101",
    title: "General Biology",
    color: "#1a9c6b",
    subfolders: {
      "lecture-notes": [
        { slug: "cell-biology", name: "Cell Biology" },
        { slug: "genetics", name: "Genetics" },
        { slug: "ecology", name: "Ecology" },
      ],
      "past-questions": [
        { slug: "2023", name: "2023 Papers" },
        { slug: "2024", name: "2024 Papers" },
      ],
      textbooks: [
        { slug: "core-texts", name: "Core Texts" },
        { slug: "supplementary", name: "Supplementary" },
      ],
    },
  },
  {
    slug: "chemistry",
    code: "CHM 102",
    title: "Organic Chemistry",
    color: "#2f27ce",
    subfolders: {
      "lecture-notes": [
        { slug: "hydrocarbons", name: "Hydrocarbons" },
        { slug: "reaction-mechanisms", name: "Reaction Mechanisms" },
      ],
      "past-questions": [
        { slug: "2023", name: "2023 Papers" },
        { slug: "2024", name: "2024 Papers" },
        { slug: "mock-sets", name: "Mock Sets" },
      ],
      textbooks: [
        { slug: "core-texts", name: "Core Texts" },
        { slug: "lab-manuals", name: "Lab Manuals" },
      ],
    },
  },
  {
    slug: "physics",
    code: "PHY 103",
    title: "Mechanics & Waves",
    color: "#443dff",
    subfolders: {
      "lecture-notes": [
        { slug: "kinematics", name: "Kinematics" },
        { slug: "waves", name: "Waves & Sound" },
      ],
      "past-questions": [
        { slug: "2022", name: "2022 Papers" },
        { slug: "2024", name: "2024 Papers" },
      ],
      textbooks: [
        { slug: "core-texts", name: "Core Texts" },
        { slug: "problem-sets", name: "Problem Sets" },
      ],
    },
  },
  {
    slug: "mathematics",
    code: "MTH 104",
    title: "Calculus I",
    color: "#c53030",
    subfolders: {
      "lecture-notes": [
        { slug: "limits", name: "Limits & Continuity" },
        { slug: "differentiation", name: "Differentiation" },
        { slug: "integration", name: "Integration" },
      ],
      "past-questions": [
        { slug: "2023", name: "2023 Papers" },
        { slug: "2024", name: "2024 Papers" },
      ],
      textbooks: [{ slug: "core-texts", name: "Core Texts" }],
    },
  },
];

let fileSeq = 0;
function mkFile(
  courseSlug: string,
  category: CategorySlug,
  subfolderSlug: string,
  name: string,
  type: FileType,
  paid: boolean,
  addedAt: string,
  size = "1.4 MB",
): DriveFile {
  fileSeq += 1;
  return {
    id: `file-${fileSeq}`,
    name,
    type,
    size,
    addedAt,
    paid,
    ...(paid ? { price: 1500 } : {}),
    courseSlug,
    category,
    subfolderSlug,
  };
}

export const files: DriveFile[] = [
  mkFile(
    "biology",
    "lecture-notes",
    "cell-biology",
    "Cell Structure & Function.pdf",
    "pdf",
    false,
    "2026-09-21",
  ),
  mkFile(
    "biology",
    "lecture-notes",
    "cell-biology",
    "Mitosis vs Meiosis (slides).pptx",
    "slides",
    true,
    "2026-09-19",
    "6.2 MB",
  ),
  mkFile(
    "biology",
    "lecture-notes",
    "genetics",
    "Mendelian Inheritance.pdf",
    "pdf",
    false,
    "2026-09-14",
  ),
  mkFile(
    "biology",
    "lecture-notes",
    "ecology",
    "Population Dynamics notes.docx",
    "doc",
    false,
    "2026-09-02",
  ),
  mkFile(
    "biology",
    "past-questions",
    "2024",
    "BIO101 2024 Final.pdf",
    "pdf",
    true,
    "2026-09-24",
    "820 KB",
  ),
  mkFile(
    "biology",
    "past-questions",
    "2023",
    "BIO101 2023 Final + Solutions.pdf",
    "pdf",
    true,
    "2026-08-30",
  ),
  mkFile(
    "biology",
    "textbooks",
    "core-texts",
    "Campbell Biology (excerpt).pdf",
    "pdf",
    true,
    "2026-08-11",
    "18 MB",
  ),
  mkFile(
    "biology",
    "textbooks",
    "supplementary",
    "Diagram pack.png",
    "image",
    false,
    "2026-08-04",
    "3.1 MB",
  ),

  mkFile(
    "chemistry",
    "lecture-notes",
    "hydrocarbons",
    "Alkanes & Alkenes.pdf",
    "pdf",
    false,
    "2026-09-25",
  ),
  mkFile(
    "chemistry",
    "lecture-notes",
    "reaction-mechanisms",
    "SN1 & SN2 walkthrough.mp4",
    "video",
    true,
    "2026-09-23",
    "142 MB",
  ),
  mkFile(
    "chemistry",
    "lecture-notes",
    "reaction-mechanisms",
    "Mechanism cheat sheet.pdf",
    "pdf",
    false,
    "2026-09-16",
  ),
  mkFile(
    "chemistry",
    "past-questions",
    "2024",
    "CHM102 2024 Mid-semester.pdf",
    "pdf",
    false,
    "2026-09-12",
  ),
  mkFile("chemistry", "past-questions", "mock-sets", "Mock Set A.pdf", "pdf", true, "2026-09-05"),
  mkFile(
    "chemistry",
    "textbooks",
    "lab-manuals",
    "Organic Lab Manual.pdf",
    "pdf",
    false,
    "2026-07-29",
    "9.4 MB",
  ),

  mkFile("physics", "lecture-notes", "kinematics", "Motion in 1D.pdf", "pdf", false, "2026-09-26"),
  mkFile(
    "physics",
    "lecture-notes",
    "waves",
    "Standing Waves (slides).pptx",
    "slides",
    true,
    "2026-09-18",
    "4.8 MB",
  ),
  mkFile("physics", "past-questions", "2024", "PHY103 2024 Final.pdf", "pdf", true, "2026-09-10"),
  mkFile(
    "physics",
    "textbooks",
    "problem-sets",
    "200 Solved Problems.pdf",
    "pdf",
    true,
    "2026-08-22",
    "11 MB",
  ),

  mkFile(
    "mathematics",
    "lecture-notes",
    "differentiation",
    "Chain Rule & Applications.pdf",
    "pdf",
    false,
    "2026-09-22",
  ),
  mkFile(
    "mathematics",
    "lecture-notes",
    "integration",
    "Integration Techniques.pdf",
    "pdf",
    true,
    "2026-09-20",
  ),
  mkFile(
    "mathematics",
    "lecture-notes",
    "limits",
    "Limits intro notes.docx",
    "doc",
    false,
    "2026-09-08",
  ),
  mkFile(
    "mathematics",
    "past-questions",
    "2024",
    "MTH104 2024 Final.pdf",
    "pdf",
    true,
    "2026-09-15",
  ),
  mkFile(
    "mathematics",
    "textbooks",
    "core-texts",
    "Stewart Calculus (excerpt).pdf",
    "pdf",
    true,
    "2026-07-18",
    "22 MB",
  ),
];

function q(
  id: string,
  courseSlug: string,
  text: string,
  options: string[],
  answerIndex: number,
): Question {
  return { id, courseSlug, text, options, answerIndex };
}

const bioQuestions: Question[] = [
  q(
    "bq1",
    "biology",
    "Which organelle is the site of aerobic respiration?",
    ["Ribosome", "Mitochondrion", "Golgi body", "Lysosome"],
    1,
  ),
  q(
    "bq2",
    "biology",
    "DNA replication is best described as:",
    ["Conservative", "Semi-conservative", "Dispersive", "Fragmentary"],
    1,
  ),
  q(
    "bq3",
    "biology",
    "A cross between two heterozygotes gives a phenotypic ratio of:",
    ["1:1", "3:1", "9:3:3:1", "2:1"],
    1,
  ),
  q(
    "bq4",
    "biology",
    "Which structure controls what enters and leaves the cell?",
    ["Cell wall", "Nucleus", "Plasma membrane", "Vacuole"],
    2,
  ),
  q(
    "bq5",
    "biology",
    "Energy flow in an ecosystem is:",
    ["Cyclic", "Unidirectional", "Bidirectional", "Random"],
    1,
  ),
];

const chmQuestions: Question[] = [
  q(
    "cq1",
    "chemistry",
    "The general formula of alkanes is:",
    ["CnH2n", "CnH2n+2", "CnH2n-2", "CnHn"],
    1,
  ),
  q(
    "cq2",
    "chemistry",
    "An SN2 reaction proceeds with:",
    ["Retention", "Racemisation", "Inversion of configuration", "No stereochemical change"],
    2,
  ),
  q(
    "cq3",
    "chemistry",
    "Which reagent is used for markovnikov addition of water?",
    ["BH3/H2O2", "H2O/H2SO4", "OsO4", "LiAlH4"],
    1,
  ),
  q(
    "cq4",
    "chemistry",
    "Benzene undergoes mainly:",
    ["Addition", "Electrophilic substitution", "Elimination", "Nucleophilic addition"],
    1,
  ),
];

const phyQuestions: Question[] = [
  q("pq1", "physics", "The SI unit of impulse is:", ["N", "N·s", "J", "W"], 1),
  q(
    "pq2",
    "physics",
    "For simple harmonic motion, acceleration is proportional to:",
    ["Velocity", "Displacement", "Time", "Mass"],
    1,
  ),
  q(
    "pq3",
    "physics",
    "A wave of frequency 50 Hz and wavelength 2 m travels at:",
    ["25 m/s", "52 m/s", "100 m/s", "200 m/s"],
    2,
  ),
  q(
    "pq4",
    "physics",
    "Terminal velocity occurs when:",
    ["Drag exceeds weight", "Net force is zero", "Acceleration is maximum", "Mass is zero"],
    1,
  ),
];

const mthQuestions: Question[] = [
  q("mq1", "mathematics", "d/dx (sin x) equals:", ["cos x", "-cos x", "sin x", "-sin x"], 0),
  q("mq2", "mathematics", "∫ 2x dx equals:", ["x² + C", "2x² + C", "x + C", "2 + C"], 0),
  q("mq3", "mathematics", "lim(x→0) sin x / x equals:", ["0", "1", "∞", "Undefined"], 1),
  q(
    "mq4",
    "mathematics",
    "The derivative of e^{2x} is:",
    ["e^{2x}", "2e^{2x}", "2x e^{2x}", "e^{x}"],
    1,
  ),
];

export const questionBank: Question[] = [
  ...bioQuestions,
  ...chmQuestions,
  ...phyQuestions,
  ...mthQuestions,
];

export const cbts: Cbt[] = [
  {
    id: "cbt-bio-practice-1",
    title: "Cell Biology Practice Test",
    courseSlug: "biology",
    kind: "practice",
    paid: false,
    questionCount: bioQuestions.length,
    minutes: 10,
    retakePolicy: "Unlimited retakes",
    questions: bioQuestions,
  },
  {
    id: "cbt-bio-practice-2",
    title: "Genetics Drill (Premium)",
    courseSlug: "biology",
    kind: "practice",
    paid: true,
    price: 2000,
    questionCount: bioQuestions.length,
    minutes: 15,
    retakePolicy: "3 attempts",
    questions: bioQuestions,
  },
  {
    id: "cbt-chm-practice-1",
    title: "Hydrocarbons Quick Test",
    courseSlug: "chemistry",
    kind: "practice",
    paid: false,
    questionCount: chmQuestions.length,
    minutes: 8,
    retakePolicy: "Unlimited retakes",
    questions: chmQuestions,
  },
  {
    id: "cbt-phy-practice-1",
    title: "Mechanics Warm-up",
    courseSlug: "physics",
    kind: "practice",
    paid: false,
    questionCount: phyQuestions.length,
    minutes: 10,
    retakePolicy: "Unlimited retakes",
    questions: phyQuestions,
  },
  {
    id: "cbt-mth-practice-1",
    title: "Calculus I Practice Set",
    courseSlug: "mathematics",
    kind: "practice",
    paid: true,
    price: 2500,
    questionCount: mthQuestions.length,
    minutes: 12,
    retakePolicy: "2 attempts",
    questions: mthQuestions,
  },
  {
    id: "cbt-bio-live-1",
    title: "BIO 101 Live Mock Exam",
    courseSlug: "biology",
    kind: "live",
    paid: true,
    price: 3500,
    questionCount: bioQuestions.length,
    minutes: 30,
    retakePolicy: "Single attempt",
    status: "live",
    scheduledFor: "2026-09-27T09:00:00Z",
    revealResults: true,
    questions: bioQuestions,
  },
  {
    id: "cbt-chm-live-1",
    title: "CHM 102 Live Mid-semester",
    courseSlug: "chemistry",
    kind: "live",
    paid: false,
    questionCount: chmQuestions.length,
    minutes: 45,
    retakePolicy: "Single attempt",
    status: "upcoming",
    scheduledFor: "2026-10-02T14:00:00Z",
    revealResults: false,
    questions: chmQuestions,
  },
  {
    id: "cbt-phy-live-1",
    title: "PHY 103 Live Test (Week 4)",
    courseSlug: "physics",
    kind: "live",
    paid: true,
    price: 3000,
    questionCount: phyQuestions.length,
    minutes: 40,
    retakePolicy: "Single attempt",
    status: "past-results-held",
    scheduledFor: "2026-09-18T10:00:00Z",
    revealResults: false,
    questions: phyQuestions,
  },
  {
    id: "cbt-mth-live-1",
    title: "MTH 104 Live Quiz",
    courseSlug: "mathematics",
    kind: "live",
    paid: false,
    questionCount: mthQuestions.length,
    minutes: 25,
    retakePolicy: "Single attempt",
    status: "past-results-shown",
    scheduledFor: "2026-09-12T11:00:00Z",
    revealResults: true,
    score: 75,
    questions: mthQuestions,
  },
];

export interface UnfinishedAttempt {
  cbtId: string;
  answered: number;
  total: number;
  lastOpened: string;
}

export const currentStudent = {
  id: "stu-001",
  name: "Dane Okonkwo",
  email: "dane.okonkwo@example.com",
  initials: "DO",
  joinedAt: "2026-06-12",
  emailVerified: false,
  ownedFileIds: ["file-5", "file-7", "file-13", "file-20"],
  ownedCbtIds: ["cbt-bio-live-1", "cbt-mth-practice-1"],
  unfinishedAttempts: [
    {
      cbtId: "cbt-chm-practice-1",
      answered: 2,
      total: chmQuestions.length,
      lastOpened: "2026-09-26",
    },
    {
      cbtId: "cbt-phy-practice-1",
      answered: 1,
      total: phyQuestions.length,
      lastOpened: "2026-09-24",
    },
  ] as UnfinishedAttempt[],
};

export const transactions: Transaction[] = [
  {
    id: "trx-1001",
    student: "Dane Okonkwo",
    item: "BIO101 2024 Final.pdf",
    amount: 1500,
    status: "verified",
    date: "2026-09-24 10:12",
  },
  {
    id: "trx-1002",
    student: "Dane Okonkwo",
    item: "BIO 101 Live Mock Exam",
    amount: 3500,
    status: "verified",
    date: "2026-09-20 16:40",
  },
  {
    id: "trx-1003",
    student: "Dane Okonkwo",
    item: "Calculus I Practice Set",
    amount: 2500,
    status: "verified",
    date: "2026-09-15 08:02",
  },
  {
    id: "trx-1004",
    student: "Dane Okonkwo",
    item: "Standing Waves (slides).pptx",
    amount: 1500,
    status: "failed",
    date: "2026-09-14 19:27",
  },
  {
    id: "trx-1005",
    student: "Amaka Bello",
    item: "200 Solved Problems.pdf",
    amount: 1500,
    status: "initiated",
    date: "2026-09-26 21:05",
  },
  {
    id: "trx-1006",
    student: "Tunde Adeyemi",
    item: "PHY 103 Live Test (Week 4)",
    amount: 3000,
    status: "verified",
    date: "2026-09-17 13:55",
  },
  {
    id: "trx-1007",
    student: "Zainab Musa",
    item: "Mock Set A.pdf",
    amount: 1500,
    status: "failed",
    date: "2026-09-11 07:31",
  },
];

export const students: Student[] = [
  {
    id: "stu-001",
    name: "Dane Okonkwo",
    email: "dane.okonkwo@example.com",
    joinedAt: "2026-06-12",
    verified: false,
  },
  {
    id: "stu-002",
    name: "Amaka Bello",
    email: "amaka.bello@example.com",
    joinedAt: "2026-05-30",
    verified: true,
  },
  {
    id: "stu-003",
    name: "Tunde Adeyemi",
    email: "tunde.adeyemi@example.com",
    joinedAt: "2026-07-04",
    verified: true,
  },
  {
    id: "stu-004",
    name: "Zainab Musa",
    email: "zainab.musa@example.com",
    joinedAt: "2026-08-19",
    verified: false,
  },
  {
    id: "stu-005",
    name: "Chidi Eze",
    email: "chidi.eze@example.com",
    joinedAt: "2026-09-01",
    verified: true,
  },
];

// ---- helpers ----
export const getCourse = (slug: string) => courses.find((c) => c.slug === slug);
export const getCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
export const getCbt = (id: string) => cbts.find((c) => c.id === id);
export const getFile = (id: string) => files.find((f) => f.id === id);

export const filesIn = (courseSlug: string, category?: CategorySlug, subfolderSlug?: string) =>
  files.filter(
    (f) =>
      f.courseSlug === courseSlug &&
      (!category || f.category === category) &&
      (!subfolderSlug || f.subfolderSlug === subfolderSlug),
  );

export const recentFiles = [...files]
  .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
  .slice(0, 8);

export const formatNaira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
