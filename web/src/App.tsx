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

/* SVG Icon Components */
function XIcon({ win }: { win?: boolean }) {
  return (
    <svg
      width="60%"
      height="60%"
      viewBox="0 0 24 24"
      fill="none"
      className={`icon-drop-in${win ? " icon-win" : ""}`}
    >
      <line
        x1="4" y1="4" x2="20" y2="20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="20" y1="4" x2="4" y2="20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OIcon({ win }: { win?: boolean }) {
  return (
    <svg
      width="60%"
      height="60%"
      viewBox="0 0 24 24"
      fill="none"
      className={`icon-drop-in${win ? " icon-win" : ""}`}
    >
      <circle
        cx="12" cy="12" r="8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

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

  // Refs for mobile-friendly input elements
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const respondInputRef = useRef<HTMLInputElement>(null);
  const gameChoiceInputRef = useRef<HTMLInputElement>(null);

  const winLine = result && "winner" in result && result.winner ? getWinningLine(board) : null;

  const resetGame = useCallback(() => {
    setBoard(createBoard());
    setCursor(4);
    setTurn("X");
    setResult(null);
    setGameState("playing");
    setAiThinking(false);
  }, []);

  // Reset everything back to the password screen
  const resetToStart = useCallback(() => {
    setBoard(createBoard());
    setCursor(4);
    setTurn("X");
    setResult(null);
    setScore({ wins: 0, losses: 0, draws: 0 });
    setAiThinking(false);
    setPasswordInput("");
    setPasswordError(false);
    setIntroChars(0);
    setResponseInput("");
    setGameChoice("");
    setMessageText("");
    setMessageChars(0);
    setCountdown(null);
    setExitAfterMessage(false);
    setMuteMessageSound(false);
    setGameState("password");
    if (audioRef.current) {
      audioRef.current.stopAll();
    }
    greetingSoundPlayed.current = false;
    gameSoundPlayed.current = false;
    messageSoundPlayed.current = false;
    messageSoundStopped.current = false;
  }, []);

  // Auto-focus input elements on screen transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (gameState === "password") passwordInputRef.current?.focus();
      else if (gameState === "respond") respondInputRef.current?.focus();
      else if (gameState === "gamelist") gameChoiceInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [gameState]);

  // Submit game choice (shared between input onKeyDown and document keydown)
  const submitGameChoice = useCallback((choice: string) => {
    const num = parseInt(choice, 10);
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
    setGameChoice("");
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
            resetToStart();
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
  }, [gameState, messageChars, messageText, countdown, exitAfterMessage, muteMessageSound, resetToStart]);

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

  // Keyboard input handler (desktop — input screens handled by real <input> elements)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if a real input element is focused — those screens handle their own input
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      if (gameState === "password" || gameState === "respond" || gameState === "gamelist") {
        // These screens use real <input> elements; focus them if not already
        if (gameState === "password") passwordInputRef.current?.focus();
        else if (gameState === "respond") respondInputRef.current?.focus();
        else if (gameState === "gamelist") gameChoiceInputRef.current?.focus();
        return;
      }

      if (gameState === "intro") return;

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
  }, [gameState, turn, aiThinking, resetGame]);

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

    let className = "cell";

    if (isCursor) {
      className += " is-cursor";
    }

    let content: React.ReactNode = null;
    if (cell === "X") {
      content = (
        <span className={isWinCell ? "win" : "x"}>
          <XIcon win={isWinCell} />
        </span>
      );
    } else if (cell === "O") {
      content = (
        <span className={isWinCell ? "win" : "o"}>
          <OIcon win={isWinCell} />
        </span>
      );
    } else if (isCursor) {
      content = <span className="dim">{"\u2588"}</span>;
    }

    return (
      <div
        key={index}
        className={className}
        onClick={() => handleCellClick(index)}
      >
        {content}
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
      <div className="terminal-inner">
        {gameState === "password" && (
          <div className="password-screen" onClick={() => passwordInputRef.current?.focus()}>
            <div className="password-label">Enter password</div>
            <div className="password-field">
              <span className="password-mask">{"*".repeat(passwordInput.length)}</span>
              <span className="cursor">{"\u2588"}</span>
              <input
                ref={passwordInputRef}
                className="sr-input"
                type="text"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (passwordInput.toLowerCase() === "joshua") {
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
                  }
                }}
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
              />
            </div>
            {passwordError && <div className="error" style={{ marginTop: 12 }}>Access denied.</div>}
          </div>
        )}

        {gameState === "intro" && (
          <div className="intro-screen">
            <div className="intro-text">
              {INTRO_TEXT.slice(0, introChars).split("\n").map((line, i) => (
                <div key={i}>{line || "\u00A0"}</div>
              ))}
            </div>
          </div>
        )}

        {gameState === "respond" && (
          <div className="respond-screen" onClick={() => respondInputRef.current?.focus()}>
            <div className="respond-text">
              {INTRO_TEXT.split("\n").map((line, i, arr) => (
                <div key={i}>
                  {line}
                  {i === arr.length - 1 && (
                    <span className="respond-input-wrap">
                      &nbsp;&nbsp;<span className="respond-input">{responseInput}</span><span className="cursor">{"\u2588"}</span>
                      <input
                        ref={respondInputRef}
                        className="sr-input"
                        type="text"
                        value={responseInput}
                        onChange={(e) => setResponseInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (/^y(es)?$/i.test(responseInput.trim())) {
                              setGameState("gamelist");
                            } else if (responseInput.length > 0) {
                              resetToStart();
                            }
                            setResponseInput("");
                          }
                        }}
                        autoFocus
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        enterKeyHint="go"
                      />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === "gamelist" && (
          <div className="gamelist-screen">
            <div className="gamelist-title">LIST OF GAMES</div>
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
            <div className="gamelist-input" onClick={() => gameChoiceInputRef.current?.focus()}>
              WHICH GAME?&nbsp;&nbsp;<span className="gamelist-input-value">{gameChoice}</span>
              <span className="cursor">{"\u2588"}</span>
              <input
                ref={gameChoiceInputRef}
                className="sr-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={gameChoice}
                onChange={(e) => setGameChoice(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submitGameChoice(gameChoice);
                  }
                }}
                autoFocus
                autoComplete="off"
                enterKeyHint="go"
              />
            </div>
          </div>
        )}

        {gameState === "message" && (
          <div className="message-screen">
            <div className="message-text">
              {messageText.slice(0, messageChars).split("\n").map((line, i) => (
                <div key={i}>{line || "\u00A0"}</div>
              ))}
            </div>
            {countdown !== null && !exitAfterMessage && (
              <div className="message-countdown">
                Returning to game menu in {countdown}s
              </div>
            )}
          </div>
        )}

        {(gameState === "playing" || gameState === "gameover" || gameState === "prompt") && (
          <div className="playing-screen">
            <div className="title">Tic Tac Toe</div>

            <div className="board">
              {Array.from({ length: 9 }, (_, i) => renderCell(i))}
            </div>

            <div className="status">{statusMessage()}</div>

            <div className="score">
              <span className="score-pill">W <span className="score-pill-value">{score.wins}</span></span>
              <span className="score-pill">L <span className="score-pill-value">{score.losses}</span></span>
              <span className="score-pill">D <span className="score-pill-value">{score.draws}</span></span>
            </div>

            {gameState === "prompt" && (
              <div className="prompt-line">
                <div>Play again?</div>
                <div className="prompt-buttons">
                  <button className="prompt-btn prompt-btn-yes" onClick={resetGame}>Yes</button>
                  <button className="prompt-btn prompt-btn-no" onClick={() => setGameState("gamelist")}>No</button>
                </div>
              </div>
            )}

            {gameState === "playing" && (
              <div className="touch-quit">
                <button className="quit-btn" onClick={() => { setGameState("gamelist"); setGameChoice(""); }}>Quit</button>
              </div>
            )}

            <div className="hint">
              Tap cells to play
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
