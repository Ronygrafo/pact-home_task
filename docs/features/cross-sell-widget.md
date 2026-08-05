# Cross-sell widget — "Pairs With"

> **Status: in development.** Sections below are marked `Planned` until the corresponding code lands. Implementation plan: [../plans/cross-sell-widget.md](../plans/cross-sell-widget.md). Visual spec: [../design-tokens.md](../design-tokens.md).

---

## OVERVIEW

*Written for humans — merchants, stakeholders, and any developer meeting this feature for the first time.*

### What it is

![The cross-sell widget on the product page](../design-mockup.png)

A carousel of companion products that sits on the product page, right under the Add to Cart button. Each card shows the product's image, name, price, a size selector and an ADD button, so a shopper can add a matching item to their cart without ever leaving the page they're on.

### Why it exists

The store was running a paid cross-sell app that slowed the product page down and behaved inconsistently. This replaces it with code that belongs to the store: no monthly fee, no third-party scripts, no external requests, and nothing that can change under the client's feet when a vendor ships an update.

### How the store team uses it

Recommendations are chosen by hand, per product — not by an algorithm guessing.

1. Open a product in the Shopify admin.
2. Scroll to the **Cross-sell products** field.
3. Pick the products that pair with it, in the order they should appear.
4. Save.

That's the whole workflow. No code, no app, no separate dashboard. The widget on the storefront updates immediately.

Where the widget appears on the page — and its heading, how many cards are visible, whether prices show — is controlled in the theme editor by dragging the **Cross-sell** block, the same way any other part of the product page is arranged.

### What the shopper sees

The carousel shows roughly one and a half cards, so the cut-off edge signals there is more to scroll. They swipe on mobile, or use the arrows on desktop. Picking a size enables the ADD button; pressing it adds the item and the cart updates in place — no page reload, no interruption to what they were doing.

If a product has nothing assigned to it, the widget doesn't render at all. There is never an empty box on a live product page.

### What it deliberately doesn't do

It doesn't bundle, discount, or automate. It shows what the store team chose, in the order they chose it, and gets out of the way.

---

## Technical reference

*Written for agents and developers working on this code.*

### Status by area

| Area | State |
|---|---|
| Metafield definition | Planned |
| Block + card markup | Planned |
| Design tokens applied | Planned |
| Carousel behaviour | Planned |
| Add to cart | Planned |
| Translations | Planned |
| QA matrix | Planned |

### Files

| Path | Role |
|---|---|
| `blocks/cross-sell.liquid` | Public theme block. Schema, heading, arrows, carousel container, scoped `{% stylesheet %}`. |
| `snippets/cross-sell-card.liquid` | Renders one card. Receives a product object. |
| `assets/cross-sell.js` | `<cross-sell-component>` custom element. |
| `locales/en.default.json` | Storefront strings. |
| `locales/en.default.schema.json` | Theme editor labels. |

**No Horizon file is modified.** The only edits to pre-existing files are additive keys in the two locale files. If a change to a base theme file ever becomes unavoidable, it must be raised explicitly — "zero base files touched" is a deliberate upgrade-safety claim in the deliverable write-up.

### Data source

Product metafield `custom.cross_sell_products`, type `list.product_reference`, limit 8.

```liquid
{% assign companions = closest.product.metafields.custom.cross_sell_products.value %}
```

Read it through `closest.product`, never the global `product` — the block can be placed inside contexts where they differ. When the list is empty and the `enable_fallback` setting is on, fall back to complementary recommendations; otherwise render nothing. The block must never output an empty container.

### Rendering contract

Cards are server-rendered in Liquid. There is no client-side product fetch, and no Storefront API call. Everything a card needs is available when Liquid runs.

- Root element carries `{{ block.shopify_attributes }}` or the theme editor cannot target the block.
- Images: explicit `width`/`height`, `srcset` at 1x/2x of rendered size, `loading="lazy"`, `object-fit: contain` directly on the card surface (no inner tile).
- The option selector uses the product's **real first option name**, not a hardcoded "Size".
- Single-variant products render no selector and an immediately enabled ADD.
- Titles clamp to two lines so card heights never diverge.

### Block settings

| id | Type | Default |
|---|---|---|
| `heading` | text | `Pairs with` |
| `products_per_view` | range | 1.5 |
| `show_price` | checkbox | true |
| `enable_fallback` | checkbox | true |
| `max_products` | range 2–8 | 8 |

Settings that affect layout must resolve to CSS custom properties with clamped ranges, never to raw values that could break the grid.

### JavaScript contract

`<cross-sell-component>` extends `Component` from `@theme/component`. Child elements are declared with `ref` attributes and resolved into `this.refs`; required ones go in `requiredRefs`.

Loading: the block emits its own `<script type="module">` pointing at `assets/cross-sell.js`. The page-level importmap in `snippets/scripts.liquid` is global, so `@theme/*` aliases resolve without editing that file.

Add to cart follows the pattern already established in `assets/product-form.js` — read that file before changing anything here:

- POST to `Theme.routes.cart_add_url` using `fetchConfig('javascript', { body: formData })` from `@theme/utilities`.
- Include `properties[_source] = pdp-cross-sell` on every add. The leading underscore hides it from the shopper while keeping it on the order, which is how the client attributes revenue to this widget.
- Dispatch the cart events from `@shopify/events` so the drawer and cart bubble refresh through the theme's own pipeline. Do not build a second cart sync path and do not reload the page.
- Use `morph` from `@theme/morph` for in-place DOM updates.

Button state machine: `disabled` (no option chosen) → `enabled` → `loading` (`aria-busy="true"`, width locked) → `added` (label swaps for 1.8s) → `enabled`. Errors (422, sold out) surface inline and never fail silently.

Arrows are progressive enhancement only: the carousel scrolls with CSS alone. JS toggles their disabled state at each end.

### Styling

Block-scoped CSS lives in a `{% stylesheet %}` tag inside `blocks/cross-sell.liquid` — the Horizon convention, used by 52 of its 95 blocks. Do not add a separate stylesheet asset.

Token values come from [../design-tokens.md](../design-tokens.md), which is the visual source of truth. Non-negotiables from that spec: zero border radius everywhere, monospace for UI text (heading, option label, ADD) and the theme body face for content text, monochrome only, and the 2px active border implemented as an inset box-shadow so it never shifts layout.

Motion is transition on `color` / `background-color` / `box-shadow` only, wrapped in `prefers-reduced-motion`.

### Translations

Every visible string resolves through `| t`. Schema labels use `t:` keys.

Reuse existing Horizon keys where they already cover the string (`actions.*`, `products.*`, `accessibility.*`) and add only what is genuinely new. Both locale files begin with an auto-generated banner comment and are JSONC, not strict JSON — append keys, never restructure, and never reformat the file.

### Accessibility

Keyboard-operable end to end. Labelled selector, `aria-label` on arrows, `aria-disabled` when an arrow is at an end, visible focus rings, and an `aria-live` region announcing the add. The disabled ADD label sits around 2:1 contrast in the reference — disabled controls are exempt from WCAG 1.4.3, so reproducing it is defensible, but it is a stated decision, not an accident.

### Edge cases

Full list in [the plan](../plans/cross-sell-widget.md#8-edge-cases-must-all-be-handled-before-the-loom). The ones most likely to be broken by a careless change: empty metafield, single companion, fully sold-out companion, missing image, very long title, and the same product added twice.

### Verification

```bash
shopify theme check
shopify theme dev --store rr-pact-home-task.myshopify.com --theme 158575362200
```

Then walk the QA matrix in [../plans/01-delivery-checklist.md](../plans/01-delivery-checklist.md#7--definition-of-done--qa-matrix) before recording anything, including a keyboard-only pass and 375 / 768 / 1440 / 1920 widths.
