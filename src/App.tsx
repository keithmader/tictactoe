import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput, useApp } from "ink";
import {
  Board,
  Cell,
  Player,
  GameResult,
  createBoard,
  makeMove,
  checkResult,
  getWinningLine,
} from "./game-logic.js";
import { getAiMove } from "./ai.js";

type Score = { wins: number; losses: number; draws: number };
type GameState = "playing" | "gameover" | "prompt";

export default function App() {
  const { exit } = useApp();
  const [board, setBoard] = useState<Board>(createBoard());
  const [cursor, setCursor] = useState(4);
  const [turn, setTurn] = useState<Player>("X");
  const [result, setResult] = useState<GameResult>(null);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [score, setScore] = useState<Score>({ wins: 0, losses: 0, draws: 0 });
  const [aiThinking, setAiThinking] = useState(false);

  const winLine = result && "winner" in result && result.winner ? getWinningLine(board) : null;

  const resetGame = useCallback(() => {
    setBoard(createBoard());
    setCursor(4);
    setTurn("X");
    setResult(null);
    setGameState("playing");
    setAiThinking(false);
  }, []);

  // AI turn
  useEffect(() => {
    if (turn === "O" && gameState === "playing" && !aiThinking) {
      setAiThinking(true);
      const delay = 300 + Math.random() * 200;
      const timer = setTimeout(() => {
        setBoard((prev) => {
          const move = getAiMove(prev);
          const next = makeMove(prev, move, "O");
          if (!next) return prev;
          const res = checkResult(next);
          if (res) {
            setResult(res);
            setGameState("gameover");
            if ("draw" in res) {
              setScore((s) => ({ ...s, draws: s.draws + 1 }));
            } else {
              setScore((s) => ({ ...s, losses: s.losses + 1 }));
            }
          } else {
            setTurn("X");
          }
          return next;
        });
        setAiThinking(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [turn, gameState, aiThinking]);

  // Transition from gameover to prompt after a brief pause
  useEffect(() => {
    if (gameState === "gameover") {
      const timer = setTimeout(() => setGameState("prompt"), 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  useInput((input, key) => {
    if (gameState === "playing" && turn === "X" && !aiThinking) {
      if (key.upArrow) setCursor((c) => (c < 3 ? c : c - 3));
      if (key.downArrow) setCursor((c) => (c > 5 ? c : c + 3));
      if (key.leftArrow) setCursor((c) => (c % 3 === 0 ? c : c - 1));
      if (key.rightArrow) setCursor((c) => (c % 3 === 2 ? c : c + 1));
      if (key.return) {
        const next = makeMove(board, cursor, "X");
        if (next) {
          setBoard(next);
          const res = checkResult(next);
          if (res) {
            setResult(res);
            setGameState("gameover");
            if ("draw" in res) {
              setScore((s) => ({ ...s, draws: s.draws + 1 }));
            } else {
              setScore((s) => ({ ...s, wins: s.wins + 1 }));
            }
          } else {
            setTurn("O");
          }
        }
      }
    }

    if (gameState === "prompt") {
      if (input === "y" || input === "Y") resetGame();
      if (input === "n" || input === "N") exit();
    }

    if (input === "q") exit();
  });

  const renderCell = (index: number): React.ReactNode => {
    const cell: Cell = board[index];
    const isWinCell = winLine?.includes(index);
    const isCursor =
      gameState === "playing" && turn === "X" && !aiThinking && index === cursor;

    let content = " ";
    let color: string | undefined;

    if (cell === "X") {
      content = "X";
      color = isWinCell ? "greenBright" : "cyan";
    } else if (cell === "O") {
      content = "O";
      color = isWinCell ? "greenBright" : "red";
    }

    if (isCursor && cell === null) {
      return (
        <Text backgroundColor="gray" color="white">
          {" "}
          {"_"}
          {" "}
        </Text>
      );
    }

    if (isCursor && cell !== null) {
      return (
        <Text backgroundColor="gray" color={color} bold>
          {" "}
          {content}
          {" "}
        </Text>
      );
    }

    return (
      <Text color={color} bold={isWinCell || false}>
        {" "}
        {content}
        {" "}
      </Text>
    );
  };

  const renderRow = (startIndex: number) => (
    <Box>
      {renderCell(startIndex)}
      <Text>|</Text>
      {renderCell(startIndex + 1)}
      <Text>|</Text>
      {renderCell(startIndex + 2)}
    </Box>
  );

  const separator = <Text>---+---+---</Text>;

  const statusMessage = (): string => {
    if (gameState === "gameover" || gameState === "prompt") {
      if (result && "draw" in result) return "It's a draw!";
      if (result && result.winner === "X") return "You win!";
      if (result && result.winner === "O") return "Computer wins!";
    }
    if (aiThinking) return "Computer is thinking...";
    return "Your turn (X)";
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="yellow">
        Tic Tac Toe
      </Text>
      <Text> </Text>

      {renderRow(0)}
      {separator}
      {renderRow(3)}
      {separator}
      {renderRow(6)}

      <Text> </Text>
      <Text bold>{statusMessage()}</Text>

      <Text> </Text>
      <Text dimColor>
        W:{score.wins} L:{score.losses} D:{score.draws}
      </Text>

      {gameState === "prompt" && (
        <Box marginTop={1}>
          <Text color="yellow">Play again? (y/n)</Text>
        </Box>
      )}

      <Text> </Text>
      <Text dimColor>Arrow keys: move | Enter: place | q: quit</Text>
    </Box>
  );
}
