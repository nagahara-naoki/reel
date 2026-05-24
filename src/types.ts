/**
 * A target accepted by {@link Reel}. Strings are resolved with `document.querySelector`.
 */
export type ReelTarget = string | HTMLElement;

/**
 * Animation strategy used when rendering a number.
 *
 * - `slide`: builds per-digit reels that visually roll into place.
 * - `count`: updates text content directly while still using requestAnimationFrame.
 */
export type ReelAnimation = 'slide' | 'count';

/**
 * Number notation mode used by Reel's built-in formatter.
 */
export type ReelNotation = 'standard' | 'compact';

/**
 * Built-in theme names. Custom string values are accepted so applications can
 * attach their own `data-theme` styles without losing autocomplete for defaults.
 */
export type ReelTheme = 'default' | 'car' | 'minimal' | (string & {});

/**
 * Built-in easing curves supported by the animation engine.
 */
export type EasingPreset = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

/**
 * Receives a progress value from 0 to 1 and returns an eased progress value.
 */
export type EasingFunction = (progress: number) => number;

/**
 * Custom formatter support. `Intl.NumberFormat` is accepted directly so apps can
 * reuse locale-aware currency, compact, and unit formatters.
 */
export type ReelFormatter = Intl.NumberFormat | ((value: number) => string);

/**
 * IntersectionObserver options used when `startOnVisible` is enabled.
 */
export interface ReelVisibilityOptions {
  /** Disconnect the observer after the first reveal. Defaults to `true`. */
  once?: boolean;
  /** Passed to IntersectionObserver. Useful for starting before a card fully enters view. */
  rootMargin?: string;
  /** Passed to IntersectionObserver. */
  threshold?: number | number[];
}

/**
 * Public options for a single {@link Reel} instance.
 */
export interface ReelOptions {
  /** Initial numeric value. Defaults to `0`. */
  value?: number;
  /** Animation duration in milliseconds. Defaults to `500`. */
  duration?: number;
  /**
   * Grouping pattern for the integer part.
   *
   * Examples:
   * - `,ddd` -> `1,000,000`
   * - `.ddd` -> `1.000.000`
   * - `ddd` or `none` -> `1000000`
   */
  format?: string;
  /** Fixed number of fraction digits. When omitted, the input precision is preserved. */
  decimals?: number;
  /** Decimal separator. Defaults to `,` when `format` uses `.` grouping, otherwise `.`. */
  decimalSeparator?: string;
  /** Built-in notation mode. `compact` renders values like `1.2K`, `1.2M`, and `1.2B`. */
  notation?: ReelNotation;
  /** Locale-aware or custom formatter. When set, this takes precedence over built-in formatting. */
  formatter?: ReelFormatter;
  /** Visual animation strategy. Defaults to `slide`. */
  animation?: ReelAnimation;
  /** Built-in easing name or custom easing function. Defaults to `ease-out`. */
  easing?: EasingPreset | EasingFunction;
  /** Text rendered before the formatted number, for example `$`. */
  prefix?: string;
  /** Text rendered after the formatted number, for example `+` or `円`. */
  suffix?: string;
  /** Inject the minimal runtime CSS into the document head. Defaults to `true`. */
  injectCSS?: boolean;
  /** Theme name written to `data-theme`. Defaults to `default`. */
  theme?: ReelTheme;
  /** Delay queued updates until the element first enters the viewport. */
  startOnVisible?: boolean;
  /** Fine-grained IntersectionObserver options for `startOnVisible`. */
  visibility?: ReelVisibilityOptions;
  /** Respect `prefers-reduced-motion: reduce` by rendering updates with zero duration. */
  respectReducedMotion?: boolean;
  /** Reserved for framework wrappers that want to preserve user intent in options. */
  auto?: boolean;
  /** Called when an update animation starts. */
  onStart?: () => void;
  /** Called for each animated frame with the interpolated value and linear progress. */
  onUpdate?: (value: number, progress: number) => void;
  /** Called after an update animation reaches its final rendered value. */
  onEnd?: () => void;
}

/**
 * Fully-resolved options used internally after defaults and global config merge.
 */
export interface ResolvedReelOptions {
  value: number;
  duration: number;
  format: string;
  decimals?: number;
  decimalSeparator: string;
  notation?: ReelNotation;
  formatter?: ReelFormatter;
  animation: ReelAnimation;
  easing: EasingPreset | EasingFunction;
  prefix: string;
  suffix: string;
  injectCSS: boolean;
  theme: ReelTheme;
  startOnVisible: boolean;
  visibility?: ReelVisibilityOptions;
  respectReducedMotion?: boolean;
  auto: boolean;
  onStart?: () => void;
  onUpdate?: (value: number, progress: number) => void;
  onEnd?: () => void;
}

/**
 * Options accepted by {@link formatNumber}.
 */
export interface FormatOptions {
  format?: string;
  decimals?: number;
  decimalSeparator?: string;
  notation?: ReelNotation;
  formatter?: ReelFormatter;
  prefix?: string;
  suffix?: string;
}

/**
 * Controls returned by the low-level animation helper.
 */
export interface AnimationControls {
  /** Resolves when the animation completes and rejects when it is stopped. */
  promise: Promise<void>;
  /** Stops the active animation and rejects {@link AnimationControls.promise}. */
  stop: () => void;
}

/**
 * Options for the requestAnimationFrame-based number interpolation helper.
 */
export interface AnimateNumberOptions {
  /** Start value for interpolation. */
  from: number;
  /** End value for interpolation. */
  to: number;
  /** Animation duration in milliseconds. */
  duration: number;
  /** Built-in easing name or custom easing function. */
  easing?: EasingPreset | EasingFunction;
  /** Receives the current interpolated value and linear progress on each frame. */
  onUpdate: (value: number, progress: number) => void;
  /** Called before the first update frame. */
  onStart?: () => void;
  /** Called once the final value has been emitted. */
  onEnd?: () => void;
}
