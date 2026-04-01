import { LEVELS } from './modules/levels.js';
import { SKINS } from './modules/skins.js';
import { GameState } from './modules/state.js';
import { createHand, setHandState, setHandTreat, setHandDisabled } from './modules/hands.js';
import { wait, lerp, clamp } from './modules/utils.js';
import { audioManager } from './modules/audio.js';

const state = new GameState({
  levelIndex: 0,
  coins: 0,
  selectedSkinId: 'cow',
});
state.load();

const screens = {
  home: document.getElementById('home-screen'),
  skins: document.getElementById('skin-screen'),
  game: document.getElementById('game-screen'),
};

const catAvatarImg = document.getElementById('cat-avatar-img');
const homeLevel = document.getElementById('home-level');
const homeCoins = document.getElementById('home-coins');
const homeSkinName = document.getElementById('home-skin-name');
const homeCat = document.getElementById('home-cat');

const skinPreviewCat = document.getElementById('skin-preview-cat');
const skinPreviewName = document.getElementById('skin-preview-name');
const skinList = document.getElementById('skin-list');

const levelLabel = document.getElementById('level-label');
const coinLabel = document.getElementById('coin-label');
const attemptLabel = document.getElementById('attempt-label');
const messageLabel = document.getElementById('message-label');
const countdownLabel = document.getElementById('countdown-label');
const handsContainer = document.getElementById('hands-container');

const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const resultDesc = document.getElementById('result-desc');
const nextLevelBtn = document.getElementById('next-level-btn');
const retryBtn = document.getElementById('retry-btn');
const modalHomeBtn = document.getElementById('modal-home-btn');

let runtime = null;
let currentSkin = null;

document.getElementById('start-btn').addEventListener('click', () => {
  audioManager.play('button');
  startCurrentLevel();
});

document.getElementById('skins-btn').addEventListener('click', () => {
  audioManager.play('button');
  switchScreen('skins');
});

document.getElementById('reset-btn').addEventListener('click', () => {
  audioManager.play('button');
  if (!confirm('确认重置关卡与金币？')) return;
  clearGuessCountdown();
  state.reset();
  renderHome();
  renderSkins();
});

document.getElementById('back-home-from-skins').addEventListener('click', () => {
  audioManager.play('button');
  switchScreen('home');
});

document.getElementById('back-home-from-game').addEventListener('click', () => {
  audioManager.play('button');
  clearGuessCountdown();
  switchScreen('home');
});

document.getElementById('restart-level').addEventListener('click', () => {
  audioManager.play('button');
  clearGuessCountdown();
  startCurrentLevel(true);
});

nextLevelBtn.addEventListener('click', () => {
  audioManager.play('button');
  hideResultModal();
  clearGuessCountdown();

  const lastIndex = LEVELS.length - 1;
  state.levelIndex = clamp(state.levelIndex + 1, 0, lastIndex);
  state.save();

  startCurrentLevel();
});

retryBtn.addEventListener('click', () => {
  audioManager.play('button');
  hideResultModal();
  clearGuessCountdown();
  startCurrentLevel(true);
});

modalHomeBtn.addEventListener('click', () => {
  audioManager.play('button');
  hideResultModal();
  clearGuessCountdown();
  switchScreen('home');
});

function switchScreen(name) {
  Object.values(screens).forEach(el => el.classList.remove('active'));
  screens[name].classList.add('active');

  if (name === 'home') renderHome();
  if (name === 'skins') renderSkins();
}

function renderHome() {
  const skin = SKINS.find(s => s.id === state.selectedSkinId) || SKINS[0];
  homeLevel.textContent = String(state.levelIndex + 1);
  homeCoins.textContent = String(state.coins);
  homeSkinName.textContent = skin.name;
  homeCat.innerHTML = `<img src="${skin.image}" alt="${skin.name}">`;
}

function renderSkins() {
  const skin = SKINS.find(s => s.id === state.selectedSkinId) || SKINS[0];
  const previewImage = skin.image || './assets/cat-normal.png';

  skinPreviewCat.innerHTML = `<img src="${previewImage}" alt="${skin.name}">`;
  skinPreviewName.textContent = skin.name;
  skinList.innerHTML = '';

  SKINS.forEach(item => {
    const image = item.image || './assets/cat-normal.png';
    const isUnlocked = state.unlockedSkinIds.includes(item.id);
    const isEquipped = item.id === state.selectedSkinId;

    let buttonText = '';
    let buttonClass = '';
    let buttonDisabled = false;

    if (isEquipped) {
      buttonText = '已装备';
      buttonClass = 'secondary-btn';
      buttonDisabled = true;
    } else if (isUnlocked) {
      buttonText = '装备';
      buttonClass = 'ghost-btn';
    } else {
      buttonText = `解锁（${item.unlockCost}金币）`;
      buttonClass = 'ghost-btn';
      if (state.coins < item.unlockCost) {
        buttonDisabled = true;
      }
    }

    const card = document.createElement('div');
    card.className = 'skin-card' + (isEquipped ? ' active' : '');
    card.innerHTML = `
      <div class="emoji"><img src="${image}" alt="${item.name}"></div>
      <div><strong>${item.name}</strong></div>
      <div style="margin-top:6px; color:#8b6d58; font-size:13px;">
        ${isUnlocked ? '已解锁' : '未解锁'}
      </div>
      <div style="margin-top:10px">
        <button class="${buttonClass}" ${buttonDisabled ? 'disabled' : ''}>
          ${buttonText}
        </button>
      </div>
    `;

    const btn = card.querySelector('button');
    btn.addEventListener('click', () => {
      audioManager.play('button');

      if (isEquipped) return;

      if (isUnlocked) {
        audioManager.play('meow');
        state.selectedSkinId = item.id;
        state.save();
        renderSkins();
        renderHome();
        return;
      }

      if (state.coins >= item.unlockCost) {
        state.coins -= item.unlockCost;
        state.unlockedSkinIds.push(item.id);
        state.selectedSkinId = item.id;
        state.save();

        audioManager.play('meow');

        renderSkins();
        renderHome();

        const coinLabel = document.getElementById('coin-label');
        if (coinLabel) {
          coinLabel.textContent = String(state.coins);
        }
      }
    });

    skinList.appendChild(card);
  });
}

async function startCurrentLevel(isRetry = false) {
  audioManager.resumeBgm();
  clearGuessCountdown();
  switchScreen('game');
  hideResultModal();

  const skin = SKINS.find(s => s.id === state.selectedSkinId) || SKINS[0];
  currentSkin = skin;
  catAvatarImg.src = skin.image;

  const baseLevel = LEVELS[state.levelIndex] || LEVELS[LEVELS.length - 1];
  const generatedRound = generateRoundConfig(baseLevel);

  levelLabel.textContent = String(baseLevel.id);
  coinLabel.textContent = String(state.coins);

  runtime = {
    level: generatedRound,
    attempt: 0,
    hands: [],
    guessing: false,
    finished: false,
    cameraOffset: 0,
    dragEnabled: true,
    dragging: false,
    dragStartX: 0,
    dragStartOffset: 0,
    guessTimeLeft: generatedRound.guessTimeLimit ?? 10,
    guessTimerId: null,
  };

  messageLabel.textContent = isRetry ? '再试一次，记住哪只手里有冻干' : '记住哪只手里有冻干';
  countdownLabel.textContent = '';
  attemptLabel.textContent = '3';

  buildHands(runtime.level);
  bindDragEvents();

  await revealPhase(runtime.level);
  if (!runtime || runtime.finished) return;

  await closeHandsPhase(runtime.level);
  if (!runtime || runtime.finished) return;

  await shufflePhase(runtime.level);
  if (!runtime || runtime.finished) return;

  beginGuessPhase();
}

function buildHands(level) {
  handsContainer.innerHTML = '';
  runtime.hands = [];

  for (let i = 0; i < level.handCount; i++) {
    const hand = createHand(i);

    hand.id = i;
    hand.slotIndex = i;
    hand.disabled = false;
    hand.hasTreat = i === level.correctIndex;

    if (level.showTutorialArrow && hand.hasTreat) {
      hand.el.classList.add('show-arrow');
    }

    hand.el.addEventListener('click', () => onGuess(hand));
    handsContainer.appendChild(hand.el);
    runtime.hands.push(hand);
  }

  layoutHandsInstant();
  refreshHandsVisual();
}

function refreshHandsVisual() {
  runtime.hands.forEach(hand => {
    setHandTreat(hand.el, hand.hasTreat);
    setHandDisabled(hand.el, hand.disabled);
  });
}

function getArcSlotPosition(slotIndex) {
  const level = runtime.level;
  const handCount = level.handCount;
  const arenaWidth = handsContainer.clientWidth || 1200;
  const arenaHeight = handsContainer.clientHeight || 700;

  const centerX = arenaWidth / 2;
  const centerY = arenaHeight / 2 - 40;

  const radiusX = Math.min(420, arenaWidth * 0.33);
  const radiusY = Math.min(270, arenaHeight * 0.28);

  const startAngle = -Math.PI / 2;
  const step = (Math.PI * 2) / handCount;
  const angle = startAngle + step * slotIndex + runtime.cameraOffset;

  const x = centerX + Math.cos(angle) * radiusX;
  const y = centerY + Math.sin(angle) * radiusY;

  const minY = centerY - radiusY;
  const maxY = centerY + radiusY;
  const depth = clamp((y - minY) / (maxY - minY), 0, 1);

  const scale = 0.78 + depth * 0.34;
  const z = Math.floor(scale * 1000);

  return { x, y, scale, z };
}

function applyHandTransform(hand, pos) {
  hand.x = pos.x;
  hand.y = pos.y;
  hand.scale = pos.scale;

  hand.el.style.left = `${pos.x}px`;
  hand.el.style.top = `${pos.y}px`;
  hand.el.style.transform = `translate(-50%, 0) scale(${pos.scale})`;
  hand.el.style.zIndex = String(pos.z);
}

function layoutHandsInstant() {
  runtime.hands.forEach(hand => {
    const pos = getArcSlotPosition(hand.slotIndex);
    applyHandTransform(hand, pos);
  });
}

async function animateHandsToSlots(duration = 500) {
  const snapshots = runtime.hands.map(hand => {
    const target = getArcSlotPosition(hand.slotIndex);
    return {
      hand,
      startX: hand.x ?? target.x,
      startY: hand.y ?? target.y,
      startScale: hand.scale ?? target.scale,
      targetX: target.x,
      targetY: target.y,
      targetScale: target.scale,
      targetZ: target.z,
    };
  });

  return new Promise(resolve => {
    const startTime = performance.now();

    function frame(now) {
      const t = clamp((now - startTime) / duration, 0, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      snapshots.forEach(item => {
        const x = lerp(item.startX, item.targetX, eased);
        const y = lerp(item.startY, item.targetY, eased);
        const scale = lerp(item.startScale, item.targetScale, eased);

        item.hand.x = x;
        item.hand.y = y;
        item.hand.scale = scale;

        item.hand.el.style.left = `${x}px`;
        item.hand.el.style.top = `${y}px`;
        item.hand.el.style.transform = `translate(-50%, 0) scale(${scale})`;
        item.hand.el.style.zIndex = String(item.targetZ);
      });

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

async function animateFinalRotateShift(shift, handCount, duration) {
  const stepAngle = (Math.PI * 2) / handCount;
  const rotateAngle = stepAngle * shift;

  const startOffset = runtime.cameraOffset;
  const targetOffset = startOffset + rotateAngle;
  const rotateDuration = Math.max(700, duration * 1.9);

  return new Promise(resolve => {
    const startTime = performance.now();

    function frame(now) {
      const t = clamp((now - startTime) / rotateDuration, 0, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      runtime.cameraOffset = lerp(startOffset, targetOffset, eased);
      layoutHandsInstant();

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        runtime.cameraOffset = targetOffset;
        applyFinalRotateShift(shift, handCount);
        runtime.cameraOffset = 0;
        layoutHandsInstant();
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

function bindDragEvents() {
  handsContainer.onpointerdown = e => {
    if (!runtime || !runtime.dragEnabled) return;
    runtime.dragging = true;
    runtime.dragStartX = e.clientX;
    runtime.dragStartOffset = runtime.cameraOffset;
  };

  window.onpointermove = e => {
    if (!runtime || !runtime.dragging || !runtime.dragEnabled) return;
    const deltaX = e.clientX - runtime.dragStartX;
    runtime.cameraOffset = runtime.dragStartOffset + deltaX * 0.0028;
    layoutHandsInstant();
  };

  window.onpointerup = () => {
    if (!runtime) return;
    runtime.dragging = false;
  };
}

async function revealPhase(level) {
  runtime.hands.forEach(h => setHandState(h.el, 'open'));
  refreshHandsVisual();

  for (let n = level.revealSeconds; n > 0; n--) {
    countdownLabel.textContent = String(n);
    await wait(1000);
    if (!runtime || runtime.finished) return;
  }

  countdownLabel.textContent = '';
}

async function closeHandsPhase(level) {
  messageLabel.textContent = '它们要开始换位置了';
  countdownLabel.textContent = '';
  runtime.dragEnabled = false;

  runtime.hands.forEach(h => {
    h.el.classList.remove('show-arrow');
    setHandState(h.el, 'closed');
  });

  await wait(level.preShuffleDelayMs);
}

async function shufflePhase(level) {
  messageLabel.textContent = '盯紧目标，别跟丢';
  countdownLabel.textContent = '';

  for (const [aSlot, bSlot] of level.shufflePairs) {
    const handA = runtime.hands.find(h => h.slotIndex === aSlot);
    const handB = runtime.hands.find(h => h.slotIndex === bSlot);
    if (!handA || !handB) continue;

    const temp = handA.slotIndex;
    handA.slotIndex = handB.slotIndex;
    handB.slotIndex = temp;

    audioManager.play('swap');
    await animateHandsToSlots(level.shuffleDurationMs);
    await wait(level.pauseBetweenRoundsMs);
  }

  if (level.finalRotateShift && level.finalRotateShift !== 0) {
    await wait(180);
    audioManager.play('swap');
    await animateFinalRotateShift(level.finalRotateShift, level.handCount, level.shuffleDurationMs);
    await wait(level.pauseBetweenRoundsMs);
  }
}

function beginGuessPhase() {
  runtime.guessing = true;
  runtime.dragEnabled = true;
  startGuessCountdown();

  runtime.hands.forEach(h => {
    if (!h.disabled) h.el.classList.add('clickable');
  });
}

async function onGuess(hand) {
  if (!runtime || runtime.finished || !runtime.guessing || hand.disabled) return;

  runtime.guessing = false;
  runtime.hands.forEach(h => h.el.classList.remove('clickable'));
  runtime.attempt += 1;
  attemptLabel.textContent = String(Math.max(0, 3 - runtime.attempt));

  const isCorrect = hand.hasTreat;

  if (isCorrect) {
    clearGuessCountdown();
    audioManager.play('correct');

    hand.el.classList.add('correct', 'selected');
    setHandState(hand.el, 'open');
    setHandTreat(hand.el, true);

    if (currentSkin?.happyImage) {
      catAvatarImg.src = currentSkin.happyImage;
    }

    const reward = getReward(runtime.attempt);
    state.coins += reward;
    coinLabel.textContent = String(state.coins);
    state.save();

    countdownLabel.textContent = '';
    messageLabel.textContent = '猜对啦';

    await wait(700);
    runtime.finished = true;

    showResultModal(
      '通关成功',
      `你第 ${runtime.attempt} 次猜中了，获得 ${reward} 金币。`
    );
    return;
  }

  hand.el.classList.add('wrong');
  setHandState(hand.el, 'open');
  setHandTreat(hand.el, false);
  setHandDisabled(hand.el, true);
  hand.disabled = true;

  audioManager.play('wrong');

  if (currentSkin?.sadImage) {
    catAvatarImg.src = currentSkin.sadImage;
  }

  if (runtime.attempt >= 3) {
    clearGuessCountdown();
    runtime.finished = true;
    countdownLabel.textContent = '';
    audioManager.play('fail');
    await wait(450);
    showResultModal('挑战失败', '第 3 次仍未猜中，本关需要重来。');
    return;
  }

  messageLabel.textContent = '再闻闻看';
  await wait(550);
  hand.el.classList.remove('wrong');

  runtime.guessing = true;
  runtime.hands.forEach(h => {
    if (!h.disabled) h.el.classList.add('clickable');
  });

  updateGuessCountdownText();
}

function getReward(attempt) {
  if (attempt === 1) return 100;
  if (attempt === 2) return 80;
  if (attempt === 3) return 50;
  return 0;
}

function showResultModal(title, desc) {
  resultTitle.textContent = title;
  resultDesc.textContent = desc;
  resultModal.classList.remove('hidden');
  nextLevelBtn.style.display = title === '通关成功' ? 'inline-block' : 'none';
  retryBtn.style.display = 'inline-block';
}

function hideResultModal() {
  resultModal.classList.add('hidden');
}

function startGuessCountdown() {
  clearGuessCountdown();
  updateGuessCountdownText();

  runtime.guessTimerId = setInterval(() => {
    if (!runtime || runtime.finished) {
      clearGuessCountdown();
      return;
    }

    runtime.guessTimeLeft -= 1;
    updateGuessCountdownText();

    if (runtime.guessTimeLeft <= 0) {
      clearGuessCountdown();
      handleTimeOutFail();
    }
  }, 1000);
}

function updateGuessCountdownText() {
  if (!runtime) return;
  messageLabel.textContent = '左右拖动观察，再点你觉得有冻干的手';
  countdownLabel.textContent = `${runtime.guessTimeLeft}`;
}

function clearGuessCountdown() {
  if (runtime?.guessTimerId) {
    clearInterval(runtime.guessTimerId);
    runtime.guessTimerId = null;
  }
}

async function handleTimeOutFail() {
  if (!runtime || runtime.finished) return;

  runtime.finished = true;
  runtime.guessing = false;
  runtime.dragEnabled = false;
  countdownLabel.textContent = '';

  if (currentSkin?.sadImage) {
    catAvatarImg.src = currentSkin.sadImage;
  }

  runtime.hands.forEach(h => h.el.classList.remove('clickable'));

  audioManager.play('fail');

  messageLabel.textContent = '时间到，挑战失败';
  await wait(400);
  showResultModal('挑战失败', '倒计时结束，你还没有猜中，本关需要重来。');
}

function applyFinalRotateShift(shift, handCount) {
  runtime.hands.forEach(hand => {
    let next = (hand.slotIndex + shift) % handCount;
    if (next < 0) next += handCount;
    hand.slotIndex = next;
  });
}

function generateRoundConfig(baseLevel) {
  const handCount = baseLevel.handCount;
  const correctIndex = randomInt(0, handCount - 1);

  const shufflePairs = generateShufflePairs({
    handCount,
    shuffleCount: baseLevel.shuffleCount,
    startTreatSlot: correctIndex,
    minTreatMoves: baseLevel.minTreatMoves ?? 2
  });

  const finalRotateShift =
    baseLevel.enableFinalRotate && baseLevel.finalRotateChoices?.length
      ? pickRandom(baseLevel.finalRotateChoices)
      : 0;

  return {
    ...baseLevel,
    correctIndex,
    shufflePairs,
    finalRotateShift
  };
}

function generateShufflePairs({ handCount, shuffleCount, startTreatSlot, minTreatMoves }) {
  const pairs = [];
  let currentTreatSlot = startTreatSlot;
  let treatMoveCount = 0;

  for (let i = 0; i < shuffleCount; i++) {
    let a, b;

    if (treatMoveCount < minTreatMoves) {
      a = currentTreatSlot;
      do {
        b = randomInt(0, handCount - 1);
      } while (b === a);

      currentTreatSlot = b;
      treatMoveCount += 1;
    } else {
      do {
        a = randomInt(0, handCount - 1);
        b = randomInt(0, handCount - 1);
      } while (a === b);

      if (a === currentTreatSlot) currentTreatSlot = b;
      else if (b === currentTreatSlot) currentTreatSlot = a;
    }

    pairs.push([a, b]);
  }

  return pairs;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

audioManager.preload();
audioManager.bindUnlock();

renderHome();
renderSkins();
switchScreen('home');