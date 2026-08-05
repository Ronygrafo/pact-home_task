# Plan — Cross-sell widget ("Pairs With")

| | |
|---|---|
| **Status** | Approved, not yet implemented |
| **Theme** | Horizon 4.1.3 (`158575362200`) on `rr-pact-home-task.myshopify.com` |
| **Feature doc** | [../features/cross-sell-widget.md](../features/cross-sell-widget.md) |
| **Visual spec** | [../design-tokens.md](../design-tokens.md) |

---

## 1. Goal

Replace a paid cross-sell app on the product page with a theme-native widget that loads faster, behaves predictably, and lets the store team curate recommendations themselves. The client's stated pain is page weight and inconsistency — so "it works" is not the bar; "it is measurably lighter and never looks broken" is.

## 2. Requirements → implementation

| # | Requirement | How it is met |
|---|---|---|
| **R1** | Store team manually chooses which products appear, per product | Product metafield `custom.cross_sell_products` of type `list.product_reference`, edited on the Admin product page |
| **R2** | Renders on the product page directly below the Add to Cart button | Public theme block dropped as the next sibling of `buy-buttons` inside `product-information` |
| **R3** | Shoppers add to cart from inside the widget | Custom element posting to `Theme.routes.cart_add_url`, reusing the theme's own cart event pipeline |
| **R4** | Matches the reference design | Built against the token sheet in [../design-tokens.md](../design-tokens.md) |

## 3. Architecture decisions

### 3.1 Assignment lives in a product metafield

`custom.cross_sell_products` · `list.product_reference` · limit 8.

The merchandiser opens a product in Admin, scrolls to the metafield, picks products, saves. No app, no code, no copying IDs into theme settings, no JSON blobs. It is the only assignment model that puts the control where the person already works, and it survives theme changes because the data lives on the product, not in the theme.

*Rejected:* a block setting with comma-separated handles (unusable at scale, silently breaks on rename), a collection per product (pollutes the catalog), a metaobject (needless indirection for a flat list).

**Mandatory decision:** assignment is manual-only, per the brief. No algorithmic fallback (`product_recommendations`, a merchant-selected collection, or any other automated substitute). If the metafield list is empty, the block renders nothing.

### 3.2 Placement is a theme block, not a section edit

Horizon has no `main-product.liquid`. The PDP is `sections/product-information.liquid`, which renders `{% content_for 'blocks' %}` and declares `@theme` in its schema — so any public theme block can be positioned anywhere in the product column from the theme editor.

Consequence: **no base theme file is modified.** The merchant drags the block below Add to Cart; if they later want it above the description instead, that is a drag, not a deploy. This is also the upgrade-safety argument for the write-up — a Horizon update cannot conflict with files we never touched.

The block reads its context from `closest.product` and emits `{{ block.shopify_attributes }}` so the theme editor can target it.

### 3.3 Cards are server-rendered Liquid

All data needed is already on the page when Liquid runs. Rendering server-side means no fetch waterfall, no flash of empty content, no layout shift, and the widget still displays with JS disabled (only the ADD button needs JS).

*Rejected:* Storefront API / `product_recommendations` fetch on the client — that is the pattern the app being replaced uses, and it is the reason the page is slow.

### 3.4 Carousel is CSS scroll-snap

`overflow-x: auto` + `scroll-snap-type: x mandatory`, roughly 40 lines of CSS, zero KB of library. Native momentum on touch, works without JS, keyboard-scrollable. JS only enhances: enabling/disabling the arrows at each end.

### 3.5 Add to cart reuses the theme's cart pipeline

Follow the contract in `assets/product-form.js` rather than inventing a parallel one: POST to `Theme.routes.cart_add_url` with `fetchConfig` from `@theme/utilities`, then dispatch the cart events from `@shopify/events` so the drawer and the cart bubble refresh through the theme's existing machinery. One round trip, no page reload, no second source of truth for cart state.

Every add carries a line item property `_source: pdp-cross-sell`. The underscore hides it from the shopper but keeps it on the order forever, so the client can attribute revenue to the widget without any extra tooling — the question they will ask once the app that reported those numbers is gone.

## 4. Files

All new. The only edits to existing files are additive translation keys.

| Path | Purpose |
|---|---|
| `blocks/cross-sell.liquid` | Public theme block: schema, heading, arrows, carousel container, scoped `{% stylesheet %}` |
| `snippets/cross-sell-card.liquid` | One product card: media, title, price, option selector, ADD button |
| `assets/cross-sell.js` | `<cross-sell-component>` — arrow state, add-to-cart, live region |
| `locales/en.default.json` | Storefront strings (reuse existing keys where they already exist) |
| `locales/en.default.schema.json` | Theme editor labels under `names` / `settings` / `content` |

Both locale files carry an "auto-generated" banner and are JSONC, not strict JSON. Add keys, never restructure.

## 5. Merchant setup

1. **Settings → Custom data → Products → Add definition**
   Name `Cross-sell products` · namespace and key `custom.cross_sell_products` · type **Product** · **list of values**, limit 8.
2. Open a product → *Metafields* → pick the companion products → Save.
3. **Theme editor → Product template** → add block **Cross-sell** inside the product details group, drag it directly below *Buy buttons*.
4. Optionally rename the heading (default: `Pairs with`) and set how many cards are visible.

Steps 1 and 3 go in the README with screenshots, and are the moment to demo in the Loom.

## 6. Block settings

| Setting | Type | Default | Notes |
|---|---|---|---|
| `heading` | text | `Pairs with` | Merchant-editable; never hardcode "PAIRS WITH" |
| `products_per_view` | range | 1.5 | Controls card width via a CSS custom property |
| `show_price` | checkbox | true | |
| `max_products` | range 2–8 | 8 | |

No setting may be able to break the layout. Anything that could is a CSS custom property with a clamp, not a free value.

## 7. Build phases

| Phase | Output | Done when |
|---|---|---|
| **0 · Store prep** | Metafield definition, demo catalog (1 hero + 6 companions, one single-variant, one sold-out variant, one no-image, one very long title) | A product page has real assignments to render |
| **1 · Structure** | Block + card snippet, server-rendered, unstyled | Cards appear below Add to Cart with correct data |
| **2 · Design** | Token sheet applied, all resting states | Side-by-side with the reference is convincing |
| **3 · Carousel** | Scroll-snap, arrows, disabled ends, peek | Works on touch, trackpad, keyboard |
| **4 · Cart** | `<cross-sell-component>`, button state machine, `_source` property | Add updates the drawer with no reload; errors surface inline |
| **5 · Hardening** | Responsive, a11y pass, edge cases, `shopify theme check` | QA matrix green end to end |
| **6 · Deliverables** | README write-up, live demo link, Loom | Links verified from an incognito window |

## 8. Edge cases (must all be handled before the Loom)

- No products assigned → section renders nothing at all. Never an empty container.
- One product assigned → no arrows, no broken carousel.
- Eight products → arrows toggle correctly at both ends.
- Single-variant companion → no selector, ADD enabled immediately.
- Fully sold-out companion → ADD disabled with a stated reason.
- One variant sold out among several → only that option disabled.
- No image → placeholder, layout intact.
- Very long title → clamped to two lines, cards stay aligned.
- Same product added twice → quantity increments.
- Selector shows the product's **real option name**, not a hardcoded "SIZE".
- Compare-at price → strikethrough.
- The 2px active border must not shift layout (inset box-shadow or transparent resting border).

## 9. Out of scope

Deliberately not built, and stated as such in the write-up: bundle pricing or discount logic, "frequently bought together" automation, an embedded admin app, personalization or A/B testing, cross-sell on any template other than the product page. Building past the brief reads as poor prioritisation, not enthusiasm.

## 10. Open questions

Carried from the design analysis; answers get logged in the write-up as stated assumptions.

1. Is the widget column-width (~600px) or full content width? Every dimension scales from this.
2. What is the **enabled** state of the ADD button? Assumption: solid black fill, white label.
3. Which brand fonts are licensed for web? The monospace carries most of the character.
4. Is the whole companion catalog shot on transparent/matching backgrounds, or is a neutral tile fallback needed?
5. After adding, should the cart drawer open or should the shopper stay on the PDP with a subtle confirmation? Recommendation: stay — opening the drawer interrupts the primary purchase.
6. Should attribution feed GA4 / a CDP in addition to the line item property?
