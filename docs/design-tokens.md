# Design Tokens & Styling Spec — "Pairs With" Widget

![Reference design for the cross-sell widget](design-mockup.png)

Derived from the reference screenshot and measured against the live theme. Everything below is a **read of the comp**, not a handoff from a design file — see *Method & confidence* for how the absolute values were derived.

---

## 1 · What the reference actually communicates

The design has a clear, deliberate visual system. Naming it matters more than matching any single pixel:

1. **Dual-typeface contrast.** A tracked-out **monospace** carries all *system/UI* text (section heading `PAIRS WITH`, the `SIZE` label, the `ADD` label). A neutral **grotesque** carries all *content* text (product name, price). This split is the single strongest source of the "premium editorial" feel. Preserve it above all else.
2. **Zero border radius.** Cards, selects and buttons all have hard 90° corners. Sharp geometry = considered, technical, fashion-adjacent.
3. **Monochrome only.** White page, light-grey card surface, near-black ink, one mid-grey for disabled. No accent colour anywhere. Emphasis is created with *weight and border*, never with hue.
4. **Border weight as state.** The first card's select has a **2px black** border; the second card's is a **1px light grey**. That's a resting vs. focused/active state, not a decoration. The `ADD` button is rendered in grey = **disabled until an option is chosen**.
5. **Deliberate peek.** The next card is cut off mid-frame. That's the scroll affordance — the arrows alone aren't carrying it. Keep ~1.5 cards visible on desktop.
6. **Horizontal card layout.** Image on the left (~25% of card width), all content stacked on the right. Not the usual vertical product card — this keeps the widget short so it doesn't push the page down below the Add to Cart button.
7. **Product images sit directly on the card surface**, no inner container, no white tile. Requires transparent or matching-background product photography.

---

## 2 · Method & confidence

The screenshot is a **zoomed crop**, so its absolute pixels were never directly usable — that part of the original method holds. What was wrong is the reference width it got de-scaled against: the first pass anchored a 56px select height, backed into a scale factor, and *guessed* a ~600px product-info column to make the numbers land. That column width was never derived from the screenshot. It needed to be measured in the theme, and it isn't 600px.

**Measured, not assumed:**

- **750–1199px viewport** — `snippets/product-information-content.liquid:183` sets the media-left layout to `grid-template-columns: 1fr min(50vw, var(--sidebar-width))`, and `--sidebar-width: 25rem` in `snippets/theme-styles-variables.liquid:128` — a hard **400px ceiling** on the info column, reached at any viewport ≥800px.
- **≥1200px viewport** — `snippets/product-information-content.liquid:298-303` switches to `grid-template-columns: 2fr 1fr`; at a 1440px viewport that resolves to roughly **453px**.
- Both cases carry `padding-left: calc(var(--gap) / 2)` on `.product-details` (same file, line 190), and the template's `gap` setting is `48` (`templates/product.json`) — a flat **24px** lost before the widget ever sees the column.

Net usable width: **351px at 750px → 376px across the 800–1199px plateau → ~429px at 1440px.** 376px is the anchor used below — it's the width that holds across the widest practical range, not a number chosen to make a ~1.5-cards-visible read feel tidy.

The *proportions* read from the comp are still the right source for the internal relationships (image ÷ card, gap ÷ card, the type-scale ratios) — that part of the original method was sound. Only the reference width was wrong. This is an upgrade to the argument's confidence, not a retreat: it moves from *"estimated from a zoomed screenshot"* to *"measured in the theme,"* and it's also why question 1 in §11 no longer needs the client — the column width isn't a merchant-configurable full-width option, it's fixed by the theme's own product grid.

| Measure | Observed ratio (screenshot) | Recommended CSS (at the 376px plateau) |
|---|---|---|
| Card width ÷ column width | 0.645 → initially read as ~1.5 cards visible | `clamp(248px, calc((100% - var(--cs-gap-card)) / var(--cs-per-view)), 400px)`, `--cs-per-view: 1.3` → ~283px card |
| Gap ÷ card width | 2.3% | `8px` |
| Image column ÷ card width | 25.6% | `84px` (~30% of a 283px card) |
| Content column ÷ card width | 62.4% | `1fr` → ~163px at a 283px card |
| Select width ÷ card width | 47.7% | `1fr` → ~99px |
| Select ↔ ADD gap ÷ card width | 2.5% | `8px` |
| Heading → first card | — | `16px` |
| Heading font ÷ title font | 1.15 | `13px` / `13px` — parity in size now; hierarchy carried entirely by tracking, weight and case (§4) |
| Title font ÷ price font | 1.26 | `13px` / `12px` |
| Select height ÷ title font | 3.4 | `44px` / `13px` ≈ 3.38 — the screenshot ratio holds almost exactly once the scale is real |

The card width moved further than a literal rescale of 0.645 would predict (0.645 × 376px ≈ 243px). The binding constraint isn't the screenshot ratio, it's the interior arithmetic: a `<select>` and an `ADD` button both need to clear their own accessible floors (`--cs-control-h: 44px`, matching the theme's `--minimum-touch-target`) inside a content column that's already lost 84px to the image and 24px to card padding. `--cs-per-view: 1.3` is the value that keeps every token at or above that floor while a fraction of the next card still peeks — the full arithmetic check is in §10. (The schema setting's `step: 0.1` — theme-check rejects steps that aren't a multiple of 0.1 — means `1.3` is the closest value to the theoretical optimum, not the optimum itself.)

---

## 3 · Colour tokens

Monochrome, five values, no accents.

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--cs-bg` | `#FFFFFF` | Section / page background | — |
| `--cs-surface` | `#F4F4F4` | Card background | — |
| `--cs-surface-field` | `#FFFFFF` | Select & button background | — |
| `--cs-ink` | `#111111` | Headings, product name, price, active borders, active arrow | 16.5:1 on surface ✅ |
| `--cs-ink-muted` | `#6B6B6B` | Secondary copy, helper text | 5.3:1 on white ✅ |
| `--cs-ink-disabled` | `#B3B3B3` | Disabled `ADD` label | ~2.0:1 ⚠️ |
| `--cs-border` | `#D0D0D0` | Resting select / button border | ~1.5:1 (up from ~1.2:1) |
| `--cs-border-strong` | `#111111` | Focus / active border, 2px | — |
| `--cs-arrow-idle` | `#9E9E9E` | Disabled carousel arrow | — |

**One flag resolved into a stated decision, one left as-is:**

- `--cs-border` moves from `#E3E3E3` (~1.2:1 against white) to `#D0D0D0` (~1.5:1). That's a real step up, but read as an isolated stroke against the white field it still sits under the literal **WCAG 1.4.11** threshold (3:1 for a non-text UI boundary when the border is the only thing marking the control) — reaching that in full would need something close to `#767676` (~4.5:1), at real cost to the light aesthetic the reference specifies. The resting select in this spec is never delimited by the stroke alone, though: the white field sits on the grey `--cs-surface` card (§6, *Select*), so the boundary is also carried by a surface-colour change, and the state that actually needs to be unmistakable — the 2px `--cs-border-strong` focus/active border — already clears contrast by a wide margin. This is now a settled, documented trade-off rather than a question for the client.
- `--cs-ink-disabled` at ~2:1 stays a stated decision, not an oversight: disabled controls are exempt from WCAG 1.4.3, so reproducing the comp's low-contrast disabled label is defensible.

---

## 4 · Typography

### Families

The exact fonts can't be identified from a raster crop; these are matched by classification and metrics.

| Role | Classification | Reference-likely | Free/web-safe stack |
|---|---|---|---|
| **UI / system** | Grotesque **monospace**, uppercase, wide tracking | ABC Diatype Mono, Söhne Mono, Martian Mono | `ui-monospace, "SF Mono", "Roboto Mono", "IBM Plex Mono", Menlo, monospace` |
| **Content** | Neutral geometric grotesque — double-storey `a`, single-storey `g`, tall x-height, flagged `1` | Aeonik, Neue Montreal, Söhne, Helvetica Now | `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif` |

For the prototype, prefer the **theme's existing font settings** for the content face (`{{ settings.type_body_font }}`) so the widget inherits the client's brand, and add only the monospace as a variable. That's one fewer font file loaded and one fewer thing to license.

### Scale

| Token | Size | Weight | Tracking | Case | Applied to |
|---|---|---|---|---|---|
| `--cs-fs-heading` | `13px` (`0.8125rem`) | 500 | `0.10em` | UPPER | `PAIRS WITH` (mono) |
| `--cs-fs-title` | `13px` / lh 1.30 | 400 | `-0.01em` | Sentence | Product name (grotesque) |
| `--cs-fs-price` | `12px` / lh 1.2 | 400 | `0` | — | Price (grotesque) |
| `--cs-fs-label` | `11px` | 500 | `0.08em` | UPPER | `SIZE`, `ADD` (mono) |

Product titles clamp to **2 lines** (`-webkit-line-clamp: 2`) so card heights never diverge.

---

## 5 · Spacing & geometry

| Token | Value | Use |
|---|---|---|
| `--cs-radius` | `0` | Everything. No exceptions. |
| `--cs-per-view` | `1.3` | Cards visible per viewport; drives `--cs-card-w` |
| `--cs-gap-card` | `8px` | Between carousel cards |
| `--cs-pad-card` | `12px` | Card inner padding |
| `--cs-gap-media` | `12px` | Image column → content column |
| `--cs-gap-stack` | `6px` | Title → price → controls |
| `--cs-gap-controls` | `8px` | Select → ADD |
| `--cs-space-header` | `16px` | Section heading → carousel |
| `--cs-control-h` | `44px` | Select and ADD height (matches the theme's `--minimum-touch-target`, `theme-styles-variables.liquid:637`) |
| `--cs-media-w` | `84px` | Image column width |
| `--cs-add-min-w` | `56px` | Minimum width reserved for the ADD button inside the content column |
| `--cs-card-w` | `clamp(248px, calc((100% - var(--cs-gap-card)) / var(--cs-per-view)), 400px)` | Card width; resolves to the visible-cards ratio above |
| `--cs-border-w` | `1px` | Resting border |
| `--cs-border-w-strong` | `2px` | Focus / active border |

**Critical:** the 2px active border must not shift layout. Use `box-shadow: inset 0 0 0 2px` or a transparent 2px resting border, never a border-width change.

---

## 6 · Component specs

### Overflow containment — non-negotiable

Every level between the block root and the scroll-snap track needs `min-width: 0`: the block wrapper, the `<cross-sell-component>` host, the scroller (the element carrying `overflow-x`), and each card's content column. Any CSS grid placing these needs `minmax(0, 1fr)` instead of a bare `1fr` for the same reason. Skip it anywhere in that chain and a flex/grid item falls back to its `min-content`; for an `overflow-x` scroller, `min-content` is the width of its widest unbroken child, which forces the whole thing wider than its track — and since that track sits inside the PDP's own grid (`snippets/product-information-content.liquid`), the failure mode is the product-info column itself getting wider, not a harmless internal scrollbar.

### Section header
Mono, uppercase, tracked, `--cs-ink`, left-aligned. Arrows pinned right on the same baseline row.

### Carousel arrows
- Icon: thin-stroke arrow, `stroke-width: 1.5`, `20px` box, `currentColor`.
- Hit area: **44 × 44px** minimum (touch target), transparent background, no border, no circle.
- Gap between the two: `8px`.
- States: enabled `--cs-ink` · disabled `--cs-arrow-idle` + `pointer-events: none` + `aria-disabled="true"`.
- Hidden below 750px — swipe carries it there.

### Card
`--cs-surface`, radius 0, no border, no shadow. CSS grid: `grid-template-columns: var(--cs-media-w) minmax(0, 1fr)`, items centred vertically.

### Product image
`aspect-ratio: 1 / 1`, `object-fit: contain`, sits on the card surface with no wrapper background. `loading="lazy"`, `srcset` at 1x/2x of the rendered size, explicit `width`/`height` to prevent CLS.

### Select
White field on the grey card, 1px `--cs-border`, `--cs-control-h`, mono uppercase label, custom chevron (16px, inline SVG as `background-image`, `appearance: none`), padding `0 40px 0 16px`.

### ADD button
`--cs-control-h`, `min-width: var(--cs-add-min-w)`, `padding: 0 16px`, mono uppercase label, radius 0.

---

## 7 · Interaction states

The comp shows two of these; the rest are inferred and should be listed as assumptions in the write-up.

| Element | State | Spec |
|---|---|---|
| Select | resting | bg `#FFF`, 1px `--cs-border`, label `--cs-ink` |
| Select | hover | border → `--cs-ink` at 1px |
| Select | focus / active | **2px `--cs-ink`** *(shown in the comp, card 1)* |
| Select | focus-visible (kbd) | 2px `--cs-ink` + `outline: 2px solid --cs-ink; outline-offset: 2px` |
| ADD | disabled *(default)* | bg `#FFF`, 1px `--cs-border`, label `--cs-ink-disabled`, `cursor: not-allowed` *(shown in the comp)* |
| ADD | enabled | **bg `--cs-ink`, label `#FFF`, border `--cs-ink`** — *inferred, confirm with client* |
| ADD | hover (enabled) | bg `#000`, subtle `transform: translateY(-1px)` or none |
| ADD | loading | label swaps to a 14px monochrome spinner, width locked, `aria-busy="true"` |
| ADD | success | label → `ADDED` for 1.8s, then back to `ADD` |
| ADD | error | label → `TRY AGAIN`, inline message below the card |
| Card | hover | no change — the design is static; restraint is the aesthetic |

The **enabled** ADD state is the one meaningful gap in the comp. Inverting to solid black is the reading most consistent with the rest of the system (black is already the "active" signal on the select border).

---

## 8 · Motion

| Token | Value |
|---|---|
| `--cs-dur` | `160ms` (state changes) |
| `--cs-dur-slow` | `320ms` (carousel scroll) |
| `--cs-ease` | `cubic-bezier(0.4, 0, 0.2, 1)` |

Transition `color`, `background-color`, `box-shadow` only — never `width`, `height` or `border-width`. Carousel uses `scroll-behavior: smooth` + `scroll-snap-type: x mandatory`. Wrap everything in `@media (prefers-reduced-motion: reduce) { transition: none; scroll-behavior: auto; }`.

---

## 9 · Responsive behaviour

| Breakpoint | Behaviour |
|---|---|
| **≥990px** | Column plateaus at 400px (the theme's `--sidebar-width` cap) down to 376px usable across 800–1199px viewports, growing to ~429px usable at 1440px; `--cs-card-w` resolves to **~283–324px** across that range, ~1.3 cards visible + peek, arrows shown |
| **750–989px** | Column narrows toward **351px** usable at the low end (750px viewport); the same clamp holds without an override, but `--cs-add-min-w` steps down to `52px` so the ADD button doesn't crowd the select |
| **<750px** | `--cs-card-w: clamp(232px, calc((100% - var(--cs-gap-card)) / var(--cs-per-view)), 340px)`, `--cs-media-w: 76px`, `--cs-control-h: 40px`, `--cs-gap-media: 10px`, arrows hidden — swipe only |

Keep the horizontal card layout on mobile. Flipping to a stacked card doubles the widget's height right under the Add to Cart button, which is the worst possible place to add scroll depth on the highest-converting device.

---

## 10 · Paste-ready token block

```css
.cross-sell {
  /* Colour */
  --cs-bg:              #ffffff;
  --cs-surface:         #f4f4f4;
  --cs-surface-field:   #ffffff;
  --cs-ink:             #111111;
  --cs-ink-muted:       #6b6b6b;
  --cs-ink-disabled:    #b3b3b3;
  --cs-border:          #d0d0d0;
  --cs-border-strong:   #111111;
  --cs-arrow-idle:      #9e9e9e;

  /* Type */
  --cs-font-mono:  ui-monospace, "SF Mono", "Roboto Mono", "IBM Plex Mono", Menlo, monospace;
  --cs-font-body:  var(--font-body--family, "Inter", -apple-system, "Segoe UI", Helvetica, Arial, sans-serif);
  --cs-fs-heading: 13px; /* 0.8125rem */
  --cs-fs-title:   13px;
  --cs-fs-price:   12px;
  --cs-fs-label:   11px;
  --cs-track-wide: 0.10em;
  --cs-track-label:0.08em;

  /* Space & geometry */
  --cs-radius:         0;
  --cs-per-view:       1.3;
  --cs-card-w:         clamp(248px, calc((100% - var(--cs-gap-card)) / var(--cs-per-view)), 400px);
  --cs-media-w:        84px;
  --cs-control-h:      44px;
  --cs-add-min-w:      56px;
  --cs-gap-card:       8px;
  --cs-pad-card:       12px;
  --cs-gap-media:      12px;
  --cs-gap-stack:      6px;
  --cs-gap-controls:   8px;
  --cs-space-header:   16px;
  --cs-border-w:       1px;
  --cs-border-w-strong:2px;

  /* Motion */
  --cs-dur:      160ms;
  --cs-dur-slow: 320ms;
  --cs-ease:     cubic-bezier(0.4, 0, 0.2, 1);
}

/*
  Arithmetic check, 376px column (the 800–1199px plateau):
  card     = (376 − 8) / 1.3               ≈ 283px
  interior = 283 − (2 × 12 padding)          = 259px
  content  = 259 − 84 media − 12 gap-media   = 163px
  select   = 163 − 8 gap-controls − 56 ADD  ≈ 99px
  → 1.3 cards laid out in full, plus a visible peek of the next one.
*/

@media screen and (max-width: 989px) {
  .cross-sell {
    --cs-add-min-w: 52px;
  }
}

@media screen and (max-width: 749px) {
  .cross-sell {
    --cs-card-w:    clamp(232px, calc((100% - var(--cs-gap-card)) / var(--cs-per-view)), 340px);
    --cs-media-w:   76px;
    --cs-control-h: 40px;
    --cs-gap-media: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cross-sell { --cs-dur: 0ms; --cs-dur-slow: 0ms; }
}
```

---

## 11 · Open questions for the client

Question 1 from the original read (column-width vs. full content width) is answered — it's column-width, fixed by the theme's own product-information grid, not a setting any store chooses. See §2 for how it was measured.

1. What is the **enabled** state of the `ADD` button? (Assumption: solid black fill, white label.)
2. Which **brand fonts** are licensed for web? The mono is doing a lot of work here — a generic fallback loses most of the character.
3. Product images appear on a transparent/matching background. Is the full cross-sell catalogue shot that way, or do we need a neutral tile fallback for inconsistent imagery?
4. Should the `SIZE` label be literal, or the product's real option name (Size / Colour / Length)? Building it dynamic is safer; the comp only shows one case.
