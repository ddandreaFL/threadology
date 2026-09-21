import { NextResponse } from "next/server";

/**
 * Apple App Site Association — the file that makes shared links open the app.
 *
 * iOS decides, not us: a web page cannot ask whether the app is installed.
 * When it is, tapping a matching link opens the app; when it is not, Safari
 * loads the page and the page carries the download call to action.
 *
 * Two properties worth knowing, because they shape what needs a release:
 *
 *   - The DOMAIN is baked into the app's entitlement, so adding or changing
 *     one needs a new build. An app can hold several, so a custom domain can
 *     be added later without breaking links already issued on this one —
 *     provided this domain stays in the entitlement.
 *   - The PATHS live here, server-side, and can change at any time without a
 *     release. Start narrow and widen.
 *
 * Apple requires this served over HTTPS as application/json, with no redirect
 * and no extension on the path.
 */

export const dynamic = "force-static";

const TEAM_ID = process.env.APPLE_TEAM_ID;
const BUNDLE_ID = "com.threadology.app";

export function GET() {
  // Without the team id the file would claim an app that does not exist, and
  // Apple caches what it fetches. Better to serve nothing than something wrong.
  if (!TEAM_ID) {
    return new NextResponse("apple team id not configured", { status: 404 });
  }

  return NextResponse.json(
    {
      applinks: {
        details: [
          {
            appIDs: [`${TEAM_ID}.${BUNDLE_ID}`],
            components: [
              // Shared fits and containers. A link without its ?k= token is
              // not a share link, so it is left to the browser.
              { "/": "/fit/*", comment: "a shared fit" },
              { "/": "/vault/*", comment: "a shared vault or collection" },
            ],
          },
        ],
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
