let playerCount = 3;
let selectedRoles = {};
let isPlaying = false;
let currentAudio = null;
let timerInterval = null;

const roleGrid = document.getElementById('role-grid');
const startBtn = document.getElementById('start-game');

const ROLE_CONFIG = {
  'werewolf': { min: 1, max: 4, default: 2, scalable: true },
  'mason': { min: 2, max: 2, default: 2, scalable: false },
  'villager': { min: 1, max: 8, default: 1, scalable: true },
};

function getRoleConfig(roleId) {
  return ROLE_CONFIG[roleId] || { min: 1, max: 1, default: 1, scalable: false };
}

function init() {
  startBtn.onclick = handleStartGame;
  renderGrid();
  updateUI();
}

/**
 * 點擊「開始遊戲」
 */
function handleStartGame() {
  if (isPlaying) return;

  const queue = generateNightQueue(selectedRoles);
  if (queue.length === 0) return;

  isPlaying = true;

  // 1. 顯示遮罩，擋住設定界面
  const gameModal = document.getElementById('game-modal');
  const statusTitle = document.getElementById('game-status-title');
  const statusDesc = document.getElementById('game-status-desc');
  const timerDisplay = document.getElementById('timer-display');
  const stopBtn = document.getElementById('stop-timer-btn');

  gameModal.classList.remove('hidden');
  statusTitle.innerText = "🌙 夜晚進行中...";
  statusDesc.innerText = "請聽從語音導覽指示行動";
  timerDisplay.classList.add('hidden');
  stopBtn.classList.add('hidden');

  // 2. 開始播放語音
  playNightFlow(queue, () => {
    // 當夜晚所有流程（含 wake_up）播完後，進入討論階段
    statusTitle.innerText = "☀️ 白天討論階段";

    // 播放「討論導覽」語音
    const discussAudio = new Audio('assets/audio/discuss.mp3');
    discussAudio.onended = () => {
      // 導覽播完後，才顯示計時器並開始倒數
      timerDisplay.classList.remove('hidden');
      stopBtn.classList.remove('hidden');
      startDiscussionTimer(8 * 60);
    };
    discussAudio.play();
  });
}

/**
 * 啟動倒數計時器
 */
function startDiscussionTimer(duration) {
  const display = document.getElementById('timer-display');
  let timer = duration;

  updateTimerText(display, timer);

  timerInterval = setInterval(() => {
    timer--;
    updateTimerText(display, timer);

    if (timer <= 0) {
      clearInterval(timerInterval);
      onTimerEnd(); // 觸發結束語音
    }
  }, 1000);
}

/**
 * 更新計時器文字格式 (MM:SS)
 */
function updateTimerText(element, seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  element.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // 最後 30 秒變色提醒
  if (seconds <= 30) {
    element.classList.replace('text-white', 'text-red-500');
  } else {
    element.classList.remove('text-red-500');
    element.classList.add('text-white');
  }
}

/**
 * 討論結束後的邏輯
 */
function onTimerEnd() {
  // 播放「投票」語音
  const voteAudio = new Audio('assets/audio/vote.mp3');
  voteAudio.onended = () => {
    // 播放「結束」語音
    const overAudio = new Audio('assets/audio/over.mp3');
    overAudio.onended = () => {
      // 全部結束後，關閉遮罩回到設定頁
      closeGameModal();
    };
    overAudio.play();
  };
  voteAudio.play();
}

/**
 * 手動停止計時器 (提前結束按鈕)
 */
function stopTimerManually() {
  if (confirm("確定要結束討論並進入投票嗎？")) {
    clearInterval(timerInterval);
    onTimerEnd();
  }
}

/**
 * 關閉討論視窗
 */
function closeGameModal() {
  isPlaying = false;
  document.getElementById('game-modal').classList.add('hidden');
  updateUI();
}

/**
 * 生成夜間流程隊列 (包含新增語音)
 */
function generateNightQueue(selectedRoles) {
  let queue = [];

  // 1. 開場與確認身份
  queue.push({ id: 'start', fileName: 'start.mp3' });
  queue.push({ id: 'pause', duration: 3000 });
  queue.push({ id: 'sleep_all', fileName: 'sleep_all.mp3' });
  queue.push({ id: 'pause', duration: 1500 });

  // 2. 行動角色 (依照 ROLES 順序)
  const activeRoles = ROLES
    .filter(r => selectedRoles[r.id] > 0 && r.hasAction)
    .sort((a, b) => a.order - b.order);

  activeRoles.forEach(role => {
    queue.push({ id: role.id, fileName: `${role.id}.mp3` });
    const waitTime = 8000;
    queue.push({ id: 'pause', duration: waitTime });
    queue.push({ id: `${role.id}_sleep`, fileName: `${role.id}_sleep.mp3` });
    queue.push({ id: 'pause', duration: 1500 });
  });

  // 3. 特殊邏輯：化身失眠者
  if (selectedRoles['doppelganger'] && selectedRoles['insomniac']) {
    queue.push({ id: 'app_insomniac', fileName: 'app_insomniac.mp3' });
    queue.push({ id: 'pause', duration: 4000 });
    queue.push({ id: 'doppelganger_sleep_2', fileName: 'doppelganger_sleep.mp3' });
    queue.push({ id: 'pause', duration: 1500 });
  }

  // 4. 睜眼
  queue.push({ id: 'wake_up', fileName: 'wake_up.mp3' });

  return queue;
}

/**
 * 音檔播放器
 */
function playNightFlow(queue, onComplete) {
  let index = 0;

  function next() {
    if (index >= queue.length) {
      if (onComplete) {
        onComplete();
        onComplete = null;
      }
      return;
    }

    const item = queue[index];
    index++;

    if (item.id === 'pause') {
      setTimeout(next, item.duration);
    } else {
      currentAudio = new Audio(`assets/audio/${item.fileName}`);
      currentAudio.onended = next;
      currentAudio.onerror = () => {
        console.warn(`音檔遺失: assets/audio/${item.fileName}，將於 1 秒後跳過...`);
        setTimeout(next, 1000);
      };

      const playPromise = currentAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("播放被攔截:", error);
          setTimeout(next, 1000);
        });
      }
    }
  }

  next();
}

/**
 * 渲染角色選擇網格 (維持不變)
 */
function renderGrid() {
  roleGrid.innerHTML = '';
  const displayOrder = [...ROLES].sort((a, b) => a.order - b.order);

  displayOrder.forEach(role => {
    const config = getRoleConfig(role.id);
    const count = selectedRoles[role.id] || 0;
    const isActive = count > 0;
    const teamClass = role.team === 'wolf' ? 'bg-red-900/20' : 'bg-gray-800';

    const card = document.createElement('div');
    card.className = `role-card relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all border-2 cursor-pointer ${isActive ? 'border-yellow-500 bg-gray-700' : 'border-transparent ' + teamClass}`;

    let controlsHTML = config.scalable ? `
        <div class="flex items-center mt-2 space-x-2">
          <button onclick="event.stopPropagation(); changeRoleCount('${role.id}', -1)" class="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 text-white">-</button>
          <span class="text-sm font-bold ${isActive ? 'text-yellow-500' : 'text-gray-400'}">${count}</span>
          <button onclick="event.stopPropagation(); changeRoleCount('${role.id}', 1)" class="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 text-white">+</button>
        </div>`
      : `<div class="mt-2 h-6 flex items-center"><span class="text-sm font-bold ${isActive ? 'text-yellow-500' : 'text-transparent'}">${isActive ? (config.default > 1 ? 'x' + count : '1') : ''}</span></div>`;

    card.innerHTML = `
      <div class="text-2xl mb-1">${role.hasAction ? '🌙' : '☀️'}</div>
      <div class="text-xs font-bold text-center">${role.name}</div>
      ${controlsHTML}
      <button onclick="event.stopPropagation(); showModalById('${role.id}')" class="absolute top-1 right-1 text-gray-500 text-xs p-1">ⓘ</button>
    `;

    card.onclick = () => {
      if (isPlaying) return;
      if (count === 0) {
        selectedRoles[role.id] = config.default;
      } else {
        delete selectedRoles[role.id];
      }
      renderGrid();
      updateUI();
    };
    roleGrid.appendChild(card);
  });
}

/**
 * 更新 UI 狀態 (維持不變)
 */
function updateUI() {
  const totalSelected = Object.values(selectedRoles).reduce((a, b) => a + b, 0);
  const targetCount = playerCount + 3;

  const selectedCountEl = document.getElementById('selected-count');
  const manualPlayerCountEl = document.getElementById('manual-player-count');
  const targetCardCountEl = document.getElementById('target-card-count');

  if (selectedCountEl) selectedCountEl.innerText = totalSelected;
  if (manualPlayerCountEl) manualPlayerCountEl.innerText = playerCount;
  if (targetCardCountEl) targetCardCountEl.innerText = targetCount;

  if (totalSelected === targetCount) {
    startBtn.innerText = "開始遊戲";
    startBtn.disabled = false;
    startBtn.className = "w-full max-w-md mx-auto block bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-full transition shadow-lg";
  } else {
    const diff = targetCount - totalSelected;
    startBtn.innerText = diff > 0 ? `還需選擇 ${diff} 張牌` : `多選了 ${Math.abs(diff)} 張牌`;
    startBtn.disabled = true;
    startBtn.className = "w-full max-w-md mx-auto block bg-yellow-600 text-white font-bold py-3 rounded-full opacity-50 cursor-not-allowed";
  }
}

function changeRoleCount(roleId, delta) {
  if (isPlaying) return;
  const config = getRoleConfig(roleId);
  const currentCount = selectedRoles[roleId] || 0;
  let newCount = Math.max(0, Math.min(config.max, (currentCount === 0 && delta > 0 ? config.default : currentCount + delta)));
  if (newCount === 0) delete selectedRoles[roleId];
  else selectedRoles[roleId] = newCount;
  renderGrid();
  updateUI();
}

function adjustPlayerCount(delta) {
  if (isPlaying) return;
  const newCount = playerCount + delta;
  if (newCount >= 3 && newCount <= 10) {
    playerCount = newCount;
    updateUI();
  }
}

function showGeneralRules() {
  const ruleContent = `【死亡判定】\n- 需 > 2 票且為最高票才死亡。\n- 若有多人最高票且 > 2 票，全部死亡。\n- 若全員皆為 1 票，無人死亡。\n\n【陣營勝負】\n- 死者含狼人：村民獲勝。\n- 死者不含狼人：狼人獲勝。`;
  alert(ruleContent);
}

function showModalById(roleId) {
  const role = ROLES.find(r => r.id === roleId);
  if (role) {
    document.getElementById('modal-name').innerText = role.name;
    document.getElementById('modal-desc').innerText = role.description;
    document.getElementById('role-modal').classList.remove('hidden');
  }
}

function closeModal() {
  document.getElementById('role-modal').classList.add('hidden');
}

init();
