export { animateNumber, easingPresets, resolveEasing } from './animation/animate';
export { ReelGroup } from './core/group';
export { configure, initAll, Reel } from './core/reel';
export {
  formatNumber,
  getGroupSeparator,
  inferDecimalSeparator
} from './format/format';
export { parseNumericValue } from './format/parse';
export { injectReelCSS, reelCSS } from './styles/inject';
export type {
  AnimateNumberOptions,
  AnimationControls,
  EasingFunction,
  EasingPreset,
  FormatOptions,
  ReelAnimation,
  ReelFormatter,
  ReelNotation,
  ReelOptions,
  ReelTarget,
  ReelTheme,
  ReelVisibilityOptions
} from './types';
