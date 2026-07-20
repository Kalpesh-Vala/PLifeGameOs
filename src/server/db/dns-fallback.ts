import { resolveSrv } from "node:dns/promises";
import { setServers } from "node:dns";

/**
 * Works around environments where Node's c-ares resolver cannot perform the
 * `mongodb+srv` SRV/TXT lookup (e.g. `querySrv ECONNREFUSED`) even though the
 * OS resolver can. We test the SRV lookup once and, if it fails, point c-ares
 * at public DNS servers. The actual DB socket connection uses `dns.lookup`
 * (the OS resolver), so only the SRV/TXT resolution needs this fallback.
 */
const PUBLIC_DNS = ["1.1.1.1", "8.8.8.8", "8.8.4.4"];

/**
 * Shared promise so every caller (Mongoose + the Auth.js client) awaits the
 * *same* resolution. Using a boolean flag here would let a second concurrent
 * caller return early and connect before `setServers` had been applied.
 */
let ensurePromise: Promise<void> | null = null;

/** Extracts the SRV query name from a `mongodb+srv://` URI, else null. */
function srvNameFromUri(uri: string): string | null {
  if (!uri.startsWith("mongodb+srv://")) return null;
  const withoutScheme = uri.slice("mongodb+srv://".length);
  const afterAuth = withoutScheme.includes("@")
    ? withoutScheme.slice(withoutScheme.indexOf("@") + 1)
    : withoutScheme;
  const host = afterAuth.split(/[/?]/)[0];
  return host ? `_mongodb._tcp.${host}` : null;
}

async function resolveOrFallback(uri: string): Promise<void> {
  const srvName = srvNameFromUri(uri);
  if (!srvName) return; // Standard (non-SRV) URIs don't need this.

  try {
    await resolveSrv(srvName);
  } catch {
    // Default resolver can't do the SRV lookup — switch c-ares to public DNS.
    try {
      setServers(PUBLIC_DNS);
      // Confirm the fallback resolver can actually answer the SRV query.
      await resolveSrv(srvName);
      console.warn(
        `[db] SRV lookup failed with the default resolver; using public DNS (${PUBLIC_DNS.join(", ")}).`,
      );
    } catch (error) {
      console.error(
        "[db] SRV lookup still failing after DNS fallback. Consider using the standard (non-SRV) connection string.",
        error,
      );
    }
  }
}

export function ensureSrvResolvable(uri: string): Promise<void> {
  ensurePromise ??= resolveOrFallback(uri);
  return ensurePromise;
}
