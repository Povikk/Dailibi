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
  loadEquippedTitle,
  loadPlayerSecret,
  loadStats,
  loadStreak,
  saveBadges,
  saveEquippedTitle,
  savePlayerSecret,
} from "@/lib/storage";

/**
 * Serializable snapshot of everything the badge rules look at.
 * Counts only: no clue id ever leaves the device.
 */
export function buildPlayerSnapshot(): BadgeContext {
  const progress: BadgeContext["progress"] = {};
  for (const [caseId, entry] of Object.entries(loadAllProgress())) {
    progress[caseId] = {
      cluesFound: entry.foundClues.length,
      cluesTotal: entry.cluesTotal,
      suspectsSeen: entry.inspectedSuspects.length,
      suspectsTotal: entry.suspectsTotal,
    };
  }

  return {
    stats: loadStats(),
    streak: loadStreak(),
    archivesCount: loadArchiveRecords().length,
    progress,
    notesCount: Object.values(loadAllNotes()).filter((value) => value.trim().length > 0).length,
  };
}

/**
 * Evaluates the rules and records anything newly earned.
 * Returns the badges that were just unlocked, in catalogue order.
 */
export function awardBadges(): BadgeDefinition[] {
  const context = buildPlayerSnapshot();
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

function mergeBadges(remote: Record<string, string>): void {
  const local = loadBadges();
  const merged: Record<string, string> = { ...local };
  for (const [id, earnedAt] of Object.entries(remote)) {
    if (!(id in merged)) merged[id] = earnedAt;
  }
  saveBadges(merged);
}

type SyncResponse = {
  available?: boolean;
  badges?: Record<string, string>;
  equippedTitle?: string | null;
  snapshot?: unknown;
};

/**
 * Pushes the local snapshot and pulls back whatever the server knows.
 * Entirely optional: offline or without a database, local state still rules.
 */
export async function syncPlayerProfile(): Promise<void> {
  try {
    const response = await fetch("/api/player/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dailibi-player": loadPlayerSecret(),
      },
      body: JSON.stringify({
        snapshot: buildPlayerSnapshot(),
        equippedTitle: loadEquippedTitle(),
      }),
    });
    if (!response.ok) return;
    const data = (await response.json()) as SyncResponse;
    if (data.badges) mergeBadges(data.badges);
  } catch {
    /* offline: the local profile stays authoritative */
  }
}

/**
 * Adopts a recovery code and pulls the badges earned with it.
 * Personal statistics stay local; the distinctions travel.
 */
export async function restorePlayerProfile(code: string): Promise<boolean> {
  const secret = code.trim();
  if (secret.length < 16) return false;

  try {
    const response = await fetch("/api/player/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    if (!response.ok) return false;

    const data = (await response.json()) as SyncResponse;
    if (!data.available) return false;

    savePlayerSecret(secret);
    if (data.badges) mergeBadges(data.badges);
    if (data.equippedTitle) saveEquippedTitle(data.equippedTitle);
    window.dispatchEvent(new CustomEvent("dailibi:title"));
    return true;
  } catch {
    return false;
  }
}
