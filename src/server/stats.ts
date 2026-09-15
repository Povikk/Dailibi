import "server-only";

import type { AccuseResult } from "@/types/case";

/**
 * Aggregate, cross-player statistics.
 *
 * The app is otherwise stateless: this is the only server-side store, and it
 * holds counters exclusively. No account, no email, no IP address.
 *
 * Bindings are read through `cloudflare:workers`. The import is dynamic and
 * guarded so the same code runs under `next dev`, vitest and workerd: outside
 * a Worker there is simply no database and every call becomes a no-op.
 */

/** Below this many accusations, percentages would identify individual plays. */
export const MIN_ACCUSATIONS_FOR_STATS = 10;
export type QuestionStats = {
  total: number;
  options: Record<string, number>;
};

export type CaseStats = {
  accusations: number;
  perfect: number;
  solvedRate: number;
  averageScore: number;
  questions: Record<string, QuestionStats>;
};

type EnvWithDb = { env?: { DB?: D1Database } };

async function getDatabase(): Promise<D1Database | undefined> {
  try {
    const mod = (await import(
      /* webpackIgnore: true */ /* @vite-ignore */ "cloudflare:workers"
    )) as EnvWithDb;
    return mod.env?.DB;
  } catch {
    return undefined;
  }
}

/**
 * Pseudonym scoped to one case: the same device yields a different hash on
 * every dossier, so plays cannot be correlated from one day to the next.
 */
async function hashPlayer(secret: string, caseId: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${caseId}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Records one accusation. Called after the result was computed: a failure
 * here must never break the player's verdict, so everything is swallowed.
 */
export async function recordAccusation(params: {
  result: AccuseResult;
  answers: Record<string, string>;
  playerSecret?: string;
}): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  const { result, answers, playerSecret } = params;

  try {
    if (playerSecret) {
      const playerHash = await hashPlayer(playerSecret, result.caseId);
      const inserted = await db
        .prepare(
          "INSERT INTO case_players (case_id, player_hash, created_at) VALUES (?, ?, ?) ON CONFLICT(case_id, player_hash) DO NOTHING",
        )
        .bind(result.caseId, playerHash, new Date().toISOString())
        .run();
      if ((inserted.meta?.changes ?? 0) === 0) return;
    }

    const now = new Date().toISOString();
    const statements = Object.entries(answers).map(([questionId, optionId]) =>
      db
        .prepare(
          "INSERT INTO case_answers (case_id, question_id, option_id, total, updated_at) VALUES (?, ?, ?, 1, ?) ON CONFLICT(case_id, question_id, option_id) DO UPDATE SET total = total + 1, updated_at = excluded.updated_at",
        )
        .bind(result.caseId, questionId, optionId, now),
    );

    statements.push(
      db
        .prepare(
          "INSERT INTO case_totals (case_id, accusations, perfect, score_sum, updated_at) VALUES (?, 1, ?, ?, ?) ON CONFLICT(case_id) DO UPDATE SET accusations = accusations + 1, perfect = perfect + excluded.perfect, score_sum = score_sum + excluded.score_sum, updated_at = excluded.updated_at",
        )
        .bind(result.caseId, result.correct ? 1 : 0, result.score, now),
    );

    await db.batch(statements);
  } catch {
    /* statistics are a bonus, never a requirement */
  }
}

/** Returns `undefined` when there is no database or not enough data yet. */
export async function getCaseStats(caseId: string): Promise<CaseStats | undefined> {  const db = await getDatabase();
  if (!db) return undefined;

  try {
    const totals = await db
      .prepare(
        "SELECT accusations, perfect, score_sum FROM case_totals WHERE case_id = ?",
      )
      .bind(caseId)
      .first<{ accusations: number; perfect: number; score_sum: number }>();

    const accusations = totals?.accusations ?? 0;
    if (accusations < MIN_ACCUSATIONS_FOR_STATS) return undefined;

    const rows = await db
      .prepare(
        "SELECT question_id, option_id, total FROM case_answers WHERE case_id = ?",
      )
      .bind(caseId)
      .all<{ question_id: string; option_id: string; total: number }>();

    const questions: Record<string, QuestionStats> = {};
    for (const row of rows.results ?? []) {
      const entry = questions[row.question_id] ?? { total: 0, options: {} };
      entry.options[row.option_id] = row.total;
      entry.total += row.total;
      questions[row.question_id] = entry;
    }

    return {
      accusations,
      perfect: totals?.perfect ?? 0,
      solvedRate: Math.round(((totals?.perfect ?? 0) / accusations) * 100),
      averageScore: Math.round((totals?.score_sum ?? 0) / accusations),
      questions,
    };
  } catch {
    return undefined;
  }
}

/**
 * Whether this device already accused on this case. Used to withhold the
 * current day's percentages until the player has actually played, so the
 * stats endpoint cannot be used as a spoiler.
 */
export async function hasPlayerRecorded(
  caseId: string,
  playerSecret: string,
): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  try {
    const playerHash = await hashPlayer(playerSecret, caseId);
    const row = await db
      .prepare("SELECT 1 AS ok FROM case_players WHERE case_id = ? AND player_hash = ?")
      .bind(caseId, playerHash)
      .first<{ ok: number }>();
    return Boolean(row);
  } catch {
    return false;
  }
}
