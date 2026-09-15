"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatKey } from "@/lib/format";
import { loadArchiveRecords } from "@/lib/storage";

type ArchiveSummary = {
  id: string;
  number: number;
  date: string;
  title: string;
  subtitle: string;
};

export function ArchiveList({ cases }: { cases: ArchiveSummary[] }) {
  const [completedDates, setCompletedDates] = useState<Set<string> | null>(null);

  useEffect(() => {
    setCompletedDates(new Set(loadArchiveRecords().map((record) => record.date)));
  }, []);

  return (
    <ul className="mt-6 space-y-3">
      {cases.map((item) => {
        const completed = completedDates?.has(item.date) ?? false;
        return (
          <li key={item.id}>
            <Link
              href={`/case/${item.date}${completed ? "?review=1" : ""}`}
              className="card flex items-center justify-between gap-4 p-4 transition-colors hover:border-accent/60"
            >
              <div className="min-w-0">
                <p className="label-meta">
                  #{String(item.number).padStart(3, "0")} · {formatKey(item.date)}
                </p>
                <p className="mt-1 truncate font-bold">{item.title}</p>
                <p className="truncate text-xs text-paper-300/60">{item.subtitle}</p>
              </div>
              <span
                className={
                  "shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider " +
                  (completed ? "bg-good/20 text-green-300" : "bg-ink-700 text-paper-300/70")
                }
              >
                {completed ? "Terminée" : "À découvrir"}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
