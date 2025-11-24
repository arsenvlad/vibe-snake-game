export type ThemeName = 'dark' | 'light';

export interface ThemeColors {
    canvasBg: string;
    gridColor: string;
    snakeHeadStart: string;
    snakeHeadEnd: string;
    snakeBodyStart: string;
    snakeBodyEnd: string;
    foodColor: string;
    foodGlow: string;
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
        foodGlow: '#238636'
    },
    light: {
        canvasBg: '#edf2ff',
        gridColor: '#d3d9f5',
        snakeHeadStart: '#312e81',
        snakeHeadEnd: '#6366f1',
        snakeBodyStart: '#8b5cf6',
        snakeBodyEnd: '#f472b6',
        foodColor: '#16a34a',
        foodGlow: '#22c55e'
    }
};

export const defaultTheme: ThemeName = 'dark';
