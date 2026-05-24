# reel.js usage guide

This guide mirrors the demo site and gives copy-pasteable examples for common use cases.

## Smallest JavaScript setup

```html
<span id="count"></span>
```

```ts
import { Reel } from 'reel.js';

const count = Reel.from('#count', 1000, {
  prefix: '$',
  duration: 800
});

await count.update(9999);
```

Use this when you need one animated number and want the shortest path to a working result.

## HTML-first setup

```html
<span data-reel="12840" data-reel-suffix="+" data-reel-duration="900"></span>
```

```ts
import { initAll } from 'reel.js';

const reels = initAll();
```

This is the closest mental model to odometer's markup-first usage, but initialization remains
explicit and framework-friendly.

## Dashboard formatting

```ts
new Reel('#revenue', {
  value: 735000,
  prefix: '$',
  theme: 'car'
});

new Reel('#users', {
  value: 1200000,
  notation: 'compact',
  suffix: '+'
});

new Reel('#price', {
  value: 9800,
  formatter: new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  })
});
```

`formatter` takes precedence over Reel's built-in `format`, `prefix`, `suffix`, and `notation`
options. Use it when locale correctness matters.

## Animation lifecycle

```ts
const reel = new Reel('#count', {
  value: 0,
  onStart: () => {
    button.disabled = true;
  },
  onUpdate: (value, progress) => {
    progressBar.value = progress;
  },
  onEnd: () => {
    button.disabled = false;
  }
});

await reel.update(1000);
```

`update()` returns a promise, so you can coordinate animations with UI state or other async work.

## Relative and immediate updates

```ts
await reel.updateBy(250);
await reel.updateBy(-10);

reel.set(0);
```

Use `updateBy()` for counters, carts, scores, and notifications. Use `set()` for resets and state
sync where animation would be distracting.

## Multiple metrics

```ts
import { ReelGroup } from 'reel.js';

const group = new ReelGroup(document.querySelectorAll('.metric'), {
  animation: 'count',
  notation: 'compact'
});

await group.update([1200, 2400000, 73]);
```

Passing fewer values than items leaves missing entries unchanged.

## Visibility and reduced motion

```ts
new Reel('#below-fold', {
  value: 1000,
  startOnVisible: true,
  visibility: {
    once: true,
    rootMargin: '0px 0px -20% 0px',
    threshold: 0.4
  },
  respectReducedMotion: true
});
```

`respectReducedMotion` defaults to true. Users who prefer reduced motion receive the final value
without a long rolling animation.

## Framework lifecycle

The core package has no React, Vue, or Svelte dependency. Use the wrapper examples in
`examples/frameworks/`:

- Create `new Reel(element, { value, ...options })` on mount.
- Call `reel.update(value)` when the value prop changes.
- Call `reel.destroy()` on unmount.

## Source layout

The public entry files stay at the source root:

```txt
src/
├── index.ts
├── index.css
├── animation/
│   └── animate.ts
├── core/
│   ├── group.ts
│   └── reel.ts
├── format/
│   ├── format.ts
│   └── parse.ts
├── styles/
│   └── inject.ts
└── types/
    └── index.ts
```

`src/index.ts` is the public API surface. `src/index.css` is the stylesheet users can import when
they set `injectCSS: false`.
