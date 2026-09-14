"use client";

import { useState } from "react";

import type { ClientCase, Interview } from "@/types/case";
import { SuspectPortrait } from "@/components/suspects/SuspectPortrait";

export function SuspectsPanel({
  caseData,
  interviews,
  lockedCount,
  onSeeClues,
}: {
  caseData: ClientCase;
  interviews: Map<string, Interview[]>;
  lockedCount: number;
  onSeeClues: () => void;
}) {
  const [open, setOpen] = useState<string | null>(caseData.suspects[0]?.id ?? null);
  const [questionIndex, setQuestionIndex] = useState(0);

  return (
    <div className="space-y-3">
      {lockedCount > 0 ? (
        <p className="rounded-sm border border-kraft-500/30 bg-kraft-200/10 px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-kraft-400">
          Certaines déclarations se débloquent en examinant une pièce.{" "}
          <button type="button" onClick={onSeeClues} className="font-bold text-stamp-bright underline">
            Voir les pièces
          </button>
        </p>
      ) : null}

      {caseData.suspects.map((suspect, index) => {
        const list = interviews.get(suspect.id) ?? [];
        const isOpen = open === suspect.id;
        const active = list[Math.min(questionIndex, Math.max(list.length - 1, 0))];
        return (
          <section key={suspect.id} className="card overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center gap-4 p-4 text-left"
              onClick={() => {
                setOpen(isOpen ? null : suspect.id);
                setQuestionIndex(0);
              }}
              aria-expanded={isOpen}
            >
              <SuspectPortrait suspect={suspect} />
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-kraft-500">
                  Suspect {String(index + 1).padStart(2, "0")}
                </span>
                <span className="block font-heading text-base font-bold uppercase tracking-wide text-paper-50">
                  {suspect.name}
                </span>
                <span className="block font-mono text-[11px] text-paper-300/60">
                  {suspect.age} ans · {suspect.occupation}
                </span>
                <span className="mt-1 block truncate text-xs text-paper-300/50">{suspect.relation}</span>
              </span>
              <span aria-hidden className="font-heading text-xl text-paper-300/40">
                {isOpen ? "−" : "+"}
              </span>
            </button>

            {isOpen ? (
              <div className="border-t border-ink-700 bg-desk-900/40 p-4">
                <p className="text-sm text-paper-100/80">{suspect.personality}</p>

                {suspect.notes.length ? (
                  <ul className="mt-3 space-y-1 font-mono text-[11px] text-paper-300/60">
                    {suspect.notes.map((note, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-stamp-bright" aria-hidden>▪</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <p className="label-meta mt-4">Déclaration spontanée</p>
                <p className="mt-1 border-l-2 border-kraft-500/40 pl-3 font-type text-[15px] italic text-paper-100/85">
                  {suspect.claimedAlibi}
                </p>

                <p className="label-meta mt-5">
                  Interrogatoire · {list.length} déclaration{list.length > 1 ? "s" : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {list.map((itv, i) => (
                    <button
                      key={itv.id}
                      type="button"
                      onClick={() => setQuestionIndex(i)}
                      className={
                        "rounded-sm border px-3 py-1.5 font-mono text-[11px] transition-colors " +
                        (active?.id === itv.id
                          ? "border-stamp bg-stamp/20 text-paper-50"
                          : "border-ink-600 text-paper-300/60 hover:border-kraft-500")
                      }
                    >
                      {itv.question}
                    </button>
                  ))}
                </div>

                {active ? (
                  <div className="animate-tick mt-3 rounded-sm border border-ink-700 bg-desk-950/60 p-4">
                    <p className="font-heading text-sm font-semibold uppercase tracking-wide text-stamp-bright">
                      {active.question}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-paper-100/90">{active.answer}</p>
                    {active.beat ? (
                      <p className="mt-3 border-l-2 border-stamp/50 pl-3 font-type text-[13px] italic text-paper-300/60">
                        {active.beat}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}