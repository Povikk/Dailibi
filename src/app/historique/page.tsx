import Link from "next/link";

import { HistoryView } from "@/components/history/HistoryView";
import { isDailyKeyUnlocked } from "@/lib/daily";
import { listCasesForArchive } from "@/server/caseStore";

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  const cases = listCasesForArchive()
    .filter((item) => isDailyKeyUnlocked(item.date))
    .map(({ id, number, title }) => ({ id, number, title }));

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-8 sm:px-6">
      <Link href="/" className="btn-ghost mb-6">
        ← Accueil
      </Link>

      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent-soft">
          Profil local
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">VOTRE HISTORIQUE</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-paper-300/65">
          Vos affaires résolues, votre précision et les détails de chaque accusation.
        </p>
      </header>

      <HistoryView cases={cases} />
    </main>
  );
}
