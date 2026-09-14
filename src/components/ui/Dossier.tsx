export function Stamp({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`stamp ${className}`}>{children}</span>;
}

export function ExhibitTag({ index, label }: { index: number; label?: string }) {
  return (
    <span className="exhibit-tag">
      <span aria-hidden>◆</span>
      PIÈCE {String(index).padStart(2, "0")}
      {label ? <span className="text-paper-100/60">· {label}</span> : null}
    </span>
  );
}

export function FieldLabel({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return <p className={tone === "dark" ? "label-meta-dark" : "label-meta"}>{children}</p>;
}

/** The header strip of an official file. */
export function FileHeader({
  left,
  right,
  confidential = false,
}: {
  left: string;
  right?: string;
  confidential?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink-950/80 px-1 pb-2">
      <p className="font-heading text-[11px] font-bold uppercase tracking-[0.24em] text-ink-800">
        {left}
      </p>
      <div className="flex items-center gap-3">
        {right ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-600">{right}</p>
        ) : null}
        {confidential ? <Stamp>Confidentiel</Stamp> : null}
      </div>
    </div>
  );
}
