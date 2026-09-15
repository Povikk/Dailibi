import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/case/[date]/accuse/route";

/**
 * Route-level guard for the publication boundary: an accusation must only
 * reach the case dated in the URL, and only once that date is unlocked.
 */
function post(date: string, body: Record<string, string>) {
  return POST(
    new Request(`http://localhost/api/case/${date}/accuse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ date }) } as never,
  );
}

const VALID = { q_who: "emma", q_why: "motive_ecarts", q_how: "method_code" };

describe("POST /api/case/:date/accuse", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 20 septembre 2026 : les affaires 1 à 20 sont publiées.
    vi.setSystemTime(new Date("2026-09-20T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("résout une affaire publiée et renvoie la solution", async () => {
    const response = await post("2026-09-14", VALID);
    expect(response.status).toBe(200);

    const payload = (await response.json()) as { caseId: string; date: string };
    expect(payload.date).toBe("2026-09-14");
    expect(payload.caseId).toBe("le-dernier-service");
  });

  it("refuse une date antérieure au lancement au lieu de recycler une affaire", async () => {
    // L'ancien modulo renvoyait ici une affaire non publiée.
    const response = await post("2026-08-31", VALID);
    expect(response.status).toBe(404);
  });

  it("refuse une affaire encore verrouillée", async () => {
    const response = await post("2026-09-30", VALID);
    expect(response.status).toBe(404);
  });

  it("refuse une date calendaire impossible", async () => {
    const response = await post("2026-02-31", VALID);
    expect(response.status).toBe(400);
  });

  it("refuse une réponse hors des options proposées", async () => {
    const response = await post("2026-09-14", { ...VALID, q_who: "personne" });
    expect(response.status).toBe(400);
  });
});
