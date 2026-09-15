import "server-only";

import { CaseFileSchema } from "@/types/case";
import type { ArchiveSummary, CaseFile, ClientCase } from "@/types/case";
import { currentDailyKey } from "@/lib/daily";
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
 * The only lookup allowed for routes and pages.
 *
 * It matches an explicitly dated case and never falls back to the rotation
 * modulo: an arbitrary or aliased date must not resolve to a case that is
 * still locked (e.g. "/api/case/2026-08-31/review" pointing at a future file).
 */
export function findDatedCase(key: string): CaseFile | undefined {
  return loadAllCases().find((c) => c.public.date === key);
}

/**
 * The case of the day, or `undefined` when no case is dated today.
 *
 * The collection is a finite editorial calendar: a case is only playable on
 * its publication date. Past days move to the archives, future days wait.
 * There is no implicit recycling of old cases onto new dates.
 */
export function currentCase(now: Date = new Date()): CaseFile | undefined {
  return findDatedCase(currentDailyKey(now));
}

/** Earliest publication date strictly after today, if any remains. */
export function nextCaseDate(now: Date = new Date()): string | undefined {
  const key = currentDailyKey(now);
  return loadAllCases()
    .map((c) => c.public.date)
    .filter((date) => date > key)
    .sort()[0];
}

/**
 * Full case available today, in order, for the archive page.
 * Only the narrow summary is ever projected to the client.
 */
export function listCasesForArchive(): ArchiveSummary[] {
  return loadAllCases().map((c) => ({
    id: c.public.id,
    number: c.public.number,
    date: c.public.date,
    title: c.public.title,
    subtitle: c.public.subtitle,
  }));
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
