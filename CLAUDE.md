# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A take-home task for **Pact Studio** (Senior Shopify Developer role): build a custom **"Pairs With" cross-sell widget** for the product page, replacing a paid cross-sell app the client wants to drop because it slows the page down and behaves inconsistently.

Four graded requirements:

1. The store team picks the cross-sell products **manually, per product**.
2. The widget renders on the product page **directly below the Add to Cart button**.
3. Shoppers can **add to cart from inside the widget**.
4. The output **matches the reference design** (monochrome, zero border radius, monospace UI type, horizontal cards, ~1.5 cards visible).

Everything committed here is written in **English** — the repo is part of the submission.

## Environment

| | |
|---|---|
| Store | `rr-pact-home-task.myshopify.com` (Partner development store) |
| Theme | Horizon 4.1.3, id `158575362200` |
| Base commit | The theme was pulled untouched; diffing against it shows exactly what was hand-built |

## Commands

There is no `package.json`, no build step and no test suite — theme files are served as authored. Everything goes through the Shopify CLI.

```bash
shopify theme dev   --store rr-pact-home-task.myshopify.com --theme 158575362200  # local preview + hot reload
shopify theme check                                                               # linter (no custom config, uses defaults)
shopify theme push  --store rr-pact-home-task.myshopify.com --theme 158575362200  # upload
shopify theme pull  --store rr-pact-home-task.myshopify.com --theme 158575362200 --nodelete
shopify theme list  --store rr-pact-home-task.myshopify.com
```

`--nodelete` on pull is not optional: without it the CLI removes local files that don't exist remotely.

## Architecture — Horizon 4.1.3

### Theme blocks are the unit of composition

There is **no `main-product.liquid`**. The PDP is `sections/product-information.liquid`, which renders `{% content_for 'blocks' %}` and accepts `@theme` and `@app` in its schema — meaning any public theme block can be dropped anywhere in the product column from the theme editor.

- `blocks/*.liquid` — public, merchant-selectable.
- `blocks/_*.liquid` — private, only reachable via `{% content_for 'block', type: '_name' %}` from a parent.
- Blocks read their context through `closest.product` rather than the global `product`.
- Every block must output `{{ block.shopify_attributes }}` on its root element or the theme editor cannot target it.
- `templates/product.json` holds the live composition. Current nesting on the PDP: `product-information` → `_product-details` → `group` → `variant-picker` → `buy-buttons` (which itself wraps `quantity`, `add-to-cart`, `accelerated-checkout`). **A cross-sell block placed as the next sibling after `buy-buttons` satisfies requirement 2 without touching a single base file.**

### Styling

Block-scoped CSS lives in a `{% stylesheet %}` tag inside the block itself (52 of the 95 blocks do this) — not in a separate asset. Global styles are `assets/base.css`; design-token variables come from `snippets/theme-styles-variables.liquid` and `settings.color_palette`. When a setting must reach CSS, blocks build a scoped class from `block.id` and emit custom properties inline (see `blocks/add-to-cart.liquid`).

### JavaScript

Custom elements only — no framework, no bundler. No block uses `{% javascript %}`.

- `assets/component.js` exports `Component`, the base class every element extends. It resolves child elements declared with a `ref` attribute into `this.refs`, enforces `requiredRefs`, and hydrates declarative shadow DOM.
- Modules resolve through an **importmap declared in `snippets/scripts.liquid`** using `@theme/*` aliases (`@theme/component`, `@theme/utilities`, `@theme/events`, `@theme/morph`, …) plus `@shopify/events` from the Shopify CDN. The importmap is page-global, so a new module loaded from a block can import those aliases **without editing `scripts.liquid`**.
- A global `Theme` object at the end of `snippets/scripts.liquid` exposes `Theme.routes.cart_add_url`, `cart_change_url`, `cart_url` and a small set of `Theme.translations`.
- Cart writes follow the pattern in `assets/product-form.js`: `fetch(Theme.routes.cart_add_url, fetchConfig('javascript', { body: formData }))`, then dispatch `CartLinesUpdateEvent` / `CartErrorEvent` from `@shopify/events` so the drawer and cart bubble re-render themselves. Use `morph` from `@theme/morph` for in-place DOM updates and `cartPerformance` from `@theme/performance` for timing marks. Do not reload the page and do not hand-roll a second cart sync path.

### Liquid conventions

- Blocks and snippets declare their contract in a `{%- doc -%}` tag with `@param` lines. Match it when adding files.
- Schema labels are translation keys, never literals: `"name": "t:names.…"`, `"label": "t:settings.…"`, `"content": "t:content.…"`, `"info": "t:info.…"`. Settings can be conditionally shown with `visible_if`.
- 51 locale files in `locales/`. Storefront strings go through `| t`; schema strings resolve from `*.schema.json`.

## Working rules for this repo

- **Do not modify base theme files.** The widget ships as new files only (a public theme block, its snippets, its asset). If a change to a Horizon file becomes unavoidable, flag it first — "zero base files modified" is a deliberate upgrade-safety argument in the write-up.
- Product assignment is a **product metafield** (`list.product_reference`), not a settings field with handles or IDs. The merchant works inside the Admin product page.
- Server-render the cards in Liquid. No client-side product fetching, no third-party carousel library — the carousel is CSS scroll-snap.
- The section must never render an empty container when a product has nothing assigned.
- Commits: English, conventional-commit prefixes, no AI co-authorship trailers.
- `docs/` is gitignored: it holds internal working notes (the brief transcript, delivery checklist, strategy notes, design-token analysis) that stay out of the submission. Read them for context — `docs/03-design-tokens.md` is the visual source of truth — but do not commit them.
