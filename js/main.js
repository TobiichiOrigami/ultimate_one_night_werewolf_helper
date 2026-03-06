let selectedRoles = [];

const roleGrid = document.getElementById('role-grid');
const selectedCountEl = document.getElementById('selected-count');
const playerCountEl = document.getElementById('player-count');
const startBtn = document.getElementById('start-game');

// 初始化渲染
function init() {
  // 依據角色類型或陣營排序顯示，方便找尋
    const displayOrder = ROLES.sort((a, b) => a.order - b.order);

    displayOrder.forEach(role => {
        const card = document.createElement('div');
        // 根據陣營給予不同的基礎色調預留 (Wolf: 紅色系, Villager: 藍色系)
        const teamClass = role.team === 'wolf' ? 'bg-red-900/20' : 'bg-gray-800';
        
        card.className = `role-card ${teamClass} aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer border-2 border-transparent transition-all relative`;
        
        card.innerHTML = `
            <div class="text-2xl mb-1">${role.hasAction ? '🌙' : '☀️'}</div>
            <div class="text-xs font-bold text-center">${role.name}</div>
            <button class="mt-2 text-[10px] bg-gray-700 px-2 py-0.5 rounded text-gray-300 info-btn">規則</button>
            ${role.hasAction ? '<span class="absolute top-1 right-1 text-[8px] text-yellow-500 font-mono">#'+role.order+'</span>' : ''}
        `;

        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('info-btn')) {
                showModal(role);
                return;
            }
            toggleRole(role, card);
        });

        roleGrid.appendChild(card);
    });
}

function toggleRole(role, element) {
  const index = selectedRoles.indexOf(role.id);
  if (index > -1) {
    selectedRoles.splice(index, 1);
    element.classList.remove('active', 'ring-2', 'ring-yellow-500');
  } else {
    selectedRoles.push(role.id);
    element.classList.add('active', 'ring-2', 'ring-yellow-500');
  }
  updateUI();
}

function updateUI() {
  const count = selectedRoles.length;
  selectedCountEl.innerText = count;
  // 遊戲人數 = 角色牌總數 - 3
  playerCountEl.innerText = count >= 3 ? count - 3 : 0;
  startBtn.disabled = count < 3;
}

function showGeneralRules() {
    const ruleContent = `
        【死亡判定】
        - 需 > 2 票且為最高票。
        - 平票則最高票者全死。
        - 全員 1 票則無人死亡（判定無狼）。

        【特殊角色】
        - 王子：免疫死亡。
        - 獵人：死時帶走一人，納入最終死者結算。
        - 皮匠：自己死則獲勝。
    `;
    alert(ruleContent); // 初期先用 alert，之後可優化為專門的 Modal
}

// Modal 邏輯
function showModal(role) {
  document.getElementById('modal-name').innerText = role.name;
  document.getElementById('modal-desc').innerText = role.description;
  document.getElementById('role-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('role-modal').classList.add('hidden');
}

init();
