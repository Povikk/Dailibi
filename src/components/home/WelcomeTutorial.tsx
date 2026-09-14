"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const TUTORIAL_COOKIE = "dailibi_tutorial";

export function WelcomeTutorial({
  caseHref,
  initiallyOpen,
}: {
  caseHref: string;
  initiallyOpen: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(initiallyOpen);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    startButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function startInvestigation() {
    document.cookie = `${TUTORIAL_COOKIE}=1; Max-Age=31536000; Path=/; SameSite=Lax`;
    setOpen(false);
    router.push(caseHref);
  }

  return (
    <>
      <button
        type="button"
        className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-paper-300/45 underline decoration-ink-600 underline-offset-4 transition-colors hover:text-paper-100"
        onClick={() => setOpen(true)}
      >
        Comment jouer ?
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-desk-950/70 px-4 py-8 backdrop-blur-md">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
            aria-describedby="tutorial-description"
            className="card animate-tick w-full max-w-lg overflow-hidden border-kraft-500/50 text-left shadow-[0_30px_90px_rgba(0,0,0,0.75)]"
          >
            <div className="border-b border-ink-700 bg-ink-800/70 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-kraft-400">
              Briefing · Première mission
            </div>

            <div className="p-5 sm:p-7">
              <p className="label-meta">Bienvenue, enquêteur</p>
              <h2 id="tutorial-title" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                UNE AFFAIRE. CHAQUE JOUR.
              </h2>
              <p id="tutorial-description" className="mt-3 text-sm leading-relaxed text-paper-300/75">
                Tous les joueurs reçoivent le même dossier. À vous d&apos;observer ce qui cloche,
                de confronter les versions et de reconstruire la vérité.
              </p>

              <ol className="mt-6 space-y-4">
                <li className="flex gap-4">
                  <span className="font-mono text-xs font-bold text-stamp-bright">01</span>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide">Explorez le dossier</h3>
                    <p className="mt-1 text-xs leading-relaxed text-paper-300/60">
                      Lisez les témoignages, ouvrez les pièces et replacez les événements dans le temps.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="font-mono text-xs font-bold text-stamp-bright">02</span>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide">Croisez les détails</h3>
                    <p className="mt-1 text-xs leading-relaxed text-paper-300/60">
                      Un horaire impossible, une phrase de trop ou un indice discret peut faire tomber un alibi.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="font-mono text-xs font-bold text-stamp-bright">03</span>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide">Portez votre accusation</h3>
                    <p className="mt-1 text-xs leading-relaxed text-paper-300/60">
                      Quand votre théorie tient, désignez qui a agi, pourquoi et comment.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="mt-6 border-l-2 border-kraft-500/60 bg-ink-950/35 px-4 py-3">
                <p className="font-type text-xs leading-relaxed text-kraft-300">
                  Aucune connaissance extérieure n&apos;est nécessaire. Toute la vérité se cache dans le dossier.
                </p>
              </div>

              <button
                ref={startButtonRef}
                type="button"
                className="btn-primary mt-6 w-full text-base"
                onClick={startInvestigation}
              >
                Ouvrir le dossier →
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
