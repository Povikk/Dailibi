"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ResultPanel } from "@/components/case/ResultPanel";
import { loadDayRecord, type DayRecord } from "@/lib/storage";
import type { AccuseResult, ClientCase } from "@/types/case";

type ReviewState =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "error" }
  | { status: "ready"; record: DayRecord; result: AccuseResult };

export function CaseReview({ caseData }: { caseData: ClientCase }) {
  const [state, setState] = useState<ReviewState>({ status: "loading" });

  useEffect(() => {
    const record = loadDayRecord(caseData.date);
    if (!record) {
      setState({ status: "denied" });
      return;
    }

    const controller = new AbortController();
    void fetch(`/api/case/${caseData.date}/review`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("review unavailable");
        const canonical = (await response.json()) as AccuseResult;
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
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "error" });
      });

    return () => controller.abort();
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

  return (
    <main className="mx-auto flex min-h-[65vh] w-full max-w-xl items-center px-4 py-12 sm:px-6">
      <section className="card w-full p-6 text-center sm:p-8">
        {state.status === "loading" ? (
          <>
            <p className="label-meta">Archives personnelles</p>
            <h1 className="mt-2 text-2xl font-black">OUVERTURE DU DOSSIER…</h1>
          </>
        ) : state.status === "denied" ? (
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
        ) : (
          <>
            <p className="label-meta">Erreur d&apos;ouverture</p>
            <h1 className="mt-2 text-2xl font-black">DOSSIER MOMENTANÉMENT INDISPONIBLE</h1>
            <button type="button" className="btn-primary mt-6" onClick={() => window.location.reload()}>
              Réessayer
            </button>
          </>
        )}
      </section>
    </main>
  );
}
