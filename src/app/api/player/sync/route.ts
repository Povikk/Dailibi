import "server-only";

import { NextResponse } from "next/server";

import { syncPlayer } from "@/server/player";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Saves the anonymous profile and returns every badge the server knows about.
 * Without a database the call degrades to `available: false` and the browser
 * keeps working from its local copy.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const headers = { "Cache-Control": "private, no-store" };
  const secret = request.headers.get("x-dailibi-player");

  if (!secret || secret.length < 16) {
    return NextResponse.json({ available: false }, { status: 400, headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const payload = isRecord(body) ? body : {};

  const profile = await syncPlayer({
    secret,
    snapshot: payload.snapshot,
    equippedTitle:
      typeof payload.equippedTitle === "string"
        ? payload.equippedTitle.slice(0, 120)
        : null,
  });

  if (!profile) {
    return NextResponse.json({ available: false }, { headers });
  }

  return NextResponse.json(
    {
      available: true,
      badges: profile.badges,
      equippedTitle: profile.equippedTitle,
    },
    { headers },
  );
}
