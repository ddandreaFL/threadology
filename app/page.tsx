import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">Threadology</h1>
      <p className="text-muted-foreground">Your personal wardrobe vault.</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
