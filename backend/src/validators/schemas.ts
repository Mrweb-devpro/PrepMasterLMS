import { z } from "zod";

export const uuid = z.string().uuid();
export const idParam = z.object({ id: uuid });
const category = z.enum(["lecture-notes", "past-questions", "textbooks"]);
const slug = z.string().regex(/^[a-z0-9-]+$/).max(60);
const courseLevel = z.enum(["100", "200", "300", "400", "500", "600", "Postgraduate", "all"]);

// ---------- Profile ----------
const optionalText = (max: number) => z.string().max(max).nullable().optional();
export const updateMeBody = z.object({
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).nullable().optional(),
  avatarUrl: z.string().url().max(500).nullable().optional(),
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
  faculty: optionalText(100),
  department: optionalText(120),
  level: optionalText(10),
  dob: z.string().date().nullable().optional(),
  heard: optionalText(60),
  userType: z.enum(["student", "freelancer"]).nullable().optional(),
});
export const swRegisterBody = z.object({
  userType: z.enum(["student", "freelancer"]),
  heard: optionalText(60),
});
export const checkEmailBody = z.object({ email: z.string().trim().email().max(320) });

// ---------- CBTs ----------
export const saveAnswerBody = z.object({ questionId: uuid, selectedIndex: z.number().int().min(0).max(5) });
export const submitAttemptBody = z.object({
  flaggedQuestionIds: z.array(uuid).max(300).optional(),
});

export const createCbtBody = z.object({
  courseId: uuid,
  title: z.string().min(3).max(150),
  mode: z.enum(["practice", "live"]),
  durationMinutes: z.number().int().min(1).max(600),
  opensAt: z.string().datetime().optional(),
  closesAt: z.string().datetime().optional(),
  priceKobo: z.number().int().min(0).default(0),
  maxAttempts: z.number().int().min(1).nullable().default(null),
  revealResults: z.boolean().default(true),
  published: z.boolean().default(true),
  questions: z.array(z.object({
    text: z.string().min(1).max(2000),
    options: z.array(z.string().min(1).max(500)).min(2).max(6),
    answerIndex: z.number().int().min(0),
    topic: z.string().max(100).optional(),
    explanation: z.string().max(5000).optional(),
  })).min(1).max(300),
}).superRefine((value, ctx) => {
  if (value.mode !== "live") return;
  if (!value.closesAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["closesAt"], message: "Live CBTs need a closing time." });
    return;
  }
  const opensAt = value.opensAt ? new Date(value.opensAt).getTime() : Date.now();
  if (new Date(value.closesAt).getTime() <= opensAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["closesAt"], message: "Closing time must be after the opening time." });
  }
});

export const updateCbtBody = z.object({
  published: z.boolean().optional(),
  revealResults: z.boolean().optional(),
  paused: z.boolean().optional(),
  title: z.string().min(3).max(150).optional(),
  durationMinutes: z.number().int().min(1).max(600).optional(),
  opensAt: z.string().datetime().optional(),
  closesAt: z.string().datetime().nullable().optional(),
  priceKobo: z.number().int().min(0).optional(),
  maxAttempts: z.number().int().min(1).nullable().optional(),
  /** Full replacement list. Items with an id are updated; new ones are inserted; missing ones are deleted. */
  questions: z.array(z.object({
    id: uuid.optional(),
    text: z.string().min(1).max(2000),
    options: z.array(z.string().min(1).max(500)).min(2).max(6),
    answerIndex: z.number().int().min(0),
    topic: z.string().max(100).optional(),
    explanation: z.string().max(5000).optional(),
  })).min(1).max(300).optional(),
});

// ---------- Courses ----------
export const createCourseBody = z.object({
  slug,
  code: z.string().min(2).max(20),
  title: z.string().min(3).max(150),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#3b6cff"),
  description: z.string().max(2000).default(""),
  level: courseLevel.default("all"),
  departments: z.array(z.string().min(1).max(120)).max(100).default([]),
  subfolders: z.array(z.object({ category, slug, name: z.string().min(1).max(80) })).max(100).default([]),
});

export const updateCourseBody = z.object({
  code: z.string().min(2).max(20).optional(),
  title: z.string().min(3).max(150).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  description: z.string().max(2000).optional(),
  level: courseLevel.optional(),
  departments: z.array(z.string().min(1).max(120)).max(100).optional(),
  subfolders: z.array(z.object({ category, slug, name: z.string().min(1).max(80) })).max(100).optional(),
});

// ---------- Competitions ----------
const competitionQuestion = z.object({
  text: z.string().min(1).max(2000),
  options: z.array(z.string().min(1).max(500)).length(4),
  answerIndex: z.number().int().min(0).max(3),
  topic: z.string().max(100).optional(),
  explanation: z.string().max(5000).optional(),
});
export const competitionBody = z.object({
  prizeDescription: z.string().max(2000).default(""),
  title: z.string().min(3).max(150),
  description: z.string().max(2_000).default(""),
  courseId: uuid.nullable().optional(),
  cbtId: uuid.nullable().optional(),
  startsAt: z.string().datetime(),
  durationMinutes: z.number().int().min(1).max(600).default(30),
  level: courseLevel.default("all"),
  prizePoolNaira: z.number().int().min(0).default(0),
  questionSource: z.enum(["bank", "custom"]).default("bank"),
  questionLimit: z.number().int().min(1).max(300).nullable().optional(),
  customQuestions: z.array(competitionQuestion).min(1).max(300).optional(),
});
export const competitionAnswerBody = z.object({
  questionId: uuid,
  selectedIndex: z.number().int().min(0).max(5),
});

export const subfolderBody = z.object({ category, slug, name: z.string().min(1).max(80) });

export const uploadBody = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.string().min(1).max(100),
  type: z.enum(["submission", "question"]).default("submission"),
});

export const materialBody = z.object({
  category,
  subfolder: z.string().max(100).default(""),
  title: z.string().min(1).max(200),
  fileType: z.enum(["pdf", "doc", "slides", "video", "image"]).default("pdf"),
  r2Key: z.string().min(1),
  sizeBytes: z.number().int().min(0),
  priceKobo: z.number().int().min(0).default(0),
});

export const updateMaterialBody = z.object({
  title: z.string().min(1).max(200).optional(),
  category: category.optional(),
  subfolder: z.string().max(100).optional(),
  priceKobo: z.number().int().min(0).optional(),
});

// ---------- Moderation ----------
export const moderationBody = z.object({ ids: z.array(uuid).min(1).max(300), reason: z.string().min(3).max(500) });
export const restoreBody = z.object({ ids: z.array(uuid).min(1).max(300) });

// ---------- Payments ----------
export const checkoutBody = z.object({
  itemType: z.enum(["material", "cbt"]),
  itemId: uuid,
  callbackUrl: z.string().url().optional(),
});
export const referenceParam = z.object({ reference: z.string().min(1).max(100) });

// ---------- SolidWorks ----------
export const swTaskBody = z.object({
  title: z.string().min(2).max(150),
  summary: z.string().max(300).default(""),
  description: z.string().max(5000).default(""),
  steps: z.array(z.string().min(1).max(500)).max(50).default([]),
  videoUrl: z.string().url().optional().or(z.literal("")),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  targetMass: z.number().positive().optional().nullable(),
  targetVolume: z.number().positive().optional().nullable(),
  tolerancePercent: z.number().positive().max(100).default(0.5),
});

export const swSubmissionBody = z.object({
  taskId: uuid,
  mass: z.string().min(1).max(50),
  volume: z.string().min(1).max(50),
  difficulty: z.enum(["easy", "medium", "hard", "super-hard"]),
  challenge: z.string().max(2000).default(""),
  files: z.array(z.object({
    name: z.string().min(1).max(200),
    size: z.number().int().min(0),
    mime: z.string().max(100).optional(),
    r2Key: z.string().min(1).max(400),
  })).min(1).max(10),
});

export const swGradeBody = z.object({
  scores: z.object({ mass: z.number().int().min(0), volume: z.number().int().min(0), model: z.number().int().min(0) }),
  verdict: z.enum(["good", "needs-work"]),
  remarks: z.string().max(2000).default(""),
});

export const swQuestionBody = z.object({
  title: z.string().min(3).max(150),
  body: z.string().min(1).max(5000),
  taskIds: z.array(uuid).max(20).default([]),
  imageUrls: z.array(z.string().min(1).max(500)).max(2).default([]),
});
export const swQuestionPatchBody = swQuestionBody.partial();
export const swResponseBody = z.object({ body: z.string().min(1).max(5000) });
