# Handoff: Threadology Navigation — Concept 4 "Push Navigation"

## Overview
This handoff covers the implementation of **Concept 4: Push Navigation** — a right-to-left slide navigation pattern for Threadology that eliminates the bottom tab bar entirely. The bottom of the screen becomes sacred space for the **"add +"** pill only. All secondary navigation (collections, profile, settings) lives behind a single avatar tap in the top-right corner, accessed via a full-screen iOS-style push transition.

---

## About the Design Files
`Threadology Nav.html` is an **interactive hi-fi prototype** — not production code. Open it in a browser, click "view concepts" on the landing page, then scroll to **Concept 4 "Push Navigation"** and tap the avatar to interact. Your task is to implement this pattern in the existing **Next.js / Tailwind / Supabase** codebase at `ddandreaFL/threadology`.

---

## Fidelity
**High-fidelity.** Match colors, typography, spacing, and transitions exactly. The push transition timing and easing are intentional and should be reproduced precisely.

---

## Design Tokens

```
Background:        #FFFFFF
Text primary:      #111111
Text muted:        #999999
Accent green:      #2D5A45
Dark (CTA/avatar): #1A1A1A
Border:            #EBEBEB
Destructive:       #CC4444
Font:              "Helvetica Neue", Helvetica, Arial, sans-serif
```

---

## Navigation Architecture

### Before (current)
```
Bottom tab bar: [vault] [collections] [profile] [settings]
Floating:       [add +] FAB (bottom right)
```

### After (Concept 4)
```
Top bar:   [vault title] .............. [search] [avatar]
Bottom:    [          add +          ]  ← only persistent element
```

Secondary screens are accessed via a **navigation stack**:
```
vault → (tap avatar) → menu → (tap item) → collections
                                          → profile
                                          → settings
```

---

## Screens

### Screen 1: Vault (root)
**Top bar** (`h-14`, sticky, `bg-white/90 backdrop-blur-sm`, bottom border `#EBEBEB`):
- Left: `"vault"` — 20px / weight 500 / tracking -0.02em / color `#111`
- Right icons (gap 18px): search icon → avatar circle

**Avatar circle** (top-right):
- Size: 30×30px / `border-radius: 50%`
- Background: `#1A1A1A`
- Content: user's initial letter, 12px / weight 600 / white
- **Tap → pushes Menu screen**

**Collection filter chips** (below top bar):
- Horizontal scroll row, gap 6px, padding 8px 20px
- Active chip: bg `#1A1A1A` / white text / no border / `border-radius: 999px` / padding 5px 13px / 12px
- Inactive chip: transparent bg / border `1px solid #EBEBEB` / color `#999` / same shape

**"add +" pill** (position fixed, bottom 28px, horizontally centered):
- bg `#1A1A1A` / border-radius 30px / height 50px / padding 0 32px
- Text: "add +" / 15px / weight 500 / white
- Shadow: `0 4px 20px rgba(0,0,0,0.18)`
- Always visible across all screens

---

### Screen 2: Menu (pushed from vault)
Pushed from right when avatar is tapped. Full-screen white.

**Top bar**:
- Left: `← vault` back button — 14px / color `#999` / chevron left icon (14px)
- No right-side elements

**Profile summary row** (padding 24px 20px 20px, border-bottom `#EBEBEB`):
- Avatar: 56×56px circle / bg `#1A1A1A` / user initial 22px / weight 500 / white
- Name: `@username` — 17px / weight 500 / color `#111`
- Subtitle: "collecting since YYYY · N pieces" — 12px / color `#999` / marginTop 2px
- Chevron right icon (rightmost)
- **Tapping this row → pushes Profile screen**

**Nav rows** (each: padding 18px 20px, border-bottom `#EBEBEB`, flex justify-between, cursor pointer):
1. `collections` — label 16px / color `#111` + subtitle "N collections" 12px / `#999`  → pushes Collections
2. `profile` — label 16px / color `#111` → pushes Profile
3. `settings` — label 16px / color `#111` → pushes Settings

**Sign out** (padding 18px 20px):
- "sign out" — 15px / color `#CC4444` / cursor pointer

---

### Screen 3: Collections (pushed from menu)
**Top bar**:
- Left: `← back` / Right: `new +` (14px / color `#2D5A45` / weight 500)

**Page title**: "collections" — 22px / weight 500 / tracking -0.02em / padding 4px 20px

**Collection list** (border-top `#EBEBEB`, each row border-bottom `#EBEBEB`):
- Padding: 16px 20px
- Left: 3 piece photo thumbnails (36×46px / border-radius 5px / gap 8px) + name + piece count
  - Name: 14px / weight 500 / color `#111`
  - Count: 11px / color `#999` / marginTop 2px
- Right: chevron right icon
- Tapping a row → push into that collection's filtered vault view

**"add +" pill** remains visible at bottom

---

### Screen 4: Profile (pushed from menu)
**Top bar**: `← back` only

**Content** (centered, padding 20px):
- Avatar: 72×72px circle / bg `#1A1A1A` / 28px initial
- Username: 18px / weight 500
- "collecting since YYYY": 12px / color `#999` / marginTop 3px
- Stats block (border-top + border-bottom `#EBEBEB`, marginTop 20px, padding 16px 0):
  - Piece count: 28px / weight 600 / centered
  - "pieces" label: 11px / color `#999` / marginTop 2px
- Action buttons (marginTop 14px, flex row, gap 10px):
  - "share vault": bg `#1A1A1A` / white / border-radius 10px / padding 12px / 13px / weight 500
  - "edit profile": transparent / border `1px solid #EBEBEB` / border-radius 10px / same size

---

### Screen 5: Settings (pushed from menu)
**Top bar**: `← back` only

**Page title**: "settings" — 22px / weight 500 / padding 4px 20px

**Settings rows** (padding 16px 20px each, border-bottom `#EBEBEB`):
- account, notifications, privacy, legal → each with chevron right
- "sign out" → color `#CC4444` / no chevron

---

## Transition Specification

### Push (forward navigation)
```
New screen enters from right:
  from: translateX(100%)
  to:   translateX(0)
  duration: 360ms
  easing: cubic-bezier(0.25, 0.46, 0.45, 0.94)
  CSS property: transform
```

### Pop (back navigation)
```
Current screen exits to right:
  from: translateX(0)
  to:   translateX(100%)
  duration: 320ms
  easing: cubic-bezier(0.25, 0.46, 0.45, 0.94)
  then: remove screen from stack
```

### Implementation approach
- Maintain a navigation stack array in state: `['vault', 'menu', 'collections']`
- Render the base vault screen always (absolute position, inset 0)
- When `stack.length > 1`, render the top screen with the push transform on top (z-index 10)
- Use `requestAnimationFrame` double-call to trigger CSS transition after mount

---

## State Management

```typescript
// Navigation stack
const [navStack, setNavStack] = useState<string[]>(['vault']);

function push(screen: string) {
  setNavStack(s => [...s, screen]);
}

function pop() {
  setNavStack(s => s.slice(0, -1));
}

// Current screen = navStack[navStack.length - 1]
```

---

## Removing the Bottom Tab Bar

In `app/(main)/layout.tsx`:
- Remove the `<TabBar>` or bottom navigation component entirely
- Keep the top `<header>` but update its right side to show: search icon + avatar (instead of just avatar/menu)

In the vault page (`app/vault/[username]/page.tsx` or the client component):
- Replace the existing FAB (`<VaultFAB />`) with the new centered "add +" pill
- The pill should be `position: fixed` (not absolute) so it persists across navigation

---

## Files to Modify

| File | Change |
|---|---|
| `app/(main)/layout.tsx` | Remove bottom tab bar; update header right side |
| `components/vault/vault-fab.tsx` | Redesign as centered fixed pill instead of corner FAB |
| `app/vault/[username]/page.tsx` | Add navigation stack wrapper |
| `components/layout/user-menu.tsx` | Simplify to avatar-only trigger (no dropdown — push instead) |
| New: `components/nav/push-nav.tsx` | Navigation stack context + push/pop logic |
| New: `components/nav/menu-screen.tsx` | The menu screen (profile summary + nav rows) |

---

## What's NOT in the Mock
- Actual transition animation for pop (back) — the prototype only shows push. Pop should mirror push but reversed.
- The vault coverflow view — use existing implementation
- Search — use existing `VaultSearch` component, triggered by the search icon
- Loading and error states for profile/settings data

---

## Reference
Open `Threadology Nav.html` → click "view concepts" → scroll to **Concept 4** → tap the avatar circle to experience the push transitions interactively.
