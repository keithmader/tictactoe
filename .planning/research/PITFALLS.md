# Pitfalls Research

**Domain:** CLI Tic Tac Toe Game with Ink.js and TypeScript
**Researched:** 2026-02-09
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Terminal Flickering from Excessive Re-renders

**What goes wrong:**
The entire terminal screen flickers constantly during gameplay as React state updates trigger full-tree traversals and complete screen redraws. This makes the game feel janky and unprofessional, especially in terminals like tmux that don't have sophisticated double-buffering.

**Why it happens:**
Ink's default rendering architecture performs full erase-and-redraw cycles on every React state change, regardless of which component actually updated. Game state changes (like player moves, board updates, score tracking) trigger frequent re-renders that cause visible flickering.

**How to avoid:**
- Enable incremental rendering mode in Ink's render options, which only updates changed lines instead of redrawing the entire output
- Set appropriate maximum frames per second (FPS) limits to throttle render updates
- Use React.memo() to prevent unnecessary component re-renders
- Keep the number of rendered nodes limited to what fits on the screen
- For static content like game history or completed moves, use the `<Static>` component which renders items once permanently above the rest of the UI

**Warning signs:**
- Screen flashes or blinks when moving the cursor or making moves
- Terminal content briefly disappears and reappears
- Noticeable lag between input and visual feedback
- Performance degradation in specific terminal emulators (especially tmux)

**Phase to address:**
Phase 1 (Foundation/Setup) - Configure Ink with incremental rendering from the start. Phase 2 (Core Game Logic) - Structure components to minimize re-renders during gameplay.

---

### Pitfall 2: Multiple useInput Hooks Causing Input Chaos

**What goes wrong:**
When multiple components each call `useInput()`, the same keyboard input triggers handlers in all components simultaneously. In a tic tac toe game, this could mean a single keypress moves the cursor, makes a move, and triggers the menu all at once, creating unpredictable behavior.

**Why it happens:**
Ink listens for input events on `process.stdin`, and all active `useInput` hooks receive the same event. Without proper management, components compete for input handling. Additionally, once `useInput()` is called, the Node.js process continues listening for input, preventing normal exit until explicitly handled.

**How to avoid:**
- Use the `isActive` option in `useInput` to enable/disable input capturing based on component state
- Only one component should have active input handling at any given time
- Implement a centralized input manager that controls which component receives input
- Always pair `useInput` with `useApp()` to properly handle exit scenarios
- Design clear state machines for game modes (menu, playing, game-over) where only the active mode's component accepts input

**Warning signs:**
- Keypresses trigger multiple actions simultaneously
- Cannot exit the game normally with Ctrl+C
- Menu navigation also triggers game moves
- Input feels "sticky" or unresponsive after certain actions
- Process doesn't exit after game ends

**Phase to address:**
Phase 2 (Core Game Logic) - Establish input handling architecture before implementing keyboard controls. Phase 3 (Game Loop) - Ensure proper input state management across game modes (playing vs. play-again prompt).

---

### Pitfall 3: Process Never Exits After Game Ends

**What goes wrong:**
After the game ends and displays "Play again? (Y/N)", the terminal hangs indefinitely. The user has to manually kill the process with Ctrl+C or by closing the terminal. This breaks the expected CLI game flow and frustrates users.

**Why it happens:**
Once `useInput()` is called, Node.js starts listening for input on `process.stdin` in raw mode, which prevents the process from exiting automatically. Without explicit calls to `exit()` from the `useApp()` hook, the process remains alive waiting for input that will never meaningfully be processed.

**How to avoid:**
- Always use `useApp()` hook to access the `exit()` method
- Call `exit()` explicitly when the user chooses not to play again
- Implement proper cleanup in game-over states
- Handle Ctrl+C gracefully by configuring the `exitOnCtrlC` option in Ink's render call
- Consider wrapping the Ink render in a loop at the CLI level to support true "play again" functionality (restart the process rather than trying to reset state)
- Test process exit behavior in all game-ending scenarios (win, loss, draw, quit)

**Warning signs:**
- Terminal cursor disappears after game ends
- Need to force-quit with Ctrl+C or terminal close
- Process appears in system monitor even after terminal shows game is over
- "Play again" prompt accepts input but nothing happens
- Terminal doesn't return to shell prompt automatically

**Phase to address:**
Phase 3 (Game Loop) - Implement proper exit handling as part of the play-again flow. This is a critical part of the game loop architecture, not an afterthought.

---

### Pitfall 4: Input String vs. Character Type Mismatches

**What goes wrong:**
User input arrives as strings from the terminal, but game logic expects specific types (numbers for board positions, specific characters for moves). Type mismatches cause runtime errors or silent failures where moves don't register. In TypeScript, this can slip through if input validation isn't strict.

**Why it happens:**
The `useInput` hook passes raw string input from the terminal. A paste event passes the entire pasted string, while character-by-character typing passes individual characters - the callback behavior differs. Developers often forget to convert, validate, and sanitize input before using it in game logic.

**How to avoid:**
- Always validate and convert input types immediately in the `useInput` handler
- Handle both single-character input and paste events differently (useInput behaves differently for pasted content)
- Create a dedicated input validation layer that returns typed, validated values
- Use TypeScript discriminated unions for valid input states
- Define clear mappings from keyboard input to game actions (e.g., arrow keys → cursor movement, numbers → cell selection)
- Write input handling tests that cover both character input and paste scenarios

**Warning signs:**
- Moves work sometimes but not others
- Error messages like "Cannot read property X of undefined"
- Number keys don't work but arrow keys do (or vice versa)
- Pasting multiple characters causes unexpected behavior
- TypeScript errors suppressed with type assertions instead of proper validation

**Phase to address:**
Phase 2 (Core Game Logic) - Build robust input validation before implementing game moves. Create types for valid game commands separate from raw terminal input.

---

### Pitfall 5: State Management Confusion Between Game Logic and UI State

**What goes wrong:**
Game state (board positions, current player, score) gets mixed with UI state (cursor position, selected cell, animation flags). This creates bugs where resetting UI state accidentally resets game state, or game moves don't update UI elements. In tic tac toe, this manifests as the cursor position interfering with which player's turn it is, or board state not matching what's displayed.

**Why it happens:**
React's component-based architecture makes it easy to scatter related state across multiple components. In CLI games with Ink, developers coming from web React don't realize terminal rendering has different concerns than DOM rendering. Over-reliance on single useState calls leads to monolithic state objects that are hard to reason about.

**How to avoid:**
- Separate game state (board, players, score) from UI state (cursor, selection, display mode) into distinct state containers
- Use useReducer for complex game state with clear actions (MAKE_MOVE, RESET_GAME, SWITCH_PLAYER)
- Keep UI state (cursor position, selected cell) in presentation components
- Never hold duplicate copies of state across components - determine a single source of truth
- Consider a simple state machine pattern for game modes (MENU → PLAYING → GAME_OVER)
- Use Context only for truly global state, not as a dumping ground for all state

**Warning signs:**
- Resetting the board also resets the cursor position or vice versa
- Multiple components holding copies of the same state
- Prop drilling through 3+ component levels
- State updates that should be independent happen together
- Need to manually sync state between components
- "It works in my component but breaks in the parent" bugs

**Phase to address:**
Phase 2 (Core Game Logic) - Establish state architecture before building features. Define clear boundaries between game logic state and UI state. Phase 3 (Game Loop) - Verify state separation when implementing reset/play-again functionality.

---

### Pitfall 6: Win Condition Checking Incomplete or Wrong

**What goes wrong:**
The game doesn't detect wins correctly - it announces winners too early, misses valid wins, or declares draws when someone won. Classic bugs include checking only rows but not columns, forgetting diagonal checks, or checking diagonals with incorrect indices.

**Why it happens:**
Tic tac toe win condition logic looks simple but has edge cases developers miss when rushing implementation: 3 rows, 3 columns, 2 diagonals = 8 conditions to check. Off-by-one errors in array indices, short-circuit logic that exits too early, and failure to check all conditions before declaring a draw are common mistakes.

**How to avoid:**
- Implement win checking as a pure function separate from React components
- Test all 8 win conditions explicitly: 3 rows, 3 columns, 2 diagonals
- Check win conditions before checking for draw (draw requires full board AND no winner)
- Use clear, readable patterns for checking (explicit row/col/diagonal functions, not clever but confusing one-liners)
- Write comprehensive tests: test each win condition individually, test draw scenarios, test in-progress games
- Consider representing the board as a linear array [0-8] and using index patterns for win conditions

**Warning signs:**
- Game declares winner before three in a row
- Valid three-in-a-row doesn't trigger win
- Draw declared when there's a winner
- Only horizontal or vertical wins work, not diagonals
- Win detection works for X but not O (or vice versa)
- Win declared on every move after a certain point

**Phase to address:**
Phase 2 (Core Game Logic) - Implement and test win condition logic thoroughly before building UI. This is pure business logic that should work independently of Ink/React.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Putting all game state in one giant object | Fast initial setup, fewer useState calls | Hard to reason about state updates, everything re-renders together, difficult to debug | Never - always separate concerns |
| Skipping TypeScript strict mode | Fewer initial type errors | Runtime bugs from type mismatches, silent failures in input handling | Never - strict mode catches CLI input bugs |
| Using console.log instead of Ink components | Easier debugging initially | Breaks Ink's rendering, causes screen corruption and flickering | Only during local development, must remove before commit |
| Not testing input validation | Faster to write move logic | Users can break the game with unexpected input, runtime crashes | Never - input validation is critical for CLI apps |
| Hardcoding terminal dimensions | Works on developer's terminal | Breaks on different terminal sizes, unplayable for some users | Only in MVP if explicitly documented, must fix before v1.0 |
| Mixing game logic with React components | Less boilerplate, faster to prototype | Impossible to test game logic independently, can't reuse logic | Acceptable in initial prototype (Phase 1), must refactor by Phase 2 |

## Integration Gotchas

Common mistakes when using Ink.js and related libraries.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| useInput hook | Forgetting to disable with `isActive: false` when component shouldn't handle input | Use state to control `isActive` prop, only one component active at a time |
| useApp exit() | Not calling exit() after game ends, process hangs | Always call exit() on user choosing not to play again |
| Static component | Using for dynamic game board (board state changes during play) | Use Static only for move history or completed games list, never for active game board |
| TypeScript with Ink | Using `any` for input types, losing type safety | Define specific types for game commands and board state, validate input to those types |
| React DevTools | Not knowing they work with Ink | Use React DevTools to inspect component tree and debug state issues |
| Terminal raw mode | Assuming input works the same in all terminals | Test in multiple terminals (bash, zsh, tmux, Windows Terminal) |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering entire board on every keystroke | Visible flickering, lag between input and display | Use React.memo for board cells, separate cursor state from board state | Immediately noticeable in any terminal |
| Not limiting rendered nodes | Performance degrades, more flickering | Use Static for history, limit displayed items to screen size | After ~10 games in history list |
| Creating new functions in render | Unnecessary re-renders of child components, performance degradation | Use useCallback for event handlers passed to children | Subtle, noticed with profiling |
| String concatenation for large output | Memory issues, slow rendering | Use Ink components for layout, not string building | Doesn't apply to tic tac toe (small output) |

## UX Pitfalls

Common user experience mistakes in CLI games.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual indication of whose turn it is | Users forget which symbol they are, make mistakes | Prominent display of current player with different colors |
| Cursor position not obvious | Users don't know which cell they'll select when they press Enter | Highlight selected cell with contrasting colors or brackets |
| No feedback when invalid move attempted | Users confused why nothing happened | Show error message "Cell already occupied" or similar |
| Move history scrolls off screen | Users can't review previous moves | Use Static component to maintain move history above board |
| No confirmation before quitting | Accidentally quit mid-game | Ask "Are you sure?" or require specific quit command (Q + Enter, not just Q) |
| Game over state unclear | Users don't realize game ended | Clear "Game Over!" message with distinct visual separator |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Input handling:** Often missing paste event handling - verify both single-char and multi-char paste
- [ ] **Game reset:** Often missing full state reset - verify board, players, cursor, score all reset
- [ ] **Process exit:** Often missing exit() call - verify process terminates cleanly after "no" to play again
- [ ] **Win detection:** Often missing diagonal or draw checks - verify all 8 win conditions plus draw
- [ ] **AI difficulty:** Often just random moves - verify AI actually implements medium difficulty strategy
- [ ] **Error handling:** Often missing invalid move feedback - verify user sees why their move was rejected
- [ ] **Terminal size handling:** Often hardcoded dimensions - verify works in 80x24, 120x40, etc.
- [ ] **Color/accessibility:** Often assumes 256-color terminal - verify fallback for basic 16-color terminals

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Flickering from excessive re-renders | LOW | Add React.memo to components, enable incremental rendering mode, use Static for history |
| Multiple useInput hooks conflict | MEDIUM | Refactor to single input manager, add isActive state control, may require component restructuring |
| Process won't exit | LOW | Add useApp hook, call exit() in game-over handlers, add exitOnCtrlC config |
| Input type mismatches | MEDIUM | Add input validation layer, create typed command objects, requires touching all input handling code |
| State management confusion | HIGH | Requires architectural refactor to separate concerns, extract game logic from components |
| Win detection bugs | LOW | Fix is simple once bug is found, main cost is comprehensive testing to find all cases |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Terminal flickering | Phase 1: Foundation | Check incremental rendering enabled in Ink render config |
| Multiple useInput conflicts | Phase 2: Core Game Logic | Review: only one useInput with isActive=true at any time |
| Process exit issues | Phase 3: Game Loop | Manual test: play game, say no to play again, verify clean exit |
| Input type mismatches | Phase 2: Core Game Logic | Unit tests for input validation, TypeScript strict mode enabled |
| State management confusion | Phase 2: Core Game Logic | Verify: game logic in pure functions, UI state separate from game state |
| Win detection bugs | Phase 2: Core Game Logic | Unit tests covering all 8 win conditions + draw + in-progress states |

## Sources

### Ink.js Core Concepts & Performance
- [GitHub - vadimdemedes/ink: React for interactive command-line apps](https://github.com/vadimdemedes/ink)
- [Ink 3 - Build command-line apps using React](https://vadimdemedes.com/posts/ink-3) - Performance improvements, Static component benefits
- [Building Beautiful CLIs with Ink (Medium, Jan 2026)](https://medium.com/@sohail_saifi/building-beautiful-clis-with-ink-yes-thats-react-running-in-your-terminal-683e25582d36)

### Rendering & Flickering Issues
- [Ink Flickering Analysis (GitHub atxtechbro)](https://github.com/atxtechbro/test-ink-flickering/blob/main/INK-ANALYSIS.md) - Root cause analysis of erase-and-redraw cycles
- [Flickering when rendering element with height equal to stdout rows (Issue #450)](https://github.com/vadimdemedes/ink/issues/450)
- [Claude Code Internals, Part 11: Terminal UI (Medium, Jan 2026)](https://kotrotsos.medium.com/claude-code-internals-part-11-terminal-ui-542fe17db016) - Differential renderer to reduce flickering

### Input Handling
- [Reference handbook for Ink v3.2.0 components (developerlife.com)](https://developerlife.com/2021/11/25/ink-v3-advanced-ui-components/) - useInput gotchas: paste behavior, multiple hooks
- [Interactive Terminal Apps with Ink 3 (InfoQ)](https://www.infoq.com/news/2020/08/ink3-hooks-devtool-terminal-apps/) - useInput improvements, key combination detection

### State Management Anti-Patterns
- [React patterns to avoid common pitfalls in local state management (LogRocket)](https://blog.logrocket.com/react-patterns-common-pitfalls-local-state-management/) - Prop drilling, over-reliance on state
- [6 React Anti-Patterns to Avoid (OOZOU)](https://oozou.com/blog/6-react-anti-patterns-to-avoid-206) - Direct state modification, unnecessary rerenders
- [State Management in React (2026) (TheLinuxCode)](https://thelinuxcode.com/state-management-in-react-2026-hooks-context-api-and-redux-in-practice/)

### Terminal Game Implementation
- [Building a Terminal Wordle Game with React Ink (Atomic Spin)](https://spin.atomicobject.com/terminal-wordle-react-ink/) - Real-world game implementation patterns
- [CLI Tic Tac Toe implementations](https://codelikethis.com/projects/tic-tac-toe) - Common mistakes in input validation and win condition checking

### TypeScript & Testing
- [Creating a terminal application with ink + React + Typescript (Medium)](https://medium.com/@pixelreverb/creating-a-terminal-application-with-ink-react-typescript-an-introduction-da49f3c012a8)
- [Advanced guide to Ink v3.2.0 with TypeScript (developerlife.com)](https://developerlife.com/2021/11/05/ink-v3-advanced/) - TypeScript patterns and testing approaches

---
*Pitfalls research for: CLI Tic Tac Toe Game with Ink.js and TypeScript*
*Researched: 2026-02-09*
