/**
 * Pass-through.
 *
 * Everything under /vault used to be wrapped in the signed-in app shell,
 * which meant a shared vault or collection rendered under the owner's own
 * toolbar — search, layout switcher, avatar — as if the visitor were looking
 * at their own archive. Chrome now belongs to the page: shared routes use
 * SharedChrome, the piece page and its editor use OwnerPageShell.
 */
export default function VaultPublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
