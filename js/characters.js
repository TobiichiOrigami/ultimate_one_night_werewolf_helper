const ROLES = [
  // --- 夜間行動角色 (依順序排列) ---
  { id: 'sentinel', name: '哨兵', image: 'assets/picture/sentinel.png', team: 'villager', order: 0, hasAction: true, description: '在一名玩家的牌上放置一個「盾牌」標記，該玩家的牌今晚不能被移動或查看。' },
  { id: 'doppelganger', name: '化身幽靈', image: 'assets/picture/doppelganger.png', team: 'other', order: 1, hasAction: true, description: '查看一名玩家的牌並變為該角色。若變為有行動的角色需立即執行。若變為狼人或守夜人，則加入該陣營且在後續對應順序睜眼與夥伴相認。若變為失眠者，則不可在失眠者睜眼時同時睜眼，應在化身失眠者階段才睜眼。' },
  { id: 'werewolf', name: '狼人', image: 'assets/picture/werewolf.png', team: 'wolf', order: 2, hasAction: true, description: '全體狼人（含狼王、神秘狼）睜眼相認。' },
  { id: 'alpha_wolf', name: '狼王', image: 'assets/picture/alpha_wolf.png', team: 'wolf', order: 3, hasAction: true, description: '將中央獨立設置 (垂直) 的一張狼人牌與另一名玩家交換（不能看牌）。' },
  { id: 'mystic_wolf', name: '神秘狼', image: 'assets/picture/mystic_wolf.png', team: 'wolf', order: 4, hasAction: true, description: '查看一名其他玩家的牌。' },
  { id: 'minion', name: '爪牙', image: 'assets/picture/minion.png', team: 'wolf', order: 5, hasAction: true, description: '睜眼確認狼人（狼人舉手不睜眼）。若無狼人則狼人在中央。' },
  { id: 'mason', name: '守夜人', image: 'assets/picture/mason.png', team: 'villager', order: 6, hasAction: true, description: '守夜人們睜開眼，確認彼此身份。' },
  { id: 'seer', name: '預言家', image: 'assets/picture/seer.png', team: 'villager', order: 7, hasAction: true, description: '查看一名玩家的牌，或查看中央兩張牌。' },
  { id: 'apprentice_seer', name: '學徒預言家', image: 'assets/picture/apprentice_seer.png', team: 'villager', order: 8, hasAction: true, description: '查看中央的一張牌。' },
  { id: 'paranormal_investigator', name: '靈異調查員', image: 'assets/picture/paranormal_investigator.png', team: 'villager', order: 9, hasAction: true, description: '一張一張查看最多兩名玩家的牌。若看到狼人或皮匠則變為該陣營，且不能再繼續看牌。' },
  { id: 'robber', name: '強盜', image: 'assets/picture/robber.png', team: 'villager', order: 10, hasAction: true, description: '可以交換自己與另一名玩家的牌，並查看新牌。' },
  { id: 'witch', name: '女巫', image: 'assets/picture/witch.png', team: 'villager', order: 11, hasAction: true, description: '可以查看中央的一張牌並將其與一名玩家的牌交換，可以與自己交換，但不能查看其他玩家的牌。' },
  { id: 'troublemaker', name: '搗蛋鬼', image: 'assets/picture/troublemaker.png', team: 'villager', order: 12, hasAction: true, description: '交換另外兩名玩家的牌（不能看牌）。' },
  { id: 'village_idiot', name: '村中白痴', image: 'assets/picture/village_idiot.png', team: 'villager', order: 13, hasAction: true, description: '將除自己以外的所有玩家卡牌，向左或向右移動一格。' },
  { id: 'drunk', name: '酒鬼', image: 'assets/picture/drunk.png', team: 'villager', order: 14, hasAction: true, description: '將自己的牌與中央的一張牌交換（不准看牌）。' },
  { id: 'insomniac', name: '失眠者', image: 'assets/picture/insomniac.png', team: 'villager', order: 15, hasAction: true, description: '夜晚結束前，查看自己目前的牌。' },
  { id: 'revealer', name: '揭露者', image: 'assets/picture/revealer.png', team: 'villager', order: 16, hasAction: true, description: '翻開一名玩家的牌，若是狼人或皮匠則翻回。' },
  { id: 'curator', name: '博物館長', image: 'assets/picture/curator.png', team: 'villager', order: 17, hasAction: true, description: '將一枚館藏標記物面朝下放在一名玩家之前，該名玩家須依照該指示物行動或轉變陣營，可以選擇自己。不可查看該館藏標記指示物。' },

  // --- 夜間不行動角色 ---
  { id: 'villager', name: '村民', image: 'assets/picture/villager.png', team: 'villager', order: 99, hasAction: false, description: '無特殊能力，屬於正義陣營。' },
  { id: 'hunter', name: '獵人', image: 'assets/picture/hunter.png', team: 'villager', order: 99, hasAction: false, description: '若被投票處死，他指向的一名玩家也同時死亡。' },
  { id: 'tanner', name: '皮匠', image: 'assets/picture/tanner.png', team: 'other', order: 99, hasAction: false, description: '厭世者，只有自己被投票處死時才獨自獲勝。' },
  { id: 'bodyguard', name: '保鏢', image: 'assets/picture/bodyguard.png', team: 'villager', order: 99, hasAction: false, description: '投票時指向的玩家獲得保護，免於死亡。' },
  { id: 'prince', name: '王子', image: 'assets/picture/prince.png', team: 'villager', order: 99, hasAction: false, description: '無論票數多高都不會被處死。' },
  { id: 'dream_wolf', name: '夢狼', image: 'assets/picture/dream_wolf.png', team: 'wolf', order: 99, hasAction: false, description: '狼人睜眼時不睜眼，但需舉手供爪牙確認。' }
];

const SPEECH_SCRIPTS = {
  'start': "遊戲開始，所有人，請跟隨語音導覽，進行遊戲，請所有人查看身前的卡牌，確認身份。",
  'sleep_all': "所有人閉上眼睛，進入夜晚。", //
  'sentinel': "哨兵，請睜開眼睛。請在一名玩家的牌上，放置盾牌標記，該牌今晚將無法被查看或移動。",
  'sentinel_sleep': "哨兵請閉眼。",
  'doppelganger': "化身幽靈，請睜開眼睛，查看一名玩家的牌，並變圍該角色。如果你變圍在夜間可以換牌、或看牌的角色，請立即執行該行動。如果你變圍夜間需要特殊階段，才能行動的角色，請等待後續，對應階段再行動。", // 錯字是故意的，為了讓語音軟體的讀音正確
  'doppelganger_sleep': "化身幽靈請閉眼",
  'app_minion': "化身幽靈，如果你剛剛變成了爪牙，請繼續睜眼，否則請閉眼。", //
  'werewolf_thumb': "狼人們，請舉起大拇指，讓化身爪牙確認身份。",
  'werewolf_thumb_over': "狼人們，請收起大拇指。",
  'werewolf': "狼人們，請睜開眼睛，確認彼此身份。如果你是唯一的狼人，可以查看中央的一張牌。", //
  'werewolf_sleep': "狼人們請閉眼。",
  'alpha_wolf': "狼王請睜開眼睛，將中央事先準備的狼人牌與另一名玩家交換。", //
  'alpha_wolf_sleep': "狼王請閉眼",
  'mystic_wolf': "神秘狼請睜開眼睛，查看一名其他玩家的牌。", //
  'mystic_wolf_sleep': "神秘狼請閉眼",
  'minion': "爪牙請睜開眼睛，狼人們，請舉起大拇指，讓爪牙確認身份。", //
  'minion_sleep': "狼人們，請收起大拇指。爪牙請閉眼。",
  'mason': "守夜人們，請睜開眼睛，確認彼此身份。", //
  'mason_sleep': "守夜人們請閉眼",
  'seer': "預言家，請睜開眼睛，你可以查看一名玩家的牌，或查看中央兩張牌。", //
  'seer_sleep': "預言家請閉眼",
  'apprentice_seer': "學徒預言家請睜開眼睛，查看中央的一張牌。", //
  'apprentice_seer_sleep': "學徒預言家請閉眼",
  'paranormal_investigator': "靈異調查員，請睜開眼睛。你可以查看最多兩名玩家的牌。如果你看到了狼人或是皮匠，請立即停止看牌，你現在變圍了該身份，且不再具備看牌能力。",
  'paranormal_investigator_sleep': "靈異調查員請閉眼。",
  'robber': "強盜請睜開眼睛，你可以交換自己與另一名玩家的牌，並查看新牌。", //
  'robber_sleep': "強盜請閉眼",
  'witch': "女巫，請睜開眼睛。你可以查看中央的一張牌，然後將這張牌，與任何一名玩家的牌交換。",
  'witch_sleep': "女巫請閉眼。",
  'troublemaker': "搗蛋鬼，請睜開眼睛，你可以交換另外兩名玩家的牌。", //
  'troublemaker_sleep': "搗蛋鬼請閉眼",
  'village_idiot': "村中白痴，請睜開眼睛。請將除了你之外，所有玩家身前的卡牌，向左或是向右移動一格。",
  'village_idiot_sleep': "村中白痴請閉眼。",
  'drunk': "酒鬼，請睜開眼睛，將自己的牌與中央的一張牌交換，你不能查看新牌。", //
  'drunk_sleep': "酒鬼請閉眼",
  'insomniac': "失眠者，請睜開眼睛，查看你目前的牌。", //
  'insomniac_sleep': "失眠者請閉眼",
  'app_insomniac': "化身幽靈，如果你剛剛變成了失眠者，請睜開眼睛，查看你目前的牌。", //
  'revealer': "揭露者，請睜開眼睛。請翻開一名玩家的牌，如果那是狼人或是皮匠，請將牌翻回，否則該牌將維持翻開狀態直到白天。",
  'revealer_sleep': "揭露者請閉眼。",
  'app_revealer': "化身幽靈，如果你剛剛變成了揭露者，請睜開眼睛，並翻開一名玩家的牌，如果那是狼人或是皮匠，請將牌翻回，否則該牌，將維持翻開狀態直到白天。",
  'curator': "博物館長，請睜開眼睛，請將一枚館藏指示物面朝下，放在任何一名玩家的卡牌上，你不可以查看該指示物內容，也不可以放置在已經有指示物的玩家牌上。",
  'curator_sleep': "博物館長請閉眼。",
  'app_curator': "化身幽靈，如果你剛剛變成了博物館長，請睜開眼睛，將一枚，館藏指示物，面朝下，放在任何一名玩家的卡牌上，你不可以查看該指示物內容，也不可以放置在已經有指示物的玩家牌上。",
  'wake_up': "所有人，請睜開眼睛。", //
  'discuss': "現在，進入討論階段。討論倒數計時結束後，將進行投票處決。討論計時開始。",
  'vote': "討論時間結束，請開始進行投票。",
  'over': "本次語音導覽結束。",
};
