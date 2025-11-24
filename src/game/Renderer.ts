import { Snake } from './Snake';
import { Food } from './Food';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private gridSize: number;

    constructor(canvas: HTMLCanvasElement, gridSize: number) {
        this.ctx = canvas.getContext('2d')!;
        this.width = canvas.width;
        this.height = canvas.height;
        this.gridSize = gridSize;
    }

    clear() {
        this.ctx.fillStyle = '#0d1117';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw subtle grid
        this.ctx.strokeStyle = '#21262d';
        this.ctx.lineWidth = 1;

        for (let x = 0; x <= this.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    drawSnake(segments: { x: number, y: number }[]) {
        segments.forEach((segment, index) => {
            const isHead = index === 0;

            // Copilot gradient for snake
            const gradient = this.ctx.createLinearGradient(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                (segment.x + 1) * this.gridSize,
                (segment.y + 1) * this.gridSize
            );

            if (isHead) {
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(1, '#6366f1');
            } else {
                gradient.addColorStop(0, '#6366f1');
                gradient.addColorStop(1, '#ec4899');
            }

            this.ctx.fillStyle = gradient;

            // Round corners
            const radius = isHead ? 6 : 4;
            this.roundRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2,
                radius
            );
            this.ctx.fill();

            if (isHead) {
                // Eyes
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(
                    segment.x * this.gridSize + this.gridSize * 0.3,
                    segment.y * this.gridSize + this.gridSize * 0.3,
                    2, 0, Math.PI * 2
                );
                this.ctx.arc(
                    segment.x * this.gridSize + this.gridSize * 0.7,
                    segment.y * this.gridSize + this.gridSize * 0.3,
                    2, 0, Math.PI * 2
                );
                this.ctx.fill();
            }
        });
    }

    drawFood(x: number, y: number) {
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#238636';
        this.ctx.fillStyle = '#238636'; // GitHub Green

        this.ctx.beginPath();
        this.ctx.arc(
            x * this.gridSize + this.gridSize / 2,
            y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
    }

    private roundRect(x: number, y: number, w: number, h: number, r: number) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.arcTo(x + w, y, x + w, y + h, r);
        this.ctx.arcTo(x + w, y + h, x, y + h, r);
        this.ctx.arcTo(x, y + h, x, y, r);
        this.ctx.arcTo(x, y, x + w, y, r);
        this.ctx.closePath();
    }
}
