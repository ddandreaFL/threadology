import { LegacyPage } from "@/components/owner/LegacyPage";

/**
 * Owner pages not yet rebuilt on the new UI. The route group changes no
 * URLs; it only lends them the old padding inside the new frame until
 * phases 4 and 5 replace them, and then it goes.
 */
export default function LegacyLayout({ children }: { children: React.ReactNode }) {
  return <LegacyPage>{children}</LegacyPage>;
}
