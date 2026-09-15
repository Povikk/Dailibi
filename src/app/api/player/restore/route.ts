import "server-only";

import { NextResponse } from "next/server";

import { restorePlayer } from "@/server/player";

export const dynamic = "force-dynamic";

/**
 * Recovers a profile on another device from its recovery code (the device
 * secret itself). Returns only the distinctions and the equipped title.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const headers = { "Cache-Control": "private, no-store" };

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const secret =
    typeof (body as { secret?: unknown })?.secret === "string"
      ? ((body as { secret: string }).secret).trim()
      : "";

  if (secret.length < 16) {
    return NextResponse.json({ available: false }, { status: 400, headers });
  }

  const profile = await restorePlayer(secret);
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
