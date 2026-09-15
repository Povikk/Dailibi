import Link from "next/link";

import { ArchiveList } from "@/components/archives/ArchiveList";
import { currentDailyKey } from "@/lib/daily";
import { listCasesForArchive } from "@/server/caseStore";

export const dynamic = "force-dynamic";

export default function ArchivesPage() {
  const today = currentDailyKey();
  const cases = listCasesForArchive()
    .filter((item) => item.date < today)
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
          Explorez les dossiers des jours précédents à votre rythme. Les archives ne modifient
          ni vos statistiques ni votre série quotidienne.
        </p>
      </header>

      <ArchiveList cases={cases} />
    </main>
  );
}
