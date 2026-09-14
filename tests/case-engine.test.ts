import { describe, expect, it } from "vitest";

import { CaseFileSchema, type CaseFile } from "@/types/case";
import { validateCase, validateFairPlay } from "@/case-engine/validateCase";
import { buildSolvabilityMatrix } from "@/case-engine/solvability";
import { validateSolutionTimeline } from "@/case-engine/timelineValidator";
import { scoreAccusation } from "@/case-engine/scoring";
import { loadCaseFiles } from "../scripts/_load";

const cases = loadCaseFiles();

describe("collection éditoriale", () => {
  it("livre exactement 30 affaires numérotées et datées sans doublon", () => {
    expect(cases).toHaveLength(30);
    const numbers = cases.map(({ data }) => data.public.number).sort((a, b) => a - b);
    const dates = cases.map(({ data }) => data.public.date);
    const ids = cases.map(({ data }) => data.public.id);
    expect(numbers).toEqual(Array.from({ length: 30 }, (_, index) => index + 1));
    expect(new Set(dates).size).toBe(30);
    expect(new Set(ids).size).toBe(30);
  });
});

describe("schémas Zod", () => {
  it("accepte toutes les affaires livrées", () => {
    for (const { data } of cases) {
      expect(CaseFileSchema.safeParse(data).success).toBe(true);
    }
  });

  it("rejette une heure mal formée", () => {
    const bad = structuredClone(cases[0].data) as CaseFile;
    bad.public.timeline[0].time = "25:99";
    expect(CaseFileSchema.safeParse(bad).success).toBe(false);
  });
});

describe("validateCase", () => {
  it("valide toutes les affaires livrées sans erreur", () => {
    for (const { file, data } of cases) {
      const report = validateCase(data);
      expect(report.errors, file).toEqual([]);
    }
  });

  it("détecte un coupable inexistant", () => {
    const bad = structuredClone(cases[0].data) as CaseFile;
    bad.solution.culpritId = "fantome";
    const report = validateCase(bad);
    expect(report.ok).toBe(false);
    expect(report.errors.some((e) => e.code === "culprit.unknown")).toBe(true);
  });

  it("détecte une réponse de validation incohérente", () => {
    const bad = structuredClone(cases[0].data) as CaseFile;
    bad.solution.validationAnswers.q_who = "quelqu_un_d_autre";
    const report = validateCase(bad);
    expect(report.errors.some((e) => e.code === "answers.invalid")).toBe(true);
  });

  it("détecte un indice qui pointe vers un suspect inconnu", () => {
    const bad = structuredClone(cases[0].data) as CaseFile;
    bad.public.clues[0].analysis.implicates.push("inconnu");
    const report = validateCase(bad);
    expect(report.errors.some((e) => e.code === "clue.implicates")).toBe(true);
  });
});

describe("fair-play", () => {
  it("aucune erreur de fair-play sur les affaires livrées", () => {
    for (const { data } of cases) {
      const issues = validateFairPlay(data).filter((i) => i.level === "error");
      expect(issues).toEqual([]);
    }
  });

  it("l'alibi du coupable est toujours contredit", () => {
    for (const { data } of cases) {
      const contradictions = data.public.clues.filter((c) =>
        c.analysis.contradicts.includes(data.solution.culpritId),
      );
      expect(contradictions.length).toBeGreaterThan(0);
    }
  });
});

describe("solvabilité", () => {
  it("le coupable possède au moins deux chaînes", () => {
    for (const { file, data } of cases) {
      const matrix = buildSolvabilityMatrix(data);
      expect(matrix.culpritChains, file).toBeGreaterThanOrEqual(2);
    }
  });

  it("le coupable a mobile ET méthode soutenus par des indices", () => {
    for (const { file, data } of cases) {
      const culprit = data.solution.culpritId;
      const all = data.public.clues;
      expect(all.some((c) => c.analysis.supportsMotiveOf.includes(culprit)), file).toBe(true);
      expect(all.some((c) => c.analysis.supportsMethodOf.includes(culprit)), file).toBe(true);
    }
  });
});

describe("timelineValidator", () => {
  it("aucun conflit dans les affaires livrées", () => {
    for (const { file, data } of cases) {
      expect(validateSolutionTimeline(data), file).toEqual([]);
    }
  });
});

describe("scoring", () => {
  it("donne 100 pour une accusation parfaite", () => {
    const { data } = cases[0];
    const breakdown = scoreAccusation(data.public, data.solution, data.solution.validationAnswers);
    expect(breakdown.score).toBe(100);
    expect(breakdown.allCorrect).toBe(true);
  });

  it("donne un score partiel pour une bonne réponse sur trois", () => {
    const { data } = cases[0];
    const payload = { ...data.solution.validationAnswers, q_how: "faux" };
    const breakdown = scoreAccusation(data.public, data.solution, payload);
    expect(breakdown.correct).toBe(2);
    expect(breakdown.score).toBe(67);
    expect(breakdown.partial).toBe(true);
  });

  it("ne peut pas dépasser 100", () => {
    const { data } = cases[0];
    const breakdown = scoreAccusation(data.public, data.solution, data.solution.validationAnswers);
    expect(breakdown.score).toBeLessThanOrEqual(100);
  });
});
