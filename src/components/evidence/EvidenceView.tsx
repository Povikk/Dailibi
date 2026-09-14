"use client";

import type { Evidence } from "@/types/case";
import type { Evidence as EvidenceType } from "@/types/case";

/* Shared chrome: a physical piece pinned to the file */
function Piece({
  children,
  tone = "paper",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "paper" | "thermal" | "dark";
  className?: string;
}) {
  const tones = {
    paper: "bg-paper-100 text-ink-950",
    thermal: "bg-paper-50 text-ink-950",
    dark: "bg-ink-900 text-paper-100 border border-ink-700",
  } as const;
  return (
    <figure className={`sheet grain p-4 ${tones[tone]} ${className}`}>{children}</figure>
  );
}

function Note({ body, altText }: { body: string; altText: string }) {
  return (
    <Piece>
      <p role="img" aria-label={altText} className="whitespace-pre-line font-type text-[15px] leading-loose">
        {body}
      </p>
    </Piece>
  );
}

function Handwriting({
  body,
  signature,
  altText,
}: {
  body: string;
  signature?: string;
  altText: string;
}) {
  return (
    <Piece className="bg-kraft-100">
      <p
        role="img"
        aria-label={altText}
        className="whitespace-pre-line font-type text-[16px] italic leading-loose text-ink-800"
      >
        {body}
      </p>
      {signature ? (
        <p className="mt-3 text-right font-type text-[14px] italic text-ink-700">{signature}</p>
      ) : null}
    </Piece>
  );
}

function Receipt(props: Extract<EvidenceType, { kind: "receipt" }>) {
  const { merchant, address, time, lines, total, card, footer, altText } = props;
  return (
    <div className="perforated bg-paper-50 p-4 pb-6 font-mono text-[12px] text-ink-950 shadow-paper ring-1 ring-black/20">
      <div role="img" aria-label={altText} className="mx-auto max-w-[280px]">
        <p className="text-center font-heading text-[14px] font-bold uppercase tracking-[0.2em]">
          {merchant}
        </p>
        {address ? <p className="text-center text-[11px] text-ink-600">{address}</p> : null}
        <div className="my-2 border-t-2 border-dashed border-ink-500/60" />
        <p className="text-center text-[20px] font-bold tabular-nums">{time}</p>
        <div className="my-2 border-t border-dashed border-ink-500/50" />
        <ul className="space-y-1">
          {lines.map((line, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span>{line.label}</span>
              <span className="tabular-nums">{line.value}</span>
            </li>
          ))}
        </ul>
        <div className="my-2 border-t-2 border-dashed border-ink-500/60" />
        <p className="flex justify-between text-[14px] font-bold">
          <span>TOTAL</span>
          <span className="tabular-nums">{total}</span>
        </p>
        {card ? <p className="mt-1 text-right text-[11px] text-ink-600">{card}</p> : null}
        {footer ? <p className="mt-3 text-center text-[10px] text-ink-600">{footer}</p> : null}
      </div>
    </div>
  );
}

function Sms({ contact, messages, altText }: Extract<EvidenceType, { kind: "sms" }>) {
  return (
    <Piece tone="dark">
      <p className="border-b border-ink-700 pb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-kraft-400">
        {contact}
      </p>
      <ul role="img" aria-label={altText} className="mt-3 space-y-2">
        {messages.map((m, i) => (
          <li key={i} className={m.from === "me" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                "max-w-[85%] rounded-md px-3 py-2 text-[13px] " +
                (m.from === "me"
                  ? "rounded-br-none bg-stamp text-paper-50"
                  : "rounded-bl-none bg-ink-700 text-paper-100")
              }
            >
              <p className="font-sans">{m.text}</p>
              <p className="mt-1 text-right font-mono text-[10px] opacity-70">{m.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </Piece>
  );
}

function Email({ from, to, subject, sentAt, body, altText }: Extract<EvidenceType, { kind: "email" }>) {
  return (
    <Piece>
      <div role="img" aria-label={altText}>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500">{sentAt}</p>
        <p className="mt-1 font-heading text-[15px] font-bold uppercase tracking-wide">{subject}</p>
        <div className="mt-2 border-t border-ink-950/20 pt-2 font-mono text-[12px] text-ink-600">
          <p>
            <span className="font-bold">DE :</span> {from}
          </p>
          <p>
            <span className="font-bold">À :</span> {to}
          </p>
        </div>
        <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed">{body}</p>
      </div>
    </Piece>
  );
}

function Photo({ caption, meta, altText, tone }: Extract<EvidenceType, { kind: "photo" }>) {
  const bg = {
    warm: "bg-gradient-to-br from-amber-200/70 to-orange-900/50",
    cold: "bg-gradient-to-br from-slate-300/70 to-slate-700/70",
    flat: "bg-gradient-to-br from-ink-500/60 to-ink-800",
  } as const;
  return (
    <Piece>
      <figure role="img" aria-label={altText}>
        <div className={`relative flex h-44 items-center justify-center rounded-[1px] ${bg[tone]}`}>
          <span className="font-heading text-[11px] uppercase tracking-[0.3em] text-ink-950/40">
            Cliché photographique
          </span>
        </div>
        <figcaption className="mt-2 font-type text-[13px] italic text-ink-800">{caption}</figcaption>
        {meta.length ? (
          <dl className="mt-2 space-y-0.5 border-t border-dashed border-ink-950/20 pt-2 font-mono text-[11px] text-ink-600">
            {meta.map((m, i) => (
              <div key={i} className="flex justify-between gap-3">
                <dt>{m.label}</dt>
                <dd className="tabular-nums">{m.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </figure>
    </Piece>
  );
}

function Camera({ location, frames, altText }: Extract<EvidenceType, { kind: "camera" }>) {
  return (
    <Piece tone="dark">
      <div className="flex items-center justify-between border-b border-ink-700 pb-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-kraft-400">{location}</p>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-stamp-bright">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-stamp-bright" />
          REC
        </span>
      </div>
      <ol role="img" aria-label={altText} className="mt-3 space-y-3 font-mono text-[12px]">
        {frames.map((frame, i) => (
          <li key={i} className="flex gap-3 border-l-2 border-stamp/60 pl-3">
            <span className="w-12 shrink-0 font-bold tabular-nums text-stamp-bright">{frame.time}</span>
            <span className="text-paper-100/90">{frame.text}</span>
          </li>
        ))}
      </ol>
    </Piece>
  );
}

function Badge({ holder, entries, altText }: Extract<EvidenceType, { kind: "badge" }>) {
  return (
    <Piece>
      <div role="img" aria-label={altText}>
        <div className="flex items-center justify-between border-b-2 border-ink-950/70 pb-2">
          <p className="font-heading text-[14px] font-bold uppercase tracking-wide">{holder}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">Badge d&apos;accès</p>
        </div>
        <ul className="mt-2 space-y-1 font-mono text-[12px]">
          {entries.map((e, i) => (
            <li key={i} className="flex items-center gap-3 border-b border-dashed border-ink-950/10 py-1">
              <span className="tabular-nums">{e.time}</span>
              <span
                className={
                  "rounded-[2px] px-1.5 text-[10px] font-bold " +
                  (e.direction === "IN" ? "bg-good/20 text-good" : "bg-bad/20 text-bad")
                }
              >
                {e.direction}
              </span>
              <span className="text-ink-700">{e.door}</span>
            </li>
          ))}
        </ul>
      </div>
    </Piece>
  );
}

function Schedule({ title, rows, altText }: Extract<EvidenceType, { kind: "schedule" }>) {
  return (
    <Piece>
      <p className="border-b-2 border-ink-950/70 pb-2 font-heading text-[12px] font-bold uppercase tracking-[0.16em]">
        {title}
      </p>
      <ul role="img" aria-label={altText} className="mt-2 divide-y divide-ink-950/10">
        {rows.map((r, i) => (
          <li key={i} className="flex gap-4 py-2 text-[13px]">
            <span className="w-12 shrink-0 font-mono font-bold tabular-nums text-stamp-deep">{r.time}</span>
            <span>{r.label}</span>
          </li>
        ))}
      </ul>
    </Piece>
  );
}

function CallLog({ owner, calls, altText }: Extract<EvidenceType, { kind: "callLog" }>) {
  return (
    <Piece>
      <p className="border-b-2 border-ink-950/70 pb-2 font-heading text-[12px] font-bold uppercase tracking-[0.16em]">
        Journal d&apos;appels · {owner}
      </p>
      <ul role="img" aria-label={altText} className="mt-2 divide-y divide-ink-950/10 font-mono text-[12px]">
        {calls.map((c, i) => (
          <li key={i} className="flex items-center gap-3 py-2">
            <span className="w-12 shrink-0 tabular-nums">{c.time}</span>
            <span
              className={
                "w-16 shrink-0 text-[10px] font-bold uppercase " +
                (c.direction === "MISSED" ? "text-bad" : "text-good")
              }
            >
              {c.direction}
            </span>
            <span className="flex-1 truncate">{c.contact}</span>
            <span className="tabular-nums text-ink-600">{c.duration}</span>
          </li>
        ))}
      </ul>
    </Piece>
  );
}

function MapView({ title, description, distances, altText }: Extract<EvidenceType, { kind: "map" }>) {
  return (
    <Piece>
      <p className="border-b-2 border-ink-950/70 pb-2 font-heading text-[12px] font-bold uppercase tracking-[0.16em]">
        {title}
      </p>
      <p className="mt-2 text-[13px] leading-relaxed">{description}</p>
      <ul role="img" aria-label={altText} className="mt-3 space-y-1 font-mono text-[12px]">
        {distances.map((d, i) => (
          <li key={i} className="flex justify-between gap-3 border-b border-dashed border-ink-950/20 py-1">
            <span>
              {d.from} → {d.to}
            </span>
            <span className="tabular-nums">{d.minutes} min</span>
          </li>
        ))}
      </ul>
    </Piece>
  );
}

function DocPiece({
  title,
  subtitle,
  paragraphs,
  altText,
}: Extract<EvidenceType, { kind: "document" }>) {
  return (
    <Piece>
      <div role="img" aria-label={altText}>
        <p className="font-heading text-[15px] font-bold uppercase tracking-wide">{title}</p>
        {subtitle ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">{subtitle}</p>
        ) : null}
        <div className="mt-3 space-y-2 text-[13px] leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </Piece>
  );
}

export function EvidenceView({ evidence }: { evidence: Evidence }) {
  switch (evidence.kind) {
    case "note":
      return <Note {...evidence} />;
    case "handwriting":
      return <Handwriting {...evidence} />;
    case "receipt":
      return <Receipt {...evidence} />;
    case "sms":
      return <Sms {...evidence} />;
    case "email":
      return <Email {...evidence} />;
    case "photo":
      return <Photo {...evidence} />;
    case "camera":
      return <Camera {...evidence} />;
    case "badge":
      return <Badge {...evidence} />;
    case "schedule":
      return <Schedule {...evidence} />;
    case "callLog":
      return <CallLog {...evidence} />;
    case "map":
      return <MapView {...evidence} />;
    case "document":
      return <DocPiece {...evidence} />;
    default: {
      const exhaustive: never = evidence;
      return exhaustive;
    }
  }
}

export { Piece };
