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
| **Manual pass** | 2026-08-06 — sections A–G run, zero failures |

This is the definitive QA checklist for the widget. It serves two purposes: it guides the manual test session, and it stands as evidence of what was actually checked and how — so what's already verified and what's still open stay clearly separated instead of collapsing into one undifferentiated list. Sections are ordered by how much rework a failure would cost — blocking issues first, catalog-blocked gaps last.

**Result of the manual pass: zero failures.** Every section was run. Two items remain unchecked — neither a failure; both blocked by something the test environment couldn't provide, and each carries its reason inline.

**Legend:** `[x]` = run and passed · `[ ]` + *not run* = never exercised, no evidence either way.

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

- [x] **A1** Choose a size on a card, press ADD → that companion is added with that size; the cart drawer opens, the cart bubble count increases, no page reload.
- [x] **A2** **Isolation test.** Change the main product's size and press ADD on a companion card in the same instant → the **companion** is added, not the main product. This is the test that exists because of how `assets/product-form.js` resolves state: every `<product-form-component>` subscribes to the `productSelect` event on its nearest `.shopify-section, dialog, product-card` (`:236`); `#onProductSelect` sets `#variantChangeInProgress = true` (`:781-785`) *before* the guard that would otherwise bail out on a mismatched `productId` (`:796`); and `#getVariantPicker()` falls back to the only `variant-picker` inside that same container without checking whose product it belongs to (`:1096`). That chain is exactly what the `<product-card>` wrapper around each card closes off — this test is what confirms it actually does.
- [x] **A3** Open `/cart.js` after A1 → the line item carries `properties._source = "pdp-cross-sell"`.
- [x] **A4** Add the same companion twice → the quantity increments, no second line item appears.

A2 was run first — the only one of these four that could have forced a structural change. It passed: the `<product-card>` wrapper does close off the `productSelect` chain, so the architecture stands as designed.

---

## B · Functional

- [x] **B1** Initial state of a card with a selector → ADD is disabled until an option is chosen.
- [x] **B2** Choose a size → ADD enables and the select picks up the 2px black border.
- [x] **B3** Single-variant card (`RR Trail Grey Ankle Socks`) → no selector, ADD enabled from render.
- [x] **B4** Selector on `RR Flagship White Ankle Socks` → size M renders disabled with the "Unavailable" suffix.
- [x] **B5** After adding → the button reads ADDED for ~800ms, then reverts to ADD without changing width. The duration is owned by `assets/product-form.js:152-160`, not this widget's code.
- [x] **B6** Arrows → left inactive at the start, right inactive at the end, both active in the middle.
- [x] **B7** Touch swipe and trackpad scroll → snaps, no visible scrollbar.
- [x] **B8** Reload with a size already chosen, and navigate back from another page (bfcache) → ADD stays consistent with the `<select>`, never enabled against an empty id.
- [ ] **B9** Force a cart error (e.g. sell out the stock between render and submit) → inline message, never a silent failure. — *not run:* reproducing it means racing a stock edit against a submit on a single-operator store. The path isn't this widget's code — the error surface is inherited wholesale from `assets/product-form.js`, the same one every other add-to-cart in the theme uses.

---

## C · Visual, against `../design-mockup.png`

- [x] **C1** Side by side at 1440px: proportions, type weight, and the dual-typeface contrast — heading, selector label and ADD render in the theme's heading font (`var(--font-heading--family)`, `settings.type_heading_font` — `mono` on this demo store, hence the monospace look), product title and price render in the theme's body font (`var(--font-body--family)`, `settings.type_body_font`).
- [x] **C2** ~1.5 cards visible, with the next one visibly cut off.
- [x] **C3** Zero border radius everywhere: card, select, button.
- [x] **C4** The image sits directly on the card's grey surface — no white tile behind it.
- [x] **C5** Focus the select and measure the card's width in DevTools before and after — it must be identical. The 2px border is an inset `box-shadow` precisely for this.
- [x] **C6** The two-line title (the Featherweight) doesn't knock cards out of alignment.
- [x] **C7** Colour inheritance, after the widget's palette was moved onto the theme's own tokens ([../design-tokens.md §3](../design-tokens.md)). Checked in the widget — the 1px resting border on the `<select>` — and, because `color_palette.color2` was set to `#D0D0D0` to supply the specified value, at every other place in the theme that reads it: the header background band, the cart background, the PDP and footer dividers, and the variant-pill borders. No regression anywhere; the widget renders identically to the pre-inheritance build.

C1 is the check R4 was waiting on. It passed — the widget now holds up against `../design-mockup.png` side by side, not just against the token sheet.

C7 is the one check whose blast radius reaches outside the widget. `color2` feeds eight settings in `config/settings_data.json`, two of them background fills rather than strokes, so it was verified store-wide rather than on the PDP alone.

---

## D · Accessibility

- [x] **D1** Tab-only pass reaches the arrows, the scroller, the select and ADD, with visible focus rings on all of them.
- [x] **D2** Tab onto an arrow at its end: still focusable — it uses `aria-disabled`, not `disabled`.
- [ ] **D3** Screen reader on add: the card's live region announces it. — *not run:* no screen reader in the test session. The `ref="liveRegion"` element is confirmed present on 7/7 cards (§1) and the text is written into it, so the markup contract holds; what's unverified is how a real AT voices it.
- [x] **D4** DevTools → Rendering → `prefers-reduced-motion: reduce`: no smooth scroll, no transitions.

---

## E · Responsive

All five passed. E5 in particular confirms the container query does what a media query couldn't: the card narrows because of a *setting*, not because of the viewport, and the controls row still knows to stack.

| # | Viewport | Expected | Done |
|---|---|---|---|
| E1 | 1920 / 1440 | 420px card, ~1.5 visible, arrows visible | [x] |
| E2 | 1200 | ~405px card, ~1.3 visible | [x] |
| E3 | 768 | intermediate scale, controls stay comfortable to tap | [x] |
| E4 | 375 | no arrows, swipe only; card stays horizontal; scroll until the sticky Add to Cart bar appears and confirm the first card's ADD is still tappable | [x] |
| E5 | theme editor | Raise `products_per_view` to 2 → the `[select \| ADD]` row **stacks** instead of getting crushed — the container query, not a media query, is what makes that possible | [x] |

---

## F · Variant-mode edge cases

Originally blocked on demo catalogue data. All three now covered — F1 by seeding a product for it.

- [x] **F1** Product with more than 2 options → the only way to exercise `link` mode (the "Choose" button back to the PDP). Closed by seeding a 3-option product and assigning it as a companion: the card renders with no form, no selector, and a full-width CHOOSE button in place of ADD. **Every branch of the variant decision tree has now executed.** Note for the demo catalogue, not a defect: that seeded product uses a stock image with a white background baked into the file, so it shows a white square against the grey card. The CSS puts nothing behind the image (`object-fit: contain`, no `background`) — it's the asset, and it's why C4 reads clean on the real companions, whose PNGs are transparent.
- [x] **F2** Product with exactly 1 companion → confirm the arrows don't render.
- [x] **F3** Companion with no image → confirm visually that `placeholder_svg_tag` doesn't break the grid.

---

## G · Cross-browser and performance

- [x] **G1** Chrome, Safari, Firefox, iOS Safari.
- [x] **G2** JS disabled: the widget still renders, links navigate, and no card with a selector can add anything — the `<select>` has no `name` and the hidden id input is born `disabled`.
- [x] **G3** Lighthouse on the PDP against the base theme: no regression. **95 → 96 Performance, 96 → 97 Accessibility, 77 → 77 Best Practices** — same product page on the published store, block removed and re-added between runs. Read it as parity, not as an improvement: a one-point delta on a single run is variance.
  - **Method matters here.** The first attempt at this measurement ran against `shopify theme dev` and reported 88 → 75, a 13-point "regression" that was entirely an artifact of the dev server — unminified assets and an open hot-reload websocket. Never benchmark against `theme dev`. The numbers above are from the published theme.

---

## Closing note

**Nothing failed, and every section was run.** A (all four, isolation test included), B1–B8, C1–C7, D1–D2/D4, all five responsive viewports, F1–F3 and G1–G3 passed in a browser. The architecture holds, the cart path works end to end, the design matches the reference, every branch of the variant decision tree has executed, and the widget degrades correctly with scripting off.

Two items stay unchecked. Neither is a defect — both are blocked by something the environment didn't provide:

| Item | Why it's open | Position |
|---|---|---|
| **D3** screen reader | No assistive tech in the test session. The `ref="liveRegion"` element is code-verified on 7/7 cards and the announcement text is written into it, so the markup contract holds — what's unverified is how a real AT voices it. | Accept as a known gap. |
| **B9** cart error | Needs a stock edit raced against a submit. The error surface is inherited wholesale from `assets/product-form.js`, the same one every add-to-cart in the theme uses — not code written here. | Accept as a known gap. |

Both are honest limits of a solo test session rather than untested code paths: the two remaining gaps are about *verifying inherited behaviour*, not about branches of this widget that have never run. Every line of the widget's own logic has now been exercised.

QA matrix is green in [01-delivery-checklist.md](01-delivery-checklist.md). Next: the two submission fields and the Loom recording (§5 there).
