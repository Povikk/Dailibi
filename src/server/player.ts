import "server-only";

import {
  newlyEarnedBadges,
  sanitizeSnapshot,
  type BadgeContext,
} from "@/game/badges";
import { getDatabase, hashSecret } from "@/server/d1";

/**
 * Player profile without signup.
 *
 * The device secret doubles as the recovery code. The database stores only a
 * salted hash of it, plus a compact progression snapshot, so badge rules can
 * be re-evaluated server-side with the exact same logic as in the browser.
 */

const PROFILE_SCOPE = "dailibi-profile";

export type PlayerProfile = {
  badges: Record<string, string>;
  equippedTitle: string | null;
  snapshot: BadgeContext;
};

type PlayerRow = { snapshot: string; equipped_title: string | null };

async function readProfile(playerHash: string): Promise<PlayerProfile | undefined> {
  const db = await getDatabase();
  if (!db) return undefined;

  try {
    const row = await db
      .prepare("SELECT snapshot, equipped_title FROM players WHERE player_hash = ?")
      .bind(playerHash)
      .first<PlayerRow>();

    const badgeRows = await db
      .prepare("SELECT badge_id, earned_at FROM player_badges WHERE player_hash = ?")
      .bind(playerHash)
      .all<{ badge_id: string; earned_at: string }>();

    const badges: Record<string, string> = {};
    for (const entry of badgeRows.results ?? []) badges[entry.badge_id] = entry.earned_at;

    if (!row && !Object.keys(badges).length) return undefined;

    let snapshot: BadgeContext | undefined;
    if (row?.snapshot) {
      try {
        snapshot = sanitizeSnapshot(JSON.parse(row.snapshot) as unknown);
      } catch {
        snapshot = undefined;
      }
    }

    return {
      badges,
      equippedTitle: row?.equipped_title ?? null,
      snapshot: snapshot ?? sanitizeSnapshot(undefined),
    };
  } catch {
    return undefined;
  }
}

/** Merges the browser snapshot with what the server already knows. */
export async function syncPlayer(params: {
  secret: string;
  snapshot: unknown;
  equippedTitle?: string | null;
}): Promise<PlayerProfile | undefined> {
  const db = await getDatabase();
  if (!db) return undefined;

  const playerHash = await hashSecret(params.secret, PROFILE_SCOPE);
  const incoming = sanitizeSnapshot(params.snapshot);
  const current = await readProfile(playerHash);

  // Never regress a profile: a cleared browser cannot erase earned badges.
  const context =
    current && current.snapshot.stats.played > incoming.stats.played
      ? current.snapshot
      : incoming;

  const earned: Record<string, string> = { ...(current?.badges ?? {}) };
  const fresh = newlyEarnedBadges(context, earned);
  const now = new Date().toISOString();
  const equippedTitle = params.equippedTitle ?? current?.equippedTitle ?? null;

  try {
    const statements = fresh.map((badgeId) =>
      db
        .prepare(
          "INSERT INTO player_badges (player_hash, badge_id, earned_at) VALUES (?, ?, ?) ON CONFLICT(player_hash, badge_id) DO NOTHING",
        )
        .bind(playerHash, badgeId, now),
    );

    statements.push(
      db
        .prepare(
          "INSERT INTO players (player_hash, snapshot, equipped_title, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(player_hash) DO UPDATE SET snapshot = excluded.snapshot, equipped_title = excluded.equipped_title, updated_at = excluded.updated_at",
        )
        .bind(playerHash, JSON.stringify(context), equippedTitle, now, now),
    );

    await db.batch(statements);
  } catch {
    return undefined;
  }

  for (const badgeId of fresh) earned[badgeId] = now;
  return { badges: earned, equippedTitle, snapshot: context };
}

/** Recovery on another device: reads the profile without touching it. */
export async function restorePlayer(secret: string): Promise<PlayerProfile | undefined> {
  return readProfile(await hashSecret(secret, PROFILE_SCOPE));
}
