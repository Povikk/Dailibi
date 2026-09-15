import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { CaseFile } from "@/types/case";

const files = readdirSync(join(process.cwd(), "data", "cases"))
  .filter((name) => name.endsWith(".json"))
  .map((name) => JSON.parse(readFileSync(join(process.cwd(), "data", "cases", name), "utf8")) as CaseFile);

describe("qualité éditoriale des affaires", () => {
  it("présente toutes les déclarations comme des paroles rapportées", () => {
    for (const file of files) {
      for (const suspect of file.public.suspects) {
        expect(suspect.claimedAlibi, `${file.public.number}: ${suspect.name}`).toMatch(/^« .+ »$/);
        expect(suspect.claimedAlibi, `${file.public.number}: ${suspect.name}`).not.toMatch(/^« (Il|Elle) /);
      }
      for (const interview of file.public.interviews) {
        expect(interview.answer, `${file.public.number}: ${interview.id}`).toMatch(/^« .+ »$/);
      }
      for (const entry of file.public.timeline) {
        if (entry.certainty === "REPORTED" || /^Déclaration d/.test(entry.source)) {
          expect(entry.text, `${file.public.number}: ${entry.source}`).toMatch(/« .+ »/);
        }
      }
    }
  });

  it("utilise des choix d'accusation propres à chaque affaire", () => {
    const banned = [
      "Forcer directement l'accès principal puis dissimuler les traces",
      "Employer un complice extérieur après la fermeture",
      "Exploiter une défaillance existante sans intervenir sur les lieux",
    ];
    for (const file of files.filter((item) => item.public.number !== 14)) {
      const motive = file.public.accusation.questions.find((question) => question.kind === "motive");
      const method = file.public.accusation.questions.find((question) => question.kind === "method");
      expect(motive?.options).toHaveLength(4);
      expect(method?.options).toHaveLength(4);
      expect(method?.options.map((option) => option.label)).not.toEqual(expect.arrayContaining(banned));
    }
  });

  it("ne contient plus de tirets longs ni d'anciens textes clonés", () => {
    const content = JSON.stringify(files);
    expect(content).not.toMatch(/[—–]/);
    expect(content).not.toContain("L'alibi qui se fissure");
    expect(content).not.toContain("La trace qui ne devait pas rester");
    expect(content).not.toContain("Reprenez votre soirée à partir du dernier moment certain");
  });

  it("réserve les cartes vidéo à de véritables preuves visuelles", () => {
    for (const file of files) {
      for (const clue of file.public.clues) {
        if (clue.evidence.kind === "camera") {
          expect(`${clue.source} ${clue.summary}`, `${file.public.number}: ${clue.title}`).toMatch(/caméra|vidéo|image|photo|flux|enregistrement|reflet/i);
        }
      }
    }
  });
});
