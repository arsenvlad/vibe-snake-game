export type ThemeName = 'dark' | 'light' | 'green' | 'red' | 'blue' | 'purple';

export interface ThemeColors {
    canvasBg: string;
    gridColor: string;
    snakeHeadStart: string;
    snakeHeadEnd: string;
    snakeBodyStart: string;
    snakeBodyEnd: string;
    foodColor: string;
    foodGlow: string;
    obstacleStatic: string;
    obstacleMoving: string;
    obstacleTemporary: string;
}

export const themes: Record<ThemeName, ThemeColors> = {
    dark: {
        canvasBg: '#010409',
        gridColor: '#21262d',
        snakeHeadStart: '#ffffff',
        snakeHeadEnd: '#6366f1',
        snakeBodyStart: '#6366f1',
        snakeBodyEnd: '#ec4899',
        foodColor: '#238636',
        foodGlow: '#238636',
        obstacleStatic: '#ff6b6b',
        obstacleMoving: '#ffd93d',
        obstacleTemporary: '#6bcfff'
    },
    light: {
        canvasBg: '#edf2ff',
        gridColor: '#d3d9f5',
        snakeHeadStart: '#312e81',
        snakeHeadEnd: '#6366f1',
        snakeBodyStart: '#8b5cf6',
        snakeBodyEnd: '#f472b6',
        foodColor: '#16a34a',
        foodGlow: '#22c55e',
        obstacleStatic: '#dc2626',
        obstacleMoving: '#d97706',
        obstacleTemporary: '#0284c7'
    },
    green: {
        canvasBg: '#0b2f26',
        gridColor: '#184035',
        snakeHeadStart: '#d1fae5',
        snakeHeadEnd: '#10b981',
        snakeBodyStart: '#22c55e',
        snakeBodyEnd: '#166534',
        foodColor: '#bef264',
        foodGlow: '#a3e635',
        obstacleStatic: '#ef4444',
        obstacleMoving: '#f59e0b',
        obstacleTemporary: '#38bdf8'
    },
    red: {
        canvasBg: '#1a0a0a',
        gridColor: '#3d1515',
        snakeHeadStart: '#fef2f2',
        snakeHeadEnd: '#ef4444',
        snakeBodyStart: '#dc2626',
        snakeBodyEnd: '#7f1d1d',
        foodColor: '#fbbf24',
        foodGlow: '#f59e0b',
        obstacleStatic: '#3b82f6',
        obstacleMoving: '#22c55e',
        obstacleTemporary: '#a855f7'
    },
    blue: {
        canvasBg: '#0a1628',
        gridColor: '#1e3a5f',
        snakeHeadStart: '#e0f2fe',
        snakeHeadEnd: '#3b82f6',
        snakeBodyStart: '#60a5fa',
        snakeBodyEnd: '#1e40af',
        foodColor: '#fbbf24',
        foodGlow: '#f59e0b',
        obstacleStatic: '#ef4444',
        obstacleMoving: '#22c55e',
        obstacleTemporary: '#e879f9'
    },
    purple: {
        canvasBg: '#1a0a2e',
        gridColor: '#2d1b4e',
        snakeHeadStart: '#f3e8ff',
        snakeHeadEnd: '#a855f7',
        snakeBodyStart: '#c084fc',
        snakeBodyEnd: '#6b21a8',
        foodColor: '#fbbf24',
        foodGlow: '#f59e0b',
        obstacleStatic: '#ef4444',
        obstacleMoving: '#22c55e',
        obstacleTemporary: '#38bdf8'
    }
};

export const defaultTheme: ThemeName = 'dark';
