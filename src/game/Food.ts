import { SeededRandom } from './SeededRandom';

export class Food {
    x: number;
    y: number;
    gridWidth: number;
    gridHeight: number;
    private rng: SeededRandom | null = null;

    constructor(gridWidth: number, gridHeight: number) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.x = 0;
        this.y = 0;
        this.randomize();
    }

    /**
     * Set a seeded random number generator for deterministic food placement
     */
    setRng(rng: SeededRandom): void {
        this.rng = rng;
    }

    /**
     * Clear the seeded RNG to use Math.random again
     */
    clearRng(): void {
        this.rng = null;
    }

    randomize() {
        if (this.rng) {
            this.x = this.rng.randomInt(this.gridWidth);
            this.y = this.rng.randomInt(this.gridHeight);
        } else {
            this.x = Math.floor(Math.random() * this.gridWidth);
            this.y = Math.floor(Math.random() * this.gridHeight);
        }
    }

    respawn(snakeSegments: { x: number, y: number }[], obstaclePositions: { x: number, y: number }[] = []) {
        let valid = false;
        while (!valid) {
            this.randomize();
            const overlapsSnake = snakeSegments.some(segment => segment.x === this.x && segment.y === this.y);
            const overlapsObstacle = obstaclePositions.some(obs => obs.x === this.x && obs.y === this.y);
            valid = !overlapsSnake && !overlapsObstacle;
        }
    }
}
