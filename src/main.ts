import { Game } from './game/Game'

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const game = new Game(canvas);

  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');

  startBtn?.addEventListener('click', () => {
    startScreen?.classList.add('hidden');
    game.start();
  });

  restartBtn?.addEventListener('click', () => {
    gameOverScreen?.classList.add('hidden');
    game.start();
  });
});
