/**
 * スクリーン一覧
 */
export const SCREENS = {
    titleScreen: "title-screen",// タイトル
    characterCreationScreen: "character-creation-screen",// 主人公作成
    baseScreen: "base-screen",// 拠点
    tavernScreen: "tavern-screen",// 酒場
    mansionScreen: "mansion-screen",// 待機所
    storageScreen: "storage-screen",// 倉庫
    changeJobScreen: "change-job-screen",// 転職
    shopScreen: "shop-screen",// ショップ
    questBoardScreen: "quest-board-screen",// 依頼板
    mainGameScreen: "main-game-screen",// 探索
    battleScreen: "battle-screen",// 戦闘
    gameOverScreen: "game-over-screen",// 探索敗北 TODO: いずれ消す
    clearScreen: "clear-screen",// 探索クリア TODO: いずれ消す
};

/**
 * 状態異常の一覧
盲目	👁️‍🗨️❌ / 🙈	
捕縛	⛓️
封印	🚫 / 🔒
 */
export const BATTLE_STATUSES = [
    {
        id: "dead",
        icon: "✝️",
        sub_timing: "",
        sub_finish_text: "",
        exec_timing: "",
        addMessageGen: (name) => {return `${name} は倒れた。`},
        subMessageGen: (name) => {return `${name} は復活した。`},
    },
    {
        id: "guard",
        icon: "🛡️",
        sub_timing: "act_before",
        sub_finish_text: "",
        exec_timing: "",
        addMessageGen: (name) => {return `${name} は身を守っている。`},
        subMessageGen: (name) => {return null},
        applyEffect: (gameState, target) => {return null},
    },
    {
        id: "poizon",
        icon: "☠️",
        sub_timing: "act_after",
        sub_finish_text: "",
        exec_timing: "act_after",
        addMessageGen: (name) => {return `${name} の体に毒が回った。`},
        subMessageGen: (name) => {return `${name} の体から毒が消え去った。`},
        subMessageGen: (name) => {return `${name} の体から毒が消え去った。`},
        applyEffect: (gameState, target) => {
            // 最大HPの5%切り上げのダメージ
            const damage = Math.ceil(target.maxHp * 0.05);
            target.hp = Math.max(0, target.hp - damage);
            return `${target.name} は毒により ${damage} のダメージを受けた。`;
        },
    },
    {
        id: "paralyze",
        icon: "⚡",
        sub_timing: "act_after",
        sub_finish_text: "",
        exec_timing: "act_before",
        addMessageGen: (name) => {return `${name} の体は痺れた。`},
        subMessageGen: (name) => {return `${name} の麻痺は治った。`},
        applyEffect: (gameState, target) => {
            // 50%の確率でスタン
            if (Math.random() < 0.5) {
                gameState.battle.actor_stan = "paralyze"
            }
        },
        stanMessageGen: (name) => {return `${name} は痺れている。`},
    },
    {
        id: "sleep",
        icon: "💤",
        sub_timing: "act_after",
        sub_finish_text: "",
        exec_timing: "act_before",
        addMessageGen: (name) => {return `${name} は深い眠りに落ちた。`},
        subMessageGen: (name) => {return `${name} は目が覚めた。`},
        applyEffect: (gameState, target) => {
            gameState.battle.actor_stan = "sleep"
        },
        stanMessageGen: (name) => {return `${name} は眠っている。`},
    },
    {
        id: "stan",
        icon: "💫",
        sub_timing: "act_after",
        sub_finish_text: "",
        exec_timing: "act_before",
        addMessageGen: (name) => {return `${name} は大きく体勢を崩した。`},
        subMessageGen: (name) => {return `${name} は体勢を立て直した。`},
        applyEffect: (gameState, target) => {
            gameState.battle.actor_stan = "stan"
        },
        stanMessageGen: (name) => {return `${name} は体勢を立て直している。`},
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
    "damaged_enemy_one",
    "dead_enemy_one",
    "alive_ally_one",
    "damaged_ally_one",
    "dead_ally_one",
    "alive_one",
    "damaged_one",
    "dead_one",
];

/**
 * タイプごとの対象抽出メソッド
 * one系のみ選択候補、それ以外は対象
 */
export const TARGET_TYPE_EXTRACTOR = {
    // 相手
    alive_enemy_all: (allies = [], enemies, actor = null) => {
        return enemies.filter(unit => !isDead(unit));
    },
    alive_enemy_random: (allies = [], enemies, actor = null) => {
        const aliveUnits = enemies.filter(unit => !isDead(unit));
        return [aliveUnits[Math.floor(Math.random() * aliveUnits.length)]];
    },
    alive_enemy_one: (allies = [], enemies, actor = null) => {
        return enemies.filter(unit => !isDead(unit));
    },
    damaged_enemy_all: (allies = [], enemies, actor = null) => {
        return enemies.filter(unit => !isDead(unit) && unit.hp < unit.maxHp);
    },
    damaged_enemy_random: (allies = [], enemies, actor = null) => {
        const aliveUnits = enemies.filter(unit => !isDead(unit) && unit.hp < unit.maxHp);
        return [aliveUnits[Math.floor(Math.random() * aliveUnits.length)]];
    },
    damaged_enemy_one: (allies = [], enemies, actor = null) => {
        return enemies.filter(unit => !isDead(unit) && unit.hp < unit.maxHp);
    },
    dead_enemy_all: (allies = [], enemies, actor = null) => {
        return enemies.filter(unit => isDead(unit));
    },
    dead_enemy_random: (allies = [], enemies, actor = null) => {
        const aliveUnits = enemies.filter(unit => isDead(unit));
        return [aliveUnits[Math.floor(Math.random() * aliveUnits.length)]];
    },
    dead_enemy_one: (allies = [], enemies, actor = null) => {
        return enemies.filter(unit => isDead(unit));
    },

    // 味方
    alive_ally_all: (allies, enemies = [], actor = null) => {
        return allies.filter(unit => !isDead(unit));
    },
    alive_ally_random: (allies, enemies = [], actor = null) => {
        const aliveUnits = allies.filter(unit => !isDead(unit));
        return [aliveUnits[Math.floor(Math.random() * aliveUnits.length)]];
    },
    alive_ally_one: (allies, enemies = [], actor = null) => {
        return allies.filter(unit => !isDead(unit));
    },
    damaged_ally_all: (allies, enemies = [], actor = null) => {
        return allies.filter(unit => !isDead(unit) && unit.hp < unit.maxHp);
    },
    damaged_ally_random: (allies, enemies = [], actor = null) => {
        const aliveUnits = allies.filter(unit => !isDead(unit) && unit.hp < unit.maxHp);
        return [aliveUnits[Math.floor(Math.random() * aliveUnits.length)]];
    },
    damaged_ally_one: (allies, enemies = [], actor = null) => {
        return allies.filter(unit => !isDead(unit) && unit.hp < unit.maxHp);
    },
    dead_ally_all: (allies, enemies = [], actor = null) => {
        return allies.filter(unit => isDead(unit));
    },
    dead_ally_random: (allies, enemies = [], actor = null) => {
        const aliveUnits = allies.filter(unit => isDead(unit));
        return [aliveUnits[Math.floor(Math.random() * aliveUnits.length)]];
    },
    dead_ally_one: (allies, enemies = [], actor = null) => {
        return allies.filter(unit => isDead(unit));
    },

    // 無差別
    alive_all: (allies, enemies = [], actor = null) => {
        return [...allies, ...enemies].filter(unit => !isDead(unit));
    },
    alive_random: (allies, enemies = [], actor = null) => {
        const aliveUnits = [...allies, ...enemies].filter(unit => !isDead(unit));
        return [aliveUnits[Math.floor(Math.random() * aliveUnits.length)]];
    },
    alive_one: (allies, enemies = [], actor = null) => {
        return [...allies, ...enemies].filter(unit => !isDead(unit));
    },
    damaged_all: (allies, enemies = [], actor = null) => {
        return [...allies, ...enemies].filter(unit => !isDead(unit) && unit.hp < unit.maxHp);
    },
    damaged_random: (allies, enemies = [], actor = null) => {
        const aliveUnits = [...allies, ...enemies].filter(unit => !isDead(unit) && unit.hp < unit.maxHp);
        return [aliveUnits[Math.floor(Math.random() * aliveUnits.length)]];
    },
    damaged_one: (allies, enemies = [], actor = null) => {
        return [...allies, ...enemies].filter(unit => !isDead(unit) && unit.hp < unit.maxHp);
    },
    dead_all: (allies, enemies = [], actor = null) => {
        return [...allies, ...enemies].filter(unit => isDead(unit));
    },
    dead_random: (allies, enemies = [], actor = null) => {
        const aliveUnits = [...allies, ...enemies].filter(unit => isDead(unit));
        return [aliveUnits[Math.floor(Math.random() * aliveUnits.length)]];
    },
    dead_one: (allies, enemies = [], actor = null) => {
        return [...allies, ...enemies].filter(unit => isDead(unit));
    },

    // 特殊
    own: (allies, enemies = [], actor) => {
        return [actor];
    },
};

/**
 * 戦闘不能か判定する
 * @param {Object} target 
 */
export function isDead(unit) {
    return unit.battle_status.some(s => s.type === "dead");
}