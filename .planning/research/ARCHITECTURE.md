# Architecture Research

**Domain:** CLI Tic-Tac-Toe Game with Ink.js
**Researched:** 2026-02-09
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer (Ink)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Game   │  │  Board  │  │ Square  │  │ Status  │        │
│  │ Screen  │  │Component│  │Component│  │ Display │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
├───────┴────────────┴────────────┴────────────┴──────────────┤
│                    Game Logic Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Game State Manager                      │    │
│  │  - Current board state (9-cell array)               │    │
│  │  - Player turn tracking                              │    │
│  │  - Win/draw detection                                │    │
│  │  - Move history                                      │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                      AI/Player Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  Human   │  │   AI     │  │ Minimax  │                   │
│  │  Player  │  │  Player  │  │Algorithm │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
├─────────────────────────────────────────────────────────────┤
│                     Input Handling                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  useInput Hook (Ink)                                 │    │
│  │  - Arrow keys for navigation                         │    │
│  │  - Enter/Space for selection                         │    │
│  │  - Escape/Q for quit                                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Game** (Root) | Top-level state owner, orchestrates game flow, handles play-again logic | React component with useState hooks for history, currentMove, game mode |
| **Board** | Renders 3x3 grid, displays status, handles move logic | Container component that receives board state and callbacks |
| **Square** | Individual cell presentation, handles selection UI | Presentational component with highlight/focus state |
| **StatusDisplay** | Shows current player, winner, or game over message | Presentational component with Text styling |
| **MenuScreen** | Game mode selection (PvP vs AI difficulty) | Initial screen with useInput for menu navigation |
| **GameState Manager** | Validates moves, calculates winners, manages board | Pure functions or custom hook |
| **AI Player** | Generates computer moves based on difficulty | Minimax algorithm with depth limiting for medium difficulty |
| **Input Handler** | Maps keyboard events to game actions | useInput hook from Ink with key binding logic |

## Recommended Project Structure

```
src/
├── components/           # React/Ink UI components
│   ├── Game.tsx         # Root component, game orchestration
│   ├── Board.tsx        # Board container with grid layout
│   ├── Square.tsx       # Individual square with focus state
│   ├── StatusDisplay.tsx # Game status messages
│   └── MenuScreen.tsx   # Initial game mode selection
├── game-logic/          # Pure game logic (framework-agnostic)
│   ├── board.ts         # Board state manipulation
│   ├── winner.ts        # Win/draw detection logic
│   └── validator.ts     # Move validation
├── ai/                  # AI player implementation
│   ├── minimax.ts       # Minimax algorithm
│   ├── evaluate.ts      # Position evaluation
│   └── difficulty.ts    # Difficulty level configurations
├── hooks/               # Custom React hooks
│   ├── useGameState.ts  # Game state management hook
│   ├── useAI.ts         # AI player hook
│   └── useInput.ts      # Input handling wrapper (if needed)
├── types/               # TypeScript type definitions
│   └── game.ts          # Game state, player, move types
├── ui.tsx               # Entry point component
└── cli.ts               # CLI entry point, renders <Game />
```

### Structure Rationale

- **components/:** Pure presentation layer using Ink components (Box, Text, useInput). Separating UI components makes them testable and reusable.
- **game-logic/:** Framework-agnostic pure functions for game rules. This separation allows logic to be tested independently and potentially reused (e.g., web version later).
- **ai/:** Isolated AI implementation keeps complex algorithms separate. Medium difficulty can be achieved by limiting minimax depth or adding randomness.
- **hooks/:** Custom hooks encapsulate stateful logic following React patterns. useGameState manages history and time-travel, useAI triggers computer moves.
- **types/:** Centralized TypeScript types ensure type safety across all modules.

## Architectural Patterns

### Pattern 1: Lifting State Up

**What:** Store game state in the top-level Game component and pass it down through props, while passing callbacks up for state updates.

**When to use:** Always for Ink.js CLI games. This is the React standard and works perfectly for tic-tac-toe's simple state.

**Trade-offs:**
- **Pros:** Single source of truth, predictable data flow, enables features like move history and undo
- **Cons:** Prop drilling if deeply nested (not an issue for tic-tac-toe's shallow hierarchy)

**Example:**
```typescript
function Game() {
  const [history, setHistory] = useState<Board[]>([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];

  function handlePlay(nextSquares: Board) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  return (
    <Board
      xIsNext={xIsNext}
      squares={currentSquares}
      onPlay={handlePlay}
    />
  );
}
```

### Pattern 2: Immutable State Updates

**What:** Never mutate state arrays or objects directly. Always create copies using .slice() or spread operator.

**When to use:** Every time you update game state, especially the board array.

**Trade-offs:**
- **Pros:** Enables time-travel/undo features, prevents subtle bugs, clearer change detection
- **Cons:** Slightly more memory usage (negligible for tic-tac-toe)

**Example:**
```typescript
function handleSquareClick(i: number) {
  if (calculateWinner(squares) || squares[i]) {
    return; // Ignore if game over or square occupied
  }
  const nextSquares = squares.slice(); // Create copy
  nextSquares[i] = xIsNext ? 'X' : 'O';
  onPlay(nextSquares);
}
```

### Pattern 3: Separation of UI and Logic

**What:** Keep game logic (win detection, move validation) in pure functions separate from React/Ink components.

**When to use:** Always. Pure functions are easier to test and can be reused across different UIs.

**Trade-offs:**
- **Pros:** Testable without rendering components, portable to other platforms, clear boundaries
- **Cons:** Requires more upfront organization (worth it even for small projects)

**Example:**
```typescript
// game-logic/winner.ts
export function calculateWinner(squares: Board): Player | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

// game-logic/board.ts
export function isBoardFull(squares: Board): boolean {
  return squares.every(square => square !== null);
}

// Then use in component
const winner = calculateWinner(squares);
const isDraw = !winner && isBoardFull(squares);
```

### Pattern 4: Derived State Over Stored State

**What:** Calculate values from existing state rather than storing redundant state variables.

**When to use:** For values that can be computed from other state (current player, game over status).

**Trade-offs:**
- **Pros:** Prevents state inconsistency, reduces bugs, simpler state management
- **Cons:** Slight computation overhead (negligible for tic-tac-toe)

**Example:**
```typescript
// Good: Derive from currentMove
const xIsNext = currentMove % 2 === 0;
const currentPlayer = xIsNext ? 'X' : 'O';

// Bad: Store separately (can get out of sync)
const [currentPlayer, setCurrentPlayer] = useState('X');
const [currentMove, setCurrentMove] = useState(0);
```

### Pattern 5: useInput Hook for Keyboard Navigation

**What:** Use Ink's useInput hook to capture keyboard events and map them to game actions.

**When to use:** For all keyboard interactions (arrow keys for cursor, Enter for selection, Q for quit).

**Trade-offs:**
- **Pros:** Non-blocking input handling, natural CLI UX, integrates with React rendering
- **Cons:** Requires focus management for multiple interactive elements

**Example:**
```typescript
function Board({ squares, selectedSquare, onMove, onSelect }) {
  useInput((input, key) => {
    if (key.leftArrow || input === 'h') {
      onSelect(Math.max(0, selectedSquare - 1));
    }
    if (key.rightArrow || input === 'l') {
      onSelect(Math.min(8, selectedSquare + 1));
    }
    if (key.upArrow || input === 'k') {
      onSelect(Math.max(0, selectedSquare - 3));
    }
    if (key.downArrow || input === 'j') {
      onSelect(Math.min(8, selectedSquare + 3));
    }
    if (key.return || input === ' ') {
      onMove(selectedSquare);
    }
    if (input === 'q' || key.escape) {
      process.exit(0);
    }
  });

  return <Box>{/* Render grid with highlight on selectedSquare */}</Box>;
}
```

### Pattern 6: AI as Pure Function

**What:** Implement AI decision-making as a pure function that takes board state and returns the best move.

**When to use:** For computer player implementation. Keep AI logic separate from React state.

**Trade-offs:**
- **Pros:** Testable, reusable, can run synchronously or in web worker if needed
- **Cons:** Need to handle async execution for user experience (show "thinking" state)

**Example:**
```typescript
// ai/minimax.ts
export function getBestMove(
  board: Board,
  player: Player,
  difficulty: 'easy' | 'medium' | 'hard'
): number {
  const depth = difficulty === 'medium' ? 4 : Infinity;
  const availableMoves = getAvailableMoves(board);

  let bestMove = availableMoves[0];
  let bestScore = -Infinity;

  for (const move of availableMoves) {
    const newBoard = makeMove(board, move, player);
    const score = minimax(newBoard, 0, depth, false, player);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// In component
useEffect(() => {
  if (!xIsNext && !winner) {
    const aiMove = getBestMove(squares, 'O', 'medium');
    setTimeout(() => handlePlay(aiMove), 500); // Delay for UX
  }
}, [xIsNext, winner]);
```

## Data Flow

### User Move Flow

```
User presses arrow key
    ↓
useInput hook captures event
    ↓
onSelect callback updates selectedSquare state
    ↓
Board re-renders with new highlight
    ↓
User presses Enter
    ↓
useInput captures Enter
    ↓
onMove(selectedSquare) callback
    ↓
Board.handleClick validates move
    ↓
Game.handlePlay updates history and currentMove
    ↓
React re-renders entire tree with new state
    ↓
Board shows updated squares, Status shows next player
```

### AI Move Flow

```
User makes valid move
    ↓
Game.handlePlay updates state
    ↓
xIsNext becomes false (AI's turn)
    ↓
useEffect detects !xIsNext && !winner
    ↓
getBestMove(squares, 'O', difficulty)
    ↓
Minimax algorithm evaluates positions
    ↓
Returns best move index
    ↓
setTimeout for 300-500ms (UX delay)
    ↓
Game.handlePlay called with AI move
    ↓
xIsNext becomes true (user's turn)
```

### State Management Flow

```
Game Component (State Owner)
    ├─ history: Board[]           // Array of board states
    ├─ currentMove: number        // Index into history
    ├─ gameMode: 'pvp' | 'ai'     // Play mode
    └─ difficulty: 'medium'       // AI difficulty
              ↓ (derived)
    xIsNext = currentMove % 2 === 0
    currentSquares = history[currentMove]
              ↓ (props down)
    Board Component
        ├─ xIsNext (prop)
        ├─ squares (prop)
        ├─ onPlay (callback)
        └─ selectedSquare (local state)
              ↓ (props down)
    Square Component (×9)
        ├─ value (prop: squares[i])
        ├─ isSelected (prop: i === selectedSquare)
        └─ No local state
```

### Key Data Flows

1. **History Management:** Complete game history stored as array of board states enabling undo/time-travel. New moves append to history. Jumping to previous move discards future moves.

2. **Turn Tracking:** Derived from currentMove using modulo (% 2 === 0 means X's turn). Prevents state inconsistency.

3. **Input to Action:** useInput hook maps keyboard events → selection/move callbacks → state updates → re-render.

4. **AI Triggering:** useEffect watches xIsNext. When it's AI's turn and game not over, triggers async AI move calculation.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Basic Game (MVP) | Single Game component, inline game logic, simple keyboard controls. Monolithic is fine. |
| Polished Game | Separate game logic into pure functions (testable), extract UI components (Board, Square, Status), add MenuScreen for mode selection. |
| Extended Features | Add hooks/ directory for useGameState and useAI, implement difficulty levels, add move history display with time-travel UI. |

### Scaling Priorities

1. **First bottleneck:** Minimax performance on first move (worst case). Fix: Add alpha-beta pruning, cache evaluations, or limit depth based on difficulty.

2. **Second bottleneck:** Complex input handling as features grow. Fix: Extract useGameInput custom hook that encapsulates all key bindings and focus management.

**Note:** For CLI tic-tac-toe, performance is never a real issue. The "scaling" is about code organization for maintainability, not runtime performance.

## Anti-Patterns

### Anti-Pattern 1: Storing Derived State

**What people do:**
```typescript
const [currentPlayer, setCurrentPlayer] = useState('X');
const [currentMove, setCurrentMove] = useState(0);

function handlePlay(squares) {
  setCurrentMove(currentMove + 1);
  setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X'); // Redundant!
}
```

**Why it's wrong:** Two sources of truth that can fall out of sync. If you jump to a previous move, you must remember to update both.

**Do this instead:**
```typescript
const [currentMove, setCurrentMove] = useState(0);
const currentPlayer = currentMove % 2 === 0 ? 'X' : 'O'; // Derived!

function handlePlay(squares) {
  setCurrentMove(currentMove + 1); // Player changes automatically
}
```

### Anti-Pattern 2: Mutating State Directly

**What people do:**
```typescript
function handleClick(i) {
  squares[i] = 'X'; // Direct mutation!
  onPlay(squares);
}
```

**Why it's wrong:** React doesn't detect the change because the array reference is the same. Component won't re-render. Time-travel breaks.

**Do this instead:**
```typescript
function handleClick(i) {
  const nextSquares = squares.slice(); // Create new array
  nextSquares[i] = 'X';
  onPlay(nextSquares);
}
```

### Anti-Pattern 3: Game Logic Inside Components

**What people do:**
```typescript
function Board() {
  const winner = useMemo(() => {
    // 20 lines of win detection logic inline...
    const lines = [[0,1,2], ...];
    for (const [a,b,c] of lines) { ... }
  }, [squares]);
}
```

**Why it's wrong:** Can't test logic without rendering component. Can't reuse in different UI. Mixes concerns. Hard to read.

**Do this instead:**
```typescript
// game-logic/winner.ts
export function calculateWinner(squares: Board): Player | null {
  // Pure function, easy to test
}

// components/Board.tsx
function Board() {
  const winner = calculateWinner(squares); // Import and call
}
```

### Anti-Pattern 4: Blocking Synchronous AI

**What people do:**
```typescript
function handlePlay(i) {
  // User move
  const nextSquares = squares.slice();
  nextSquares[i] = 'X';
  setSquares(nextSquares);

  // AI move immediately
  const aiMove = getBestMove(nextSquares, 'O'); // Blocks rendering!
  nextSquares[aiMove] = 'O';
  setSquares(nextSquares);
}
```

**Why it's wrong:** UI freezes while AI thinks. No "AI is thinking" indicator. Feels unresponsive.

**Do this instead:**
```typescript
// User move happens first
function handlePlay(nextSquares) {
  setHistory([...history, nextSquares]);
}

// Separate effect for AI
useEffect(() => {
  if (!xIsNext && !winner) {
    const aiMove = getBestMove(squares, 'O');
    setTimeout(() => handlePlay(makeAIMove(squares, aiMove)), 500);
  }
}, [xIsNext, winner]);
```

### Anti-Pattern 5: Complex State Machines for Simple Game

**What people do:** Use Redux, Zustand, or state machines for tic-tac-toe's simple state.

**Why it's wrong:** Massive overkill. Tic-tac-toe state is simple: array of 9 cells + move counter. useState is perfect.

**Do this instead:** Use React's built-in useState for history and currentMove. Only add state management library if building a complex CLI app with many screens and shared state.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Terminal (stdin/stdout) | Via Ink's render() function and useInput hook | Ink abstracts terminal interaction. No direct escape codes needed. |
| Node.js Process | process.exit() for quit, process.env for config | Standard Node.js patterns. Use process.exit(0) on 'q' keypress. |
| Package Registry | Import Ink and Ink-UI components via npm | Use ink@^5.0.0 (latest stable as of Jan 2025). Check for updates. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI Components ↔ Game Logic | Props down (board state), Callbacks up (move events) | Strict unidirectional flow. Game logic never imports UI. |
| AI ↔ Game Logic | Pure function calls (getBestMove receives board, returns move index) | AI uses game logic functions (getAvailableMoves, calculateWinner) but never touches React state directly. |
| Input Handling ↔ Components | useInput hook in components, callbacks trigger state updates | One useInput hook per screen. Pass callbacks down if multiple components need input. |

## Build Order Recommendations

Based on component dependencies, suggested implementation sequence:

### Phase 1: Core Foundation (Build First)
1. **Type definitions** (types/game.ts) - Board, Player, Move types
2. **Game logic** (game-logic/) - Pure functions: calculateWinner, isBoardFull, isValidMove
3. **Basic Board component** - Static 3x3 grid with hardcoded values to verify Ink layout

### Phase 2: Interactive Gameplay
4. **Game state management** - Add useState for history and currentMove in Game component
5. **Move handling** - Connect Board to Game via callbacks, implement handlePlay
6. **Input controls** - Add useInput for keyboard navigation and selection
7. **Square highlighting** - Visual feedback for selected square

### Phase 3: Game Flow
8. **Win/draw detection** - Integrate calculateWinner, display game over state
9. **StatusDisplay component** - Show current player, winner, or draw message
10. **Play-again prompt** - After game ends, ask if user wants to play again

### Phase 4: AI Player
11. **Minimax algorithm** - Implement in ai/minimax.ts with basic evaluation
12. **AI integration** - useEffect to trigger AI moves on computer's turn
13. **Difficulty tuning** - Adjust minimax depth for medium difficulty (depth=4 recommended)

### Rationale for Order:
- **Types first** enables TypeScript assistance throughout development
- **Logic before UI** allows testing game rules independently
- **Static before interactive** verifies layout before adding complexity
- **Human vs Human first** establishes core game loop before AI
- **AI last** because it depends on working game logic and can be most complex

## Sources

### High Confidence (Official Documentation & Tutorials)
- [GitHub - vadimdemedes/ink: React for interactive command-line apps](https://github.com/vadimdemedes/ink) - Official Ink.js repository with architecture overview
- [Tutorial: Tic-Tac-Toe – React](https://react.dev/learn/tutorial-tic-tac-toe) - React official tutorial showing component hierarchy and state flow
- [React + Ink CLI Tutorial – FreeCodeCamp](https://www.freecodecamp.org/news/react-js-ink-cli-tutorial/) - Component structure and state management patterns for Ink apps

### Medium Confidence (Technical Articles & Guides)
- [Using Ink UI with React to build interactive CLIs - LogRocket](https://blog.logrocket.com/using-ink-ui-react-build-interactive-custom-clis/) - Ink architectural patterns and useInput examples
- [Design Tic Tac Toe Game - AlgoMaster](https://algomaster.io/learn/lld/design-tic-tac-toe) - Component separation and game architecture patterns
- [Building CLI Tic Tac Toe Game with Node JS](https://blog.alvinend.tech/building-cli-tic-tac-toe-game-with-node-js) - CLI-specific game architecture (attempted to fetch, rate limited)
- [State Pattern - Game Programming Patterns](https://gameprogrammingpatterns.com/state.html) - Game state management patterns

### Community Resources
- [Building Reactive CLIs with Ink - DEV Community](https://dev.to/skirianov/building-reactive-clis-with-ink-react-cli-library-4jpa) - Ink.js project organization
- [Ink: React for interactive CLI apps - Hacker News](https://news.ycombinator.com/item?id=42016639) - Community discussion on Ink patterns
- [Build a Tic-Tac-Toe Game Engine With AI - Real Python](https://realpython.com/tic-tac-toe-ai-python/) - AI player architecture (Python but concepts transfer)

---
*Architecture research for: CLI Tic-Tac-Toe with Ink.js and TypeScript*
*Researched: 2026-02-09*
*Confidence: HIGH (based on official React/Ink docs and standard patterns)*
