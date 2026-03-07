let playerCount = 3;
let selectedRoles = {};
let isPlaying = false;
let currentAudio = null;
let timerInterval = null;
// 儲存時間設定
let gameSettings = {
  discussionMin: 8,  // 分鐘
  confirmSec: 5,     // 秒
  moveSec: 8         // 秒
};

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

  // 1. 顯示遮罩
  const gameModal = document.getElementById('game-modal');
  const statusTitle = document.getElementById('game-status-title');
  const statusDesc = document.getElementById('game-status-desc');
  const timerDisplay = document.getElementById('timer-display');
  const stopBtn = document.getElementById('stop-timer-btn');
  const roleListContainer = document.getElementById('game-role-list');

  // 動態生成目前選中的角色清單供玩家查看
  roleListContainer.innerHTML = '';
  Object.entries(selectedRoles).forEach(([roleId, count]) => {
    const role = ROLES.find(r => r.id === roleId);
    if (role && count > 0) {
      const item = document.createElement('div');
      item.className = "flex justify-between border-b border-gray-800 pb-1";
      item.innerHTML = `<span>${role.name}</span><span class="text-yellow-500 font-bold">x${count}</span>`;
      roleListContainer.appendChild(item);
    }
  });

  gameModal.classList.remove('hidden');
  statusTitle.innerText = "🌙 夜晚進行中...";
  statusDesc.innerText = "請聽從語音導覽指示行動";
  timerDisplay.classList.add('hidden');
  stopBtn.classList.add('hidden');

  // 2. 開始播放語音
  playNightFlow(queue, () => {
    statusTitle.innerText = "☀️ 白天討論階段";
    const discussAudio = new Audio('assets/audio/discuss.mp3');
    discussAudio.onended = () => {
      timerDisplay.classList.remove('hidden');
      stopBtn.classList.remove('hidden');
      // 改為讀取設定的分鐘數轉為秒數
      startDiscussionTimer(gameSettings.discussionMin * 60);
    };
    discussAudio.play();
  });
}

/**
 * 隨時中止並重置遊戲
 */
function abortGame() {
  if (confirm("確定要中止目前的遊戲流程嗎？")) {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    if (window.currentShortInterval) { clearInterval(window.currentShortInterval); }

    // 清空所有顯示
    document.getElementById('timer-display').innerText = "";
    const labelEl = document.getElementById('timer-label');
    if (labelEl) labelEl.innerText = "";

    closeGameModal();
  }
}

/**
 * 行動倒數計時器
 */
function startShortTimer(ms, label, callback) {
  const display = document.getElementById('timer-display');
  const labelEl = document.getElementById('timer-label');
  let secondsLeft = Math.floor(ms / 1000);

  // 確保顯示容器不是隱藏的
  display.classList.remove('hidden');

  // 顯示標籤與初始秒數
  if (labelEl) labelEl.innerText = label || "";
  display.innerText = secondsLeft;

  const shortInterval = setInterval(() => {
    secondsLeft--;
    if (secondsLeft <= 0) {
      clearInterval(shortInterval);
      display.innerText = "";
      if (labelEl) labelEl.innerText = "";
      callback();
    } else {
      display.innerText = secondsLeft;
    }
  }, 1000);

  window.currentShortInterval = shortInterval;
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
 * 生成夜間流程隊列
 * 邏輯調整：除了純觀察角色(守夜人、爪牙)外，其餘皆視為需要移動/觸碰卡牌者
 */
function generateNightQueue(selectedRoles) {
  let queue = [];

  // 1. 開場與確認身份
  queue.push({ id: 'start', fileName: 'start.mp3' });
  queue.push({ id: 'pause', duration: 3000 });
  queue.push({ id: 'sleep_all', fileName: 'sleep_all.mp3' });
  queue.push({ id: 'pause', duration: 1500 });

  // 2. 行動角色
  const activeRoles = ROLES
    .filter(r => selectedRoles[r.id] > 0 && r.hasAction)
    .sort((a, b) => a.order - b.order);

  activeRoles.forEach(role => {
    queue.push({ id: role.id, fileName: `${role.id}.mp3` });

    // 判斷邏輯：除了守夜人與爪牙，其餘皆視為移動/看牌者
    const observationOnlyRoles = ['mason', 'minion'];
    const isObservationOnly = observationOnlyRoles.includes(role.id);
    const waitTime = (isObservationOnly ? gameSettings.confirmSec : gameSettings.moveSec) * 1000;

    // 插入等待項目，並帶上標籤
    queue.push({
      id: 'pause',
      duration: waitTime,
      label: `${role.name} 行動中`
    });

    queue.push({ id: `${role.id}_sleep`, fileName: `${role.id}_sleep.mp3` });
    queue.push({ id: 'pause', duration: 1500 });
  });

  // 化身失眠者特殊邏輯
  if (selectedRoles['doppelganger'] && selectedRoles['insomniac']) {
    queue.push({ id: 'app_insomniac', fileName: 'app_insomniac.mp3' });
    queue.push({
      id: 'pause',
      duration: gameSettings.moveSec * 1000,
      label: "化身失眠者 行動中"
    });
    queue.push({ id: 'doppelganger_sleep_2', fileName: 'doppelganger_sleep.mp3' });
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
      // 判斷是否需要顯示倒數（通常大於 2 秒的 pause 才是行動等待時間）
      if (item.duration > 2000) {
        startShortTimer(item.duration, item.label, next);
      } else {
        // 短暫間隔（如 1.5秒）則維持不顯示計時
        setTimeout(next, item.duration);
      }
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
      currentAudio.play().catch(e => setTimeout(next, 1000));
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

/**
 * 調整時間設定的數值
 */
function adjustTimeSetting(type, delta) {
  if (isPlaying) return;

  if (type === 'discussion') {
    gameSettings.discussionMin = Math.max(1, Math.min(20, gameSettings.discussionMin + delta));
    document.getElementById('setting-discussion').innerText = gameSettings.discussionMin;
  } else if (type === 'confirm') {
    gameSettings.confirmSec = Math.max(3, Math.min(20, gameSettings.confirmSec + delta));
    document.getElementById('setting-confirm').innerText = gameSettings.confirmSec;
  } else if (type === 'move') {
    gameSettings.moveSec = Math.max(3, Math.min(20, gameSettings.moveSec + delta));
    document.getElementById('setting-move').innerText = gameSettings.moveSec;
  }
}

/**
 * 顯示通用規則說明 Modal
 */
function showGeneralRules() {
  const rulesModal = document.getElementById('rules-modal');
  rulesModal.classList.remove('hidden');
}

/**
 * 關閉規則說明 Modal
 */
function closeRulesModal() {
  const rulesModal = document.getElementById('rules-modal');
  rulesModal.classList.add('hidden');
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
