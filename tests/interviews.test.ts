import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { CaseFile } from "@/types/case";

/**
 * Les réponses écrites sur mesure vivent dans case-authoring/interviews.json.
 * Ce test vérifie qu'aucune clé ne pointe dans le vide : une faute de frappe
 * ferait silencieusement retomber l'affaire sur les banques génériques.
 */
const KINDS = ["observation", "relation", "detail", "confrontation", "mobile"];

const files = readdirSync(join(process.cwd(), "data", "cases"))
  .filter((name) => name.endsWith(".json"))
  .map(
    (name) =>
      JSON.parse(readFileSync(join(process.cwd(), "data", "cases", name), "utf8")) as CaseFile,
  );

const overrides = JSON.parse(
  readFileSync(join(process.cwd(), "case-authoring", "interviews.json"), "utf8"),
) as Record<string, Record<string, Record<string, string>>>;

describe("réponses sur mesure", () => {
  it("cible des affaires, des suspects et des interrogatoires existants", () => {
    for (const [caseId, suspects] of Object.entries(overrides)) {
      const file = files.find((item) => item.public.id === caseId);
      expect(file, `affaire inconnue : ${caseId}`).toBeDefined();

      for (const [suspectId, answers] of Object.entries(suspects)) {
        expect(
          file!.public.suspects.some((suspect) => suspect.id === suspectId),
          `suspect inconnu : ${caseId}/${suspectId}`,
        ).toBe(true);

        for (const kind of Object.keys(answers)) {
          expect(KINDS, `type inconnu : ${caseId}/${suspectId}/${kind}`).toContain(kind);
          expect(
            file!.public.interviews.some((item) => item.id === `${suspectId}_${kind}`),
            `interrogatoire manquant : ${caseId}/${suspectId}/${kind}`,
          ).toBe(true);
        }
      }
    }
  });

  it("applique chaque réponse telle quelle dans l'affaire publiée", () => {
    for (const [caseId, suspects] of Object.entries(overrides)) {
      const file = files.find((item) => item.public.id === caseId)!;
      for (const [suspectId, answers] of Object.entries(suspects)) {
        for (const [kind, text] of Object.entries(answers)) {
          const interview = file.public.interviews.find(
            (item) => item.id === `${suspectId}_${kind}`,
          )!;
          expect(interview.answer, `${caseId}/${suspectId}/${kind}`).toBe(text);
        }
      }
    }
  });

  it("donne à chaque réponse la forme d'une parole rapportée", () => {
    for (const suspects of Object.values(overrides)) {
      for (const answers of Object.values(suspects)) {
        for (const text of Object.values(answers)) {
          expect(text).toMatch(/^« .+ »$/);
          expect(text).not.toMatch(/[—–]/);
        }
      }
    }
  });
});
