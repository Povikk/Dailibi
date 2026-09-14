import "server-only";

import { CaseFileSchema } from "@/types/case";
import type { CaseFile, ClientCase, PublicCase } from "@/types/case";
import { currentDailyKey, dayNumber } from "@/lib/daily";
import { CASE_REGISTRY } from "@/generated/caseRegistry";

let cache: CaseFile[] | null = null;

/**
 * Loads every case file from data/cases/*.json.
 * server-only guarantees this module can never be bundled into client code.
 * The cache lives for the process lifetime, which is fine because cases are
 * immutable once published.
 */
export function loadAllCases(): CaseFile[] {
  if (cache) return cache;
  const cases = CASE_REGISTRY.map((raw, index) => {
    const parsed = CaseFileSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Affaire embarquée #${index + 1} invalide :\n${parsed.error.issues
          .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
          .join("\n")}`,
      );
    }
    return parsed.data;
  });
  cases.sort((a, b) => a.public.number - b.public.number);
  cache = cases;
  return cases;
}

export function findCaseById(id: string): CaseFile | undefined {
  return loadAllCases().find((c) => c.public.id === id);
}

/**
 * Picks the case for a given game-day key.
 *
 * The case of the day is deterministic across all players. We map the
 * absolute day number onto the ordered list of cases. A case can also be
 * pinned to an explicit date (useful for a launch schedule).
 */
export function findCaseForDate(key: string): CaseFile | undefined {
  const cases = loadAllCases();
  if (!cases.length) return undefined;

  const pinned = cases.find((c) => c.public.date === key);
  if (pinned) return pinned;

  const [fy, fm, fd] = cases[0].public.date.split("-").map(Number);
  const launch = dayNumber(`${fy}-${fm}-${fd}`);
  const index = modulo(dayNumber(key) - launch, cases.length);
  return cases[index];
}

export function currentCase(now: Date = new Date()): CaseFile | undefined {
  return findCaseForDate(currentDailyKey(now));
}

/**
 * Full case available today, in order, for the archive page.
 * Only public data is ever projected to the client.
 */
export function listCasesForArchive(): PublicCase[] {
  return loadAllCases().map((c) => c.public);
}

/**
 * Projects a case file down to the client payload.
 *
 * IMPORTANT: this strips `meta`, `solution`, and every clue's `analysis`.
 * Nothing secret may cross this boundary before the accusation.
 */
export function toClientCase(file: CaseFile): ClientCase {
  const { solution: _solution, meta: _meta, ...publicCase } = file;
  void _solution;
  void _meta;
  return {
    ...publicCase.public,
    clues: publicCase.public.clues.map((clue) => {
      const { analysis: _analysis, ...rest } = clue;
      void _analysis;
      return rest;
    }),
  };
}

function modulo(n: number, m: number): number {
  return ((n % m) + m) % m;
}
