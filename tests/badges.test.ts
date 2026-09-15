import { describe, expect, it } from "vitest";

import {
  BADGES,
  earnedPoints,
  evaluateAllBadges,
  findBadge,
  newlyEarnedBadges,
  rankFor,
  resolveEquipped,
  sanitizeSnapshot,
  totalPoints,
  unlockedTitles,
  type BadgeContext,
  type ProgressCount,
} from "@/game/badges";
import type { DailibiStats, DayRecord, StreakState } from "@/lib/storage";

function emptyContext(): BadgeContext {
  const stats: DailibiStats = {
    played: 0,
    perfect: 0,
    whoCorrect: 0,
    whyCorrect: 0,
    howCorrect: 0,
    scoreSum: 0,
    history: [],
  };
  const streak: StreakState = { currentStreak: 0, bestStreak: 0, lastPlayedDate: null };
  return { stats, streak, archivesCount: 0, progress: {}, notesCount: 0 };
}

function withStats(
  context: BadgeContext,
  stats: Partial<DailibiStats>,
): BadgeContext {
  return { ...context, stats: { ...context.stats, ...stats } };
}

function record(overrides: Partial<DayRecord> = {}): DayRecord {
  return {
    date: "2026-09-01",
    caseId: "case-a",
    score: 100,
    who: true,
    why: true,
    how: true,
    seconds: 300,
    ...overrides,
  };
}

function progress(overrides: Partial<ProgressCount> = {}): ProgressCount {
  return {
    cluesFound: 0,
    cluesTotal: 5,
    suspectsSeen: 0,
    suspectsTotal: 3,
    ...overrides,
  };
}

describe("catalogue de badges", () => {
  it("contient exactement 50 badges aux identifiants uniques", () => {
    expect(BADGES).toHaveLength(50);
    const ids = BADGES.map((badge) => badge.id);
    expect(new Set(ids).size).toBe(50);
  });

  it("a des objectifs et des points valides", () => {
    for (const badge of BADGES) {
      expect(badge.target, badge.id).toBeGreaterThanOrEqual(1);
      expect(badge.points, badge.id).toBeGreaterThan(0);
      expect(badge.label.length, badge.id).toBeGreaterThan(0);
      expect(badge.description.length, badge.id).toBeGreaterThan(0);
    }
  });

  it("utilise des titres uniques et atteignables", () => {
    const titles = BADGES.filter((badge) => badge.title).map((badge) => badge.title!);
    expect(new Set(titles).size).toBe(titles.length);
    expect(titles.length).toBeGreaterThanOrEqual(15);
  });

  it("expose un total de points supérieur au dernier grade", () => {
    expect(totalPoints()).toBeGreaterThan(rankFor(Number.MAX_SAFE_INTEGER)?.min ?? 0);
  });
});

describe("évaluation sur un profil vierge", () => {
  it("ne débloque rien", () => {
    const states = evaluateAllBadges(emptyContext());
    expect(states.every((state) => !state.unlocked)).toBe(true);
    expect(states.every((state) => state.value === 0)).toBe(true);
  });
});

describe("badges de progression", () => {
  it("débloque le premier dossier et pas le troisième", () => {
    const ctx = withStats(emptyContext(), { played: 1 });
    const states = evaluateAllBadges(ctx);
    const first = states.find((state) => state.badge.id === "prog_1")!;
    const third = states.find((state) => state.badge.id === "prog_3")!;
    expect(first.unlocked).toBe(true);
    expect(third.unlocked).toBe(false);
    expect(third.value).toBe(1);
    expect(third.target).toBe(3);
  });

  it("accorde un titre au palier atteint", () => {
    const ctx = withStats(emptyContext(), { played: 5 });
    const earned = Object.fromEntries(
      evaluateAllBadges(ctx)
        .filter((state) => state.unlocked)
        .map((state) => [state.badge.id, "2026-09-01T00:00:00.000Z"]),
    );
    expect(unlockedTitles(earned)).toContain("Enquêteur");
  });
});

describe("badges de résolution et de série", () => {
  it("suit les affaires parfaites", () => {
    const ctx = withStats(emptyContext(), { played: 10, perfect: 3 });
    const ten = evaluateAllBadges(ctx).find((state) => state.badge.id === "res_10")!;
    expect(ten.unlocked).toBe(false);
    expect(ten.value).toBe(3);
  });

  it("suit la meilleure série", () => {
    const ctx = { ...emptyContext(), streak: { currentStreak: 1, bestStreak: 7, lastPlayedDate: "2026-09-07" } };
    expect(evaluateAllBadges(ctx).find((s) => s.badge.id === "serie_7")!.unlocked).toBe(true);
    expect(evaluateAllBadges(ctx).find((s) => s.badge.id === "serie_10")!.unlocked).toBe(false);
  });
});

describe("badges de précision", () => {
  it("exige un volume minimal avant de récompenser un pourcentage", () => {
    const lucky = withStats(emptyContext(), { played: 1, whoCorrect: 1 });
    expect(evaluateAllBadges(lucky).find((s) => s.badge.id === "prec_who_50")!.unlocked).toBe(false);

    const solid = withStats(emptyContext(), { played: 5, whoCorrect: 5 });
    expect(evaluateAllBadges(solid).find((s) => s.badge.id === "prec_who_50")!.unlocked).toBe(true);
  });

  it("plafonne l'affichage à l'objectif", () => {
    const ctx = withStats(emptyContext(), { played: 10, whoCorrect: 10 });
    const state = evaluateAllBadges(ctx).find((s) => s.badge.id === "prec_who_50")!;
    expect(state.value).toBe(50);
    expect(state.target).toBe(50);
  });
});

describe("badges de rapidité", () => {
  it("ne récompense qu'une affaire réellement résolue", () => {
    const failedFast = withStats(emptyContext(), {
      played: 1,
      history: [record({ who: false, why: false, how: false, seconds: 30 })],
    });
    expect(evaluateAllBadges(failedFast).find((s) => s.badge.id === "speed_90")!.unlocked).toBe(false);

    const solvedFast = withStats(emptyContext(), {
      played: 1,
      history: [record({ seconds: 80 })],
    });
    expect(evaluateAllBadges(solvedFast).find((s) => s.badge.id === "speed_90")!.unlocked).toBe(true);
  });
});

describe("badges de méthode", () => {
  it("récompense une affaire entièrement explorée", () => {
    const ctx = {
      ...emptyContext(),
      progress: {
        "case-a": progress({ cluesFound: 5, suspectsSeen: 3 }),
      },
    };
    expect(evaluateAllBadges(ctx).find((s) => s.badge.id === "method_complete_3")!.value).toBe(1);
    expect(evaluateAllBadges(ctx).find((s) => s.badge.id === "method_clues_1")!.unlocked).toBe(true);
  });

  it("ne récompense pas une exploration partielle", () => {
    const ctx = {
      ...emptyContext(),
      progress: { "case-a": progress({ cluesFound: 1, suspectsSeen: 1 }) },
    };
    expect(evaluateAllBadges(ctx).find((s) => s.badge.id === "method_complete_3")!.value).toBe(0);
    expect(evaluateAllBadges(ctx).find((s) => s.badge.id === "method_clues_1")!.unlocked).toBe(false);
  });
});

describe("nouveaux badges et titre équipé", () => {
  it("ne renvoie que les badges non encore enregistrés", () => {
    const ctx = withStats(emptyContext(), { played: 3 });
    const first = newlyEarnedBadges(ctx, {});
    expect(first).toContain("prog_1");
    expect(first).toContain("prog_3");

    const earned = Object.fromEntries(
      evaluateAllBadges(ctx)
        .filter((state) => state.unlocked)
        .map((state) => [state.badge.id, "2026-09-01T00:00:00.000Z"]),
    );
    expect(newlyEarnedBadges(ctx, earned)).toEqual([]);
  });

  it("calcule les points et le grade", () => {
    const earned = { prog_1: "x", prog_3: "x", prog_5: "x" };
    expect(earnedPoints(earned)).toBe(15);
    expect(rankFor(0).id).toBe("auxiliaire");
    expect(rankFor(45).id).toBe("enqueteur");
    expect(rankFor(400).id).toBe("legende");
  });

  it("retire un titre dont le badge n'est pas acquis", () => {
    const titan = BADGES.find((badge) => badge.title === "Enquêteur")!;
    expect(titan).toBeDefined();
    expect(findBadge(titan.id)).toBeDefined();
    expect(resolveEquipped({}, titan.id)).toBeNull();
    expect(resolveEquipped({ [titan.id]: "x" }, titan.id)).toBe(titan.id);
  });
});

describe("assainissement des entrées non fiables", () => {
  it("remet à zéro tout ce qui est malformé", () => {
    const context = sanitizeSnapshot({
      stats: { played: "beaucoup", perfect: -3, history: "pas-un-tableau" },
      streak: { bestStreak: 4.7, lastPlayedDate: 42 },
      archivesCount: "x",
      progress: { "case-a": { cluesFound: "x", cluesTotal: 5 } },
      notesCount: null,
    });

    expect(context.stats.played).toBe(0);
    expect(context.stats.perfect).toBe(0);
    expect(context.stats.history).toEqual([]);
    expect(context.streak.bestStreak).toBe(4);
    expect(context.streak.lastPlayedDate).toBeNull();
    expect(context.archivesCount).toBe(0);
    expect(context.progress["case-a"]).toEqual({
      cluesFound: 0,
      cluesTotal: 5,
      suspectsSeen: 0,
      suspectsTotal: 0,
    });
    expect(context.notesCount).toBe(0);
  });

  it("filtre les entrées de chronologie inexploitables", () => {
    const context = sanitizeSnapshot({
      stats: {
        played: 2,
        history: [
          { date: "2026-09-14", caseId: "x", score: 100, who: true, why: true, how: true, seconds: 120 },
          { date: "", caseId: "y" },
          null,
        ],
      },
    });

    expect(context.stats.played).toBe(2);
    expect(context.stats.history).toHaveLength(1);
    expect(context.stats.history[0].caseId).toBe("x");
  });
});
