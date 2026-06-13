
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
    "alive_ally_one",
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
};
