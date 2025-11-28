import { Game } from './game/Game'
import type { ThemeName } from './game/themes'
import { themes, defaultTheme } from './game/themes'
import type { PlaybackSpeed } from './game/Replay'

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const game = new Game(canvas);
  const themeSelect = document.getElementById('theme-select') as HTMLSelectElement | null;
  const speedSlider = document.getElementById('speed-slider') as HTMLInputElement | null;
  const thicknessSlider = document.getElementById('thickness-slider') as HTMLInputElement | null;

  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');

  // Replay UI elements
  const watchReplayBtn = document.getElementById('watch-replay-btn');
  const watchBestReplayBtn = document.getElementById('watch-best-replay-btn');
  const replayPauseBtn = document.getElementById('replay-pause-btn');
  const speed05xBtn = document.getElementById('speed-0.5x-btn');
  const speed1xBtn = document.getElementById('speed-1x-btn');
  const speed2xBtn = document.getElementById('speed-2x-btn');
  const skipEndBtn = document.getElementById('skip-end-btn');
  const stopReplayBtn = document.getElementById('stop-replay-btn');
  const replayCompleteScreen = document.getElementById('replay-complete-screen');
  const replayPlayAgainBtn = document.getElementById('replay-play-again-btn');
  const replayWatchAgainBtn = document.getElementById('replay-watch-again-btn');

  const applyTheme = (theme: ThemeName) => {
    const validatedTheme: ThemeName = themes[theme] ? theme : defaultTheme;
    document.documentElement.setAttribute('data-theme', validatedTheme);
    localStorage.setItem('vibe-snake-theme', validatedTheme);
    game.setTheme(validatedTheme);

    if (themeSelect) {
      themeSelect.value = validatedTheme;
    }
  };

  const applySpeed = (speedPercent: number) => {
    const clampedSpeed = Math.max(0, Math.min(100, speedPercent));
    game.setSpeed(clampedSpeed);
    localStorage.setItem('vibe-snake-speed', clampedSpeed.toString());
  };

  const applyThickness = (level: number) => {
    const clampedLevel = Math.max(1, Math.min(5, level));
    game.setThickness(clampedLevel);
    localStorage.setItem('vibe-snake-thickness', clampedLevel.toString());
  };

  const savedTheme = (localStorage.getItem('vibe-snake-theme') as ThemeName) || defaultTheme;
  applyTheme(savedTheme);

  // Load saved speed or default to 75%
  const savedSpeed = localStorage.getItem('vibe-snake-speed');
  const initialSpeed = savedSpeed ? parseInt(savedSpeed, 10) : 75;
  applySpeed(initialSpeed);
  if (speedSlider) {
    speedSlider.value = initialSpeed.toString();
  }

  // Load saved thickness or default to 3 (medium)
  const savedThickness = localStorage.getItem('vibe-snake-thickness');
  const initialThickness = savedThickness ? parseInt(savedThickness, 10) : 3;
  applyThickness(initialThickness);
  if (thicknessSlider) {
    thicknessSlider.value = initialThickness.toString();
  }

  // Update watch best replay button visibility on load
  game.updateWatchBestReplayButton();

  startBtn?.addEventListener('click', () => {
    startScreen?.classList.add('hidden');
    game.start();
  });

  restartBtn?.addEventListener('click', () => {
    gameOverScreen?.classList.add('hidden');
    game.start();
  });

  themeSelect?.addEventListener('change', (event) => {
    const target = event.target as HTMLSelectElement;
    applyTheme(target.value as ThemeName);
  });

  speedSlider?.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement;
    applySpeed(parseInt(target.value, 10));
  });

  thicknessSlider?.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement;
    applyThickness(parseInt(target.value, 10));
  });

  // ================== REPLAY EVENT HANDLERS ==================

  // Watch last replay button (game over screen)
  watchReplayBtn?.addEventListener('click', () => {
    gameOverScreen?.classList.add('hidden');
    game.watchLastReplay();
  });

  // Watch best replay button (start screen)
  watchBestReplayBtn?.addEventListener('click', () => {
    startScreen?.classList.add('hidden');
    game.watchHighScoreReplay();
  });

  // Replay pause/resume button
  replayPauseBtn?.addEventListener('click', () => {
    game.toggleReplayPause();
  });

  // Speed buttons
  const setReplaySpeed = (speed: PlaybackSpeed) => {
    game.setReplaySpeed(speed);
    // Update button active states
    speed05xBtn?.classList.remove('active');
    speed1xBtn?.classList.remove('active');
    speed2xBtn?.classList.remove('active');
    if (speed === 0.5) speed05xBtn?.classList.add('active');
    else if (speed === 1) speed1xBtn?.classList.add('active');
    else if (speed === 2) speed2xBtn?.classList.add('active');
  };

  speed05xBtn?.addEventListener('click', () => setReplaySpeed(0.5));
  speed1xBtn?.addEventListener('click', () => setReplaySpeed(1));
  speed2xBtn?.addEventListener('click', () => setReplaySpeed(2));

  // Skip to end button
  skipEndBtn?.addEventListener('click', () => {
    game.skipReplayToEnd();
  });

  // Stop replay button
  stopReplayBtn?.addEventListener('click', () => {
    game.stopReplay();
    startScreen?.classList.remove('hidden');
  });

  // Replay complete screen - Play Again
  replayPlayAgainBtn?.addEventListener('click', () => {
    replayCompleteScreen?.classList.add('hidden');
    game.start();
  });

  // Replay complete screen - Watch Again
  replayWatchAgainBtn?.addEventListener('click', () => {
    replayCompleteScreen?.classList.add('hidden');
    game.watchLastReplay();
  });
});
