/**
 * Any other route closes the panel. Without this a slot keeps showing its
 * last match on a soft navigation it has no page for — the panel would stay
 * open over the vault after a click in the side column.
 */
export default function ClosePanel() {
  return null;
}
