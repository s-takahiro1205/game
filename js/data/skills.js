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

// 味方にするときに引き継がないスキル
export const IGNORE_PARTY_SKILL = [
    "wait-and-see"
]

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
                power: 0.45,
                fix: 0,
                add: 10,
                armor_pierce: 0.00,
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
                power: 0.35,
                fix: 0,
                add: 18,
                armor_pierce: 0.00,
            },
            {
                type: "addState",
                stateId: "paralyze",
                min: 0,
                max: 0,
                fix: 30,
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
                power: 0.05,
                fix: 0,
                add: 15,
                armor_pierce: 0.00,
            },
            {
                type: "addState",
                stateId: "paralyze",
                min: 0,
                max: 0,
                fix: 25,
                turn: 4,
            }
        ]
    },

    // 治癒魔法
    {
        id: "heal",
        name: "ヒール",
        cost: {
            mp: 4
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
                power: 0.20,
                fix: 0,
                add: 20,
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
                type: "recoverState",
                stateId: "poison",
                min: 0,
                max: 0,
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
                power: 0.40,
                fix: 0,
                add: 0,
            }
        ]
    },

    // 戦技 戦技はHP消費
    {
        id: "domination",
        name: "支配の呪印",
        cost: {},
        target_type: "alive_enemy_one",
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        category: "special",
        type: "support",// ボタンの色分け専用
        effects: [
            {
                type: "addState",
                stateId: "domination",
                min: 0,
                max: 0,
                fix: 100,
                turn: 1,
            },
        ]
    },
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
                power: 1.25,
                fix: 0,
                add: 0,
                armor_pierce: 0.00,
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
                power: 1.50,
                fix: 0,
                add: 0,
                armor_pierce: 0.00,
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
                power: 0.30,
                fix: 0,
                add: 0,
                armor_pierce: 0.00,
            }
        ]
    },
    {
        id: "aim-shot",
        name: "狙撃",
        cost: {
            hp: 3
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
                power: 1.10,
                fix: 0,
                add: 0,
                armor_pierce: 0.33,
            },
        ]
    },
    {
        id: "leg-shot",
        name: "下肢撃ち",
        cost: {
            hp: 3
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
                power: 1.10,
                fix: 0,
                add: 0,
                armor_pierce: 0.00,
            },
            {
                type: "addState",
                stateId: "stan",
                min: 0,
                max: 0,
                fix: 25,
                turn: 1,
            }
        ]
    },
    {
        id: "poison-slash",
        name: "ポイズンスラッシュ",
        cost: {
            hp: 3
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
                power: 1.10,
                fix: 0,
                add: 0,
                armor_pierce: 0.00,
            },
            {
                type: "addState",
                stateId: "poison",
                min: 0,
                max: 0,
                fix: 50,
                turn: 5,
            }
        ]
    },
    {
        id: "double-shot",
        name: "ダブルショット",
        cost: {
            hp: 3
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
                power: 0.75,
                fix: 0,
                add: 0,
                armor_pierce: 0.00,
            },
            {
                type: "damage",
                element: "physical",
                power: 0.75,
                fix: 0,
                add: 0,
                armor_pierce: 0.00,
            },
        ]
    },
    // { 回避を作って->状態異常追加してから
    //     id: "with-draw",
    //     name: "回避体制",
    //     cost: {
    //         hp: 8
    //     },
    //     target_type: "own",
    //     usableIn: {
    //         home: false,
    //         explore: false,
    //         battle: true,
    //     },
    //     category: "special",
    //     type: "support",
    //     effects: [
    //         {
    //             type: "addState",
    //             stateId: "avoidStance",
    //             min: 0,
    //             max: 0,
    //             fix: 100,
    //             turn: 6,
    //         }
    //     ]
    // },

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
                power: 1.00,
                fix: 0,
                add: 2,
                armor_pierce: 0.00,
            },
        ]
    },
    {
        id: "double-bite",
        name: "二連かみつき",
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
                power: 0.75,
                fix: 0,
                add: 2,
                armor_pierce: 0.00,
            },
            {
                type: "damage",
                element: "physical",
                power: 0.75,
                fix: 0,
                add: 2,
                armor_pierce: 0.00,
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
                power: 1.00,
                fix: 0,
                add: 2,
                armor_pierce: 0.00,
            },
            {
                type: "addState",
                stateId: "poison",
                min: 0,
                max: 0,
                fix: 50,
                turn: 5,
            }
        ]
    },
    {
        id: "charge",
        name: "突進",
        cost: {
            hp: 8
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
                power: 1.50,
                fix: 0,
                add: 5,
                armor_pierce: 0.00,
            },
        ]
    },
    {
        id: "thrash",
        name: "あばれる",
        cost: {
            hp: 20
        },
        target_type: "alive_enemy_all",
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
                power: 0.50,
                fix: 0,
                add: 5,
                armor_pierce: 0.00,
            },
        ]
    },
];