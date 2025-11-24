import { Renderer } from './Renderer';
import { Snake } from './Snake';
import { Food } from './Food';
import { AutoPilot } from './AutoPilot';
import type { ThemeName } from './themes';
import { themes, defaultTheme } from './themes';

export class Game {
    private renderer: Renderer;
    private snake!: Snake;
    private food!: Food;
    private autoPilot!: AutoPilot;

    private lastTime: number = 0;
    private baseDropInterval: number = 100; // Base speed at 75% slider position
    private dropCounter: number = 0;

    private isRunning: boolean = false;
    private isAuto: boolean = false;
    private score: number = 0;

    private gridSize: number = 20;
    private gridWidth: number;
    private gridHeight: number;
    private currentTheme: ThemeName = defaultTheme;

    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new Renderer(canvas, this.gridSize, themes[this.currentTheme]);
        this.gridWidth = canvas.width / this.gridSize;
        this.gridHeight = canvas.height / this.gridSize;
        console.log('Game constructed. Grid:', this.gridWidth, this.gridHeight);

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
        const minInterval = 50;  // Fastest speed
        const maxInterval = 250; // Slowest speed
        this.baseDropInterval = maxInterval - (speedPercent / 100) * (maxInterval - minInterval);
    }

    private bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;

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
        console.log('Game starting... V2');
        this.reset();
        this.isRunning = true;
        this.lastTime = performance.now();
        this.dropCounter = 0;
        requestAnimationFrame((t) => this.update(t));
    }

    reset() {
        console.log('Game resetting...');
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

    update(time: number = 0) {
        if (!this.isRunning) return;

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
            console.log('Collision detected!', this.snake.head);
            this.gameOver();
            return;
        }

        // Food check
        if (this.snake.head.x === this.food.x && this.snake.head.y === this.food.y) {
            this.snake.grow();
            this.food.respawn(this.snake.segments);
            this.score += 10;
            this.updateScore();
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

    gameOver() {
        this.isRunning = false;
        const screen = document.getElementById('game-over-screen');
        const finalScore = document.getElementById('final-score');
        if (screen && finalScore) {
            finalScore.innerText = this.score.toString();
            screen.classList.remove('hidden');
        }
    }
}
