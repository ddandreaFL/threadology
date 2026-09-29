# Stage 4 — saves, notifications, reactions

Status: **prep, 2026-09-26.** Followers/friends are tabled (`following-scope.md`). This stage perfects the loop that already exists: someone is sent a link → saves it → hears when it grows → answers back. The user has further ideas to add before this is finalized.

## How the loop works today

| Step | App | Web | Database |
|---|---|---|---|
| **Open a link** | Only fits open in-app (`/fit/<user>/<slug>?k=`). The universal-link file claims `/fit/*` only. | Vault, collection, fit and piece links all render. | `shared_vault` / `shared_collection` / `shared_fit` / `shared_piece`, token-gated |
| **Save** | `SaveLinkButton` on the shared fit screen. Toggle, no confirm on unsave, no optimistic state on save. | `save-button` on shared pages; signed-out save carries intent through signup (`?next=&save=1`). | `save_container` resolves the container from the token; the save keeps a copy of the token |
| **Saved shelf** | `/saved`, reached only from profile → "saved". Only fits reopen; saved vaults and collections are dead rows ("no native viewer yet"). No way to unsave or mute from the shelf. | `/saved` | `my_saves()`; rows marked inactive when the owner unshares |
| **Notifications** | `/notifications`, reached from the bell on **fits** (no longer the home tab) and profile. Opening marks all read. Additions only open for fits; an owner's collection notification opens the collections list, not the collection. | `/notifications` + bell in the top bar | 3 kinds (`addition`, `reaction`, `save`), written by triggers, coalesced per container per 3 hours; `notification_feed`, `unread_notification_count`, `mark_notifications_read` |
| **Push** | **None.** No expo-notifications, no device tokens. You only learn something happened by opening the app and noticing the dot. | — | — |
| **React** | `FitReactions` on fits only. Fixed set 🔥 ❤️ 👑 🥶 🫡 👀, optimistic, token-checked. Owner sees counts, not who. | `fit-reactions` | `react_to_fit`, `fit_reaction_summary`, `fit_reactions_for_owner` |

## Gaps found in the audit

**Breaks the loop**
1. **No push notifications.** The payoff for saving is hearing when it grows, and today that only happens if you open the app and look for a dot.
2. **Saved vaults and collections can't be opened in the app.** Half the shelf is dead rows; their notifications don't open either.
3. **The bell lives on fits,** which stopped being home in Stage 3. The vault — where the app now opens — has no way into the inbox.

**Rough edges**
4. An owner's collection notification opens the collections *list* instead of that collection (collection detail exists now).
5. No unsave or mute from the saved shelf; the `ON` label shows a notify setting nothing can change.
6. Reactions: the owner sees counts but not who reacted, though the data exists (`fit_reactions_for_owner`).
7. Save has no optimistic state (waits on a round-trip); unsave is one tap with no undo.
8. Saved shelf and inbox read as lists of rows — the design system work hasn't reached them.

## Open questions for this stage

- Push: which events deserve a push (all three kinds? only additions?), and a quiet-hours / daily-digest option?
- Should reactions extend beyond fits — to pieces or collections?
- Does the app need native viewers for shared vaults and collections, or should those open the web page in-app?

## Ideas from the user

### 1. Cover flow caption + player controls (vault first)

**Caption.** Title and brand centered on the screen's axis and set smaller. The overflow (···) becomes a pen that opens the editor. Today the ··· sits in the same row as the title, which is why the title reads off-center: the row is centered, not the title.

**Controls, like a music player:** ⏮ previous · ▶/⏸ play · ⏭ next · 🔀 shuffle. Play steps through pieces on a timer.

**Shuffle audit (current implementation, `vault.tsx` → `CoverflowView.scrollToIndex`):**
- Two chained native scroll animations, the second fired 190ms into the first. iOS gives each animated `scrollTo` a fixed ~0.3s regardless of distance, so the second cuts the first off mid-flight: a velocity break, and the flight reverses outright whenever the random waypoint is on the other side of the target.
- The waypoint is random: it can equal the current card, the target, or sit past it. Some shuffles are one clean glide, others a lurch.
- The caption changes the instant a scroll starts (`onActiveChange` is called up front), so the title flashes the waypoint's name, then the target's, before either card arrives.
- Fixed duration means a 2-card and a 40-card jump take the same time — long jumps whip, short ones crawl.
- No guard: tapping twice stacks two flights and two timers.
- Every card is mounted (the cover flow is a plain ScrollView); fine at 8 pieces, heavy at a few hundred.

**Proposed rebuild:** drive the scroll position from Reanimated on the UI thread (`scrollTo` fed by one `withTiming`), so a shuffle is one continuous motion with its own curve — quick spin up, long decelerating settle, like a wheel — and a duration scaled to distance. The caption changes once, when the card lands (or cross-fades as it passes). Controls lock while a flight is in progress. The same driver gives prev/next and play their motion.

**Decided 2026-09-26:**
- **Pen:** tap opens the editor; press and hold opens the full menu (make private, delete).
- **Shuffle:** one tap = one wheel-spin to a random piece (never the current one). Not a mode — play and prev/next stay in order.
- **Play:** advances every 3s, wraps last → first, pauses the moment the cover flow is touched or the screen is left.
- **Where:** vault only. Fits and collection cover flows keep a plain caption and no controls.
- **My calls, unless told otherwise:** title 16 → 14pt, brand 12 → 11pt; controls as an icon row (no labels), play as the larger center button; prev/next at the ends wrap around, matching play; a light haptic per step.

### 2. Gallery mode — built 2026-09-26 (native `stage-4`: e9ceec3, 8740d7d)

Superseded idea 1's player controls. The vault keeps its centered caption and pen; one "enter gallery" CTA replaces the controls. Gallery: no chrome, cards at 0.78 width, wall label, controls pill (shuffle · prev · play · next · gear) that fades after 3s, gear sheet for motion (step / drift / off), pace, and wall (ink / stone / paper / blur). Opens paused; closing stops everything. Open: landscape for AirPlay needs expo-screen-orientation and a native build.

