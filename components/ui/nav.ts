import type { IconName } from "./Icon";

/** The four tabs, in the app's order. */
export const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/vault", label: "vault", icon: "vault" },
  { href: "/fits", label: "fits", icon: "fits" },
  { href: "/collections", label: "collections", icon: "collections" },
  { href: "/profile", label: "profile", icon: "profile" },
];

/** What the + creates, as in the app's tab bar menu. */
export const CREATE: { href: string; label: string; icon: IconName }[] = [
  { href: "/fit/new", label: "log fit", icon: "fits" },
  { href: "/vault/add", label: "add piece", icon: "vault" },
  { href: "/collections?new=1", label: "add collection", icon: "collections" },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}
