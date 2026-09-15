"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { earnedPoints, rankFor } from "@/game/badges";
import { loadBadges, loadStats } from "@/lib/storage";

type Summary = {
  played: number;
  perfect: number;
  average: number;
  badges: number;
  rank: string;
};

/**
 * Shown once the editorial calendar is over: the collection is complete, so
 * the page closes on the player's own record instead of an empty slot.
 */
export function CollectionEnd({ totalCases }: { totalCases: number }) {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const stats = loadStats();
    const badges = loadBadges();
    setSummary({
      played: stats.played,
      perfect: stats.perfect,
      average: stats.played ? Math.round(stats.scoreSum / stats.played) : 0,
      badges: Object.keys(badges).length,
      rank: rankFor(earnedPoints(badges)).label,
    });
  }, []);

  return (
    <article className="card mt-8 p-6 sm:p-8">
      <p className="label-meta">Collection terminée</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
        TOUTES LES AFFAIRES SONT CLASSÉES
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-paper-300/70">
        Les {totalCases} dossiers publiés sont désormais dans les archives. De nouvelles enquêtes
        arriveront ici.
      </p>

      {summary && summary.played > 0 ? (
        <>
          <dl className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Classées" value={`${summary.played}/${totalCases}`} />
            <Metric label="Résolues" value={summary.perfect} tone="good" />
            <Metric label="Moyenne" value={`${summary.average}%`} />
            <Metric label="Distinctions" value={`${summary.badges}/50`} />
          </dl>
          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-kraft-300">
            Grade : {summary.rank}
          </p>
        </>
      ) : (
        <p className="mt-4 text-xs text-paper-300/50">
          Aucune partie jouée pour l&apos;instant.
        </p>
      )}

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/archives" className="btn-primary">
          Explorer les archives
        </Link>
        <Link href="/historique" className="btn-ghost">
          Mes distinctions
        </Link>
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "good";
}) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900/40 p-3">
      <dt className="text-[10px] uppercase tracking-[0.13em] text-paper-300/45">{label}</dt>
      <dd
        className={
          "mt-1 font-mono text-xl font-black tabular-nums " +
          (tone === "good" ? "text-good" : "text-paper-50")
        }
      >
        {value}
      </dd>
    </div>
  );
}
