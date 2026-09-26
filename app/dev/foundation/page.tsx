import { notFound } from "next/navigation";
import { AppFrame } from "@/components/ui/AppFrame";
import { FoundationDemo } from "./demo";

/**
 * Phase 1's kitchen sink: every foundation part in one place, for checking
 * side by side with the app. Preview and local builds only.
 */
export const metadata = { robots: { index: false, follow: false } };

export default function FoundationPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <AppFrame username="dillon">
      <FoundationDemo />
    </AppFrame>
  );
}
