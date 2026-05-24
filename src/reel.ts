import { animateNumber } from './animation';
import { formatValue, parseNumericValue } from './format';
import { injectReelCSS } from './styles';
import type { AnimationControls, ReelOptions, ReelTarget, ResolvedReelOptions } from './types';

const DEFAULT_OPTIONS: ResolvedReelOptions = {
  value: 0,
  duration: 500,
  format: ',ddd',
  decimalSeparator: '.',
  animation: 'slide',
  easing: 'ease-out',
  prefix: '',
  suffix: '',
  injectCSS: true,
  theme: 'default',
  startOnVisible: false,
  auto: false
};

/**
 * Process-wide defaults applied to subsequently-created Reel instances.
 */
let globalOptions: Partial<ReelOptions> = {};

/**
 * Normalizes constructor input into an HTMLElement and provides a clear error
 * for selector typos.
 */
function resolveTarget(target: ReelTarget): HTMLElement {
  if (typeof target !== 'string') return target;

  const element = document.querySelector<HTMLElement>(target);
  if (!element) {
    throw new Error(`Reel target not found: ${target}`);
  }

  return element;
}

/**
 * Applies options in priority order: library defaults, global configuration,
 * then per-instance options.
 */
function mergeOptions(options: ReelOptions = {}): ResolvedReelOptions {
  const merged = {
    ...DEFAULT_OPTIONS,
    ...globalOptions,
    ...options,
    visibility: {
      ...globalOptions.visibility,
      ...options.visibility
    }
  };

  return merged;
}

function assertFiniteNumber(value: number, name = 'Reel value'): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Invalid ${name}: ${value}`);
  }
}

function shouldReduceMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Converts `data-reel-*` attributes into regular options.
 *
 * Keeping this parser small and explicit makes the public HTML API easy to
 * document and avoids surprising type coercion rules.
 */
function readDataOptions(element: HTMLElement): ReelOptions {
  const data = element.dataset;

  return {
    value: parseNumericValue(data.reel ?? element.textContent, DEFAULT_OPTIONS.value),
    duration: data.reelDuration === undefined ? undefined : Number(data.reelDuration),
    format: data.reelFormat,
    decimals: data.reelDecimals === undefined ? undefined : Number(data.reelDecimals),
    decimalSeparator: data.reelDecimalSeparator,
    notation: data.reelNotation === 'compact' ? 'compact' : undefined,
    animation:
      data.reelAnimation === 'count'
        ? 'count'
        : data.reelAnimation === 'slide'
          ? 'slide'
          : undefined,
    easing: data.reelEasing as ReelOptions['easing'],
    prefix: data.reelPrefix,
    suffix: data.reelSuffix,
    injectCSS: data.reelInjectCss === undefined ? undefined : data.reelInjectCss !== 'false',
    theme: data.reelTheme,
    startOnVisible:
      data.reelStartOnVisible === undefined ? undefined : data.reelStartOnVisible !== 'false'
  };
}

/**
 * Fast ASCII digit check used while building slide markup.
 */
function isDigit(character: string): boolean {
  return character >= '0' && character <= '9';
}

/**
 * Creates one visual digit reel containing 0 through 9.
 *
 * The current digit is selected with a translate3d transform so Safari and iOS
 * Safari can use the compositor instead of re-laying out text during updates.
 */
function digitStrip(digit: number): HTMLElement {
  const wrapper = document.createElement('span');
  wrapper.className = 'reel__digit';

  const strip = document.createElement('span');
  strip.className = 'reel__strip';
  strip.style.transform = `translate3d(0,-${digit}em,0)`;

  for (let i = 0; i <= 9; i += 1) {
    const number = document.createElement('span');
    number.className = 'reel__number';
    number.textContent = String(i);
    strip.append(number);
  }

  wrapper.append(strip);
  return wrapper;
}

/**
 * Creates static text nodes for separators, prefixes, suffixes, and signs.
 */
function glyph(character: string): HTMLElement {
  const span = document.createElement('span');
  span.className = 'reel__glyph';
  span.textContent = character;
  return span;
}

/**
 * Sets global defaults for future Reel instances.
 *
 * Existing instances keep their resolved options. This mirrors how many UI
 * libraries handle global config and avoids changing animations mid-flight.
 *
 * @example
 * ```ts
 * configure({ duration: 800, format: ',ddd' });
 * ```
 */
export function configure(options: Partial<ReelOptions>): void {
  globalOptions = {
    ...globalOptions,
    ...options
  };
}

/**
 * Odometer-style rolling number renderer.
 *
 * `Reel` owns the target element while it is active, stores the original DOM
 * state, and restores that state in {@link Reel.destroy}. It is safe to create
 * instances from selectors or from already-resolved HTMLElements.
 *
 * @example
 * ```ts
 * const reel = new Reel('#sales', { value: 1000, prefix: '$' });
 * await reel.update(9999);
 * ```
 */
export class Reel {
  private readonly element: HTMLElement;
  private readonly originalHTML: string;
  private readonly originalClassName: string;
  private readonly originalTheme: string | null;
  private readonly options: ResolvedReelOptions;
  private controls?: AnimationControls;
  private observer?: IntersectionObserver;
  private currentValue: number;
  private queuedValue?: number;
  private destroyed = false;
  private visible = false;

  /**
   * Creates a Reel with a shorter value-first API.
   *
   * @example
   * ```ts
   * const reel = Reel.from('#count', 1000, { prefix: '$' });
   * ```
   */
  static from(target: ReelTarget, value: number, options: ReelOptions = {}): Reel {
    assertFiniteNumber(value);
    return new Reel(target, {
      ...options,
      value
    });
  }

  /**
   * Creates a new Reel instance and renders the initial value immediately.
   *
   * @param target CSS selector or HTMLElement to render into.
   * @param options Per-instance options. These override values set by {@link configure}.
   */
  constructor(target: ReelTarget, options: ReelOptions = {}) {
    this.element = resolveTarget(target);
    this.originalHTML = this.element.innerHTML;
    this.originalClassName = this.element.className;
    this.originalTheme = this.element.getAttribute('data-theme');
    this.options = mergeOptions(options);
    this.currentValue = this.options.value;

    if (this.options.injectCSS) {
      injectReelCSS();
    }

    this.prepareElement();
    this.render(this.currentValue);

    if (this.options.startOnVisible) {
      this.visible = false;
      this.element.classList.add('reel--hidden');
      this.observeVisibility();
    } else {
      this.visible = true;
    }
  }

  /**
   * Last committed target value.
   *
   * During an animation this is already the destination value; the intermediate
   * frame value is an implementation detail used only for rendering.
   */
  get value(): number {
    return this.currentValue;
  }

  /**
   * Animates the reel to a new value.
   *
   * If another animation is active, it is stopped before the new one starts.
   * The returned promise resolves after the final value has rendered.
   */
  update(value: number): Promise<void> {
    this.assertActive();

    if (!Number.isFinite(value)) {
      return Promise.reject(new TypeError(`Invalid Reel value: ${value}`));
    }

    this.stop();

    if (this.options.startOnVisible && !this.visible) {
      // Store only the latest requested value while hidden. This prevents a
      // backlog of animations from replaying when a dashboard section appears.
      this.queuedValue = value;
      return Promise.resolve();
    }

    const from = this.currentValue;
    this.currentValue = value;

    this.controls = animateNumber({
      from,
      to: value,
      duration: this.getEffectiveDuration(),
      easing: this.options.easing,
      onStart: this.options.onStart,
      onEnd: this.options.onEnd,
      onUpdate: (next, progress) => {
        this.render(next);
        this.options.onUpdate?.(next, progress);
      }
    });

    return this.controls.promise.finally(() => {
      this.controls = undefined;
      this.render(value);
    });
  }

  /**
   * Animates by a relative delta from the current committed value.
   */
  updateBy(delta: number): Promise<void> {
    this.assertActive();
    if (!Number.isFinite(delta)) {
      return Promise.reject(new TypeError(`Invalid Reel delta: ${delta}`));
    }
    return this.update(this.currentValue + delta);
  }

  /**
   * Sets a value immediately without running animation lifecycle callbacks.
   */
  set(value: number): void {
    this.assertActive();
    assertFiniteNumber(value);
    this.stop();
    this.currentValue = value;
    this.queuedValue = undefined;
    this.render(value);
  }

  /**
   * Stops the current animation, if one is running.
   */
  stop(): void {
    this.controls?.stop();
    this.controls = undefined;
  }

  /**
   * Stops animations, disconnects observers, and restores the element's original DOM.
   */
  destroy(): void {
    if (this.destroyed) return;

    this.stop();
    this.observer?.disconnect();
    this.element.innerHTML = this.originalHTML;
    this.element.className = this.originalClassName;

    if (this.originalTheme === null) {
      this.element.removeAttribute('data-theme');
    } else {
      this.element.setAttribute('data-theme', this.originalTheme);
    }

    this.destroyed = true;
  }

  private assertActive(): void {
    if (this.destroyed) {
      throw new Error('Cannot use a destroyed Reel instance.');
    }
  }

  private prepareElement(): void {
    this.element.classList.add('reel', `reel--${this.options.animation}`);
    this.element.setAttribute('data-theme', this.options.theme);
    this.element.setAttribute('aria-live', 'polite');
  }

  private getEffectiveDuration(): number {
    if (this.options.respectReducedMotion !== false && shouldReduceMotion()) {
      return 0;
    }

    return this.options.duration;
  }

  private observeVisibility(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.reveal();
      return;
    }

    const once = this.options.visibility?.once ?? true;

    this.observer = new IntersectionObserver((entries) => {
      const isIntersecting = entries.some((entry) => entry.isIntersecting);
      if (!isIntersecting) {
        if (!once) {
          this.visible = false;
        }
        return;
      }

      this.reveal();
      if (once) {
        this.observer?.disconnect();
        this.observer = undefined;
      }
    }, this.options.visibility);

    this.observer.observe(this.element);
  }

  private reveal(): void {
    this.visible = true;
    this.element.classList.remove('reel--hidden');

    if (this.queuedValue !== undefined) {
      const next = this.queuedValue;
      this.queuedValue = undefined;
      void this.update(next);
    }
  }

  private render(value: number): void {
    const formatted = formatValue(value, this.options);

    if (this.options.animation === 'count') {
      this.element.textContent = formatted;
      return;
    }

    // Build into a fragment first so each render performs a single DOM replace.
    const fragment = document.createDocumentFragment();
    for (const character of formatted) {
      fragment.append(isDigit(character) ? digitStrip(Number(character)) : glyph(character));
    }

    this.element.replaceChildren(fragment);
  }
}

/**
 * Convenience controller for multiple Reel instances.
 *
 * This is useful for dashboards where several metrics should share the same
 * options and be updated together.
 */
export class ReelGroup {
  /** Managed Reel instances, in the same order as the provided targets. */
  readonly items: Reel[];

  /**
   * Creates a group from any iterable of selectors or HTMLElements.
   */
  constructor(targets: Iterable<ReelTarget>, options: ReelOptions = {}) {
    this.items = Array.from(targets, (target) => new Reel(target, options));
  }

  /**
   * Updates every Reel in the group.
   *
   * Passing one number applies it to all items. Passing an iterable maps values
   * by index and leaves missing entries unchanged.
   */
  update(values: number | Iterable<number>): Promise<void[]> {
    if (typeof values === 'number') {
      return Promise.all(this.items.map((item) => item.update(values)));
    }

    const list = Array.from(values);
    return Promise.all(this.items.map((item, index) => item.update(list[index] ?? item.value)));
  }

  /**
   * Stops all active animations in the group.
   */
  stop(): void {
    for (const item of this.items) item.stop();
  }

  /**
   * Destroys every Reel in the group.
   */
  destroy(): void {
    for (const item of this.items) item.destroy();
  }
}

/**
 * Initializes every element matching a selector.
 *
 * `data-reel-*` attributes are read first, then the supplied options override
 * them. This lets app-level code enforce shared defaults while preserving
 * simple HTML-only demos.
 *
 * @example
 * ```html
 * <span data-reel="12840" data-reel-suffix="+"></span>
 * ```
 *
 * ```ts
 * const reels = initAll();
 * ```
 */
export function initAll(selector = '[data-reel]', options: ReelOptions = {}): Reel[] {
  if (typeof document === 'undefined') return [];

  return Array.from(document.querySelectorAll<HTMLElement>(selector), (element) => {
    const dataOptions = readDataOptions(element);
    return new Reel(element, {
      ...dataOptions,
      ...options
    });
  });
}
