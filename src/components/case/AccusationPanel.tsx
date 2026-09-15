"use client";

import { useMemo, useState } from "react";

import type { AccuseResult, ClientCase } from "@/types/case";
import { ResultPanel } from "@/components/case/ResultPanel";
import { currentDailyKey } from "@/lib/daily";

export function AccusationPanel({
  caseData,
  startedAt,
  onCancel,
}: {
  caseData: ClientCase;
  startedAt: number;
  onCancel: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AccuseResult | null>(null);

  const required = useMemo(
    () => caseData.accusation.questions.filter((q) => !q.optional),
    [caseData.accusation.questions],
  );
  const complete = required.every((q) => answers[q.id]);
  const isArchive = caseData.date !== currentDailyKey();

  if (result) {
    return (
      <ResultPanel
        caseData={caseData}
        result={result}
        seconds={Math.max(1, Math.round((Date.now() - startedAt) / 1000))}
      />
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/case/${caseData.date}/accuse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "L'accusation n'a pas pu être envoyée.");
      }
      setResult((await response.json()) as AccuseResult);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur inconnue.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      <button type="button" className="btn-ghost mb-4" onClick={onCancel} disabled={submitting}>
        ← Revenir à l&apos;enquête
      </button>

      <header className="card p-5 sm:p-6">
        <p className="label-meta">Une seule accusation</p>
        <h1 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">RÉSOUDRE L&apos;AFFAIRE</h1>
        <p className="mt-2 text-sm text-paper-300/80">
          {isArchive
            ? "Vous ne pourrez envoyer qu’une seule réponse. Cette archive ne modifiera pas vos statistiques."
            : "Vous ne pourrez envoyer qu’une seule réponse. Vérifiez avant de valider."}
        </p>
      </header>

      <div className="mt-5 space-y-5">
        {caseData.accusation.questions.map((question, index) => (
          <fieldset key={question.id} className="card p-5">
            <legend className="label-meta">
              Question {index + 1}
              {question.optional ? " · facultative" : ""}
            </legend>
            <p className="mt-2 text-base font-bold">{question.prompt}</p>
            <div className="mt-3 space-y-2">
              {question.options.map((option) => {
                const checked = answers[question.id] === option.id;
                return (
                  <label
                    key={option.id}
                    className={
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors " +
                      (checked
                        ? "border-accent bg-accent/10"
                        : "border-ink-600 bg-ink-800/60 hover:border-ink-500")
                    }
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={checked}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [question.id]: option.id }))
                      }
                      className="mt-1 h-4 w-4 accent-[#b04141]"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{option.label}</span>
                      {option.hint ? (
                        <span className="mt-0.5 block text-xs text-paper-300/60">{option.hint}</span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-lg border border-bad/50 bg-bad/10 px-4 py-3 text-sm text-paper-100">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        {!confirming ? (
          <button
            type="button"
            className="btn-primary w-full"
            disabled={!complete}
            onClick={() => setConfirming(true)}
          >
            {complete ? "Valider mon accusation" : "Répondez aux trois questions"}
          </button>
        ) : (
          <div className="card border-accent/60 p-5">
            <p className="text-sm font-semibold">Confirmer définitivement cette accusation ?</p>
            <p className="mt-1 text-xs text-paper-300/70">
              {isArchive
                ? "Le dossier sera marqué comme consulté, sans modifier vos statistiques."
                : "Le résultat sera enregistré pour l’affaire du jour."}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button type="button" className="btn-primary flex-1" disabled={submitting} onClick={submit}>
                {submitting ? "Analyse du dossier..." : "Oui, accuser"}
              </button>
              <button
                type="button"
                className="btn-ghost flex-1"
                disabled={submitting}
                onClick={() => setConfirming(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
