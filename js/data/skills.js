// スキルデータ定義

/**
 * @typedef {object} Skill
 * @property {string} id - スキルID
 * @property {string} name - スキル名
 * @property {Array<Object} cost - スキルコスト {mp:5, hp:5}
 * @property {string} target_type - 対象 アイテムの指定と共通
 * @property {Object} usableIn - どの場面で使用可能か home|explore|battle
 * @property {string} category - 魔法か技か(未使用) maggic|skill
 * @property {string} type - 種別：ボタン色分けに利用 アイテムと共通
 * @property {Array<Object>} effects - 効果配列
 */

/**
 * スキルのソート順
 * TODO: 
const orderMap = Object.fromEntries(
  skillOrder.map((id, index) => [id, index])
);

skills.sort((a, b) =>
  (orderMap[a.id] ?? 99999) -
  (orderMap[b.id] ?? 99999)
);
 */
export const SKILL_ORDER = [
    "thunder", "full-thunder",
    "heal",
    "slash", "power-slash", "full-slash",
    "wait-and-see",
];

/**
 * @type {Skill[]}
 */
export const SKILLS = [
    // 魔法
    {
        id: "fire",
        name: "ファイア",
        cost: {
            mp: 3
        },
        target_type: "alive_enemy_one",
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        category: "magic",
        type: "attack",// ボタンの色分け専用
        effects: [
            {
                type: "damage",
                element: "flame",
                dice: 3,
                sides: 7,
                flat: 10,
                fix: 0,
                // armor_pierce: 0,// 装甲貫通率 魔法はなし
            },
        ]
    },
    {
        id: "thunder",
        name: "サンダー",
        cost: {
            mp: 7
        },
        target_type: "alive_enemy_one",
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        category: "magic",
        type: "attack",// ボタンの色分け専用
        effects: [
            {
                type: "damage",
                element: "lightning",
                dice: 2,
                sides: 10,
                flat: 8,
                fix: 0,
                // armor_pierce: 0,// 装甲貫通率
            },
            {
                type: "add_state",
                stateId: "paralyze",
                dice: 0,
                sides: 0,
                flat: 0,
                fix: 40,
                turn: 5,
            }
        ]
    },
    {
        id: "full-thunder",
        name: "フルサンダー",
        cost: {
            mp: 15
        },
        target_type: "alive_enemy_all",
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        category: "magic",
        type: "attack",
        effects: [
            {
                type: "damage",
                element: "lightning",
                dice: 2,
                sides: 9,
                flat: 6,
                fix: 0,
                // armor_pierce: 0,
            },
            {
                type: "add_state",
                stateId: "paralyze",
                dice: 0,
                sides: 0,
                flat: 0,
                fix: 25,
                turn: 5,
            }
        ]
    },

    // 治癒魔法
    {
        id: "heal",
        name: "ヒール",
        cost: {
            mp: 3
        },
        target_type: "damaged_ally_one",
        usableIn: {
            home: false,
            explore: true,
            battle: true,
        },
        category: "magic",
        type: "heal",
        effects: [
            {
                type: "heal",
                dice: 5,
                sides: 6,
                flat: 10,
                fix: 0,
            }
        ]
    },
    {
        id: "poi-cure",
        name: "ポイキュア",
        cost: {
            mp: 3
        },
        target_type: "poisoned_ally_one",
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        category: "magic",
        type: "heal",
        effects: [
            {
                type: "recover_state",
                stateId: "poison",
                dice: 0,
                sides: 0,
                flat: 0,
                fix: 100,
            },
        ]
    },
    {
        id: "ra-heal",
        name: "ラヒール",
        cost: {
            mp: 6
        },
        target_type: "damaged_ally_one",
        usableIn: {
            home: false,
            explore: true,
            battle: true,
        },
        category: "magic",
        type: "heal",
        effects: [
            {
                type: "heal",
                dice: 7,
                sides: 12,
                flat: 20,
                fix: 0,
            }
        ]
    },

    // 戦技 戦技は通常ダイスに加算する
    {
        id: "slash",
        name: "スラッシュ",
        cost: {
            hp: 2
        },
        target_type: "alive_enemy_one",
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        category: "combat",
        type: "attack",// ボタンの色分け専用
        effects: [
            {
                type: "damage",
                element: "physical",
                dice: 0,
                sides: 3,
                flat: 7,
                fix: 0,// 固定ダメージ
                armor_pierce: 0,// 装甲貫通率
            },
        ]
    },
    {
        id: "power-slash",
        name: "パワースラッシュ",
        cost: {
            hp: 5
        },
        target_type: "alive_enemy_one",
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        category: "combat",
        type: "attack",
        effects: [
            {
                type: "damage",
                element: "physical",
                dice: 0,
                sides: 5,
                flat: 15,
                fix: 0,
                armor_pierce: 0,
            },
        ]
    },
    {
        id: "full-slash",
        name: "フルスラッシュ",
        cost: {
            hp: 8
        },
        target_type: "alive_enemy_all",
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        category: "combat",
        type: "attack",
        effects: [
            {
                type: "damage",
                element: "physical",
                dice: 0,
                sides: 3,
                flat: 7,
                fix: 0,
                armor_pierce: 0,
            }
        ]
    },

    // 敵専用
    {
        id: "wait-and-see",
        name: "様子を見る",
        customMessage: "${actor-name} は様子を見ている",
        cost: {},
        target_type: "own",
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        category: "special",
        type: "support",
        effects: []
    },
    {
        id: "bite",
        name: "かみつき",
        cost: {},
        target_type: "alive_enemy_one",
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        category: "combat",
        type: "attack",// ボタンの色分け専用
        effects: [
            {
                type: "damage",
                element: "physical",
                dice: 0,
                sides: 2,
                flat: 2,
                fix: 0,// 固定ダメージ
                armor_pierce: 0,// 装甲貫通率
            },
        ]
    },
    {
        id: "poison-bite",
        name: "毒かみつき",
        cost: {},
        target_type: "alive_enemy_one",
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        category: "combat",
        type: "attack",// ボタンの色分け専用
        effects: [
            {
                type: "damage",
                element: "physical",
                dice: 0,
                sides: 2,
                flat: 2,
                fix: 0,// 固定ダメージ
                armor_pierce: 0,// 装甲貫通率
            },
            {
                type: "add_state",
                stateId: "poison",
                dice: 0,
                sides: 0,
                flat: 0,
                fix: 50,
                turn: 5,
            }
        ]
    },
    {
        id: "charge",
        name: "突進",
        cost: {},
        target_type: "alive_enemy_one",
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        category: "combat",
        type: "attack",// ボタンの色分け専用
        effects: [
            {
                type: "damage",
                element: "physical",
                dice: 0,
                sides: 5,
                flat: 3,
                fix: 0,// 固定ダメージ
                armor_pierce: 0,// 装甲貫通率
            },
        ]
    },
];