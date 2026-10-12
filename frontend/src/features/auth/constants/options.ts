export const LEVELS = ["100", "200", "300", "400", "500", "600", "Postgraduate"] as const;

export const HEARD_OPTIONS = [
  { value: "youtube", label: "YouTube" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X (Twitter)" },
  { value: "friend", label: "A friend" },
  { value: "school", label: "My school / lecturer" },
  { value: "google", label: "Google search" },
  { value: "other", label: "Other" },
] as const;

export const heardLabel = (v?: string) =>
  HEARD_OPTIONS.find((o) => o.value === v)?.label ?? v ?? "—";

/** Normalises a `?heard=` value from a shared link into a known option (or undefined). */
export const parseHeard = (v: unknown) =>
  typeof v === "string" && HEARD_OPTIONS.some((o) => o.value === v.toLowerCase())
    ? v.toLowerCase()
    : undefined;

/** UNILAG faculties we serve; the faculty decides which departments show. */
export const FACULTIES: Record<string, string[]> = {
  Engineering: [
    "Biomedical Engineering",
    "Chemical Engineering",
    "Civil and Environmental Engineering",
    "Computer Engineering",
    "Electrical and Electronics Engineering",
    "Mechanical Engineering",
    "Metallurgical and Materials Engineering",
    "Petroleum and Gas Engineering",
    "Surveying and Geoinformatics",
    "Systems Engineering",
  ],
  Science: [
    "Biochemistry",
    "Botany",
    "Cell Biology and Genetics",
    "Chemistry",
    "Computer Science",
    "Fisheries",
    "Geosciences",
    "Marine Sciences",
    "Mathematics",
    "Microbiology",
    "Physics",
    "Statistics",
    "Zoology",
  ],
  "Environmental Sciences": [
    "Architecture",
    "Building",
    "Estate Management",
    "Quantity Surveying",
    "Urban and Regional Planning",
  ],
};

export const FACULTY_NAMES = Object.keys(FACULTIES);
