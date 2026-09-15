"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { msUntilNextRollover } from "@/lib/daily";
import { loadBadges, loadEquippedTitle } from "@/lib/storage";
import { titleLabel } from "@/game/badges";

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function DailyStatusBar() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setRemaining(msUntilNextRollover());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const refresh = () => setTitle(titleLabel(loadBadges(), loadEquippedTitle()));
    refresh();
    window.addEventListener("dailibi:title", refresh);
    return () => window.removeEventListener("dailibi:title", refresh);
  }, []);

  return (
    <aside className="fixed inset-x-0 top-0 z-50 h-9 border-b border-ink-700/80 bg-desk-950/95 px-3 backdrop-blur-md sm:px-5">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="font-heading text-[11px] font-black tracking-[0.18em] text-paper-100 transition-colors hover:text-kraft-300"
          >
            DAILIBI
          </Link>
          {title ? (
            <Link
              href="/collection"
              title="Titre équipé, à changer depuis votre collection"
              className="hidden truncate rounded-sm border border-kraft-500/40 bg-kraft-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-kraft-300 transition-colors hover:border-kraft-400 hover:text-kraft-200 sm:inline"
            >
              {title}
            </Link>
          ) : null}
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-paper-300/55 sm:tracking-[0.16em]">
          <span className="hidden sm:inline">Nouvelle affaire dans </span>
          <span className="sm:hidden">Reset </span>
          <span className="font-bold tabular-nums text-kraft-300" suppressHydrationWarning>
            {remaining === null ? "--:--:--" : formatRemaining(remaining)}
          </span>
        </p>

        <nav aria-label="Navigation principale" className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/archives"
            className="text-[10px] font-semibold uppercase tracking-[0.1em] text-paper-300/60 transition-colors hover:text-kraft-300 sm:tracking-[0.13em]"
          >
            Archives
          </Link>
          <Link
            href="/collection"
            className="text-[10px] font-semibold uppercase tracking-[0.1em] text-paper-300/60 transition-colors hover:text-kraft-300 sm:tracking-[0.13em]"
          >
            Collection
          </Link>
          <Link
            href="/historique"
            className="hidden text-[10px] font-semibold uppercase tracking-[0.13em] text-paper-300/60 transition-colors hover:text-paper-100 sm:inline"
          >
            Historique
          </Link>
        </nav>
      </div>
    </aside>
  );
}
