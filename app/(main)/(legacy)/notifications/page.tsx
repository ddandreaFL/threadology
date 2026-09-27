import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import {
  NotificationList,
  type NotificationRow,
} from "@/components/notifications/notification-list";

/**
 * Rendered on the server so the list is there on first paint — an inbox that
 * arrives after a spinner is an inbox nobody trusts is up to date.
 */
export default async function NotificationsPage() {
  await requireUser();
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("notification_feed" as never, { p_limit: 50 } as never);
  const rows = (Array.isArray(data) ? data : []) as NotificationRow[];

  return (
    <div className="mx-auto max-w-2xl">
      <NotificationList initial={rows} />
    </div>
  );
}
