import { describe, expect, it } from "vitest";

import { CaseFileSchema } from "@/types/case";
import type { CaseFile, ClientCase } from "@/types/case";
import { loadCaseFiles } from "../scripts/_load";

/**
 * Mirrors server/caseStore.toClientCase without importing "server-only", so
 * the projection can be tested in the node test environment. Kept deliberately
 * dumb: if the projection changes, this test must be updated too, which is the
 * point of a security regression test.
 */
function projectToClient(file: CaseFile): ClientCase {
  const { solution: _s, meta: _m, ...rest } = file;
  void _s;
  void _m;
  return {
    ...rest.public,
    clues: rest.public.clues.map((clue) => {
      const { analysis: _a, ...publicClue } = clue;
      void _a;
      return publicClue;
    }),
  };
}

describe("séparation public / privé", () => {
  const cases = loadCaseFiles();

  it("le payload client ne contient aucune clé de solution", () => {
    for (const { data } of cases) {
      const client = projectToClient(data) as unknown as Record<string, unknown>;
      expect(client.solution).toBeUndefined();
      expect(client.meta).toBeUndefined();
    }
  });

  it("le payload client ne contient ni coupable ni mobile ni méthode", () => {
    for (const { file, data } of cases) {
      const serialized = JSON.stringify(projectToClient(data));
      expect(serialized, file).not.toContain("culpritId");
      expect(serialized, file).not.toContain("correctMotive");
      expect(serialized, file).not.toContain("correctMethod");
      expect(serialized, file).not.toContain("validationAnswers");
      expect(serialized, file).not.toContain("proofChains");
      expect(serialized, file).not.toContain("correctTimeline");
    }
  });

  it("aucune analyse d'indice ne fuit dans le payload client", () => {
    for (const { file, data } of cases) {
      const serialized = JSON.stringify(projectToClient(data));
      expect(serialized, file).not.toContain("\"analysis\"");
      expect(serialized, file).not.toContain("implicates");
      expect(serialized, file).not.toContain("clears");
      expect(serialized, file).not.toContain("supportsMotiveOf");
    }
  });

  it("le schéma public reste valide après projection", () => {
    for (const { data } of cases) {
      expect(CaseFileSchema.safeParse(data).success).toBe(true);
      const client = projectToClient(data);
      expect(client.clues.every((c) => !("analysis" in c))).toBe(true);
    }
  });
});
