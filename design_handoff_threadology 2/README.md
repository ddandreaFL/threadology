# Handoff: Threadology UI — Direction A "Minimal"

## Overview
This package contains high-fidelity design references for a full visual refresh of Threadology — a personal wardrobe documentation app for vintage fashion collectors. The designs cover all essential screens and a complete onboarding flow, built around a "sacred space" philosophy: chrome disappears, photos are the product, the UI gets out of the way.

The reference app is built in **Next.js (App Router) with Tailwind CSS**, using Supabase as the backend. The repo is at `ddandreaFL/threadology`.

---

## About the Design Files
`Threadology Directions.html` is a **high-fidelity interactive design reference** built in HTML/React — not production code to copy directly. Your task is to **recreate these designs in the existing Next.js/Tailwind codebase**, using its established patterns, components, and libraries. Match the visual output pixel-for-pixel; use the codebase's existing conventions for implementation.

The prototype is interactive — the vault screen has a working coverflow carousel (click side cards to navigate) and a view toggle (coverflow ↔ grid). Use it to understand intended behavior.

---

## Fidelity
**High-fidelity.** Every color, spacing value, font size, border radius, and interaction is intentional and should be matched precisely. The designs were grounded in the existing codebase's exact color tokens and font stack.

---

## Design Tokens

### Colors
```
Background:     #FFFFFF
Text primary:   #111111  (gray-900 equivalent)
Text muted:     #999999  (gray-400 equivalent)
Accent green:   #2D5A45  (unchanged from existing codebase)
Faint bg:       #F5F5F5
Divider:        #EBEBEB
Border light:   #E0E0E0
Card hover:     #F0F0F0
Dark bar:       #1A1A1A
```

### Typography
All text uses **`"Helvetica Neue", Helvetica, Arial, sans-serif`** — this is the existing `font-mono-display` stack in tailwind.config.ts, applied universally. No Cormorant or DM Sans in this direction.

```
Wordmark:       20px / weight 500 / tracking -0.02em
Page titles:    22–24px / weight 500 / tracking -0.02em
Section heads:  18–20px / weight 500
Body/names:     13–15px / weight 400–500
Labels/meta:    10–12px / weight 400 / color #999
Micro labels:   9–10px / weight 400 / uppercase / tracking 0.12em
```

### Spacing
```
Screen padding:     20px horizontal
Section gaps:       14–20px vertical
Card inner:         8–10px
Form field gap:     18–24px
```

### Border Radius
```
Cards/photos:   6px  (vault grid)
                14px (coverflow cards)
                8px  (detail photo, form elements)
Buttons/pills:  30px (pill CTA, floating bar)
                10px (standard button)
                8px  (secondary button)
Avatars:        50%
Year badge:     3px
```

### Shadows
```
Coverflow active card:   0 12px 40px rgba(0,0,0,0.18)
FAB:                     0 4px 16px rgba(45,90,69,0.30)
```

---

## Screens

### 1. Vault — Coverflow View (primary)
**Purpose:** Browse your full piece collection in a cinematic, photo-forward layout.

**Layout:**
- Status bar: 44px, standard iOS
- Top nav: 56px, `bg-white/90 backdrop-blur`, bottom border `#EBEBEB`
  - Left: "Threadology" wordmark — 20px / weight 500 / tracking -0.02em
  - Right: coverflow toggle icon → grid toggle icon → search icon → avatar circle (28px, bg `#2D5A45`, white "mk" initials)
- Collection tabs: underline style, `padding: 14px 20px 0`, horizontal scroll
  - Active: weight 500, color `#111`, `border-bottom: 1.5px solid #111`
  - Inactive: weight 400, color `#999`, transparent border
- 1px divider `#EBEBEB`
- Coverflow stage: `flex: 1`, perspective 1000px, overflow hidden
  - Cards: 192×272px, borderRadius 14px, absolutely positioned
  - Center card: `translateX(0) rotateY(0deg) scale(1)` zIndex 10, shadow
  - ±1 offset: `translateX(±118px) rotateY(∓48deg) scale(0.80)` opacity 0.68, zIndex 8
  - ±2 offset: `translateX(±236px) rotateY(∓96deg) scale(0.60)` opacity 0.36, zIndex 6
  - Transition: `transform 0.38s cubic-bezier(0.25,0.1,0.25,1), opacity 0.38s`
  - Cards vertically centered: `top: calc(50% - 136px)`
  - Clicking a non-active card → sets it as active
- Below coverflow (flexShrink 0):
  - Piece name: 16px / weight 500 / centered
  - Brand · year: 12px / color `#999` / centered / marginTop 4px
  - Dot navigation: marginTop 12px, centered
    - Active dot: 18×6px / bg `#111` / borderRadius 3px / transition width 0.2s
    - Inactive dot: 6×6px / bg `#DEDEDE`
- Floating "add +" pill: position absolute, bottom 24px, centered
  - Container: bg `#1A1A1A`, borderRadius 30, height 48, auto-width with padding 0 28px
  - Text: "add +" / 14px / weight 500 / white

### 2. Vault — Grid View (secondary, toggled)
**Purpose:** Scan collection at a glance with more pieces visible.

**Layout:**
- Same header and tabs as coverflow view
- 2-column grid, gap 12px horizontal, 22px row gap, padding 16px 20px
- Each card (borderless, no shadow):
  - Photo: full column width, aspect-ratio 1:1, borderRadius 6px
  - Year badge: position absolute top-right 8px, bg `rgba(255,255,255,0.88)` blur(4px), borderRadius 3px, padding 2px 6px, 9px / weight 600
  - Name: 13px / weight 500 / marginTop 8px
  - Brand (left) + `...` dots (right): 11px / color `#999` / marginTop 2px
- Same floating "add +" pill

### 3. Piece Detail
**Purpose:** View full information about a single piece.

**Layout:**
- Status bar
- Nav bar: back chevron + "vault" text (13px / color `#999`) left; `...` dots right
- Photo: full width, aspect-ratio 1:1, borderRadius 8px, marginTop 14px
  - Swipe dots at bottom center: active 20×4px white 0.9 opacity, inactive 5×4px white 0.4 opacity
- Brand: 11px / color `#999` / marginTop 16px
- Piece name (h1): 22px / weight 500 / tracking -0.02em / lineHeight 1.2 / marginTop 4px
- Season/year: 12px / color `#999` / marginTop 6px
- Metadata rows (border-top `#EBEBEB`, paddingTop 16px, marginTop 20px):
  - Each row: `display flex justify-between`, padding 9px 0, border-bottom `#F0F0F0`
  - Label: 12px / color `#999` | Value: 12px / color `#111`
  - Fields: type, condition, size, origin
- Story (border-top, marginTop 20px):
  - "story" label: 11px / color `#999` / marginBottom 10px
  - Blockquote: `border-left: 2px solid #2D5A45` / paddingLeft 14px / 14px / color `#444` / lineHeight 1.8
- Collections chips (marginTop 18px):
  - Chip: `border: 1px solid #E0E0E0` / borderRadius 4px / padding 5px 10px / 11px / color `#999`
  - "add" chip: `border: 1px dashed #2D5A45` / color `#2D5A45`
- Floating bottom bar (position absolute, bottom 20, left/right 16):
  - bg `#1A1A1A` / borderRadius 30 / height 52
  - Left: 32×32 piece photo thumbnail + piece name (12px / white / weight 500)
  - Right: "edit" text button (12px / white / weight 500)

### 4. Collections
**Purpose:** Browse and manage piece collections.

**Layout:**
- Status bar + top nav ("collections" title left, "new +" accent link right)
- 1px divider
- List of collections (border-bottom `#F0F0F0`):
  - Padding: 16px 20px
  - Thumbnail strip: 4 photos at 64×80px each / borderRadius 6px / gap 4px + overflow count chip (64×80, bg `#F5F5F5`, 11px muted)
  - Collection name: 14px / weight 500 / marginTop 10px
  - Piece count: 11px / color `#999` / marginTop 2px
  - Chevron right icon
- Footer prompt: "group your pieces into collections" / 12px / muted / centered
- Floating pill: "new collection +" same style as vault add pill

### 5. Profile
**Purpose:** View stats, share vault, access settings.

**Layout:**
- Status bar + top nav ("profile" left, settings gear icon right)
- Centered avatar section (paddingTop 28px):
  - Avatar: 80px circle / bg `#1A1A1A` / 28px white "m" letter
  - Username: 18px / weight 500 / tracking -0.01em / marginBottom 3px
  - "collecting since 2018": 12px / muted
- Stats row (marginTop 20px, border-top + border-bottom `#EBEBEB`):
  - 3 equal columns, border-right between them
  - Value: 18px / weight 600 | Label: 10px / muted / marginTop 2px
  - Fields: pieces, brands, era span
- Action buttons row (marginTop 20px, gap 10px):
  - "share vault": bg `#1A1A1A` / white text / borderRadius 10px / padding 12px
  - "edit profile": transparent / border `#E0E0E0` / borderRadius 10px / padding 12px
  - Both: 13px / weight 500
- Settings list (marginTop 24px, border-top `#F0F0F0`):
  - Each row: padding 14px 20px / border-bottom `#F8F8F8` / flex justify-between
  - Label: 14px / chevron right
  - "premium" row: bg `#F8FBF9` / label color `#2D5A45` / subtitle "✦ upgrade for unlimited pieces"
  - "sign out": color `#CC4444`

### 6. Add Piece — Step 1: Photo
**Purpose:** Upload or capture a photo to begin adding a piece.

**Layout:**
- Status bar
- Nav: "← cancel" (muted) left / step dots right (active 18×6px, inactive 6×6px)
- "add a piece" title: 22px / weight 500 / marginTop 20px
- "start with a photo": 13px / muted / marginTop 4px
- Upload zone (flex:1, padding 20px 20px 80px, gap 12px):
  - Camera block (flex:3): dashed border `#DEDEDE` 1.5px / borderRadius 16px / bg `#FAFAFA`
    - Icon circle: 56px / bg `#1A1A1A` / camera SVG white
    - "take a photo": 14px / weight 500
    - "use your camera": 12px / muted
  - Library block (flex:2): solid border `#EBEBEB` / borderRadius 16px / flex row / padding 20px
    - Image SVG icon (muted) + label column
    - "choose from library": 14px / weight 500
    - "photos or files": 12px / muted
  - Privacy note: "your photos are private by default" / 11px / muted / centered

### 7. Add Piece — Step 2: Details
**Purpose:** Enter metadata for the piece.

**Layout:**
- Status bar
- Nav: "← back" (muted) left / step dots (2 of 3 active) right
- Header row (padding 16px 20px, flex, gap 14px):
  - Piece thumbnail: 56×72px / borderRadius 8px
  - "the details": 22px / weight 500
  - "tell us about this piece": 13px / muted
- Form (padding 20px, gap 18px between fields):
  - Each field: label (10px / uppercase / muted / marginBottom 5px) + value (15px) + border-bottom `#E0E0E0`
  - name, brand (full width)
  - year + type (2-col grid, gap 18px)
  - condition (full width)
  - story (multiline, minHeight 54px)
- Save CTA (padding 16px 20px 32px):
  - "save to vault →" / bg `#1A1A1A` / borderRadius 30 / padding 15px / 14px / weight 500 / white / full width

### 8. Public Vault
**Purpose:** The shareable view visitors see when someone shares their vault.

**Layout:**
- Status bar
- Header:
  - Left: "threadology" (11px / muted) above "@mkollection" (18px / weight 500)
  - Right: "follow" pill button (bg `#1A1A1A` / white / borderRadius 20 / padding 8px 16px / 12px)
- Stats row (padding 12px 20px): "47 pieces · 8 brands · '91–'03" in 11px muted chips with gap 16px
- 1px divider
- Coverflow (identical to vault, minus the view toggle)
- Footer: "vault by **threadology**" (10px / muted / accent color on "threadology") — centered, bottom

### 9. Onboarding — Welcome
**Purpose:** First impression. Communicates the app's soul before any action.

**Layout:**
- 44px top spacer
- Full-screen non-interactive coverflow (flex:1):
  - 5 static cards (no click interaction), same 3D transform math
  - Visual only — shows the product before sign-up
- Bottom section (padding 0 28px 48px):
  - "Threadology": 32px / weight 500 / tracking -0.03em / lineHeight 1.15
  - Tagline: "a vault for the things you love" / 15px / muted / lineHeight 1.5 / marginBottom 32px
  - "create vault" CTA: full width / bg `#1A1A1A` / borderRadius 30 / padding 16px / 15px / weight 500 / white / marginBottom 14px
  - "already have an account? **sign in**": 13px / muted / centered

### 10. Onboarding — Sign Up
**Purpose:** Create account.

**Layout:**
- Status bar
- "create your vault": 24px / weight 500 / tracking -0.02em
- "it's free to start": 13px / muted / marginBottom 36px
- Email + password fields (gap 24px):
  - Label: 10px / muted / marginBottom 8px
  - Input value/placeholder: 15px / color `#CCCCCC` (placeholder)
  - Border-bottom: 1.5px solid `#1A1A1A`
- "continue →" CTA: same pill style, marginTop 8px
- OR divider: thin lines + "or" text (11px / muted)
- "Continue with Apple": bg `#1A1A1A` / white text / pill
- "Continue with Google": bg white / border `#E0E0E0` / dark text / pill
- Terms note: 11px / muted / centered / bottom

### 11. Onboarding — Username
**Purpose:** Choose vault handle and see preview URL.

**Layout:**
- Status bar + progress dots (2 of 3 active)
- "name your vault": 24px / weight 500
- Subtext: 13px / muted / lineHeight 1.5 / marginBottom 40px
- "@" prefix + username input row:
  - "@": 22px / color `#999` | username: 22px / weight 500 / tracking -0.01em
  - Border-bottom: 1.5px solid `#1A1A1A` / paddingBottom 12px
- URL preview box (bg `#F5F5F5` / borderRadius 8 / padding 10px 14px / marginBottom 32px):
  - "your vault will live at": 11px / muted
  - URL with username in `#2D5A45` / weight 500
- "looks good →" CTA: pill style

### 12. Onboarding — First Piece (Empty State)
**Purpose:** Orient new user, prompt first add action.

**Layout:**
- Status bar + top nav (Threadology wordmark + avatar)
- 1px divider
- Ghost coverflow (flex:1, same 3D transforms):
  - 5 ghost cards: dashed border `#DEDEDE` 1.5px / bg `#FAFAFA` / same perspective transforms
  - Center card shows `+` icon circle (40px dashed border `#CCCCCC`) + "your first piece" (11px / color `#CCCCCC`)
- Bottom CTA section (padding 0 28px 40px, centered):
  - "your vault is empty": 18px / weight 500 / tracking -0.01em
  - Description: 13px / muted / lineHeight 1.5 / marginBottom 28px
  - "add first piece +" pill: same dark pill / height 52px / padding 0 32px / 15px

---

## Interactions & Behavior

### Coverflow Carousel
- State: `active` index (0–5)
- On card click → set as active
- Transform formula per card at offset `off = index - active`:
  ```
  rotateY  = off * -48deg
  translateX = off * 118px
  scale    = 1 - |off| * 0.20
  opacity  = 1 - |off| * 0.32
  zIndex   = 10 - |off| * 2
  ```
- Only render cards where `|off| <= 2`
- Transition: `transform 0.38s cubic-bezier(0.25,0.1,0.25,1), opacity 0.38s`
- Dot indicators update on active change (active dot width transitions 6→18px)
- Should also support swipe gestures on mobile (use existing `touchStartX` pattern from `photo-gallery.tsx`)

### View Toggle (Vault)
- State: `view` = `'coverflow'` | `'grid'`
- Toggle icons in header: coverflow icon + grid icon
- Active icon at full opacity, inactive at 0.35 opacity
- Persist to `localStorage` so it survives refresh

### Floating "add +" Pill
- Tapping opens Add Piece flow (Step 1: Photo)
- On vault screen only (not detail, collections, profile)
- Position: `position: fixed`, bottom 24px, horizontally centered

### Add Piece Flow
- 3 steps: photo → (crop/adjust, not mocked) → details
- Step indicators: active step = 18×6px pill, inactive = 6×6px dot
- Photo step: tapping "take a photo" → open native camera; "choose from library" → file picker
- Details step: form validation before "save to vault" — name and brand required minimum
- On save → animate piece into vault, return to vault screen

### Collection Tabs (Vault)
- Active tab: weight 500, `border-bottom: 1.5px solid #111`
- Inactive: weight 400, transparent border
- Horizontal scroll when tabs overflow
- Selecting a tab filters the coverflow/grid to pieces in that collection

---

## State Management

```
vault.view          'coverflow' | 'grid'         localStorage
vault.activeIndex   number                        component state
vault.activeTab     number (collection filter)    URL param (?c=slug) — existing pattern
search.query        string                        component state
```

---

## Files in This Package
- `Threadology Directions.html` — Full interactive hi-fi prototype. Open in a browser. All 12 screens are laid out on a pannable/zoomable canvas. Scroll right to find the Essential Screens and Onboarding rows. Click vault coverflow cards to interact.

---

## What's NOT in the Designs (but needs implementation)
- Photo crop/adjust step (Step 2 of add flow) — use existing `photo-upload-with-crop.tsx`
- Search results state (empty, loading, results)
- Error and loading states for all screens
- Premium upgrade flow (the "upgrade" row in profile taps through to `/upgrade`)
- Collection create modal/sheet
- Piece delete confirmation

---

## Key Decisions Made vs. Current Codebase

| Current | New Direction |
|---|---|
| `rounded-xl` cards with `border border-[#E0D8CC]` | Borderless cards, photo floats on white |
| Bottom-border green dots in gallery | Same green dots kept |
| Top nav `font-sans` (DM Sans) wordmark | Wordmark stays but in Helvetica Neue |
| Collection filter pills (green fill) | Underline tabs (lowercase) |
| Separate FAB for add | Floating centered dark pill "add +" |
| No defined onboarding | Full 4-screen onboarding with ghost coverflow |
| Grid-first vault | Coverflow-first, grid as secondary toggle |
