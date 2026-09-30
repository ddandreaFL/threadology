import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * A test bed for the slide-over's routing (the same @panel + intercepting
 * route setup as app/(main)), usable without signing in. Local only.
 */
export default function FlowLayout({ children, panel }: { children: React.ReactNode; panel: React.ReactNode }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <div className="flex min-h-dvh font-th-sans">
      <nav className="sticky top-0 flex h-dvh w-[248px] shrink-0 flex-col gap-3 border-r border-th-border p-6">
        <Link id="nav-list" href="/dev/flow">list</Link>
        <Link id="nav-other" href="/dev/flow/other">other</Link>
      </nav>
      <main className="min-w-0 flex-1">{children}</main>
      {panel}
    </div>
  );
}
