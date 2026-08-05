# Delivery Checklist — "Pairs With" Cross-Sell Widget

**Role:** Senior Shopify Developer · Pact Studio
**Client profile:** Shopify Plus DTC lifestyle brand
**Deadline:** 3 business days from receipt
**Goal:** Replace a paid cross-sell app with a custom, theme-native section that is faster, consistent, and demo-ready.

> **Status — Day 0 complete.** Development store `rr-pact-home-task.myshopify.com` is live on Horizon 4.1.3, the repo is published at [Ronygrafo/pact-home_task](https://github.com/Ronygrafo/pact-home_task) with the untouched base theme as its baseline commit, and the questions are with Pact. Next up is §2.1 — the metafield definition — then the block itself. Architecture decisions and their rationale live in [cross-sell-widget.md](cross-sell-widget.md).

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
| R1 | The store team can **manually choose** which products appear for each product | [ ] |
| R2 | Widget renders on the product page **directly below the Add to Cart button** | [ ] |
| R3 | Shoppers can **add to cart from inside the widget** | [ ] |
| R4 | Visual output **matches the reference design** as closely as possible | [ ] |

---

## 2 · Build scope

### 2.1 Data layer — how products get assigned (R1)
- [ ] Create a product **metafield definition**: `custom.cross_sell_products`, type **Product list** (`list.product_reference`), limit ~6–8.
- [ ] Merchant flow = open a product in Admin → scroll to the metafield → pick products → save. No code, no app.
- [ ] Export the metafield definition steps into the repo README (screenshots or a numbered list).
- [ ] Optional fallback layer (recommended): if the metafield is empty, fall back to Shopify's `product_recommendations` with `intent: complementary`, or a merchant-selected collection. **Never render an empty section.**

### 2.2 Placement (R2)
> Updated for Horizon: this theme has **no `main-product.liquid`**. The PDP is `sections/product-information.liquid`, which renders `{% content_for 'blocks' %}` and accepts `@theme`, so a public theme block can be positioned anywhere in the product column from the editor — with zero base files modified.

- [ ] Implement as a **public theme block** (`blocks/cross-sell.liquid`), placeable as the next sibling of `buy-buttons` inside the product details group.
- [ ] Ship a `templates/product.json` preset with the block already positioned below Add to Cart.
- [ ] Document the exact theme files touched — target is **none**, beyond additive locale keys.

### 2.3 Markup & rendering
- [ ] `snippets/cross-sell-card.liquid` — one product card.
- [ ] Server-rendered in Liquid. **No client-side product fetch** — the data is already on the page.
- [ ] Read the assignment through `closest.product`, not the global `product`.
- [ ] Card contents, per the design: product image · title · price · option selector · ADD button.
- [ ] Variant selector driven by the product's **real option name**, not a hardcoded "Size".
- [ ] Single-variant products: hide the selector, enable ADD immediately.
- [ ] Sold-out variants: disabled `<option>` with a "— Sold out" suffix.
- [ ] Line-clamp long titles (2 lines) so cards never break alignment.
- [ ] Compare-at price support (strikethrough) if the theme uses it.

### 2.4 Carousel
- [ ] CSS **scroll-snap** + `overflow-x: auto`. Zero third-party libraries.
- [ ] Prev/Next arrows, top-right, matching the design.
- [ ] Arrow **disabled state** when at either end (the reference shows the left arrow greyed out).
- [ ] Works with touch swipe, trackpad, keyboard (Tab/Arrow keys), and with JS disabled (still scrollable).
- [ ] Hide scrollbar visually but keep it accessible.

### 2.5 Add to cart (R3)
> Updated for Horizon: follow the contract already in `assets/product-form.js` instead of hand-rolling a second cart path.

- [ ] POST to `Theme.routes.cart_add_url` with the selected variant ID, using `fetchConfig` from `@theme/utilities`.
- [ ] Button **state machine**: `disabled` (no option chosen) → `enabled` → `loading` → `added` → back to `enabled`.
- [ ] Error handling: 422 / sold out → inline message, never a silent failure.
- [ ] Refresh the theme's cart UI by dispatching the cart events from `@shopify/events`, so the drawer and cart bubble re-render through the theme's own pipeline. One round trip, no full reload.
- [ ] Add a line item property `_source: pdp-cross-sell` so the client can attribute revenue to the widget.

### 2.6 Design fidelity (R4)
- [ ] Implement against the token sheet in [../design-tokens.md](../design-tokens.md).
- [ ] All interaction states built: default · hover · focus-visible · active · disabled · loading · success.
- [ ] Mobile layout designed deliberately (no mobile comp was given — see recommendations).
- [ ] Zero layout shift: reserve image aspect ratio, fixed card height.

### 2.7 Quality gates
- [ ] **Performance:** no external JS/CSS; component JS under ~3 KB; `loading="lazy"` + `srcset`/`sizes` on images; CSS scoped to the block via `{% stylesheet %}`; JS as a module.
- [ ] **Accessibility (WCAG 2.1 AA):** labelled select, `aria-label` on arrows, `aria-live` region announcing "Added to cart", visible focus rings, keyboard-operable end to end.
- [ ] **i18n:** every visible string through `| t` with keys in `locales/*.json`. No hardcoded copy.
- [ ] **Merchant settings** in the schema: heading text, products-per-view, show/hide price, enable fallback.
- [ ] `shopify theme check` passes clean.
- [ ] Cross-browser: Chrome, Safari, Firefox, iOS Safari.

---

## 3 · Deliverable A — Technical write-up

- [ ] 1–2 pages, in the repo as `README.md` (or a linked doc).
- [ ] Which Shopify features and **why**: metafields, theme blocks, Cart AJAX API, the theme's cart event pipeline, theme editor settings.
- [ ] Performance reasoning, ideally **quantified vs. the app being replaced** (KB, requests, LCP/INP).
- [ ] Trade-offs and what you intentionally did *not* build.
- [ ] What you'd do next with more time.

## 4 · Deliverable B — Working prototype

- [x] **GitHub repo**, clean commit history, readable messages. → [Ronygrafo/pact-home_task](https://github.com/Ronygrafo/pact-home_task)
- [ ] `README.md` with: what it is, install steps, metafield setup, theme editor setup, settings reference.
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

Test each of these before recording the Loom:

- [ ] Product with **no** cross-sells assigned → section hidden (or fallback), no empty container.
- [ ] Product with 1 cross-sell → no arrows, no broken carousel.
- [ ] Product with 8 cross-sells → smooth scroll, arrows toggle correctly at both ends.
- [ ] Cross-sell product with a **single variant** → no selector, ADD enabled.
- [ ] Cross-sell product **fully sold out** → ADD disabled with clear reason.
- [ ] One variant sold out among several → that option disabled only.
- [ ] Product with no image → placeholder, layout intact.
- [ ] Very long product title → clamped, cards stay aligned.
- [ ] Adding the same product twice → quantity increments correctly.
- [ ] Cart drawer/counter updates without a page reload.
- [ ] Mobile 375px, tablet 768px, desktop 1440px, ultra-wide 1920px.
- [ ] Keyboard-only run through the whole widget.
- [ ] Lighthouse on the PDP: no regression vs. the base theme.

---

## Suggested timeline

| Day | Focus |
|---|---|
| **Day 1** | ~~Questions sent · dev store + repo~~ ✅ · demo data · metafield definition · Liquid markup and card structure · static design match |
| **Day 2** | Carousel + JS add-to-cart + states + responsive + a11y pass · QA matrix · write-up |
| **Day 3** | Loom recording · README polish · final QA from incognito · submit |
