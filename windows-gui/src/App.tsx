import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Board,
  Cell,
  Player,
  GameResult,
  createBoard,
  makeMove,
  checkResult,
  getWinningLine,
} from "./game-logic";
import { getAiMove } from "./ai";
import { createAudioEngine, type AudioEngine } from "./audio";

type Score = { wins: number; losses: number; draws: number };
type GameState = "password" | "intro" | "respond" | "gamelist" | "message" | "playing" | "gameover" | "prompt";

const gWaitTime = 3;
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
            window.close();
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
  }, [gameState, messageChars, messageText, countdown, exitAfterMessage, muteMessageSound]);

  // Countdown timer
  useEffect(() => {
    if (gameState === "message" && countdown !== null) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown((c) => c! - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setCountdown(null);
        setGameState("gamelist");
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

  // Keyboard input handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "password") {
        if (e.key === "Enter") {
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
        } else if (e.key === "Backspace") {
          setPasswordInput((p) => p.slice(0, -1));
          setPasswordError(false);
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          setPasswordInput((p) => p + e.key);
          setPasswordError(false);
        }
        return;
      }

      if (gameState === "intro") return;

      if (gameState === "respond") {
        if (e.key === "Enter") {
          setResponseInput((prev) => {
            if (prev.toLowerCase() === "yes") {
              setGameState("gamelist");
            } else if (prev.length > 0) {
              window.close();
            }
            return "";
          });
        } else if (e.key === "Backspace") {
          setResponseInput((p) => p.slice(0, -1));
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          setResponseInput((p) => p + e.key);
        }
        return;
      }

      if (gameState === "gamelist") {
        if (e.key === "Enter") {
          setGameChoice((prev) => {
            const num = parseInt(prev, 10);
            if (num >= 1 && num <= GAMES.length) {
              const selected = GAMES[num - 1];
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
            return "";
          });
        } else if (e.key === "Backspace") {
          setGameChoice((p) => p.slice(0, -1));
        } else if (e.key >= "0" && e.key <= "9") {
          setGameChoice((p) => p + e.key);
        }
        return;
      }

      if (gameState === "playing" && turn === "X" && !aiThinking) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setCursor((c) => (c < 3 ? c : c - 3));
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setCursor((c) => (c > 5 ? c : c + 3));
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setCursor((c) => (c % 3 === 0 ? c : c - 1));
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setCursor((c) => (c % 3 === 2 ? c : c + 1));
        }
        if (e.key === "Enter") {
          setCursor((currentCursor) => {
            setBoard((currentBoard) => {
              const next = makeMove(currentBoard, currentCursor, "X");
              if (next) {
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
                return next;
              }
              return currentBoard;
            });
            return currentCursor;
          });
        }
      }

      if (gameState === "prompt") {
        if (e.key === "y" || e.key === "Y") resetGame();
        if (e.key === "n" || e.key === "N") setGameState("gamelist");
      }

      if (e.key === "q" || e.key === "Q") {
        if (gameState === "playing" || gameState === "gameover" || gameState === "prompt") {
          setGameState("gamelist");
          setGameChoice("");
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [gameState, passwordInput, turn, aiThinking, audioReady, resetGame]);

  // Mouse click handler for cells
  const handleCellClick = (index: number) => {
    if (gameState !== "playing" || turn !== "X" || aiThinking) return;
    const next = makeMove(board, index, "X");
    if (next) {
      setBoard(next);
      setCursor(index);
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
  };

  const renderCell = (index: number) => {
    const cell: Cell = board[index];
    const isWinCell = winLine?.includes(index);
    const isCursor =
      gameState === "playing" && turn === "X" && !aiThinking && index === cursor;

    let content = "\u00A0"; // nbsp for empty
    let className = "cell";
    let spanClass = "";

    if (cell === "X") {
      content = "X";
      spanClass = isWinCell ? "win" : "x";
    } else if (cell === "O") {
      content = "O";
      spanClass = isWinCell ? "win" : "o";
    }

    if (isCursor) {
      className += " is-cursor";
      if (cell === null) content = "_";
    }

    return (
      <div
        key={index}
        className={className}
        onClick={() => handleCellClick(index)}
      >
        <span className={spanClass}>{content}</span>
      </div>
    );
  };

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
    <div className="terminal">
      {gameState === "password" && (
        <div>
          <div>
            Enter password:&nbsp;&nbsp;
            <span className="password-mask">{"*".repeat(passwordInput.length)}</span>
            <span className="cursor">_</span>
          </div>
          {passwordError && <div className="error">Access denied.</div>}
        </div>
      )}

      {gameState === "intro" && (
        <div>
          {INTRO_TEXT.slice(0, introChars).split("\n").map((line, i) => (
            <div key={i}>{line || "\u00A0"}</div>
          ))}
        </div>
      )}

      {gameState === "respond" && (
        <div>
          {INTRO_TEXT.split("\n").map((line, i, arr) => (
            <div key={i}>
              {line}
              {i === arr.length - 1 && (
                <>&nbsp;&nbsp;{responseInput}<span className="cursor">_</span></>
              )}
            </div>
          ))}
        </div>
      )}

      {gameState === "gamelist" && (
        <div>
          <div className="bold">LIST OF GAMES</div>
          <div className="spacer" />
          <div className="game-list">
            {Array.from({ length: Math.ceil(GAMES.length / 2) }, (_, i) => {
              const leftNum = String(i + 1).padStart(2);
              const rightIdx = i + Math.ceil(GAMES.length / 2);
              return (
                <React.Fragment key={i}>
                  <div className="game-list-item">
                    {leftNum}. {GAMES[i]}
                  </div>
                  <div className="game-list-item">
                    {rightIdx < GAMES.length
                      ? `${String(rightIdx + 1).padStart(2)}. ${GAMES[rightIdx]}`
                      : ""}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          <div className="spacer" />
          <div className="input-line">
            WHICH GAME?&nbsp;&nbsp;{gameChoice}
            <span className="cursor">_</span>
          </div>
        </div>
      )}

      {gameState === "message" && (
        <div>
          <div className="bold">
            {messageText.slice(0, messageChars).split("\n").map((line, i) => (
              <div key={i}>{line || "\u00A0"}</div>
            ))}
          </div>
          {countdown !== null && !exitAfterMessage && (
            <>
              <div className="spacer" />
              <div>RETURNING TO GAME MENU IN {countdown} SECONDS</div>
            </>
          )}
        </div>
      )}

      {(gameState === "playing" || gameState === "gameover" || gameState === "prompt") && (
        <div>
          <div className="title">Tic Tac Toe</div>
          <div className="spacer" />

          <div className="board">
            {Array.from({ length: 9 }, (_, i) => renderCell(i))}
          </div>

          <div className="spacer" />
          <div className="status">{statusMessage()}</div>

          <div className="spacer" />
          <div className="score">
            W:{score.wins} L:{score.losses} D:{score.draws}
          </div>

          {gameState === "prompt" && (
            <div style={{ marginTop: "12px" }}>
              <span className="color-yellow">
                Play again? (y/n)&nbsp;&nbsp;
                <span className="cursor">_</span>
              </span>
            </div>
          )}

          <div className="spacer" />
          <div className="hint">
            Arrow keys: move | Enter: place | Click: place | q: quit
          </div>
        </div>
      )}
    </div>
  );
}
