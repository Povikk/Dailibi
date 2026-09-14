"use client";

import { useState } from "react";

import type { ClientCase, PublicClue } from "@/types/case";
import { EvidenceView } from "@/components/evidence/EvidenceView";
import { ExhibitTag } from "@/components/ui/Dossier";

export function CluesPanel({
  caseData,
  foundClues,
  onOpen,
}: {
  caseData: ClientCase;
  foundClues: Set<string>;
  onOpen: (id: string) => void;
}) {
  const [selected, setSelected] = useState<PublicClue | null>(null);

  if (selected) {
    const index = caseData.clues.findIndex((c) => c.id === selected.id) + 1;
    return (
      <div className="mx-auto max-w-2xl">
        <button type="button" className="btn-ghost mb-4" onClick={() => setSelected(null)}>
          ← Retour aux pièces
        </button>

        <div className="sheet grain p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink-950/80 pb-3">
            <ExhibitTag index={index} />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">
              {selected.source}
            </span>
          </div>
          <h2 className="mt-4 font-heading text-xl font-bold uppercase tracking-tight text-ink-950">
            {selected.title}
          </h2>
          <p className="mt-2 font-type text-[15px] leading-relaxed text-ink-800">
            {selected.summary}
          </p>

          <div className="mt-5">
            <EvidenceView evidence={selected.evidence} />
          </div>

          <p className="mt-4 border-t border-dashed border-ink-950/20 pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500">
            Pièce versée au dossier {String(caseData.number).padStart(3, "0")} · DAILIBI
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {caseData.clues.map((clue, index) => {
        const found = foundClues.has(clue.id);
        return (
          <button
            key={clue.id}
            type="button"
            onClick={() => {
              onOpen(clue.id);
              setSelected(clue);
            }}
            className="group relative overflow-hidden rounded-sm border border-kraft-500/30 bg-ink-900/90 p-4 text-left shadow-file transition-all hover:-translate-y-0.5 hover:border-stamp/70"
          >
            <span
              aria-hidden
              className="absolute -right-2 top-1/2 -translate-y-1/2 font-heading text-6xl font-black text-paper-100/[0.04]"
            >
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="relative flex items-start justify-between gap-3">
              <span className="font-heading text-[11px] font-bold uppercase tracking-[0.16em] text-kraft-500">
                Pièce {String(index + 1).padStart(2, "0")}
              </span>
              {found ? (
                <span className="rounded-[2px] bg-good/20 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-good">
                  Consultée
                </span>
              ) : (
                <span className="rounded-[2px] bg-ink-700 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-paper-300/50">
                  À examiner
                </span>
              )}
            </div>
            <h3 className="relative mt-2 font-heading text-base font-semibold uppercase tracking-wide text-paper-100 group-hover:text-stamp-bright">
              {clue.title}
            </h3>
            <p className="relative mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-paper-300/40">
              {clue.source}
            </p>
            <p className="relative mt-2 text-sm text-paper-300/70">{clue.summary}</p>
          </button>
        );
      })}
    </div>
  );
}