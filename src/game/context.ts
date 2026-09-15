"use client";

import {
  findBadge,
  newlyEarnedBadges,
  type BadgeContext,
  type BadgeDefinition,
} from "@/game/badges";
import {
  loadAllNotes,
  loadAllProgress,
  loadArchiveRecords,
  loadBadges,
  loadStats,
  loadStreak,
  saveBadges,
} from "@/lib/storage";

/** Snapshot of everything the badge rules may look at. */
export function buildBadgeContext(): BadgeContext {
  return {
    stats: loadStats(),
    streak: loadStreak(),
    archives: loadArchiveRecords(),
    progress: loadAllProgress(),
    notes: loadAllNotes(),
  };
}

/**
 * Evaluates the rules and records anything newly earned.
 * Returns the badges that were just unlocked, in catalogue order.
 */
export function awardBadges(): BadgeDefinition[] {
  const context = buildBadgeContext();
  const earned = loadBadges();
  const fresh = newlyEarnedBadges(context, earned);
  if (!fresh.length) return [];

  const now = new Date().toISOString();
  const updated: Record<string, string> = { ...earned };
  for (const id of fresh) updated[id] = now;
  saveBadges(updated);

  return fresh
    .map((id) => findBadge(id))
    .filter((badge): badge is BadgeDefinition => Boolean(badge));
}
