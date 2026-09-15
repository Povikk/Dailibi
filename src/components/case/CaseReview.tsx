"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ResultPanel } from "@/components/case/ResultPanel";
import { loadDayRecord, loadReviewResult, type DayRecord } from "@/lib/storage";
import type { AccuseResult, ClientCase } from "@/types/case";

type ReviewState =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "legacy"; record: DayRecord }
  | { status: "ready"; record: DayRecord; result: AccuseResult };

export function CaseReview({ caseData }: { caseData: ClientCase }) {
  const [state, setState] = useState<ReviewState>({ status: "loading" });

  useEffect(() => {
    const record = loadDayRecord(caseData.date);
    if (!record) {
      setState({ status: "denied" });
      return;
    }

    // The canonical solution is written on the device when the accusation is
    // sent, so re-reading a dossier never needs a public solution endpoint.
    const canonical = loadReviewResult(caseData.date);
    if (!canonical) {
      setState({ status: "legacy", record });
      return;
    }

    const perQuestion = { ...canonical.perQuestion };
    for (const question of caseData.accusation.questions) {
      if (question.kind === "suspect") perQuestion[question.id] = record.who;
      if (question.kind === "motive") perQuestion[question.id] = record.why;
      if (question.kind === "method") perQuestion[question.id] = record.how;
    }

    const correct = record.who && record.why && record.how;
    setState({
      status: "ready",
      record,
      result: {
        ...canonical,
        correct,
        partial: !correct && (record.who || record.why || record.how),
        score: record.score,
        perQuestion,
      },
    });
  }, [caseData]);

  if (state.status === "ready") {
    return (
      <ResultPanel
        caseData={caseData}
        result={state.result}
        seconds={state.record.seconds}
        reviewOnly
      />
    );
  }

  if (state.status === "legacy") {
    return <LegacyReview caseData={caseData} record={state.record} />;
  }

  return (
    <main className="mx-auto flex min-h-[65vh] w-full max-w-xl items-center px-4 py-12 sm:px-6">
      <section className="card w-full p-6 text-center sm:p-8">
        {state.status === "loading" ? (
          <>
            <p className="label-meta">Archives personnelles</p>
            <h1 className="mt-2 text-2xl font-black">OUVERTURE DU DOSSIER…</h1>
          </>
        ) : (
          <>
            <p className="label-meta">Dossier non classé</p>
            <h1 className="mt-2 text-2xl font-black">CETTE ENQUÊTE N&apos;EST PAS ENCORE TERMINÉE</h1>
            <p className="mt-3 text-sm leading-relaxed text-paper-300/65">
              Les réponses ne sont accessibles qu&apos;après avoir porté une accusation sur cet appareil.
            </p>
            <Link href={`/case/${caseData.date}`} className="btn-primary mt-6">
              Reprendre l&apos;enquête
            </Link>
          </>
        )}
      </section>
    </main>
  );
}

/**
 * Dossiers closed before the canonical solution was stored locally. The score
 * and verdicts are still exact, only the full write-up is unavailable.
 */
function LegacyReview({ caseData, record }: { caseData: ClientCase; record: DayRecord }) {
  const rows = [
    { label: "QUI", ok: record.who },
    { label: "POURQUOI", ok: record.why },
    { label: "COMMENT", ok: record.how },
  ];

  return (
    <main className="mx-auto flex min-h-[65vh] w-full max-w-xl items-center px-4 py-12 sm:px-6">
      <section className="card w-full p-6 sm:p-8">
        <p className="label-meta">Archives personnelles</p>
        <h1 className="mt-2 text-2xl font-black">
          AFFAIRE #{String(caseData.number).padStart(3, "0")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-paper-300/65">
          Cette partie a été jouée avant la dernière mise à jour du dossier. Le verdict et le score
          sont conservés, mais le récit détaillé n&apos;est plus disponible.
        </p>

        <p className="mt-5 text-4xl font-black tabular-nums">{record.score}%</p>

        <ul className="mt-4 divide-y divide-ink-800">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm font-semibold uppercase tracking-wider">{row.label}</span>
              <span
                className={
                  "rounded px-2 py-0.5 text-xs font-bold " +
                  (row.ok ? "bg-good/20 text-good" : "bg-bad/20 text-bad")
                }
              >
                {row.ok ? "CORRECT" : "INCORRECT"}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-paper-300/50">
          {record.who && record.why && record.how ? "Enquête résolue" : "Enquête classée"} ·{" "}
          {formatDuration(record.seconds)}
        </p>

        <Link href="/archives" className="btn-primary mt-6 w-full">
          Retour aux archives
        </Link>
      </section>
    </main>
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes} min ${String(rest).padStart(2, "0")} s` : `${rest} s`;
}
