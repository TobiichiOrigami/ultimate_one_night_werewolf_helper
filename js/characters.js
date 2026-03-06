const ROLES = [
  // --- 夜間行動角色 ---
  { id: 'doppelganger', name: '化身幽靈', team: 'other', order: 1, hasAction: true, description: '查看一名玩家的牌並變為該角色。若變為有行動的角色需立即執行。' },
  { id: 'werewolf', name: '狼人', team: 'wolf', order: 2, hasAction: true, description: '全體狼人（含阿爾法、神秘狼）睜眼相認。' },
  { id: 'alpha_wolf', name: '阿爾法狼', team: 'wolf', order: 3, hasAction: true, description: '將中央的一張牌與另一名玩家交換（不能看牌）。' },
  { id: 'mystic_wolf', name: '神秘狼', team: 'wolf', order: 4, hasAction: true, description: '查看一名其他玩家的牌。' },
  { id: 'minion', name: '爪牙', team: 'wolf', order: 5, hasAction: true, description: '睜眼確認狼人（狼人舉手不睜眼）。若無狼人則狼人在中央。' },
  { id: 'mason', name: '守夜人', team: 'villager', order: 6, hasAction: true, description: '守夜人們睜開眼，確認彼此身份。' },
  { id: 'seer', name: '預言家', team: 'villager', order: 7, hasAction: true, description: '查看一名玩家的牌，或查看中央兩張牌。' },
  { id: 'apprentice_seer', name: '學徒預言家', team: 'villager', order: 8, hasAction: true, description: '查看中央的一張牌。' },
  { id: 'robber', name: '強盜', team: 'villager', order: 9, hasAction: true, description: '交換自己與另一名玩家的牌，並查看新牌。' },
  { id: 'troublemaker', name: '搗蛋鬼', team: 'villager', order: 10, hasAction: true, description: '交換另外兩名玩家的牌（不能看牌）。' },
  { id: 'drunk', name: '酒鬼', team: 'villager', order: 11, hasAction: true, description: '將自己的牌與中央的一張牌交換（不准看牌）。' },
  { id: 'insomniac', name: '失眠者', team: 'villager', order: 12, hasAction: true, description: '查看自己目前的牌。' },
  { id: 'app_insomniac', name: '化身失眠者', team: 'villager', order: 13, hasAction: true, description: '僅當化身幽靈變成失眠者時行動，查看自己目前的牌。' },

  // --- 夜間不行動角色 ---
  { id: 'villager', name: '村民', team: 'villager', order: 99, hasAction: false, description: '無特殊能力，屬於正義陣營。' },
  { id: 'hunter', name: '獵人', team: 'villager', order: 99, hasAction: false, description: '若被投票處死，他指向的一名玩家也同時死亡。' },
  { id: 'tanner', name: '皮匠', team: 'other', order: 99, hasAction: false, description: '厭世者，只有自己被投票處死時才獨自獲勝。' },
  { id: 'bodyguard', name: '守衛', team: 'villager', order: 99, hasAction: false, description: '投票時指向的玩家獲得保護，免於死亡。' },
  { id: 'prince', name: '王子', team: 'villager', order: 99, hasAction: false, description: '無論票數多高都不會被處死。' }
];
