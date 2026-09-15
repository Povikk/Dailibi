import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AccuseResult } from "@/types/case";

vi.mock("server-only", () => ({}));

function installStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
  (globalThis as unknown as { window: unknown }).window = { localStorage };
  return store;
}

describe("storage: stats et streak", () => {
  beforeEach(() => {
    installStorage();
  });

  it("enregistre une première partie et démarre la série à 1", async () => {
    const { recordResult, loadStats, loadStreak } = await import("@/lib/storage");
    const { streak, stats } = recordResult({
      date: "2026-09-14",
      caseId: "x",
      score: 100,
      who: true,
      why: true,
      how: true,
      seconds: 300,
    });
    expect(streak.currentStreak).toBe(1);
    expect(streak.bestStreak).toBe(1);
    expect(stats.played).toBe(1);
    expect(stats.perfect).toBe(1);
    expect(loadStreak().lastPlayedDate).toBe("2026-09-14");
  });

  it("incrémente la série un jour adjacent", async () => {
    const { recordResult } = await import("@/lib/storage");
    recordResult({ date: "2026-09-14", caseId: "x", score: 100, who: true, why: true, how: true, seconds: 1 });
    const { streak } = recordResult({
      date: "2026-09-15",
      caseId: "y",
      score: 100,
      who: true,
      why: true,
      how: true,
      seconds: 1,
    });
    expect(streak.currentStreak).toBe(2);
    expect(streak.bestStreak).toBe(2);
  });

  it("réinitialise la série après un jour manqué", async () => {
    const { recordResult } = await import("@/lib/storage");
    recordResult({ date: "2026-09-14", caseId: "x", score: 100, who: true, why: true, how: true, seconds: 1 });
    const { streak } = recordResult({
      date: "2026-09-17",
      caseId: "z",
      score: 100,
      who: true,
      why: true,
      how: true,
      seconds: 1,
    });
    expect(streak.currentStreak).toBe(1);
    expect(streak.bestStreak).toBe(1);
  });

  it("ne double pas les statistiques si le joueur rejoue le même jour", async () => {
    const { recordResult, loadDayRecord, loadStats } = await import("@/lib/storage");
    recordResult({ date: "2026-09-14", caseId: "x", score: 33, who: false, why: false, how: true, seconds: 10 });
    recordResult({ date: "2026-09-14", caseId: "x", score: 100, who: true, why: true, how: true, seconds: 20 });
    const stats = loadStats();
    expect(stats.played).toBe(1);
    expect(stats.perfect).toBe(1);
    expect(stats.scoreSum).toBe(100);
    expect(loadDayRecord("2026-09-14")?.score).toBe(100);
  });

  it("une archive est mémorisée sans modifier les statistiques ni la série", async () => {
    const { recordResult, loadDayRecord, loadStats, loadStreak } = await import("@/lib/storage");
    recordResult({ date: "2026-09-14", caseId: "x", score: 100, who: true, why: true, how: true, seconds: 1 });
    recordResult({
      date: "2026-08-01",
      caseId: "old",
      score: 100,
      who: true,
      why: true,
      how: true,
      seconds: 1,
      optional: true,
    });
    const streak = loadStreak();
    const stats = loadStats();
    expect(streak.currentStreak).toBe(1);
    expect(streak.lastPlayedDate).toBe("2026-09-14");
    expect(stats.played).toBe(1);
    expect(stats.perfect).toBe(1);
    expect(stats.history).toHaveLength(1);
    expect(loadDayRecord("2026-08-01")?.caseId).toBe("old");
  });
});

describe("storage: notes et relecture", () => {
  beforeEach(() => {
    installStorage();
  });

  it("conserve les notes par affaire sur l'appareil", async () => {
    const { loadNotes, saveNotes } = await import("@/lib/storage");
    expect(loadNotes("case-a")).toBe("");

    saveNotes("case-a", "L'horloge avance de dix minutes.");
    saveNotes("case-b", "Autre dossier");

    expect(loadNotes("case-a")).toBe("L'horloge avance de dix minutes.");
    expect(loadNotes("case-b")).toBe("Autre dossier");

    saveNotes("case-a", "");
    expect(loadNotes("case-a")).toBe("");
  });

  it("mémorise le résultat canonique d'une accusation", async () => {
    const { loadReviewResult, saveReviewResult } = await import("@/lib/storage");
    const result: AccuseResult = {
      caseId: "c1",
      date: "2026-09-14",
      correct: true,
      partial: false,
      score: 100,
      perQuestion: { q_who: true, q_why: true, q_how: true },
      culprit: { id: "emma", name: "Emma" },
      solution: {
        culpritId: "emma",
        culpritName: "Emma",
        motive: "Dette",
        method: "Substitution",
        reasoning: ["a", "b"],
        explanation: "explication",
        correctTimeline: [
          { time: "21:00", place: "salle", personIds: ["emma"], text: "fait" },
        ],
        proofChains: [{ title: "chaîne", steps: ["un", "deux"] }],
      },
    };

    expect(loadReviewResult("2026-09-14")).toBeUndefined();
    saveReviewResult(result);
    expect(loadReviewResult("2026-09-14")?.score).toBe(100);
    expect(loadReviewResult("2026-09-15")).toBeUndefined();
  });

  it("reprend la progression d'une enquête", async () => {
    const { loadProgress, saveProgress } = await import("@/lib/storage");
    expect(loadProgress("case-a")).toEqual({
      foundClues: [],
      inspectedSuspects: [],
      cluesTotal: 0,
      suspectsTotal: 0,
    });

    saveProgress("case-a", {
      foundClues: ["clue-1", "clue-2"],
      inspectedSuspects: ["emma"],
      cluesTotal: 6,
      suspectsTotal: 3,
    });
    expect(loadProgress("case-a")).toEqual({
      foundClues: ["clue-1", "clue-2"],
      inspectedSuspects: ["emma"],
      cluesTotal: 6,
      suspectsTotal: 3,
    });

    saveProgress("case-a", {
      foundClues: [],
      inspectedSuspects: [],
      cluesTotal: 0,
      suspectsTotal: 0,
    });
    expect(loadProgress("case-a")).toEqual({
      foundClues: [],
      inspectedSuspects: [],
      cluesTotal: 0,
      suspectsTotal: 0,
    });
  });
});

describe("storage: données corrompues", () => {
  it("retombe toujours sur des valeurs saines", async () => {
    const store = installStorage();
    store.set("dailibi.stats.v1", '{"played":"beaucoup","history":"pas-un-tableau"}');
    store.set("dailibi.streak.v1", '{"currentStreak":-4,"lastPlayedDate":42}');
    store.set("dailibi.archives.v1", '[{"date":"2026-09-01"},null,7]');
    store.set("dailibi.review.v1", '{"2026-09-14":{"score":"x"}}');
    store.set("dailibi.notes.v1", '["pas-un-objet"]');
    store.set(
      "dailibi.progress.v1",
      '{"case-a":{"foundClues":"pas-un-tableau","inspectedSuspects":[1,"ok",null]}}',
    );

    const {
      loadArchiveRecords,
      loadDayRecord,
      loadNotes,
      loadProgress,
      loadReviewResult,
      loadStats,
      loadStreak,
    } = await import("@/lib/storage");

    expect(loadStats().played).toBe(0);
    expect(loadStats().history).toEqual([]);
    expect(loadStreak()).toEqual({ currentStreak: 0, bestStreak: 0, lastPlayedDate: null });
    expect(loadArchiveRecords()).toEqual([]);
    expect(loadReviewResult("2026-09-14")).toBeUndefined();
    expect(loadNotes("case-a")).toBe("");
    expect(loadProgress("case-a")).toEqual({
      foundClues: [],
      inspectedSuspects: ["ok"],
      cluesTotal: 0,
      suspectsTotal: 0,
    });
    expect(loadDayRecord("2026-09-14")).toBeUndefined();

    // Un JSON invalide ne doit pas lever, seulement retomber sur les défauts.
    store.set("dailibi.stats.v1", "{pas du json");
    expect(loadStats().played).toBe(0);
  });
});
