import { Renderer } from './Renderer';
import { Snake } from './Snake';
import { Food } from './Food';
import { AutoPilot } from './AutoPilot';
import type { ThemeName } from './themes';
import { themes, defaultTheme } from './themes';
import { AudioManager } from '../audio/AudioManager';

export class Game {
    private renderer: Renderer;
    private snake!: Snake;
    private food!: Food;
    private autoPilot!: AutoPilot;
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
        this.food.respawn(this.snake.segments);
        this.autoPilot = new AutoPilot(this.snake, this.food, this.gridWidth, this.gridHeight);

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
        const currentInterval = Math.max(50, this.baseDropInterval - this.score * 2);

        if (this.dropCounter > currentInterval) {
            this.step();
            this.dropCounter = 0;
        }

        this.draw();
        requestAnimationFrame((t) => this.update(t));
    }

    step() {
        if (this.isAuto) {
            const nextMove = this.autoPilot.getNextMove();
            if (nextMove) this.snake.setDirection(nextMove);
        }

        this.snake.move();

        // Collision checks
        if (this.snake.checkCollision()) {
            this.gameOver();
            return;
        }

        // Food check
        if (this.snake.head.x === this.food.x && this.snake.head.y === this.food.y) {
            this.snake.grow();
            this.food.respawn(this.snake.segments);
            this.score += 10;
            this.updateScore();
            this.tryUpdateHighScore();
            this.audio.play('eat');
        }
    }

    draw() {
        this.renderer.clear();
        if (this.food) this.renderer.drawFood(this.food.x, this.food.y);
        if (this.snake) this.renderer.drawSnake(this.snake.segments);
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
