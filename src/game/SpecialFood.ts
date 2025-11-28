export type PowerUpType = 'speed_boost' | 'slow_motion' | 'bonus_points' | 'invincibility';

export interface PowerUpConfig {
    type: PowerUpType;
    color: string;
    glowColor: string;
    duration: number;  // Duration in milliseconds (0 for instant effects like bonus points)
    pointsBonus: number;
    displayName: string;
}

export const POWER_UP_CONFIGS: Record<PowerUpType, Omit<PowerUpConfig, 'type'>> = {
    speed_boost: {
        color: '#00ffff',
        glowColor: '#00bfff',
        duration: 5000,
        pointsBonus: 5,
        displayName: 'Speed Boost'
    },
    slow_motion: {
        color: '#ff00ff',
        glowColor: '#ff69b4',
        duration: 5000,
        pointsBonus: 5,
        displayName: 'Slow Motion'
    },
    bonus_points: {
        color: '#ffd700',
        glowColor: '#ffaa00',
        duration: 0,  // Instant effect
        pointsBonus: 50,
        displayName: 'Bonus Points'
    },
    invincibility: {
        color: '#ffffff',
        glowColor: '#f0f0f0',
        duration: 3000,
        pointsBonus: 10,
        displayName: 'Invincibility'
    }
};

// Configuration for special food spawning
export const SPECIAL_FOOD_SPAWN_CHANCE = 0.12;  // 12% chance after eating regular food
export const SPECIAL_FOOD_LIFETIME = 7000;  // 7 seconds before disappearing

export class SpecialFood {
    x: number = 0;
    y: number = 0;
    type: PowerUpType;
    gridWidth: number;
    gridHeight: number;
    isActive: boolean = false;
    spawnTime: number = 0;
    animationPhase: number = 0;

    constructor(gridWidth: number, gridHeight: number) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.type = 'bonus_points';  // Default type
    }

    getConfig(): PowerUpConfig {
        return {
            type: this.type,
            ...POWER_UP_CONFIGS[this.type]
        };
    }

    shouldSpawn(): boolean {
        return Math.random() < SPECIAL_FOOD_SPAWN_CHANCE;
    }

    spawn(snakeSegments: { x: number, y: number }[], regularFoodX: number, regularFoodY: number): boolean {
        if (this.isActive) return false;

        // Randomly select a power-up type from all available types
        const types = Object.keys(POWER_UP_CONFIGS) as PowerUpType[];
        this.type = types[Math.floor(Math.random() * types.length)];

        // Find a valid position
        let attempts = 0;
        const maxAttempts = 100;

        while (attempts < maxAttempts) {
            this.randomize();
            
            // Check if position is valid (not on snake, not on regular food)
            const overlapsSnake = snakeSegments.some(
                segment => segment.x === this.x && segment.y === this.y
            );
            const overlapsFood = this.x === regularFoodX && this.y === regularFoodY;

            if (!overlapsSnake && !overlapsFood) {
                this.isActive = true;
                this.spawnTime = performance.now();
                this.animationPhase = 0;
                return true;
            }

            attempts++;
        }

        return false;
    }

    randomize() {
        this.x = Math.floor(Math.random() * this.gridWidth);
        this.y = Math.floor(Math.random() * this.gridHeight);
    }

    update(currentTime: number): boolean {
        if (!this.isActive) return false;

        // Update animation phase
        this.animationPhase = (currentTime - this.spawnTime) % 1000;

        // Check if special food has expired
        if (currentTime - this.spawnTime >= SPECIAL_FOOD_LIFETIME) {
            this.despawn();
            return false;
        }

        return true;
    }

    despawn() {
        this.isActive = false;
    }

    getRemainingTime(currentTime: number): number {
        if (!this.isActive) return 0;
        return Math.max(0, SPECIAL_FOOD_LIFETIME - (currentTime - this.spawnTime));
    }
}
