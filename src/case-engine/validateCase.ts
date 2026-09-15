import type {
  CaseFile,
  PrivateSolution,
  PublicCase,
} from "@/types/case";

export type IssueLevel = "error" | "warning";

export type ValidationIssue = {
  level: IssueLevel;
  code: string;
  message: string;
};

export type ValidationReport = {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  issues: ValidationIssue[];
};

export const PRIVATE_SOLUTION_IDS = [
  "culpritId",
  "correctMotive",
  "correctMethod",
  "solutionTimeline",
  "solutionReasoning",
  "validationAnswers",
] as const;

/**
 * Structural + logical validation of a whole case file.
 * `validateCase` returns a report rather than throwing so the CLI and tests
 * can display every problem at once. `assertValidCase` throws in dev.
 */
export function validateCase(file: CaseFile): ValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const { public: pub, solution } = file;

  const err = (code: string, message: string) =>
    errors.push({ level: "error", code, message });
  const warn = (code: string, message: string) =>
    warnings.push({ level: "warning", code, message });

  const suspectIds = new Set(pub.suspects.map((s) => s.id));
  const clueIds = new Set(pub.clues.map((c) => c.id));

  /* --- unique ids ------------------------------------------------- */
  checkUnique(pub.suspects.map((s) => s.id), "suspect", err);
  checkUnique(pub.clues.map((c) => c.id), "clue", err);
  checkUnique(pub.interviews.map((i) => i.id), "interview", err);
  checkUnique(pub.accusation.questions.map((q) => q.id), "question", err);
  for (const question of pub.accusation.questions) {
    checkUnique(question.options.map((o) => o.id), `option.${question.id}`, err);
  }

  /* --- culprit ---------------------------------------------------- */
  if (!suspectIds.has(solution.culpritId)) {
    err("culprit.unknown", `culpritId "${solution.culpritId}" n'est pas un suspect.`);
  }
  const culprit = pub.suspects.find((s) => s.id === solution.culpritId);

  /* --- answers ---------------------------------------------------- */
  const suspectQuestions = pub.accusation.questions.filter((q) => q.kind === "suspect");
  const motiveQuestions = pub.accusation.questions.filter((q) => q.kind === "motive");
  const methodQuestions = pub.accusation.questions.filter((q) => q.kind === "method");

  if (suspectQuestions.length !== 1) {
    err("questions.suspect", "Il faut exactement une question QUI.");
  }
  if (motiveQuestions.length !== 1) {
    err("questions.motive", "Il faut exactement une question POURQUOI.");
  }
  if (methodQuestions.length !== 1) {
    err("questions.method", "Il faut exactement une question COMMENT.");
  }
  if (pub.accusation.questions.length > 5) {
    err("questions.count", "Maximum 5 questions d'accusation.");
  }

  for (const q of pub.accusation.questions) {
    if (!q.optional && !(q.id in solution.validationAnswers)) {
      err("answers.missing", `Aucune réponse de validation pour la question "${q.id}".`);
      continue;
    }
    const answer =
      solution.validationAnswers[q.id] ?? solution.optionalAnswers[q.id];
    if (answer && !q.options.some((o) => o.id === answer)) {
      err(
        "answers.invalid",
        `La réponse "${answer}" pour "${q.id}" n'est pas une option proposée.`,
      );
    }
  }

  const culpritQuestion = suspectQuestions[0];
  if (culpritQuestion && solution.validationAnswers[culpritQuestion.id] !== solution.culpritId) {
    err(
      "answers.culprit",
      "La réponse QUI doit correspondre exactement au culpritId.",
    );
  }
  const motiveQuestion = motiveQuestions[0];
  if (motiveQuestion && solution.validationAnswers[motiveQuestion.id] !== solution.correctMotive) {
    err("answers.motive", "La réponse POURQUOI doit correspondre à correctMotive.");
  }
  const methodQuestion = methodQuestions[0];
  if (methodQuestion && solution.validationAnswers[methodQuestion.id] !== solution.correctMethod) {
    err("answers.method", "La réponse COMMENT doit correspondre à correctMethod.");
  }

  /* --- suspects --------------------------------------------------- */
  if (pub.suspects.length < 3) {
    err("suspects.min", "Au moins trois suspects sont requis.");
  }
  if (pub.suspects.length > 5) {
    warn("suspects.max", "Plus de 5 suspects rend l'affaire trop longue.");
  }

  /* --- interviews ------------------------------------------------- */
  for (const itv of pub.interviews) {
    if (!suspectIds.has(itv.suspectId)) {
      err("interview.suspect", `Interview "${itv.id}" réfère à un suspect inconnu.`);
    }
    if (itv.unlockedByClueId && !clueIds.has(itv.unlockedByClueId)) {
      err("interview.clue", `Interview "${itv.id}" débloquée par un indice inconnu.`);
    }
    if (itv.unlockedByClueId) {
      const clue = pub.clues.find((c) => c.id === itv.unlockedByClueId);
      if (clue && !clue.analysis.unlocksInterviewIds.includes(itv.id)) {
        warn(
          "unlock.mismatch",
          `L'interview "${itv.id}" est débloquée par "${clue.id}", qui ne la liste pas.`,
        );
      }
    }
  }
  for (const s of pub.suspects) {
    const base = pub.interviews.filter((i) => i.suspectId === s.id && !i.unlockedByClueId);
    if (base.length < 2) {
      warn("interview.range", `${s.name} a moins de deux questions de base.`);
    }
  }

  /* --- clues ------------------------------------------------------ */
  if (pub.clues.length < 4) {
    warn("clues.min", "Une bonne affaire contient au moins 4 indices.");
  }
  for (const clue of pub.clues) {
    for (const target of clue.analysis.implicates) {
      if (!suspectIds.has(target)) {
        err("clue.implicates", `Indice "${clue.id}" incrimine un suspect inconnu "${target}".`);
      }
    }
    for (const target of clue.analysis.clears) {
      if (!suspectIds.has(target)) {
        err("clue.clears", `Indice "${clue.id}" innocente un suspect inconnu "${target}".`);
      }
    }
    for (const target of clue.analysis.contradicts) {
      if (!suspectIds.has(target)) {
        err("clue.contradicts", `Indice "${clue.id}" contredit un suspect inconnu "${target}".`);
      }
    }
    for (const target of clue.analysis.supportsMotiveOf) {
      if (!suspectIds.has(target)) {
        err(
          "clue.motiveSupport",
          `Indice "${clue.id}" soutient le mobile d'un suspect inconnu "${target}".`,
        );
      }
    }
    for (const target of clue.analysis.supportsMethodOf) {
      if (!suspectIds.has(target)) {
        err(
          "clue.methodSupport",
          `Indice "${clue.id}" soutient la méthode d'un suspect inconnu "${target}".`,
        );
      }
    }
    for (const target of clue.analysis.unlocksInterviewIds) {
      const unlocked = pub.interviews.find((i) => i.id === target);
      if (!unlocked) {
        err("clue.unlocks", `Indice "${clue.id}" débloque une interview inconnue "${target}".`);
        continue;
      }
      if (unlocked.unlockedByClueId !== clue.id) {
        warn(
          "unlock.mismatch",
          `L'indice "${clue.id}" déclare débloquer "${target}", qui se dit débloqué par "${
            unlocked.unlockedByClueId ?? "aucun indice"
          }".`,
        );
      }
    }
    if (
      !clue.evidence.altText ||
      clue.evidence.altText.trim().length < 12
    ) {
      warn("clue.altText", `Indice "${clue.id}" a un texte alternatif trop court.`);
    }
  }

  /* --- required clue variety -------------------------------------- */
  const categories = new Set(pub.clues.map((c) => c.analysis.category));
  if (!categories.has("CONTRADICTION")) {
    err("clues.contradiction", "Il manque au moins un indice de type CONTRADICTION.");
  }
  if (!categories.has("TIMELINE")) {
    warn("clues.timeline", "Il manque un indice temporel (TIMELINE).");
  }
  if (!categories.has("EXONERATING")) {
    warn("clues.exonerating", "Il manque un indice permettant d'écarter un innocent.");
  }
  const redHerrings = pub.clues.filter((c) => c.analysis.isRedHerring);
  for (const rh of redHerrings) {
    if (!rh.analysis.category || rh.analysis.category !== "RED_HERRING") {
      warn(
        "clues.redherring",
        `L'indice "${rh.id}" est marqué red herring mais sa catégorie est ${rh.analysis.category}.`,
      );
    }
    if (rh.analysis.implicates.length === 0 && rh.analysis.clears.length === 0) {
      warn(
        "clues.redherring.pointless",
        `L'indice "${rh.id}" est un red herring qui ne pointe nulle part.`,
      );
    }
  }

  /* --- public timeline -------------------------------------------- */
  if (pub.timeline.length < 2) {
    warn("timeline.short", "La chronologie publique est très courte.");
  }
  checkTimelineOrder(pub, warn, err);

  /* --- solution self-consistency ---------------------------------- */
  if (!solution.correctTimeline.length) {
    err("solution.timeline", "La chronologie réelle est vide.");
  }
  if (solution.reasoning.length < 2) {
    err("solution.reasoning", "Le raisonnement doit comporter au moins deux étapes.");
  }
  if (!solution.explanation || solution.explanation.length < 40) {
    err("solution.explanation", "L'explication finale est trop courte.");
  }
  if (solution.proofChains.length < 2) {
    warn(
      "solution.proofChains",
      "Prévoir au moins deux chaînes de preuves indépendantes.",
    );
  }

  /* --- real timeline only refers to known people ------------------ */
  const knownPeople = new Set(suspectIds);
  if (pub.victim.id) knownPeople.add(pub.victim.id);
  for (const entry of solution.correctTimeline) {
    for (const personId of entry.personIds) {
      if (!knownPeople.has(personId)) {
        err(
          "timeline.person",
          `Chronologie ${entry.time} : personne inconnue "${personId}".`,
        );
      }
    }
  }

  /* --- motive / method present in options ------------------------- */
  if (motiveQuestion && !motiveQuestion.options.some((o) => o.id === solution.correctMotive)) {
    err("solution.motive", "correctMotive absent des options POURQUOI.");
  }
  if (methodQuestion && !methodQuestion.options.some((o) => o.id === solution.correctMethod)) {
    err("solution.method", "correctMethod absent des options COMMENT.");
  }

  /* --- culprit must have motive+method+opportunity ---------------- */
  if (culprit) {
    const implicates = pub.clues.filter((c) =>
      c.analysis.implicates.includes(culprit.id),
    );
    const supportsMotive = pub.clues.some((c) =>
      c.analysis.supportsMotiveOf.includes(culprit.id),
    );
    const supportsMethod = pub.clues.some((c) =>
      c.analysis.supportsMethodOf.includes(culprit.id),
    );
    if (!supportsMotive) {
      err("culprit.motive", `${culprit.name} n'a aucun indice soutenant son mobile.`);
    }
    if (!supportsMethod) {
      err("culprit.method", `${culprit.name} n'a aucun indice soutenant sa méthode.`);
    }
    if (implicates.length < 2) {
      warn(
        "culprit.single",
        `Toute l'accusation repose sur un seul indice. Ajouter une seconde chaîne visant ${culprit.name}.`,
      );
    }
  }

  /* --- every clue points somewhere -------------------------------- */
  for (const clue of pub.clues) {
    const a = clue.analysis;
    const points =
      a.implicates.length +
      a.clears.length +
      a.contradicts.length +
      a.supportsMotiveOf.length +
      a.supportsMethodOf.length;
    if (points === 0) {
      warn("clue.pointless", `L'indice "${clue.id}" ne sert à rien : à supprimer.`);
    }
  }

  /* --- chaque innocent a une piste à écarter ---------------------- */
  for (const suspect of pub.suspects) {
    if (suspect.id === solution.culpritId) continue;
    const accused = pub.clues.some((clue) => clue.analysis.implicates.includes(suspect.id));
    const cleared = pub.clues.some((clue) => clue.analysis.clears.includes(suspect.id));
    if (!accused) {
      err(
        "innocent.nolead",
        `${suspect.name} n'est visé par aucune piste : il ne coûte rien de l'innocenter.`,
      );
    }
    if (!cleared) {
      err(
        "innocent.noclear",
        `${suspect.name} n'est écarté par aucun indice : sa piste reste ouverte.`,
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    issues: [...errors, ...warnings],
  };
}

function checkUnique(ids: string[], kind: string, err: (c: string, m: string) => void) {
  const seen = new Set<string>();
  for (const value of ids) {
    if (seen.has(value)) err(`unique.${kind}`, `Identifiant ${kind} dupliqué : "${value}".`);
    seen.add(value);
  }
}

function checkTimelineOrder(
  pub: PublicCase,
  warn: (c: string, m: string) => void,
  _err: (c: string, m: string) => void,
) {
  for (let i = 1; i < pub.timeline.length; i += 1) {
    const previous = clockMinutes(pub.timeline[i - 1].time);
    const current = clockMinutes(pub.timeline[i].time);
    const isMidnightRollover = previous >= 18 * 60 && current <= 6 * 60;
    if (previous > current && !isMidnightRollover) {
      warn(
        "timeline.order",
        `La chronologie publique n'est pas triée (${pub.timeline[i - 1].time} puis ${pub.timeline[i].time}).`,
      );
      return;
    }
  }
}

function clockMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function assertValidCase(file: CaseFile): void {
  const report = validateCase(file);
  if (!report.ok) {
    const lines = report.errors.map((e) => `  - [${e.code}] ${e.message}`).join("\n");
    throw new Error(`Affaire invalide :\n${lines}`);
  }
}

/**
 * Fair-play guard: make sure the reasoning only relies on public information.
 * We forbid the private solution from referencing ids the player cannot see.
 */
export function validateFairPlay(file: CaseFile): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { public: pub, solution } = file;

  const corpus = [
    solution.explanation,
    ...solution.reasoning,
    ...solution.proofChains.flatMap((c) => c.steps),
  ].join(" ");

  // The culprit's own alibi must be contradicted by at least one public clue.
  const contradictions = pub.clues.filter((c) =>
    c.analysis.contradicts.includes(solution.culpritId),
  );
  if (contradictions.length === 0) {
    issues.push({
      level: "error",
      code: "fairplay.alibi",
      message: "L'alibi du coupable n'est contredit par aucun indice public.",
    });
  }

  if (/secret|inconnu|jamais mentionn/i.test(corpus) && /culprit/i.test(corpus)) {
    issues.push({
      level: "warning",
      code: "fairplay.twin",
      message: "Le raisonnement évoque peut-être un élément non introduit (jumeau ?).",
    });
  }

  return issues;
}

export function solutionFingerprint(solution: PrivateSolution): string {
  return [solution.culpritId, solution.correctMotive, solution.correctMethod].join("|");
}
