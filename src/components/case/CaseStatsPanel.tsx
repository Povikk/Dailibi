"use client";

import { useEffect, useState } from "react";

import { loadPlayerSecret } from "@/lib/storage";

type QuestionOption = { id: string; label: string };

type QuestionInput = {
  id: string;
  prompt: string;
  options: QuestionOption[];
};

type QuestionStats = {
  total: number;
  options: Record<string, number>;
  correctOptionId: string | null;
};

type StatsResponse = {
  available: boolean;
  accusations?: number;
  solvedRate?: number;
  averageScore?: number;
  questions?: Record<string, QuestionStats>;
};

/**
 * Cross-player aggregates, only ever shown after the verdict. The endpoint
 * refuses the current day until this device has accused, so it cannot be
 * used to look up the answer.
 */
export function CaseStatsPanel({
  date,
  questions,
}: {
  date: string;
  questions: QuestionInput[];
}) {
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetch(`/api/case/${date}/stats`, {
      headers: { "x-dailibi-player": loadPlayerSecret() },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => (response.ok ? ((await response.json()) as StatsResponse) : null))
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => {
        if (active) setStats(null);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [date]);

  if (!stats?.available) return null;

  return (
    <section className="card mt-5 p-5 sm:p-6">
      <p className="label-meta">Ce que les autres ont répondu</p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs uppercase tracking-wider text-paper-300/60">
        <span>{stats.accusations} joueurs</span>
        <span>{stats.solvedRate}% ont résolu</span>
        <span>score moyen {stats.averageScore}%</span>
      </div>

      <div className="mt-5 space-y-5">
        {questions.map((question) => {
          const aggregate = stats.questions?.[question.id];
          if (!aggregate) return null;
          return (
            <div key={question.id}>
              <p className="text-sm font-semibold text-paper-100">{question.prompt}</p>
              <ul className="mt-2 space-y-2">
                {question.options.map((option) => {
                  const count = aggregate.options[option.id] ?? 0;
                  const share = aggregate.total
                    ? Math.round((count / aggregate.total) * 100)
                    : 0;
                  const isCorrect = aggregate.correctOptionId === option.id;
                  return (
                    <li key={option.id} className="text-xs">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className={isCorrect ? "font-bold text-good" : "text-paper-200/80"}>
                          {option.label}
                          {isCorrect ? " ✓" : ""}
                        </span>
                        <span className="font-mono tabular-nums text-paper-300/60">{share}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-700">
                        <div
                          className={"h-full rounded-full " + (isCorrect ? "bg-good" : "bg-kraft-400")}
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-[10px] leading-relaxed text-paper-300/35">
        Statistiques agrégées et anonymes : des compteurs, aucun profil ni donnée personnelle.
      </p>
    </section>
  );
}
