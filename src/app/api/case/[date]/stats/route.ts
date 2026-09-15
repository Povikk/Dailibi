import "server-only";

import { NextResponse } from "next/server";

import { currentDailyKey, isDailyKeyUnlocked, isValidDayKey } from "@/lib/daily";
import { findDatedCase } from "@/server/caseStore";
import { getCaseStats, hasPlayerRecorded } from "@/server/stats";

export const dynamic = "force-dynamic";

/**
 * Cross-player aggregates for one case.
 *
 * The current day is withheld until the caller proves it already accused
 * (same anonymous device secret), otherwise the endpoint would spoil the
 * case by revealing the most chosen options.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ date: string }> },
): Promise<NextResponse> {
  const { date } = await context.params;

  if (!isValidDayKey(date) || !isDailyKeyUnlocked(date)) {
    return NextResponse.json({ error: "Aucune affaire pour cette date." }, { status: 404 });
  }

  const file = findDatedCase(date);
  if (!file) {
    return NextResponse.json({ error: "Aucune affaire pour cette date." }, { status: 404 });
  }

  const headers = { "Cache-Control": "private, no-store" };
  const playerSecret = request.headers.get("x-dailibi-player");

  if (date >= currentDailyKey()) {
    const allowed =
      Boolean(playerSecret) && (await hasPlayerRecorded(file.public.id, playerSecret!));
    if (!allowed) {
      return NextResponse.json({ available: false, locked: true }, { headers });
    }
  }

  const stats = await getCaseStats(file.public.id);
  if (!stats) {
    return NextResponse.json({ available: false, locked: false }, { headers });
  }

  const questions = Object.fromEntries(
    Object.entries(stats.questions).map(([questionId, question]) => [
      questionId,
      {
        ...question,
        correctOptionId:
          file.solution.validationAnswers[questionId] ??
          file.solution.optionalAnswers[questionId] ??
          null,
      },
    ]),
  );

  return NextResponse.json({ available: true, ...stats, questions }, { headers });
}
