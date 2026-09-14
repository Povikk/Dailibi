import { describe, expect, it } from "vitest";

import {
  currentDailyKey,
  dateKey,
  dayNumber,
  formatDisplayDate,
  isAdjacent,
  isDailyKeyUnlocked,
  msUntilNextRollover,
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

  it("formate la date en français", () => {
    expect(formatDisplayDate("2026-09-14")).toContain("SEPTEMBRE");
    expect(formatDisplayDate("2026-09-14")).toContain("2026");
  });
});
