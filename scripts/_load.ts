import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { CaseFileSchema } from "../src/types/case";
import type { CaseFile } from "../src/types/case";
import { validateCase, validateFairPlay } from "../src/case-engine/validateCase";
import { buildSolvabilityMatrix } from "../src/case-engine/solvability";
import { validateSolutionTimeline } from "../src/case-engine/timelineValidator";

const CASES_DIR = join(process.cwd(), "data", "cases");

export function loadCaseFiles(): { file: string; data: CaseFile }[] {
  return readdirSync(CASES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((file) => {
      const raw = JSON.parse(readFileSync(join(CASES_DIR, file), "utf8"));
      const parsed = CaseFileSchema.safeParse(raw);
      if (!parsed.success) {
        throw new Error(
          `${file} ne respecte pas le schéma :\n${parsed.error.issues
            .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
            .join("\n")}`,
        );
      }
      return { file, data: parsed.data };
    });
}
