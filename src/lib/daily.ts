/**
 * DAILIBI daily clock.
 *
 * CONVENTION (documented, single source of truth):
 *   - The "game day" is the calendar day in Europe/Paris.
 *   - A new case rolls over at 00:00 Europe/Paris.
 *   - All players worldwide therefore receive the same case on the same day,
 *     whatever their local timezone.
 *
 * Server routes call `currentDailyKey()`; the client only formats what it is
 * given. We never rely on the client clock to pick the case.
 */

export const TIME_ZONE = "Europe/Paris";
export const ROLLOVER_HOUR = 0;

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Returns the YYYY-MM-DD game-day key for an instant, in Europe/Paris. */
export function dateKey(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new Error("dateKey: invalid date");
  const parts = dayFormatter.formatToParts(date);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/** Human display date, e.g. "14 SEPTEMBRE 2026". */
export function formatDisplayDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return formatter.format(date).toUpperCase();
}

/** Absolute day number for a game-day key. Stable across years. */
export function dayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d);
  return Math.floor(ms / 86_400_000);
}

/**
 * Strict game-day key validation: correct shape AND real calendar day.
 * Rejects both "2026-9-4" and impossible dates such as "2026-02-31",
 * which a plain regex would let through before Date.UTC silently rolls them.
 */
export function isValidDayKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [y, m, d] = key.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/** Today's game-day key. */
export function currentDailyKey(now: Date = new Date()): string {
  return dateKey(now);
}

/** Day number for the current or provided instant. */
export function currentDayNumber(now: Date = new Date()): number {
  return dayNumber(currentDailyKey(now));
}

/** Whether a dated case is available on the current Paris game day. */
export function isDailyKeyUnlocked(key: string, now: Date = new Date()): boolean {
  return dayNumber(key) <= currentDayNumber(now);
}

/**
 * Milliseconds until the next rollover (next 00:00 Europe/Paris).
 *
 * The target is the *Paris midnight of the next game day*, not "today's
 * midnight + 24h": DST days last 23 or 25 hours, so adding a fixed 86,400,000
 * ms drifts by one hour around the transitions.
 */
export function msUntilNextRollover(now: Date = new Date()): number {
  const key = currentDailyKey(now);
  return parisMidnightUtc(nextKey(key)).getTime() - now.getTime();
}

/**
 * UTC instant of 00:00 Europe/Paris for a given game-day key.
 * Works by iterative correction so it stays correct across DST changes.
 */
function parisMidnightUtc(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  let guess = Date.UTC(y, m - 1, d, 0, 0, 0);
  for (let i = 0; i < 4; i += 1) {
    const guessKey = dateKey(new Date(guess));
    if (guessKey === key) {
      const hhmm = timeInParis(new Date(guess));
      if (hhmm === "00:00") break;
    }
    const [gy, gm, gd] = guessKey.split("-").map(Number);
    const diffDays = (Date.UTC(y, m - 1, d) - Date.UTC(gy, gm - 1, gd)) / 86_400_000;
    guess += diffDays * 86_400_000;
    if (diffDays === 0) {
      const minutes = minutesInParis(new Date(guess));
      guess -= minutes * 60_000;
    }
  }
  return new Date(guess);
}

function timeInParis(date: Date): string {
  return timeFormatter.format(date).replace(/^24:/, "00:");
}

function minutesInParis(date: Date): number {
  const t = timeInParis(date);
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Neutral (timezone-free) day to mark whether two game-day keys are adjacent.
 * Used for streak computation: today vs yesterday.
 */
export function previousKey(key: string): string {
  const n = dayNumber(key) - 1;
  const date = new Date(n * 86_400_000);
  return date.toISOString().slice(0, 10);
}

/** Neutral calendar day after `key`, independent of timezone. */
export function nextKey(key: string): string {
  const n = dayNumber(key) + 1;
  const date = new Date(n * 86_400_000);
  return date.toISOString().slice(0, 10);
}

export function isAdjacent(a: string, b: string): boolean {
  return Math.abs(dayNumber(a) - dayNumber(b)) === 1;
}
