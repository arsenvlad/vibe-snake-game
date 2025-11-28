import { describe, it, expect, beforeEach } from 'vitest';
import { 
    SpecialFood, 
    POWER_UP_CONFIGS, 
    SPECIAL_FOOD_SPAWN_CHANCE, 
    SPECIAL_FOOD_LIFETIME,
    type PowerUpType 
} from './SpecialFood';

describe('SpecialFood', () => {
    const gridWidth = 20;
    const gridHeight = 20;
    let specialFood: SpecialFood;

    beforeEach(() => {
        specialFood = new SpecialFood(gridWidth, gridHeight);
    });

    describe('constructor', () => {
        it('should initialize with correct grid dimensions', () => {
            expect(specialFood.gridWidth).toBe(gridWidth);
            expect(specialFood.gridHeight).toBe(gridHeight);
        });

        it('should not be active initially', () => {
            expect(specialFood.isActive).toBe(false);
        });

        it('should have default type set to bonus_points', () => {
            expect(specialFood.type).toBe('bonus_points');
        });
    });

    describe('POWER_UP_CONFIGS', () => {
        it('should have configuration for all power-up types', () => {
            const types: PowerUpType[] = ['speed_boost', 'slow_motion', 'bonus_points', 'invincibility'];
            types.forEach(type => {
                expect(POWER_UP_CONFIGS[type]).toBeDefined();
            });
        });

        it('should have required properties for each config', () => {
            Object.values(POWER_UP_CONFIGS).forEach(config => {
                expect(config.color).toBeDefined();
                expect(config.glowColor).toBeDefined();
                expect(config.duration).toBeDefined();
                expect(config.pointsBonus).toBeDefined();
                expect(config.displayName).toBeDefined();
            });
        });

        it('should have valid hex colors', () => {
            Object.values(POWER_UP_CONFIGS).forEach(config => {
                expect(config.color).toMatch(/^#[0-9a-fA-F]{6}$/);
                expect(config.glowColor).toMatch(/^#[0-9a-fA-F]{6}$/);
            });
        });

        it('should have non-negative durations', () => {
            Object.values(POWER_UP_CONFIGS).forEach(config => {
                expect(config.duration).toBeGreaterThanOrEqual(0);
            });
        });

        it('should have positive point bonuses', () => {
            Object.values(POWER_UP_CONFIGS).forEach(config => {
                expect(config.pointsBonus).toBeGreaterThan(0);
            });
        });
    });

    describe('constants', () => {
        it('should have reasonable spawn chance (between 0 and 1)', () => {
            expect(SPECIAL_FOOD_SPAWN_CHANCE).toBeGreaterThan(0);
            expect(SPECIAL_FOOD_SPAWN_CHANCE).toBeLessThanOrEqual(1);
        });

        it('should have spawn chance in expected range (10-15%)', () => {
            expect(SPECIAL_FOOD_SPAWN_CHANCE).toBeGreaterThanOrEqual(0.10);
            expect(SPECIAL_FOOD_SPAWN_CHANCE).toBeLessThanOrEqual(0.15);
        });

        it('should have lifetime between 5-10 seconds', () => {
            expect(SPECIAL_FOOD_LIFETIME).toBeGreaterThanOrEqual(5000);
            expect(SPECIAL_FOOD_LIFETIME).toBeLessThanOrEqual(10000);
        });
    });

    describe('getConfig', () => {
        it('should return config with type included', () => {
            specialFood.type = 'speed_boost';
            const config = specialFood.getConfig();
            expect(config.type).toBe('speed_boost');
            expect(config.color).toBe(POWER_UP_CONFIGS.speed_boost.color);
        });
    });

    describe('shouldSpawn', () => {
        it('should return boolean', () => {
            const result = specialFood.shouldSpawn();
            expect(typeof result).toBe('boolean');
        });

        it('should spawn with correct probability (statistically)', () => {
            let spawnCount = 0;
            const iterations = 10000;
            
            for (let i = 0; i < iterations; i++) {
                if (specialFood.shouldSpawn()) {
                    spawnCount++;
                }
            }
            
            const actualRate = spawnCount / iterations;
            // Allow 20% variance from expected rate
            expect(actualRate).toBeGreaterThan(SPECIAL_FOOD_SPAWN_CHANCE * 0.8);
            expect(actualRate).toBeLessThan(SPECIAL_FOOD_SPAWN_CHANCE * 1.2);
        });
    });

    describe('randomize', () => {
        it('should place special food within grid bounds', () => {
            for (let i = 0; i < 100; i++) {
                specialFood.randomize();
                expect(specialFood.x).toBeGreaterThanOrEqual(0);
                expect(specialFood.x).toBeLessThan(gridWidth);
                expect(specialFood.y).toBeGreaterThanOrEqual(0);
                expect(specialFood.y).toBeLessThan(gridHeight);
            }
        });
    });

    describe('spawn', () => {
        const snakeSegments = [
            { x: 5, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 5 }
        ];

        it('should set isActive to true on successful spawn', () => {
            const result = specialFood.spawn(snakeSegments, 10, 10);
            expect(result).toBe(true);
            expect(specialFood.isActive).toBe(true);
        });

        it('should set spawnTime on spawn', () => {
            const before = performance.now();
            specialFood.spawn(snakeSegments, 10, 10);
            const after = performance.now();
            
            expect(specialFood.spawnTime).toBeGreaterThanOrEqual(before);
            expect(specialFood.spawnTime).toBeLessThanOrEqual(after);
        });

        it('should not spawn if already active', () => {
            specialFood.spawn(snakeSegments, 10, 10);
            const firstX = specialFood.x;
            const firstY = specialFood.y;
            
            const result = specialFood.spawn(snakeSegments, 10, 10);
            expect(result).toBe(false);
            expect(specialFood.x).toBe(firstX);
            expect(specialFood.y).toBe(firstY);
        });

        it('should avoid snake segments', () => {
            for (let i = 0; i < 50; i++) {
                specialFood.isActive = false;  // Reset active state
                specialFood.spawn(snakeSegments, 10, 10);
                
                const overlapsSnake = snakeSegments.some(
                    segment => segment.x === specialFood.x && segment.y === specialFood.y
                );
                expect(overlapsSnake).toBe(false);
            }
        });

        it('should avoid regular food position', () => {
            const regularFoodX = 15;
            const regularFoodY = 15;
            
            for (let i = 0; i < 50; i++) {
                specialFood.isActive = false;
                specialFood.spawn(snakeSegments, regularFoodX, regularFoodY);
                
                const overlapsFood = specialFood.x === regularFoodX && specialFood.y === regularFoodY;
                expect(overlapsFood).toBe(false);
            }
        });

        it('should select a random power-up type', () => {
            const types = new Set<PowerUpType>();
            
            for (let i = 0; i < 100; i++) {
                specialFood.isActive = false;
                specialFood.spawn(snakeSegments, 10, 10);
                types.add(specialFood.type);
            }
            
            // Should have selected multiple different types
            expect(types.size).toBeGreaterThan(1);
        });

        it('should reset animation phase on spawn', () => {
            specialFood.animationPhase = 500;
            specialFood.spawn(snakeSegments, 10, 10);
            expect(specialFood.animationPhase).toBe(0);
        });
    });

    describe('update', () => {
        const snakeSegments = [{ x: 5, y: 5 }];

        beforeEach(() => {
            specialFood.spawn(snakeSegments, 10, 10);
        });

        it('should return false if not active', () => {
            specialFood.isActive = false;
            const result = specialFood.update(performance.now());
            expect(result).toBe(false);
        });

        it('should return true if still within lifetime', () => {
            const result = specialFood.update(specialFood.spawnTime + 1000);
            expect(result).toBe(true);
            expect(specialFood.isActive).toBe(true);
        });

        it('should despawn and return false when lifetime expires', () => {
            const result = specialFood.update(specialFood.spawnTime + SPECIAL_FOOD_LIFETIME + 1);
            expect(result).toBe(false);
            expect(specialFood.isActive).toBe(false);
        });

        it('should update animation phase', () => {
            specialFood.update(specialFood.spawnTime + 500);
            expect(specialFood.animationPhase).toBeCloseTo(500);
        });

        it('should cycle animation phase within 1 second', () => {
            specialFood.update(specialFood.spawnTime + 1500);
            expect(specialFood.animationPhase).toBe(500);
        });
    });

    describe('despawn', () => {
        it('should set isActive to false', () => {
            specialFood.spawn([{ x: 5, y: 5 }], 10, 10);
            expect(specialFood.isActive).toBe(true);
            
            specialFood.despawn();
            expect(specialFood.isActive).toBe(false);
        });
    });

    describe('getRemainingTime', () => {
        const snakeSegments = [{ x: 5, y: 5 }];

        it('should return 0 if not active', () => {
            const remaining = specialFood.getRemainingTime(performance.now());
            expect(remaining).toBe(0);
        });

        it('should return correct remaining time', () => {
            specialFood.spawn(snakeSegments, 10, 10);
            const elapsed = 2000;
            const remaining = specialFood.getRemainingTime(specialFood.spawnTime + elapsed);
            expect(remaining).toBe(SPECIAL_FOOD_LIFETIME - elapsed);
        });

        it('should return 0 if past lifetime', () => {
            specialFood.spawn(snakeSegments, 10, 10);
            const remaining = specialFood.getRemainingTime(specialFood.spawnTime + SPECIAL_FOOD_LIFETIME + 1000);
            expect(remaining).toBe(0);
        });
    });
});
