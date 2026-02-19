export type SoundName = "greeting" | "game" | "strange";

export interface AudioEngine {
  init(): Promise<void>;
  play(name: SoundName): void;
  stop(name: SoundName): void;
  loop(name: SoundName): void;
  stopAll(): void;
  close(): void;
}

const SOUND_FILES: Record<SoundName, string> = {
  greeting: "./WargamesKeystrokeSoundEdited.mp3",
  game: "./ShallWePlayAGameEdited.mp3",
  strange: "./StrangeGameEdited.mp3",
};

export function createAudioEngine(): AudioEngine {
  const elements: Map<SoundName, HTMLAudioElement> = new Map();
  const looping: Set<SoundName> = new Set();

  function getOrCreate(name: SoundName): HTMLAudioElement {
    let el = elements.get(name);
    if (!el) {
      el = new Audio(SOUND_FILES[name]);
      el.preload = "auto";
      elements.set(name, el);
    }
    return el;
  }

  return {
    async init() {
      // Pre-create and load all audio elements
      for (const name of Object.keys(SOUND_FILES) as SoundName[]) {
        const el = getOrCreate(name);
        el.load();
      }
    },

    play(name) {
      const el = getOrCreate(name);
      looping.delete(name);
      el.loop = false;
      el.currentTime = 0;
      el.play().catch(() => {});
    },

    stop(name) {
      const el = elements.get(name);
      if (el) {
        looping.delete(name);
        el.loop = false;
        el.pause();
        el.currentTime = 0;
      }
    },

    loop(name) {
      const el = getOrCreate(name);
      looping.add(name);
      el.loop = true;
      el.currentTime = 0;
      el.play().catch(() => {});
    },

    stopAll() {
      for (const name of [...elements.keys()] as SoundName[]) {
        this.stop(name);
      }
    },

    close() {
      this.stopAll();
      elements.clear();
    },
  };
}
