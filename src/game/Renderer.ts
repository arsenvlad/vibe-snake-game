import type { ThemeColors } from './themes';
import type { PowerUpType } from './SpecialFood';
import { POWER_UP_CONFIGS } from './SpecialFood';
import type { Obstacle } from './Obstacle';

// Thickness level constants
const MIN_THICKNESS_LEVEL = 1;
const MAX_THICKNESS_LEVEL = 5;
const DEFAULT_THICKNESS_LEVEL = 3;
const MAX_PADDING = 6;
const MIN_CORNER_RADIUS = 2;

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private gridSize: number;
    private colors: ThemeColors;
    private thickness: number = DEFAULT_THICKNESS_LEVEL;

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
        this.thickness = Math.max(MIN_THICKNESS_LEVEL, Math.min(MAX_THICKNESS_LEVEL, level));
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

    drawSnake(segments: { x: number, y: number }[], isInvincible: boolean = false) {
        // Calculate padding based on thickness (level 1 = thinnest, level 5 = thickest)
        const padding = MAX_PADDING - this.thickness;

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

            // Add glow effect when invincible
            if (isInvincible) {
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#ffffff';
            }

            this.ctx.fillStyle = gradient;

            // Round corners - scale with thickness
            const baseRadius = isHead ? 6 : 4;
            const radius = Math.max(MIN_CORNER_RADIUS, baseRadius - (MAX_THICKNESS_LEVEL - this.thickness));
            this.roundRect(
                segment.x * this.gridSize + padding,
                segment.y * this.gridSize + padding,
                this.gridSize - padding * 2,
                this.gridSize - padding * 2,
                radius
            );
            this.ctx.fill();

            if (isInvincible) {
                this.ctx.shadowBlur = 0;
            }

            if (isHead) {
                // Eyes - scale position and size with thickness
                const eyeScale = this.thickness / MAX_THICKNESS_LEVEL;
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

    drawSpecialFood(x: number, y: number, type: PowerUpType, animationPhase: number) {
        const config = POWER_UP_CONFIGS[type];
        const centerX = x * this.gridSize + this.gridSize / 2;
        const centerY = y * this.gridSize + this.gridSize / 2;
        
        // Pulsating animation - scale from 0.7 to 1.0
        const pulseScale = 0.85 + 0.15 * Math.sin(animationPhase * Math.PI * 2 / 1000);
        const radius = (this.gridSize / 2 - 2) * pulseScale;

        // Outer glow
        this.ctx.shadowBlur = 20 + 10 * Math.sin(animationPhase * Math.PI * 2 / 1000);
        this.ctx.shadowColor = config.glowColor;

        // Draw main circle
        this.ctx.fillStyle = config.color;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw inner shine/highlight
        this.ctx.shadowBlur = 0;
        const gradient = this.ctx.createRadialGradient(
            centerX - radius * 0.3, centerY - radius * 0.3, 0,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw type-specific icon
        this.drawPowerUpIcon(centerX, centerY, radius * 0.5, type);
        
        this.ctx.shadowBlur = 0;
    }

    private drawPowerUpIcon(centerX: number, centerY: number, size: number, type: PowerUpType) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.lineWidth = 2;

        switch (type) {
            case 'speed_boost':
                // Lightning bolt icon
                this.ctx.beginPath();
                this.ctx.moveTo(centerX + size * 0.1, centerY - size * 0.7);
                this.ctx.lineTo(centerX - size * 0.3, centerY + size * 0.1);
                this.ctx.lineTo(centerX + size * 0.1, centerY + size * 0.1);
                this.ctx.lineTo(centerX - size * 0.1, centerY + size * 0.7);
                this.ctx.lineTo(centerX + size * 0.3, centerY - size * 0.1);
                this.ctx.lineTo(centerX - size * 0.1, centerY - size * 0.1);
                this.ctx.closePath();
                this.ctx.fill();
                break;
            case 'slow_motion':
                // Hourglass icon
                this.ctx.beginPath();
                this.ctx.moveTo(centerX - size * 0.4, centerY - size * 0.6);
                this.ctx.lineTo(centerX + size * 0.4, centerY - size * 0.6);
                this.ctx.lineTo(centerX, centerY);
                this.ctx.lineTo(centerX + size * 0.4, centerY + size * 0.6);
                this.ctx.lineTo(centerX - size * 0.4, centerY + size * 0.6);
                this.ctx.lineTo(centerX, centerY);
                this.ctx.closePath();
                this.ctx.fill();
                break;
            case 'bonus_points':
                // Star icon
                this.drawStar(centerX, centerY, 5, size * 0.7, size * 0.35);
                break;
            case 'invincibility':
                // Shield icon
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY - size * 0.6);
                this.ctx.lineTo(centerX + size * 0.5, centerY - size * 0.3);
                this.ctx.lineTo(centerX + size * 0.5, centerY + size * 0.1);
                this.ctx.quadraticCurveTo(centerX, centerY + size * 0.8, centerX, centerY + size * 0.8);
                this.ctx.quadraticCurveTo(centerX, centerY + size * 0.8, centerX - size * 0.5, centerY + size * 0.1);
                this.ctx.lineTo(centerX - size * 0.5, centerY - size * 0.3);
                this.ctx.closePath();
                this.ctx.fill();
                break;
        }
    }

    private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    drawObstacles(obstacles: Obstacle[]) {
        const padding = 2;

        obstacles.forEach(obstacle => {
            let color: string;
            
            switch (obstacle.type) {
                case 'static':
                    color = this.colors.obstacleStatic;
                    break;
                case 'moving':
                    color = this.colors.obstacleMoving;
                    break;
                case 'temporary':
                    color = this.colors.obstacleTemporary;
                    break;
                default: {
                    // Exhaustiveness check - this should never happen
                    const _exhaustiveCheck: never = obstacle.type;
                    color = this.colors.obstacleStatic;
                    console.warn(`Unknown obstacle type: ${_exhaustiveCheck}`);
                }
            }

            this.ctx.fillStyle = color;

            // Different shapes for different obstacle types
            if (obstacle.type === 'static') {
                // Square with slight rounding
                this.roundRect(
                    obstacle.x * this.gridSize + padding,
                    obstacle.y * this.gridSize + padding,
                    this.gridSize - padding * 2,
                    this.gridSize - padding * 2,
                    3
                );
                this.ctx.fill();
            } else if (obstacle.type === 'moving') {
                // Diamond shape for moving obstacles
                const cx = obstacle.x * this.gridSize + this.gridSize / 2;
                const cy = obstacle.y * this.gridSize + this.gridSize / 2;
                const size = this.gridSize / 2 - padding;
                
                this.ctx.beginPath();
                this.ctx.moveTo(cx, cy - size);
                this.ctx.lineTo(cx + size, cy);
                this.ctx.lineTo(cx, cy + size);
                this.ctx.lineTo(cx - size, cy);
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                // Triangle for temporary obstacles
                const cx = obstacle.x * this.gridSize + this.gridSize / 2;
                const cy = obstacle.y * this.gridSize + this.gridSize / 2;
                const size = this.gridSize / 2 - padding;
                
                this.ctx.beginPath();
                this.ctx.moveTo(cx, cy - size);
                this.ctx.lineTo(cx + size, cy + size);
                this.ctx.lineTo(cx - size, cy + size);
                this.ctx.closePath();
                this.ctx.fill();
            }
        });
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
