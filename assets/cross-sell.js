import { Component } from '@theme/component';
import { prefersReducedMotion } from '@theme/utilities';

/**
 * Sub-pixel rounding means `scrollLeft` almost never lands exactly on 0 or on the max scroll
 * value, so the scroll-end checks below need a small tolerance instead of an exact comparison.
 */
const SCROLL_END_TOLERANCE = 2;

/**
 * `<cross-sell-component>` — the "Pairs With" carousel on the product page.
 *
 * Owns two independent behaviours:
 *  - the previous/next arrows and their disabled state for the CSS scroll-snap carousel;
 *  - syncing a companion card's variant/option <select> to its hidden add-to-cart form.
 *
 * Everything cart-related still runs through the theme's own <product-form-component>
 * (assets/product-form.js) — this component never fetches or writes to the cart itself.
 *
 * @typedef {object} CrossSellRefs
 * @property {HTMLUListElement} scroller
 * @property {HTMLButtonElement} [previous] - Absent when the carousel has a single companion.
 * @property {HTMLButtonElement} [next] - Absent when the carousel has a single companion.
 * @property {HTMLLIElement[]} [cards]
 *
 * @extends {Component<CrossSellRefs>}
 */
export class CrossSellComponent extends Component {
  // Only `scroller` always renders. `previous`/`next` are omitted from the markup entirely for
  // a single companion, so requiring them here would throw a MissingRefError on that layout.
  requiredRefs = ['scroller'];

  #abortController = new AbortController();

  /** @type {ResizeObserver | undefined} */
  #resizeObserver;

  /** @type {number | undefined} */
  #rafId;

  connectedCallback() {
    super.connectedCallback();

    const { signal } = this.#abortController;
    const { scroller } = this.refs;

    scroller.addEventListener('scroll', this.#scheduleArrowUpdate, { passive: true, signal });
    // bfcache restores a <select>'s chosen value but not the hidden inputs synced from it (see
    // #syncOptionSelection), so a back-navigation or reload needs the same re-sync as connect.
    window.addEventListener('pageshow', this.#restoreOptionState, { signal });

    this.#resizeObserver = new ResizeObserver(this.#scheduleArrowUpdate);
    this.#resizeObserver.observe(scroller);

    this.#restoreOptionState();
    this.#updateArrowState();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#abortController.abort();
    this.#resizeObserver?.disconnect();
    if (this.#rafId !== undefined) cancelAnimationFrame(this.#rafId);
  }

  /**
   * Scrolls the carousel back by one card. No-op at the start of the track.
   */
  previous() {
    this.#scrollByStep(-1, this.refs.previous);
  }

  /**
   * Scrolls the carousel forward by one card. No-op at the end of the track.
   */
  next() {
    this.#scrollByStep(1, this.refs.next);
  }

  /**
   * Syncs a companion card's hidden inputs and ADD button to whatever <option> the shopper just
   * picked in its variant/option <select>.
   *
   * @param {Event & {target: HTMLSelectElement}} event
   */
  handleOptionChange(event) {
    this.#syncOptionSelection(event.target);
  }

  /**
   * Scrolls the track by one step in the given direction.
   *
   * @param {-1 | 1} direction
   * @param {HTMLButtonElement | undefined} arrow - The arrow that triggered the call, read for
   *   its current disabled state.
   */
  #scrollByStep(direction, arrow) {
    // `aria-disabled`, not the `disabled` attribute: a disabled button drops keyboard focus the
    // moment it's reached, which would kick focus out of the carousel entirely. Reading the ARIA
    // state instead and no-op'ing here keeps the button focusable at either end of the track.
    if (arrow?.getAttribute('aria-disabled') === 'true') return;

    const step = this.#measureStep();
    if (!step) return;

    this.refs.scroller.scrollBy({
      left: step * direction,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }

  /**
   * Measures one scroll step as the first card's real rendered width plus the scroller's
   * column-gap, both read straight from the DOM. Measuring instead of duplicating the
   * `--cs-per-view` setting and its three breakpoints in JS is what keeps this correct
   * automatically, whatever the merchant configures and whichever breakpoint is active.
   *
   * @returns {number}
   */
  #measureStep() {
    const { scroller, cards } = this.refs;
    const firstCard = cards?.[0];
    if (!firstCard) return 0;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(scroller).columnGap) || 0;

    return cardWidth + gap;
  }

  /**
   * Coalesces the scroll and resize listeners into a single per-frame recalculation instead of
   * re-checking the arrow state on every scroll tick.
   */
  #scheduleArrowUpdate = () => {
    if (this.#rafId !== undefined) return;

    this.#rafId = requestAnimationFrame(() => {
      this.#rafId = undefined;
      this.#updateArrowState();
    });
  };

  /**
   * Disables an arrow once the scroller has reached (or passed, allowing for sub-pixel drift)
   * that end of the track. `Math.abs` on `scrollLeft` keeps the comparison correct in RTL, where
   * `scrollLeft` is negative.
   */
  #updateArrowState() {
    const { scroller, previous, next } = this.refs;
    if (!previous || !next) return;

    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    const distanceFromStart = Math.abs(scroller.scrollLeft);

    const atStart = maxScroll <= 0 || distanceFromStart <= SCROLL_END_TOLERANCE;
    const atEnd = maxScroll <= 0 || distanceFromStart >= maxScroll - SCROLL_END_TOLERANCE;

    previous.setAttribute('aria-disabled', String(atStart));
    next.setAttribute('aria-disabled', String(atEnd));
  }

  /**
   * Re-applies #syncOptionSelection to every option/variant <select> in the widget.
   */
  #restoreOptionState = () => {
    const selects = /** @type {NodeListOf<HTMLSelectElement>} */ (
      this.querySelectorAll('select[data-cross-sell-option]')
    );

    selects.forEach((select) => this.#syncOptionSelection(select));
  };

  /**
   * Syncs one card's hidden form to whichever <option> is currently selected. Shared by
   * handleOptionChange (live interaction) and #restoreOptionState (bfcache/reload) so both
   * produce the exact same result.
   *
   * `<product-form-component>` is itself a `*-component` boundary (assets/component.js), so its
   * `ref="variantId"` / `ref="addToCartButton"` never surface on `this.refs` here — hence the
   * querySelector calls below instead of ref lookups.
   *
   * @param {HTMLSelectElement} select
   */
  #syncOptionSelection(select) {
    const form = select.closest('product-form-component');
    if (!form) return;

    const option = select.selectedOptions[0];
    const variantId = option?.dataset.variantId ?? '';
    const available = option?.dataset.available !== 'false';
    const canAddToCart = variantId !== '' && available;

    const variantIdInput = /** @type {HTMLInputElement | null} */ (form.querySelector('input[name="id"]'));
    if (variantIdInput) {
      variantIdInput.value = variantId;
      // Belt-and-suspenders: FormData skips disabled inputs, so an unresolved selection can't be
      // submitted even if a stale ADD button somehow stays clickable.
      variantIdInput.disabled = !canAddToCart;
    }

    const quantityInput = /** @type {HTMLInputElement | null} */ (form.querySelector('input[name="quantity"]'));
    if (quantityInput) {
      quantityInput.value = option?.dataset.quantityMin || '1';
    }

    const addToCartButton = /** @type {HTMLButtonElement | null} */ (
      form.querySelector('button[ref="addToCartButton"]')
    );
    if (addToCartButton) {
      // Set directly on the button instead of through AddToCartComponent#disable/enable: same
      // effect, and it still works even if that custom element hasn't upgraded yet.
      addToCartButton.disabled = !canAddToCart;
    }

    const media = option?.dataset.variantMedia;
    if (media) {
      form.querySelector('add-to-cart-component')?.setAttribute('data-product-variant-media', media);
    }

    // Drives the 2px active border from the reference design.
    select.dataset.chosen = String(variantId !== '');
  }
}

if (!customElements.get('cross-sell-component')) {
  customElements.define('cross-sell-component', CrossSellComponent);
}
