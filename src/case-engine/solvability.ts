import type { CaseFile } from "@/types/case";

export type SuspectLeverage = {
  suspectId: string;
  suspectName: string;
  implicates: string[];
  clears: string[];
  contradicts: string[];
  supportsMotive: string[];
  supportsMethod: string[];
  score: number;
  isCulprit: boolean;
};

export type SolvabilityMatrix = {
  clues: {
    id: string;
    title: string;
    category: string;
    implicates: string[];
    clears: string[];
    contradicts: string[];
    supportsMotiveOf: string[];
    supportsMethodOf: string[];
    isRedHerring: boolean;
  }[];
  suspects: SuspectLeverage[];
  culpritChains: number;
  warnings: string[];
};

/**
 * Builds the internal solvability matrix: which clue points at whom, which
 * exonerates whom, and whether the culprit is supported by more than one
 * independent chain. Never sent to the client.
 */
export function buildSolvabilityMatrix(file: CaseFile): SolvabilityMatrix {
  const warnings: string[] = [];
  const culpritId = file.solution.culpritId;

  const clues = file.public.clues.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.analysis.category,
    implicates: c.analysis.implicates,
    clears: c.analysis.clears,
    contradicts: c.analysis.contradicts,
    supportsMotiveOf: c.analysis.supportsMotiveOf,
    supportsMethodOf: c.analysis.supportsMethodOf,
    isRedHerring: c.analysis.isRedHerring,
  }));

  const suspects: SuspectLeverage[] = file.public.suspects.map((s) => {
    const implicates = clues.filter((c) => c.implicates.includes(s.id)).map((c) => c.id);
    const clears = clues.filter((c) => c.clears.includes(s.id)).map((c) => c.id);
    const contradicts = clues.filter((c) => c.contradicts.includes(s.id)).map((c) => c.id);
    const supportsMotive = clues
      .filter((c) => c.supportsMotiveOf.includes(s.id))
      .map((c) => c.id);
    const supportsMethod = clues
      .filter((c) => c.supportsMethodOf.includes(s.id))
      .map((c) => c.id);
    return {
      suspectId: s.id,
      suspectName: s.name,
      implicates,
      clears,
      contradicts,
      supportsMotive,
      supportsMethod,
      score:
        implicates.length * 2 +
        contradicts.length * 2 +
        supportsMotive.length +
        supportsMethod.length -
        clears.length * 2,
      isCulprit: s.id === culpritId,
    };
  });

  const culprit = suspects.find((s) => s.isCulprit);
  const culpritChains = culprit
    ? culprit.implicates.length + culprit.contradicts.length
    : 0;

  if (culpritChains < 2) {
    warnings.push(
      "Le coupable ne dispose que d'une seule chaîne le reliant au crime.",
    );
  }

  const innocentWithHighScore = suspects
    .filter((s) => !s.isCulprit && s.score >= (culprit?.score ?? 0))
    .map((s) => s.suspectName);
  if (innocentWithHighScore.length) {
    warnings.push(
      `Un innocent score aussi haut que le coupable : ${innocentWithHighScore.join(", ")}. Vérifier l'équilibre.`,
    );
  }

  const motiveSupporters = clues.filter((c) => c.supportsMotiveOf.length > 0).length;
  if (motiveSupporters === 0) {
    warnings.push("Aucun indice ne soutient un mobile.");
  }

  return { clues, suspects, culpritChains, warnings };
}