"use client";

import { useEffect, useMemo, useState } from "react";

import {
  BADGE_FAMILIES,
  earnedPoints,
  evaluateAllBadges,
  nextRank,
  rankFor,
  totalPoints,
  type BadgeContext,
  type BadgeFamily,
} from "@/game/badges";
import { buildBadgeContext } from "@/game/context";
import { loadBadges, loadEquippedTitle, saveEquippedTitle } from "@/lib/storage";

const FAMILY_ORDER: BadgeFamily[] = [
  "progression",
  "resolution",
  "serie",
  "precision",
  "moyenne",
  "rapidite",
  "archives",
  "methode",
];

function chipClass(active: boolean): string {
  return (
    "rounded-sm border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors " +
    (active
      ? "border-stamp bg-stamp/20 text-paper-50"
      : "border-ink-600 text-paper-300/60 hover:border-kraft-500")
  );
}

export function BadgesPanel() {
  const [earned, setEarned] = useState<Record<string, string> | null>(null);
  const [context, setContext] = useState<BadgeContext | null>(null);
  const [equipped, setEquipped] = useState<string | null>(null);

  useEffect(() => {
    setEarned(loadBadges());
    setContext(buildBadgeContext());
    setEquipped(loadEquippedTitle());
  }, []);

  const states = useMemo(() => (context ? evaluateAllBadges(context) : []), [context]);

  if (!earned || !context) {
    return (
      <p className="mt-8 text-center text-sm text-paper-300/50">Ouverture des distinctions…</p>
    );
  }

  const points = earnedPoints(earned);
  const rank = rankFor(points);
  const next = nextRank(points);
  const ceiling = totalPoints();
  const unlockedCount = Object.keys(earned).length;
  const span = next ? next.min - rank.min : 1;
  const progress = next
    ? Math.min(100, Math.round(((points - rank.min) / span) * 100))
    : 100;
  const titleOptions = states.filter((state) => state.badge.title && earned[state.badge.id]);

  function equip(id: string | null) {
    saveEquippedTitle(id);
    setEquipped(id);
    window.dispatchEvent(new CustomEvent("dailibi:title"));
  }

  return (
    <>
      <section className="card mt-8 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-meta">Grade</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">{rank.label}</h2>
            <p className="mt-1 text-xs text-paper-300/55">
              {points} / {ceiling} points · {unlockedCount} / {states.length} distinctions
            </p>
          </div>
          <p className="text-xs text-paper-300/55">
            {next ? `Prochain grade : ${next.label} à ${next.min} points` : "Grade maximal atteint"}
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-700">
          <div className="h-full rounded-full bg-kraft-400" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="card mt-5 p-5">
        <p className="label-meta">Titre affiché en haut de l&apos;écran</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => equip(null)} className={chipClass(equipped === null)}>
            Aucun
          </button>
          {titleOptions.map((state) => (
            <button
              key={state.badge.id}
              type="button"
              onClick={() => equip(state.badge.id)}
              className={chipClass(equipped === state.badge.id)}
            >
              {state.badge.title}
            </button>
          ))}
        </div>
        {titleOptions.length === 0 ? (
          <p className="mt-2 text-xs text-paper-300/45">
            Aucun titre débloqué pour l&apos;instant : les paliers arrivent en jouant.
          </p>
        ) : null}
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="label-meta">Distinctions</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">COLLECTION</h2>
          </div>
          <span className="font-mono text-xs text-paper-300/40">
            {unlockedCount}/{states.length}
          </span>
        </div>

        <div className="mt-4 space-y-6">
          {FAMILY_ORDER.map((family) => {
            const familyStates = states.filter((state) => state.badge.family === family);
            if (!familyStates.length) return null;
            const familyEarned = familyStates.filter((state) => earned[state.badge.id]).length;
            return (
              <div key={family}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-paper-100">
                    {BADGE_FAMILIES[family].label}
                  </h3>
                  <span className="font-mono text-[11px] text-paper-300/40">
                    {familyEarned}/{familyStates.length}
                  </span>
                </div>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {familyStates.map((state) => {
                    const unlocked = Boolean(earned[state.badge.id]);
                    return (
                      <li
                        key={state.badge.id}
                        className={
                          "rounded-lg border p-3 " +
                          (unlocked
                            ? BADGE_FAMILIES[family].tone
                            : "border-ink-700 bg-ink-900/40 text-paper-300/45")
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold">{state.badge.label}</p>
                          <span className="font-mono text-[10px] tabular-nums">
                            {unlocked ? "OK" : `${state.value}/${state.target}`}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed opacity-80">
                          {state.badge.description}
                        </p>
                        {state.badge.title ? (
                          <p className="mt-2 text-[10px] uppercase tracking-wider opacity-70">
                            Titre : {state.badge.title}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
