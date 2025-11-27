import { describe, it, expect } from 'vitest';
import { themes, defaultTheme, type ThemeName, type ThemeColors } from './themes';

describe('themes', () => {
    describe('defaultTheme', () => {
        it('should be "dark"', () => {
            expect(defaultTheme).toBe('dark');
        });

        it('should be a valid theme name', () => {
            expect(themes[defaultTheme]).toBeDefined();
        });
    });

    describe('themes object', () => {
        const expectedThemes: ThemeName[] = ['dark', 'light', 'green', 'red', 'blue'];

        it('should contain all expected themes', () => {
            expectedThemes.forEach(themeName => {
                expect(themes[themeName]).toBeDefined();
            });
        });

        it('should have correct number of themes', () => {
            expect(Object.keys(themes)).toHaveLength(expectedThemes.length);
        });

        describe('theme properties', () => {
            const requiredProperties: (keyof ThemeColors)[] = [
                'canvasBg',
                'gridColor',
                'snakeHeadStart',
                'snakeHeadEnd',
                'snakeBodyStart',
                'snakeBodyEnd',
                'foodColor',
                'foodGlow'
            ];

            Object.entries(themes).forEach(([themeName, themeColors]) => {
                describe(`${themeName} theme`, () => {
                    requiredProperties.forEach(property => {
                        it(`should have ${property} property`, () => {
                            expect(themeColors[property]).toBeDefined();
                        });

                        it(`${property} should be a valid color string`, () => {
                            const colorValue = themeColors[property];
                            expect(typeof colorValue).toBe('string');
                            // Should be a hex color or valid CSS color
                            expect(colorValue.length).toBeGreaterThan(0);
                        });
                    });

                    it('should have valid hex colors', () => {
                        requiredProperties.forEach(property => {
                            const color = themeColors[property];
                            // Check if it's a valid hex color format
                            expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
                        });
                    });
                });
            });
        });
    });

    describe('dark theme', () => {
        it('should have dark canvas background', () => {
            expect(themes.dark.canvasBg).toBe('#010409');
        });

        it('should have green food color', () => {
            expect(themes.dark.foodColor).toBe('#238636');
        });
    });

    describe('light theme', () => {
        it('should have light canvas background', () => {
            expect(themes.light.canvasBg).toBe('#edf2ff');
        });
    });
});
