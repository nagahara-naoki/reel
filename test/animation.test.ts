import { describe, expect, it, vi } from 'vitest';
import { animateNumber, resolveEasing } from '../src';

describe('resolveEasing', () => {
  it('returns preset easing functions', () => {
    expect(resolveEasing('linear')(0.5)).toBe(0.5);
    expect(resolveEasing('ease-in')(0.5)).toBe(0.25);
  });

  it('accepts custom easing functions', () => {
    const custom = (value: number) => value;
    expect(resolveEasing(custom)).toBe(custom);
  });

  it('falls back to ease-out for unknown preset values', () => {
    expect(resolveEasing('unknown' as never)(1)).toBe(1);
  });
});

describe('animateNumber', () => {
  it('finishes immediately for zero-duration animations', async () => {
    const updates: number[] = [];

    await animateNumber({
      from: 0,
      to: 10,
      duration: 0,
      onUpdate: (value) => updates.push(value)
    }).promise;

    expect(updates.at(-1)).toBe(10);
  });

  it('finishes immediately when the value is unchanged', async () => {
    const onStart = vi.fn();
    const onEnd = vi.fn();

    await animateNumber({
      from: 10,
      to: 10,
      duration: 1000,
      onStart,
      onEnd,
      onUpdate: () => undefined
    }).promise;

    expect(onStart).toHaveBeenCalledOnce();
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('can stop an active animation', async () => {
    vi.useFakeTimers();
    const controls = animateNumber({
      from: 0,
      to: 10,
      duration: 1000,
      onUpdate: () => undefined
    });

    controls.stop();

    await expect(controls.promise).rejects.toThrow('stopped');
    vi.useRealTimers();
  });
});
