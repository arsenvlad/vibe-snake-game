import { Renderer } from './Renderer';
import { Snake } from './Snake';
import { Food } from './Food';
import { SpecialFood, type PowerUpType, POWER_UP_CONFIGS } from './SpecialFood';
import { AutoPilot } from './AutoPilot';
import { ObstacleManager } from './Obstacle';
import type { ThemeName } from './themes';
import { themes, defaultTheme } from './themes';
import { AudioManager } from '../audio/AudioManager';

export interface ActivePowerUp {
    type: PowerUpType;
    startTime: number;
    duration: number;
}

export class Game {
    private renderer: Renderer;
    private snake!: Snake;
    private food!: Food;
    private specialFood!: SpecialFood;
    private autoPilot!: AutoPilot;
    private obstacleManager!: ObstacleManager;
    private audio: AudioManager;

    private lastTime: number = 0;
    private baseDropInterval: number = 100; // Base speed at 75% slider position
    private dropCounter: number = 0;

    private isRunning: boolean = false;
    private isPaused: boolean = false;
    private isAuto: boolean = false;
    private score: number = 0;
    private highScore: number = 0;
    private readonly highScoreKey: string = 'vibe-snake-high-score';

    private gridSize: number = 20;
    private gridWidth: number;
    private gridHeight: number;
    private currentTheme: ThemeName = defaultTheme;

    private activePowerUp: ActivePowerUp | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new Renderer(canvas, this.gridSize, themes[this.currentTheme]);
        this.audio = new AudioManager();
        this.gridWidth = canvas.width / this.gridSize;
        this.gridHeight = canvas.height / this.gridSize;
        this.highScore = this.loadHighScore();
        this.updateHighScoreDisplay();

        this.bindEvents();
        this.reset();
    }

    setTheme(theme: ThemeName) {
        this.currentTheme = theme;
        this.renderer.setTheme(themes[theme]);
        this.draw();
    }

    setSpeed(speedPercent: number) {
        // Speed range: 0% = 250ms (slowest), 75% = 100ms (default), 100% = 50ms (fastest)
        const clampedSpeed = Math.max(0, Math.min(100, speedPercent));
        const minInterval = 50;  // Fastest speed
        const maxInterval = 250; // Slowest speed
        this.baseDropInterval = maxInterval - (clampedSpeed / 100) * (maxInterval - minInterval);
    }

    setThickness(level: number) {
        const clampedLevel = Math.max(1, Math.min(5, level));
        this.renderer.setThickness(clampedLevel);
        this.draw();
    }

    private bindEvents() {
        window.addEventListener('keydown', (e) => {
            const arrowKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

            // Allow pause toggle even when paused
            if (e.key === 'p' || e.key === 'P') {
                if (this.isRunning || this.isPaused) {
                    this.togglePause();
                }
                return;
            }

            if (arrowKeys.has(e.key)) {
                e.preventDefault();
                if (!this.isRunning || this.isPaused) return;
            } else if (!this.isRunning || this.isPaused) {
                return;
            }

            switch (e.key) {
                case 'ArrowUp': this.snake.setDirection({ x: 0, y: -1 }); break;
                case 'ArrowDown': this.snake.setDirection({ x: 0, y: 1 }); break;
                case 'ArrowLeft': this.snake.setDirection({ x: -1, y: 0 }); break;
                case 'ArrowRight': this.snake.setDirection({ x: 1, y: 0 }); break;
                case 'a':
                case 'A':
                    this.toggleAuto();
                    break;
            }
        });
    }

    start() {
        this.reset();
        this.isRunning = true;
        this.isPaused = false;
        this.updatePauseBadge();
        this.lastTime = performance.now();
        this.dropCounter = 0;
        requestAnimationFrame((t) => this.update(t));
    }

    reset() {
        this.score = 0;
        this.updateScore();
        this.snake = new Snake(this.gridWidth, this.gridHeight);
        this.food = new Food(this.gridWidth, this.gridHeight);
        this.obstacleManager = new ObstacleManager(this.gridWidth, this.gridHeight);
        this.food.respawn(this.snake.segments);
        this.specialFood = new SpecialFood(this.gridWidth, this.gridHeight);
        this.autoPilot = new AutoPilot(this.snake, this.food, this.gridWidth, this.gridHeight, this.specialFood);
        this.activePowerUp = null;
        this.updatePowerUpHUD();

        // Initial draw
        this.draw();
    }

    toggleAuto() {
        this.isAuto = !this.isAuto;
        const badge = document.getElementById('auto-badge');
        if (badge) {
            if (this.isAuto) badge.classList.add('active');
            else badge.classList.remove('active');
        }
    }

    togglePause() {
        if (!this.isRunning && !this.isPaused) return;
        
        this.isPaused = !this.isPaused;
        this.updatePauseBadge();
        
        if (!this.isPaused) {
            // Resuming - reset timing to prevent jump
            this.lastTime = performance.now();
            this.dropCounter = 0;
            requestAnimationFrame((t) => this.update(t));
        }
    }

    private updatePauseBadge() {
        const badge = document.getElementById('pause-badge');
        if (badge) {
            if (this.isPaused) badge.classList.add('active');
            else badge.classList.remove('active');
        }
    }

    update(time: number = 0) {
        if (!this.isRunning || this.isPaused) return;

        const deltaTime = Math.min(time - this.lastTime, 100); // Clamp to 100ms max to prevent spiral
        this.lastTime = time;
        this.dropCounter += deltaTime;

        // Speed up as score increases
        let currentInterval = Math.max(50, this.baseDropInterval - this.score * 2);

        // Apply power-up effects to interval
        if (this.activePowerUp) {
            if (this.activePowerUp.type === 'speed_boost') {
                currentInterval = currentInterval * 0.6; // 60% of normal interval = faster movement
            } else if (this.activePowerUp.type === 'slow_motion') {
                currentInterval = currentInterval * 1.5; // 150% of normal interval = slower movement
            }
        }

        // Update special food
        this.specialFood.update(time);

        // Update active power-up
        this.updateActivePowerUp(time);

        if (this.dropCounter > currentInterval) {
            this.step();
            this.dropCounter = 0;
        }

        this.draw();
        requestAnimationFrame((t) => this.update(t));
    }

    private updateActivePowerUp(currentTime: number) {
        if (!this.activePowerUp) return;

        const elapsed = currentTime - this.activePowerUp.startTime;
        if (elapsed >= this.activePowerUp.duration) {
            this.activePowerUp = null;
            this.updatePowerUpHUD();
        } else {
            this.updatePowerUpHUD();
        }
    }

    private updatePowerUpHUD() {
        const container = document.getElementById('powerup-indicator');
        if (!container) return;

        if (!this.activePowerUp) {
            container.classList.remove('active');
            container.innerHTML = '';
            return;
        }

        const config = POWER_UP_CONFIGS[this.activePowerUp.type];
        const currentTime = performance.now();
        const remaining = Math.max(0, this.activePowerUp.duration - (currentTime - this.activePowerUp.startTime));
        const remainingSeconds = Math.ceil(remaining / 1000);

        container.classList.add('active');
        container.innerHTML = `
            <span class="powerup-name" style="color: ${config.color}">${config.displayName}</span>
            <span class="powerup-timer">${remainingSeconds}s</span>
        `;
    }

    step() {
        // Update obstacles (for moving and temporary obstacles)
        this.obstacleManager.update();

        // Update autoPilot with current obstacle positions
        this.autoPilot.setObstacles(this.obstacleManager.getObstaclePositions());

        if (this.isAuto) {
            const nextMove = this.autoPilot.getNextMove();
            if (nextMove) this.snake.setDirection(nextMove);
        }

        this.snake.move();

        // Check invincibility status
        const isInvincible = this.activePowerUp?.type === 'invincibility';

        // Wall and self collision checks
        if (this.snake.checkCollision()) {
            if (!isInvincible) {
                this.gameOver();
                return;
            }
            // If invincible and hit wall, wrap around
            this.handleWrapAround();
        }

        // Obstacle collision check
        if (this.obstacleManager.checkCollision(this.snake.head)) {
            this.gameOver();
            return;
        }

        // Food check
        if (this.snake.head.x === this.food.x && this.snake.head.y === this.food.y) {
            this.snake.grow();
            this.food.respawn(this.snake.segments, this.obstacleManager.getObstaclePositions());
            this.score += 10;
            this.updateScore();
            this.tryUpdateHighScore();
            this.audio.play('eat');

            // Try to spawn special food
            if (this.specialFood.shouldSpawn()) {
                this.specialFood.spawn(this.snake.segments, this.food.x, this.food.y);
            }

            // Check if new obstacles should spawn
            this.obstacleManager.checkSpawn(
                this.score,
                this.snake.segments,
                { x: this.food.x, y: this.food.y }
            );
        }

        // Special food check
        if (this.specialFood.isActive && 
            this.snake.head.x === this.specialFood.x && 
            this.snake.head.y === this.specialFood.y) {
            this.collectSpecialFood();
        }
    }

    private handleWrapAround() {
        const head = this.snake.head;
        if (head.x < 0) head.x = this.gridWidth - 1;
        else if (head.x >= this.gridWidth) head.x = 0;
        if (head.y < 0) head.y = this.gridHeight - 1;
        else if (head.y >= this.gridHeight) head.y = 0;
    }

    private collectSpecialFood() {
        const config = this.specialFood.getConfig();
        
        // Add points bonus
        this.score += config.pointsBonus;
        this.updateScore();
        this.tryUpdateHighScore();

        // Play power-up sound
        this.audio.play('powerup');

        // Apply power-up effect (replaces any existing power-up)
        if (config.duration > 0) {
            this.activePowerUp = {
                type: config.type,
                startTime: performance.now(),
                duration: config.duration
            };
            this.updatePowerUpHUD();
        }

        // Despawn the special food
        this.specialFood.despawn();
    }

    draw() {
        this.renderer.clear();
        if (this.obstacleManager) this.renderer.drawObstacles(this.obstacleManager.getObstacles());
        if (this.food) this.renderer.drawFood(this.food.x, this.food.y);
        if (this.specialFood?.isActive) {
            this.renderer.drawSpecialFood(
                this.specialFood.x, 
                this.specialFood.y, 
                this.specialFood.type, 
                this.specialFood.animationPhase
            );
        }
        const isInvincible = this.activePowerUp?.type === 'invincibility';
        if (this.snake) this.renderer.drawSnake(this.snake.segments, isInvincible);
    }

    updateScore() {
        const el = document.getElementById('score');
        if (el) el.innerText = this.score.toString();
    }

    private loadHighScore(): number {
        if (typeof localStorage === 'undefined') return 0;
        const stored = localStorage.getItem(this.highScoreKey);
        if (!stored) return 0;
        const parsed = parseInt(stored, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    private persistHighScore() {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(this.highScoreKey, this.highScore.toString());
    }

    private updateHighScoreDisplay() {
        const el = document.getElementById('high-score');
        if (el) el.innerText = this.highScore.toString();
    }

    private tryUpdateHighScore() {
        if (this.score <= this.highScore) return;
        this.highScore = this.score;
        this.persistHighScore();
        this.updateHighScoreDisplay();
    }

    gameOver() {
        this.isRunning = false;
        this.audio.play('die');
        this.activePowerUp = null;
        this.updatePowerUpHUD();

        if (this.isAuto) {
            setTimeout(() => {
                this.start();
            }, 1000);
            return;
        }

        const screen = document.getElementById('game-over-screen');
        const finalScore = document.getElementById('final-score');
        if (screen && finalScore) {
            finalScore.innerText = this.score.toString();
            screen.classList.remove('hidden');
        }
    }
}
