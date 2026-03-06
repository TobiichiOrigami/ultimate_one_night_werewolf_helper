let playerCount = 3; // 預設最小人數
let selectedRoles = {}; // 格式: { roleId: count }

const roleGrid = document.getElementById('role-grid');
const startBtn = document.getElementById('start-game');

/**
 * 角色特殊規則配置
 */
const ROLE_CONFIG = {
  'werewolf': { min: 1, max: 4, default: 2, scalable: true },
  'mason': { min: 2, max: 2, default: 2, scalable: false },
  'villager': { min: 1, max: 8, default: 1, scalable: true },
  // 其餘角色預設皆為 { min: 1, max: 1, default: 1, scalable: false }
};

function getRoleConfig(roleId) {
  return ROLE_CONFIG[roleId] || { min: 1, max: 1, default: 1, scalable: false };
}

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
    const config = getRoleConfig(role.id);
    const count = selectedRoles[role.id] || 0;
    const isActive = count > 0;
    const teamClass = role.team === 'wolf' ? 'bg-red-900/20' : 'bg-gray-800';

    const card = document.createElement('div');
    card.className = `role-card relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all border-2 cursor-pointer ${isActive ? 'border-yellow-500 bg-gray-700' : 'border-transparent ' + teamClass
      }`;

    // 建立控制區塊 HTML
    let controlsHTML = '';
    if (config.scalable) {
      // 可變動數量的角色：顯示加減號與數量
      controlsHTML = `
        <div class="flex items-center mt-2 space-x-2">
          <button onclick="event.stopPropagation(); changeRoleCount('${role.id}', -1)" 
            class="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 text-white">-</button>
          <span class="text-sm font-bold ${isActive ? 'text-yellow-500' : 'text-gray-400'}">${count}</span>
          <button onclick="event.stopPropagation(); changeRoleCount('${role.id}', 1)" 
            class="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 text-white">+</button>
        </div>
      `;
    } else {
      // 固定數量的角色：移除加減號，但選取後顯示數量 (例如 1 或 2)
      controlsHTML = `
        <div class="mt-2 h-6 flex items-center">
          <span class="text-sm font-bold ${isActive ? 'text-yellow-500' : 'text-transparent'}">
            ${isActive ? (config.default > 1 ? 'x' + count : '1') : ''}
          </span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="text-2xl mb-1">${role.hasAction ? '🌙' : '☀️'}</div>
      <div class="text-xs font-bold text-center">${role.name}</div>
      ${controlsHTML}
      
      <button onclick="event.stopPropagation(); showModalById('${role.id}')" 
        class="absolute top-1 right-1 text-gray-500 text-xs p-1">ⓘ</button>
      
      ${role.hasAction ? `<span class="absolute top-1 left-1 text-[8px] text-gray-500 font-mono">#${role.order}</span>` : ''}
    `;

    /**
     * 點擊卡片邏輯：選取或反選
     */
    card.onclick = () => {
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
 * 增減數量（僅限 scalable 角色）
 */
function changeRoleCount(roleId, delta) {
  const config = getRoleConfig(roleId);
  const currentCount = selectedRoles[roleId] || 0;

  let newCount = currentCount === 0 && delta > 0 ? config.default : currentCount + delta;
  newCount = Math.max(0, Math.min(config.max, newCount));

  if (newCount === 0) {
    delete selectedRoles[roleId];
  } else {
    selectedRoles[roleId] = newCount;
  }

  renderGrid();
  updateUI();
}

/**
 * 更新頂部狀態資訊
 */
function updateUI() {
  const totalSelected = Object.values(selectedRoles).reduce((a, b) => a + b, 0);
  const targetCount = playerCount + 3;

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
  const ruleContent = `【死亡判定】\n- 需 > 2 票且為最高票才死亡。\n- 若有多人最高票且 > 2 票，全部死亡。\n- 若全員皆為 1 票，無人死亡。\n\n【陣營勝負】\n- 死者含狼人：村民獲勝。\n- 死者不含狼人：狼人獲勝。`;
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
