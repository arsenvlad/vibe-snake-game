import { describe, it, expect, beforeEach } from 'vitest';
import { Snake } from './Snake';

describe('Snake', () => {
    let snake: Snake;
    const gridWidth = 20;
    const gridHeight = 20;

    beforeEach(() => {
        snake = new Snake(gridWidth, gridHeight);
    });

    describe('constructor', () => {
        it('should initialize with correct grid dimensions', () => {
            expect(snake.gridWidth).toBe(gridWidth);
            expect(snake.gridHeight).toBe(gridHeight);
        });

        it('should start with 3 segments', () => {
            expect(snake.segments).toHaveLength(3);
        });

        it('should start at position (5,5) for head', () => {
            expect(snake.head).toEqual({ x: 5, y: 5 });
        });

        it('should start moving right (positive x direction)', () => {
            expect(snake.direction).toEqual({ x: 1, y: 0 });
        });

        it('should not be growing initially', () => {
            expect(snake.growing).toBe(false);
        });
    });

    describe('setDirection', () => {
        it('should change direction when valid', () => {
            snake.setDirection({ x: 0, y: -1 }); // UP
            expect(snake.nextDirection).toEqual({ x: 0, y: -1 });
        });

        it('should prevent 180 degree turn (right to left)', () => {
            // Initial direction is right (1, 0)
            snake.setDirection({ x: -1, y: 0 }); // Try to go left
            expect(snake.nextDirection).toEqual({ x: 1, y: 0 }); // Should stay right
        });

        it('should prevent 180 degree turn (up to down)', () => {
            snake.setDirection({ x: 0, y: -1 }); // Set direction to UP
            snake.move(); // Apply the direction change
            snake.setDirection({ x: 0, y: 1 }); // Try to go DOWN
            expect(snake.nextDirection).toEqual({ x: 0, y: -1 }); // Should stay UP
        });

        it('should allow 90 degree turns', () => {
            snake.setDirection({ x: 0, y: -1 }); // UP from RIGHT is valid
            expect(snake.nextDirection).toEqual({ x: 0, y: -1 });

            snake.setDirection({ x: 0, y: 1 }); // DOWN from UP/RIGHT is valid before move
            expect(snake.nextDirection).toEqual({ x: 0, y: 1 });
        });
    });

    describe('move', () => {
        it('should move head in current direction', () => {
            const initialHead = { ...snake.head };
            snake.move();
            expect(snake.head.x).toBe(initialHead.x + 1);
            expect(snake.head.y).toBe(initialHead.y);
        });

        it('should maintain same length when not growing', () => {
            const initialLength = snake.segments.length;
            snake.move();
            expect(snake.segments.length).toBe(initialLength);
        });

        it('should apply nextDirection on move', () => {
            snake.setDirection({ x: 0, y: -1 }); // UP
            snake.move();
            expect(snake.direction).toEqual({ x: 0, y: -1 });
        });
    });

    describe('grow', () => {
        it('should set growing flag', () => {
            snake.grow();
            expect(snake.growing).toBe(true);
        });

        it('should increase length by 1 after next move', () => {
            const initialLength = snake.segments.length;
            snake.grow();
            snake.move();
            expect(snake.segments.length).toBe(initialLength + 1);
        });

        it('should reset growing flag after move', () => {
            snake.grow();
            snake.move();
            expect(snake.growing).toBe(false);
        });
    });

    describe('checkCollision', () => {
        describe('wall collision', () => {
            it('should detect left wall collision', () => {
                // Move snake to left wall
                snake.segments[0] = { x: -1, y: 5 };
                expect(snake.checkCollision()).toBe(true);
            });

            it('should detect right wall collision', () => {
                snake.segments[0] = { x: gridWidth, y: 5 };
                expect(snake.checkCollision()).toBe(true);
            });

            it('should detect top wall collision', () => {
                snake.segments[0] = { x: 5, y: -1 };
                expect(snake.checkCollision()).toBe(true);
            });

            it('should detect bottom wall collision', () => {
                snake.segments[0] = { x: 5, y: gridHeight };
                expect(snake.checkCollision()).toBe(true);
            });

            it('should not detect collision at valid edge position', () => {
                snake.segments[0] = { x: 0, y: 0 };
                expect(snake.checkCollision()).toBe(false);

                snake.segments[0] = { x: gridWidth - 1, y: gridHeight - 1 };
                expect(snake.checkCollision()).toBe(false);
            });
        });

        describe('self collision', () => {
            it('should detect when head hits body', () => {
                // Create a snake that loops back on itself
                snake.segments = [
                    { x: 5, y: 5 }, // head
                    { x: 5, y: 6 },
                    { x: 6, y: 6 },
                    { x: 6, y: 5 },
                    { x: 5, y: 5 }  // tail at same position as head
                ];
                expect(snake.checkCollision()).toBe(true);
            });

            it('should not detect collision with only adjacent segments', () => {
                // Normal snake configuration
                snake.segments = [
                    { x: 5, y: 5 },
                    { x: 4, y: 5 },
                    { x: 3, y: 5 }
                ];
                expect(snake.checkCollision()).toBe(false);
            });
        });
    });

    describe('head getter', () => {
        it('should return first segment', () => {
            expect(snake.head).toBe(snake.segments[0]);
        });

        it('should update when snake moves', () => {
            const initialHead = { ...snake.head };
            snake.move();
            expect(snake.head.x).toBe(initialHead.x + 1);
        });
    });
});
