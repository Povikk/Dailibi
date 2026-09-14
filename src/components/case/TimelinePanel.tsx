import type { ClientCase } from "@/types/case";

const CERTAINTY_LABEL = {
  CERTAIN: "Établi",
  REPORTED: "Déclaré",
  ESTIMATED: "Estimé",
} as const;

const CERTAINTY_COLOR = {
  CERTAIN: "text-good border-good/40",
  REPORTED: "bg-ink-950/5 text-ink-600 border-ink-500/45",
  ESTIMATED: "text-marker border-marker/40",
} as const;

export function TimelinePanel({ caseData }: { caseData: ClientCase }) {
  return (
    <div className="sheet grain p-5">
      <div className="flex items-center justify-between border-b-2 border-ink-950/80 pb-2">
        <p className="font-heading text-[11px] font-bold uppercase tracking-[0.24em] text-ink-800">
          Chronologie des faits
        </p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
          Heure locale
        </p>
      </div>

      <ol className="mt-4 border-l-2 border-ink-950/20 pl-6">
        {caseData.timeline.map((entry, i) => (
          <li key={i} className="relative py-3">
            <span
              aria-hidden
              className="absolute -left-[31px] top-[18px] h-2.5 w-2.5 rotate-45 bg-stamp ring-4 ring-paper-100"
            />
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-mono text-sm font-bold tabular-nums text-stamp-deep">{entry.time}</span>
              <span
                className={
                  "rounded-[2px] border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider " +
                  CERTAINTY_COLOR[entry.certainty]
                }
              >
                {CERTAINTY_LABEL[entry.certainty]}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-900">{entry.text}</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Source : {entry.source}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
