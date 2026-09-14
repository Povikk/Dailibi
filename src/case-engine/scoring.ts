import type {
  AccusationPayload,
  PrivateSolution,
  PublicCase,
} from "@/types/case";

export type ScoreBreakdown = {
  perQuestion: Record<string, boolean>;
  correct: number;
  total: number;
  score: number;
  allCorrect: boolean;
  partial: boolean;
};

/**
 * Scoring is based on PRECISION, not speed. Every required question has the
 * same weight; a perfect accusation is 100.
 */
export function scoreAccusation(
  pub: PublicCase,
  solution: PrivateSolution,
  payload: AccusationPayload,
): ScoreBreakdown {
  const required = pub.accusation.questions.filter((q) => !q.optional);
  const perQuestion: Record<string, boolean> = {};
  let correct = 0;

  for (const question of required) {
    const expected =
      solution.validationAnswers[question.id] ??
      solution.optionalAnswers[question.id] ??
      null;
    const given = payload[question.id] ?? null;
    const ok = expected !== null && given === expected;
    perQuestion[question.id] = ok;
    if (ok) correct += 1;
  }

  const total = required.length || 1;
  const score = Math.round((correct / total) * 100);

  return {
    perQuestion,
    correct,
    total,
    score,
    allCorrect: correct === total,
    partial: correct > 0 && correct < total,
  };
}

/** Human-readable result token used by the share grid. */
export function resultGrid(
  pub: PublicCase,
  perQuestion: Record<string, boolean>,
): string {
  const order = ["suspect", "motive", "method"] as const;
  const lines = order.map((kind) => {
    const q = pub.accusation.questions.find((x) => x.kind === kind);
    if (!q) return "";
    const ok = perQuestion[q.id];
    return `${ok ? "\u{1F7E9}" : "\u{1F7E5}"} ${kind.toUpperCase()}`;
  });
  return lines.filter(Boolean).join("\n");
}