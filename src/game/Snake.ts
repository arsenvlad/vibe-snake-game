export class Snake {
    segments: { x: number, y: number }[];
    direction: { x: number, y: number };
    nextDirection: { x: number, y: number };
    gridWidth: number;
    gridHeight: number;
    growing: boolean = false;

    constructor(gridWidth: number, gridHeight: number) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.segments = [
            { x: 5, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 5 }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
    }

    setDirection(dir: { x: number, y: number }): boolean {
        // Prevent 180 degree turns
        if (this.direction.x + dir.x === 0 && this.direction.y + dir.y === 0) return false;
        this.nextDirection = dir;
        return true;
    }

    move() {
        this.direction = this.nextDirection;
        const head = this.segments[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        // Wrap around logic (optional, but let's do wall collision for now as per standard snake)
        // Actually, Copilot is helpful, maybe it wraps? Let's stick to walls = death for challenge.

        this.segments.unshift(newHead);

        if (!this.growing) {
            this.segments.pop();
        } else {
            this.growing = false;
        }
    }

    grow() {
        this.growing = true;
    }

    checkCollision(): boolean {
        const head = this.segments[0];

        // Wall collision
        if (head.x < 0 || head.x >= this.gridWidth || head.y < 0 || head.y >= this.gridHeight) {
            return true;
        }

        // Self collision
        for (let i = 1; i < this.segments.length; i++) {
            if (head.x === this.segments[i].x && head.y === this.segments[i].y) {
                return true;
            }
        }

        return false;
    }

    get head() {
        return this.segments[0];
    }
}
