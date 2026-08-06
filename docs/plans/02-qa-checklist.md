# QA Checklist — "Pairs With" Cross-Sell Widget

| | |
|---|---|
| **Companion to** | [01-delivery-checklist.md](01-delivery-checklist.md) §7 |
| **Plan** | [cross-sell-widget.md](cross-sell-widget.md) |
| **Feature doc** | [../features/cross-sell-widget.md](../features/cross-sell-widget.md) |
| **Visual spec** | [../design-tokens.md](../design-tokens.md) |
| **Store / Theme** | `rr-pact-home-task.myshopify.com` · Horizon 4.1.3, id `158575362200` |
| **Test command** | `shopify theme dev --store rr-pact-home-task.myshopify.com --theme 158575362200` |
| **Test product** | `rr-trainer-low` — 7 companions assigned |

This is the definitive QA checklist for the widget. It serves two purposes: it guides the manual test session, and it stands as evidence of what was actually checked and how — so what's already verified and what's still open stay clearly separated instead of collapsing into one undifferentiated list. Section 1 is done. Sections A–G are the manual pass, still open, ordered by how much rework a failure would cost — blocking issues first, catalog-blocked gaps last.

---

## 1 · Already verified (server-rendered HTML)

Confirmed by inspecting the HTML `shopify theme dev` actually serves, not in a browser — these checks cover render, not behaviour. Behaviour is what sections A–G are for.

- [x] Zero Liquid errors on the page — 19 were thrown by `image_url` receiving `nil` on companions without an image; fixed.
- [x] `<cross-sell-component>` opens after the buy box's Add to Cart button, in document order — R2.
- [x] 7 cards server-rendered from the `custom.cross_sell_products` metafield.
- [x] `<product-card>` wrapper present on 7/7 cards — the `productSelect` isolation boundary.
- [x] `properties[_source] = pdp-cross-sell` present on 7/7 cards.
- [x] `ref="liveRegion"` present on 7/7 cards.
- [x] `.add-to-cart-text--added` present on 7/7 cards.
- [x] Single-variant mode (`none`): no `<select>`, ADD renders without `disabled`.
- [x] Option mode (`option`): `input[name="id"]` is born `disabled`, and so is ADD.
- [x] Sold-out variant: only that `<option>` carries `disabled` and the "Unavailable" suffix.
- [x] Fully sold-out product: "Sold out" note under the price, ADD `disabled`.
- [x] Long title reaches the DOM intact — the 2-line clamp is CSS, not a server-side truncation.
- [x] Images carry `width`, `height` and `loading="lazy"`.
- [x] Products with no companions assigned: zero DOM, zero errors — checked on 6 products.
- [x] `shopify theme check`: 348 files, 0 offenses.

---

## A · Blocking

If anything here fails, it's an architecture problem, not a finishing-touch problem.

- [ ] **A1** Choose a size on a card, press ADD → that companion is added with that size; the cart drawer opens, the cart bubble count increases, no page reload.
- [ ] **A2** **Isolation test.** Change the main product's size and press ADD on a companion card in the same instant → the **companion** is added, not the main product. This is the test that exists because of how `assets/product-form.js` resolves state: every `<product-form-component>` subscribes to the `productSelect` event on its nearest `.shopify-section, dialog, product-card` (`:236`); `#onProductSelect` sets `#variantChangeInProgress = true` (`:781-785`) *before* the guard that would otherwise bail out on a mismatched `productId` (`:796`); and `#getVariantPicker()` falls back to the only `variant-picker` inside that same container without checking whose product it belongs to (`:1096`). That chain is exactly what the `<product-card>` wrapper around each card closes off — this test is what confirms it actually does.
- [ ] **A3** Open `/cart.js` after A1 → the line item carries `properties._source = "pdp-cross-sell"`.
- [ ] **A4** Add the same companion twice → the quantity increments, no second line item appears.

Run A2 first. It's the only one of these four that could force a structural change, and it's cheap to rule out before running the rest.

---

## B · Functional

- [ ] **B1** Initial state of a card with a selector → ADD is disabled until an option is chosen.
- [ ] **B2** Choose a size → ADD enables and the select picks up the 2px black border.
- [ ] **B3** Single-variant card (`RR Trail Grey Ankle Socks`) → no selector, ADD enabled from render.
- [ ] **B4** Selector on `RR Flagship White Ankle Socks` → size M renders disabled with the "Unavailable" suffix.
- [ ] **B5** After adding → the button reads ADDED for ~800ms, then reverts to ADD without changing width. The duration is owned by `assets/product-form.js:152-160`, not this widget's code.
- [ ] **B6** Arrows → left inactive at the start, right inactive at the end, both active in the middle.
- [ ] **B7** Touch swipe and trackpad scroll → snaps, no visible scrollbar.
- [ ] **B8** Reload with a size already chosen, and navigate back from another page (bfcache) → ADD stays consistent with the `<select>`, never enabled against an empty id.
- [ ] **B9** Force a cart error (e.g. sell out the stock between render and submit) → inline message, never a silent failure.

---

## C · Visual, against `../design-mockup.png`

- [ ] **C1** Side by side at 1440px: proportions, type weight, and the dual-typeface contrast — heading, selector label and ADD render in the theme's heading font (`var(--font-heading--family)`, `settings.type_heading_font` — `mono` on this demo store, hence the monospace look), product title and price render in the theme's body font (`var(--font-body--family)`, `settings.type_body_font`).
- [ ] **C2** ~1.5 cards visible, with the next one visibly cut off.
- [ ] **C3** Zero border radius everywhere: card, select, button.
- [ ] **C4** The image sits directly on the card's grey surface — no white tile behind it.
- [ ] **C5** Focus the select and measure the card's width in DevTools before and after — it must be identical. The 2px border is an inset `box-shadow` precisely for this.
- [ ] **C6** The two-line title (the Featherweight) doesn't knock cards out of alignment.

---

## D · Accessibility

- [ ] **D1** Tab-only pass reaches the arrows, the scroller, the select and ADD, with visible focus rings on all of them.
- [ ] **D2** Tab onto an arrow at its end: still focusable — it uses `aria-disabled`, not `disabled`.
- [ ] **D3** Screen reader on add: the card's live region announces it.
- [ ] **D4** DevTools → Rendering → `prefers-reduced-motion: reduce`: no smooth scroll, no transitions.

---

## E · Responsive

| # | Viewport | Expected | Done |
|---|---|---|---|
| E1 | 1920 / 1440 | 420px card, ~1.5 visible, arrows visible | [ ] |
| E2 | 1200 | ~405px card, ~1.3 visible | [ ] |
| E3 | 768 | intermediate scale, controls stay comfortable to tap | [ ] |
| E4 | 375 | no arrows, swipe only; card stays horizontal; scroll until the sticky Add to Cart bar appears and confirm the first card's ADD is still tappable | [ ] |
| E5 | theme editor | Raise `products_per_view` to 2 → the `[select \| ADD]` row **stacks** instead of getting crushed — the container query, not a media query, is what makes that possible | [ ] |

---

## F · Blocked on demo catalogue

Blocked by missing data, not by a failure.

- [ ] **F1** Product with more than 2 options → the only way to exercise `link` mode (the "Choose" button back to the PDP). **This branch of the code has never run.**
- [ ] **F2** Product with exactly 1 companion → confirm the arrows don't render.
- [ ] **F3** Companion with no image → confirm visually that `placeholder_svg_tag` doesn't break the grid.

---

## G · Cross-browser and performance

- [ ] Chrome, Safari, Firefox, iOS Safari.
- [ ] JS disabled: the widget still renders, links navigate, and no card with a selector can add anything — the `<select>` has no `name` and the hidden id input is born `disabled`.
- [ ] Lighthouse on the PDP against the base theme: no regression.

---

## Closing note

Section F isn't a QA failure — it's blocked on catalog data that doesn't exist yet in the demo store. Don't let it stall sign-off; note it as a known gap in the write-up instead. Once A–E and G are all checked, flip "QA matrix green" in [01-delivery-checklist.md](01-delivery-checklist.md) and move to the Loom recording (§5 there).
