"use client";

import type { Suspect } from "@/types/case";

const ACCENT: Record<Suspect["accent"], { ring: string; bg: string; label: string }> = {
  cold: { ring: "ring-sky-400/40", bg: "from-sky-900/60 to-ink-800", label: "Réservé" },
  warm: { ring: "ring-amber-400/40", bg: "from-amber-900/50 to-ink-800", label: "Chaleureux" },
  nervous: { ring: "ring-rose-400/40", bg: "from-rose-900/50 to-ink-800", label: "Fébrile" },
  formal: { ring: "ring-slate-300/30", bg: "from-slate-700/60 to-ink-800", label: "Formel" },
  blunt: { ring: "ring-emerald-400/30", bg: "from-emerald-900/40 to-ink-800", label: "Direct" },
};

/** Height-chart mugshot placeholder: initials, no image assets. */
export function SuspectPortrait({ suspect }: { suspect: Suspect }) {
  const initials = suspect.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const accent = ACCENT[suspect.accent];

  return (
    <span
      aria-hidden
      className={`relative flex h-16 w-16 shrink-0 items-end justify-center overflow-hidden rounded-[2px] bg-gradient-to-br ring-2 ${accent.bg} ${accent.ring}`}
    >
      <span className="mb-1 font-heading text-xl font-black text-paper-50">{initials}</span>
      {/* ruler lines of a police height chart */}
      <span className="absolute inset-x-0 top-0 h-full bg-[repeating-linear-gradient(to_bottom,transparent_0_7px,rgba(255,255,255,0.12)_7px_8px)]" />
    </span>
  );
}

export function AccentLabel({ suspect }: { suspect: Suspect }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper-300/50">
      {ACCENT[suspect.accent].label}
    </span>
  );
}