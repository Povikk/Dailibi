"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { loadDayRecord, type DayRecord } from "@/lib/storage";

export function DailyCaseStatus({ date, href }: { date: string; href: string }) {
  const [record, setRecord] = useState<DayRecord | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setRecord(loadDayRecord(date) ?? null);
    setLoaded(true);
  }, [date]);

  if (!loaded) {
    return (
      <div
        aria-hidden="true"
        className="mt-6 h-[50px] animate-pulse rounded-sm border border-ink-800 bg-ink-900/35"
      />
    );
  }

  if (!record) {
    return (
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href={href} className="btn-primary text-base">
          Commencer l&apos;enquête
        </Link>
        <Link href="/archives" className="btn-ghost">
          Archives
        </Link>
      </div>
    );
  }

  const solved = record.who && record.why && record.how;

  return (
    <div className="mt-6 border-t border-ink-700 pt-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="stamp animate-stamp shrink-0">
            {solved ? "Enquête résolue" : "Enquête classée"}
          </span>
          <div>
            <p className="font-mono text-xl font-black tabular-nums text-paper-50">{record.score}%</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-paper-300/45">
              Résultat enregistré
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={href} className="btn-ghost">
            Revoir le dossier
          </Link>
          <Link href="/historique" className="btn-ghost">
            Mon historique
          </Link>
        </div>
      </div>
    </div>
  );
}
