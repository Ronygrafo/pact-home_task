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
| **R3** | Shoppers add to cart from inside the widget | Each card renders the theme's own `<product-form-component>`, wrapped in `<product-card>` so its event listeners resolve to the right product (§3.5) |
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

*Rejected:* reusing `snippets/slideshow.liquid` / `<slideshow-component>`. It was seriously considered — it already solves scroll-snap and already disables its arrows at each end natively (`assets/slideshow.js:431-432`), so it isn't dismissed lightly. Its markup carries dots, autoplay and a thumbnail rail this widget doesn't want, and reaching the reference's monochrome, zero-radius look would mean overriding most of its CSS anyway. At that point a purpose-built ~40 lines is less code to maintain, not more.

### 3.5 Add to cart reuses the theme's own form component

Each card renders the theme's own `<product-form-component>`, copying the pattern already used in `snippets/quick-add.liquid:104-126` — the same hidden `id`/`quantity` inputs inside a `{% form 'product' %}`, the same `add-to-cart-button` render. That single choice pulls in the whole cart pipeline for free: the optimistic `CartLinesUpdateEvent`, 422 error handling, the live region, the `data-added` state, fly-to-cart, and the cart drawer's auto-open, all from `assets/product-form.js` — none of it hand-rolled.

Every add carries a line item property `_source: pdp-cross-sell`, as a plain `<input type="hidden">` inside the form. It reaches the server because it rides along in `new FormData(form)` (`assets/product-form.js:420`) — no JS sets it explicitly. The underscore hides it from the shopper but keeps it on the order forever, so the client can attribute revenue to the widget without any extra tooling — the question they will ask once the app that reported those numbers is gone.

Each card's root is wrapped in `<product-card data-no-navigation>`. This isn't decorative: `assets/product-form.js:236` has every `<product-form-component>` subscribe to the `productSelect` event on `this.closest('.shopify-section, dialog, product-card')`, and `#getVariantPicker()` (`:1096-1107`) falls back to the single `variant-picker` inside that same container without checking which product it belongs to. Without a `product-card` boundary around each card, changing the main product's size and clicking a cross-sell card's ADD inside that same window could resolve the *main* product's variant picker instead of the card's own — see §9 Risks for the failure path this closes off. `<product-card>` requires a real `<a>` ref (`assets/product-card.js:108`, throws otherwise at `:195-196`); `data-no-navigation` (`:559`) is what stops the card from also acting as a click-to-navigate link on its empty space.

*Rejected:* a bespoke `fetch` to `Theme.routes.cart_add_url` from `assets/cross-sell.js` — the original approach in this plan, before the theme's event wiring was read closely. It would mean reimplementing error handling, the live region and the drawer refresh that `product-form-component` already provides, and it doesn't even sidestep the event-bubbling risk above: a hand-rolled listener on the same `.shopify-section` would hit the identical cross-talk problem, just without the theme's own guard rails.

## 4. Files

All new, with one exception. The only edit to an existing *source* file is additive keys in `locales/en.default.schema.json`.

| Path | Purpose |
|---|---|
| `blocks/cross-sell.liquid` | Public theme block: schema, heading, arrows, carousel container, scoped `{% stylesheet %}` |
| `snippets/cross-sell-card.liquid` | One product card: media, title, price, variant handling, `<product-form-component>` |
| `assets/cross-sell.js` | `<cross-sell-component>` — arrow state, variant-select ↔ hidden-input ↔ ADD sync, no fetch |
| `locales/en.default.schema.json` | Theme editor labels under `names` / `settings` / `content` / `text_defaults` |

`locales/en.default.json` — **no changes.** Every storefront string the widget needs (`actions.add`, `actions.choose`, `products.product.sold_out`, `content.unavailable`, `content.variant`, `accessibility.slideshow_previous`, `accessibility.slideshow_next`) already exists in the theme.

`templates/product.json` also changes, but it's merchant configuration — the block dragged into position — not theme code. That's why the write-up's claim is precisely **"zero Horizon source files modified,"** not "zero files touched": the merchant's own product-page layout is expected to change; the theme's source isn't.

`locales/en.default.schema.json` carries an "auto-generated" banner and is JSONC, not strict JSON. Add keys, never restructure.

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
| `products_per_view` | range (1–2, step 0.25) | 1.25 | Controls card width via a CSS custom property |
| `show_price` | checkbox | true | |
| `max_products` | range 2–8 | 8 | |

No setting may be able to break the layout. Anything that could is a CSS custom property with a clamp, not a free value.

## 7. Build phases

| Phase | Output | Done when |
|---|---|---|
| **0 · Docs aligned** | This plan, the feature doc and the design tokens reflect the closed architecture decisions | A reviewer reading the three docs finds no contradiction with the code that follows |
| **1 · Store prep** | Metafield definition, demo catalog (1 hero + 6 companions: one single-variant, one sold-out variant, one no-image, one very long title) | A product page has real assignments to render |
| **2 · Block structure** | `blocks/cross-sell.liquid` schema, heading, arrows shell, carousel container; locale keys added | Cards appear below Add to Cart with correct data, unstyled |
| **3 · Card snippet** | `snippets/cross-sell-card.liquid` — media, title, price, variant handling, `<product-form-component>` | Every variant mode renders correctly, including the `link` fallback |
| **4 · `cross-sell.js`** | `<cross-sell-component>` — arrow disabled-state, select ↔ hidden-input ↔ ADD sync | Changing the select enables ADD; no fetch code present |
| **5 · CSS** | Token sheet applied from `../design-tokens.md`, all resting and interaction states, responsive breakpoints | Side-by-side with the reference is convincing at 375 / 768 / 990 / 1440px |
| **6 · Hardening** | Edge cases (§8), a11y pass, bfcache/`pageshow` restoration | QA matrix green end to end |
| **7 · `shopify theme check`** | Clean run, no warnings introduced | Lint passes on the full diff |
| **8 · Position in `templates/product.json`** | Block dragged to the sibling slot after `buy-buttons` | Live on the PDP, confirmed against an incognito preview |

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
- Companion with more than 2 options or more than 12 variants → degrades to a "Choose" link instead of a broken multi-select layout (see *Variant handling* in the feature doc).
- The metafield can contain the current product itself → filtered out with `reject` before rendering.
- The metafield can contain the same product twice → each card's `form_id` includes the loop index, so the two forms never collide.
- Back/forward-cache restoration → the `<select>` restores its value from bfcache on `pageshow`, but the hidden `id` input and the ADD button's disabled state don't restore with it — they must be re-derived from the restored select value on that event, not assumed correct.
- With JavaScript disabled, no multivariant card can add to cart at all: the `<select>` has no `name` attribute until JS assigns one, and the hidden `id` input is born `disabled` — deliberately, since an un-derived variant id must never be submittable.

## 9. Risks

Found by reading the theme before writing any code, not by testing after the fact:

- **Cross-form contamination.** `assets/product-form.js:236` and `:1096-1107` mean any `<product-form-component>` sharing a `.shopify-section` can pick up another product's `productSelect` event, or fall back to another product's `variant-picker` it never meant to touch. Mitigated by wrapping every card in `<product-card>` (§3.5) — without it, a shopper who changes the main product's size and adds from a cross-sell card in that same window could add the wrong variant, and lose `_source` in the process.
- **The column is `sticky_details_desktop: true`** (`templates/product.json`), so the product-info column stays pinned while media scrolls. A tall widget pushes real content off the bottom of that pinned column — the whole reason the card is horizontal (~180px tall) rather than the theme's usual vertical product card.
- **The mobile sticky Add to Cart bar competes for the same space.** The widget must not create its own stacking context that could conflict with it, and needs `scroll-margin-block-end` so a focus jump or deep link doesn't land the widget underneath that bar.
- **`min-width: 0` is mandatory, not a nice-to-have** — see `../design-tokens.md` §6. Skip it anywhere between the block root and the scroll-snap track and the `overflow-x` scroller forces the whole PDP grid wider than its own column.
- **A known upstream quirk, used as an argument rather than just noted.** `assets/product-form.js:428-436` appends to `formData` for `sections` *inside* the `cartItemsComponents.forEach` loop rather than after it — harmless today with the theme's single cart-items-component, but exactly the kind of subtlety that argues against writing a second, parallel cart request in `assets/cross-sell.js`. Reusing `product-form-component` means this quirk — and any future fix to it — is inherited automatically instead of needing to be tracked and re-applied in a hand-rolled path.

## 10. Out of scope

Deliberately not built, and stated as such in the write-up: bundle pricing or discount logic, "frequently bought together" automation, an embedded admin app, personalization or A/B testing, cross-sell on any template other than the product page. Building past the brief reads as poor prioritisation, not enthusiasm.

## 11. Open questions

Carried from the design analysis; answers get logged in the write-up as stated assumptions.

1. What is the **enabled** state of the ADD button? Assumption: solid black fill, white label.
2. Which brand fonts are licensed for web? The monospace carries most of the character.
3. Is the whole companion catalog shot on transparent/matching backgrounds, or is a neutral tile fallback needed?
4. After adding, should the cart drawer open or should the shopper stay on the PDP with a subtle confirmation? Recommendation: stay — opening the drawer interrupts the primary purchase.
5. Should attribution feed GA4 / a CDP in addition to the line item property?
