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
type GameState = "password" | "intro" | "playing" | "gameover" | "prompt";

const INTRO_TEXT = "GREETINGS PROFESSOR FALKEN.\nSHALL WE PLAY A GAME?";

export default function App() {
  const { exit } = useApp();
  const [board, setBoard] = useState<Board>(createBoard());
  const [cursor, setCursor] = useState(4);
  const [turn, setTurn] = useState<Player>("X");
  const [result, setResult] = useState<GameResult>(null);
  const [gameState, setGameState] = useState<GameState>("password");
  const [score, setScore] = useState<Score>({ wins: 0, losses: 0, draws: 0 });
  const [aiThinking, setAiThinking] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [introChars, setIntroChars] = useState(0);

  const winLine = result && "winner" in result && result.winner ? getWinningLine(board) : null;

  const resetGame = useCallback(() => {
    setBoard(createBoard());
    setCursor(4);
    setTurn("X");
    setResult(null);
    setGameState("playing");
    setAiThinking(false);
  }, []);

  // Intro typing effect
  useEffect(() => {
    if (gameState === "intro") {
      if (introChars < INTRO_TEXT.length) {
        const timer = setTimeout(() => setIntroChars((c) => c + 1), 62.5);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setGameState("playing"), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState, introChars]);

  // AI turn
  useEffect(() => {
    if (turn === "O" && gameState === "playing" && !aiThinking) {
      setAiThinking(true);
      const delay = 300 + Math.random() * 200;
      const timer = setTimeout(() => {
        const move = getAiMove(board);
        const next = makeMove(board, move, "O");
        if (!next) {
          setAiThinking(false);
          return;
        }
        setBoard(next);
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
        setAiThinking(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, gameState]);

  // Transition from gameover to prompt after a brief pause
  useEffect(() => {
    if (gameState === "gameover") {
      const timer = setTimeout(() => setGameState("prompt"), 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  useInput((input, key) => {
    if (gameState === "password") {
      if (key.return) {
        if (passwordInput === "Joshua") {
          setPasswordError(false);
          setGameState("intro");
        } else {
          setPasswordInput("");
          setPasswordError(true);
        }
      } else if (key.backspace || key.delete) {
        setPasswordInput((p) => p.slice(0, -1));
        setPasswordError(false);
      } else if (input.length === 1 && !key.ctrl && !key.meta) {
        setPasswordInput((p) => p + input);
        setPasswordError(false);
      }
      return;
    }

    if (gameState === "intro") return;

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
      {gameState === "password" && (
        <>
          <Text>Enter password: {"*".repeat(passwordInput.length)}<Text dimColor>_</Text></Text>
          {passwordError && <Text color="red">Access denied.</Text>}
        </>
      )}

      {gameState === "intro" && (
        <Text>{INTRO_TEXT.slice(0, introChars)}</Text>
      )}

      {(gameState === "playing" || gameState === "gameover" || gameState === "prompt") && (
        <>
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
        </>
      )}
    </Box>
  );
}
