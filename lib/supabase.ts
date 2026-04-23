import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// Browser client — use in Client Components.
// createBrowserClient stores the session in cookies so the middleware
// (which uses createServerClient) can read it server-side.
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
