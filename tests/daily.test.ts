import { describe, expect, it } from "vitest";

import {
  currentDailyKey,
  dateKey,
  dayNumber,
  formatDisplayDate,
  isAdjacent,
  isDailyKeyUnlocked,
  isValidDayKey,
  msUntilNextRollover,
  nextKey,
  previousKey,
} from "@/lib/daily";

describe("daily", () => {
  it("produit une clé stable au format YYYY-MM-DD", () => {
    expect(dateKey(new Date("2026-09-14T12:00:00Z"))).toBe("2026-09-14");
  });

  it("bascule de jour à minuit heure de Paris", () => {
    // 22:00 UTC en été = 00:00 à Paris (UTC+2) le lendemain.
    expect(currentDailyKey(new Date("2026-07-01T21:59:00Z"))).toBe("2026-07-01");
    expect(currentDailyKey(new Date("2026-07-01T22:01:00Z"))).toBe("2026-07-02");
  });

  it("gère le passage à l'heure d'hiver", () => {
    expect(currentDailyKey(new Date("2026-12-01T22:30:00Z"))).toBe("2026-12-01");
    expect(currentDailyKey(new Date("2026-12-01T23:30:00Z"))).toBe("2026-12-02");
  });

  it("calcule un numéro de jour continu", () => {
    expect(dayNumber("2026-09-15") - dayNumber("2026-09-14")).toBe(1);
  });

  it("reconnaît deux jours adjacents", () => {
    expect(isAdjacent("2026-09-14", "2026-09-15")).toBe(true);
    expect(isAdjacent("2026-09-14", "2026-09-16")).toBe(false);
  });

  it("previousKey recule d'un jour", () => {
    expect(previousKey("2026-09-14")).toBe("2026-09-13");
    expect(previousKey("2026-03-01")).toBe("2026-02-28");
  });

  it("verrouille les affaires futures selon la journée de Paris", () => {
    const now = new Date("2026-09-14T12:00:00Z");
    expect(isDailyKeyUnlocked("2026-09-13", now)).toBe(true);
    expect(isDailyKeyUnlocked("2026-09-14", now)).toBe(true);
    expect(isDailyKeyUnlocked("2026-09-15", now)).toBe(false);
  });

  it("le compte à rebours reste positif et sous 24h", () => {
    const ms = msUntilNextRollover(new Date("2026-09-14T12:00:00Z"));
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(24 * 3600 * 1000);
  });

  it("vise exactement le minuit parisien du jour suivant", () => {
    for (const iso of [
      "2026-09-14T12:00:00Z",
      "2026-12-01T05:30:00Z",
      "2026-07-01T21:00:00Z",
      "2026-01-31T23:59:00Z",
    ]) {
      const now = new Date(iso);
      const nextMidnight = new Date(now.getTime() + msUntilNextRollover(now));
      expect(dateKey(nextMidnight), iso).toBe(nextKey(currentDailyKey(now)));
      expect(nextMidnight.getTime(), iso).toBeGreaterThan(now.getTime());
    }
  });

  it("ne dérive pas d'une heure lors du passage à l'heure d'hiver", () => {
    // Dimanche 25 octobre 2026 : la journée dure 25 heures. Le minuit parisien
    // suivant tombe à 23:00 UTC, soit 11 h après midi UTC.
    const now = new Date("2026-10-25T12:00:00Z");
    expect(currentDailyKey(now)).toBe("2026-10-25");
    expect(msUntilNextRollover(now)).toBe(11 * 3600 * 1000);
  });

  it("ne dérive pas d'une heure lors du passage à l'heure d'été", () => {
    // Dimanche 29 mars 2026 : la journée dure 23 heures. Le minuit parisien
    // suivant tombe à 22:00 UTC, soit 22 h après minuit UTC.
    const now = new Date("2026-03-29T00:00:00Z");
    expect(currentDailyKey(now)).toBe("2026-03-29");
    expect(msUntilNextRollover(now)).toBe(22 * 3600 * 1000);
  });

  it("valide les dates mais rejette les jours impossibles", () => {
    expect(isValidDayKey("2026-09-14")).toBe(true);
    expect(isValidDayKey("2024-02-29")).toBe(true);
    expect(isValidDayKey("2026-02-28")).toBe(true);

    expect(isValidDayKey("2026-02-31")).toBe(false);
    expect(isValidDayKey("2025-02-29")).toBe(false);
    expect(isValidDayKey("2026-13-01")).toBe(false);
    expect(isValidDayKey("2026-00-10")).toBe(false);
    expect(isValidDayKey("2026-04-31")).toBe(false);
    expect(isValidDayKey("2026-9-4")).toBe(false);
    expect(isValidDayKey("not-a-date")).toBe(false);
    expect(isValidDayKey("")).toBe(false);
  });

  it("nextKey avance d'un jour", () => {
    expect(nextKey("2026-09-14")).toBe("2026-09-15");
    expect(nextKey("2026-02-28")).toBe("2026-03-01");
  });

  it("formate la date en français", () => {
    expect(formatDisplayDate("2026-09-14")).toContain("SEPTEMBRE");
    expect(formatDisplayDate("2026-09-14")).toContain("2026");
  });
});
