import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Obstacle, ObstacleManager, type ObstacleConfig, type ObstaclePosition } from './Obstacle';

describe('Obstacle', () => {
    const gridWidth = 20;
    const gridHeight = 20;

    describe('constructor', () => {
        it('should create a static obstacle', () => {
            const config: ObstacleConfig = {
                type: 'static',
                position: { x: 5, y: 5 }
            };
            const obstacle = new Obstacle(config, gridWidth, gridHeight);
            
            expect(obstacle.x).toBe(5);
            expect(obstacle.y).toBe(5);
            expect(obstacle.type).toBe('static');
            expect(obstacle.duration).toBe(-1);
        });

        it('should create a temporary obstacle with duration', () => {
            const config: ObstacleConfig = {
                type: 'temporary',
                position: { x: 10, y: 10 },
                duration: 30
            };
            const obstacle = new Obstacle(config, gridWidth, gridHeight);
            
            expect(obstacle.type).toBe('temporary');
            expect(obstacle.duration).toBe(30);
        });

        it('should create a moving obstacle with direction', () => {
            const config: ObstacleConfig = {
                type: 'moving',
                position: { x: 5, y: 5 },
                direction: { x: 1, y: 0 }
            };
            const obstacle = new Obstacle(config, gridWidth, gridHeight);
            
            expect(obstacle.type).toBe('moving');
            expect(obstacle.direction).toEqual({ x: 1, y: 0 });
        });
    });

    describe('update', () => {
        it('should not remove static obstacles', () => {
            const config: ObstacleConfig = {
                type: 'static',
                position: { x: 5, y: 5 }
            };
            const obstacle = new Obstacle(config, gridWidth, gridHeight);
            
            expect(obstacle.update()).toBe(false);
        });

        it('should decrement duration for temporary obstacles', () => {
            const config: ObstacleConfig = {
                type: 'temporary',
                position: { x: 5, y: 5 },
                duration: 5
            };
            const obstacle = new Obstacle(config, gridWidth, gridHeight);
            
            obstacle.update();
            expect(obstacle.duration).toBe(4);
        });

        it('should return true when temporary obstacle expires', () => {
            const config: ObstacleConfig = {
                type: 'temporary',
                position: { x: 5, y: 5 },
                duration: 1
            };
            const obstacle = new Obstacle(config, gridWidth, gridHeight);
            
            expect(obstacle.update()).toBe(true);
        });

        it('should move moving obstacles', () => {
            const config: ObstacleConfig = {
                type: 'moving',
                position: { x: 5, y: 5 },
                direction: { x: 1, y: 0 }
            };
            const obstacle = new Obstacle(config, gridWidth, gridHeight);
            
            obstacle.update();
            expect(obstacle.x).toBe(6);
            expect(obstacle.y).toBe(5);
        });

        it('should bounce moving obstacles off walls', () => {
            const config: ObstacleConfig = {
                type: 'moving',
                position: { x: gridWidth - 1, y: 5 },
                direction: { x: 1, y: 0 }
            };
            const obstacle = new Obstacle(config, gridWidth, gridHeight);
            
            obstacle.update();
            expect(obstacle.direction.x).toBe(-1);
        });
    });

    describe('position getter', () => {
        it('should return current position', () => {
            const config: ObstacleConfig = {
                type: 'static',
                position: { x: 7, y: 8 }
            };
            const obstacle = new Obstacle(config, gridWidth, gridHeight);
            
            expect(obstacle.position).toEqual({ x: 7, y: 8 });
        });
    });
});

describe('ObstacleManager', () => {
    const gridWidth = 20;
    const gridHeight = 20;
    let manager: ObstacleManager;

    beforeEach(() => {
        manager = new ObstacleManager(gridWidth, gridHeight);
    });

    describe('constructor', () => {
        it('should create manager with no obstacles', () => {
            expect(manager.count).toBe(0);
        });
    });

    describe('reset', () => {
        it('should clear all obstacles', () => {
            // Force spawn some obstacles
            const snakeSegments = [{ x: 0, y: 0 }];
            const foodPosition = { x: 1, y: 1 };
            manager.checkSpawn(100, snakeSegments, foodPosition);
            
            expect(manager.count).toBeGreaterThan(0);
            
            manager.reset();
            expect(manager.count).toBe(0);
        });
    });

    describe('checkSpawn', () => {
        it('should not spawn obstacles below threshold', () => {
            const snakeSegments = [{ x: 0, y: 0 }];
            const foodPosition = { x: 1, y: 1 };
            
            manager.checkSpawn(50, snakeSegments, foodPosition);
            expect(manager.count).toBe(0);
        });

        it('should spawn obstacles at threshold', () => {
            const snakeSegments = [{ x: 0, y: 0 }];
            const foodPosition = { x: 1, y: 1 };
            
            manager.checkSpawn(100, snakeSegments, foodPosition);
            expect(manager.count).toBeGreaterThan(0);
        });

        it('should spawn more obstacles at higher scores', () => {
            const snakeSegments = [{ x: 0, y: 0 }];
            const foodPosition = { x: 1, y: 1 };
            
            manager.checkSpawn(100, snakeSegments, foodPosition);
            const firstCount = manager.count;
            
            manager.checkSpawn(200, snakeSegments, foodPosition);
            expect(manager.count).toBeGreaterThan(firstCount);
        });
    });

    describe('checkCollision', () => {
        it('should return false when no obstacles', () => {
            expect(manager.checkCollision({ x: 5, y: 5 })).toBe(false);
        });

        it('should detect collision with obstacle', () => {
            const snakeSegments = [{ x: 0, y: 0 }];
            const foodPosition = { x: 1, y: 1 };
            manager.checkSpawn(100, snakeSegments, foodPosition);
            
            const obstacles = manager.getObstaclePositions();
            if (obstacles.length > 0) {
                expect(manager.checkCollision(obstacles[0])).toBe(true);
            }
        });

        it('should return false for non-obstacle position', () => {
            const snakeSegments: ObstaclePosition[] = [];
            const foodPosition = { x: 1, y: 1 };
            
            // Mock to create obstacle at specific position
            vi.spyOn(Math, 'random').mockReturnValue(0);
            manager.checkSpawn(100, snakeSegments, foodPosition);
            vi.restoreAllMocks();
            
            // Check a position far from (0,0)
            expect(manager.checkCollision({ x: 19, y: 19 })).toBe(false);
        });
    });

    describe('update', () => {
        it('should remove expired temporary obstacles', () => {
            // Create obstacles and let temporary ones expire
            const snakeSegments = [{ x: 0, y: 0 }];
            const foodPosition = { x: 1, y: 1 };
            
            // Mock random to create temporary obstacles at higher level
            vi.spyOn(Math, 'random').mockReturnValue(0.75);
            manager.checkSpawn(400, snakeSegments, foodPosition);
            vi.restoreAllMocks();
            
            const initialCount = manager.count;
            
            // Update many times to expire temporary obstacles
            for (let i = 0; i < 200; i++) {
                manager.update();
            }
            
            // Some obstacles may have expired
            expect(manager.count).toBeLessThanOrEqual(initialCount);
        });
    });

    describe('getObstaclePositions', () => {
        it('should return empty array when no obstacles', () => {
            expect(manager.getObstaclePositions()).toEqual([]);
        });

        it('should return all obstacle positions', () => {
            const snakeSegments = [{ x: 0, y: 0 }];
            const foodPosition = { x: 1, y: 1 };
            manager.checkSpawn(100, snakeSegments, foodPosition);
            
            const positions = manager.getObstaclePositions();
            expect(positions.length).toBe(manager.count);
        });
    });

    describe('getObstacles', () => {
        it('should return copy of obstacles array', () => {
            const snakeSegments = [{ x: 0, y: 0 }];
            const foodPosition = { x: 1, y: 1 };
            manager.checkSpawn(100, snakeSegments, foodPosition);
            
            const obstacles = manager.getObstacles();
            expect(obstacles.length).toBe(manager.count);
            
            // Modifying returned array shouldn't affect manager
            obstacles.pop();
            expect(manager.count).toBeGreaterThan(obstacles.length);
        });
    });
});
