import "server-only";

import { scoreAccusation } from "@/case-engine/scoring";
import type { AccuseResult, CaseFile } from "@/types/case";

export function buildAccuseResult(
  file: CaseFile,
  answers: Record<string, string>,
): AccuseResult {
  const breakdown = scoreAccusation(file.public, file.solution, answers);
  const culprit = file.public.suspects.find((suspect) => suspect.id === file.solution.culpritId)!;

  const motiveLabel =
    file.public.accusation.questions
      .find((question) => question.kind === "motive")
      ?.options.find((option) => option.id === file.solution.correctMotive)?.label ?? "";
  const methodLabel =
    file.public.accusation.questions
      .find((question) => question.kind === "method")
      ?.options.find((option) => option.id === file.solution.correctMethod)?.label ?? "";

  return {
    caseId: file.public.id,
    date: file.public.date,
    correct: breakdown.allCorrect,
    partial: breakdown.partial,
    score: breakdown.score,
    perQuestion: breakdown.perQuestion,
    culprit: { id: culprit.id, name: culprit.name },
    solution: {
      culpritId: culprit.id,
      culpritName: culprit.name,
      motive: motiveLabel,
      method: methodLabel,
      reasoning: file.solution.reasoning,
      explanation: file.solution.explanation,
      correctTimeline: file.solution.correctTimeline,
      proofChains: file.solution.proofChains,
    },
  };
}
