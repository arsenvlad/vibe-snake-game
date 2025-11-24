import { Game } from './game/Game'
import type { ThemeName } from './game/themes'
import { themes, defaultTheme } from './game/themes'

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const game = new Game(canvas);
  const themeSelect = document.getElementById('theme-select') as HTMLSelectElement | null;

  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');

  const applyTheme = (theme: ThemeName) => {
    const validatedTheme: ThemeName = themes[theme] ? theme : defaultTheme;
    document.documentElement.setAttribute('data-theme', validatedTheme);
    localStorage.setItem('vibe-snake-theme', validatedTheme);
    game.setTheme(validatedTheme);

    if (themeSelect) {
      themeSelect.value = validatedTheme;
    }
  };

  const savedTheme = (localStorage.getItem('vibe-snake-theme') as ThemeName) || defaultTheme;
  applyTheme(savedTheme);

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
});
