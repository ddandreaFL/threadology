import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isProtectedRoute(pathname: string): boolean {
  // Logged-in only pages — public vault lives at /vault/[username] (no auth)
  if (pathname === "/vault") return true;
  if (pathname === "/vault/add") return true;
  if (pathname.startsWith("/settings")) return true;
  if (pathname === "/fit/new") return true;
  // /fit/[slug]/edit
  if (/^\/fit\/[^/]+\/edit$/.test(pathname)) return true;
  // /fit/[slug] — owner view (single dynamic segment)
  if (/^\/fit\/[^/]+$/.test(pathname)) return true;
  return false;
}

function isAuthRoute(pathname: string): boolean {
  return pathname === "/login" || pathname === "/signup";
}

export async function middleware(request: NextRequest) {
  // supabaseResponse must be the response we ultimately return so
  // the session cookies are correctly written/refreshed.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild supabaseResponse so the cookies are attached to it.
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: always call getUser() — it refreshes the session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtectedRoute(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute(pathname)) {
    const vaultUrl = request.nextUrl.clone();
    vaultUrl.pathname = "/vault";
    return NextResponse.redirect(vaultUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
