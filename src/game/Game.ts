import { Renderer } from './Renderer';
import { Snake } from './Snake';
import { Food } from './Food';
import { AutoPilot } from './AutoPilot';

export class Game {
    private canvas: HTMLCanvasElement;
    private renderer: Renderer;
    private snake!: Snake;
    private food!: Food;
    private autoPilot!: AutoPilot;

    private lastTime: number = 0;
    private dropInterval: number = 100; // Speed
    private dropCounter: number = 0;

    private isRunning: boolean = false;
    private isAuto: boolean = false;
    private score: number = 0;

    private gridSize: number = 20;
    private gridWidth: number;
    private gridHeight: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas, this.gridSize);
        this.gridWidth = canvas.width / this.gridSize;
        this.gridHeight = canvas.height / this.gridSize;

        this.bindEvents();
        this.reset();
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
        this.reset();
        this.isRunning = true;
        this.lastTime = 0;
        this.dropCounter = 0;
        this.update();
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

    update(time: number = 0) {
        if (!this.isRunning) return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        this.dropCounter += deltaTime;

        // Speed up as score increases
        const currentInterval = Math.max(50, this.dropInterval - this.score * 2);

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
