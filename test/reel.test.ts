import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configure, initAll, injectReelCSS, Reel, ReelGroup } from '../src';

describe('Reel', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    configure({
      duration: 0,
      format: ',ddd',
      prefix: '',
      suffix: '',
      animation: 'slide',
      injectCSS: true
    });
  });

  it('initializes from a selector and injects CSS', () => {
    document.body.innerHTML = '<span id="count"></span>';

    const reel = new Reel('#count', { value: 1234 });

    expect(reel.value).toBe(1234);
    expect(document.querySelector('#reel-js-styles')).toBeTruthy();
    expect(document.querySelectorAll('.reel__digit')).toHaveLength(4);
  });

  it('throws for missing selector targets', () => {
    expect(() => new Reel('#missing')).toThrow('target not found');
  });

  it('can run without CSS injection', () => {
    document.body.innerHTML = '<span id="count"></span>';

    new Reel('#count', { injectCSS: false });

    expect(document.querySelector('#reel-js-styles')).toBeNull();
  });

  it('updates values and calls lifecycle callbacks', async () => {
    document.body.innerHTML = '<span id="count"></span>';
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const reel = new Reel('#count', { value: 1, duration: 0, animation: 'count', onStart, onEnd });

    await reel.update(9999);

    expect(reel.value).toBe(9999);
    expect(document.querySelector('#count')?.textContent).toBe('9,999');
    expect(onStart).toHaveBeenCalledOnce();
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('supports Reel.from, updateBy, and set', async () => {
    document.body.innerHTML = '<span id="count"></span>';
    const reel = Reel.from('#count', 100, { animation: 'count', duration: 0 });

    await reel.updateBy(50);
    expect(reel.value).toBe(150);
    expect(document.querySelector('#count')?.textContent).toBe('150');

    reel.set(5);
    expect(reel.value).toBe(5);
    expect(document.querySelector('#count')?.textContent).toBe('5');
  });

  it('calls onUpdate with frame values and progress', async () => {
    document.body.innerHTML = '<span id="count"></span>';
    const onUpdate = vi.fn();
    const reel = new Reel('#count', { animation: 'count', duration: 0, onUpdate });

    await reel.update(25);

    expect(onUpdate).toHaveBeenCalledWith(25, 1);
  });

  it('renders formatter and compact notation options', () => {
    document.body.innerHTML = '<span id="intl"></span><span id="compact"></span>';

    new Reel('#intl', {
      value: 1200,
      animation: 'count',
      formatter: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      })
    });
    new Reel('#compact', { value: 1200000, animation: 'count', notation: 'compact' });

    expect(document.querySelector('#intl')?.textContent).toBe('$1,200');
    expect(document.querySelector('#compact')?.textContent).toBe('1.2M');
  });

  it('respects reduced motion when requested', async () => {
    document.body.innerHTML = '<span id="count"></span>';
    const originalMatchMedia = globalThis.matchMedia;
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const onUpdate = vi.fn();
    const reel = new Reel('#count', { animation: 'count', duration: 1000, onUpdate });

    await reel.update(10);

    expect(onUpdate).toHaveBeenCalledWith(10, 1);
    globalThis.matchMedia = originalMatchMedia;
  });

  it('rejects invalid update values', async () => {
    document.body.innerHTML = '<span id="count"></span>';
    const reel = new Reel('#count');

    await expect(reel.update(Number.POSITIVE_INFINITY)).rejects.toThrow(TypeError);
  });

  it('rejects invalid relative update values', async () => {
    document.body.innerHTML = '<span id="count"></span>';
    const reel = new Reel('#count');

    await expect(reel.updateBy(Number.NaN)).rejects.toThrow(TypeError);
  });

  it('restores DOM on destroy', () => {
    document.body.innerHTML = '<span id="count" class="metric">42</span>';
    const reel = new Reel('#count', { value: 42 });

    reel.destroy();

    const element = document.querySelector('#count');
    expect(element?.innerHTML).toBe('42');
    expect(element?.className).toBe('metric');
  });

  it('initializes all data-reel elements', () => {
    document.body.innerHTML = `
      <span data-reel="1000" data-reel-prefix="$"></span>
      <span data-reel="2500" data-reel-animation="count"></span>
    `;

    const reels = initAll();

    expect(reels).toHaveLength(2);
    expect(reels[0]?.value).toBe(1000);
    expect(reels[1]?.value).toBe(2500);
  });

  it('reveals immediately when IntersectionObserver is unavailable', () => {
    document.body.innerHTML = '<span id="count"></span>';
    const reel = new Reel('#count', { startOnVisible: true, value: 12 });

    expect(document.querySelector('#count')?.classList.contains('reel--hidden')).toBe(false);
    expect(reel.value).toBe(12);
  });

  it('passes visibility options to IntersectionObserver', () => {
    document.body.innerHTML = '<span id="count"></span>';
    const observe = vi.fn();
    const disconnect = vi.fn();
    const originalObserver = globalThis.IntersectionObserver;
    const observer = vi.fn().mockImplementation(() => ({ observe, disconnect }));
    globalThis.IntersectionObserver = observer;

    new Reel('#count', {
      startOnVisible: true,
      visibility: {
        once: false,
        rootMargin: '0px 0px -20% 0px',
        threshold: 0.5
      }
    });

    expect(observer).toHaveBeenCalledWith(expect.any(Function), {
      once: false,
      rootMargin: '0px 0px -20% 0px',
      threshold: 0.5
    });
    expect(observe).toHaveBeenCalledWith(document.querySelector('#count'));
    globalThis.IntersectionObserver = originalObserver;
  });

  it('updates groups together', async () => {
    document.body.innerHTML = '<span class="count"></span><span class="count"></span>';
    const elements = document.querySelectorAll<HTMLElement>('.count');
    const group = new ReelGroup(elements, { animation: 'count', duration: 0 });

    await group.update([10, 20]);

    expect(group.items.map((item) => item.value)).toEqual([10, 20]);
  });
});

describe('injectReelCSS', () => {
  it('only injects styles once', () => {
    injectReelCSS();
    injectReelCSS();

    expect(document.querySelectorAll('#reel-js-styles')).toHaveLength(1);
  });
});
