
export function createHand(index) {
  const el = document.createElement('div');
  el.className = 'hand open';
  el.dataset.index = String(index);
  el.innerHTML = `
    <div class="arrow">这里有冻干</div>
    <div class="palm-emoji">✋</div>
    <div class="fist-emoji">✊</div>
    <div class="treat">🧊</div>
  `;
  return {
    index,
    logicalIndex: index,
    x: 0,
    disabled: false,
    el,
  };
}

export function setHandState(el, state) {
  el.classList.remove('open', 'closed', 'selected', 'correct');
  el.classList.add(state);
}

export function setHandTreat(el, hasTreat) {
  if (hasTreat) el.classList.add('has-treat');
  else el.classList.remove('has-treat');
}

export function setHandDisabled(el, disabled) {
  if (disabled) el.classList.add('disabled');
  else el.classList.remove('disabled');
}

export function pulseHand(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}
