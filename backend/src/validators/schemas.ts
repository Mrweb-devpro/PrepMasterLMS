import { z } from "zod";

export const uuid = z.string().uuid();
export const idParam = z.object({ id: uuid });
const category = z.enum(["lecture-notes", "past-questions", "textbooks"]);
const slug = z.string().regex(/^[a-z0-9-]+$/).max(60);

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
  })).min(1).max(300),
});

export const updateCbtBody = z.object({
  published: z.boolean().optional(),
  revealResults: z.boolean().optional(),
  paused: z.boolean().optional(),
  title: z.string().min(3).max(150).optional(),
  durationMinutes: z.number().int().min(1).max(600).optional(),
  opensAt: z.string().datetime().optional(),
  priceKobo: z.number().int().min(0).optional(),
  maxAttempts: z.number().int().min(1).nullable().optional(),
  /** Full replacement list. Items with an id are updated; new ones are inserted; missing ones are deleted. */
  questions: z.array(z.object({
    id: uuid.optional(),
    text: z.string().min(1).max(2000),
    options: z.array(z.string().min(1).max(500)).min(2).max(6),
    answerIndex: z.number().int().min(0),
    topic: z.string().max(100).optional(),
  })).min(1).max(300).optional(),
});

// ---------- Courses ----------
export const createCourseBody = z.object({
  slug,
  code: z.string().min(2).max(20),
  title: z.string().min(3).max(150),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#3b6cff"),
  description: z.string().max(2000).default(""),
  subfolders: z.array(z.object({ category, slug, name: z.string().min(1).max(80) })).max(100).default([]),
});

export const subfolderBody = z.object({ category, slug, name: z.string().min(1).max(80) });

export const uploadBody = z.object({ fileName: z.string().min(1).max(200), contentType: z.string().min(1).max(100) });

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
});
export const swQuestionPatchBody = swQuestionBody.partial();
export const swResponseBody = z.object({ body: z.string().min(1).max(5000) });
