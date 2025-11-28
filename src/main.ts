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
  const replayHistoryPanel = document.getElementById('replay-history-panel');
  const replayHistoryList = document.getElementById('replay-history-list');
  const replayHistoryCloseBtn = document.getElementById('replay-history-close-btn');
  const clearAllHistoryBtn = document.getElementById('clear-all-history-btn');
  const replayHistoryEmpty = document.getElementById('replay-history-empty');
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

  const formatReplayLabel = (timestamp: number, score: number) => {
    const date = new Date(timestamp);
    const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const timeLabel = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return `Score ${score} • ${dateLabel} ${timeLabel}`;
  };

  const renderReplayHistory = () => {
    if (!replayHistoryList || !replayHistoryEmpty) return;
    const history = game.getReplayHistory();
    replayHistoryList.innerHTML = '';

    if (!history.length) {
      replayHistoryEmpty.classList.remove('hidden');
      return;
    }

    replayHistoryEmpty.classList.add('hidden');
    history.forEach((replay, index) => {
      const listItem = document.createElement('li');
      listItem.classList.add('history-item');
      const themeInfo = replay.theme ? ` • ${replay.theme}` : '';
      listItem.innerHTML = `
        <div class="history-item__meta">
          <span class="history-item__title">${formatReplayLabel(replay.timestamp, replay.finalScore)}</span>
          <span class="history-item__details">Grid ${replay.gridWidth}x${replay.gridHeight} • Speed ${replay.speedPercent}%${themeInfo}</span>
        </div>
        <div class="history-item__actions">
          <button class="btn btn-small history-play-btn" data-history-index="${index}">Watch</button>
          <button class="icon-btn history-delete-btn" data-delete-index="${index}" title="Delete">🗑️</button>
        </div>
      `;
      replayHistoryList.appendChild(listItem);
    });
  };

  const toggleReplayHistory = (show: boolean) => {
    if (!replayHistoryPanel) return;
    if (show) {
      renderReplayHistory();
      replayHistoryPanel.classList.remove('hidden');
    } else {
      replayHistoryPanel.classList.add('hidden');
    }
  };

  replayHistoryCloseBtn?.addEventListener('click', () => toggleReplayHistory(false));

  clearAllHistoryBtn?.addEventListener('click', () => {
    if (confirm('Clear all replay history?')) {
      game.clearReplayHistory();
      renderReplayHistory();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      const isHidden = replayHistoryPanel?.classList.contains('hidden') ?? true;
      toggleReplayHistory(isHidden);
    }
  });

  replayHistoryList?.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    // Handle delete button click
    const deleteBtn = target.closest('button[data-delete-index]') as HTMLButtonElement | null;
    if (deleteBtn) {
      const index = parseInt(deleteBtn.dataset.deleteIndex ?? '-1', 10);
      if (index >= 0) {
        game.deleteReplayFromHistory(index);
        renderReplayHistory();
      }
      return;
    }
    
    // Handle watch button click
    const button = target.closest('button[data-history-index]') as HTMLButtonElement | null;
    if (!button) return;

    const index = parseInt(button.dataset.historyIndex ?? '-1', 10);
    const history = game.getReplayHistory();
    const replay = history[index];
    if (replay) {
      toggleReplayHistory(false);
      game.startReplay(replay);
    }
  });
});
