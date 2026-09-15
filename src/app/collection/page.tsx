import Link from "next/link";

import { BadgesPanel } from "@/components/history/BadgesPanel";

export const dynamic = "force-dynamic";

export default function CollectionPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-8 sm:px-6">
      <Link href="/" className="btn-ghost mb-6">
        ← Accueil
      </Link>

      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent-soft">
          Profil local
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">MA COLLECTION</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-paper-300/65">
          Cinquante distinctions à débloquer, des titres à équiper et un grade qui monte avec les
          points. Votre code de secours permet de retrouver tout cela sur un autre appareil.
        </p>
      </header>

      <BadgesPanel />
    </main>
  );
}
