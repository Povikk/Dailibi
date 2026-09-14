import type { ClientCase } from "@/types/case";
import { formatKey } from "@/lib/format";
import { Stamp } from "@/components/ui/Dossier";

export function CaseHero({ caseData }: { caseData: ClientCase }) {
  return (
    <header className="folder grain overflow-hidden p-0">
      {/* Tab of the file folder */}
      <div className="flex items-end gap-2 px-3 pt-3">
        <div className="rounded-t-md bg-kraft-300 px-4 py-1.5 font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-ink-900 shadow-[0_-2px_0_rgba(0,0,0,0.15)]">
          Pièce à conviction
        </div>
        <div className="rounded-t-md bg-kraft-200/60 px-4 py-1.5 font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-ink-800/60">
          #{String(caseData.number).padStart(3, "0")}
        </div>
      </div>

      <div className="border-t border-kraft-500/40 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-700">
            <span className="font-bold text-stamp-deep">
              DOSSIER N° {String(caseData.number).padStart(3, "0")}
            </span>
            <span aria-hidden>·</span>
            <span>{formatKey(caseData.date)}</span>
            <span aria-hidden>·</span>
            <span>{caseData.difficulty}</span>
            <span aria-hidden>·</span>
            <span>~{caseData.estimatedMinutes} min</span>
          </div>
          <Stamp>Confidentiel</Stamp>
        </div>

        <h1 className="mt-4 font-heading text-3xl font-bold uppercase tracking-tight text-ink-950 sm:text-4xl">
          {caseData.title}
        </h1>
        <p className="mt-2 font-type text-[15px] text-ink-800">{caseData.subtitle}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="exhibit-tag bg-ink-950">
            <span aria-hidden>◆</span> {caseData.suspects.length} SUSPECTS
          </span>
          <span className="exhibit-tag bg-ink-950">
            <span aria-hidden>◆</span> {caseData.clues.length} PIÈCES
          </span>
        </div>
      </div>
    </header>
  );
}

export function OverviewPanel({ caseData }: { caseData: ClientCase }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="sheet grain p-5 lg:col-span-2">
        <div className="flex items-center justify-between border-b-2 border-ink-950/80 pb-2">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.24em] text-ink-800">
            Procès-verbal · Exposé des faits
          </p>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
            Dailibi
          </span>
        </div>
        <p className="mt-4 whitespace-pre-line font-type text-[16px] leading-loose text-ink-900">
          {caseData.intro}
        </p>
      </section>

      <div className="space-y-4">
        <section className="sheet grain p-5">
          <p className="border-b border-dashed border-ink-950/30 pb-2 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-ink-700">
            Lieu de l&apos;incident
          </p>
          <p className="mt-2 text-sm text-ink-900">{caseData.location}</p>
          <p className="mt-3 border-b border-dashed border-ink-950/30 pb-2 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-ink-700">
            Nature des faits
          </p>
          <p className="mt-2 text-sm text-ink-900">{caseData.incident}</p>
        </section>

        <section className="sheet grain p-5">
          <p className="border-b border-dashed border-ink-950/30 pb-2 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-ink-700">
            Plaignant / Victime
          </p>
          <p className="mt-2 font-heading text-sm font-bold uppercase tracking-wide text-ink-950">
            {caseData.victim.name}
          </p>
          <p className="mt-1 text-sm text-ink-800">{caseData.victim.description}</p>
        </section>
      </div>
    </div>
  );
}