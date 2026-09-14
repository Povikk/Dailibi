"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { currentDailyKey } from "@/lib/daily";
import {
  effectiveStreak,
  loadStats,
  loadStreak,
  type DailibiStats,
  type StreakState,
} from "@/lib/storage";

type CaseSummary = {
  id: string;
  number: number;
  title: string;
};

export function HistoryView({ cases }: { cases: CaseSummary[] }) {
  const [stats, setStats] = useState<DailibiStats | null>(null);
  const [streak, setStreak] = useState<StreakState | null>(null);
  const casesById = useMemo(() => new Map(cases.map((item) => [item.id, item])), [cases]);

  useEffect(() => {
    setStats(loadStats());
    setStreak(loadStreak());
  }, []);

  if (!stats || !streak) {
    return <p className="mt-10 text-center text-sm text-paper-300/50">Ouverture du registre…</p>;
  }

  const average = stats.played ? Math.round(stats.scoreSum / stats.played) : 0;
  const currentStreak = effectiveStreak(streak, currentDailyKey());

  return (
    <>
      <section className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Metric label="Enquêtes jouées" value={stats.played} />
        <Metric label="Affaires résolues" value={stats.perfect} tone="good" />
        <Metric label="Score moyen" value={`${average}%`} />
        <Metric label="Série actuelle" value={`${currentStreak} j`} />
        <Metric label="Meilleure série" value={`${streak.bestStreak} j`} wide />
      </section>

      <section className="card mt-5 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="label-meta">Précision</p>
            <h2 className="mt-1 text-lg font-bold">Votre instinct d&apos;enquêteur</h2>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-paper-300/40">Sur les parties jouées</p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Accuracy label="Qui ?" correct={stats.whoCorrect} total={stats.played} />
          <Accuracy label="Pourquoi ?" correct={stats.whyCorrect} total={stats.played} />
          <Accuracy label="Comment ?" correct={stats.howCorrect} total={stats.played} />
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="label-meta">Registre personnel</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">AFFAIRES TERMINÉES</h2>
          </div>
          <span className="font-mono text-xs text-paper-300/40">{stats.history.length} dossier(s)</span>
        </div>

        {stats.history.length === 0 ? (
          <div className="card mt-4 p-8 text-center">
            <p className="text-sm text-paper-300/65">Aucune affaire classée pour le moment.</p>
            <Link href="/" className="btn-primary mt-5">
              Commencer l&apos;enquête du jour
            </Link>
          </div>
        ) : (
          <ol className="mt-4 space-y-3">
            {stats.history.map((record) => {
              const caseInfo = casesById.get(record.caseId);
              return (
                <li key={`${record.date}-${record.caseId}`} className="card overflow-hidden">
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-kraft-400">
                        {caseInfo ? `Affaire #${String(caseInfo.number).padStart(3, "0")} · ` : ""}
                        {formatDate(record.date)}
                      </p>
                      <h3 className="mt-1 truncate font-bold">{caseInfo?.title ?? record.caseId}</h3>
                      <p className="mt-1 text-xs text-paper-300/45">Résolue en {formatDuration(record.seconds)}</p>
                    </div>

                    <div className="flex items-center gap-2 sm:justify-end">
                      <Answer label="Qui" correct={record.who} />
                      <Answer label="Pourquoi" correct={record.why} />
                      <Answer label="Comment" correct={record.how} />
                      <span className="ml-auto min-w-12 text-right font-mono text-lg font-black tabular-nums sm:ml-3">
                        {record.score}%
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/case/${record.date}`}
                    className="block border-t border-ink-800 bg-ink-950/25 px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-paper-300/45 transition-colors hover:text-paper-100"
                  >
                    Revoir le dossier →
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <p className="mt-6 text-center text-[10px] leading-relaxed text-paper-300/35">
        Cet historique est conservé uniquement dans ce navigateur.
      </p>
    </>
  );
}

function Metric({
  label,
  value,
  tone,
  wide,
}: {
  label: string;
  value: string | number;
  tone?: "good";
  wide?: boolean;
}) {
  return (
    <div className={`card p-4 ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
      <p className="text-[10px] uppercase tracking-[0.13em] text-paper-300/45">{label}</p>
      <p className={`mt-2 font-mono text-2xl font-black tabular-nums ${tone === "good" ? "text-good" : "text-paper-50"}`}>
        {value}
      </p>
    </div>
  );
}

function Accuracy({ label, correct, total }: { label: string; correct: number; total: number }) {
  const percentage = total ? Math.round((correct / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-bold uppercase tracking-wider">{label}</span>
        <span className="font-mono tabular-nums text-paper-300/65">{percentage}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
        <div className="h-full rounded-full bg-kraft-400" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function Answer({ label, correct }: { label: string; correct: boolean }) {
  return (
    <span
      title={`${label} : ${correct ? "correct" : "incorrect"}`}
      className={`rounded px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${
        correct ? "bg-good/20 text-green-300" : "bg-bad/20 text-red-300"
      }`}
    >
      {label.slice(0, 1)} {correct ? "✓" : "×"}
    </span>
  );
}

function formatDate(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(year, month - 1, day, 12)))
    .replace(".", "")
    .toUpperCase();
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes} min ${String(rest).padStart(2, "0")} s` : `${rest} s`;
}
