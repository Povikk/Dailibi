import "server-only";

import { NextResponse } from "next/server";

import { isDailyKeyUnlocked } from "@/lib/daily";
import { buildAccuseResult } from "@/server/accusationResult";
import { findCaseForDate } from "@/server/caseStore";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ date: string }> },
): Promise<NextResponse> {
  const { date } = await context.params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isDailyKeyUnlocked(date)) {
    return NextResponse.json({ error: "Aucune affaire pour cette date." }, { status: 404 });
  }

  const file = findCaseForDate(date);
  if (!file) {
    return NextResponse.json({ error: "Aucune affaire pour cette date." }, { status: 404 });
  }

  return NextResponse.json(buildAccuseResult(file, file.solution.validationAnswers), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
