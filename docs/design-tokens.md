# Design Tokens & Styling Spec — "Pairs With" Widget

![Reference design for the cross-sell widget](design-mockup.png)

Derived from the reference screenshot. Everything below is a **read of the comp**, not a handoff from a design file — see *Method & confidence* before treating absolute pixel values as final.

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

The screenshot is a **zoomed crop**, so absolute pixels can't be read directly. What *is* reliable is the set of **internal proportions**, which are scale-independent.

Anchoring on a 56px select height (a standard premium control height) gives a scale factor of ≈ **0.31** from screenshot pixels to CSS pixels, and produces a coherent set of values: a **~400px card** in a **~600px product-info column** with the next card peeking. That matches the brief exactly — the widget lives *inside* the PDP info column, below Add to Cart.

| Measure | Observed ratio | Recommended CSS |
|---|---|---|
| Card width ÷ column width | 0.645 → ~1.5 cards visible | `400px` fluid, `clamp(300px, 78%, 420px)` |
| Gap ÷ card width | 2.3% | `10px` |
| Image column ÷ card width | 25.6% | `100px` |
| Content column ÷ card width | 62.4% | `1fr` (~250px) |
| Select width ÷ card width | 47.7% | `~190px` (`1fr`) |
| Select ↔ ADD gap ÷ card width | 2.5% | `10px` |
| Heading → first card | — | `32px` |
| Heading font ÷ title font | 1.15 | `18px` / `16px` |
| Title font ÷ price font | 1.26 | `16px` / `14px` |
| Select height ÷ title font | 3.4 | `56px` |

> **Confirm with the client** whether the widget is column-width (~600px) or full content width (~1200px). If full-width, scale card width to ~640px and bump the type scale one step; all ratios hold.

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
| `--cs-border` | `#E3E3E3` | Resting select / button border | ~1.2:1 ⚠️ |
| `--cs-border-strong` | `#111111` | Focus / active border, 2px | — |
| `--cs-arrow-idle` | `#9E9E9E` | Disabled carousel arrow | — |

**Two flags worth raising with the client rather than silently copying:**

- `--cs-ink-disabled` at ~2:1 is technically exempt from WCAG 1.4.3 (disabled controls are), so reproducing it is defensible — but it should be a stated decision, not an accident.
- `--cs-border` at ~1.2:1 fails **WCAG 1.4.11 (non-text contrast, 3:1)** if that border is the only thing identifying the control's boundary. Minimum compliant alternative: `#767676`. A middle path that keeps the light aesthetic: darken to `#D0D0D0` and keep the field on the white surface against the grey card, so the boundary reads from the surface change rather than the stroke alone.

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
| `--cs-fs-heading` | `18px` | 500 | `0.10em` | UPPER | `PAIRS WITH` (mono) |
| `--cs-fs-title` | `16px` / lh 1.30 | 400 | `-0.01em` | Sentence | Product name (grotesque) |
| `--cs-fs-price` | `14px` / lh 1.2 | 400 | `0` | — | Price (grotesque) |
| `--cs-fs-label` | `12px` | 500 | `0.08em` | UPPER | `SIZE`, `ADD` (mono) |

Product titles clamp to **2 lines** (`-webkit-line-clamp: 2`) so card heights never diverge.

---

## 5 · Spacing & geometry

| Token | Value | Use |
|---|---|---|
| `--cs-radius` | `0` | Everything. No exceptions. |
| `--cs-gap-card` | `10px` | Between carousel cards |
| `--cs-pad-card` | `16px` | Card inner padding |
| `--cs-gap-media` | `16px` | Image column → content column |
| `--cs-gap-stack` | `12px` | Title → price → controls |
| `--cs-gap-controls` | `10px` | Select → ADD |
| `--cs-space-header` | `32px` | Section heading → carousel |
| `--cs-control-h` | `56px` | Select and ADD height (must match exactly) |
| `--cs-media-w` | `100px` | Image column width |
| `--cs-card-w` | `clamp(300px, 78%, 420px)` | Card width; yields ~1.5 visible |
| `--cs-border-w` | `1px` | Resting border |
| `--cs-border-w-strong` | `2px` | Focus / active border |

**Critical:** the 2px active border must not shift layout. Use `box-shadow: inset 0 0 0 2px` or a transparent 2px resting border, never a border-width change.

---

## 6 · Component specs

### Section header
Mono, uppercase, tracked, `--cs-ink`, left-aligned. Arrows pinned right on the same baseline row.

### Carousel arrows
- Icon: thin-stroke arrow, `stroke-width: 1.5`, `20px` box, `currentColor`.
- Hit area: **44 × 44px** minimum (touch target), transparent background, no border, no circle.
- Gap between the two: `8px`.
- States: enabled `--cs-ink` · disabled `--cs-arrow-idle` + `pointer-events: none` + `aria-disabled="true"`.
- Hidden below 750px — swipe carries it there.

### Card
`--cs-surface`, radius 0, no border, no shadow. CSS grid: `grid-template-columns: var(--cs-media-w) 1fr`, items centred vertically.

### Product image
`aspect-ratio: 1 / 1`, `object-fit: contain`, sits on the card surface with no wrapper background. `loading="lazy"`, `srcset` at 1x/2x of the rendered size, explicit `width`/`height` to prevent CLS.

### Select
White field on the grey card, 1px `--cs-border`, `--cs-control-h`, mono uppercase label, custom chevron (16px, inline SVG as `background-image`, `appearance: none`), padding `0 40px 0 16px`.

### ADD button
`--cs-control-h`, `min-width: 72px`, `padding: 0 16px`, mono uppercase label, radius 0.

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
| **≥990px** | Card `400px`, horizontal layout, ~1.5 cards visible, arrows shown |
| **750–989px** | Card `clamp(300px, 78%, 400px)`, same layout, arrows shown |
| **<750px** | Card `min(86vw, 340px)` → ~1.15 cards visible (peek preserved), image column `84px`, control height `48px`, arrows hidden, swipe only |

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
  --cs-border:          #e3e3e3;
  --cs-border-strong:   #111111;
  --cs-arrow-idle:      #9e9e9e;

  /* Type */
  --cs-font-mono:  ui-monospace, "SF Mono", "Roboto Mono", "IBM Plex Mono", Menlo, monospace;
  --cs-font-body:  var(--font-body-family, "Inter", -apple-system, "Segoe UI", Helvetica, Arial, sans-serif);
  --cs-fs-heading: 18px;
  --cs-fs-title:   16px;
  --cs-fs-price:   14px;
  --cs-fs-label:   12px;
  --cs-track-wide: 0.10em;
  --cs-track-label:0.08em;

  /* Space & geometry */
  --cs-radius:         0;
  --cs-card-w:         clamp(300px, 78%, 420px);
  --cs-media-w:        100px;
  --cs-control-h:      56px;
  --cs-gap-card:       10px;
  --cs-pad-card:       16px;
  --cs-gap-media:      16px;
  --cs-gap-stack:      12px;
  --cs-gap-controls:   10px;
  --cs-space-header:   32px;
  --cs-border-w:       1px;
  --cs-border-w-strong:2px;

  /* Motion */
  --cs-dur:      160ms;
  --cs-dur-slow: 320ms;
  --cs-ease:     cubic-bezier(0.4, 0, 0.2, 1);
}

@media screen and (max-width: 749px) {
  .cross-sell {
    --cs-card-w:    min(86vw, 340px);
    --cs-media-w:   84px;
    --cs-control-h: 48px;
    --cs-pad-card:  12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cross-sell { --cs-dur: 0ms; --cs-dur-slow: 0ms; }
}
```

---

## 11 · Open questions for the client

1. Is the widget **column-width** (~600px, inside the product info column) or **full content width**? Everything scales from that one answer.
2. What is the **enabled** state of the `ADD` button? (Assumption: solid black fill, white label.)
3. Which **brand fonts** are licensed for web? The mono is doing a lot of work here — a generic fallback loses most of the character.
4. Product images appear on a transparent/matching background. Is the full cross-sell catalogue shot that way, or do we need a neutral tile fallback for inconsistent imagery?
5. Should the `SIZE` label be literal, or the product's real option name (Size / Colour / Length)? Building it dynamic is safer; the comp only shows one case.
