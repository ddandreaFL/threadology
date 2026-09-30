/**
 * The mark — the handwritten Th, as on the app icon: its own cream tile,
 * rounded like an icon. Sized by `size` (px).
 */
export function Logo({ size, className = "" }: { size: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      style={{ width: `${size / 16}rem`, height: `${size / 16}rem`, borderRadius: `${(size * 0.22) / 16}rem` }}
    />
  );
}
