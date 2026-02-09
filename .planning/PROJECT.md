# Tic Tac Toe CLI

## What This Is

A command-line tic tac toe game built with TypeScript and Ink.js. The player launches the app, sees the board immediately, and plays against a computer opponent with medium-difficulty AI. After each game, they can choose to play again or exit.

## Core Value

The game starts instantly, feels responsive and interactive, and the computer provides a fun but beatable challenge.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Interactive CLI game using Ink.js for rendering
- [ ] 3x3 grid displayed immediately on launch
- [ ] Player is X, computer is O, player goes first
- [ ] Player selects cells via keyboard navigation
- [ ] Computer plays at medium difficulty (mix of smart and random moves)
- [ ] Detects win, loss, and draw conditions
- [ ] Announces winner/draw when game ends
- [ ] Asks "do you want to play again?" after each game
- [ ] Loops back to fresh board on "yes", exits on "no"

### Out of Scope

- Two-player mode — single player vs computer only
- Difficulty selection — medium only, no settings menu
- Score tracking across games — each game is standalone
- GUI or web interface — CLI only

## Context

- Ink.js is a React-based framework for building interactive CLI apps
- The game should feel native to the terminal — keyboard-driven, no mouse
- Medium AI: mix of strategic moves (block wins, take center) with occasional random picks

## Constraints

- **Tech stack**: TypeScript + Ink.js (user-specified)
- **Platform**: Command-line / terminal
- **Interaction**: Keyboard only — arrow keys or similar for cell selection

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Ink.js for TUI | User-specified — React-like component model for terminal UI | — Pending |
| Medium AI difficulty | Beatable but not trivial — mix of strategy and randomness | — Pending |
| Player is always X, goes first | Simplicity — no need for side selection | — Pending |

---
*Last updated: 2026-02-09 after initialization*
