import type { ThemeColors } from './themes';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private gridSize: number;
    private colors: ThemeColors;
    private thickness: number = 3; // Default thickness level (1-5)

    constructor(canvas: HTMLCanvasElement, gridSize: number, colors: ThemeColors) {
        this.ctx = canvas.getContext('2d')!;
        this.width = canvas.width;
        this.height = canvas.height;
        this.gridSize = gridSize;
        this.colors = colors;
    }

    setTheme(colors: ThemeColors) {
        this.colors = colors;
    }

    setThickness(level: number) {
        this.thickness = Math.max(1, Math.min(5, level));
    }

    clear() {
        this.ctx.fillStyle = this.colors.canvasBg;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw subtle grid
        this.ctx.strokeStyle = this.colors.gridColor;
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
        // Calculate padding based on thickness (level 1 = thinnest, level 5 = thickest)
        // Level 5: padding = 1, Level 1: padding = 5
        const padding = 6 - this.thickness;

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
                gradient.addColorStop(0, this.colors.snakeHeadStart);
                gradient.addColorStop(1, this.colors.snakeHeadEnd);
            } else {
                gradient.addColorStop(0, this.colors.snakeBodyStart);
                gradient.addColorStop(1, this.colors.snakeBodyEnd);
            }

            this.ctx.fillStyle = gradient;

            // Round corners - scale with thickness
            const baseRadius = isHead ? 6 : 4;
            const radius = Math.max(2, baseRadius - (5 - this.thickness));
            this.roundRect(
                segment.x * this.gridSize + padding,
                segment.y * this.gridSize + padding,
                this.gridSize - padding * 2,
                this.gridSize - padding * 2,
                radius
            );
            this.ctx.fill();

            if (isHead) {
                // Eyes - scale position and size with thickness
                const eyeScale = this.thickness / 5;
                const eyeRadius = Math.max(1, 2 * eyeScale);
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(
                    segment.x * this.gridSize + this.gridSize * 0.3,
                    segment.y * this.gridSize + this.gridSize * 0.3,
                    eyeRadius, 0, Math.PI * 2
                );
                this.ctx.arc(
                    segment.x * this.gridSize + this.gridSize * 0.7,
                    segment.y * this.gridSize + this.gridSize * 0.3,
                    eyeRadius, 0, Math.PI * 2
                );
                this.ctx.fill();
            }
        });
    }

    drawFood(x: number, y: number) {
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.colors.foodGlow;
        this.ctx.fillStyle = this.colors.foodColor;

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
