export const REEL_STYLE_ID = 'reel-js-styles';

/**
 * Minimal runtime CSS used when `injectCSS` is enabled.
 *
 * The CSS is kept in one minifier-friendly string because it is bundled into the
 * JS entry and guarded by the 3KB gzip target in CI.
 */
export const reelCSS = `.reel{display:inline-flex;white-space:nowrap}.reel[data-theme=car]{font-family:ui-monospace,monospace;padding:.08em .18em;border-radius:.18em;background:#111;color:#fff}.reel__digit{position:relative;display:inline-block;width:.62em;height:1em;overflow:hidden}.reel__strip{position:absolute;left:0;top:0;display:flex;flex-direction:column;transform:translate3d(0,0,0)}.reel__number{height:1em;line-height:1;text-align:center}.reel--count .reel__digit{width:auto;overflow:visible}.reel--count .reel__strip{position:static;display:inline;transform:none!important}.reel--hidden{visibility:hidden}`;

/**
 * Injects Reel's CSS into the current document once.
 *
 * The guard makes repeated `new Reel(...)` calls cheap and prevents duplicate
 * style tags when apps mount, unmount, and remount UI trees.
 */
export function injectReelCSS(): void {
  if (typeof document === 'undefined' || document.getElementById(REEL_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = REEL_STYLE_ID;
  style.textContent = reelCSS;
  document.head.append(style);
}
