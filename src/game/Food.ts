export class Food {
    x: number;
    y: number;
    gridWidth: number;
    gridHeight: number;

    constructor(gridWidth: number, gridHeight: number) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.x = 0;
        this.y = 0;
        this.randomize();
    }

    randomize() {
        this.x = Math.floor(Math.random() * this.gridWidth);
        this.y = Math.floor(Math.random() * this.gridHeight);
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
