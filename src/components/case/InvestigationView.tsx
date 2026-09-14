"use client";

import { useMemo, useState } from "react";

import type { ClientCase, Interview } from "@/types/case";
import { AccusationPanel } from "@/components/case/AccusationPanel";
import { CluesPanel } from "@/components/case/CluesPanel";
import { CaseHero, OverviewPanel } from "@/components/case/CasePanels";
import { SuspectsPanel } from "@/components/case/SuspectsPanel";
import { TimelinePanel } from "@/components/case/TimelinePanel";
import { DossierPanel } from "@/components/case/DossierPanel";

type Tab = "apercu" | "suspects" | "indices" | "chronologie" | "dossier";

const TABS: { id: Tab; label: string; code: string }[] = [
  { id: "apercu", label: "Aperçu", code: "00" },
  { id: "suspects", label: "Suspects", code: "01" },
  { id: "indices", label: "Pièces", code: "02" },
  { id: "chronologie", label: "Chronologie", code: "03" },
  { id: "dossier", label: "Dossier", code: "04" },
];

export function InvestigationView({ caseData }: { caseData: ClientCase }) {
  const [tab, setTab] = useState<Tab>("apercu");
  const [foundClues, setFoundClues] = useState<Set<string>>(new Set());
  const [accusing, setAccusing] = useState(false);
  const [startedAt] = useState(() => Date.now());

  const availableInterviews = useMemo(() => {
    const bySuspect = new Map<string, Interview[]>();
    for (const itv of caseData.interviews) {
      const unlocked = !itv.unlockedByClueId || foundClues.has(itv.unlockedByClueId);
      if (!unlocked) continue;
      const list = bySuspect.get(itv.suspectId) ?? [];
      list.push(itv);
      bySuspect.set(itv.suspectId, list);
    }
    return bySuspect;
  }, [caseData.interviews, foundClues]);

  const lockedCount = useMemo(
    () => caseData.interviews.filter((i) => i.unlockedByClueId).length,
    [caseData.interviews],
  );

  function markFound(clueId: string) {
    setFoundClues((prev) => {
      if (prev.has(clueId)) return prev;
      const next = new Set(prev);
      next.add(clueId);
      return next;
    });
  }

  if (accusing) {
    return <AccusationPanel caseData={caseData} startedAt={startedAt} onCancel={() => setAccusing(false)} />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-32 pt-6 sm:px-6">
      <CaseHero caseData={caseData} />

      <nav
        aria-label="Sections du dossier"
        className="sticky top-0 z-20 -mx-4 mt-5 flex gap-1 overflow-x-auto border-b-2 border-ink-700 bg-desk-950/95 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
            className={
              "tab " +
              (tab === t.id
                ? "border-stamp text-paper-50"
                : "text-paper-300/50 hover:text-paper-100")
            }
          >
            <span className="mr-2 font-mono text-[10px] text-kraft-500">{t.code}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="mt-6">
        {tab === "apercu" ? <OverviewPanel caseData={caseData} /> : null}
        {tab === "suspects" ? (
          <SuspectsPanel
            caseData={caseData}
            interviews={availableInterviews}
            lockedCount={lockedCount}
            onSeeClues={() => setTab("indices")}
          />
        ) : null}
        {tab === "indices" ? (
          <CluesPanel caseData={caseData} foundClues={foundClues} onOpen={markFound} />
        ) : null}
        {tab === "chronologie" ? <TimelinePanel caseData={caseData} /> : null}
        {tab === "dossier" ? (
          <DossierPanel caseData={caseData} foundClues={foundClues} />
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink-700 bg-desk-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <p className="hidden font-mono text-[11px] uppercase tracking-wider text-paper-300/50 sm:block">
            {foundClues.size}/{caseData.clues.length} pièces consultées
          </p>
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => setAccusing(true)}>
            Résoudre l&apos;affaire
          </button>
        </div>
      </div>
    </div>
  );
}