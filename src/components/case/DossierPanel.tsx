"use client";

import { useMemo, useState } from "react";

import type { ClientCase } from "@/types/case";

export function DossierPanel({
  caseData,
  foundClues,
}: {
  caseData: ClientCase;
  foundClues: Set<string>;
}) {
  const [notes, setNotes] = useState("");

  const unlockByClue = useMemo(() => {
    const map = new Map<string, number>();
    for (const itv of caseData.interviews) {
      if (!itv.unlockedByClueId) continue;
      map.set(itv.unlockedByClueId, (map.get(itv.unlockedByClueId) ?? 0) + 1);
    }
    return map;
  }, [caseData.interviews]);

  const totalUnlocks = [...unlockByClue.values()].reduce((a, b) => a + b, 0);
  const unlockedNow = [...unlockByClue.entries()]
    .filter(([clueId]) => foundClues.has(clueId))
    .reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card p-5">
        <p className="label-meta">État de l&apos;enquête</p>
        <dl className="mt-3 space-y-3 text-sm">
          <Row label="Indices consultés" value={`${foundClues.size}/${caseData.clues.length}`} />
          <Row label="Questions débloquées" value={`${unlockedNow}/${totalUnlocks}`} />
          <Row label="Suspects interrogés" value={`${caseData.suspects.length}`} />
          <Row label="Difficulté" value={caseData.difficulty} />
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-paper-300/60">
          Un suspect qui ment n&apos;est pas nécessairement coupable. Cherchez qui possède à la fois
          le mobile, le moyen et l&apos;occasion.
        </p>
      </section>

      <section className="card p-5">
        <label htmlFor="notes" className="label-meta">
          Vos notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={10}
          placeholder="Heures, incohérences, hypothèses..."
          className="mt-3 w-full resize-y rounded-lg border border-ink-600 bg-ink-950 p-3 font-mono text-sm text-paper-100 placeholder:text-paper-300/30 focus:border-accent focus:outline-none"
        />
        <p className="mt-2 text-[11px] text-paper-300/40">
          Ces notes restent sur votre appareil et ne sont pas envoyées.
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-800 pb-2">
      <dt className="text-paper-300/70">{label}</dt>
      <dd className="font-mono font-bold tabular-nums">{value}</dd>
    </div>
  );
}