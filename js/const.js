
import { calcAllStatus } from './game.js';

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

    exploreScreen: "explore-screen",// 探索
    battleScreen: "battle-screen",// 戦闘
};

export const SUB_SCREENS = {
    changeJobScreen: "change-job-screen",// 転職
    baseSelectExploreMapScreen: "base-select-explore-map-screen",// 探索マップ選択
    exploreEventScreen: "explore-event-screen",// 探索マップ選択
    exploreClearScreen: "explore-clear-screen",// 探索クリア
    exploreGameOverScreen: "explore-game-over-screen",// 探索敗北
};

export const BOTTOM_SHEETS = {
    menuOverlay: "menu-overlay",// メニュー
};

export const BOTTOM_MENU_TABS = {
    menuTabHome: "menu-tab-home",// メイン
    menuTabParty: "menu-tab-party",// パーティー
    menuTabItems: "menu-tab-items",// アイテム
    menuTabSetting: "menu-tab-setting",// 設定
};

export const LABEL = {
    maxHp: "最大HP", maxMp: "最大MP", atk: "攻撃力", def: "防御力", spd: "速度", int: "知能", dex: "器用", size: "体格" , multiAction: "行動回数",
    hit: "命中値", dodge: "回避値", critical: "会心値",
    domination: "支配", poison: "毒", paralyze: "麻痺", sleep: "眠り", stan: "スタン", blind: "盲目", seal: "魔封じ", bind: "捕縛",
    alive_enemy_all: "敵全員", alive_enemy_random: "ランダムな敵1体", alive_enemy_one: "敵1体", damaged_enemy_all: "HPの減っている敵全員", damaged_enemy_random: "HPの減っているランダムな敵1体", damaged_enemy_one: "HPの減っている敵1体", dead_enemy_all: "戦闘不能中の敵全員", dead_enemy_random: "戦闘不能中のランダムな敵1体", dead_enemy_one: "戦闘不能中の敵1体",
    poisoned_enemy_all: "毒状態の敵全員", poisoned_enemy_random: "毒状態のランダムな敵1体", poisoned_enemy_one: "毒状態の敵1体", 
    alive_ally_all: "味方全員", alive_ally_random: "ランダムな味方1体", alive_ally_one: "味方1体", damaged_ally_all: "HPの減っている味方全員", damaged_ally_random: "HPの減っているランダムな味方1体", damaged_ally_one: "HPの減っている味方1体", dead_ally_all: "戦闘不能中の味方全員", dead_ally_random: "戦闘不能中のランダムな味方1体", dead_ally_one: "戦闘不能中の味方1体",
    poisoned_ally_all: "毒状態の味方全員", poisoned_ally_random: "毒状態のランダムな味方1体", poisoned_ally_one: "毒状態の味方1体", 
    alive_all: "全員", alive_random: "ランダムな1体", alive_one: "1体", damaged_all: "HPの減っている全員", damaged_random: "HPの減っているランダムな1体", damaged_one: "HPの減っている1体", dead_all: "戦闘不能中の全員", dead_random: "戦闘不能中のランダムな1体", dead_one: "戦闘不能中の1体",
    poisoned_all: "毒状態の全員", poisoned_random: "毒状態のランダムな1体", poisoned_one: "毒状態の1体", 
};

export const SEXES = {
    male: {id: "male", name: "男性"},
    female: {id: "female", name: "女性"},
    none: {id: "none", name: "無性"},
};

export const RACES = {
    human: {
        id: "human",
        name: "人間",
        // traits: ["human"],
    },
    vampire: {
        id: "vampire",
        name: "吸血鬼",
    },
    elf: {
        id: "elf",
        name: "エルフ",
    },
    darkElf: {
        id: "darkElf",
        name: "ダークエルフ",
    },
    dwarf: {
        id: "dwarf",
        name: "ドワーフ",
    },
    beastkin: {
        id: "beastkin",
        name: "獣人",
    },
    winged: {
        id: "winged",
        name: "翼人",
    },
    nephilim: {
        id: "nephilim",
        name: "巨人",
    },
    fallen: {
        id: "fallen",
        name: "魔人",
    },
    monster: {
        id: "monster",
        name: "魔物",
    },
};

export const EQUIP_CATEGORIES = {
    weapon: {id: "weapon", name: "武器"},
    mainArmor: {id: "mainArmor", name: "主防具"},
    subArmor: {id: "subArmor", name: "副防具"},
    accessory: {id: "accessory", name: "装飾品"},
};

export const EQUIP_TAGS = {
    sword: {id: "sword", name: "剣"},
    dagger: {id: "dagger", name: "短剣"},
    axe: {id: "axe", name: "斧"},
    spear: {id: "spear", name: "槍"},
    bow: {id: "bow", name: "弓"},
    staff: {id: "staff", name: "杖"},
    whip: {id: "whip", name: "鞭"},
    book: {id: "book", name: "本"},
    monsterStone: {id: "monsterStone", name: "魔石"},

    magicWeapon: {id: "magicWeapon", name: "魔法武器"},

    heavy: {id: "heavy", name: "重装備"},
    emblem: {id: "emblem", name: "紋章"},
};

export const TRAITS = {
    fairy: {id: "fairy", name: "妖精の身のこなし", statModifier: {dodge: 80}, growthRates: {maxHp: -50, maxMp: 50, atk: -50, def: -100, spd: 50, int: 50, dex: 50, size: -100}},
    mutant: {id: "mutant", name: "突然変異", statModifier: {maxHp: 15, maxMp: 10, atk: 5, def: 5, spd: 5, int: 5, dex: 5, size: 5}, growthRates: {maxHp: 25, maxMp: 25, atk: 10, def: 10, spd: 10, int: 10, dex: 10, size: 10}},

    regene5: {id: "regene", name: "HP自動回復", battle:{actAfter: [{type: "regene", target: "hp", calcMethod: "rate", base: "maxHp", rate: 5}]}},
    // human: {id: "human", name: "人間"},
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
        id: "domination",
        icon: "✡️",
        sub_timing: "",
        sub_finish_text: "",
        exec_timing: "",
        addMessageGen: (name) => {return `${name} の意識は揺れた。`},
        subMessageGen: (name) => {return `${name} は支配から逃れた。`},
    },
    {
        id: "guard",
        icon: "🛡️",
        sub_timing: "actBefore",
        sub_finish_text: "",
        exec_timing: "",
        addMessageGen: (name) => {return `${name} は身を守っている。`},
        subMessageGen: (name) => {return null},
        applyEffect: (gameState, target) => {return null},
    },
    {
        id: "poison",
        icon: "☠️",
        sub_timing: "actAfter",
        sub_finish_text: "",
        exec_timing: "actAfter",
        addMessageGen: (name) => {return `${name} の体に毒が回った。`},
        subMessageGen: (name) => {return `${name} の体から毒が消え去った。`},
        subMessageGen: (name) => {return `${name} の体から毒が消え去った。`},
        applyEffect: (gameState, target) => {
            const buffedStatus = calcAllStatus(target);
            // 最大HPの5%切り上げのダメージ
            const damage = Math.ceil(buffedStatus.maxHp * 0.05);
            target.hp = Math.max(0, target.hp - damage);
            return `${target.name} は毒により ${damage} のダメージを受けた。`;
        },
    },
    {
        id: "paralyze",
        icon: "⚡",
        sub_timing: "actAfter",
        sub_finish_text: "",
        exec_timing: "actBefore",
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
        sub_timing: "actAfter",
        sub_finish_text: "",
        exec_timing: "actBefore",
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
        sub_timing: "actAfter",
        sub_finish_text: "",
        exec_timing: "actBefore",
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
    weakness: { atk: { rate: -0.2 } },
    haste:    { spd:  { rate:  0.5 } },
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
        return enemies.filter(unit => !isDead(unit) && unit.hp < calcAllStatus(unit).maxHp);
    },
    damaged_enemy_random: (allies = [], enemies, actor = null) => {
        const aliveUnits = enemies.filter(unit => !isDead(unit) && unit.hp < calcAllStatus(unit).maxHp);
        return [aliveUnits[Math.floor(Math.random() * aliveUnits.length)]];
    },
    damaged_enemy_one: (allies = [], enemies, actor = null) => {
        return enemies.filter(unit => !isDead(unit) && unit.hp < calcAllStatus(unit).maxHp);
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
    poisoned_enemy_all: (allies = [], enemies, actor = null) => {
        return enemies.filter(unit => hasStatus("poison"));
    },
    poisoned_enemy_random: (allies = [], enemies, actor = null) => {
        const aliveUnits = enemies.filter(unit => hasStatus("poison"));
        return [aliveUnits[Math.floor(Math.random() * aliveUnits.length)]];
    },
    poisoned_enemy_one: (allies = [], enemies, actor = null) => {
        return enemies.filter(unit => hasStatus("poison"));
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
        return allies.filter(unit => !isDead(unit) && unit.hp < calcAllStatus(unit).maxHp);
    },
    damaged_ally_random: (allies, enemies = [], actor = null) => {
        const aliveUnits = allies.filter(unit => !isDead(unit) && unit.hp < calcAllStatus(unit).maxHp);
        return [aliveUnits[Math.floor(Math.random() * aliveUnits.length)]];
    },
    damaged_ally_one: (allies, enemies = [], actor = null) => {
        return allies.filter(unit => !isDead(unit) && unit.hp < calcAllStatus(unit).maxHp);
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
    poisoned_ally_all: (allies, enemies = [], actor = null) => {
        return allies.filter(unit => hasStatus("poison"));
    },
    poisoned_ally_random: (allies, enemies = [], actor = null) => {
        const aliveUnits = allies.filter(unit => hasStatus("poison"));
        return [aliveUnits[Math.floor(Math.random() * aliveUnits.length)]];
    },
    poisoned_ally_one: (allies, enemies = [], actor = null) => {
        return allies.filter(unit => hasStatus("poison"));
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
        return [...allies, ...enemies].filter(unit => !isDead(unit) && unit.hp < calcAllStatus(unit).maxHp);
    },
    damaged_random: (allies, enemies = [], actor = null) => {
        const aliveUnits = [...allies, ...enemies].filter(unit => !isDead(unit) && unit.hp < calcAllStatus(unit).maxHp);
        return [aliveUnits[Math.floor(Math.random() * aliveUnits.length)]];
    },
    damaged_one: (allies, enemies = [], actor = null) => {
        return [...allies, ...enemies].filter(unit => !isDead(unit) && unit.hp < calcAllStatus(unit).maxHp);
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
    poisoned_all: (allies, enemies = [], actor = null) => {
        return [...allies, ...enemies].filter(unit => hasStatus("poison"));
    },
    poisoned_random: (allies, enemies = [], actor = null) => {
        const aliveUnits = [...allies, ...enemies].filter(unit => hasStatus("poison"));
        return [aliveUnits[Math.floor(Math.random() * aliveUnits.length)]];
    },
    poisoned_one: (allies, enemies = [], actor = null) => {
        return [...allies, ...enemies].filter(unit => hasStatus("poison"));
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
    return unit.battleStatus.some(s => s.type === "dead");
}
/**
 * 状態異常中か判定する
 * @param {Object} target 
 */
export function hasStatus(unit, status) {
    return unit.battleStatus.some(s => s.type === status);
}