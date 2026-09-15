import { describe, expect, it } from "vitest";

import {
  currentCase,
  findDatedCase,
  listCasesForArchive,
  loadAllCases,
  nextCaseDate,
  toClientCase,
} from "@/server/caseStore";

/**
 * These tests exercise the REAL production projection and lookup functions
 * (not a copy), so a regression in `caseStore` fails the suite.
 */
describe("séparation public / privé", () => {
  const cases = loadAllCases();

  it("charge le registre embarqué complet", () => {
    expect(cases).toHaveLength(30);
  });

  it("le payload client ne contient aucune clé de solution", () => {
    for (const file of cases) {
      const client = toClientCase(file) as unknown as Record<string, unknown>;
      expect(client.solution, file.public.id).toBeUndefined();
      expect(client.meta, file.public.id).toBeUndefined();
    }
  });

  it("le payload client ne contient ni coupable ni mobile ni méthode", () => {
    for (const file of cases) {
      const serialized = JSON.stringify(toClientCase(file));
      expect(serialized, file.public.id).not.toContain("culpritId");
      expect(serialized, file.public.id).not.toContain("correctMotive");
      expect(serialized, file.public.id).not.toContain("correctMethod");
      expect(serialized, file.public.id).not.toContain("validationAnswers");
      expect(serialized, file.public.id).not.toContain("proofChains");
      expect(serialized, file.public.id).not.toContain("correctTimeline");
    }
  });

  it("aucune analyse d'indice ne fuit dans le payload client", () => {
    for (const file of cases) {
      const serialized = JSON.stringify(toClientCase(file));
      expect(serialized, file.public.id).not.toContain('"analysis"');
      expect(serialized, file.public.id).not.toContain("implicates");
      expect(serialized, file.public.id).not.toContain("clears");
      expect(serialized, file.public.id).not.toContain("supportsMotiveOf");
      expect(toClientCase(file).clues.every((c) => !("analysis" in c))).toBe(true);
    }
  });

  it("les résumés d'archives ne transportent aucun contenu interne", () => {
    const summaries = listCasesForArchive();
    expect(summaries).toHaveLength(cases.length);

    for (const summary of summaries) {
      expect(Object.keys(summary).sort()).toEqual(["date", "id", "number", "subtitle", "title"]);
      const serialized = JSON.stringify(summary);
      expect(serialized).not.toContain("analysis");
      expect(serialized).not.toContain("implicates");
      expect(serialized).not.toContain("clues");
      expect(serialized).not.toContain("suspects");
    }
  });
});

describe("résolution des dates", () => {
  const cases = loadAllCases();

  it("retrouve chaque affaire par sa propre date", () => {
    for (const file of cases) {
      expect(findDatedCase(file.public.date)?.public.id).toBe(file.public.id);
    }
  });

  it("ne résout jamais une date sans affaire datée (pas d'alias par modulo)", () => {
    const dated = new Set(cases.map((file) => file.public.date));
    const probes = [
      "2026-08-31", // la veille du lancement : l'ancien modulo visait une affaire future
      "2026-08-01",
      "2026-07-15",
      "2026-10-01",
      "2026-02-31", // date calendaire impossible
      "2026-9-4",
      "not-a-date",
      "",
    ];

    for (const probe of probes) {
      expect(dated.has(probe)).toBe(false);
      expect(findDatedCase(probe), probe).toBeUndefined();
    }
  });

  it("une affaire résolue porte toujours la date demandée", () => {
    for (const probe of [...cases.map((file) => file.public.date), "2026-08-31", "2099-01-01"]) {
      const file = findDatedCase(probe);
      if (file) expect(file.public.date).toBe(probe);
    }
  });
});

describe("calendrier éditorial fini", () => {
  it("sert l'affaire du jour quand elle est publiée", () => {
    expect(currentCase(new Date("2026-09-14T12:00:00Z"))?.public.date).toBe("2026-09-14");
    expect(currentCase(new Date("2026-09-01T12:00:00Z"))?.public.date).toBe("2026-09-01");
  });

  it("ne recycle jamais une affaire sur une date sans publication", () => {
    // Avant le lancement, l'ancien modulo renvoyait une affaire future.
    expect(currentCase(new Date("2026-08-20T12:00:00Z"))).toBeUndefined();
    // Après la fin de la collection, aucune affaire n'est recyclée.
    expect(currentCase(new Date("2026-10-15T12:00:00Z"))).toBeUndefined();
    expect(currentCase(new Date("2026-12-25T12:00:00Z"))).toBeUndefined();
  });

  it("annonce la prochaine date de publication", () => {
    expect(nextCaseDate(new Date("2026-09-14T12:00:00Z"))).toBe("2026-09-15");
    expect(nextCaseDate(new Date("2026-09-30T12:00:00Z"))).toBeUndefined();
    expect(nextCaseDate(new Date("2026-10-15T12:00:00Z"))).toBeUndefined();
  });
});
