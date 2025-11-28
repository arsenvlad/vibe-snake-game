export type ObstacleType = 'static' | 'moving' | 'temporary';

export interface ObstaclePosition {
    x: number;
    y: number;
}

export interface ObstacleConfig {
    type: ObstacleType;
    position: ObstaclePosition;
    duration?: number; // For temporary obstacles, in game ticks
    direction?: { x: number; y: number }; // For moving obstacles
}

// Constants for obstacle configuration
const DEFAULT_TEMPORARY_DURATION = 50;
const TEMPORARY_BASE_DURATION = 100;
const TEMPORARY_DURATION_VARIANCE = 50;

export class Obstacle {
    x: number;
    y: number;
    type: ObstacleType;
    duration: number; // Remaining duration for temporary obstacles (-1 for permanent)
    direction: { x: number; y: number }; // Movement direction for moving obstacles
    gridWidth: number;
    gridHeight: number;

    constructor(
        config: ObstacleConfig,
        gridWidth: number,
        gridHeight: number
    ) {
        this.x = config.position.x;
        this.y = config.position.y;
        this.type = config.type;
        this.duration = config.type === 'temporary' ? (config.duration ?? DEFAULT_TEMPORARY_DURATION) : -1;
        this.direction = config.direction ?? { x: 0, y: 0 };
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
    }

    /**
     * Update obstacle state (for moving and temporary obstacles)
     * Returns true if the obstacle should be removed
     */
    update(): boolean {
        // Handle temporary obstacles
        if (this.type === 'temporary') {
            this.duration--;
            return this.duration <= 0;
        }

        // Handle moving obstacles
        if (this.type === 'moving') {
            const newX = this.x + this.direction.x;
            const newY = this.y + this.direction.y;

            // Bounce off walls
            if (newX < 0 || newX >= this.gridWidth) {
                this.direction.x = -this.direction.x;
            } else {
                this.x = newX;
            }

            if (newY < 0 || newY >= this.gridHeight) {
                this.direction.y = -this.direction.y;
            } else {
                this.y = newY;
            }
        }

        return false;
    }

    /**
     * Get the current position of the obstacle
     */
    get position(): ObstaclePosition {
        return { x: this.x, y: this.y };
    }
}

export class ObstacleManager {
    private obstacles: Obstacle[] = [];
    private gridWidth: number;
    private gridHeight: number;
    private lastSpawnScore: number = 0;
    private spawnThreshold: number = 100; // Spawn obstacles every 100 points

    constructor(gridWidth: number, gridHeight: number) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
    }

    /**
     * Reset all obstacles
     */
    reset(): void {
        this.obstacles = [];
        this.lastSpawnScore = 0;
    }

    /**
     * Update all obstacles and remove expired ones
     */
    update(): void {
        this.obstacles = this.obstacles.filter(obstacle => !obstacle.update());
    }

    /**
     * Check if new obstacles should spawn based on score
     */
    checkSpawn(
        score: number,
        snakeSegments: ObstaclePosition[],
        foodPosition: ObstaclePosition
    ): void {
        const scoreThreshold = Math.floor(score / this.spawnThreshold) * this.spawnThreshold;
        
        if (scoreThreshold > this.lastSpawnScore && score >= this.spawnThreshold) {
            this.spawnObstacles(snakeSegments, foodPosition);
            this.lastSpawnScore = scoreThreshold;
        }
    }

    /**
     * Spawn new obstacles at random valid positions
     */
    private spawnObstacles(
        snakeSegments: ObstaclePosition[],
        foodPosition: ObstaclePosition
    ): void {
        const level = Math.floor(this.lastSpawnScore / this.spawnThreshold) + 1;
        const obstacleCount = Math.min(level, 5); // Max 5 obstacles per spawn

        for (let i = 0; i < obstacleCount; i++) {
            const position = this.findValidPosition(snakeSegments, foodPosition);
            if (position) {
                const type = this.selectObstacleType(level);
                const config: ObstacleConfig = {
                    type,
                    position,
                    duration: type === 'temporary' ? TEMPORARY_BASE_DURATION + Math.floor(Math.random() * TEMPORARY_DURATION_VARIANCE) : undefined,
                    direction: type === 'moving' ? this.getRandomDirection() : undefined
                };
                this.obstacles.push(new Obstacle(config, this.gridWidth, this.gridHeight));
            }
        }
    }

    /**
     * Select obstacle type based on level (higher levels = more variety)
     */
    private selectObstacleType(level: number): ObstacleType {
        const rand = Math.random();
        
        if (level < 2) {
            return 'static';
        } else if (level < 4) {
            // Level 2-3: introduce temporary obstacles
            return rand < 0.7 ? 'static' : 'temporary';
        } else {
            // Level 4+: introduce moving obstacles
            if (rand < 0.5) return 'static';
            if (rand < 0.8) return 'temporary';
            return 'moving';
        }
    }

    /**
     * Get a random direction for moving obstacles
     */
    private getRandomDirection(): { x: number; y: number } {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];
        return directions[Math.floor(Math.random() * directions.length)];
    }

    /**
     * Find a valid position that doesn't overlap with snake, food, or existing obstacles
     */
    private findValidPosition(
        snakeSegments: ObstaclePosition[],
        foodPosition: ObstaclePosition
    ): ObstaclePosition | null {
        const maxAttempts = 100;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.floor(Math.random() * this.gridWidth);
            const y = Math.floor(Math.random() * this.gridHeight);

            // Check if position is valid
            if (!this.isPositionOccupied({ x, y }, snakeSegments, foodPosition)) {
                return { x, y };
            }
        }

        return null;
    }

    /**
     * Check if a position is occupied by snake, food, or obstacles
     */
    private isPositionOccupied(
        position: ObstaclePosition,
        snakeSegments: ObstaclePosition[],
        foodPosition: ObstaclePosition
    ): boolean {
        // Check snake segments
        if (snakeSegments.some(seg => seg.x === position.x && seg.y === position.y)) {
            return true;
        }

        // Check food
        if (foodPosition.x === position.x && foodPosition.y === position.y) {
            return true;
        }

        // Check existing obstacles
        if (this.obstacles.some(obs => obs.x === position.x && obs.y === position.y)) {
            return true;
        }

        return false;
    }

    /**
     * Check if a position collides with any obstacle
     */
    checkCollision(position: ObstaclePosition): boolean {
        return this.obstacles.some(
            obstacle => obstacle.x === position.x && obstacle.y === position.y
        );
    }

    /**
     * Get all obstacle positions for pathfinding
     */
    getObstaclePositions(): ObstaclePosition[] {
        return this.obstacles.map(obstacle => obstacle.position);
    }

    /**
     * Get all obstacles for rendering
     */
    getObstacles(): Obstacle[] {
        return [...this.obstacles];
    }

    /**
     * Get obstacle count
     */
    get count(): number {
        return this.obstacles.length;
    }
}
