
/**
 * 状態異常の一覧
 */
export const BATTLE_STATUSES = [
    {
        id: "guard",
        sub_timing: "act_before",
        sub_finish_text: "",
        exec_timing: "always",
        addMessageGen: (name) => {return `${name} は身を守っている。`},
        subMessageGen: (name) => {return null},
        applyEffect: (gameState, target) => {return null},
    },
    {
        id: "paralyze",
        sub_timing: "act_after",
        sub_finish_text: "",
        exec_timing: "act_before",
        addMessageGen: (name) => {return `${name} の体は痺れた。`},
        subMessageGen: (name) => {return `${name} の麻痺は治った。`},
        applyEffect: (gameState, target) => {
            // 50%の確率でスタン
            if (Math.random() < 0.5) {
                return gameState.battle.actor_stan = "paralyze"
            }
        },
        stanMessageGen: (name) => {return `${name} は痺れている。`},
    },
]

/**
 * ステータス変動デバフの効果
 */
export const DEBUFF_STATUS_MODIFIERS = {
    weakness: { attack: { rate: -0.2 } },
    haste:    { speed:  { rate:  0.5 } },
    // poison:   {}, // ダメージ系はターン処理で扱うのでここには書かない
};


// 選択が必要な対象種別
export const SELECT_TARGET_TYPE = [
    "alive_enemy_one",
    "dead_enemy_one",
    "alive_ally_one",
    "dead_ally_one",
    "alive_one",
    "dead_one",
];

/**
 * タイプごとの対象抽出メソッド
 * one系のみ選択候補、それ以外は対象
 */
export const TARGET_TYPE_EXTRACTOR = {
    alive_enemy_all: (allies = [], enemies) => {
        return enemies.filter(unit => unit.hp > 0);
    },
    alive_enemy_random: (allies = [], enemies) => {
        const aliveUnits = enemies.filter(unit => unit.hp > 0);
        return aliveUnits[Math.floor(Math.random() * aliveUnits.length)];
    },
    alive_enemy_one: (allies = [], enemies) => {
        return enemies.filter(unit => unit.hp > 0);
    },
    alive_ally_all: (allies, enemies = []) => {
        return allies.filter(unit => unit.hp > 0);
    },
    alive_ally_random: (allies, enemies = []) => {
        const aliveUnits = allies.filter(unit => unit.hp > 0);
        return aliveUnits[Math.floor(Math.random() * aliveUnits.length)];
    },
    alive_ally_one: (allies, enemies = []) => {
        return allies.filter(unit => unit.hp > 0);
    },
    alive_all: (allies, enemies = []) => {
        return [...allies, ...enemies].filter(unit => unit.hp > 0);
    },
};
