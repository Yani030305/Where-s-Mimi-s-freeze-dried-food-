const SOUND_FILES = {
  button: './assets/sounds/button-click.mp3',
  meow: './assets/sounds/cat-meow.mp3',
  swap: './assets/sounds/hand-swap.mp3',
  correct: './assets/sounds/correct.mp3',
  wrong: './assets/sounds/wrong.mp3',
  fail: './assets/sounds/fail.mp3',
  bgm: './assets/sounds/bgm.mp3',
};

class AudioManager {
  constructor() {
    this.enabled = true;

    this.volume = {
      button: 0.45,
      meow: 0.6,
      swap: 0.35,
      correct: 0.55,
      wrong: 0.5,
      fail: 0.55,
      bgm: 0.55,
    };

    this.cache = new Map();
    this.bgm = null;
    this.unlockBound = false;
  }

  preload() {
    Object.entries(SOUND_FILES).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = this.volume[key] ?? 0.5;

      if (key === 'bgm') {
        audio.loop = true;
        this.bgm = audio;
      }

      this.cache.set(key, audio);
    });
  }

  bindUnlock() {
    if (this.unlockBound) return;
    this.unlockBound = true;

    const unlock = () => {
      // 解锁普通音效
      this.cache.forEach((audio, key) => {
        try {
          if (key === 'bgm') return;
          audio.play().then(() => {
            audio.pause();
            audio.currentTime = 0;
          }).catch(() => {});
        } catch (_) {}
      });

      // 解锁并启动背景音乐
      this.playBgm();

      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  play(name) {
    if (!this.enabled) return;
    const src = SOUND_FILES[name];
    if (!src) return;

    const base = this.cache.get(name);
    if (!base) return;

    if (name === 'bgm') {
      this.playBgm();
      return;
    }

    const sound = base.cloneNode();
    sound.volume = this.volume[name] ?? 0.5;
    sound.play().catch(() => {});
  }

  playBgm() {
    if (!this.enabled || !this.bgm) return;

    this.bgm.volume = this.volume.bgm ?? 0.28;
    this.bgm.loop = true;

    this.bgm.play().catch(() => {});
  }

  pauseBgm() {
    if (!this.bgm) return;
    this.bgm.pause();
  }

  resumeBgm() {
    this.playBgm();
  }

  stopBgm() {
    if (!this.bgm) return;
    this.bgm.pause();
    this.bgm.currentTime = 0;
  }

  setBgmVolume(value) {
    if (!this.bgm) return;
    this.volume.bgm = value;
    this.bgm.volume = value;
  }

  setEnabled(enabled) {
    this.enabled = enabled;

    if (!enabled) {
      this.pauseBgm();
    } else {
      this.resumeBgm();
    }
  }
}

export const audioManager = new AudioManager();