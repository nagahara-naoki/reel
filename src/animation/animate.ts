import type {
  AnimateNumberOptions,
  AnimationControls,
  EasingFunction,
  EasingPreset
} from '../types';

/**
 * Small easing table kept dependency-free for bundle size and predictable output.
 */
export const easingPresets: Record<EasingPreset, EasingFunction> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => 1 - (1 - t) * (1 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
};

/**
 * Resolves the active high-resolution clock while keeping tests and non-browser
 * runtimes functional.
 */
function now(): number {
  return globalThis.performance?.now?.() ?? Date.now();
}

/**
 * requestAnimationFrame wrapper with a timeout fallback for SSR-like test environments.
 */
function raf(callback: FrameRequestCallback): number {
  return (
    globalThis.requestAnimationFrame?.(callback) ?? globalThis.setTimeout(() => callback(now()), 16)
  );
}

/**
 * Cancels frames created by {@link raf}, including the timeout fallback path.
 */
function caf(id: number): void {
  if (globalThis.cancelAnimationFrame) {
    globalThis.cancelAnimationFrame(id);
    return;
  }

  globalThis.clearTimeout(id);
}

/**
 * Converts a built-in easing name or user-supplied easing callback into a function.
 */
export function resolveEasing(easing: EasingPreset | EasingFunction = 'ease-out'): EasingFunction {
  return typeof easing === 'function'
    ? easing
    : (easingPresets[easing] ?? easingPresets['ease-out']);
}

/**
 * Interpolates one number to another using requestAnimationFrame.
 *
 * This is intentionally DOM-agnostic so framework adapters and tests can reuse
 * the same animation core without depending on Reel's markup renderer.
 */
export function animateNumber(options: AnimateNumberOptions): AnimationControls {
  const easing = resolveEasing(options.easing);
  const duration = Math.max(0, options.duration);
  const from = options.from;
  const delta = options.to - from;
  let frame = 0;
  let settled = false;
  let rejectPromise: ((error: Error) => void) | undefined;

  const promise = new Promise<void>((resolve, reject) => {
    rejectPromise = reject;

    // Ensure the final value is emitted exactly once, even if the last frame
    // overshoots the duration due to background-tab throttling.
    const finish = () => {
      if (settled) return;
      settled = true;
      options.onUpdate(options.to, 1);
      options.onEnd?.();
      resolve();
    };

    options.onStart?.();

    // Zero-duration and no-op updates still fire lifecycle hooks for consistency
    // with animated updates.
    if (duration === 0 || from === options.to) {
      finish();
      return;
    }

    const start = now();
    const tick: FrameRequestCallback = (timestamp) => {
      if (settled) return;

      const elapsed = Math.max(0, timestamp - start);
      const progress = Math.min(elapsed / duration, 1);
      const eased = easing(progress);
      options.onUpdate(from + delta * eased, progress);

      if (progress >= 1) {
        finish();
        return;
      }

      frame = raf(tick);
    };

    frame = raf(tick);
  });

  return {
    promise,
    stop: () => {
      if (settled) return;
      settled = true;
      caf(frame);
      rejectPromise?.(new Error('Reel animation stopped'));
    }
  };
}
