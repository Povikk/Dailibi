import { describe, expect, it, vi } from "vitest";

import type { AccuseResult } from "@/types/case";

vi.mock("server-only", () => ({}));

const result: AccuseResult = {
  caseId: "le-dernier-service",
  date: "2026-09-14",
  correct: true,
  partial: false,
  score: 100,
  perQuestion: { q_who: true, q_why: true, q_how: true },
  culprit: { id: "emma", name: "Emma Roussel" },
  solution: {
    culpritId: "emma",
    culpritName: "Emma Roussel",
    motive: "Couvrir les écarts de caisse",
    method: "Le code du coffre",
    reasoning: ["a", "b"],
    explanation: "explication",
    correctTimeline: [],
    proofChains: [],
  },
};

describe("statistiques hors Cloudflare", () => {
  it("dégrade proprement quand il n'y a pas de base", async () => {
    const { getCaseStats, hasPlayerRecorded, recordAccusation } = await import(
      "@/server/stats"
    );

    // Enregistrer ne doit jamais lever, même sans binding D1.
    await expect(
      recordAccusation({
        result,
        answers: { q_who: "emma" },
        playerSecret: "appareil-de-test-0123456789",
      }),
    ).resolves.toBeUndefined();

    await expect(getCaseStats("le-dernier-service")).resolves.toBeUndefined();
    await expect(
      hasPlayerRecorded("le-dernier-service", "appareil-de-test-0123456789"),
    ).resolves.toBe(false);
  });
});
