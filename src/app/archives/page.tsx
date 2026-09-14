import Link from "next/link";

import { currentDailyKey, isDailyKeyUnlocked } from "@/lib/daily";
import { formatKey } from "@/lib/format";
import { listCasesForArchive } from "@/server/caseStore";

export const dynamic = "force-dynamic";

export default function ArchivesPage() {
  const today = currentDailyKey();
  const cases = listCasesForArchive()
    .filter((item) => isDailyKeyUnlocked(item.date))
    .sort((a, b) => b.number - a.number);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6">
      <Link href="/" className="btn-ghost mb-6">
        ← Accueil
      </Link>

      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent-soft">Archives</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">AFFAIRES PRÉCÉDENTES</h1>
        <p className="mt-2 text-sm text-paper-300/70">
          Rejouer une archive ne fait pas progresser la série. Le Daily reste le cœur du jeu.
        </p>
      </header>

      <ul className="mt-6 space-y-3">
        {cases.map((item) => {
          const isToday = item.date === today;
          return (
            <li key={item.id}>
              <Link
                href={`/case/${item.date}`}
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
                    (isToday ? "bg-accent-deep text-paper-50" : "bg-ink-700 text-paper-300/70")
                  }
                >
                  {isToday ? "Aujourd'hui" : "Archive"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
