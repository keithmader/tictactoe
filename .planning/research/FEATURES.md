# Feature Landscape

**Domain:** CLI Tic Tac Toe Game
**Researched:** 2026-02-09
**Confidence:** HIGH

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 3x3 Grid Display | Core game mechanic, universally recognized format | Low | Use ASCII art with pipes and dashes for board visualization |
| Turn-based Gameplay | Fundamental tic tac toe rule | Low | Alternate between player (X) and computer (O) |
| Win Detection | Game must recognize 3-in-a-row (rows, columns, diagonals) | Low | Check all 8 winning combinations after each move |
| Draw Detection | Game must recognize when board is full with no winner | Low | Count moves or check for empty cells |
| Move Validation | Prevent placing marks in occupied cells | Low | Check cell state before accepting move |
| Player vs Computer | Single-player mode against AI opponent | Medium | Core requirement from project context |
| Visual Board Updates | Display current board state after each move | Low | Clear and redraw board with current positions |
| Game End Announcement | Clear messaging for win/loss/draw outcomes | Low | Display result and which player won |
| Play Again Prompt | Allow multiple games without restarting program | Low | Core requirement from project context |
| Input Validation | Handle invalid input gracefully (out of bounds, non-numeric) | Low | Validate 1-9 range for cell selection |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Keyboard-Driven Navigation | Modern TUI feel, no typing numbers | Medium | Use arrow keys + Enter instead of numeric input. Natural with Ink.js useInput hook |
| Visual Cell Highlighting | Show which cell is selected before confirming | Medium | Highlight current cursor position with color or brackets |
| Color-Coded Players | Distinguish X and O with different colors | Low | Use Ink.js color support for X (e.g., cyan) and O (e.g., magenta) |
| Win Pattern Highlighting | Visually highlight the winning row/column/diagonal | Medium | Change color of winning cells when game ends |
| Move Feedback Animation | Brief visual feedback when move is placed | Low | Flash or emphasis on newly placed mark |
| Scoreboard Tracking | Track wins/losses/draws across multiple games | Low | Persist stats during session, display between games |
| Game Statistics | Show win rate, total games played | Low | Calculate from scoreboard data |
| Instant Restart | Press 'R' to restart without going through prompt | Low | Convenient for quick replays |
| Responsive AI Timing | AI "thinks" briefly before moving (feels natural) | Low | 300-500ms delay before AI move |
| Clear Screen Management | Clean display that doesn't scroll endlessly | Low | Clear terminal before each board update |
| Help/Controls Display | Show available controls at bottom of screen | Low | "Arrow keys: move, Enter: select, Q: quit, R: restart" |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Multiple AI Difficulty Levels | Project specifies "medium difficulty" - adding easy/hard creates scope creep and testing burden | Implement one well-tuned medium AI that's beatable but challenging |
| Variable Board Sizes | 3x3 is the standard, larger boards fundamentally change game dynamics | Stick to 3x3, focus on polished UX instead |
| Player vs Player Mode | Project specifies "player vs computer" - adding PvP doubles game mode complexity | Single mode keeps scope focused |
| Network Multiplayer | Massive scope increase for CLI game with limited audience | Not applicable for single-player CLI game |
| Persistent Storage (save games) | Tic tac toe games last 30-60 seconds, no need to save | Session-only scoreboard is sufficient |
| Sound Effects | Terminal apps typically run in shared environments (offices), audio is intrusive | Visual feedback only |
| Mouse Input | Keyboard-only is faster and more consistent with CLI UX expectations | Keyboard navigation with arrow keys |
| Undo/Redo Moves | Against learning to play well, encourages trial-and-error | Allow restarting game instead |
| Move Timer/Clock | Creates pressure, not fun for casual game | Let players take their time |
| Tutorial/Teaching Mode | Overcomplicates for simple game everyone knows | Brief help text is sufficient |

## Feature Dependencies

```
Win Detection
    └──requires──> Board State Management
                       └──requires──> Move Validation

Draw Detection ──requires──> Board State Management

Play Again Prompt
    └──requires──> Game End Announcement
    └──requires──> Board Reset

Scoreboard Tracking
    └──requires──> Game End Detection
    └──enhances──> Play Again Flow (show stats between games)

Keyboard Navigation
    └──requires──> Cursor Position Tracking
    └──requires──> Input Handling (useInput hook)

Visual Cell Highlighting ──requires──> Keyboard Navigation

Win Pattern Highlighting
    └──requires──> Win Detection
    └──requires──> Color Support

Move Feedback Animation ──requires──> Board Display System

AI "Thinking" Delay ──requires──> Async Move Handling
```

### Dependency Notes

- **Board State Management is foundational**: Nearly all features depend on reliable board state tracking
- **Keyboard Navigation enhances multiple features**: Once implemented, enables visual highlighting and better UX
- **Scoreboard is independent**: Can be added after core gameplay works
- **Visual enhancements are progressive**: Color, highlighting, and animations build on basic display

## MVP Recommendation

### Launch With (v1)

Minimum viable product - what's needed to validate the concept.

- [ ] 3x3 Grid Display - Core game board
- [ ] Turn-based Gameplay - X and O alternating
- [ ] Move Validation - Prevent invalid moves
- [ ] Win Detection - Recognize winning patterns
- [ ] Draw Detection - Recognize full board
- [ ] Player vs Computer - Single player mode
- [ ] Medium AI - Beatable but challenging (minimax with depth limit or occasional random moves)
- [ ] Game End Announcement - Clear win/loss/draw messaging
- [ ] Play Again Prompt - Multiple games without restart
- [ ] Basic Input Validation - Handle errors gracefully

**Rationale**: These features deliver complete, playable tic tac toe. User can play, win/lose, and play again. No polish, but fully functional.

### Add After Core Works (v1.1)

Polish and UX improvements once gameplay is solid.

- [ ] Keyboard-Driven Navigation - Arrow keys + Enter (PROJECT REQUIREMENT per context)
- [ ] Color-Coded Players - Visual distinction between X and O
- [ ] Visual Cell Highlighting - Show cursor position
- [ ] Clear Screen Management - Clean display
- [ ] Help/Controls Display - Show available keys
- [ ] Responsive AI Timing - Brief delay before AI move
- [ ] Move Feedback - Visual confirmation of placement

**Rationale**: These make the game feel polished and modern. Add after core gameplay is proven to work. Keyboard navigation is specified in project context, so prioritize early in this phase.

### Add After Validation (v1.2+)

Features to add once usage validates the concept.

- [ ] Scoreboard Tracking - Win/loss/draw counts
- [ ] Game Statistics - Win rate calculations
- [ ] Win Pattern Highlighting - Visual emphasis on winning line
- [ ] Instant Restart - Quick 'R' key restart

**Rationale**: Nice-to-have features that improve repeat playability. Add if users play multiple sessions.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 3x3 Grid Display | HIGH | LOW | P1 |
| Turn-based Gameplay | HIGH | LOW | P1 |
| Win Detection | HIGH | LOW | P1 |
| Draw Detection | HIGH | LOW | P1 |
| Move Validation | HIGH | LOW | P1 |
| Player vs Computer | HIGH | MEDIUM | P1 |
| Game End Announcement | HIGH | LOW | P1 |
| Play Again Prompt | HIGH | LOW | P1 |
| Input Validation | HIGH | LOW | P1 |
| Medium AI | HIGH | MEDIUM | P1 |
| Keyboard Navigation | HIGH | MEDIUM | P2 |
| Color-Coded Players | MEDIUM | LOW | P2 |
| Visual Cell Highlighting | MEDIUM | MEDIUM | P2 |
| Clear Screen Management | MEDIUM | LOW | P2 |
| Help/Controls Display | MEDIUM | LOW | P2 |
| Responsive AI Timing | LOW | LOW | P2 |
| Move Feedback | LOW | LOW | P2 |
| Scoreboard Tracking | MEDIUM | LOW | P3 |
| Game Statistics | LOW | LOW | P3 |
| Win Pattern Highlighting | LOW | MEDIUM | P3 |
| Instant Restart | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch (core gameplay)
- P2: Should have, add for polish (UX improvements)
- P3: Nice to have, future consideration (engagement features)

## Implementation Notes

### AI Difficulty: Medium

**Goal**: Beatable but challenging. Players should win ~40-50% of the time with reasonable play.

**Approach Options**:
1. **Minimax with Depth Limit**: Full minimax but only look 3-4 moves ahead
2. **Minimax with Randomness**: Full minimax but make suboptimal move 20-30% of the time
3. **Rule-Based with Intelligence**: Check for wins, blocks, then strategic positioning (center, corners)

**Recommendation**: Minimax with randomness is easiest to tune. Start with 25% random move rate and adjust based on testing.

### Keyboard Navigation Pattern

**Input Mapping**:
- Arrow keys: Move cursor around 3x3 grid
- Enter: Place mark in selected cell
- Q: Quit game
- R: Restart current game
- Y/N: Yes/no for play again prompt

**Cursor State**: Track current row and column (0-2), handle wrapping at edges.

**Visual Indication**: Highlight selected cell with brackets, color, or inverse video.

### Board Display Pattern

```
     |     |
  1  |  2  |  3
_____|_____|_____
     |     |
  4  |  5  |  6
_____|_____|_____
     |     |
  7  |  8  |  9
     |     |
```

**With Keyboard Navigation**:
```
     |     |
  X  | [O] |
_____|_____|_____
     |     |
     |  X  |  O
_____|_____|_____
     |     |
  X  |     |
     |     |
```

### Ink.js Specific Considerations

**Strengths**:
- React component model fits game UI well
- useInput hook handles keyboard events cleanly
- useFocus enables proper focus management
- Color support via chalk integration
- Flexbox layout via Yoga for structured UI

**Implementation Pattern**:
```typescript
// Component structure
<App>
  <Header scoreboard={stats} />
  <Board
    state={gameState}
    cursor={cursorPos}
    winner={winningLine}
  />
  <Controls />
  <Status message={currentMessage} />
</App>
```

**State Management**: Use React hooks (useState, useEffect) for game state, cursor position, and score tracking.

## Competitor Feature Analysis

Based on research of CLI tic tac toe implementations:

| Feature | Common Pattern | Our Approach |
|---------|----------------|--------------|
| Input Method | Numeric (1-9) cell selection | Keyboard navigation (arrow keys) - more modern |
| Display | ASCII art board | ASCII art with Ink.js color support |
| AI | Various (random, minimax, rule-based) | Minimax with randomness for medium difficulty |
| Multi-game | Text prompt "Play again? (y/n)" | Same, with scoreboard display |
| Visual Feedback | Basic text updates | Color-coded players, highlighted selection |
| Screen Management | Scroll or manual clear | Ink.js auto-clearing for clean display |

**Our Differentiators**:
1. **Keyboard navigation** instead of numeric input (more intuitive)
2. **Visual cursor highlighting** (shows where you're selecting)
3. **Color-coded players** (easier to parse board state)
4. **Modern TUI feel** via Ink.js (not just raw console output)

## Sources

**CLI Tic Tac Toe Implementations:**
- [GitHub - elenamorton/cli-tic-tac-toe](https://github.com/elenamorton/cli-tic-tac-toe)
- [GitHub - jordao76/tic-tac-toe-cli](https://github.com/jordao76/tic-tac-toe-cli)
- [TicTacToe on the command line - Practicalli Clojure](https://practical.li/clojure/games/tictactoe-cli/)
- [GitHub - sclaxton/tictac: TicTacToe CLI with optimal AI](https://github.com/sclaxton/tictac)
- [Tic Tac Toe Command-Line Game (Python)](https://medium.com/@bblkmn5/tic-tac-toe-command-line-game-python-82e07b7acdfd)
- [Terminal Tic-Tac-Toe - Mark of the Lam](https://markofthelam.com/blog/tictactoe/)

**AI & Algorithms:**
- [Tic Tac Toe: Understanding the Minimax Algorithm](https://www.neverstopbuilding.com/blog/minimax)
- [How to make your Tic Tac Toe game unbeatable by using the minimax algorithm](https://www.freecodecamp.org/news/how-to-make-your-tic-tac-toe-game-unbeatable-by-using-the-minimax-algorithm-9d690bad4b37/)
- [Finding optimal move in Tic-Tac-Toe using Minimax Algorithm](https://www.geeksforgeeks.org/dsa/finding-optimal-move-in-tic-tac-toe-using-minimax-algorithm-in-game-theory/)
- [GitHub - f-a-tonmoy/Tic-Tac-Toe-AI: AI with Minimax and Alpha-Beta Pruning](https://github.com/f-a-tonmoy/Tic-Tac-Toe-AI)

**CLI UX Best Practices:**
- [Command Line Interface Guidelines](https://clig.dev/)
- [3 steps to create an awesome UX in a CLI application](https://opensource.com/article/22/7/awesome-ux-cli-application)
- [Elevate developer experiences with CLI design guidelines](https://www.thoughtworks.com/insights/blog/engineering-effectiveness/elevate-developer-experiences-cli-design-guidelines)

**Statistics & Scoreboard:**
- [GitHub - klfajardo/TicTacToe-CSharp: Console game with player statistics tracking](https://github.com/klfajardo/TicTacToe-CSharp)
- [Design Tic Tac Toe Game](https://algomaster.io/learn/lld/design-tic-tac-toe)

**Ink.js Framework:**
- [GitHub - vadimdemedes/ink: React for interactive command-line apps](https://github.com/vadimdemedes/ink)
- [Reference handbook for using Ink v3.2.0 components](https://developerlife.com/2021/11/25/ink-v3-advanced-ui-components/)
- [Creating a terminal application with ink + React + Typescript](https://medium.com/@pixelreverb/creating-a-terminal-application-with-ink-react-typescript-an-introduction-da49f3c012a8)
- [Terminal Wordle: Write a Wordle Clone for the Terminal with React Ink](https://spin.atomicobject.com/terminal-wordle-react-ink/)

**Terminal UI & Visual Feedback:**
- [Drawing (Text, Lines, and Color) | Terminal.Gui v2](https://gui-cs.github.io/Terminal.Gui/docs/drawing.html)
- [Terminal UI Libraries Insights](https://insights.linuxfoundation.org/collection/terminal-ui-libraries)

---
*Feature research for: CLI Tic Tac Toe Game*
*Researched: 2026-02-09*
*Confidence: HIGH - Based on multiple CLI tic tac toe implementations, established UX patterns, and Ink.js documentation*
