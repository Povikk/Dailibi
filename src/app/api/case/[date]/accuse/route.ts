import "server-only";

import { NextResponse } from "next/server";

import { findDatedCase } from "@/server/caseStore";
import { buildSolvabilityMatrix } from "@/case-engine/solvability";
import { validateCase, validateFairPlay } from "@/case-engine/validateCase";
import { validateSolutionTimeline } from "@/case-engine/timelineValidator";
import { isDailyKeyUnlocked, isValidDayKey } from "@/lib/daily";
import { buildAccuseResult } from "@/server/accusationResult";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ date: string }> },
): Promise<NextResponse> {
  const { date } = await context.params;

  if (!isValidDayKey(date)) {
    return NextResponse.json({ error: "Date invalide." }, { status: 400 });
  }

  if (!isDailyKeyUnlocked(date)) {
    return NextResponse.json({ error: "Aucune affaire pour cette date." }, { status: 404 });
  }

  const file = findDatedCase(date);
  if (!file) {
    return NextResponse.json({ error: "Aucune affaire pour cette date." }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Réponse d'accusation invalide." }, { status: 400 });
  }

  const answers = payload as Record<string, unknown>;
  const required = file.public.accusation.questions.filter((q) => !q.optional);

  for (const question of required) {
    const value = answers[question.id];
    if (typeof value !== "string" || !value) {
      return NextResponse.json(
        { error: `Réponse manquante pour « ${question.prompt} ».` },
        { status: 400 },
      );
    }
    if (!question.options.some((o) => o.id === value)) {
      return NextResponse.json(
        { error: "Réponse hors des options proposées." },
        { status: 400 },
      );
    }
  }

  const clean: Record<string, string> = {};
  for (const question of file.public.accusation.questions) {
    const value = answers[question.id];
    if (typeof value === "string") clean[question.id] = value;
  }

  return NextResponse.json(buildAccuseResult(file, clean));
}

/**
 * Development-only health endpoint: it exposes aggregate validity signals
 * (error codes, culprit chain count, timeline conflicts), which is useful
 * while authoring but must not be public. It is disabled outside development.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ date: string }> },
): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Aucune affaire pour cette date." }, { status: 404 });
  }

  const { date } = await context.params;
  if (!isValidDayKey(date) || !isDailyKeyUnlocked(date)) {
    return NextResponse.json({ error: "Aucune affaire pour cette date." }, { status: 404 });
  }
  const file = findDatedCase(date);
  if (!file) {
    return NextResponse.json({ error: "Aucune affaire pour cette date." }, { status: 404 });
  }
  const report = validateCase(file);
  const matrix = buildSolvabilityMatrix(file);
  const timeline = validateSolutionTimeline(file);
  const fairPlay = validateFairPlay(file);

  return NextResponse.json({
    caseId: file.public.id,
    date: file.public.date,
    valid: report.ok && fairPlay.every((i) => i.level !== "error"),
    errors: report.errors.map((e) => e.code),
    warnings: [...report.warnings, ...matrix.warnings].map((w) =>
      typeof w === "string" ? w : w.code,
    ),
    timelineConflicts: timeline.length,
    culpritChains: matrix.culpritChains,
  });
}
