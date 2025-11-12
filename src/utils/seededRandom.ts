/**
 * Seeded Random Number Generator
 * Based on Java's java.util.Random implementation
 * Used to generate deterministic maps from seeds in Slay the Spire
 */

export class SeededRandom {
  private seed: number;
  private readonly multiplier = 0x5DEECE66D;
  private readonly addend = 0xB;
  private readonly mask = (1 << 48) - 1;

  constructor(seed: number | string) {
    // Convert string seed to number if needed
    const numericSeed = typeof seed === 'string'
      ? this.hashString(seed)
      : seed;

    this.seed = (numericSeed ^ this.multiplier) & this.mask;
  }

  /**
   * Hash a string into a numeric seed
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate next pseudo-random value
   */
  private next(bits: number): number {
    this.seed = (this.seed * this.multiplier + this.addend) & this.mask;
    return this.seed >>> (48 - bits);
  }

  /**
   * Returns a pseudo-random integer between 0 (inclusive) and bound (exclusive)
   */
  nextInt(bound?: number): number {
    if (bound === undefined) {
      return this.next(32);
    }

    if (bound <= 0) {
      throw new Error('bound must be positive');
    }

    // Power of 2 optimization
    if ((bound & -bound) === bound) {
      return Math.floor((bound * this.next(31)) / (1 << 31));
    }

    let bits, val;
    do {
      bits = this.next(31);
      val = bits % bound;
    } while (bits - val + (bound - 1) < 0);

    return val;
  }

  /**
   * Returns a pseudo-random float between 0.0 (inclusive) and 1.0 (exclusive)
   */
  nextFloat(): number {
    return this.next(24) / (1 << 24);
  }

  /**
   * Returns a pseudo-random boolean
   */
  nextBoolean(): boolean {
    return this.next(1) !== 0;
  }

  /**
   * Shuffle an array in-place using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Pick a random element from an array
   */
  choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    return array[this.nextInt(array.length)];
  }
}
