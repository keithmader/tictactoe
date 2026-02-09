# Roadmap: Tic Tac Toe CLI

**Project:** CLI Tic Tac Toe Game
**Created:** 2026-02-09
**Depth:** Quick (4 phases)
**Core Value:** The game starts instantly, feels responsive and interactive, and the computer provides a fun but beatable challenge.

## Overview

This roadmap delivers a polished command-line tic tac toe game in 4 phases. Foundation establishes the Ink.js project structure with proper rendering configuration. Core Game Engine implements pure game logic as testable functions. Interactive Gameplay builds the complete keyboard-driven UI with play-again loop. AI Opponent adds medium-difficulty computer player using minimax algorithm.

## Phases

### Phase 1: Foundation

**Goal:** Working TypeScript + Ink.js project with proper configuration

**Dependencies:** None (starting point)

**Requirements:**
- None (setup phase - no user-facing requirements)

**Success Criteria:**
1. Project builds successfully with TypeScript strict mode enabled
2. Ink renders "Hello World" to terminal without flickering
3. Tests run successfully with Vitest + ink-testing-library
4. Development workflow supports hot reload with tsx

**Notes:** Addresses terminal flickering pitfall by configuring Ink incremental rendering from the start. Sets up proper project structure (src/components, src/game-logic, src/ai).

---

### Phase 2: Core Game Engine

**Goal:** Complete game logic as pure, testable functions

**Dependencies:** Phase 1 (requires project structure)

**Requirements:**
- GAME-03: Players alternate turns (player → computer → player...)
- GAME-04: Occupied cells cannot be selected
- GAME-05: Game detects win condition (3 in a row/column/diagonal)
- GAME-06: Game detects draw condition (board full, no winner)
- GAME-07: Game announces winner or draw when game ends

**Success Criteria:**
1. Board state management functions work correctly (initialize, make move, get cell value)
2. Move validation prevents selecting occupied cells
3. Win detection correctly identifies all 8 win conditions (3 rows, 3 columns, 2 diagonals)
4. Draw detection triggers when board is full with no winner
5. All game logic tested independently without UI rendering

**Notes:** Implements game logic as pure TypeScript functions in src/game-logic. Separates game state from UI state. Comprehensive tests cover all win/draw scenarios.

---

### Phase 3: Interactive Gameplay

**Goal:** Fully playable human-vs-human game with keyboard navigation

**Dependencies:** Phase 2 (requires game logic)

**Requirements:**
- GAME-01: 3x3 grid displayed immediately on launch
- GAME-02: Player is X, computer is O, player goes first
- INPT-01: Player navigates board with arrow keys
- INPT-02: Player confirms move with Enter key
- INPT-03: Visual cursor highlights currently selected cell
- FLOW-01: "Do you want to play again?" prompt after game ends
- FLOW-02: Fresh board on "yes", program exits on "no"
- FLOW-03: Score tracking (wins/losses/draws) displayed across games
- VIS-01: X and O rendered in different colors
- VIS-02: Brief AI "thinking" delay before computer moves
- VIS-03: Help text showing controls displayed on screen

**Success Criteria:**
1. User sees 3x3 grid immediately on launch with help text displayed
2. User navigates cells with arrow keys and cursor highlights selected cell
3. User confirms move with Enter and board updates showing X or O in color
4. Game detects and announces win/loss/draw when conditions are met
5. User sees "Play again?" prompt, can restart with fresh board or exit cleanly
6. Score tracking displays current wins/losses/draws across multiple games

**Notes:** Implements Board, Square, and StatusDisplay components. Uses useInput hook with isActive prop to prevent input conflicts. Uses useApp hook for clean exit. Addresses pitfalls #2, #3, #4. Note: VIS-02 (AI thinking delay) implemented here but only visible after Phase 4 AI integration.

---

### Phase 4: AI Opponent

**Goal:** Computer player with medium difficulty using minimax

**Dependencies:** Phase 3 (requires working gameplay)

**Requirements:**
- AI-01: Computer makes legal moves on its turn
- AI-02: Computer plays at medium difficulty (beatable but strategic)

**Success Criteria:**
1. Computer automatically makes legal moves when it's O's turn
2. AI never selects occupied cells or makes invalid moves
3. AI plays strategically (blocks wins, takes center) but is beatable
4. Player wins 40-50% of games with reasonable play (medium difficulty validated)
5. Brief "thinking" delay provides natural feel before computer moves

**Notes:** Implements minimax algorithm with depth limit = 4 for medium difficulty. AI as pure function in src/ai. Uses setTimeout for async move execution. May need tuning based on playtesting to hit target win rate.

---

## Progress

| Phase | Status | Plans | Completion |
|-------|--------|-------|------------|
| 1 - Foundation | Pending | 0/0 | 0% |
| 2 - Core Game Engine | Pending | 0/0 | 0% |
| 3 - Interactive Gameplay | Pending | 0/0 | 0% |
| 4 - AI Opponent | Pending | 0/0 | 0% |

**Overall Progress:** 0/18 requirements complete (0%)

---

## Next Steps

1. Run `/gsd:plan-phase 1` to create executable plans for Foundation phase
2. Execute Phase 1 plans to establish project structure
3. Validate Ink rendering works without flickering before proceeding
4. Continue through phases sequentially (2 → 3 → 4)

---
*Last updated: 2026-02-09*
