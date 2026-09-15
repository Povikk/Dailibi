import { z } from "zod";

/**
 * DAILIBI - case data model.
 *
 * A case file lives as JSON under data/cases/ and contains three sections:
 *   - public:   everything the player may know BEFORE the accusation.
 *   - meta:     authoring metadata, never shown to the player.
 *   - solution: the secret truth, only ever read server-side and only
 *               returned after an accusation has been validated.
 *
 * The client bundle must never import a raw case file. Use the server-only
 * loader in src/server/caseStore.ts which projects `public` and strips
 * internals.
 */

export const DifficultySchema = z.enum(["FACILE", "NORMAL", "DIFFICILE"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

const id = z.string().min(1);
const clock = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "heure attendue au format HH:MM");

/* ------------------------------------------------------------------ */
/* Evidence: small visual documents rendered with HTML/CSS             */
/* ------------------------------------------------------------------ */

export const EvidenceSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("note"),
    body: z.string(),
    altText: z.string(),
  }),
  z.object({
    kind: z.literal("handwriting"),
    body: z.string(),
    altText: z.string(),
    signature: z.string().optional(),
  }),
  z.object({
    kind: z.literal("receipt"),
    merchant: z.string(),
    address: z.string().optional(),
    time: clock,
    lines: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
    total: z.string(),
    card: z.string().optional(),
    footer: z.string().optional(),
    altText: z.string(),
  }),
  z.object({
    kind: z.literal("sms"),
    contact: z.string(),
    channel: z.enum(["sms", "chat"]).default("sms"),
    messages: z
      .array(
        z.object({
          from: z.enum(["me", "them"]),
          text: z.string(),
          time: clock,
        }),
      )
      .min(1),
    altText: z.string(),
  }),
  z.object({
    kind: z.literal("email"),
    from: z.string(),
    to: z.string(),
    subject: z.string(),
    sentAt: z.string(),
    body: z.string(),
    altText: z.string(),
  }),
  z.object({
    kind: z.literal("photo"),
    caption: z.string(),
    meta: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
    altText: z.string(),
    tone: z.enum(["warm", "cold", "flat"]).default("flat"),
  }),
  z.object({
    kind: z.literal("camera"),
    location: z.string(),
    frames: z
      .array(z.object({ time: clock, text: z.string() }))
      .min(1),
    altText: z.string(),
  }),
  z.object({
    kind: z.literal("badge"),
    holder: z.string(),
    entries: z
      .array(
        z.object({
          time: clock,
          door: z.string(),
          direction: z.enum(["IN", "OUT"]),
        }),
      )
      .min(1),
    altText: z.string(),
  }),
  z.object({
    kind: z.literal("schedule"),
    title: z.string(),
    rows: z.array(z.object({ time: clock, label: z.string() })).min(1),
    altText: z.string(),
  }),
  z.object({
    kind: z.literal("callLog"),
    owner: z.string(),
    calls: z
      .array(
        z.object({
          time: clock,
          contact: z.string(),
          duration: z.string(),
          direction: z.enum(["IN", "OUT", "MISSED"]),
        }),
      )
      .min(1),
    altText: z.string(),
  }),
  z.object({
    kind: z.literal("map"),
    title: z.string(),
    description: z.string(),
    distances: z
      .array(z.object({ from: z.string(), to: z.string(), minutes: z.number().int().positive() }))
      .min(1),
    altText: z.string(),
  }),
  z.object({
    kind: z.literal("document"),
    title: z.string(),
    subtitle: z.string().optional(),
    paragraphs: z.array(z.string()).min(1),
    altText: z.string(),
  }),
]);
export type Evidence = z.infer<typeof EvidenceSchema>;

/* ------------------------------------------------------------------ */
/* Clues (public) + internal authoring analysis                        */
/* ------------------------------------------------------------------ */

export const ClueCategorySchema = z.enum([
  "DIRECT",
  "CIRCUMSTANTIAL",
  "TIMELINE",
  "BEHAVIORAL",
  "CONTRADICTION",
  "EXONERATING",
  "RED_HERRING",
]);
export type ClueCategory = z.infer<typeof ClueCategorySchema>;

/** Internal only, used by the validator and solvability matrix. */
export const ClueAnalysisSchema = z.object({
  category: ClueCategorySchema,
  implicates: z.array(id).default([]),
  clears: z.array(id).default([]),
  contradicts: z.array(id).default([]),
  supportsMotiveOf: z.array(id).default([]),
  supportsMethodOf: z.array(id).default([]),
  unlocksInterviewIds: z.array(id).default([]),
  /** A clue the culprit would rather not have in the file. */
  isRedHerring: z.boolean().default(false),
});
export type ClueAnalysis = z.infer<typeof ClueAnalysisSchema>;

export const ClueSchema = z.object({
  id,
  title: z.string(),
  /** Short label of where it came from, e.g. "TICKET DE CAISSE". */
  source: z.string(),
  summary: z.string(),
  evidence: EvidenceSchema,
  analysis: ClueAnalysisSchema,
});
export type Clue = z.infer<typeof ClueSchema>;

/** Public projection of a clue: no analysis, no category. */
export type PublicClue = Omit<Clue, "analysis">;

/* ------------------------------------------------------------------ */
/* Suspects                                                            */
/* ------------------------------------------------------------------ */

export const SuspectSchema = z.object({
  id,
  name: z.string(),
  age: z.number().int().min(0).max(120),
  occupation: z.string(),
  relation: z.string(),
  personality: z.string(),
  /** What the suspect claims out loud (may be a lie). */
  claimedAlibi: z.string(),
  /** One-line portrait accent for the UI. */
  accent: z.enum(["cold", "warm", "nervous", "formal", "blunt"]).default("formal"),
  /** Public facts the investigation filed on this person. */
  notes: z.array(z.string()).default([]),
});
export type Suspect = z.infer<typeof SuspectSchema>;

/* ------------------------------------------------------------------ */
/* Interviews: fixed questions, some unlocked by clues                 */
/* ------------------------------------------------------------------ */

export const InterviewSchema = z.object({
  id,
  suspectId: id,
  question: z.string(),
  answer: z.string(),
  /** Base questions have no unlock. Others require the clue to be found. */
  unlockedByClueId: id.optional(),
  /** Free-form hint shown after the answer, e.g. "Il évite l'heure exacte." */
  beat: z.string().optional(),
});
export type Interview = z.infer<typeof InterviewSchema>;

/* ------------------------------------------------------------------ */
/* Public timeline                                                     */
/* ------------------------------------------------------------------ */

export const PublicTimelineEntrySchema = z.object({
  time: clock,
  text: z.string(),
  source: z.string(),
  certainty: z.enum(["CERTAIN", "REPORTED", "ESTIMATED"]),
});
export type PublicTimelineEntry = z.infer<typeof PublicTimelineEntrySchema>;

/* ------------------------------------------------------------------ */
/* Accusation questions                                                */
/* ------------------------------------------------------------------ */

export const QuestionKindSchema = z.enum(["suspect", "motive", "method"]);
export type QuestionKind = z.infer<typeof QuestionKindSchema>;

export const AccusationOptionSchema = z.object({
  id,
  label: z.string(),
  /** Optional one-line reminder shown under the label. */
  hint: z.string().optional(),
});
export type AccusationOption = z.infer<typeof AccusationOptionSchema>;

export const AccusationQuestionSchema = z.object({
  id,
  kind: QuestionKindSchema,
  prompt: z.string(),
  options: z.array(AccusationOptionSchema).min(2),
  /** Optional question, does not block resolution. */
  optional: z.boolean().default(false),
});
export type AccusationQuestion = z.infer<typeof AccusationQuestionSchema>;

/* ------------------------------------------------------------------ */
/* Public case                                                         */
/* ------------------------------------------------------------------ */

export const PublicCaseSchema = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string(),
  subtitle: z.string(),
  location: z.string(),
  incident: z.string(),
  intro: z.string(),
  victim: z.object({
    /** Optional, only needed when the victim appears in the real timeline. */
    id: id.optional(),
    name: z.string(),
    description: z.string(),
  }),
  suspects: z.array(SuspectSchema).min(2).max(5),
  clues: z.array(ClueSchema).min(3),
  interviews: z.array(InterviewSchema),
  timeline: z.array(PublicTimelineEntrySchema),
  accusation: z.object({
    questions: z.array(AccusationQuestionSchema).min(3).max(5),
  }),
  difficulty: DifficultySchema,
  estimatedMinutes: z.number().int().positive(),
});
export type PublicCase = z.infer<typeof PublicCaseSchema>;

/* ------------------------------------------------------------------ */
/* Internal authoring metadata                                         */
/* ------------------------------------------------------------------ */

export const AuthorMetaSchema = z.object({
  crimeType: z.enum([
    "vol",
    "disparition",
    "sabotage",
    "fraude",
    "chantage",
    "empoisonnement",
    "objet_remplace",
    "accident_provoque",
    "faux_alibi",
    "mise_en_scene",
    "intrusion",
    "destruction_preuve",
    "tentative_meurtre",
    "meurtre",
  ]),
  locationType: z.string(),
  culpritGender: z.enum(["F", "M", "autre"]),
  motiveType: z.string(),
  methodType: z.string(),
  coreMechanic: z.string(),
});
export type AuthorMeta = z.infer<typeof AuthorMetaSchema>;

/* ------------------------------------------------------------------ */
/* Private solution                                                    */
/* ------------------------------------------------------------------ */

export const SolutionTimelineEntrySchema = z.object({
  time: clock,
  endTime: clock.optional(),
  place: z.string(),
  personIds: z.array(id).default([]),
  text: z.string(),
});
export type SolutionTimelineEntry = z.infer<typeof SolutionTimelineEntrySchema>;

export const PrivateSolutionSchema = z.object({
  culpritId: id,
  correctMotive: id,
  correctMethod: id,
  /** Answers keyed by accusation question id. */
  validationAnswers: z.record(z.string(), id),
  /** Extra optional question answers (not required to resolve). */
  optionalAnswers: z.record(z.string(), id).default({}),
  correctTimeline: z.array(SolutionTimelineEntrySchema).min(1),
  reasoning: z.array(z.string()).min(2),
  explanation: z.string(),
  /** Chains of reasoning that each independently support the solution. */
  proofChains: z
    .array(z.object({ title: z.string(), steps: z.array(z.string()).min(2) }))
    .default([]),
});
export type PrivateSolution = z.infer<typeof PrivateSolutionSchema>;

/* ------------------------------------------------------------------ */
/* Full case file                                                      */
/* ------------------------------------------------------------------ */

export const CaseFileSchema = z.object({
  public: PublicCaseSchema,
  meta: AuthorMetaSchema,
  solution: PrivateSolutionSchema,
});
export type CaseFile = z.infer<typeof CaseFileSchema>;

/* ------------------------------------------------------------------ */
/* Client payloads                                                     */
/* ------------------------------------------------------------------ */

export type ClientCase = Omit<PublicCase, "clues"> & {
  clues: PublicClue[];
};

/**
 * Narrow, safe projection listed on the archive and history pages.
 * Deliberately holds no clue, no timeline and no internal analysis, so the
 * server never serializes case internals into an RSC payload.
 */
export type ArchiveSummary = {
  id: string;
  number: number;
  date: string;
  title: string;
  subtitle: string;
};

export type AccusationPayload = Record<string, string>;

export type AccuseResult = {
  caseId: string;
  date: string;
  correct: boolean;
  partial: boolean;
  score: number;
  perQuestion: Record<string, boolean>;
  culprit: { id: string; name: string };
  solution: {
    culpritId: string;
    culpritName: string;
    motive: string;
    method: string;
    reasoning: string[];
    explanation: string;
    correctTimeline: SolutionTimelineEntry[];
    proofChains: { title: string; steps: string[] }[];
  };
};
