import { beforeEach, describe, expect, it, vi } from "vitest";

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
    const { recordResult, loadStats } = await import("@/lib/storage");
    recordResult({ date: "2026-09-14", caseId: "x", score: 33, who: false, why: false, how: true, seconds: 10 });
    recordResult({ date: "2026-09-14", caseId: "x", score: 100, who: true, why: true, how: true, seconds: 20 });
    const stats = loadStats();
    expect(stats.played).toBe(1);
    expect(stats.perfect).toBe(1);
    expect(stats.scoreSum).toBe(100);
  });

  it("une archive ne fait pas progresser la série", async () => {
    const { recordResult, loadStreak } = await import("@/lib/storage");
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
    expect(streak.currentStreak).toBe(1);
    expect(streak.lastPlayedDate).toBe("2026-09-14");
  });
});