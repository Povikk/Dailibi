"use client";

import { currentDailyKey, isAdjacent } from "@/lib/daily";

export type DayRecord = {
  date: string;
  caseId: string;
  score: number;
  who: boolean;
  why: boolean;
  how: boolean;
  seconds: number;
};

export type DailibiStats = {
  played: number;
  perfect: number;
  whoCorrect: number;
  whyCorrect: number;
  howCorrect: number;
  scoreSum: number;
  history: DayRecord[];
};

export type StreakState = {
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string | null;
};

const STATS_KEY = "dailibi.stats.v1";
const STREAK_KEY = "dailibi.streak.v1";
const ARCHIVES_KEY = "dailibi.archives.v1";

const emptyStats: DailibiStats = {
  played: 0,
  perfect: 0,
  whoCorrect: 0,
  whyCorrect: 0,
  howCorrect: 0,
  scoreSum: 0,
  history: [],
};

export function loadStats(): DailibiStats {
  return readJson<DailibiStats>(STATS_KEY, emptyStats);
}

export function loadStreak(): StreakState {
  return readJson<StreakState>(STREAK_KEY, {
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedDate: null,
  });
}

export function hasPlayed(date: string): boolean {
  return loadDayRecord(date) !== undefined;
}

export function loadDayRecord(date: string): DayRecord | undefined {
  return (
    loadStats().history.find((entry) => entry.date === date) ??
    loadArchiveRecords().find((entry) => entry.date === date)
  );
}

export function loadArchiveRecords(): DayRecord[] {
  return readJson<DayRecord[]>(ARCHIVES_KEY, []);
}

/**
 * Records a completed accusation once per game-day. Replaying the same day
 * only updates the record, it never inflates stats or the streak.
 */
export function recordResult(params: {
  date: string;
  caseId: string;
  score: number;
  who: boolean;
  why: boolean;
  how: boolean;
  seconds: number;
  optional?: boolean;
}): { stats: DailibiStats; streak: StreakState } {
  const { date, caseId, score, seconds, optional, who, why, how } = params;

  const stats = loadStats();
  const existingIndex = stats.history.findIndex((entry) => entry.date === date);
  const record: DayRecord = {
    date,
    caseId,
    score,
    who,
    why,
    how,
    seconds,
  };

  if (optional) {
    const archives = loadArchiveRecords().filter((entry) => entry.date !== date);
    archives.push(record);
    archives.sort((a, b) => (a.date < b.date ? 1 : -1));
    writeJson(ARCHIVES_KEY, archives);
    return { stats, streak: loadStreak() };
  }

  const next = { ...stats, history: [...stats.history] };
  if (existingIndex >= 0) {
    const prev = next.history[existingIndex];
    next.whoCorrect -= prev.who ? 1 : 0;
    next.whyCorrect -= prev.why ? 1 : 0;
    next.howCorrect -= prev.how ? 1 : 0;
    next.perfect -= prev.who && prev.why && prev.how ? 1 : 0;
    next.scoreSum -= prev.score;
    next.history[existingIndex] = record;
  } else {
    next.played += 1;
    next.history.push(record);
  }
  next.whoCorrect += who ? 1 : 0;
  next.whyCorrect += why ? 1 : 0;
  next.howCorrect += how ? 1 : 0;
  next.perfect += who && why && how ? 1 : 0;
  next.scoreSum += score;
  next.history.sort((a, b) => (a.date < b.date ? 1 : -1));

  writeJson(STATS_KEY, next);

  const streak = updateStreak(date);
  return { stats: next, streak };
}

function updateStreak(date: string): StreakState {
  const streak = loadStreak();
  if (streak.lastPlayedDate === date) return streak;

  let current = 1;
  if (streak.lastPlayedDate && isAdjacent(streak.lastPlayedDate, date)) {
    current = streak.currentStreak + 1;
  }
  const next: StreakState = {
    currentStreak: current,
    bestStreak: Math.max(streak.bestStreak, current),
    lastPlayedDate: date,
  };
  writeJson(STREAK_KEY, next);
  return next;
}

/** A played day that is neither today nor yesterday breaks the display streak. */
export function effectiveStreak(streak: StreakState, today = currentDailyKey()): number {
  if (!streak.lastPlayedDate) return 0;
  if (streak.lastPlayedDate === today) return streak.currentStreak;
  if (isAdjacent(streak.lastPlayedDate, today)) return streak.currentStreak;
  return 0;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    if (Array.isArray(fallback)) {
      return (Array.isArray(parsed) ? parsed : fallback) as T;
    }
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or disabled: stats are a convenience, never blocking */
  }
}
