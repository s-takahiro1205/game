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
    "thunder",
    "full-thunder",
    "heal",
];

/**
 * @type {Skill[]}
 */
export const SKILLS = [
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
                flat: 10,
                // fix: 0,// 固定ダメージ
                // armor_pierce: 0,// 装甲貫通率
            },
            {
                type: "add_state",
                stateId: "paralyze",
                dice: 2,
                sides: 20,
                flat: 5,
                fix: 0,
                turn: 5,
            }
        ]
    },
    {
        id: "full-thunder",
        name: "フルサンダー",
        cost: {
            mp: 105
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
                sides: 10,
                flat: 10,
                fix: 0,
                armor_pierce: 0,
            },
            {
                type: "add_state",
                stateId: "paralyze",
                dice: 2,
                sides: 20,
                flat: 5,
                fix: 0,
                turn: 5,
            }
        ]
    },
    {
        id: "heal",
        name: "ヒール",
        cost: {
            mp: 3
        },
        target_type: "alive_ally_one",
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
                dice: 3,
                sides: 5,
                flat: 5,
                fix: 0,
            }
        ]
    }
];