import type { ReelOptions, ReelTarget } from '../types';
import { Reel } from './reel';

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
