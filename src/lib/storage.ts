"use client";

import { currentDailyKey, isAdjacent } from "@/lib/daily";
import type { AccuseResult } from "@/types/case";

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
const REVIEW_KEY = "dailibi.review.v1";
const NOTES_KEY = "dailibi.notes.v1";
const PROGRESS_KEY = "dailibi.progress.v1";

export function loadStats(): DailibiStats {
  const raw = readJson<Record<string, unknown>>(STATS_KEY, {});
  const history = Array.isArray(raw.history) ? raw.history.filter(isDayRecord) : [];
  return {
    played: count(raw.played, history.length),
    perfect: count(raw.perfect),
    whoCorrect: count(raw.whoCorrect),
    whyCorrect: count(raw.whyCorrect),
    howCorrect: count(raw.howCorrect),
    scoreSum: count(raw.scoreSum),
    history,
  };
}

export function loadStreak(): StreakState {
  const raw = readJson<Record<string, unknown>>(STREAK_KEY, {});
  return {
    currentStreak: count(raw.currentStreak),
    bestStreak: count(raw.bestStreak),
    lastPlayedDate: typeof raw.lastPlayedDate === "string" ? raw.lastPlayedDate : null,
  };
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
  return readJson<unknown[]>(ARCHIVES_KEY, []).filter(isDayRecord);
}

/**
 * Canonical solution of a finished accusation, kept on the device.
 *
 * Storing it here (instead of fetching a public review endpoint) means the
 * solution never leaves the server until the player has actually accused,
 * and re-reading a dossier works offline.
 */
export function saveReviewResult(result: AccuseResult): void {
  const map = readJson<Record<string, unknown>>(REVIEW_KEY, {});
  map[result.date] = result;
  writeJson(REVIEW_KEY, map);
}

export function loadReviewResult(date: string): AccuseResult | undefined {
  const map = readJson<Record<string, unknown>>(REVIEW_KEY, {});
  const value = map[date];
  return isAccuseResult(value) ? value : undefined;
}

/** Player notes, scoped per case and kept only on the device. */
export function loadNotes(caseId: string): string {
  const map = readJson<Record<string, unknown>>(NOTES_KEY, {});
  const value = map[caseId];
  return typeof value === "string" ? value : "";
}

export function saveNotes(caseId: string, text: string): void {
  const map = readJson<Record<string, unknown>>(NOTES_KEY, {});
  if (text) {
    map[caseId] = text;
  } else {
    delete map[caseId];
  }
  writeJson(NOTES_KEY, map);
}

export type CaseProgress = {
  foundClues: string[];
  inspectedSuspects: string[];
  cluesTotal: number;
  suspectsTotal: number;
};

const emptyProgress: CaseProgress = {
  foundClues: [],
  inspectedSuspects: [],
  cluesTotal: 0,
  suspectsTotal: 0,
};

function toProgress(value: unknown): CaseProgress {
  if (!isPlainObject(value)) return emptyProgress;
  return {
    foundClues: toStringArray(value.foundClues),
    inspectedSuspects: toStringArray(value.inspectedSuspects),
    cluesTotal: count(value.cluesTotal),
    suspectsTotal: count(value.suspectsTotal),
  };
}

/** Investigation state, so reopening a dossier resumes where the player left. */
export function loadProgress(caseId: string): CaseProgress {
  const map = readJson<Record<string, unknown>>(PROGRESS_KEY, {});
  return toProgress(map[caseId]);
}

export function saveProgress(caseId: string, progress: CaseProgress): void {
  const map = readJson<Record<string, unknown>>(PROGRESS_KEY, {});
  if (!progress.foundClues.length && !progress.inspectedSuspects.length) {
    delete map[caseId];
  } else {
    map[caseId] = {
      foundClues: progress.foundClues,
      inspectedSuspects: progress.inspectedSuspects,
      cluesTotal: progress.cluesTotal,
      suspectsTotal: progress.suspectsTotal,
    };
  }
  writeJson(PROGRESS_KEY, map);
}

/** Read-only aggregates used by the badge engine, never written back. */
export function loadAllProgress(): Record<string, CaseProgress> {
  const map = readJson<Record<string, unknown>>(PROGRESS_KEY, {});
  const out: Record<string, CaseProgress> = {};
  for (const [caseId, value] of Object.entries(map)) {
    out[caseId] = toProgress(value);
  }
  return out;
}

export function loadAllNotes(): Record<string, string> {
  const map = readJson<Record<string, unknown>>(NOTES_KEY, {});
  const out: Record<string, string> = {};
  for (const [caseId, value] of Object.entries(map)) {
    if (typeof value === "string" && value.trim()) out[caseId] = value;
  }
  return out;
}

const BADGES_KEY = "dailibi.badges.v1";
const TITLE_KEY = "dailibi.title.v1";
const PLAYER_KEY = "dailibi.player.v1";

/**
 * Anonymous device secret, created on first use. It is never displayed and
 * never shared across sites; the server only ever stores a per-case hash of
 * it, so no cross-day profile can be rebuilt from the database.
 */
export function loadPlayerSecret(): string {
  if (typeof window === "undefined") return "";
  const raw = readJson<Record<string, unknown>>(PLAYER_KEY, {});
  if (typeof raw.secret === "string" && raw.secret.length >= 16) return raw.secret;
  const secret = randomSecret();
  writeJson(PLAYER_KEY, { secret });
  return secret;
}

function randomSecret(): string {
  const webCrypto = globalThis.crypto;
  if (webCrypto?.randomUUID) return webCrypto.randomUUID();
  if (webCrypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    webCrypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Earned badges, keyed by badge id, valued with the unlock timestamp. */
export function loadBadges(): Record<string, string> {
  const raw = readJson<Record<string, unknown>>(BADGES_KEY, {});
  const out: Record<string, string> = {};
  for (const [id, value] of Object.entries(raw)) {
    if (typeof value === "string") out[id] = value;
  }
  return out;
}

export function saveBadges(badges: Record<string, string>): void {
  writeJson(BADGES_KEY, badges);
}

export function loadEquippedTitle(): string | null {
  const raw = readJson<Record<string, unknown>>(TITLE_KEY, {});
  return typeof raw.id === "string" ? raw.id : null;
}

export function saveEquippedTitle(titleId: string | null): void {
  writeJson(TITLE_KEY, titleId ? { id: titleId } : {});
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
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(fallback)) {
      return (Array.isArray(parsed) ? parsed : fallback) as T;
    }
    return (isPlainObject(parsed) ? parsed : fallback) as T;
  } catch {
    return fallback;
  }
}

/**
 * Storage is user-writable, so every value read back is treated as untrusted.
 * Corrupted or hand-edited payloads must degrade to defaults, never throw.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDayRecord(value: unknown): value is DayRecord {
  return (
    isPlainObject(value) &&
    typeof value.date === "string" &&
    typeof value.caseId === "string" &&
    typeof value.score === "number"
  );
}

function isAccuseResult(value: unknown): value is AccuseResult {
  return (
    isPlainObject(value) &&
    typeof value.score === "number" &&
    isPlainObject(value.perQuestion) &&
    isPlainObject(value.solution)
  );
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function count(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or disabled: stats are a convenience, never blocking */
  }
}
