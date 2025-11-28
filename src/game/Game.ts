import { Renderer } from './Renderer';
import { Snake } from './Snake';
import { Food } from './Food';
import { AutoPilot } from './AutoPilot';
import type { ThemeName } from './themes';
import { themes, defaultTheme } from './themes';
import { AudioManager } from '../audio/AudioManager';
import { SeededRandom } from './SeededRandom';
import { ReplayRecorder, ReplayPlayer, ReplayStorage, type ReplayData, type PlaybackSpeed } from './Replay';

export class Game {
    private renderer: Renderer;
    private snake!: Snake;
    private food!: Food;
    private autoPilot!: AutoPilot;
    private audio: AudioManager;

    private lastTime: number = 0;
    private baseDropInterval: number = 100; // Base speed at 75% slider position
    private dropCounter: number = 0;
    private speedPercent: number = 75;

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

    // Replay system
    private replayRecorder: ReplayRecorder;
    private replayPlayer: ReplayPlayer;
    private rng: SeededRandom | null = null;
    private isReplayMode: boolean = false;
    private currentSeed: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new Renderer(canvas, this.gridSize, themes[this.currentTheme]);
        this.audio = new AudioManager();
        this.gridWidth = canvas.width / this.gridSize;
        this.gridHeight = canvas.height / this.gridSize;
        this.highScore = this.loadHighScore();
        this.updateHighScoreDisplay();

        // Initialize replay system
        this.replayRecorder = new ReplayRecorder();
        this.replayPlayer = new ReplayPlayer();

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
        this.speedPercent = clampedSpeed;
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

            // Allow pause toggle even when paused (both in game and replay mode)
            if (e.key === 'p' || e.key === 'P') {
                if (this.isRunning || this.isPaused) {
                    this.togglePause();
                }
                return;
            }

            // In replay mode, don't accept direction inputs
            if (this.isReplayMode) return;

            if (arrowKeys.has(e.key)) {
                e.preventDefault();
                if (!this.isRunning || this.isPaused) return;
            } else if (!this.isRunning || this.isPaused) {
                return;
            }

            switch (e.key) {
                case 'ArrowUp': this.handleDirectionInput({ x: 0, y: -1 }); break;
                case 'ArrowDown': this.handleDirectionInput({ x: 0, y: 1 }); break;
                case 'ArrowLeft': this.handleDirectionInput({ x: -1, y: 0 }); break;
                case 'ArrowRight': this.handleDirectionInput({ x: 1, y: 0 }); break;
                case 'a':
                case 'A':
                    this.toggleAuto();
                    break;
            }
        });
    }

    private handleDirectionInput(direction: { x: number; y: number }) {
        this.snake.setDirection(direction);
        // Record input for replay (only in live play mode, not replay or auto)
        if (!this.isReplayMode && !this.isAuto) {
            this.replayRecorder.recordInput(direction);
        }
    }

    start() {
        this.stopReplay(); // Ensure replay mode is off
        this.reset();
        this.isRunning = true;
        this.isPaused = false;
        this.updatePauseBadge();
        this.updateReplayBadge();
        this.lastTime = performance.now();
        this.dropCounter = 0;

        // Start recording the replay
        this.replayRecorder.startRecording(
            this.currentSeed,
            this.gridWidth,
            this.gridHeight,
            this.snake.segments,
            this.snake.direction,
            this.speedPercent
        );

        requestAnimationFrame((t) => this.update(t));
    }

    reset() {
        this.score = 0;
        this.updateScore();

        // Generate new seed for deterministic food placement
        this.currentSeed = SeededRandom.generateSeed();
        this.rng = new SeededRandom(this.currentSeed);

        this.snake = new Snake(this.gridWidth, this.gridHeight);
        this.food = new Food(this.gridWidth, this.gridHeight);
        this.food.setRng(this.rng);
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

        // Also pause/unpause replay player
        if (this.isReplayMode) {
            this.replayPlayer.togglePause();
        }
        
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

    private updateReplayBadge() {
        const badge = document.getElementById('replay-badge');
        if (badge) {
            if (this.isReplayMode) badge.classList.add('active');
            else badge.classList.remove('active');
        }
    }

    update(time: number = 0) {
        if (!this.isRunning || this.isPaused) return;

        const deltaTime = Math.min(time - this.lastTime, 100); // Clamp to 100ms max to prevent spiral
        this.lastTime = time;
        this.dropCounter += deltaTime;

        // Speed up as score increases (but apply replay speed modifier in replay mode)
        let currentInterval = Math.max(50, this.baseDropInterval - this.score * 2);
        
        // Apply replay speed modifier
        if (this.isReplayMode) {
            currentInterval = currentInterval / this.replayPlayer.getSpeed();
        }

        if (this.dropCounter > currentInterval) {
            this.step();
            this.dropCounter = 0;
        }

        this.draw();
        requestAnimationFrame((t) => this.update(t));
    }

    step() {
        // In replay mode, process replay inputs
        if (this.isReplayMode) {
            this.replayPlayer.processFrame();
            this.replayPlayer.advanceFrame();
        } else {
            // Record frame advance for live gameplay
            this.replayRecorder.advanceFrame();
        }

        if (this.isAuto && !this.isReplayMode) {
            const nextMove = this.autoPilot.getNextMove();
            if (nextMove) this.snake.setDirection(nextMove);
        }

        this.snake.move();

        // Collision checks
        if (this.snake.checkCollision()) {
            if (this.isReplayMode) {
                this.onReplayComplete();
            } else {
                this.gameOver();
            }
            return;
        }

        // Food check
        if (this.snake.head.x === this.food.x && this.snake.head.y === this.food.y) {
            this.snake.grow();
            this.food.respawn(this.snake.segments);
            this.score += 10;
            this.updateScore();
            if (!this.isReplayMode) {
                this.tryUpdateHighScore();
            }
            this.audio.play('eat');
        }

        // Check if replay is complete
        if (this.isReplayMode && this.replayPlayer.checkComplete()) {
            // Continue running until collision
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

        // Stop recording and save replay
        const replayData = this.replayRecorder.stopRecording(this.score);
        ReplayStorage.saveLastReplay(replayData);
        
        // Save as high score replay if it's the best
        const isNewHighScore = ReplayStorage.saveHighScoreReplay(replayData);
        
        // Update watch best replay button visibility
        this.updateWatchBestReplayButton();

        if (this.isAuto) {
            setTimeout(() => {
                this.start();
            }, 1000);
            return;
        }

        const screen = document.getElementById('game-over-screen');
        const finalScore = document.getElementById('final-score');
        const watchReplayBtn = document.getElementById('watch-replay-btn');
        const newHighScoreLabel = document.getElementById('new-high-score-label');
        
        if (screen && finalScore) {
            finalScore.innerText = this.score.toString();
            screen.classList.remove('hidden');
        }
        
        // Show watch replay button
        if (watchReplayBtn) {
            watchReplayBtn.classList.remove('hidden');
        }
        
        // Show new high score label if applicable
        if (newHighScoreLabel) {
            if (isNewHighScore && this.score > 0) {
                newHighScoreLabel.classList.remove('hidden');
            } else {
                newHighScoreLabel.classList.add('hidden');
            }
        }
    }

    // ================== REPLAY SYSTEM ==================

    /**
     * Start playing a replay
     */
    startReplay(replayData: ReplayData): void {
        this.stopReplay();
        
        // Hide screens
        const startScreen = document.getElementById('start-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        startScreen?.classList.add('hidden');
        gameOverScreen?.classList.add('hidden');
        
        // Setup replay mode
        this.isReplayMode = true;
        this.isRunning = true;
        this.isPaused = false;
        this.score = 0;
        this.updateScore();

        // Create RNG with replay seed
        this.currentSeed = replayData.seed;
        this.rng = new SeededRandom(this.currentSeed);

        // Recreate initial game state
        this.snake = new Snake(this.gridWidth, this.gridHeight);
        this.snake.segments = replayData.initialSnake.map(s => ({ ...s }));
        this.snake.direction = { ...replayData.initialDirection };
        this.snake.nextDirection = { ...replayData.initialDirection };

        this.food = new Food(this.gridWidth, this.gridHeight);
        this.food.setRng(this.rng);
        this.food.respawn(this.snake.segments);

        this.autoPilot = new AutoPilot(this.snake, this.food, this.gridWidth, this.gridHeight);

        // Set speed from replay
        this.setSpeed(replayData.speedPercent);

        // Load replay into player
        this.replayPlayer.loadReplay(replayData);
        this.replayPlayer.startPlayback(
            (direction) => this.snake.setDirection(direction),
            () => this.onReplayComplete()
        );

        // Update UI
        this.updatePauseBadge();
        this.updateReplayBadge();
        this.showReplayControls(true);

        // Start game loop
        this.lastTime = performance.now();
        this.dropCounter = 0;
        requestAnimationFrame((t) => this.update(t));
    }

    /**
     * Watch the last recorded replay
     */
    watchLastReplay(): void {
        const replay = ReplayStorage.loadLastReplay();
        if (replay) {
            this.startReplay(replay);
        }
    }

    /**
     * Watch the high score replay
     */
    watchHighScoreReplay(): void {
        const replay = ReplayStorage.loadHighScoreReplay();
        if (replay) {
            this.startReplay(replay);
        }
    }

    /**
     * Stop replay playback
     */
    stopReplay(): void {
        if (this.isReplayMode) {
            this.replayPlayer.stopPlayback();
            this.isReplayMode = false;
            this.isRunning = false;
            this.showReplayControls(false);
            this.updateReplayBadge();
        }
    }

    /**
     * Called when replay playback completes
     */
    private onReplayComplete(): void {
        this.isRunning = false;
        this.audio.play('die');
        
        // Show replay complete screen
        const screen = document.getElementById('replay-complete-screen');
        const replayScore = document.getElementById('replay-final-score');
        
        if (screen) {
            if (replayScore) {
                const replayData = this.replayPlayer.getReplayData();
                replayScore.innerText = replayData?.finalScore.toString() ?? this.score.toString();
            }
            screen.classList.remove('hidden');
        }
        
        this.showReplayControls(false);
    }

    /**
     * Set replay playback speed
     */
    setReplaySpeed(speed: PlaybackSpeed): void {
        this.replayPlayer.setSpeed(speed);
        this.updateSpeedButtons(speed);
    }

    /**
     * Toggle replay pause
     */
    toggleReplayPause(): void {
        if (this.isReplayMode) {
            this.togglePause();
        }
    }

    /**
     * Skip to end of replay
     */
    skipReplayToEnd(): void {
        if (this.isReplayMode) {
            this.replayPlayer.skipToEnd();
        }
    }

    /**
     * Show/hide replay controls
     */
    private showReplayControls(show: boolean): void {
        const controls = document.getElementById('replay-controls');
        if (controls) {
            if (show) {
                controls.classList.remove('hidden');
            } else {
                controls.classList.add('hidden');
            }
        }
    }

    /**
     * Update speed button active states
     */
    private updateSpeedButtons(activeSpeed: PlaybackSpeed): void {
        const speeds: PlaybackSpeed[] = [0.5, 1, 2];
        speeds.forEach(speed => {
            const btn = document.getElementById(`speed-${speed}x-btn`);
            if (btn) {
                if (speed === activeSpeed) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
    }

    /**
     * Update the visibility of the watch best replay button
     */
    updateWatchBestReplayButton(): void {
        const btn = document.getElementById('watch-best-replay-btn');
        if (btn) {
            const hasHighScoreReplay = ReplayStorage.loadHighScoreReplay() !== null;
            if (hasHighScoreReplay) {
                btn.classList.remove('hidden');
            } else {
                btn.classList.add('hidden');
            }
        }
    }

    /**
     * Check if in replay mode
     */
    getIsReplayMode(): boolean {
        return this.isReplayMode;
    }

    /**
     * Export the last replay as a shareable string
     */
    exportLastReplay(): string | null {
        const replay = ReplayStorage.loadLastReplay();
        if (replay) {
            return ReplayStorage.exportReplay(replay);
        }
        return null;
    }

    /**
     * Export the high score replay as a shareable string
     */
    exportHighScoreReplay(): string | null {
        const replay = ReplayStorage.loadHighScoreReplay();
        if (replay) {
            return ReplayStorage.exportReplay(replay);
        }
        return null;
    }

    /**
     * Import and play a replay from a shareable string
     */
    importAndPlayReplay(encoded: string): boolean {
        const replay = ReplayStorage.importReplay(encoded);
        if (replay) {
            this.startReplay(replay);
            return true;
        }
        return false;
    }
}
