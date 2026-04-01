const STORAGE_KEY = 'cat-treat-guess-save-v1';

export class GameState {
  constructor(defaults) {
    this.defaults = defaults;
    this.reset();
  }

  reset() {
    this.levelIndex = this.defaults.levelIndex ?? 0;
    this.coins = this.defaults.coins ?? 0;
    this.selectedSkinId = this.defaults.selectedSkinId ?? 'cow';
    this.unlockedSkinIds = ['cow'];
    this.save();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      this.levelIndex = data.levelIndex ?? this.defaults.levelIndex ?? 0;
      this.coins = data.coins ?? this.defaults.coins ?? 0;
      this.selectedSkinId = data.selectedSkinId ?? this.defaults.selectedSkinId ?? 'cow';
      this.unlockedSkinIds = Array.isArray(data.unlockedSkinIds) ? data.unlockedSkinIds : ['cow'];

      if (!this.unlockedSkinIds.includes('cow')) {
        this.unlockedSkinIds.push('cow');
      }
    } catch (err) {
      console.warn('读取存档失败，使用默认状态。', err);
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      levelIndex: this.levelIndex,
      coins: this.coins,
      selectedSkinId: this.selectedSkinId,
      unlockedSkinIds: this.unlockedSkinIds,
    }));
  }
}