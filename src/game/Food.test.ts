import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Food } from './Food';

describe('Food', () => {
    const gridWidth = 20;
    const gridHeight = 20;
    let food: Food;

    beforeEach(() => {
        food = new Food(gridWidth, gridHeight);
    });

    describe('constructor', () => {
        it('should initialize with correct grid dimensions', () => {
            expect(food.gridWidth).toBe(gridWidth);
            expect(food.gridHeight).toBe(gridHeight);
        });

        it('should have initial position within grid bounds', () => {
            expect(food.x).toBeGreaterThanOrEqual(0);
            expect(food.x).toBeLessThan(gridWidth);
            expect(food.y).toBeGreaterThanOrEqual(0);
            expect(food.y).toBeLessThan(gridHeight);
        });
    });

    describe('randomize', () => {
        it('should place food within grid bounds', () => {
            for (let i = 0; i < 100; i++) {
                food.randomize();
                expect(food.x).toBeGreaterThanOrEqual(0);
                expect(food.x).toBeLessThan(gridWidth);
                expect(food.y).toBeGreaterThanOrEqual(0);
                expect(food.y).toBeLessThan(gridHeight);
            }
        });

        it('should change position (statistically)', () => {
            const positions = new Set<string>();
            for (let i = 0; i < 50; i++) {
                food.randomize();
                positions.add(`${food.x},${food.y}`);
            }
            // Should have more than 1 unique position after 50 randomizations
            expect(positions.size).toBeGreaterThan(1);
        });
    });

    describe('respawn', () => {
        it('should avoid snake segments', () => {
            const snakeSegments = [
                { x: 5, y: 5 },
                { x: 4, y: 5 },
                { x: 3, y: 5 }
            ];

            for (let i = 0; i < 50; i++) {
                food.respawn(snakeSegments);
                const overlapsSnake = snakeSegments.some(
                    segment => segment.x === food.x && segment.y === food.y
                );
                expect(overlapsSnake).toBe(false);
            }
        });

        it('should find valid position when most grid is occupied', () => {
            // Create a snake that occupies almost all positions
            const snakeSegments: { x: number; y: number }[] = [];
            for (let x = 0; x < gridWidth; x++) {
                for (let y = 0; y < gridHeight; y++) {
                    // Leave only position (0, 0) available
                    if (x !== 0 || y !== 0) {
                        snakeSegments.push({ x, y });
                    }
                }
            }

            // Mock Math.random to always return 0 (so it picks (0,0))
            vi.spyOn(Math, 'random').mockReturnValue(0);
            
            food.respawn(snakeSegments);
            
            expect(food.x).toBe(0);
            expect(food.y).toBe(0);
            
            vi.restoreAllMocks();
        });

        it('should work with empty snake segments', () => {
            food.respawn([]);
            expect(food.x).toBeGreaterThanOrEqual(0);
            expect(food.x).toBeLessThan(gridWidth);
            expect(food.y).toBeGreaterThanOrEqual(0);
            expect(food.y).toBeLessThan(gridHeight);
        });

        it('should avoid obstacle positions', () => {
            const snakeSegments = [
                { x: 5, y: 5 },
                { x: 4, y: 5 },
                { x: 3, y: 5 }
            ];
            const obstaclePositions = [
                { x: 10, y: 10 },
                { x: 11, y: 10 },
                { x: 12, y: 10 }
            ];

            for (let i = 0; i < 50; i++) {
                food.respawn(snakeSegments, obstaclePositions);
                const overlapsSnake = snakeSegments.some(
                    segment => segment.x === food.x && segment.y === food.y
                );
                const overlapsObstacle = obstaclePositions.some(
                    obs => obs.x === food.x && obs.y === food.y
                );
                expect(overlapsSnake).toBe(false);
                expect(overlapsObstacle).toBe(false);
            }
        });

        it('should find position when avoiding both snake and obstacles', () => {
            // Create a sparse occupation
            const snakeSegments = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 2, y: 0 }
            ];
            const obstaclePositions = [
                { x: 0, y: 1 },
                { x: 1, y: 1 }
            ];

            food.respawn(snakeSegments, obstaclePositions);
            
            // Should find a valid position
            const overlapsSnake = snakeSegments.some(
                segment => segment.x === food.x && segment.y === food.y
            );
            const overlapsObstacle = obstaclePositions.some(
                obs => obs.x === food.x && obs.y === food.y
            );
            expect(overlapsSnake).toBe(false);
            expect(overlapsObstacle).toBe(false);
        });
    });
});
