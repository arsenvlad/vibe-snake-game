import { Snake } from './Snake';
import { Food } from './Food';

type Point = { x: number, y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export class AutoPilot {
    private snake: Snake;
    private food: Food;
    private gridWidth: number = 0;
    private gridHeight: number = 0;
    private obstaclePositions: Point[] = [];

    constructor(snake: Snake, food: Food, gridWidth: number, gridHeight: number) {
        this.snake = snake;
        this.food = food;
        this.updateBounds(gridWidth, gridHeight);
    }

    public updateBounds(gridWidth: number, gridHeight: number) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
    }

    public setObstacles(obstacles: Point[]) {
        this.obstaclePositions = obstacles;
    }

    public getNextMove(): { x: number, y: number } | null {
        const head = this.snake.head;
        const foodPos = { x: this.food.x, y: this.food.y };
        const body = this.snake.segments;

        // Create a grid representation for BFS
        const grid = this.createGrid(body);

        // Try to find path to food
        const path = this.bfs(head, foodPos, grid);

        if (path && path.length > 0) {
            return this.directionToVector(this.getDirection(head, path[0]));
        }

        // Fallback: Try to find any valid move that keeps us alive longest
        const validMoves = this.getValidMoves(head, grid);
        if (validMoves.length > 0) {
            // Pick the move that is furthest from the body/walls or just random
            return this.directionToVector(this.getDirection(head, validMoves[0]));
        }

        // No valid moves, just go UP (will likely die)
        return { x: 0, y: -1 };
    }

    private directionToVector(dir: Direction): { x: number, y: number } {
        switch (dir) {
            case 'UP': return { x: 0, y: -1 };
            case 'DOWN': return { x: 0, y: 1 };
            case 'LEFT': return { x: -1, y: 0 };
            case 'RIGHT': return { x: 1, y: 0 };
        }
    }

    private createGrid(body: Point[]): boolean[][] {
        const grid: boolean[][] = [];
        for (let x = 0; x < this.gridWidth; x++) {
            grid[x] = [];
            for (let y = 0; y < this.gridHeight; y++) {
                grid[x][y] = true; // true means walkable
            }
        }

        // Mark body as obstacles
        // We ignore the tail because it will move (unless growing, but let's simplify)
        for (let i = 0; i < body.length - 1; i++) {
            const p = body[i];
            if (p.x >= 0 && p.x < this.gridWidth && p.y >= 0 && p.y < this.gridHeight) {
                grid[p.x][p.y] = false;
            }
        }

        // Mark obstacles as non-walkable
        for (const obs of this.obstaclePositions) {
            if (obs.x >= 0 && obs.x < this.gridWidth && obs.y >= 0 && obs.y < this.gridHeight) {
                grid[obs.x][obs.y] = false;
            }
        }

        return grid;
    }

    private bfs(start: Point, target: Point, grid: boolean[][]): Point[] | null {
        const queue: { pos: Point, path: Point[] }[] = [{ pos: start, path: [] }];
        const visited = new Set<string>();
        visited.add(`${start.x},${start.y}`);

        while (queue.length > 0) {
            const { pos, path } = queue.shift()!;

            if (pos.x === target.x && pos.y === target.y) {
                return path;
            }

            const neighbors = this.getNeighbors(pos);
            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                if (
                    this.isValid(neighbor) &&
                    grid[neighbor.x][neighbor.y] &&
                    !visited.has(key)
                ) {
                    visited.add(key);
                    queue.push({ pos: neighbor, path: [...path, neighbor] });
                }
            }
        }

        return null;
    }

    private getValidMoves(start: Point, grid: boolean[][]): Point[] {
        const neighbors = this.getNeighbors(start);
        return neighbors.filter(n => this.isValid(n) && grid[n.x][n.y]);
    }

    private getNeighbors(pos: Point): Point[] {
        return [
            { x: pos.x, y: pos.y - 1 }, // UP
            { x: pos.x, y: pos.y + 1 }, // DOWN
            { x: pos.x - 1, y: pos.y }, // LEFT
            { x: pos.x + 1, y: pos.y }  // RIGHT
        ];
    }

    private isValid(pos: Point): boolean {
        return pos.x >= 0 && pos.x < this.gridWidth && pos.y >= 0 && pos.y < this.gridHeight;
    }

    private getDirection(from: Point, to: Point): Direction {
        if (to.x > from.x) return 'RIGHT';
        if (to.x < from.x) return 'LEFT';
        if (to.y > from.y) return 'DOWN';
        if (to.y < from.y) return 'UP';
        return 'UP'; // Should not happen
    }
}
