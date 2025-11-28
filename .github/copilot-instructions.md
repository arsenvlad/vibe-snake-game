# Copilot Instructions for Snake Game

## Project Overview

This is a classic Snake game implementation built with TypeScript and Vite. The game features an auto-pilot mode powered by AI pathfinding algorithms, multiple themes, and audio effects.

## Technology Stack

- **TypeScript** - Primary programming language with strict type checking
- **Vite** - Build tool and development server
- **Vitest** - Testing framework
- **HTML5 Canvas** - Rendering engine for game graphics

## Build and Test Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── main.ts           # Application entry point
├── style.css         # Global styles
├── audio/            # Audio files and audio management
└── game/             # Core game logic
    ├── Game.ts       # Main game class with game loop
    ├── Snake.ts      # Snake entity and movement logic
    ├── Food.ts       # Food placement and scoring
    ├── AutoPilot.ts  # AI pathfinding for autonomous gameplay
    ├── Renderer.ts   # Canvas-based rendering system
    └── themes.ts     # Theme definitions (Dark, Light, Green, Red, Blue)
```

## Coding Conventions

- Use TypeScript with strict mode enabled
- Follow ES2022 syntax and features
- Use ESModules (`import`/`export` syntax)
- Keep game logic separate from rendering logic
- Write unit tests for testable game logic using Vitest
- Use descriptive variable and function names
- Prefer `const` over `let` when variables don't need reassignment

## Testing Guidelines

- Test files are co-located with their source files using `.test.ts` suffix
- Unit tests exist for: `Snake.ts`, `Food.ts`, `AutoPilot.ts`, `themes.ts`
- Use Vitest's `describe`, `it`, and `expect` for test structure
- Focus tests on pure functions and game logic calculations
- Mock Canvas API and other browser APIs when necessary

## Game Architecture

The game follows a simple game loop pattern:
1. **Update** - Process input, update snake position, check collisions
2. **Render** - Draw the game state to the canvas

Key components:
- `Game.ts` orchestrates the game loop and manages game state
- `Snake.ts` handles snake movement, growth, and self-collision detection
- `Food.ts` manages food spawning and collision with snake
- `AutoPilot.ts` implements pathfinding for AI-controlled gameplay
- `Renderer.ts` handles all canvas drawing operations
- `themes.ts` defines color schemes for different visual themes
