import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { createAudioEngine, type AudioEngine } from "./audio.js";

type Score = { wins: number; losses: number; draws: number };
type GameState = "password" | "intro" | "respond" | "gamelist" | "message" | "playing" | "gameover" | "prompt";

const gWaitTime = 5;
const INTRO_TEXT = "GREETINGS PROFESSOR FALKEN.\nSHALL WE PLAY A GAME?";
const GAMES = [
  "FALKEN'S MAZE",
  "BLACK JACK",
  "GIN RUMMY",
  "HEARTS",
  "BRIDGE",
  "CHECKERS",
  "CHESS",
  "BACKGAMMON",
  "POKER",
  "TIC TAC TOE",
  "FIGHTER COMBAT",
  "GUERRILLA ENGAGEMENT",
  "DESERT WARFARE",
  "AIR-TO-GROUND ACTIONS",
  "THEATERWIDE TACTICAL WARFARE",
  "THEATERWIDE BIOTOXIC AND CHEMICAL WARFARE",
  "GLOBAL THERMONUCLEAR WAR",
  "QUIT",
];
const GREETING_END = INTRO_TEXT.indexOf("\n");

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
  const [responseInput, setResponseInput] = useState("");
  const [gameChoice, setGameChoice] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messageChars, setMessageChars] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [exitAfterMessage, setExitAfterMessage] = useState(false);
  const [muteMessageSound, setMuteMessageSound] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  const [cursorVisible, setCursorVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 500);
    return () => clearInterval(interval);
  }, []);
  const blinker = cursorVisible ? "_" : " ";

  const winLine = result && "winner" in result && result.winner ? getWinningLine(board) : null;

  const resetGame = useCallback(() => {
    setBoard(createBoard());
    setCursor(4);
    setTurn("X");
    setResult(null);
    setGameState("playing");
    setAiThinking(false);
  }, []);

  // Initialize audio engine
  const audioRef = useRef<AudioEngine | null>(null);
  const pendingIntro = useRef(false);
  useEffect(() => {
    const engine = createAudioEngine();
    audioRef.current = engine;
    engine.init().then(() => {
      setAudioReady(true);
      if (pendingIntro.current) {
        pendingIntro.current = false;
        setGameState("intro");
      }
    });
    return () => {
      engine.close();
    };
  }, []);

  // Play sounds during intro
  const greetingSoundPlayed = useRef(false);
  const gameSoundPlayed = useRef(false);
  useEffect(() => {
    if (gameState === "intro" && audioRef.current) {
      if (!greetingSoundPlayed.current && introChars === 0) {
        greetingSoundPlayed.current = true;
        audioRef.current.loop("greeting");
      }
      if (!gameSoundPlayed.current && introChars === GREETING_END + 1) {
        gameSoundPlayed.current = true;
        audioRef.current.stop("greeting");
        audioRef.current.play("game");
      }
    }
  }, [gameState, introChars]);

  // Intro typing effect
  useEffect(() => {
    if (gameState === "intro") {
      if (introChars < INTRO_TEXT.length) {
        const timer = setTimeout(() => setIntroChars((c) => c + 1), 62.5);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setGameState("respond"), 1000);
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

  // Message typing effect with sound
  const messageSoundPlayed = useRef(false);
  const messageSoundStopped = useRef(false);
  useEffect(() => {
    if (gameState === "message" && audioRef.current) {
      const audio = audioRef.current;
      if (messageChars < messageText.length) {
        if (!messageSoundPlayed.current) {
          messageSoundPlayed.current = true;
          if (muteMessageSound) {
            audio.play("strange");
          } else {
            audio.loop("greeting");
          }
        }
        const timer = setTimeout(() => setMessageChars((c) => c + 1), 62.5);
        return () => clearTimeout(timer);
      } else if (countdown === null) {
        if (exitAfterMessage) {
          const timer = setTimeout(() => {
            audio.stop("greeting");
            exit();
          }, 3000);
          return () => clearTimeout(timer);
        } else {
          const soundDelay = muteMessageSound ? 3000 : 0;
          const timer = setTimeout(() => {
            if (!messageSoundStopped.current) {
              messageSoundStopped.current = true;
              if (muteMessageSound) {
                audio.stop("strange");
              } else {
                audio.stop("greeting");
              }
            }
            setCountdown(gWaitTime);
          }, soundDelay + 1000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [gameState, messageChars, messageText, countdown]);

  // Countdown timer
  useEffect(() => {
    if (gameState === "message" && countdown !== null) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown((c) => c! - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setCountdown(null);
        if (exitAfterMessage) {
          exit();
        } else {
          setGameState("gamelist");
        }
      }
    }
  }, [gameState, countdown]);

  // Transition from gameover to prompt after a brief pause
  useEffect(() => {
    if (gameState === "gameover") {
      const timer = setTimeout(() => setGameState("prompt"), 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  useInput((input, key) => {
    if (gameState === "password") {
      if (key.return) {
        if (passwordInput === "Joshua") {
          setPasswordError(false);
          if (audioReady) {
            setGameState("intro");
          } else {
            pendingIntro.current = true;
          }
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

    if (gameState === "respond") {
      if (key.return) {
        if (responseInput.toLowerCase() === "yes") {
          setResponseInput("");
          setGameState("gamelist");
        } else {
          exit();
        }
      } else if (key.backspace || key.delete) {
        setResponseInput((p) => p.slice(0, -1));
      } else if (input.length === 1 && !key.ctrl && !key.meta) {
        setResponseInput((p) => p + input);
      }
      return;
    }

    if (gameState === "gamelist") {
      if (key.return) {
        const num = parseInt(gameChoice, 10);
        if (num >= 1 && num <= GAMES.length) {
          const selected = GAMES[num - 1];
          setGameChoice("");
          if (selected === "TIC TAC TOE") {
            setGameState("playing");
          } else if (selected === "QUIT") {
            setMessageText("GOODBYE.");
            setMessageChars(0);
            setCountdown(null);
            setExitAfterMessage(true);
            setMuteMessageSound(false);
            messageSoundPlayed.current = false;
            messageSoundStopped.current = false;
            setGameState("message");
          } else if (selected === "GLOBAL THERMONUCLEAR WAR") {
            setMessageText("A STRANGE GAME.\nTHE ONLY WINNING MOVE IS\nNOT TO PLAY.");
            setMessageChars(0);
            setCountdown(null);
            setExitAfterMessage(false);
            setMuteMessageSound(true);
            messageSoundPlayed.current = false;
            messageSoundStopped.current = false;
            setGameState("message");
          } else {
            setMessageText("UNDER CONSTRUCTION...");
            setMessageChars(0);
            setCountdown(null);
            setExitAfterMessage(false);
            setMuteMessageSound(false);
            messageSoundPlayed.current = false;
            messageSoundStopped.current = false;
            setGameState("message");
          }
        }
      } else if (key.backspace || key.delete) {
        setGameChoice((p) => p.slice(0, -1));
      } else if (input >= "0" && input <= "9") {
        setGameChoice((p) => p + input);
      }
      return;
    }

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
      if (input === "n" || input === "N") setGameState("gamelist");
    }

    if (input === "q" || input === "Q") {
      setGameState("gamelist");
      setGameChoice("");
    }
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
          <Text>Enter password:  {"*".repeat(passwordInput.length)}{blinker}</Text>
          {passwordError && <Text color="red">Access denied.</Text>}
        </>
      )}

      {gameState === "intro" && (
        <Text>{INTRO_TEXT.slice(0, introChars)}</Text>
      )}

      {gameState === "respond" && (
        <Text>{INTRO_TEXT}  {responseInput}{blinker}</Text>
      )}

      {gameState === "gamelist" && (
        <Box flexDirection="column">
          <Text bold>LIST OF GAMES</Text>
          <Text> </Text>
          {Array.from({ length: Math.ceil(GAMES.length / 2) }, (_, i) => {
            const left = `${String(i + 1).padStart(2)}. ${GAMES[i]}`.padEnd(38);
            const rightIdx = i + Math.ceil(GAMES.length / 2);
            const right = rightIdx < GAMES.length
              ? `${String(rightIdx + 1).padStart(2)}. ${GAMES[rightIdx]}`
              : "";
            return <Text key={i}>{left}{right}</Text>;
          })}
          <Text> </Text>
          <Text>WHICH GAME?  {gameChoice}{blinker}</Text>
        </Box>
      )}

      {gameState === "message" && (
        <Box flexDirection="column">
          <Text bold>{messageText.slice(0, messageChars)}</Text>
          {countdown !== null && !exitAfterMessage && (
            <>
              <Text> </Text>
              <Text>RETURNING TO GAME MENU IN {countdown} SECONDS</Text>
            </>
          )}
        </Box>
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
              <Text color="yellow">Play again? (y/n)  {blinker}</Text>
            </Box>
          )}

          <Text> </Text>
          <Text dimColor>Arrow keys: move | Enter: place | q: quit</Text>
        </>
      )}
    </Box>
  );
}
