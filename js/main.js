let playerCount = 3; // 預設最小人數
let selectedRoles = {}; // 格式: { roleId: count }

const roleGrid = document.getElementById('role-grid');
const startBtn = document.getElementById('start-game');

// 初始化渲染
function init() {
  renderGrid();
  updateUI();
}

/**
 * 渲染角色選擇網格
 */
function renderGrid() {
  roleGrid.innerHTML = '';

  // 依據角色定義的 order 排序顯示
  const displayOrder = [...ROLES].sort((a, b) => a.order - b.order);

  displayOrder.forEach(role => {
    const count = selectedRoles[role.id] || 0;
    const isActive = count > 0;
    const teamClass = role.team === 'wolf' ? 'bg-red-900/20' : 'bg-gray-800';

    const card = document.createElement('div');
    // 根據是否選取切換邊框與背景色
    card.className = `role-card relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all border-2 cursor-pointer ${isActive ? 'border-yellow-500 bg-gray-700' : 'border-transparent ' + teamClass
      }`;

    card.innerHTML = `
      <div class="text-2xl mb-1">${role.hasAction ? '🌙' : '☀️'}</div>
      <div class="text-xs font-bold text-center">${role.name}</div>
      
      <div class="flex items-center mt-2 space-x-2">
        <button onclick="event.stopPropagation(); changeRoleCount('${role.id}', -1)" 
          class="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 text-white">-</button>
        <span class="text-sm font-bold ${isActive ? 'text-yellow-500' : 'text-gray-400'}">${count}</span>
        <button onclick="event.stopPropagation(); changeRoleCount('${role.id}', 1)" 
          class="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 text-white">+</button>
      </div>

      <button onclick="event.stopPropagation(); showModalById('${role.id}')" 
        class="absolute top-1 right-1 text-gray-500 text-xs p-1">ⓘ</button>
      
      ${role.hasAction ? `<span class="absolute top-1 left-1 text-[8px] text-gray-500 font-mono">#${role.order}</span>` : ''}
    `;

    /**
     * 點擊卡片本體的特殊邏輯：
     * 1. 如果目前沒選 (0)，點擊後變為 1。
     * 2. 如果目前已選 (>0)，點擊後變為 0 (反選)。
     */
    card.onclick = () => {
      if (count === 0) {
        selectedRoles[role.id] = 1;
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
 * 調整玩家人數 (3-10人)
 */
function adjustPlayerCount(delta) {
  const newCount = playerCount + delta;
  if (newCount >= 3 && newCount <= 10) {
    playerCount = newCount;
    updateUI();
  }
}

/**
 * 透過加減按鈕增減數量
 */
function changeRoleCount(roleId, delta) {
  const currentCount = selectedRoles[roleId] || 0;
  const newCount = Math.max(0, currentCount + delta);

  if (newCount === 0) {
    delete selectedRoles[roleId];
  } else {
    selectedRoles[roleId] = newCount;
  }

  renderGrid();
  updateUI();
}

/**
 * 更新頂部狀態資訊與開始按鈕
 */
function updateUI() {
  const totalSelected = Object.values(selectedRoles).reduce((a, b) => a + b, 0);
  const targetCount = playerCount + 3; // 總牌數 = 人數 + 3

  document.getElementById('manual-player-count').innerText = playerCount;
  document.getElementById('selected-count').innerText = totalSelected;
  document.getElementById('target-card-count').innerText = targetCount;

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

/**
 * 顯示通用規則說明
 */
function showGeneralRules() {
  const ruleContent = `
【死亡判定】
- 需 > 2 票且為最高票才死亡。
- 若有多人同為最高票且 > 2 票，全部死亡。
- 若全員皆為 1 票，無人死亡。

【陣營勝負】
- 死者包含狼人：村民陣營獲勝。
- 死者不含狼人：狼人陣營獲勝。
- 無人死亡且場上無狼：村民獲勝。
- 無人死亡但場上有狼：狼人獲勝。
    `;
  alert(ruleContent);
}

/**
 * 顯示角色詳細規則
 */
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
