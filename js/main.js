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
let bgmAudio = new Audio('assets/audio/bgm.mp3');
bgmAudio.loop = true; // 設定循環播放
bgmAudio.volume = 0.4;
let discussionCarouselInterval = null; // 儲存幻燈片計時器
let previewAudio = null; // 用於管理試聽音訊

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

  // --- 新增：確保上一局的殘留內容被清空 ---
  stopRoleCarousel();
  if (window.currentShortInterval) clearInterval(window.currentShortInterval);
  if (timerInterval) clearInterval(timerInterval);
  if (currentAudio) { currentAudio.pause(); currentAudio = null; } // 確保語音停止

  const queue = generateNightQueue(selectedRoles);
  if (queue.length === 0) return;

  isPlaying = true;

  // --- 新增：開始播放背景音樂 ---
  bgmAudio.currentTime = 0; // 從頭開始
  bgmAudio.play().catch(e => console.log("BGM 播放失敗 (需使用者交互):", e));

  // 1. 顯示遮罩
  const gameModal = document.getElementById('game-modal');
  const statusTitle = document.getElementById('game-status-title');
  const statusDesc = document.getElementById('game-status-desc');
  const timerDisplay = document.getElementById('timer-display');
  const labelEl = document.getElementById('timer-label'); // 新增取得標籤元素
  const stopBtn = document.getElementById('stop-timer-btn');
  const roleListContainer = document.getElementById('game-role-list');

  // --- 重置 UI 顯示文字 ---
  gameModal.classList.remove('hidden');
  statusTitle.innerText = "🌙 夜晚進行中..."; 
  statusDesc.innerText = "請聽從語音導覽指示行動";
  if (labelEl) labelEl.innerText = ""; // 👈 徹底清除上一局殘留的「自由討論中」
  
  timerDisplay.classList.remove('hidden');
  timerDisplay.innerText = ""; 
  timerDisplay.classList.remove('text-red-500'); // 移除討論結束前的紅色警告色
  timerDisplay.classList.add('text-white');
  
  stopBtn.classList.add('hidden');

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

  // 2. 開始播放語音
  playNightFlow(queue, () => {
    statusTitle.innerText = "☀️ 白天討論階段";
    // 立即顯示計時器容器，避免語音播放失敗時畫面卡死
    timerDisplay.classList.remove('hidden');

    const discussAudio = new Audio('assets/audio/discuss.mp3');
    discussAudio.onended = () => {
      timerDisplay.classList.remove('hidden');
      stopBtn.classList.remove('hidden');
      // 改為讀取設定的分鐘數轉為秒數
      startDiscussionTimer(gameSettings.discussionMin * 60);
    };
    discussAudio.play().catch(() => {
      // 如果音檔播放失敗，直接開始計時
      startDiscussionTimer(gameSettings.discussionMin * 60);
    });
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

    // 使用統一的清理函式
    stopRoleCarousel();
    bgmAudio.pause();

    document.getElementById('timer-display').innerText = "";
    const labelEl = document.getElementById('timer-label');
    if (labelEl) labelEl.innerText = "";

    closeGameModal();
  }
}

/**
 * 啟動討論階段的角色大頭貼幻燈片
 */
function startRoleCarousel() {
  const statusDesc = document.getElementById('game-status-desc');

  // 取得本局有選中的角色清單 (排除數量為 0 的)
  const activeRoles = ROLES.filter(role => selectedRoles[role.id] > 0);

  if (activeRoles.length === 0) return;

  let currentIndex = 0;

  // 定義顯示函式
  const showNextRole = () => {
    const role = activeRoles[currentIndex];
    if (role && role.image) {
      statusDesc.innerHTML = `
        <div class="flex flex-col items-center animate-fade-in">
          <img src="${role.image}" class="w-32 h-32 object-cover rounded-full border-4 border-green-500 shadow-lg mb-2 animate-pulse">
          <p class="text-green-400 font-bold text-lg">${role.name}</p>
        </div>
      `;
    }
    currentIndex = (currentIndex + 1) % activeRoles.length;
  };

  // 立即顯示第一個
  showNextRole();

  // 每 3 秒切換一次
  discussionCarouselInterval = setInterval(showNextRole, 3000);
}

/**
 * 停止並清理角色幻燈片
 */
function stopRoleCarousel() {
  if (discussionCarouselInterval) {
    clearInterval(discussionCarouselInterval);
    discussionCarouselInterval = null;
  }
  // 恢復預設文字，避免舊文字殘留
  const statusDesc = document.getElementById('game-status-desc');
  if (statusDesc) {
    statusDesc.innerText = "請聽從語音導覽指示行動";
  }
}

/**
 * 僅顯示角色圖片與標籤（不含倒數數字）
 */
function showActionUI(roleId, label) {
  const labelEl = document.getElementById('timer-label');
  const statusDesc = document.getElementById('game-status-desc');
  const display = document.getElementById('timer-display');
  const role = ROLES.find(r => r.id === roleId);

  if (labelEl) labelEl.innerText = label || "";
  display.innerText = ""; // 語音播放時不顯示數字

  if (role && role.image) {
    statusDesc.innerHTML = `<img src="${role.image}" class="w-32 h-32 object-cover rounded-full mx-auto mb-2 border-4 border-yellow-500 shadow-lg animate-pulse">`;
  }
}

/**
 * 修改後的倒數計時器（只負責跑數字）
 */
function startShortTimer(ms, roleId, label, callback) {
  const display = document.getElementById('timer-display');
  const labelEl = document.getElementById('timer-label');
  const statusDesc = document.getElementById('game-status-desc');
  let secondsLeft = Math.floor(ms / 1000);

  display.classList.remove('hidden');

  // 確保標籤顯示為「行動中」
  if (labelEl) labelEl.innerText = label || "";
  display.innerText = secondsLeft;

  const shortInterval = setInterval(() => {
    secondsLeft--;
    if (secondsLeft <= 0) {
      clearInterval(shortInterval);
      display.innerText = "";
      if (labelEl) labelEl.innerText = "";
      statusDesc.innerText = "請聽從語音導覽指示行動"; // 恢復預設文字
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
  let timer = duration;
  const display = document.getElementById('timer-display');
  const statusTitle = document.getElementById('game-status-title');
  const labelEl = document.getElementById('timer-label');

  labelEl.innerText = "🗣️ 自由討論中";
  statusTitle.innerText = "☀️ 白天討論階段";

  // --- 新增：啟動角色幻燈片 ---
  // 先停止可能存在的舊輪播，再啟動新的
  stopRoleCarousel();
  startRoleCarousel();

  timerInterval = setInterval(() => {
    let minutes = Math.floor(timer / 60);
    let seconds = timer % 60;

    display.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (--timer < 0) {
      clearInterval(timerInterval);
      stopRoleCarousel(); // 討論結束也要停止
      onTimerEnd();
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
      // --- 新增：語音導覽全部結束後，停止背景音樂 ---
      bgmAudio.pause();
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

    const observationOnlyRoles = ['mason', 'minion'];
    const isObservationOnly = observationOnlyRoles.includes(role.id);
    const waitTime = (isObservationOnly ? gameSettings.confirmSec : gameSettings.moveSec) * 1000;

    queue.push({
      id: 'pause',
      roleId: role.id, // 新增：傳遞角色 ID 用於顯示圖片
      duration: waitTime,
      label: `${role.name} 行動中`
    });

    queue.push({ id: `${role.id}_sleep`, fileName: `${role.id}_sleep.mp3` });
    queue.push({ id: 'pause', duration: 1500 });
  });

  // 化身失眠者部分也要記得加
  if (selectedRoles['doppelganger'] && selectedRoles['insomniac']) {
    queue.push({ id: 'app_insomniac', fileName: 'app_insomniac.mp3' });
    queue.push({
      id: 'pause',
      roleId: 'doppelganger', // 顯示化身幽靈的圖片
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
/**
 * 修改後的夜間流程播放器
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
      // 遇到等待階段（倒數計時）
      if (item.duration > 2000) {
        // 傳入 roleId 和 label，此時開始數字倒數
        startShortTimer(item.duration, item.roleId, item.label, next);
      } else {
        // 短暫 1.5 秒緩衝，不顯示任何東西
        setTimeout(next, item.duration);
      }
    } else {
      // --- 核心修改：語音播放階段 ---
      // 在播放語音的同時，就顯示角色頭像與名稱
      const role = ROLES.find(r => r.id === item.id);
      if (role) {
        showActionUI(role.id, `${role.name} 行動請準備...`);
      }

      currentAudio = new Audio(`assets/audio/${item.fileName}`);

      // 當語音結束時，才執行下一個步驟（即進入 queue 中的 pause 項目開始倒數）
      currentAudio.onended = () => {
        // 語音播完後，如果下一個是倒數，我們保持 UI 顯示，交給 startShortTimer 處理
        next();
      };

      currentAudio.play().catch(e => {
        console.error("播放失敗:", e);
        setTimeout(next, 1000);
      });
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

    const roleImage = role.image ?
      `<img src="${role.image}" class="w-16 h-16 object-cover rounded-full mb-1 border-2 border-gray-600">` :
      `<div class="text-2xl mb-1 w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">${role.hasAction ? '🌙' : '☀️'}</div>`;

    card.innerHTML = `
      ${roleImage}
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
 * 試聽角色語音
 * @param {string} roleId 角色 ID
 * @param {HTMLElement} btn 按鈕元素，用於切換文字狀態
 */
function togglePreview(roleId, btn) {
  // 1. 如果正在播放，則停止並清除
  if (previewAudio) {
    previewAudio.pause();
    previewAudio = null;
    btn.innerText = "🔊 試聽夜晚語音";
    btn.classList.replace('bg-red-600', 'bg-blue-600');
    return;
  }

  // 2. 停止主遊戲可能正在播放的音訊
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  // 3. 播放新音訊 (檔名規則同夜晚流程)
  previewAudio = new Audio(`assets/audio/${roleId}.mp3`);
  btn.innerText = "⏹️ 停止播放";
  btn.classList.replace('bg-blue-600', 'bg-red-600');

  previewAudio.onended = () => {
    previewAudio = null;
    btn.innerText = "🔊 試聽夜晚語音";
    btn.classList.replace('bg-red-600', 'bg-blue-600');
  };

  previewAudio.play().catch(e => {
    console.error("試聽播放失敗:", e);
    alert("找不到該角色的語音檔");
    previewAudio = null;
    btn.innerText = "🔊 試聽夜晚語音";
  });
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
  const role = ROLES.find(r => r.id === roleId); //
  if (role) {
    const modalIcon = document.getElementById('modal-icon');
    document.getElementById('modal-name').innerText = role.name; //
    document.getElementById('modal-desc').innerText = role.description; //

    // 處理圖片顯示
    if (role.image) {
      modalIcon.innerHTML = `<img src="${role.image}" class="w-full h-full object-cover rounded-full">`;
    } else {
      modalIcon.innerHTML = `👤`;
    }

    // --- 新增：處理試聽按鈕 ---
    let previewBtnContainer = document.getElementById('preview-btn-container');
    if (!previewBtnContainer) {
      // 如果 HTML 裡沒預留，就在描述後方動態加入
      previewBtnContainer = document.createElement('div');
      previewBtnContainer.id = 'preview-btn-container';
      document.getElementById('modal-desc').after(previewBtnContainer);
    }

    // 只有有夜晚行動的角色才顯示按鈕
    if (role.hasAction) {
      previewBtnContainer.innerHTML = `
        <button id="preview-btn" onclick="togglePreview('${role.id}', this)" 
          class="w-full mb-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition text-sm">
          🔊 試聽夜晚語音
        </button>
      `;
    } else {
      previewBtnContainer.innerHTML = ""; // 無行動角色不顯示
    }

    document.getElementById('role-modal').classList.remove('hidden'); //
  }
}

function closeModal() {
  // 關閉視窗時停止試聽
  if (previewAudio) {
    previewAudio.pause();
    previewAudio = null;
  }
  document.getElementById('role-modal').classList.add('hidden'); //
}

init();
