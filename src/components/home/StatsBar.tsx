"use client";

import { useEffect, useState } from "react";

import { currentDailyKey } from "@/lib/daily";
import { effectiveStreak, loadStats, loadStreak, type DailibiStats } from "@/lib/storage";

export function StatsBar() {
  const [stats, setStats] = useState<DailibiStats | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStats(loadStats());
    setStreak(effectiveStreak(loadStreak(), currentDailyKey()));
  }, []);

  if (!stats || stats.played === 0) {
    return (
      <p className="text-xs text-paper-300/50">
        Premier passage ? Une affaire, trois questions, aucune inscription.
      </p>
    );
  }

  const average = stats.played ? Math.round(stats.scoreSum / stats.played) : 0;

  return (
    <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
      <Stat icon="🔥" label="Série" value={`${streak}`} />
      <Stat label="Jouées" value={`${stats.played}`} />
      <Stat label="Parfaites" value={`${stats.perfect}`} />
      <Stat label="Score moyen" value={`${average}%`} />
    </dl>
  );
}

function Stat({ icon, label, value }: { icon?: string; label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-paper-300/50">
        {icon ? <span aria-hidden>{icon} </span> : null}
        {label}
      </dt>
      <dd className="font-mono font-bold tabular-nums text-paper-100">{value}</dd>
    </div>
  );
}