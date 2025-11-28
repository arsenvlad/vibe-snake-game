/**
 * A seeded pseudo-random number generator using the Mulberry32 algorithm.
 * Provides deterministic random numbers for replay functionality.
 */
export class SeededRandom {
    private state: number;

    constructor(seed: number) {
        this.state = seed;
    }

    /**
     * Get the current seed value
     */
    getSeed(): number {
        return this.state;
    }

    /**
     * Reset the generator with a new seed
     */
    setSeed(seed: number): void {
        this.state = seed;
    }

    /**
     * Generate a random number between 0 and 1 (exclusive)
     * Uses Mulberry32 algorithm for good distribution
     */
    random(): number {
        let t = this.state += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    /**
     * Generate a random integer between 0 (inclusive) and max (exclusive)
     */
    randomInt(max: number): number {
        return Math.floor(this.random() * max);
    }

    /**
     * Generate a new seed based on current time
     */
    static generateSeed(): number {
        return Date.now() ^ (Math.random() * 0xFFFFFFFF);
    }
}
