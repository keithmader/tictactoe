import { spawn, execSync, type ChildProcess } from "child_process";
import { existsSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

type SoundName = "greeting" | "game" | "strange";

interface AudioEngine {
  init(): Promise<void>;
  play(name: SoundName): void;
  stop(name: SoundName): void;
  loop(name: SoundName): void;
  stopAll(): void;
  close(): void;
}

const SOUND_FILES: Record<SoundName, string> = {
  greeting: "WargamesKeystrokeSoundEdited.mp3",
  game: "ShallWePlayAGameEdited.mp3",
  strange: "StrangeGameEdited.mp3",
};

function getAssetDir(): string {
  if ((process as any).pkg) {
    return resolve(dirname(process.argv[0]));
  }
  try {
    return resolve(dirname(fileURLToPath(import.meta.url)), "..");
  } catch {
    return resolve(__dirname, "..");
  }
}

function resolveSoundPaths(): Record<SoundName, string> {
  const paths: Record<SoundName, string> = {} as any;

  // When running inside pkg, the entry wrapper extracts MP3s to a temp dir
  // and sets TICTACTOE_ASSET_DIR to point there.
  const pkgAssetDir = process.env.TICTACTOE_ASSET_DIR;
  if (pkgAssetDir) {
    for (const [name, filename] of Object.entries(SOUND_FILES) as [SoundName, string][]) {
      paths[name] = join(pkgAssetDir, filename);
    }
  } else {
    const assetDir = getAssetDir();
    for (const [name, filename] of Object.entries(SOUND_FILES) as [SoundName, string][]) {
      paths[name] = join(assetDir, filename);
    }
  }

  return paths;
}

/** Convert a Linux/WSL path to a Windows path using wslpath */
function toWindowsPath(linuxPath: string): string {
  const isWSL = process.platform === "linux" && existsSync("/proc/version");
  if (!isWSL) {
    // Native Windows or bundle — paths are already Windows-style
    return linuxPath.replace(/\//g, "\\");
  }
  try {
    return execSync(`wslpath -w "${linuxPath}"`, { encoding: "utf-8" }).trim();
  } catch {
    // Fallback: manual UNC path construction
    return `\\\\wsl.localhost\\Ubuntu${linuxPath.replace(/\//g, "\\")}`;
  }
}

// Windows: PowerShell with WPF MediaPlayer (persistent process)
function createWindowsEngine(): AudioEngine {
  let ps: ChildProcess | null = null;
  let ready = false;
  let readyResolve: (() => void) | null = null;
  let loopTimers: Map<SoundName, ReturnType<typeof setInterval>> = new Map();
  const paths = resolveSoundPaths();

  // Approximate durations in ms (used for Node-side looping since
  // WPF MediaEnded events don't fire reliably in piped PowerShell)
  const LOOP_INTERVAL_MS: Record<SoundName, number> = {
    greeting: 1500,
    game: 2400,
    strange: 5700,
  };

  return {
    init() {
      return new Promise<void>((res) => {
        readyResolve = res;
        ps = spawn("powershell.exe", ["-NoExit", "-Command", "-"], {
          stdio: ["pipe", "pipe", "pipe"],
        });

        const greetingPath = toWindowsPath(paths.greeting);
        const gamePath = toWindowsPath(paths.game);
        const strangePath = toWindowsPath(paths.strange);

        ps.stdin?.write(
          `Add-Type -AssemblyName PresentationCore\n` +
          `$g = New-Object System.Windows.Media.MediaPlayer\n` +
          `$g.Volume = 1.0\n` +
          `$g.Open([Uri]'${greetingPath}')\n` +
          `$s = New-Object System.Windows.Media.MediaPlayer\n` +
          `$s.Volume = 1.0\n` +
          `$s.Open([Uri]'${gamePath}')\n` +
          `$w = New-Object System.Windows.Media.MediaPlayer\n` +
          `$w.Volume = 1.0\n` +
          `$w.Open([Uri]'${strangePath}')\n` +
          // Sleep to let the WPF dispatcher pump and files actually load.
          // Without this, Open is async and HasAudio stays False in piped mode.
          `Start-Sleep -Milliseconds 2000\n` +
          `Write-Host 'READY'\n`,
        );

        ps.stdout?.on("data", (data: Buffer) => {
          if (data.toString().includes("READY")) {
            ready = true;
            if (readyResolve) {
              readyResolve();
              readyResolve = null;
            }
          }
        });

        ps.on("error", () => {
          ready = true;
          ps = null;
          if (readyResolve) {
            readyResolve();
            readyResolve = null;
          }
        });
      });
    },

    play(name) {
      if (!ps || !ready) return;
      // Clear any existing loop timer for this sound
      const existing = loopTimers.get(name);
      if (existing) {
        clearInterval(existing);
        loopTimers.delete(name);
      }
      const varName = name === "greeting" ? "$g" : name === "game" ? "$s" : "$w";
      ps.stdin?.write(`${varName}.Position = [TimeSpan]::Zero; ${varName}.Play()\n`);
    },

    stop(name) {
      if (!ps || !ready) return;
      const existing = loopTimers.get(name);
      if (existing) {
        clearInterval(existing);
        loopTimers.delete(name);
      }
      const varName = name === "greeting" ? "$g" : name === "game" ? "$s" : "$w";
      ps.stdin?.write(`${varName}.Stop()\n`);
    },

    loop(name) {
      if (!ps || !ready) return;
      // Stop any existing loop
      const existing = loopTimers.get(name);
      if (existing) {
        clearInterval(existing);
      }
      const varName = name === "greeting" ? "$g" : name === "game" ? "$s" : "$w";
      // Start playing immediately
      ps.stdin?.write(`${varName}.Position = [TimeSpan]::Zero; ${varName}.Play()\n`);
      // Restart on a timer from Node.js side (MediaEnded events don't fire
      // in piped PowerShell mode since the WPF dispatcher isn't pumping)
      const timer = setInterval(() => {
        if (ps && ready) {
          ps.stdin?.write(`${varName}.Position = [TimeSpan]::Zero; ${varName}.Play()\n`);
        }
      }, LOOP_INTERVAL_MS[name]);
      loopTimers.set(name, timer);
    },

    stopAll() {
      if (!ps || !ready) return;
      for (const [, timer] of loopTimers) {
        clearInterval(timer);
      }
      loopTimers.clear();
      ps.stdin?.write("$g.Stop(); $s.Stop(); $w.Stop()\n");
    },

    close() {
      for (const [, timer] of loopTimers) {
        clearInterval(timer);
      }
      loopTimers.clear();
      if (!ps) return;
      ps.stdin?.write("$g.Close(); $s.Close(); $w.Close(); exit\n");
      ps.kill();
      ps = null;
    },
  };
}

// macOS: afplay command per sound
function createMacOSEngine(): AudioEngine {
  const processes: Map<SoundName, ChildProcess> = new Map();
  const looping: Set<SoundName> = new Set();
  const paths = resolveSoundPaths();

  function spawnPlay(name: SoundName): ChildProcess {
    const proc = spawn("afplay", [paths[name]]);
    proc.on("close", () => {
      if (processes.get(name) === proc) {
        processes.delete(name);
      }
      if (looping.has(name)) {
        const next = spawnPlay(name);
        processes.set(name, next);
      }
    });
    proc.on("error", () => {
      processes.delete(name);
      looping.delete(name);
    });
    return proc;
  }

  return {
    init() {
      return Promise.resolve();
    },

    play(name) {
      const existing = processes.get(name);
      if (existing) {
        looping.delete(name);
        existing.kill();
        processes.delete(name);
      }
      const proc = spawnPlay(name);
      processes.set(name, proc);
    },

    stop(name) {
      looping.delete(name);
      const proc = processes.get(name);
      if (proc) {
        proc.kill();
        processes.delete(name);
      }
    },

    loop(name) {
      this.stop(name);
      looping.add(name);
      const proc = spawnPlay(name);
      processes.set(name, proc);
    },

    stopAll() {
      for (const name of [...processes.keys()] as SoundName[]) {
        this.stop(name);
      }
    },

    close() {
      this.stopAll();
    },
  };
}

// No-op audio engine for unsupported platforms
function createNoopEngine(): AudioEngine {
  return {
    init: () => Promise.resolve(),
    play: () => {},
    stop: () => {},
    loop: () => {},
    stopAll: () => {},
    close: () => {},
  };
}

export type { SoundName, AudioEngine };

export function createAudioEngine(): AudioEngine {
  const platform = process.platform;

  if (platform === "win32") {
    return createWindowsEngine();
  }

  if (platform === "darwin") {
    return createMacOSEngine();
  }

  // Linux — check if PowerShell is available (WSL scenario)
  if (platform === "linux") {
    try {
      execSync("which powershell.exe", { stdio: "ignore" });
      return createWindowsEngine();
    } catch {
      return createNoopEngine();
    }
  }

  return createNoopEngine();
}
