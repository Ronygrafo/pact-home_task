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

It doesn't bundle, discount, or automate. It shows what the store team chose, in the order they chose it, and gets out of the way — there is no algorithmic recommendation fallback; an empty assignment means nothing renders.

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
| `templates/product.json` | Merchant configuration — positions the block as the sibling directly after Buy buttons. Not a Horizon source file; changed by the theme editor, not by hand. |

**No Horizon source file is modified.** The only edits to pre-existing source files are additive keys in the two locale files. `templates/product.json` also changes, but as merchant configuration, not theme code — see the plan's Files section for why that distinction matters. If a change to a base theme file ever becomes unavoidable, it must be raised explicitly — "zero Horizon source files modified" is a deliberate upgrade-safety claim in the deliverable write-up.

### Data source

Product metafield `custom.cross_sell_products`, type `list.product_reference`, limit 8.

```liquid
{% assign companions = closest.product.metafields.custom.cross_sell_products.value %}
```

Read it through `closest.product`, never the global `product` — the block can be placed inside contexts where they differ. Assignment is manual-only — **mandatory decision, no algorithmic fallback**: when the list is empty, the block renders nothing. Manual curation is also the only option that doesn't quietly reintroduce an app dependency: automatic complementary recommendations require the **Search & Discovery** app, per the theme's own schema copy (`content.complementary_products` in `locales/en.default.schema.json`) — a fallback that reached for those would contradict the brief's manual-curation requirement and add a dependency the write-up can't demonstrate.

The block must never output an empty container. The one exception is `request.design_mode`: inside the theme editor, an empty metafield still renders a minimal placeholder, because a block with no DOM at all can't be selected or dragged onto the page. On the live storefront this doesn't apply — output stays zero.

### Rendering contract

Cards are server-rendered in Liquid. There is no client-side product fetch, and no Storefront API call. Everything a card needs is available when Liquid runs.

- Root element carries `{{ block.shopify_attributes }}` or the theme editor cannot target the block.
- Images: explicit `width`/`height`, `srcset` at 1x/2x of rendered size, `loading="lazy"`, `object-fit: contain` directly on the card surface (no inner tile).
- The option selector uses the product's **real first option name**, not a hardcoded "Size" — see *Variant handling* below for the full decision tree.
- Single-variant products render no selector and an immediately enabled ADD.
- Titles clamp to two lines so card heights never diverge.
- Each card's root is a `<product-card data-no-navigation>` wrapper — see *JavaScript contract* for why this specific element is mandatory rather than a generic `<div>`.

### Block settings

| id | Type | Default |
|---|---|---|
| `heading` | text | `Pairs with` |
| `products_per_view` | range (1–2, step 0.25) | 1.25 |
| `show_price` | checkbox | true |
| `max_products` | range 2–8 | 8 |

Settings that affect layout must resolve to CSS custom properties with clamped ranges, never to raw values that could break the grid.

### JavaScript contract

Cards don't post to the cart themselves. Each one renders the theme's own `<product-form-component>`, following the exact pattern in `snippets/quick-add.liquid:104-126` — the same hidden `id`/`quantity` inputs, the same `{% form 'product' %}`, the same `add-to-cart-button` render. Reusing that markup means the optimistic `CartLinesUpdateEvent`, the 422 error handling, the live region, the `data-added` state, the fly-to-cart animation and the cart drawer's auto-open all come from `assets/product-form.js` for free — none of it is reimplemented here.

- `properties[_source] = pdp-cross-sell` is a plain `<input type="hidden">` inside the `{% form 'product' %}`. It reaches the server purely because it's part of `new FormData(form)` (`assets/product-form.js:420`) — no JS reads or writes it.
- `assets/cross-sell.js` defines `<cross-sell-component>` and owns exactly two things: the carousel arrows' disabled state at each scroll end, and keeping each card's variant `<select>` in sync with its hidden `input[name="id"]` and its ADD button's disabled state. **It makes no fetch call and dispatches no cart event of its own.**
- Each card's root is a `<product-card data-no-navigation>`. This is the least obvious decision in the widget, so it's worth spelling out: `assets/product-form.js:236` has every `<product-form-component>` listen for the `productSelect` event on `this.closest('.shopify-section, dialog, product-card')`. When that event fires, `#onProductSelect` (`:774-785`) sets `#variantChangeInProgress = true` *before* the guard that would otherwise bail out on a mismatched `productId` (`:796-798`) — and separately, `#getVariantPicker()` (`:1096-1107`) walks up to the nearest `product-card` / `dialog` / `.shopify-section` and, if that container holds exactly one `variant-picker`, returns it without checking whose product it belongs to. Without a `product-card` boundary around each card, a shopper who changes the main product's size and then clicks ADD inside a cross-sell card — inside that same window — would resolve the *main* product's variant picker instead of the card's own, and the queue-drain path (`#processBatchAddToCart`) POSTs a bare `{ items, sections }` JSON body with no `properties` at all, so `_source` would silently vanish too. Wrapping each card in `<product-card>` makes `closest(...)` resolve to the card itself and `#getVariantPicker()` return `null` — this is the same `product-card > product-form-component` nesting the theme already uses on collection grids, not a new pattern. The contract that makes it safe to rely on: `ProductCard.requiredRefs = ['productCardLink']` (`assets/product-card.js:108`), which throws if that ref isn't an `<a>` (`:195-196`) — so every card needs a real link even though it should never navigate — and `data-no-navigation` (`assets/product-card.js:559`) is what suppresses the click-to-navigate behaviour on the empty space around the card.

Loading: the block emits its own `<script type="module">` pointing at `assets/cross-sell.js`. The page-level importmap in `snippets/scripts.liquid` is global, so `@theme/*` aliases resolve without editing that file.

Button state machine (per card, via the theme's own `add-to-cart-component`): `disabled` (no option chosen) → `enabled` → `loading` (`aria-busy="true"`, width locked) → `added` (label swaps for 1.8s) → `enabled`. Errors (422, sold out) surface inline and never fail silently — inherited from the theme's cart pipeline, not rebuilt here.

Arrows are progressive enhancement only: the carousel scrolls with CSS alone. JS toggles their disabled state at each end.

### Variant handling

Each card resolves to one of four modes, decided per companion product at render time:

| Mode | Condition | Behaviour |
|---|---|---|
| `none` | Single variant | No selector. ADD is enabled immediately. |
| `option` | Exactly 1 option | A `<select>` built from `product.options_with_values.first.values`. |
| `variant` | 2 options and ≤12 variants | A `<select>` built from `product.variants`, labelled with `variant.title` — Shopify already returns that joined and localized, so there's no manual string-building. |
| `link` | More than 2 options, more than 12 variants, or the product uses selling plans | No form at all — a "Choose" link to the product page instead. |

The cut-off is deliberate: a single control fits inside a ~294px card without crowding the ADD button (see [../design-tokens.md](../design-tokens.md)); a second control wouldn't. Falling back to a plain link past that point mirrors the theme's own judgment call in `snippets/quick-add.liquid:31-56`, which makes the same trade for the same reason on product cards.

### Styling

Block-scoped CSS lives in a `{% stylesheet %}` tag inside `blocks/cross-sell.liquid` — the Horizon convention, used by 52 of its 95 blocks. Do not add a separate stylesheet asset.

Token values come from [../design-tokens.md](../design-tokens.md), which is the visual source of truth. Non-negotiables from that spec: zero border radius everywhere, monospace for UI text (heading, option label, ADD) and the theme body face for content text, monochrome only, and the 2px active border implemented as an inset box-shadow so it never shifts layout.

Motion is transition on `color` / `background-color` / `box-shadow` only, wrapped in `prefers-reduced-motion`.

### Translations

Every visible string resolves through `| t`. Schema labels use `t:` keys.

No new storefront-facing keys are needed — the widget reuses keys the theme already ships: `actions.add`, `actions.choose`, `products.product.sold_out`, `content.unavailable`, `content.variant`, `accessibility.slideshow_previous`, `accessibility.slideshow_next`. The only additions are 5 schema keys in `locales/en.default.schema.json`: `names.cross_sell`, `settings.cards_per_view`, `settings.show_price`, `content.cross_sell_source`, `text_defaults.pairs_with`.

Both locale files begin with an auto-generated banner comment and are JSONC, not strict JSON — append keys, never restructure, and never reformat the file.

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
