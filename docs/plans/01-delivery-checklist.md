# Delivery Checklist — "Pairs With" Cross-Sell Widget

**Role:** Senior Shopify Developer · Pact Studio
**Client profile:** Shopify Plus DTC lifestyle brand
**Deadline:** 3 business days from receipt
**Goal:** Replace a paid cross-sell app with a custom, theme-native section that is faster, consistent, and demo-ready.

> **Status — widget built and QA'd in a browser.** The "Pairs With" block (`blocks/rr-cross-sell.liquid`, `snippets/rr-cross-sell-card.liquid`, `assets/rr-cross-sell.js`, `assets/rr-cross-sell.css`) is implemented and wired into `templates/product.json` as the last block in `_product-details`, right after `buy_buttons_eYQEYi`. `shopify theme check` runs clean — 348 files, 0 offenses. **The manual QA pass ran on 2026-08-06 and the matrix is green — every section run, zero failures:** R1–R4 all confirmed, including the isolation test (the `<product-card>` wrapper does contain the `productSelect` chain), the cart drawer round trip, the keyboard pass, all five responsive viewports, reduced motion, no-JS degradation, cross-browser, and Lighthouse-vs-base. **Every branch of the variant decision tree has executed**, including `link` mode, closed by seeding a 3-option companion. Two items stay open as known gaps, neither a defect and neither a widget code path: the screen-reader announcement (no AT available) and the cart-error path (inherited from the theme, needs a stock race). What's left is the three deliverables below. Architecture decisions and their rationale live in [cross-sell-widget.md](cross-sell-widget.md).

---

## 0 · Before writing any code (Day 0 — same day) ✅

- [x] Re-read the brief and mark every ambiguity.
- [x] **Send the clarifying questions** — the brief explicitly says *"if anything's unclear, just ask before you start."* Not asking is a silent negative signal. (Question list in [../private/02-strategic-recommendations.md](../private/02-strategic-recommendations.md).)
- [x] Create the Shopify Partner **development store**. → `rr-pact-home-task.myshopify.com`
- [x] Install a clean base theme (Dawn or Horizon) and confirm which one you'll claim compatibility with. → **Horizon 4.1.3**, theme id `158575362200`.
- [x] Seed realistic demo data: 1 hero product + 4–6 cross-sell products (socks, accessories) with variants, images, and at least one sold-out variant.
- [x] Create the **GitHub repo** (public or shared-access) and push the untouched base theme as the first commit — the diff becomes your portfolio. → `836d585` is the baseline; `git diff 836d585..HEAD` shows only hand-written work.

---

## 1 · Hard requirements (these are what get graded)

| # | Requirement | Done |
|---|---|---|
| R1 | The store team can **manually choose** which products appear for each product | [x] |
| R2 | Widget renders on the product page **directly below the Add to Cart button** | [x] |
| R3 | Shoppers can **add to cart from inside the widget** | [x] |
| R4 | Visual output **matches the reference design** as closely as possible | [x] |

> R4 signed off on 2026-08-06. The side-by-side against [../design-mockup.png](../design-mockup.png) at 1440px passed (§C of the QA checklist), along with the rest of the visual section: ~1.5 cards visible, zero border radius throughout, the image on the bare grey surface, no width shift on select focus, and the two-line title holding alignment.

---

## 2 · Build scope

### 2.1 Data layer — how products get assigned (R1) ✅
- [x] Create a product **metafield definition**: `custom.cross_sell_products`, type **Product list** (`list.product_reference`), limit ~6–8.
- [x] Merchant flow = open a product in Admin → scroll to the metafield → pick products → save. No code, no app.
- [x] Export the metafield definition steps into the repo README (screenshots or a numbered list).
- [x] Manual-only, per the brief — no fallback layer. If the metafield list is empty, the section renders nothing.

### 2.2 Placement (R2)
> Updated for Horizon: this theme has **no `main-product.liquid`**. The PDP is `sections/product-information.liquid`, which renders `{% content_for 'blocks' %}` and accepts `@theme`, so a public theme block can be positioned anywhere in the product column from the editor — with zero base **source** files modified.

- [x] Implement as a **public theme block** (`blocks/rr-cross-sell.liquid`), placeable as the next sibling of `buy-buttons` inside the product details group.
- [x] Ship a `templates/product.json` preset with the block already positioned below Add to Cart — `cross_sell_mwTMrk` is the last entry in `_product-details`'s `block_order`, right after `buy_buttons_eYQEYi`.
- [x] Document the exact theme files touched — zero Horizon **source** files touched, beyond additive schema-locale keys. `templates/product.json` also changed, but that's merchant configuration written by the theme editor, not theme code — it doesn't count against the "zero source files" claim.

### 2.3 Markup & rendering
- [x] `snippets/rr-cross-sell-card.liquid` — one product card.
- [x] Server-rendered in Liquid. **No client-side product fetch** — the data is already on the page.
- [x] Read the assignment through `closest.product`, not the global `product`.
- [x] Card contents, per the design: product image · title · price · option selector · ADD button.
- [x] Variant selector driven by the product's **real option name**, not a hardcoded "Size".
- [x] Single-variant products: hide the selector, enable ADD immediately.
- [x] Sold-out variants: disabled `<option>` with an "— Unavailable" suffix (`content.unavailable`, a key the theme already ships).
- [x] Line-clamp long titles (2 lines) so cards never break alignment.
- [x] Compare-at price support (strikethrough) if the theme uses it — via `{% render 'price' %}`, the theme's own snippet.

### 2.4 Carousel
- [x] CSS **scroll-snap** + `overflow-x: auto`. Zero third-party libraries.
- [x] Prev/Next arrows, top-right, matching the design.
- [x] Arrow **disabled state** when at either end (the reference shows the left arrow greyed out) — via `aria-disabled`, updated by `assets/rr-cross-sell.js`.
- [x] Works with touch swipe, trackpad, keyboard (Tab/Arrow keys), and with JS disabled (still scrollable) — the scroller itself is plain CSS scroll-snap; arrows are progressive enhancement only.
- [x] Hide scrollbar visually but keep it accessible — `scrollbar-width: none` + the scroller keeps `tabindex="0"` and an `aria-label`.

### 2.5 Add to cart (R3)
> Updated for Horizon: cards don't POST to the cart themselves. Each one renders the theme's own `<product-form-component>` / `{% form 'product' %}`, the same pattern `snippets/quick-add.liquid` uses — no second cart path hand-rolled here.

- [x] Each card submits through `<product-form-component>` — verified server-side: 7/7 companion cards on `rr-trainer-low` render exactly one, with `properties[_source] = pdp-cross-sell` present in the form.
- [x] Button **state machine**: `disabled` (no option chosen) → `enabled` → `loading` → `added` → back to `enabled` — wired via the theme's own `add-to-cart-component`, plus this widget's own `.add-to-cart-text--added` bridge (see the JavaScript contract in [cross-sell-widget.md](cross-sell-widget.md)). Disabled/enabled states verified per variant mode (`none`, `option`, sold-out).
- [x] Error handling: 422 / sold out → inline message, never a silent failure — inherited from `assets/product-form.js`, not rebuilt here.
- [x] Refresh the theme's cart UI by dispatching the cart events from `@shopify/events`, so the drawer and cart bubble re-render through the theme's own pipeline. One round trip, no full reload — confirmed in a browser: the drawer opens and the bubble count increments with no page reload, and the line item carries `_source` in `/cart.js`.
- [x] Add a line item property `_source: pdp-cross-sell` so the client can attribute revenue to the widget — confirmed present on all 7 cards.

### 2.6 Design fidelity (R4)
- [x] Implement against the token sheet in [../design-tokens.md](../design-tokens.md).
- [x] All interaction states built: default · hover · focus-visible · active · disabled · loading · success.
- [x] Mobile layout designed deliberately (no mobile comp was given — see recommendations) — token scale steps down at 1199px and 749px; arrows hide below 749px. Verified at 1920/1440, 1200, 768 and 375, plus the theme-editor case where `products_per_view: 2` narrows the card enough for the controls row to stack.
- [x] Zero layout shift: reserve image aspect ratio; card height sizes to content (no forced uniform height across a row).

> Held up against [../design-mockup.png](../design-mockup.png) side by side at 1440px on 2026-08-06 — passed. That was the open item behind R4, which is now checked.

### 2.7 Quality gates
- [x] **Performance:** no external JS/CSS ✓ · CSS in its own scoped asset, `assets/rr-cross-sell.css`, loaded via `asset_url | stylesheet_tag` ✓ (see [cross-sell-widget.md](../features/cross-sell-widget.md) *Styling* for why this departs from Horizon's `{% stylesheet %}` convention) · JS shipped as an ES module, no framework ✓ · `loading="lazy"` + `srcset`/`sizes` on card images ✓ · **Lighthouse on the published PDP shows no regression against the same page without the block** ✓ — 95 → 96 Performance, 96 → 97 Accessibility, 77 → 77 Best Practices, i.e. parity within run variance (screenshots in `docs/images/`). Remaining caveat, not a blocker: `assets/rr-cross-sell.js` measures **~8.4 KB** raw, over the ~3 KB target set in this plan (most of it is the inline rationale comments documented throughout the file), and hasn't been measured minified/gzipped.
- [x] **Accessibility (WCAG 2.1 AA):** labelled select, `aria-label` on arrows, `aria-live` region announcing "Added to cart", visible focus rings. The keyboard-only walkthrough passed — Tab reaches the arrows, the scroller, the select and ADD with visible focus rings, and an arrow at its end stays focusable (`aria-disabled`, not `disabled`). Open gap: the live region is code-verified (7/7 cards) but has never been heard through a real screen reader.
- [x] **i18n:** every visible string through `| t` with keys in `locales/*.json`. No hardcoded copy — 5 new schema keys, translated across all 20 locale files (`en` + 19 others); no new storefront-facing keys needed.
- [x] **Merchant settings** in the schema: heading text, products-per-view, show/hide price — plus `max_products`, not originally scoped.
- [x] `shopify theme check` passes clean — 348 files, 0 offenses.
- [x] Cross-browser: Chrome, Safari, Firefox, iOS Safari.

---

## 3 · Deliverable A — Technical write-up

- [ ] 1–2 pages, in the repo as `README.md` (or a linked doc).
- [ ] Which Shopify features and **why**: metafields, theme blocks, Cart AJAX API, the theme's cart event pipeline, theme editor settings.
- [ ] Performance reasoning. Not quantified vs. the app being replaced — it isn't installed here, so there's no honest before-and-after. What's measured instead: the same published page with and without the block (95 → 96 Performance), plus the architectural argument (zero external requests, zero runtime fetch).
- [ ] Trade-offs and what you intentionally did *not* build.
- [ ] What you'd do next with more time.

## 4 · Deliverable B — Working prototype

- [x] **GitHub repo**, clean commit history, readable messages. → [Ronygrafo/pact-home_task](https://github.com/Ronygrafo/pact-home_task)
- [x] `README.md` with: what it is, install steps, metafield setup, theme editor setup, settings reference. → written; **three placeholders still to fill** (live preview URL, storefront password, backup link) and the two admin screenshots need retaking in an English admin.
- [ ] **Live demo link** — development store preview URL (include the storefront password if required).
- [ ] Backup link in case the store preview expires (static sandbox or hosted video walkthrough).
- [ ] Verify both links from an incognito window before submitting.

## 5 · Deliverable C — Client-facing Loom

- [ ] Target length: **4–6 minutes**. Scripted, not improvised.
- [ ] Structure: the problem → the approach in plain language → **live demo of assigning products in Admin** → shopper adds to cart → performance note → what's next.
- [ ] Client tone, not engineer tone. Benefits before implementation.
- [ ] Show it working on mobile too.
- [ ] Check audio and that the screen is legible at 720p.

## 6 · Submission

- [ ] Post links in the **"Submit your work"** tab.
- [ ] Include: repo · live demo · Loom · write-up.
- [ ] Aim to submit end of **Day 2**, leaving Day 3 as buffer.

---

## 7 · Definition of Done — QA matrix

- [x] **QA matrix green.** Full checklist lives in [02-qa-checklist.md](02-qa-checklist.md), so this plan doesn't duplicate it. **Manual pass run 2026-08-06 — every section run, zero failures:** A (blocking, isolation test included), B1–B8, C (visual), D1–D2 and D4 (keyboard, reduced motion), E1–E5 (responsive), F1–F3 (all four variant modes, `link` included), G1–G3 (cross-browser, no-JS, Lighthouse).
>
> Two known gaps remain, neither a defect and neither a code path in this widget: **D3** screen-reader announcement (no AT available; markup contract code-verified 7/7) and **B9** cart-error path (inherited from `assets/product-form.js`, needs a stock race to trigger). Both are about verifying inherited behaviour — every branch of the widget's own logic has now executed.

---

## Suggested timeline

| Day | Focus |
|---|---|
| **Day 1** | ~~Questions sent · dev store + repo · demo data · metafield definition · Liquid markup and card structure · static design match~~ ✅ |
| **Day 2** | ~~Carousel + JS add-to-cart + states + responsive + a11y pass~~ ✅ — code-complete, `shopify theme check` clean, ~~browser QA pass~~ ✅ QA matrix green. **Still open:** the write-up and the README |
| **Day 3** | README · technical write-up · Loom recording · final QA from incognito · submit |
