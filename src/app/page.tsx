import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { StatsBar } from "@/components/home/StatsBar";
import { DailyCaseStatus } from "@/components/home/DailyCaseStatus";
import { WelcomeTutorial } from "@/components/home/WelcomeTutorial";
import { currentCase, toClientCase } from "@/server/caseStore";
import { formatKey } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const file = currentCase();
  if (!file) notFound();
  const caseData = toClientCase(file);
  const tutorialSeen = (await cookies()).get("dailibi_tutorial")?.value === "1";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6">
      <header className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-accent-soft">
          Une affaire. Chaque jour.
        </p>
        <h1 className="mt-2 text-5xl font-black tracking-tighter sm:text-6xl">DAILIBI</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-paper-300/70">
          Un jour. Une affaire. Un alibi de trop. La même enquête pour tous les joueurs, une seule
          accusation.
        </p>
        <WelcomeTutorial
          caseHref={`/case/${caseData.date}`}
          initiallyOpen={!tutorialSeen}
        />
      </header>

      <article className="card mt-8 overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-ink-800 bg-ink-800/40 px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-paper-300/70">
          <span className="rounded bg-accent-deep px-2 py-1 text-paper-50">
            Case #{String(caseData.number).padStart(3, "0")}
          </span>
          <span>{formatKey(caseData.date)}</span>
        </div>

        <div className="p-5 sm:p-7">
          <p className="label-meta">L&apos;affaire du jour</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{caseData.title}</h2>
          <p className="mt-2 text-sm text-paper-300/80">{caseData.subtitle}</p>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs uppercase tracking-wider text-paper-300/60">
            <span>{caseData.suspects.length} suspects</span>
            <span>{caseData.clues.length} indices</span>
            <span>~{caseData.estimatedMinutes} min</span>
            <span>{caseData.difficulty}</span>
          </div>

          <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-paper-100/70">
            {caseData.intro}
          </p>

          <DailyCaseStatus date={caseData.date} href={`/case/${caseData.date}`} />
        </div>
      </article>

      <div className="mt-6 flex flex-col items-center gap-3 text-center">
        <StatsBar />
      </div>

    </main>
  );
}
