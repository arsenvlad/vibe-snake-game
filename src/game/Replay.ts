/**
 * Represents a single recorded input during gameplay
 */
export interface ReplayInput {
    /** Frame number when the input occurred */
    frame: number;
    /** Direction change: 'up', 'down', 'left', 'right' */
    direction: 'up' | 'down' | 'left' | 'right';
}

/**
 * Complete replay data for a gameplay session
 */
export interface ReplayData {
    /** Version for future compatibility */
    version: number;
    /** Random seed used for food spawning */
    seed: number;
    /** Grid dimensions */
    gridWidth: number;
    gridHeight: number;
    /** Initial snake segments */
    initialSnake: { x: number; y: number }[];
    /** Initial snake direction */
    initialDirection: { x: number; y: number };
    /** All recorded inputs */
    inputs: ReplayInput[];
    /** Final score achieved */
    finalScore: number;
    /** Timestamp when the game was played */
    timestamp: number;
    /** Speed setting used (percentage 0-100) */
    speedPercent: number;
}

/**
 * Direction vectors for easy conversion
 */
const DIRECTION_VECTORS: Record<string, { x: number; y: number }> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
};

const VECTOR_TO_DIRECTION: Record<string, ReplayInput['direction']> = {
    '0,-1': 'up',
    '0,1': 'down',
    '-1,0': 'left',
    '1,0': 'right'
};

/**
 * Records gameplay inputs for later replay
 */
export class ReplayRecorder {
    private inputs: ReplayInput[] = [];
    private currentFrame: number = 0;
    private seed: number = 0;
    private gridWidth: number = 0;
    private gridHeight: number = 0;
    private initialSnake: { x: number; y: number }[] = [];
    private initialDirection: { x: number; y: number } = { x: 1, y: 0 };
    private finalScore: number = 0;
    private timestamp: number = 0;
    private speedPercent: number = 75;
    private isRecording: boolean = false;

    /**
     * Start recording a new gameplay session
     */
    startRecording(
        seed: number,
        gridWidth: number,
        gridHeight: number,
        initialSnake: { x: number; y: number }[],
        initialDirection: { x: number; y: number },
        speedPercent: number
    ): void {
        this.inputs = [];
        this.currentFrame = 0;
        this.seed = seed;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.initialSnake = initialSnake.map(s => ({ ...s }));
        this.initialDirection = { ...initialDirection };
        this.speedPercent = speedPercent;
        this.timestamp = Date.now();
        this.isRecording = true;
    }

    /**
     * Record a direction change input
     */
    recordInput(direction: { x: number; y: number }): void {
        if (!this.isRecording) return;
        
        const key = `${direction.x},${direction.y}`;
        const dirName = VECTOR_TO_DIRECTION[key];
        if (dirName) {
            this.inputs.push({
                frame: this.currentFrame,
                direction: dirName
            });
        }
    }

    /**
     * Advance the frame counter (called on each game step)
     */
    advanceFrame(): void {
        if (this.isRecording) {
            this.currentFrame++;
        }
    }

    /**
     * Stop recording and return the replay data
     */
    stopRecording(finalScore: number): ReplayData {
        this.isRecording = false;
        this.finalScore = finalScore;
        
        return {
            version: 1,
            seed: this.seed,
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            initialSnake: this.initialSnake,
            initialDirection: this.initialDirection,
            inputs: [...this.inputs],
            finalScore: this.finalScore,
            timestamp: this.timestamp,
            speedPercent: this.speedPercent
        };
    }

    /**
     * Check if currently recording
     */
    getIsRecording(): boolean {
        return this.isRecording;
    }
}

/**
 * Playback speeds
 */
export type PlaybackSpeed = 0.5 | 1 | 2;

/**
 * Plays back recorded gameplay
 */
export class ReplayPlayer {
    private replayData: ReplayData | null = null;
    private currentFrame: number = 0;
    private inputIndex: number = 0;
    private isPlaying: boolean = false;
    private isPaused: boolean = false;
    private speed: PlaybackSpeed = 1;
    private onInputCallback: ((direction: { x: number; y: number }) => void) | null = null;
    private onCompleteCallback: (() => void) | null = null;

    /**
     * Load replay data for playback
     */
    loadReplay(data: ReplayData): void {
        this.replayData = data;
        this.currentFrame = 0;
        this.inputIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.speed = 1;
    }

    /**
     * Start playback
     */
    startPlayback(
        onInput: (direction: { x: number; y: number }) => void,
        onComplete: () => void
    ): void {
        if (!this.replayData) return;
        
        this.onInputCallback = onInput;
        this.onCompleteCallback = onComplete;
        this.currentFrame = 0;
        this.inputIndex = 0;
        this.isPlaying = true;
        this.isPaused = false;
    }

    /**
     * Process the current frame during playback
     * Returns true if there are pending inputs for this frame
     */
    processFrame(): { x: number; y: number } | null {
        if (!this.replayData || !this.isPlaying || this.isPaused) return null;

        // Check if there are inputs for the current frame
        while (
            this.inputIndex < this.replayData.inputs.length &&
            this.replayData.inputs[this.inputIndex].frame === this.currentFrame
        ) {
            const input = this.replayData.inputs[this.inputIndex];
            const direction = DIRECTION_VECTORS[input.direction];
            if (this.onInputCallback && direction) {
                this.onInputCallback(direction);
            }
            this.inputIndex++;
            return direction;
        }

        return null;
    }

    /**
     * Advance to the next frame
     */
    advanceFrame(): void {
        if (!this.isPlaying || this.isPaused) return;
        this.currentFrame++;
    }

    /**
     * Check if playback is complete
     */
    checkComplete(): boolean {
        if (!this.replayData) return true;
        
        // Playback is complete when we've processed all inputs and advanced past them
        return this.inputIndex >= this.replayData.inputs.length;
    }

    /**
     * Toggle pause state
     */
    togglePause(): void {
        this.isPaused = !this.isPaused;
    }

    /**
     * Set playback speed
     */
    setSpeed(speed: PlaybackSpeed): void {
        this.speed = speed;
    }

    /**
     * Get current playback speed
     */
    getSpeed(): PlaybackSpeed {
        return this.speed;
    }

    /**
     * Skip to end of replay
     */
    skipToEnd(): void {
        if (!this.replayData || !this.isPlaying) return;
        
        // Process all remaining inputs
        while (this.inputIndex < this.replayData.inputs.length) {
            const input = this.replayData.inputs[this.inputIndex];
            const direction = DIRECTION_VECTORS[input.direction];
            if (this.onInputCallback && direction) {
                this.onInputCallback(direction);
            }
            this.inputIndex++;
        }
        
        this.isPlaying = false;
        if (this.onCompleteCallback) {
            this.onCompleteCallback();
        }
    }

    /**
     * Stop playback
     */
    stopPlayback(): void {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentFrame = 0;
        this.inputIndex = 0;
    }

    /**
     * Check if currently playing
     */
    getIsPlaying(): boolean {
        return this.isPlaying;
    }

    /**
     * Check if paused
     */
    getIsPaused(): boolean {
        return this.isPaused;
    }

    /**
     * Get the loaded replay data
     */
    getReplayData(): ReplayData | null {
        return this.replayData;
    }

    /**
     * Get current frame number
     */
    getCurrentFrame(): number {
        return this.currentFrame;
    }

    /**
     * Get total frames (estimated from last input).
     * Adds a buffer of frames after the last input to account for
     * the snake continuing to move until collision.
     */
    getTotalFrames(): number {
        if (!this.replayData || this.replayData.inputs.length === 0) return 0;
        // Add 100 frames as buffer for the snake's movement after last input until collision
        const FRAMES_AFTER_LAST_INPUT = 100;
        return this.replayData.inputs[this.replayData.inputs.length - 1].frame + FRAMES_AFTER_LAST_INPUT;
    }
}

/**
 * Storage manager for replay data
 */
export class ReplayStorage {
    private static readonly LAST_REPLAY_KEY = 'vibe-snake-last-replay';
    private static readonly HIGH_SCORE_REPLAY_KEY = 'vibe-snake-high-score-replay';
    private static readonly REPLAY_HISTORY_KEY = 'vibe-snake-replay-history';

    /**
     * Save the last game replay
     */
    static saveLastReplay(data: ReplayData): void {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.LAST_REPLAY_KEY, JSON.stringify(data));
        } catch {
            console.warn('Failed to save last replay');
        }
    }

    /**
     * Load the last game replay
     */
    static loadLastReplay(): ReplayData | null {
        if (typeof localStorage === 'undefined') return null;
        try {
            const stored = localStorage.getItem(this.LAST_REPLAY_KEY);
            if (!stored) return null;
            return JSON.parse(stored) as ReplayData;
        } catch {
            return null;
        }
    }

    /**
     * Save the high score replay (if better than existing)
     */
    static saveHighScoreReplay(data: ReplayData): boolean {
        if (typeof localStorage === 'undefined') return false;
        try {
            const existing = this.loadHighScoreReplay();
            if (existing && existing.finalScore >= data.finalScore) {
                return false;
            }
            localStorage.setItem(this.HIGH_SCORE_REPLAY_KEY, JSON.stringify(data));
            return true;
        } catch {
            console.warn('Failed to save high score replay');
            return false;
        }
    }

    /**
     * Load the high score replay
     */
    static loadHighScoreReplay(): ReplayData | null {
        if (typeof localStorage === 'undefined') return null;
        try {
            const stored = localStorage.getItem(this.HIGH_SCORE_REPLAY_KEY);
            if (!stored) return null;
            return JSON.parse(stored) as ReplayData;
        } catch {
            return null;
        }
    }

    /**
     * Save replay to history (keeps last 10 entries)
     */
    static saveReplayToHistory(data: ReplayData): void {
        if (typeof localStorage === 'undefined') return;
        try {
            const history = this.loadReplayHistory();
            const newHistory = [data, ...history].slice(0, 10);
            localStorage.setItem(this.REPLAY_HISTORY_KEY, JSON.stringify(newHistory));
        } catch {
            console.warn('Failed to save replay history');
        }
    }

    /**
     * Load replay history (latest first)
     */
    static loadReplayHistory(): ReplayData[] {
        if (typeof localStorage === 'undefined') return [];
        try {
            const stored = localStorage.getItem(this.REPLAY_HISTORY_KEY);
            if (!stored) return [];
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed as ReplayData[] : [];
        } catch {
            return [];
        }
    }

    /**
     * Export replay data as a shareable base64 string
     */
    static exportReplay(data: ReplayData): string {
        const json = JSON.stringify(data);
        return btoa(encodeURIComponent(json));
    }

    /**
     * Import replay data from a base64 string
     */
    static importReplay(encoded: string): ReplayData | null {
        try {
            const json = decodeURIComponent(atob(encoded));
            const data = JSON.parse(json) as ReplayData;
            // Basic validation
            if (
                typeof data.version !== 'number' ||
                typeof data.seed !== 'number' ||
                !Array.isArray(data.inputs) ||
                !Array.isArray(data.initialSnake)
            ) {
                return null;
            }
            return data;
        } catch {
            return null;
        }
    }
}
