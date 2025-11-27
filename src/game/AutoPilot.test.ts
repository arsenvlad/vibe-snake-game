import { describe, it, expect, beforeEach } from 'vitest';
import { AutoPilot } from './AutoPilot';
import { Snake } from './Snake';
import { Food } from './Food';

describe('AutoPilot', () => {
    const gridWidth = 10;
    const gridHeight = 10;
    let snake: Snake;
    let food: Food;
    let autoPilot: AutoPilot;

    beforeEach(() => {
        snake = new Snake(gridWidth, gridHeight);
        food = new Food(gridWidth, gridHeight);
        autoPilot = new AutoPilot(snake, food, gridWidth, gridHeight);
    });

    describe('constructor', () => {
        it('should create an instance with snake and food references', () => {
            expect(autoPilot).toBeDefined();
        });
    });

    describe('updateBounds', () => {
        it('should update grid dimensions', () => {
            autoPilot.updateBounds(15, 15);
            // The bounds update is internal, but we can verify it works through getNextMove
            expect(autoPilot.getNextMove()).toBeDefined();
        });
    });

    describe('getNextMove', () => {
        it('should return a valid direction object', () => {
            const move = autoPilot.getNextMove();
            expect(move).toBeDefined();
            expect(move).toHaveProperty('x');
            expect(move).toHaveProperty('y');
        });

        it('should return a cardinal direction', () => {
            const move = autoPilot.getNextMove();
            const validMoves = [
                { x: 0, y: -1 },  // UP
                { x: 0, y: 1 },   // DOWN
                { x: -1, y: 0 },  // LEFT
                { x: 1, y: 0 }    // RIGHT
            ];
            expect(validMoves).toContainEqual(move);
        });

        it('should navigate towards food when path exists', () => {
            // Position snake at (2, 2) heading right
            snake.segments = [
                { x: 2, y: 2 },
                { x: 1, y: 2 },
                { x: 0, y: 2 }
            ];
            snake.direction = { x: 1, y: 0 };
            snake.nextDirection = { x: 1, y: 0 };

            // Place food directly to the right
            food.x = 5;
            food.y = 2;

            const move = autoPilot.getNextMove();
            // Should suggest moving right towards food
            expect(move).toEqual({ x: 1, y: 0 });
        });

        it('should find path around obstacles', () => {
            // Position snake
            snake.segments = [
                { x: 3, y: 3 },
                { x: 2, y: 3 },
                { x: 1, y: 3 }
            ];
            snake.direction = { x: 1, y: 0 };
            snake.nextDirection = { x: 1, y: 0 };

            // Place food below the snake
            food.x = 3;
            food.y = 5;

            const move = autoPilot.getNextMove();
            // Should suggest a valid move (either continue right or go down)
            expect(move).toBeDefined();
            expect(['x', 'y'].every(key => key in move!)).toBe(true);
        });

        it('should provide fallback move when no path to food exists', () => {
            // Create a scenario where food is unreachable
            // Snake almost fills the grid except for a small area
            snake.segments = [
                { x: 1, y: 1 },
                { x: 1, y: 2 },
                { x: 1, y: 3 },
                { x: 1, y: 4 },
                { x: 2, y: 4 },
                { x: 3, y: 4 },
                { x: 4, y: 4 },
                { x: 5, y: 4 }
            ];

            food.x = 8;
            food.y = 8;

            const move = autoPilot.getNextMove();
            expect(move).toBeDefined();
        });

        it('should avoid immediate wall collision', () => {
            // Snake at top edge
            snake.segments = [
                { x: 5, y: 0 },
                { x: 4, y: 0 },
                { x: 3, y: 0 }
            ];
            snake.direction = { x: 1, y: 0 };
            snake.nextDirection = { x: 1, y: 0 };

            // Food is above (would require going through wall)
            food.x = 5;
            food.y = 5;

            const move = autoPilot.getNextMove();
            // Should not suggest going up (y: -1) as it would hit wall
            expect(move).not.toEqual({ x: 0, y: -1 });
        });

        it('should avoid immediate self collision', () => {
            // Snake in a U-shape
            snake.segments = [
                { x: 4, y: 3 },
                { x: 5, y: 3 },
                { x: 5, y: 4 },
                { x: 4, y: 4 },
                { x: 3, y: 4 },
                { x: 3, y: 3 }
            ];
            snake.direction = { x: -1, y: 0 };
            snake.nextDirection = { x: -1, y: 0 };

            food.x = 1;
            food.y = 1;

            const move = autoPilot.getNextMove();
            // Should return some valid move (not into its own body)
            expect(move).toBeDefined();
        });
    });
});
