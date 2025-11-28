import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReplayRecorder, ReplayPlayer, ReplayStorage, type ReplayData } from './Replay';

// Shared localStorage mock factory for tests
function createLocalStorageMock() {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
    };
}

describe('ReplayRecorder', () => {
    let recorder: ReplayRecorder;

    beforeEach(() => {
        recorder = new ReplayRecorder();
    });

    describe('startRecording', () => {
        it('should initialize recording state', () => {
            recorder.startRecording(
                12345,
                30,
                30,
                [{ x: 5, y: 5 }, { x: 4, y: 5 }],
                { x: 1, y: 0 },
                75
            );
            expect(recorder.getIsRecording()).toBe(true);
        });
    });

    describe('recordInput', () => {
        it('should record direction inputs when recording', () => {
            recorder.startRecording(12345, 30, 30, [{ x: 5, y: 5 }], { x: 1, y: 0 }, 75);
            recorder.recordInput({ x: 0, y: -1 }); // up
            recorder.advanceFrame();
            recorder.recordInput({ x: -1, y: 0 }); // left
            
            const data = recorder.stopRecording(100);
            expect(data.inputs.length).toBe(2);
            expect(data.inputs[0].direction).toBe('up');
            expect(data.inputs[1].direction).toBe('left');
        });

        it('should not record when not recording', () => {
            recorder.recordInput({ x: 0, y: -1 });
            recorder.startRecording(12345, 30, 30, [{ x: 5, y: 5 }], { x: 1, y: 0 }, 75);
            const data = recorder.stopRecording(0);
            expect(data.inputs.length).toBe(0);
        });
    });

    describe('advanceFrame', () => {
        it('should increment frame counter during recording', () => {
            recorder.startRecording(12345, 30, 30, [{ x: 5, y: 5 }], { x: 1, y: 0 }, 75);
            recorder.advanceFrame();
            recorder.advanceFrame();
            recorder.recordInput({ x: 0, y: 1 }); // down
            
            const data = recorder.stopRecording(0);
            expect(data.inputs[0].frame).toBe(2);
        });
    });

    describe('stopRecording', () => {
        it('should return complete replay data', () => {
            const initialSnake = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
            const initialDirection = { x: 1, y: 0 };
            
            recorder.startRecording(12345, 30, 30, initialSnake, initialDirection, 75);
            recorder.recordInput({ x: 0, y: -1 });
            recorder.advanceFrame();
            
            const data = recorder.stopRecording(150);
            
            expect(data.version).toBe(1);
            expect(data.seed).toBe(12345);
            expect(data.gridWidth).toBe(30);
            expect(data.gridHeight).toBe(30);
            expect(data.initialSnake).toEqual(initialSnake);
            expect(data.initialDirection).toEqual(initialDirection);
            expect(data.finalScore).toBe(150);
            expect(data.speedPercent).toBe(75);
            expect(typeof data.timestamp).toBe('number');
            expect(recorder.getIsRecording()).toBe(false);
        });

        it('should make deep copies of arrays', () => {
            const initialSnake = [{ x: 5, y: 5 }];
            recorder.startRecording(12345, 30, 30, initialSnake, { x: 1, y: 0 }, 75);
            const data = recorder.stopRecording(0);
            
            // Modifying original should not affect recorded data
            initialSnake[0].x = 10;
            expect(data.initialSnake[0].x).toBe(5);
        });
    });
});

describe('ReplayPlayer', () => {
    let player: ReplayPlayer;
    const sampleReplay: ReplayData = {
        version: 1,
        seed: 12345,
        gridWidth: 30,
        gridHeight: 30,
        initialSnake: [{ x: 5, y: 5 }],
        initialDirection: { x: 1, y: 0 },
        inputs: [
            { frame: 0, direction: 'up' },
            { frame: 2, direction: 'left' },
            { frame: 5, direction: 'down' }
        ],
        finalScore: 100,
        timestamp: Date.now(),
        speedPercent: 75
    };

    beforeEach(() => {
        player = new ReplayPlayer();
    });

    describe('loadReplay', () => {
        it('should load replay data', () => {
            player.loadReplay(sampleReplay);
            expect(player.getReplayData()).toEqual(sampleReplay);
        });

        it('should reset player state', () => {
            player.loadReplay(sampleReplay);
            player.startPlayback(() => {}, () => {});
            player.advanceFrame();
            
            // Load again should reset
            player.loadReplay(sampleReplay);
            expect(player.getIsPlaying()).toBe(false);
            expect(player.getCurrentFrame()).toBe(0);
        });
    });

    describe('startPlayback', () => {
        it('should start playback', () => {
            player.loadReplay(sampleReplay);
            player.startPlayback(() => {}, () => {});
            expect(player.getIsPlaying()).toBe(true);
        });
    });

    describe('processFrame', () => {
        it('should call callback for inputs on current frame', () => {
            player.loadReplay(sampleReplay);
            const directions: { x: number; y: number }[] = [];
            player.startPlayback((dir) => directions.push(dir), () => {});
            
            // Frame 0 should have 'up' input
            player.processFrame();
            expect(directions.length).toBe(1);
            expect(directions[0]).toEqual({ x: 0, y: -1 });
        });

        it('should return null when paused', () => {
            player.loadReplay(sampleReplay);
            player.startPlayback(() => {}, () => {});
            player.togglePause();
            
            const result = player.processFrame();
            expect(result).toBeNull();
        });
    });

    describe('advanceFrame', () => {
        it('should increment current frame', () => {
            player.loadReplay(sampleReplay);
            player.startPlayback(() => {}, () => {});
            
            expect(player.getCurrentFrame()).toBe(0);
            player.advanceFrame();
            expect(player.getCurrentFrame()).toBe(1);
        });

        it('should not advance when paused', () => {
            player.loadReplay(sampleReplay);
            player.startPlayback(() => {}, () => {});
            player.togglePause();
            
            player.advanceFrame();
            expect(player.getCurrentFrame()).toBe(0);
        });
    });

    describe('togglePause', () => {
        it('should toggle pause state', () => {
            player.loadReplay(sampleReplay);
            player.startPlayback(() => {}, () => {});
            
            expect(player.getIsPaused()).toBe(false);
            player.togglePause();
            expect(player.getIsPaused()).toBe(true);
            player.togglePause();
            expect(player.getIsPaused()).toBe(false);
        });
    });

    describe('setSpeed and getSpeed', () => {
        it('should set and get playback speed', () => {
            player.setSpeed(0.5);
            expect(player.getSpeed()).toBe(0.5);
            
            player.setSpeed(2);
            expect(player.getSpeed()).toBe(2);
        });
    });

    describe('skipToEnd', () => {
        it('should process all remaining inputs', () => {
            player.loadReplay(sampleReplay);
            const directions: { x: number; y: number }[] = [];
            const onComplete = vi.fn();
            
            player.startPlayback((dir) => directions.push(dir), onComplete);
            player.skipToEnd();
            
            expect(directions.length).toBe(3);
            expect(onComplete).toHaveBeenCalled();
        });
    });

    describe('stopPlayback', () => {
        it('should stop playback and reset state', () => {
            player.loadReplay(sampleReplay);
            player.startPlayback(() => {}, () => {});
            player.advanceFrame();
            player.advanceFrame();
            
            player.stopPlayback();
            
            expect(player.getIsPlaying()).toBe(false);
            expect(player.getCurrentFrame()).toBe(0);
        });
    });

    describe('checkComplete', () => {
        it('should return true when all inputs processed', () => {
            const shortReplay: ReplayData = {
                ...sampleReplay,
                inputs: [{ frame: 0, direction: 'up' }]
            };
            
            player.loadReplay(shortReplay);
            player.startPlayback(() => {}, () => {});
            
            expect(player.checkComplete()).toBe(false);
            player.processFrame(); // Process the only input
            expect(player.checkComplete()).toBe(true);
        });
    });
});

describe('ReplayStorage', () => {
    const sampleReplay: ReplayData = {
        version: 1,
        seed: 12345,
        gridWidth: 30,
        gridHeight: 30,
        initialSnake: [{ x: 5, y: 5 }],
        initialDirection: { x: 1, y: 0 },
        inputs: [{ frame: 0, direction: 'up' }],
        finalScore: 100,
        timestamp: Date.now(),
        speedPercent: 75
    };

    // Use shared localStorage mock
    const localStorageMock = createLocalStorageMock();

    beforeEach(() => {
        // Setup global localStorage mock
        vi.stubGlobal('localStorage', localStorageMock);
        localStorageMock.clear();
    });

    describe('saveLastReplay and loadLastReplay', () => {
        it('should save and load replay data', () => {
            ReplayStorage.saveLastReplay(sampleReplay);
            const loaded = ReplayStorage.loadLastReplay();
            expect(loaded).toEqual(sampleReplay);
        });

        it('should return null when no replay saved', () => {
            expect(ReplayStorage.loadLastReplay()).toBeNull();
        });
    });

    describe('saveHighScoreReplay and loadHighScoreReplay', () => {
        it('should save high score replay', () => {
            const result = ReplayStorage.saveHighScoreReplay(sampleReplay);
            expect(result).toBe(true);
            expect(ReplayStorage.loadHighScoreReplay()).toEqual(sampleReplay);
        });

        it('should not overwrite higher score', () => {
            const higherScore = { ...sampleReplay, finalScore: 200 };
            const lowerScore = { ...sampleReplay, finalScore: 50 };
            
            ReplayStorage.saveHighScoreReplay(higherScore);
            const result = ReplayStorage.saveHighScoreReplay(lowerScore);
            
            expect(result).toBe(false);
            expect(ReplayStorage.loadHighScoreReplay()?.finalScore).toBe(200);
        });

        it('should overwrite lower score', () => {
            const lowerScore = { ...sampleReplay, finalScore: 50 };
            const higherScore = { ...sampleReplay, finalScore: 200 };
            
            ReplayStorage.saveHighScoreReplay(lowerScore);
            const result = ReplayStorage.saveHighScoreReplay(higherScore);
            
            expect(result).toBe(true);
            expect(ReplayStorage.loadHighScoreReplay()?.finalScore).toBe(200);
        });
    });

    describe('saveReplayToHistory and loadReplayHistory', () => {
        it('should save and return history capped at 50 entries', () => {
            const replays = Array.from({ length: 55 }).map((_, index) => ({
                ...sampleReplay,
                finalScore: index,
                timestamp: index
            }));

            replays.forEach(replay => ReplayStorage.saveReplayToHistory(replay));

            const history = ReplayStorage.loadReplayHistory();
            expect(history.length).toBe(50);
            expect(history[0].finalScore).toBe(54);
            expect(history[49].finalScore).toBe(5);
        });

        it('should return empty history when nothing saved', () => {
            expect(ReplayStorage.loadReplayHistory()).toEqual([]);
        });
    });

    describe('exportReplay and importReplay', () => {
        it('should export and import replay data', () => {
            const encoded = ReplayStorage.exportReplay(sampleReplay);
            expect(typeof encoded).toBe('string');
            expect(encoded.length).toBeGreaterThan(0);
            
            const imported = ReplayStorage.importReplay(encoded);
            expect(imported).toEqual(sampleReplay);
        });

        it('should return null for invalid import data', () => {
            expect(ReplayStorage.importReplay('invalid-base64!')).toBeNull();
            expect(ReplayStorage.importReplay('')).toBeNull();
        });

        it('should return null for valid base64 but invalid JSON', () => {
            const invalidJson = btoa('not json');
            expect(ReplayStorage.importReplay(invalidJson)).toBeNull();
        });

        it('should return null for valid JSON but missing required fields', () => {
            const incompleteData = btoa(encodeURIComponent(JSON.stringify({ version: 1 })));
            expect(ReplayStorage.importReplay(incompleteData)).toBeNull();
        });
    });

    describe('deleteReplayFromHistory', () => {
        it('should correctly remove an item at a valid index', () => {
            // Save 3 replays to history
            const replay1 = { ...sampleReplay, finalScore: 100, timestamp: 1 };
            const replay2 = { ...sampleReplay, finalScore: 200, timestamp: 2 };
            const replay3 = { ...sampleReplay, finalScore: 300, timestamp: 3 };
            
            ReplayStorage.saveReplayToHistory(replay1);
            ReplayStorage.saveReplayToHistory(replay2);
            ReplayStorage.saveReplayToHistory(replay3);
            
            // History should be [replay3, replay2, replay1] (latest first)
            let history = ReplayStorage.loadReplayHistory();
            expect(history.length).toBe(3);
            expect(history[0].finalScore).toBe(300);
            
            // Delete the middle item (index 1 = replay2)
            ReplayStorage.deleteReplayFromHistory(1);
            
            history = ReplayStorage.loadReplayHistory();
            expect(history.length).toBe(2);
            expect(history[0].finalScore).toBe(300);
            expect(history[1].finalScore).toBe(100);
        });

        it('should correctly remove the first item', () => {
            const replay1 = { ...sampleReplay, finalScore: 100, timestamp: 1 };
            const replay2 = { ...sampleReplay, finalScore: 200, timestamp: 2 };
            
            ReplayStorage.saveReplayToHistory(replay1);
            ReplayStorage.saveReplayToHistory(replay2);
            
            // Delete first item (index 0)
            ReplayStorage.deleteReplayFromHistory(0);
            
            const history = ReplayStorage.loadReplayHistory();
            expect(history.length).toBe(1);
            expect(history[0].finalScore).toBe(100);
        });

        it('should correctly remove the last item', () => {
            const replay1 = { ...sampleReplay, finalScore: 100, timestamp: 1 };
            const replay2 = { ...sampleReplay, finalScore: 200, timestamp: 2 };
            
            ReplayStorage.saveReplayToHistory(replay1);
            ReplayStorage.saveReplayToHistory(replay2);
            
            // Delete last item (index 1)
            ReplayStorage.deleteReplayFromHistory(1);
            
            const history = ReplayStorage.loadReplayHistory();
            expect(history.length).toBe(1);
            expect(history[0].finalScore).toBe(200);
        });

        it('should handle negative index gracefully', () => {
            const replay1 = { ...sampleReplay, finalScore: 100, timestamp: 1 };
            ReplayStorage.saveReplayToHistory(replay1);
            
            // Negative index should do nothing
            ReplayStorage.deleteReplayFromHistory(-1);
            
            const history = ReplayStorage.loadReplayHistory();
            expect(history.length).toBe(1);
            expect(history[0].finalScore).toBe(100);
        });

        it('should handle out of bounds index gracefully', () => {
            const replay1 = { ...sampleReplay, finalScore: 100, timestamp: 1 };
            ReplayStorage.saveReplayToHistory(replay1);
            
            // Index out of bounds should do nothing
            ReplayStorage.deleteReplayFromHistory(5);
            ReplayStorage.deleteReplayFromHistory(100);
            
            const history = ReplayStorage.loadReplayHistory();
            expect(history.length).toBe(1);
            expect(history[0].finalScore).toBe(100);
        });

        it('should handle deleting from empty history gracefully', () => {
            // No replays in history
            ReplayStorage.deleteReplayFromHistory(0);
            
            const history = ReplayStorage.loadReplayHistory();
            expect(history.length).toBe(0);
        });

        it('should handle localStorage errors gracefully', () => {
            const replay1 = { ...sampleReplay, finalScore: 100, timestamp: 1 };
            ReplayStorage.saveReplayToHistory(replay1);
            
            // Mock localStorage.setItem to throw an error
            vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });
            
            // Should not throw, just log warning
            expect(() => ReplayStorage.deleteReplayFromHistory(0)).not.toThrow();
            
            // Restore original setItem
            vi.mocked(localStorage.setItem).mockRestore();
        });
    });

    describe('clearReplayHistory', () => {
        it('should remove all history entries', () => {
            // Save multiple replays
            const replay1 = { ...sampleReplay, finalScore: 100, timestamp: 1 };
            const replay2 = { ...sampleReplay, finalScore: 200, timestamp: 2 };
            const replay3 = { ...sampleReplay, finalScore: 300, timestamp: 3 };
            
            ReplayStorage.saveReplayToHistory(replay1);
            ReplayStorage.saveReplayToHistory(replay2);
            ReplayStorage.saveReplayToHistory(replay3);
            
            expect(ReplayStorage.loadReplayHistory().length).toBe(3);
            
            // Clear all history
            ReplayStorage.clearReplayHistory();
            
            const history = ReplayStorage.loadReplayHistory();
            expect(history.length).toBe(0);
            expect(history).toEqual([]);
        });

        it('should handle clearing empty history gracefully', () => {
            // History is already empty
            expect(() => ReplayStorage.clearReplayHistory()).not.toThrow();
            
            const history = ReplayStorage.loadReplayHistory();
            expect(history.length).toBe(0);
        });

        it('should handle localStorage errors gracefully', () => {
            const replay1 = { ...sampleReplay, finalScore: 100, timestamp: 1 };
            ReplayStorage.saveReplayToHistory(replay1);
            
            // Mock localStorage.removeItem to throw an error
            vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
                throw new Error('Storage error');
            });
            
            // Should not throw, just log warning
            expect(() => ReplayStorage.clearReplayHistory()).not.toThrow();
            
            // Restore original removeItem
            vi.mocked(localStorage.removeItem).mockRestore();
        });
    });
});

describe('Replay Integration Tests', () => {
    // Use shared localStorage mock
    const localStorageMock = createLocalStorageMock();

    beforeEach(() => {
        vi.stubGlobal('localStorage', localStorageMock);
        localStorageMock.clear();
    });

    describe('Full record-playback cycle', () => {
        it('should correctly replay all recorded inputs at the right frames', () => {
            const recorder = new ReplayRecorder();
            const player = new ReplayPlayer();
            
            // Simulate a game session
            // Start recording
            recorder.startRecording(
                12345,
                30,
                30,
                [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
                { x: 1, y: 0 },
                75,
                'dark'
            );
            
            // Simulate game frames with inputs
            // Frame 0 - no input yet, just advance
            recorder.advanceFrame(); // Now at frame 1
            
            // Frame 1 - user presses down
            recorder.recordInput({ x: 0, y: 1 }); // Recorded at frame 1
            recorder.advanceFrame(); // Now at frame 2
            
            // Frame 2 - no input
            recorder.advanceFrame(); // Now at frame 3
            
            // Frame 3 - user presses left
            recorder.recordInput({ x: -1, y: 0 }); // Recorded at frame 3
            recorder.advanceFrame(); // Now at frame 4
            
            // Frame 4 - user presses up
            recorder.recordInput({ x: 0, y: -1 }); // Recorded at frame 4
            recorder.advanceFrame(); // Now at frame 5
            
            // Game ends
            const replayData = recorder.stopRecording(50);
            
            // Verify recorded data
            expect(replayData.inputs.length).toBe(3);
            expect(replayData.inputs[0]).toEqual({ frame: 1, direction: 'down' });
            expect(replayData.inputs[1]).toEqual({ frame: 3, direction: 'left' });
            expect(replayData.inputs[2]).toEqual({ frame: 4, direction: 'up' });
            
            // Now playback
            player.loadReplay(replayData);
            
            const appliedInputs: Array<{ frame: number; direction: { x: number; y: number } }> = [];
            player.startPlayback(
                (direction) => {
                    appliedInputs.push({ frame: player.getCurrentFrame(), direction });
                },
                () => {}
            );
            
            // Simulate playback frames - same loop structure as recording
            // Frame 0
            player.processFrame();
            player.advanceFrame(); // Now at frame 1
            
            // Frame 1 - should apply 'down'
            player.processFrame();
            player.advanceFrame(); // Now at frame 2
            
            // Frame 2 - no input
            player.processFrame();
            player.advanceFrame(); // Now at frame 3
            
            // Frame 3 - should apply 'left'
            player.processFrame();
            player.advanceFrame(); // Now at frame 4
            
            // Frame 4 - should apply 'up'
            player.processFrame();
            player.advanceFrame(); // Now at frame 5
            
            // Verify playback applied inputs at correct frames
            expect(appliedInputs.length).toBe(3);
            expect(appliedInputs[0]).toEqual({ frame: 1, direction: { x: 0, y: 1 } });
            expect(appliedInputs[1]).toEqual({ frame: 3, direction: { x: -1, y: 0 } });
            expect(appliedInputs[2]).toEqual({ frame: 4, direction: { x: 0, y: -1 } });
        });
        
        it('should handle input recorded before first advanceFrame', () => {
            const recorder = new ReplayRecorder();
            const player = new ReplayPlayer();
            
            recorder.startRecording(12345, 30, 30, [{ x: 5, y: 5 }], { x: 1, y: 0 }, 75, 'dark');
            
            // Input before any frame advance - recorded at frame 0
            recorder.recordInput({ x: 0, y: -1 });
            recorder.advanceFrame();
            
            const replayData = recorder.stopRecording(10);
            expect(replayData.inputs[0].frame).toBe(0);
            
            // Playback
            player.loadReplay(replayData);
            const appliedInputs: Array<{ frame: number; direction: { x: number; y: number } }> = [];
            player.startPlayback(
                (direction) => appliedInputs.push({ frame: player.getCurrentFrame(), direction }),
                () => {}
            );
            
            // First processFrame at frame 0 should apply the input
            player.processFrame();
            expect(appliedInputs.length).toBe(1);
            expect(appliedInputs[0].frame).toBe(0);
        });
        
        it('should store and retrieve replay from history correctly', () => {
            const recorder = new ReplayRecorder();
            
            recorder.startRecording(12345, 30, 30, [{ x: 5, y: 5 }], { x: 1, y: 0 }, 75, 'dark');
            recorder.recordInput({ x: 0, y: 1 });
            recorder.advanceFrame();
            recorder.recordInput({ x: -1, y: 0 });
            const replayData = recorder.stopRecording(100);
            
            // Save to history
            ReplayStorage.saveReplayToHistory(replayData);
            
            // Load from history
            const history = ReplayStorage.loadReplayHistory();
            expect(history.length).toBe(1);
            expect(history[0].inputs.length).toBe(2);
            expect(history[0].inputs[0].direction).toBe('down');
            expect(history[0].inputs[1].direction).toBe('left');
            expect(history[0].finalScore).toBe(100);
        });

        it('should handle multiple inputs at the same frame', () => {
            const recorder = new ReplayRecorder();
            const player = new ReplayPlayer();
            
            recorder.startRecording(12345, 30, 30, [{ x: 5, y: 5 }], { x: 1, y: 0 }, 75, 'dark');
            
            // Multiple inputs at frame 0 (user pressed keys rapidly)
            recorder.recordInput({ x: 0, y: -1 }); // up
            recorder.recordInput({ x: -1, y: 0 }); // left (last one should win)
            recorder.advanceFrame();
            
            const replayData = recorder.stopRecording(10);
            
            // Both inputs should be recorded
            expect(replayData.inputs.length).toBe(2);
            expect(replayData.inputs[0]).toEqual({ frame: 0, direction: 'up' });
            expect(replayData.inputs[1]).toEqual({ frame: 0, direction: 'left' });
            
            // Playback should apply BOTH inputs (last one wins due to setDirection behavior)
            player.loadReplay(replayData);
            const appliedInputs: Array<{ frame: number; direction: { x: number; y: number } }> = [];
            player.startPlayback(
                (direction) => appliedInputs.push({ frame: player.getCurrentFrame(), direction }),
                () => {}
            );
            
            // ProcessFrame should apply BOTH inputs at frame 0
            player.processFrame();
            expect(appliedInputs.length).toBe(2);
            expect(appliedInputs[0]).toEqual({ frame: 0, direction: { x: 0, y: -1 } });
            expect(appliedInputs[1]).toEqual({ frame: 0, direction: { x: -1, y: 0 } });
        });
    });
});
