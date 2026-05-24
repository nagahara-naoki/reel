# reel.js

[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)
[![ESM](https://img.shields.io/badge/ESM-ready-4b32c3)](https://nodejs.org/api/esm.html)
[![Bundle target](https://img.shields.io/badge/gzip-%3C%203KB-0a7)](#bundle-size)

The odometer animation library you know — reborn in TypeScript + ESM.

`reel.js` gives dashboards, landing pages, and admin UIs a lightweight rolling number animation with no jQuery, no required CSS import, and first-class TypeScript types.

## Demo

Run the polished demo site locally:

```bash
pnpm install
pnpm build
open examples/index.html
```

The demo keeps code and animated output side by side, then links to simple, advanced, framework,
and odometer migration examples.

## Install

```bash
pnpm add reel.js
```

```bash
npm install reel.js
```

## Quick Start

```ts
import { Reel } from 'reel.js';

const reel = new Reel('#count', {
  value: 1000,
  duration: 900,
  format: ',ddd',
  prefix: '$',
  suffix: '+'
});

await reel.update(9999);
```

For the shortest constructor form:

```ts
const reel = Reel.from('#count', 1000, { prefix: '$' });
```

You can also initialize from an element:

```ts
const element = document.querySelector('#count') as HTMLElement;
const reel = new Reel(element, { value: 2500 });
```

## Data Attribute Mode

```html
<span data-reel="12840" data-reel-suffix="+" data-reel-duration="900"></span>
```

```ts
import { initAll } from 'reel.js';

const reels = initAll();
```

## API

```ts
interface ReelOptions {
  value?: number;
  duration?: number;
  format?: string;
  decimals?: number;
  decimalSeparator?: string;
  notation?: 'standard' | 'compact';
  formatter?: Intl.NumberFormat | ((value: number) => string);
  animation?: 'slide' | 'count';
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | ((progress: number) => number);
  prefix?: string;
  suffix?: string;
  injectCSS?: boolean;
  theme?: 'default' | 'car' | 'minimal' | string;
  startOnVisible?: boolean;
  visibility?: {
    once?: boolean;
    rootMargin?: string;
    threshold?: number | number[];
  };
  respectReducedMotion?: boolean;
  auto?: boolean;
  onStart?: () => void;
  onUpdate?: (value: number, progress: number) => void;
  onEnd?: () => void;
}
```

### `Reel.from(target, value, options?)`

Creates a Reel with a short value-first API:

```ts
const reel = Reel.from('#count', 1000, { prefix: '$' });
```

### `new Reel(target, options)`

Creates a single animated number reel. `target` can be a CSS selector or an `HTMLElement`.

### `reel.update(value)`

Updates the value and returns a `Promise<void>` that resolves when the animation completes.

### `reel.updateBy(delta)`

Animates by a relative delta:

```ts
await reel.updateBy(250);
await reel.updateBy(-10);
```

### `reel.set(value)`

Sets the value immediately without animation callbacks:

```ts
reel.set(0);
```

### `reel.stop()`

Stops the current animation.

### `reel.destroy()`

Restores the element to its original content and classes.

### `initAll(selector = '[data-reel]', options?)`

Initializes every matching element and returns `Reel[]`.

### `configure(options)`

Sets global defaults for future instances.

### `ReelGroup`

Controls multiple reels together:

```ts
import { ReelGroup } from 'reel.js';

const group = new ReelGroup(document.querySelectorAll('.stat'), { duration: 800 });
await group.update([1200, 4300, 9800]);
```

## Formatting

```ts
new Reel('#comma', { value: 1000000, format: ',ddd' }); // 1,000,000
new Reel('#dot', { value: 1000000, format: '.ddd' }); // 1.000.000
new Reel('#plain', { value: 1000000, format: 'ddd' }); // 1000000
new Reel('#money', { value: 1234.5, decimals: 2, prefix: '$' }); // $1,234.50
new Reel('#compact', { value: 1200000, notation: 'compact' }); // 1.2M
new Reel('#intl', {
  value: 1200,
  formatter: new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  })
}); // ￥1,200
```

When `formatter` is provided, it takes precedence over `format`, `decimals`, `prefix`, `suffix`,
and `notation`.

## Visibility And Motion

```ts
new Reel('#count', {
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

`respectReducedMotion` defaults to `true`, so users with `prefers-reduced-motion: reduce` receive
the final value without a long animation.

## CSS

By default, reel.js injects the minimal runtime CSS automatically.

If you want to ship your own styles:

```ts
new Reel('#count', {
  value: 1000,
  injectCSS: false
});
```

Then import the bundled stylesheet or copy it into your own CSS:

```ts
import 'reel.js/style.css';
```

## Migration From HubSpot/odometer

```ts
// Before
const odometer = new Odometer({ el, value: 1000 });
odometer.update(9999);

// After
import { Reel } from 'reel.js';

const reel = new Reel(el, { value: 1000 });
await reel.update(9999);
```

Key differences:

- TypeScript types are bundled.
- ESM and CommonJS outputs are both included.
- No jQuery or AMD compatibility layer.
- CSS is injected by default, with `injectCSS: false` for custom styling.

## Bundle Size

The build checks that `dist/index.js` is under 3KB gzip:

```bash
pnpm build
```

## Development

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

Open `examples/index.html` after running `pnpm build` to view the polished demo site.
The examples are split by difficulty:

- Simple: `examples/simple.html`, `examples/markup-only.html`
- Intermediate: `examples/vite.ts`, `examples/showcase.html`
- Advanced: `examples/advanced.html`, `examples/odometer-comparison.html`
- Framework adapters: `examples/frameworks/react.tsx`, `examples/frameworks/vue.vue`,
  `examples/frameworks/svelte.svelte`

For more guided usage, see `docs/USAGE.md`.
