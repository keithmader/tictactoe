# Technology Stack

**Project:** CLI Tic Tac Toe Game
**Domain:** Command-line game with TypeScript and Ink.js
**Researched:** 2026-02-09
**Overall Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Node.js** | 22.x LTS | Runtime environment | Active LTS through April 2027. Includes built-in watch mode (stable), glob functions in fs module, and compile cache API for 2-3x faster TypeScript builds. OpenSSL 3.5.2 bundled for security. |
| **TypeScript** | 5.8.x | Type-safe language | Latest release (March 2025) with 2-3x faster build times via Node.js compile cache API, improved monorepo support, and optimized path normalization. Native TypeScript 7 compiler coming soon for even greater performance. |
| **Ink** | 5.x | React-based CLI UI framework | The standard for building React-based CLI applications. Version 5 supports React 18. Version 6 (beta) adds React 19 support but not yet stable. Use v5 for production stability. |
| **React** | 18.x | UI component library | Required peer dependency for Ink v5. React 19 support requires Ink v6 (currently beta). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **ink-testing-library** | 4.x | Testing Ink components | Essential for testing CLI UI components. Inspired by react-testing-library, provides `render()`, `lastFrame()`, and stdin mocking. |
| **Vitest** | Latest | Test runner | Modern, fast test runner powered by Vite. Better DX than Jest for TypeScript projects. Excellent watch mode and compatibility with CLI testing. |
| **tsx** | Latest | TypeScript execution | Blazing fast TypeScript execution powered by esbuild. Zero-config, 10-100x faster than ts-node. Use for development and running scripts. |
| **tsup** | Latest | TypeScript bundler | Zero-config bundler powered by esbuild. Outputs ESM + CJS + type declarations in one command. Perfect for CLI distribution. |
| **chalk** | 5.x | Terminal styling | Industry standard for terminal colors and styling. Supports 256 colors and Truecolor. Composable API. Note: v5 is ESM-only. |
| **Zod** | 3.x | Runtime validation | Type-safe runtime validation that complements TypeScript's compile-time checks. Perfect for validating game state and input. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **ESLint** | Code linting | Use `@typescript-eslint/eslint-plugin` for TypeScript support. ESLint 9+ compatibility improving in 2026. |
| **Prettier** | Code formatting | Opinionated formatter. Use `eslint-config-prettier` to avoid conflicts. |
| **Husky** | Git hooks | Run linting/tests pre-commit to maintain quality. |

## Installation

```bash
# Core dependencies
npm install ink@^5.0.0 react@^18.0.0 zod@^3.0.0 chalk@^5.0.0

# Dev dependencies
npm install -D typescript@^5.8.0 @types/node@^22.0.0 @types/react@^18.0.0
npm install -D tsx@latest tsup@latest
npm install -D vitest@latest ink-testing-library@^4.0.0
npm install -D eslint@latest prettier@latest
npm install -D @typescript-eslint/eslint-plugin@latest @typescript-eslint/parser@latest
npm install -D eslint-config-prettier@latest
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| **Runtime Execution** | tsx | ts-node | tsx is 10-100x faster (powered by esbuild vs TypeScript compiler). Zero-config. ts-node does type checking by default which slows development. |
| **Test Runner** | Vitest | Jest | Vitest has better TypeScript support, faster execution, better watch mode, and modern API. Jest configuration can be complex. |
| **Bundler** | tsup | webpack, rollup | tsup is zero-config and perfect for CLI tools. webpack is overkill for simple CLIs. rollup requires more configuration. |
| **CLI UI Framework** | Ink | blessed, blessed-contrib | Ink uses React component model which is familiar and maintainable. blessed has dated API and less active maintenance. |
| **Validation** | Zod | io-ts, yup | Zod has excellent TypeScript integration and cleaner API. io-ts is more complex. yup is less type-safe. |
| **Terminal Styling** | chalk | cli-color, colors | chalk is the industry standard with 100M+ weekly downloads. Better API and broader support. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Ink v6 (beta)** | Still in beta (released Oct 2025). React 19 support incomplete. May have breaking changes. | Ink v5 with React 18 |
| **ts-node** | 10-100x slower than tsx. Designed before TypeScript became mainstream - type safety bolted on. | tsx |
| **inquirer** | Not compatible with Ink's React component model. Would require mixing paradigms. | Ink's useInput hook + custom components |
| **commander / yargs** | This is a simple single-command game, not a multi-command CLI. Adds unnecessary complexity. | Process args directly or use minimist if needed |
| **chalk v4** | CommonJS only. v5 is ESM with better performance and modern module support. | chalk v5 |

## Stack Patterns by Game Feature

### For Keyboard Input

Use Ink's built-in `useInput` hook:
```typescript
import { useInput } from 'ink';

useInput((input, key) => {
  if (key.leftArrow) { /* handle left */ }
  if (key.rightArrow) { /* handle right */ }
  if (key.return) { /* handle enter */ }
});
```

**Why:** Ink's useInput is designed for CLI keyboard events and parses key combinations reliably (fixed in v3+). No need for external libraries.

### For Game State

Use React's built-in `useState` or `useReducer`:
```typescript
import { useState } from 'react';

const [board, setBoard] = useState<Board>(initialBoard);
```

**Why:** For a simple game like tic tac toe, React's state management is sufficient. No need for Redux, Zustand, or other state libraries. Keep it simple.

### For AI Logic

Implement minimax algorithm in pure TypeScript functions:
```typescript
function minimax(board: Board, depth: number, isMaximizing: boolean): number {
  // Pure function - no dependencies needed
}
```

**Why:** Game logic should be pure functions separate from UI. Easy to test, no dependencies needed. Minimax is a standard algorithm for perfect tic tac toe AI.

### For Testing

Combine Vitest + ink-testing-library:
```typescript
import { render } from 'ink-testing-library';
import { expect, test } from 'vitest';

test('renders board', () => {
  const { lastFrame } = render(<Game />);
  expect(lastFrame()).toContain('X');
});
```

**Why:** ink-testing-library provides utilities specifically for testing Ink apps. Vitest is fast and has excellent TypeScript support.

## Version Compatibility Matrix

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Ink 5.x | React 18.x, Node.js 18+ | Stable, production-ready |
| Ink 6.x (beta) | React 19.x, Node.js 18+ | Beta quality, React 19 support |
| tsx | TypeScript 5.x, Node.js 18+ | Works with any modern TS version |
| tsup | TypeScript 5.x, Node.js 18+ | esbuild-powered, version agnostic |
| chalk 5.x | Node.js 18+ (ESM) | ESM-only, requires Node 18+ |
| ink-testing-library 4.x | Ink 4-5, React 18 | Requires Node.js 18+ |

## Build & Distribution Strategy

### Development

```bash
# Run with hot reload
tsx --watch src/index.tsx

# Or use Ink's built-in watch via Node.js
node --watch --import tsx src/index.tsx
```

### Testing

```bash
# Run tests in watch mode
vitest

# Single run for CI
vitest run
```

### Production Build

```bash
# Bundle with tsup
tsup src/index.tsx --format esm --dts

# Output: dist/index.js + dist/index.d.ts
```

### Distribution

Add to package.json:
```json
{
  "type": "module",
  "bin": {
    "tictactoe": "./dist/index.js"
  },
  "files": ["dist"],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

Users can install with `npm install -g your-package` and run with `tictactoe`.

## Sources

### HIGH Confidence (Official Docs & GitHub)
- [Ink GitHub Repository](https://github.com/vadimdemedes/ink) - Verified React 18 requirement for v5, React 19 for v6 beta
- [Ink v5/v6 Package Compatibility](https://github.com/vadimdemedes/ink/blob/master/package.json) - Peer dependency verification
- [Ink useInput Hook](https://github.com/vadimdemedes/ink/blob/master/src/hooks/use-input.ts) - Keyboard event handling
- [TypeScript 5.7 & 5.8 Features](https://javascript-conference.com/blog/typescript-5-7-5-8-features-ecmascript-direct-execution/) - Performance improvements
- [TypeScript 5.8 Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/) - Official release details
- [Node.js 22 LTS Release](https://nodejs.org/en/blog/announcements/v22-release-announce) - Features and LTS status
- [Node.js 22 LTS Support](https://nodesource.com/blog/Node.js-v22-Long-Term-Support-LTS) - Active LTS confirmation
- [tsx GitHub Repository](https://github.com/privatenumber/tsx) - TypeScript execution tool
- [tsx vs ts-node Comparison](https://betterstack.com/community/guides/scaling-nodejs/tsx-vs-ts-node/) - Performance benchmarks
- [tsup GitHub Repository](https://github.com/egoist/tsup) - Bundler documentation
- [ink-testing-library GitHub](https://github.com/vadimdemedes/ink-testing-library) - Testing utilities

### MEDIUM Confidence (Community Resources, Multiple Sources)
- [Building CLI Apps with TypeScript in 2026](https://dev.to/hongminhee/building-cli-apps-with-typescript-in-2026-5c9d) - Modern TypeScript CLI patterns
- [Minimax Algorithm for Tic Tac Toe](https://www.freecodecamp.org/news/how-to-make-your-tic-tac-toe-game-unbeatable-by-using-the-minimax-algorithm-9d690bad4b37/) - AI implementation strategy
- [React Ink Game Development](https://medium.com/journocoders/create-a-news-game-with-ink-react-and-redux-part-ii-playing-your-game-on-the-web-5216e33043df) - State management patterns
- [ESLint & Prettier for TypeScript](https://medium.com/@robinviktorsson/setting-up-eslint-and-prettier-for-a-typescript-project-aa2434417b8f) - Development tooling setup
- [Terminal Styling with Chalk](https://medium.com/@sohail_saifi/adding-colors-and-spinners-to-your-cli-making-terminal-output-actually-pleasant-1f4110223b34) - CLI UX patterns

### Package Ecosystems
- [npm: ink](https://www.npmjs.com/package/ink) - Package registry (403 on fetch, but referenced in multiple sources)
- [npm: ink-testing-library](https://www.npmjs.com/package/ink-testing-library) - Testing utilities
- [npm: chalk](https://www.npmjs.com/package/chalk) - Terminal styling
- [npm: cli-spinners](https://www.npmjs.com/package/cli-spinners) - Spinner collection

---
*Stack research for: CLI Tic Tac Toe Game with TypeScript and Ink.js*
*Researched: 2026-02-09*
*Confidence: HIGH - All core technologies verified through official sources and GitHub repositories*
