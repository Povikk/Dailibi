"use client";

import { useEffect, useMemo, useState } from "react";

import type { AccuseResult, ClientCase } from "@/types/case";
import { CaseStatsPanel } from "@/components/case/CaseStatsPanel";
import { currentDailyKey, msUntilNextRollover } from "@/lib/daily";
import { buildShareText } from "@/lib/share";
import { loadStreak, recordResult, saveReviewResult } from "@/lib/storage";
import { awardBadges, syncPlayerProfile } from "@/game/context";
import type { BadgeDefinition } from "@/game/badges";

const KIND_LABEL: Record<string, string> = {
  suspect: "QUI",
  motive: "POURQUOI",
  method: "COMMENT",
};

export function ResultPanel({
  caseData,
  result,
  seconds,
  reviewOnly = false,
}: {
  caseData: ClientCase;
  result: AccuseResult;
  seconds: number;
  reviewOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [unlocked, setUnlocked] = useState<BadgeDefinition[]>([]);
  const [nextCase, setNextCase] = useState<{ remaining: number; available: boolean } | null>(null);
  const [isDailyResult] = useState(() => !reviewOnly && caseData.date === currentDailyKey());
  const [streak, setStreak] = useState<{ currentStreak: number; bestStreak: number }>({
    currentStreak: 0,
    bestStreak: 0,
  });

  useEffect(() => {
    if (reviewOnly) return;
    const who = perKind("suspect");
    const why = perKind("motive");
    const how = perKind("method");
    const stored = recordResult({
      date: caseData.date,
      caseId: caseData.id,
      score: result.score,
      who,
      why,
      how,
      seconds,
      optional: caseData.date !== currentDailyKey(),
    });
    setStreak(stored.streak);
    saveReviewResult(result);
    setUnlocked(awardBadges());
    void syncPlayerProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewOnly]);

  useEffect(() => {
    if (!isDailyResult) return;
    const update = () => {
      setNextCase({
        remaining: msUntilNextRollover(),
        available: currentDailyKey() !== caseData.date,
      });
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [caseData.date, isDailyResult]);

  function perKind(kind: string): boolean {
    const q = caseData.accusation.questions.find((x) => x.kind === kind);
    return q ? result.perQuestion[q.id] === true : false;
  }

  const shareText = useMemo(
    () =>
      buildShareText({
        number: caseData.number,
        date: caseData.date,
        perKind: { suspect: perKind("suspect"), motive: perKind("motive"), method: perKind("method") },
        score: result.score,
        correct: Object.values(result.perQuestion).filter(Boolean).length,
        total: Object.keys(result.perQuestion).length,
        streak: streak.currentStreak || loadStreak().currentStreak,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result, streak],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-6 sm:px-6">
      <header className="card overflow-hidden">
        <div
          className={
            "px-5 py-6 text-center " +
            (result.correct ? "bg-good/15" : result.partial ? "bg-amber-500/10" : "bg-bad/10")
          }
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-paper-300/70">
            Affaire #{String(caseData.number).padStart(3, "0")}
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            {result.correct ? "AFFAIRE RÉSOLUE" : result.partial ? "AFFAIRE PARTIELLEMENT RÉSOLUE" : "AFFAIRE NON RÉSOLUE"}
          </h1>
          <p className="mt-3 text-4xl font-black tabular-nums">{result.score}%</p>
          <p className="mt-1 text-xs text-paper-300/60">
            {Object.values(result.perQuestion).filter(Boolean).length}/
            {Object.keys(result.perQuestion).length} réponses correctes · {formatSeconds(seconds)}
          </p>
        </div>

        <ul className="divide-y divide-ink-800">
          {caseData.accusation.questions
            .filter((q) => !q.optional)
            .map((q) => {
              const ok = result.perQuestion[q.id] === true;
              return (
                <li key={q.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span className="text-sm font-semibold uppercase tracking-wider">
                    {KIND_LABEL[q.kind] ?? q.prompt}
                  </span>
                  <span
                    className={
                      "rounded px-2 py-0.5 text-xs font-bold " +
                      (ok ? "bg-good/20 text-good" : "bg-bad/20 text-bad")
                    }
                  >
                    {ok ? "CORRECT" : "INCORRECT"}
                  </span>
                </li>
              );
            })}
        </ul>
      </header>

      {unlocked.length ? (
        <section className="card mt-5 overflow-hidden border-kraft-500/50">
          <div className="border-b border-ink-700 bg-kraft-500/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-kraft-300">
            {unlocked.length > 1 ? "Distinctions débloquées" : "Distinction débloquée"}
          </div>
          <ul className="divide-y divide-ink-800">
            {unlocked.map((badge) => (
              <li key={badge.id} className="px-4 py-3">
                <p className="text-sm font-bold">{badge.label}</p>
                <p className="mt-0.5 text-xs text-paper-300/60">{badge.description}</p>
                {badge.title ? (
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-kraft-300">
                    Nouveau titre : {badge.title}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="border-t border-ink-800 px-4 py-2 text-right">
            <a
              href="/collection"
              className="text-[10px] font-semibold uppercase tracking-[0.15em] text-paper-300/50 transition-colors hover:text-paper-100"
            >
              Voir ma collection →
            </a>
          </div>
        </section>
      ) : null}

      {isDailyResult && streak.currentStreak > 0 ? (
        <p className="mt-4 text-center text-sm text-paper-300/70">
          Série en cours : <span className="font-bold text-paper-50">{streak.currentStreak} jour{streak.currentStreak > 1 ? "s" : ""}</span>
          {" · "}meilleure série : {streak.bestStreak}
        </p>
      ) : null}

      {isDailyResult && nextCase ? (
        <section className="card mt-5 overflow-hidden border-kraft-500/40 text-center">
          <div className="border-b border-ink-700 bg-ink-800/55 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-kraft-400">
            Dossier classé
          </div>
          <div className="px-5 py-5">
            {nextCase.available ? (
              <>
                <p className="text-sm font-bold">La nouvelle enquête est disponible.</p>
                <a href="/" className="btn-primary mt-4">
                  Découvrir l&apos;affaire du jour
                </a>
              </>
            ) : (
              <>
                <p className="text-sm text-paper-300/70">Revenez pour la prochaine enquête dans</p>
                <p className="mt-2 font-mono text-3xl font-black tabular-nums text-paper-50">
                  {formatCountdown(nextCase.remaining)}
                </p>
              </>
            )}
          </div>
        </section>
      ) : null}

      <section className="card mt-6 p-5 sm:p-6">
        <p className="label-meta">La vérité</p>
        <h2 className="mt-2 text-lg font-bold">
          {result.solution.culpritName} · {caseData.title}
        </h2>
        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-paper-100/90">
          {result.solution.explanation}
        </p>
      </section>

      <section className="card mt-5 p-5 sm:p-6">
        <p className="label-meta">Le raisonnement, étape par étape</p>
        <ol className="mt-3 space-y-2">
          {result.solution.reasoning.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-paper-100/90">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-700 text-[11px] font-bold tabular-nums">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      {result.solution.proofChains.length ? (
        <section className="card mt-5 p-5 sm:p-6">
          <p className="label-meta">Deux façons de le prouver</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {result.solution.proofChains.map((chain) => (
              <div key={chain.title} className="rounded-lg bg-ink-800 p-4">
                <p className="text-sm font-bold text-accent-soft">{chain.title}</p>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-paper-300/80">
                  {chain.steps.map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden className="text-accent-soft">▸</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card mt-5 p-5 sm:p-6">
        <p className="label-meta">Chronologie réelle des faits</p>
        <ol className="mt-3 space-y-3 border-l border-ink-700 pl-5">
          {result.solution.correctTimeline.map((entry, i) => (
            <li key={i} className="relative">
              <span
                aria-hidden
                className="absolute -left-[26px] top-1.5 h-2 w-2 rounded-full bg-accent ring-4 ring-ink-900"
              />
              <p className="font-mono text-sm font-bold tabular-nums text-accent-soft">{entry.time}</p>
              <p className="text-sm text-paper-100/90">{entry.text}</p>
              <p className="text-xs text-paper-300/50">{entry.place}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="card mt-5 p-5 sm:p-6">
        <p className="label-meta">Partager sans spoiler</p>
        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-ink-950 p-4 font-mono text-sm leading-relaxed text-paper-100">
          {shareText}
        </pre>
        <button type="button" className="btn-primary mt-4 w-full sm:w-auto" onClick={copy}>
          {copied ? "Résultat copié !" : "Copier mon résultat"}
        </button>
      </section>

      <CaseStatsPanel date={caseData.date} questions={caseData.accusation.questions} />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a className="btn-ghost flex-1" href="/archives">
          Voir les archives
        </a>
        <a className="btn-ghost flex-1" href="/">
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  );
}

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m} min ${String(s).padStart(2, "0")} s` : `${s} s`;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}
