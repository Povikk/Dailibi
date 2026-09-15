import "server-only";

type EnvWithDb = { env?: { DB?: D1Database } };

/**
 * Reads the D1 binding through the Workers module.
 *
 * The import is dynamic and guarded so the same module runs under `next dev`,
 * vitest and workerd: outside a Worker there is simply no database and every
 * caller degrades to a no-op.
 */
export async function getDatabase(): Promise<D1Database | undefined> {
  try {
    const mod = (await import(
      /* webpackIgnore: true */ /* @vite-ignore */ "cloudflare:workers"
    )) as EnvWithDb;
    return mod.env?.DB;
  } catch {
    return undefined;
  }
}

/** Stable, salted-per-purpose pseudonym. Never stores the secret itself. */
export async function hashSecret(secret: string, scope: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${scope}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
