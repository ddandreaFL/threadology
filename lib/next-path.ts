/**
 * Where to go after signing in.
 *
 * Only a path on this site, and never back onto an auth screen. A `next`
 * value arrives in a URL anyone can construct, so it is treated as untrusted
 * input: anything that is not a plain relative path falls back to the vault,
 * which is what an open redirect would otherwise buy an attacker.
 */
export function safeNext(next: string | null | undefined, fallback = "/vault"): string {
  if (!next) return fallback;
  let value = next;
  try {
    value = decodeURIComponent(next);
  } catch {
    return fallback;
  }
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.startsWith("/login") || value.startsWith("/signup")) return fallback;
  return value;
}
