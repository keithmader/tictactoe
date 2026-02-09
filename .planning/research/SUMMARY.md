# Project Research Summary

**Project:** CLI Tic Tac Toe Game
**Domain:** Interactive Command-Line Game with TypeScript and Ink.js
**Researched:** 2026-02-09
**Confidence:** HIGH

## Executive Summary

This is a command-line tic tac toe game that should feel modern and polished despite being text-based. Expert consensus is clear: use Ink.js (React for CLI) with TypeScript, implement keyboard navigation instead of numeric input, and build the AI with minimax algorithm tuned for medium difficulty. The React component model is perfect for this use case - game state lifts up to a root component while UI components remain presentational.

The recommended approach separates concerns cleanly: pure game logic functions (win detection, move validation) live separately from Ink components, AI decision-making is implemented as standalone pure functions, and keyboard input flows through Ink's useInput hook with proper focus management. Use Node.js 22 LTS, TypeScript 5.8, Ink 5.x with React 18, and modern tooling (tsx for development, tsup for production builds, Vitest for testing). This stack is mature, well-documented, and specifically designed for CLI applications.

Key risks center on terminal rendering and input management. Ink's default behavior causes flickering from excessive re-renders - enable incremental rendering mode from the start. Multiple useInput hooks create input chaos where keypresses trigger multiple actions simultaneously - use the isActive prop to ensure only one component handles input at a time. Process exit issues are common - always use the useApp hook and call exit() explicitly when the game ends. These pitfalls are well-understood and easily prevented with proper architecture decisions in Phase 1.

## Key Findings

### Recommended Stack

Use modern TypeScript tooling with Ink.js for a React-based CLI development experience. Node.js 22 LTS provides stable foundation with performance improvements (compile cache API, built-in watch mode), TypeScript 5.8 offers 2-3x faster builds, and Ink 5.x with React 18 provides production-stable CLI rendering. Avoid Ink v6 (still beta) and avoid heavyweight CLI frameworks designed for multi-command tools (commander, yargs) - this is a single-mode game that doesn't need that complexity.

**Core technologies:**
- **Node.js 22 LTS**: Runtime with active support through April 2027, includes performance features and security updates
- **TypeScript 5.8**: Latest stable with dramatic build performance improvements via compile cache API
- **Ink 5.x + React 18**: Industry-standard React-based CLI framework, production-stable, extensive ecosystem
- **tsx**: Blazing-fast TypeScript execution for development (10-100x faster than ts-node), zero configuration
- **tsup**: Zero-config bundler for distribution, outputs ESM + CJS + type declarations in one command
- **Vitest**: Modern test runner with excellent TypeScript support, better DX than Jest for CLI testing
- **chalk 5.x**: Terminal styling standard (100M+ weekly downloads), note v5 is ESM-only
- **Zod**: Runtime validation complementing TypeScript compile-time checks, perfect for game state validation

### Expected Features

Based on analysis of multiple CLI tic tac toe implementations and Ink.js best practices, the feature set breaks into three tiers.

**Must have (table stakes):**
- 3x3 grid display with ASCII art - universally recognized format
- Turn-based gameplay alternating between X and O
- Win detection for all 8 conditions (3 rows, 3 columns, 2 diagonals)
- Draw detection when board is full with no winner
- Move validation preventing occupied cell selection
- Player vs Computer mode with medium-difficulty AI
- Game end announcement with clear win/loss/draw messaging
- Play again prompt allowing multiple games without restart
- Input validation handling errors gracefully

**Should have (competitive differentiators):**
- Keyboard-driven navigation with arrow keys + Enter (PROJECT REQUIREMENT) - more modern than numeric input
- Visual cell highlighting showing cursor position before confirming move
- Color-coded players distinguishing X and O visually
- Win pattern highlighting emphasizing the winning line
- Responsive AI timing with brief "thinking" delay (300-500ms feels natural)
- Clear screen management preventing endless scrolling
- Help/controls display showing available keys at bottom

**Defer (v2+):**
- Scoreboard tracking wins/losses/draws across multiple games
- Game statistics with win rate calculations
- Instant restart via 'R' key for convenience
- Move feedback animations for visual polish

**Anti-features to avoid:**
- Multiple AI difficulty levels (project specifies medium difficulty - scope creep)
- Variable board sizes (3x3 is standard, larger boards change game fundamentally)
- Player vs Player mode (project specifies player vs computer only)
- Persistent storage/save games (games last 30-60 seconds, unnecessary complexity)
- Sound effects (intrusive in terminal environments)
- Mouse input (keyboard-only is faster and more consistent with CLI UX)

### Architecture Approach

Follow the standard React/Ink pattern: lift state up to a root Game component, implement game logic as pure functions separate from UI, and keep AI decision-making isolated. The component hierarchy is shallow - Game owns state and orchestrates flow, Board renders the grid and manages cursor state, Square components are purely presentational. This structure enables features like move history and undo if needed later.

**Major components:**
1. **Game (Root)** - Top-level state owner with history array and currentMove counter, orchestrates game flow, handles play-again logic
2. **Board** - Container rendering 3x3 grid with Ink Box components, handles move logic and keyboard navigation via useInput hook
3. **Square** - Individual cell presentation with highlight/focus state, purely presentational component receiving value and callbacks
4. **StatusDisplay** - Shows current player, winner, or game over message with color-coded text styling
5. **Game State Manager** - Pure functions for move validation, win/draw detection, board manipulation - completely framework-agnostic
6. **AI Player** - Minimax algorithm with depth limiting for medium difficulty, implemented as pure function taking board state and returning best move index
7. **Input Handler** - useInput hook with key binding logic, must use isActive prop to prevent multiple handlers conflicting

**Architectural patterns to follow:**
- Lifting state up (single source of truth in Game component)
- Immutable state updates (always create copies with .slice() or spread operator)
- Separation of UI and logic (game rules in pure functions, testable independently)
- Derived state over stored state (calculate currentPlayer from currentMove rather than storing separately)
- AI as pure function (synchronous decision-making, async execution for UX with setTimeout)

**Project structure:**
```
src/
├── components/      # React/Ink UI components
├── game-logic/      # Pure game logic (framework-agnostic)
├── ai/              # AI player implementation
├── hooks/           # Custom React hooks (useGameState, useAI)
├── types/           # TypeScript type definitions
├── ui.tsx           # Entry point component
└── cli.ts           # CLI entry point
```

### Critical Pitfalls

Research identified six critical pitfalls that commonly derail CLI game projects. These are well-documented anti-patterns with clear prevention strategies.

1. **Terminal flickering from excessive re-renders** - Ink's default erase-and-redraw cycle causes visible screen flashing. Prevention: enable incremental rendering mode in render options, use React.memo() for components, separate cursor state from board state to minimize re-renders. Address in Phase 1 by configuring Ink properly from the start.

2. **Multiple useInput hooks causing input chaos** - When multiple components call useInput(), the same keypress triggers all handlers simultaneously. Prevention: use isActive prop to enable/disable input capturing, ensure only one component has active input at any time, implement clear state machines for game modes (menu/playing/game-over). Address in Phase 2 when establishing input handling architecture.

3. **Process never exits after game ends** - useInput() starts stdin listening in raw mode, preventing automatic process exit. Prevention: always use useApp() hook to access exit() method, call exit() explicitly when user chooses not to play again, configure exitOnCtrlC option. Address in Phase 3 as part of game loop implementation.

4. **Input string vs character type mismatches** - useInput passes raw strings but game logic expects specific types. Prevention: validate and convert input types immediately in useInput handler, handle both single-character and paste events differently, create dedicated input validation layer. Address in Phase 2 before implementing game moves.

5. **State management confusion between game logic and UI state** - Mixing board state with cursor position creates bugs. Prevention: separate game state (board, players, score) from UI state (cursor, selection) into distinct containers, use useReducer for complex game state, never hold duplicate copies of state. Address in Phase 2 when establishing state architecture.

6. **Win condition checking incomplete or wrong** - Missing diagonal checks or incorrect indices. Prevention: implement win checking as pure function, test all 8 conditions explicitly, check win conditions before checking draw, write comprehensive tests. Address in Phase 2 with thorough testing.

## Implications for Roadmap

Based on combined research, I recommend a 4-phase roadmap that builds foundation first, then core gameplay, then polish, then AI. This order reflects natural dependency chains discovered in the architecture research and directly addresses pitfalls in the phases where they're most relevant.

### Phase 1: Foundation & Setup

**Rationale:** Establish project structure and configure Ink correctly before any feature work. This phase prevents the terminal flickering pitfall (critical #1) by setting up incremental rendering from the start. Getting the foundation right makes all subsequent phases easier.

**Delivers:** Working project skeleton with configured tooling, Ink rendering hello-world level output, TypeScript strict mode enabled, test infrastructure in place.

**Addresses:** Project setup, dependency installation, build configuration (tsup), development workflow (tsx), testing setup (Vitest + ink-testing-library).

**Avoids:** Terminal flickering pitfall by configuring Ink render options properly. Type safety issues by enabling strict mode immediately.

**Research flag:** No additional research needed - standard setup patterns well-documented in STACK.md.

### Phase 2: Core Game Logic

**Rationale:** Build the game engine as pure functions before touching UI. This enables independent testing and prevents state management confusion (pitfall #5). Win detection and move validation are foundational - everything depends on these working correctly.

**Delivers:** Complete game logic as pure TypeScript functions: board state management, move validation, win detection (all 8 conditions), draw detection. All logic testable without rendering any UI.

**Addresses:**
- From FEATURES.md: Win detection, draw detection, move validation
- From ARCHITECTURE.md: Game State Manager component, pure functions pattern
- From PITFALLS.md: Win condition checking (pitfall #6), state management separation (pitfall #5)

**Avoids:** State management confusion by establishing clear boundaries between game state and UI state. Win detection bugs by comprehensive testing of all 8 conditions plus draw scenarios.

**Research flag:** No additional research needed - tic tac toe logic is well-understood, patterns documented in ARCHITECTURE.md.

### Phase 3: Interactive Gameplay (Human vs Human)

**Rationale:** Build human-playable game before adding AI complexity. This establishes the complete input-to-render flow and addresses multiple input pitfalls (#2, #4). Starting with human-vs-human validates that core game loop works before AI complicates things.

**Delivers:** Playable tic tac toe with keyboard navigation. User can select cells with arrow keys, confirm with Enter, see board updates after each move, receive win/loss/draw announcements, and play multiple games.

**Addresses:**
- From FEATURES.md: 3x3 grid display, turn-based gameplay, keyboard navigation (PROJECT REQUIREMENT), visual cell highlighting, game end announcement, play again prompt
- From ARCHITECTURE.md: Board and Square components, input handler with useInput hook, status display
- From PITFALLS.md: Input handling (pitfall #2), input type validation (pitfall #4), process exit (pitfall #3)

**Avoids:** Multiple useInput conflicts by using isActive prop and establishing single input manager. Input type mismatches by validating immediately. Process exit issues by implementing useApp hook and exit() calls.

**Research flag:** No additional research needed - Ink input patterns well-documented in ARCHITECTURE.md and PITFALLS.md.

### Phase 4: AI Player (Medium Difficulty)

**Rationale:** Add AI as final feature once core gameplay is proven. AI is complex but isolated - implemented as pure functions that don't touch React state directly. Medium difficulty requires tuning (minimax with depth limit or randomness), which is easier to test when the rest of the game works perfectly.

**Delivers:** Computer opponent with medium difficulty. AI makes intelligent but beatable moves using minimax algorithm. "Thinking" delay provides natural feel. Player can win ~40-50% of games with reasonable play.

**Addresses:**
- From FEATURES.md: Player vs Computer mode, medium AI difficulty
- From ARCHITECTURE.md: AI Player component, minimax algorithm, async move handling
- From STACK.md: Pure TypeScript functions for AI, no external AI libraries needed

**Avoids:** Blocking synchronous AI by using setTimeout for move execution. Over-complicated AI by keeping it as pure functions separate from UI.

**Research flag:** May need targeted research if minimax tuning is difficult. FEATURES.md documents three approaches (depth limit, randomness, rule-based). Start with depth limit = 4, adjust based on playtesting.

### Phase 5: Polish & UX (Optional)

**Rationale:** Add after core gameplay and AI are complete and validated. These features enhance experience but aren't essential for functional game. Can be deferred to v1.1 if timeline is tight.

**Delivers:** Color-coded players (X cyan, O magenta), win pattern highlighting, clear screen management, help text display, move feedback animation, responsive AI timing refinement.

**Addresses:**
- From FEATURES.md: Color-coded players, win pattern highlighting, clear screen management, help/controls display, move feedback
- From PITFALLS.md: UX pitfalls like unclear turn indication, no feedback on invalid moves

**Avoids:** Scope creep by deferring to v1.1 if needed. These are nice-to-have improvements.

**Research flag:** No additional research needed - chalk integration and Ink color support well-documented in STACK.md.

### Phase Ordering Rationale

- **Foundation before features**: Configuring Ink rendering correctly (incremental mode) in Phase 1 prevents flickering issues that would plague all subsequent work
- **Logic before UI**: Pure game functions in Phase 2 enable testing without rendering, making Phase 3 implementation faster and more reliable
- **Human before AI**: Phase 3 establishes complete input-to-render flow with simpler two-human logic, making Phase 4 AI integration straightforward
- **Core before polish**: Phases 1-4 deliver functional game, Phase 5 adds visual polish that can be deferred if needed
- **Dependencies respected**: Each phase builds on previous - can't do keyboard input (Phase 3) without game logic (Phase 2), can't do AI (Phase 4) without working gameplay (Phase 3)

This order directly follows the build recommendations from ARCHITECTURE.md (types → logic → UI → AI) and addresses pitfalls in the phases where they're most relevant.

### Research Flags

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation)**: Node.js/TypeScript project setup is well-documented, no ambiguity
- **Phase 2 (Core Logic)**: Tic tac toe game logic is elementary CS, zero ambiguity
- **Phase 3 (Interactive)**: Ink useInput patterns extensively documented in official docs and ARCHITECTURE.md
- **Phase 5 (Polish)**: Terminal styling with chalk is straightforward, examples abundant

**Phase potentially needing targeted research:**
- **Phase 4 (AI Player)**: If minimax tuning proves difficult to balance for medium difficulty, may need focused research on evaluation function tuning or alternative approaches (randomness vs depth limiting). FEATURES.md documents three approaches but doesn't prescribe which is optimal. Start with depth=4, monitor playtesting results, invoke `/gsd:research-phase` if win rate falls outside 40-50% target range.

Overall, this project has exceptionally strong research coverage. All critical patterns are documented with high confidence. Only potential research gap is AI difficulty tuning, which is inherently empirical and must be validated through playtesting anyway.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core technologies verified through official GitHub repos, release notes, and npm registry. Version compatibility matrix complete. No ambiguity on tool selection. |
| Features | HIGH | Based on analysis of multiple CLI tic tac toe implementations, established CLI UX patterns, and Ink.js documentation. Feature set validated against real implementations. |
| Architecture | HIGH | React component patterns are universally documented. Ink-specific patterns confirmed through official Ink docs, tutorials, and working examples. Component hierarchy proven in multiple projects. |
| Pitfalls | MEDIUM | Pitfalls sourced from Ink GitHub issues, technical blog posts analyzing flickering problems, and community experience reports. All six critical pitfalls have documented prevention strategies, but some are based on developer experience rather than official docs. |

**Overall confidence: HIGH**

The combination of mature technologies (React, TypeScript, Node.js) with specialized CLI tooling (Ink.js) creates a well-trodden path. Tic tac toe game logic is elementary computer science with zero ambiguity. The only medium-confidence area is pitfalls, and even there, each pitfall has clear prevention strategies documented with examples.

### Gaps to Address

**Minimal gaps identified:**

1. **AI difficulty calibration**: Research documents three approaches for medium difficulty (minimax depth limit, randomness injection, rule-based hybrid) but doesn't definitively prescribe which achieves 40-50% player win rate. This is inherently empirical - must implement, playtest, and tune. Start with depth=4 based on FEATURES.md recommendation, adjust based on actual win rate data.

2. **Terminal compatibility edge cases**: Research covers major terminals (bash, zsh, Windows Terminal, tmux) but doesn't exhaustively document behavior on exotic terminals or specific terminal emulator versions. Mitigation: Test on major platforms during Phase 3, document known issues, rely on Ink.js abstraction layer to handle edge cases.

3. **Performance on slow terminals**: Pitfalls research addresses flickering but doesn't quantify performance on high-latency terminal connections (SSH over slow networks). Likely non-issue for localhost CLI game, but worth noting. Mitigation: Incremental rendering mode should help, but if issues arise, add FPS throttling.

**None of these gaps block initial implementation.** All can be addressed during relevant phases with empirical testing and tuning.

## Sources

### Primary (HIGH confidence)

Research aggregated sources from four parallel research files:

**From STACK.md:**
- [Ink GitHub Repository](https://github.com/vadimdemedes/ink) - React 18 requirement verification
- [TypeScript 5.8 Release Notes](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/) - Performance features
- [Node.js 22 LTS Announcement](https://nodejs.org/en/blog/announcements/v22-release-announce) - LTS status and features
- [tsx GitHub Repository](https://github.com/privatenumber/tsx) - TypeScript execution tool
- [tsup GitHub Repository](https://github.com/egoist/tsup) - Bundler documentation
- [ink-testing-library GitHub](https://github.com/vadimdemedes/ink-testing-library) - Testing utilities

**From FEATURES.md:**
- [GitHub CLI Tic Tac Toe Implementations](https://github.com/jordao76/tic-tac-toe-cli) - Feature analysis
- [Minimax Algorithm Tutorial](https://www.freecodecamp.org/news/how-to-make-your-tic-tac-toe-game-unbeatable-by-using-the-minimax-algorithm-9d690bad4b37/) - AI strategy
- [Command Line Interface Guidelines](https://clig.dev/) - UX best practices

**From ARCHITECTURE.md:**
- [React Official Tutorial: Tic-Tac-Toe](https://react.dev/learn/tutorial-tic-tac-toe) - Component hierarchy and state flow patterns
- [GitHub - vadimdemedes/ink](https://github.com/vadimdemedes/ink) - Architectural patterns
- [React + Ink CLI Tutorial - FreeCodeCamp](https://www.freecodecamp.org/news/react-js-ink-cli-tutorial/) - Component structure

**From PITFALLS.md:**
- [Ink Flickering Analysis](https://github.com/atxtechbro/test-ink-flickering/blob/main/INK-ANALYSIS.md) - Root cause analysis
- [Ink GitHub Issue #450](https://github.com/vadimdemedes/ink/issues/450) - Flickering when height equals stdout rows
- [Ink v3.2.0 Handbook](https://developerlife.com/2021/11/25/ink-v3-advanced-ui-components/) - useInput gotchas
- [React Anti-Patterns](https://blog.logrocket.com/react-patterns-common-pitfalls-local-state-management/) - State management issues

### Secondary (MEDIUM confidence)

- [Building CLI Apps with TypeScript in 2026](https://dev.to/hongminhee/building-cli-apps-with-typescript-in-2026-5c9d) - Modern patterns
- [Terminal Wordle with React Ink](https://spin.atomicobject.com/terminal-wordle-react-ink/) - Real-world game implementation
- [Using Ink UI with React - LogRocket](https://blog.logrocket.com/using-ink-ui-react-build-interactive-custom-clis/) - Architectural patterns
- [Design Tic Tac Toe Game - AlgoMaster](https://algomaster.io/learn/lld/design-tic-tac-toe) - Component separation

---
*Research synthesis completed: 2026-02-09*
*All four research files synthesized: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
*Ready for roadmap creation: YES*
