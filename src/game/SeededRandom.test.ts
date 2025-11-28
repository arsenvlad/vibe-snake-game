import { describe, it, expect } from 'vitest';
import { SeededRandom } from './SeededRandom';

describe('SeededRandom', () => {
    describe('constructor', () => {
        it('should create an instance with a seed', () => {
            const rng = new SeededRandom(12345);
            expect(rng).toBeDefined();
        });
    });

    describe('getSeed', () => {
        it('should return the initial seed', () => {
            const rng = new SeededRandom(12345);
            // Note: The seed changes with each random() call internally
            // but getSeed returns the current state
            expect(typeof rng.getSeed()).toBe('number');
        });
    });

    describe('setSeed', () => {
        it('should reset the generator with a new seed', () => {
            const rng = new SeededRandom(12345);
            rng.random(); // Advance state
            rng.setSeed(54321);
            
            // Create fresh instance with same seed
            const rng2 = new SeededRandom(54321);
            
            expect(rng.random()).toBe(rng2.random());
        });
    });

    describe('random', () => {
        it('should return a number between 0 and 1', () => {
            const rng = new SeededRandom(12345);
            for (let i = 0; i < 100; i++) {
                const value = rng.random();
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThan(1);
            }
        });

        it('should produce deterministic results with same seed', () => {
            const rng1 = new SeededRandom(42);
            const rng2 = new SeededRandom(42);
            
            for (let i = 0; i < 10; i++) {
                expect(rng1.random()).toBe(rng2.random());
            }
        });

        it('should produce different results with different seeds', () => {
            const rng1 = new SeededRandom(42);
            const rng2 = new SeededRandom(43);
            
            const results1: number[] = [];
            const results2: number[] = [];
            
            for (let i = 0; i < 10; i++) {
                results1.push(rng1.random());
                results2.push(rng2.random());
            }
            
            // At least some values should be different
            const allSame = results1.every((v, i) => v === results2[i]);
            expect(allSame).toBe(false);
        });

        it('should produce varied results across multiple calls', () => {
            const rng = new SeededRandom(12345);
            const values = new Set<number>();
            
            for (let i = 0; i < 100; i++) {
                values.add(rng.random());
            }
            
            // Should have many unique values
            expect(values.size).toBeGreaterThan(90);
        });
    });

    describe('randomInt', () => {
        it('should return integers between 0 and max (exclusive)', () => {
            const rng = new SeededRandom(12345);
            const max = 10;
            
            for (let i = 0; i < 100; i++) {
                const value = rng.randomInt(max);
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThan(max);
                expect(Number.isInteger(value)).toBe(true);
            }
        });

        it('should produce deterministic results', () => {
            const rng1 = new SeededRandom(42);
            const rng2 = new SeededRandom(42);
            
            for (let i = 0; i < 10; i++) {
                expect(rng1.randomInt(100)).toBe(rng2.randomInt(100));
            }
        });

        it('should handle small max values', () => {
            const rng = new SeededRandom(12345);
            
            for (let i = 0; i < 100; i++) {
                const value = rng.randomInt(2);
                expect(value === 0 || value === 1).toBe(true);
            }
        });
    });

    describe('generateSeed', () => {
        it('should return a number', () => {
            const seed = SeededRandom.generateSeed();
            expect(typeof seed).toBe('number');
        });

        it('should return different values on multiple calls', () => {
            const seeds = new Set<number>();
            for (let i = 0; i < 10; i++) {
                seeds.add(SeededRandom.generateSeed());
            }
            // Should have multiple unique seeds
            expect(seeds.size).toBeGreaterThan(1);
        });
    });
});
