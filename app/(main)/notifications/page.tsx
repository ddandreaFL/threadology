import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { NotificationList, type NotificationRow } from "@/components/notifications/notification-list";

export const metadata = { title: "notifications · threadology" };

/**
 * Rendered on the server so the list is there on first paint — an inbox that
 * arrives after a spinner is an inbox nobody trusts is up to date.
 */
export default async function NotificationsPage() {
  await requireUser();
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("notification_feed" as never, { p_limit: 50 } as never);
  const rows = (Array.isArray(data) ? data : []) as NotificationRow[];
  const fresh = rows.filter((r) => !r.read_at).length;

  return (
    <div>
      <ScreenHeader
        title="notifications"
        subtitle={rows.length === 0 ? "nothing yet" : fresh > 0 ? `${fresh} new` : "all caught up"}
        back={{ href: "/profile" }}
      />
      <NotificationList initial={rows} />
    </div>
  );
}
