//  エネミーデータ定義

import { RACES, SEXES, TRAITS } from '../const.js';

/**
 * @typedef {object} Enemy
 * @property {string} id // 識別子UUID
 * @property {string} name
 * @property {number} level
 * @property {number} exp
 * @property {number} hp
 * @property {number} maxHp
 * @property {number} mp
 * @property {number} maxMp
 * @property {number} atk
 * @property {string} description
 * @property {number} def
 * @property {number} spd
 * @property {number} int
 * @property {number} dex
 * @property {number} size
 * @property {number} multiAction
 * @property {array} skillList
 * @property {array} battleStatus
 * @property {number} money // 撃破時にプレイヤーが獲得するお金
 */

/**
 * @type {Enemy[]}
 */
export const ENEMIES = [
    // 一般エネミー
    {
        id: "mana-rabbit",
        name: "マナラビット",
        level: 1,
        exp: 5,
        hp: 8,
        maxHp: 8,
        mp: 15,
        maxMp: 15,
        atk: 3,
        description: "魔力によって大きく成長したウサギ。習性や食性には変化がないため、住処を荒らさない限り脅威にはならない。",
        def: 1,
        spd: 4,
        int: 8,
        dex: 3,
        size: 3,
        multiAction: 1,
        currentJob: "monster",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 90, guard: 0, bite: 10},
        battleStatus: [],
        dropItems: [
            {
                id: "potionOfDecay",
                chance: 33
            },
        ],
        money: 4,
        race: RACES.monster.id,
        sex: null,
        traits: [],
        dominationResist: 1.00,//支配しやすさ
    },
    {
        id: "starving-dog",
        name: "飢えた野犬",
        level: 2,
        exp: 3,
        hp: 15,
        maxHp: 15,
        mp: 15,
        maxMp: 15,
        atk: 5,
        description: "鋭い爪と牙を持つ、獰猛な獣だ。",
        def: 4,
        spd: 4,
        int: 2,
        dex: 3,
        size: 3,
        multiAction: 1,
        currentJob: "monster",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 70, guard: 0, bite: 30},
        battleStatus: [],
        dropItems: [
            {
                id: "wolfStone",
                chance: 1
            }
        ],
        money: 3,
        race: RACES.monster.id,
        sex: null,
        traits: [],
        dominationResist: 1.00,
    },
    {
        id: "rotting-crow",
        name: "腐肉烏",
        level: 1,
        exp: 2,
        hp: 10,
        maxHp: 10,
        mp: 0,
        maxMp: 0,
        atk: 5,
        description: "死肉を漁る不吉な烏。群れると危険だ。",
        def: 3,
        spd: 5,
        int: 1,
        dex: 4,
        size: 1,
        multiAction: 1,
        currentJob: "monster",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 100},
        battleStatus: [],
        dropItems: [
            {
                id: "potionOfDecay",
                chance: 1
            }
        ],
        money: 2,
        race: RACES.monster.id,
        sex: null,
        traits: [],
        dominationResist: 1.00,
    },
    {
        id: "twisted-rat",
        name: "ねじれネズミ",
        level: 1,
        exp: 3,
        hp: 12,
        maxHp: 12,
        mp: 0,
        maxMp: 0,
        atk: 4,
        description: "異常な成長を遂げ幾重にも体が捻じれた巨大な鼠。",
        def: 2,
        spd: 4,
        int: 1,
        dex: 4,
        size: 2,
        multiAction: 1,
        currentJob: "monster",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 100, guard: 0},
        battleStatus: [],
        dropItems: [
            {
                id: "potionOfDecay",
                chance: 1
            }
        ],
        money: 3,
        race: RACES.monster.id,
        sex: null,
        traits: [],
        dominationResist: 1.00,
    },
    {
        id: "forest-ghoul",
        name: "フォレストグール",
        level: 4,
        exp: 8,
        hp: 26,
        maxHp: 26,
        mp: 5,
        maxMp: 5,
        atk: 8,
        description: "行き場を失い森を徘徊する亡者。見かけたら天に召してあげよう。",
        def: 8,
        spd: 3,
        int: 2,
        dex: 2,
        size: 3,
        multiAction: 1,
        currentJob: "monster",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 80, guard: 0, "wait-and-see": 20},
        battleStatus: [],
        dropItems: [
            {
                id: "woodenShield",
                chance: 5
            },
            {
                id: "woodenBracelet",
                chance: 5
            },
            {
                id: "potionOfDecay",
                chance: 1
            }
        ],
        money: 4,
        race: RACES.monster.id,
        sex: null,
        traits: [],
        dominationResist: 1.00,
    },
    {
        id: "thorn-spider",
        name: "トゲグモ",
        level: 3,
        exp: 6,
        hp: 14,
        maxHp: 14,
        mp: 0,
        maxMp: 0,
        atk: 8,
        description: "鋭い棘に覆われた大型の毒蜘蛛。",
        def: 5,
        spd: 6,
        int: 1,
        dex: 5,
        size: 2,
        multiAction: 1,
        currentJob: "monster",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 80, guard: 0, "poison-bite": 20},
        battleStatus: [],
        dropItems: [
            {
                id: "potionOfDecay",
                chance: 1
            }
        ],
        money: 4,
        race: RACES.monster.id,
        sex: null,
        traits: [],
        dominationResist: 1.00,
    },
    {
        id: "moving-mushroom",
        name: "うごくキノコ",
        level: 3,
        exp: 5,
        hp: 24,
        maxHp: 24,
        mp: 0,
        maxMp: 0,
        atk: 6,
        description: "魔力を浴びて運動能力を得たキノコ。強い生命力を持ち、通常のキノコよりも美味しいとされる。",
        def: 4,
        spd: 1,
        int: 1,
        dex: 1,
        size: 7,
        multiAction: 1,
        currentJob: "monster",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 70, guard: 30},
        battleStatus: [],
        dropItems: [
            {
                id: "potionOfDecay",
                chance: 1
            }
        ],
        money: 8,
        race: RACES.monster.id,
        sex: null,
        traits: [],
        dominationResist: 1.00,
    },
    {
        id: "wild-boar",
        name: "あばれイノシシ",
        level: 3,
        exp: 12,
        hp: 35,
        maxHp: 35,
        mp: 0,
        maxMp: 0,
        atk: 13,
        description: "ひどく発達した筋肉を持つ狂暴な猪。",
        def: 11,
        spd: 3,
        int: 1,
        dex: 2,
        size: 4,
        multiAction: 1,
        currentJob: "monster",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 50, guard: 0, "charge": 50},
        battleStatus: [],
        dropItems: [
            {
                id: "singlePieceOfFur",
                chance: 5
            },
            {
                id: "potionOfDecay",
                chance: 1
            }
        ],
        money: 15,
        race: RACES.monster.id,
        sex: null,
        traits: [],
        dominationResist: 1.00,
    },

    
    {
        id: "blood-wolf",
        name: "ブラッドウルフ",
        level: 6,
        exp: 8,
        hp: 38,
        maxHp: 38,
        mp: 0,
        maxMp: 0,
        atk: 15,
        description: "俊敏な動きで獲物の体をかみちぎる獰猛な狼。",
        def: 8,
        spd: 12,
        int: 1,
        dex: 18,
        size: 4,
        multiAction: 1,
        currentJob: "monster",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 30, guard: 0, bite: 50, "double-bite": 20},
        battleStatus: [],
        dropItems: [
            {
                id: "wolfStone",
                chance: 10
            }
        ],
        money: 30,
        race: RACES.monster.id,
        sex: null,
        traits: [],
        dominationResist: 0.80,
    },
    {
        id: "moss-golem",
        name: "モスゴーレム",
        level: 5,
        exp: 18,
        hp: 48,
        maxHp: 48,
        mp: 10,
        maxMp: 10,
        atk: 20,
        description: "何者かによって造られた、森を巡回するゴーレム。",
        def: 24,
        spd: 2,
        int: 4,
        dex: 2,
        size: 4,
        multiAction: 1,
        currentJob: "monster",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 70, guard: 0, "charge": 10, "wait-and-see": 20},
        battleStatus: [],
        dropItems: [
            {
                id: "twigsWand",
                chance: 5
            },
            {
                id: "woodenShield",
                chance: 3
            },
            {
                id: "orbOfGrowthSmall",
                chance: 1
            }
        ],
        money: 33,
        race: RACES.monster.id,
        sex: null,
        traits: [],
        dominationResist: 0.80,
    },
    {
        id: "rogue-bandit",
        name: "ならず者の盗賊",
        level: 4,
        exp: 10,
        hp: 32,
        maxHp: 32,
        mp: 20,
        maxMp: 20,
        atk: 9,
        description: "数の利を活かそうとする、卑劣な盗賊だ。",
        def: 5,
        spd: 6,
        int: 1,
        dex: 6,
        size: 6,
        multiAction: 1,
        currentJob: "scout",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 55, guard: 20, "slash": 13, "poison-slash": 12},
        battleStatus: [],
        dropItems: [
            {
                id: "pigIronKnife",
                chance: 10
            },
            {
                id: "potionOfDecay",
                chance: 10
            },
            {
                id: "cursedDagger",
                chance: 2
            },
            {
                id: "scrollOfSandStorm",
                chance: 1
            }
        ],
        money: 21,
        race: RACES.human.id,
        sex: null,
        traits: [],
        dominationResist: 0.10,
    },
    {
        id: "wandering-ghost",
        name: "彷徨う亡霊",
        level: 4,
        exp: 10,
        hp: 25,
        maxHp: 25,
        mp: 25,
        maxMp: 25,
        atk: 3,
        description: "実体のない、怨念の塊だ。",
        def: 3,
        spd: 2,
        int: 10,
        dex: 6,
        size: 1,
        multiAction: 1,
        currentJob: "mysteriousSpirit",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 75, guard: 0, "fire": 25},
        battleStatus: [],
        dropItems: [
            {
                id: "clothRobe",
                chance: 5
            },
            {
                id: "ringOfTheAncients",
                chance: 1
            },
        ],
        money: 14,
        race: RACES.monster.id,
        sex: null,
        traits: [],
        dominationResist: 0.80,
    },
    {
        id: "guardian-of-the-ruins",
        name: "廃墟の番人",
        level: 5,
        exp: 30,
        hp: 60,
        maxHp: 60,
        mp: 0,
        maxMp: 0,
        atk: 16,
        description: "守るものを失った悲しき守護者だ。",
        def: 18,
        spd: 4,
        int: 1,
        dex: 1,
        size: 20,
        multiAction: 1,
        currentJob: "warrior",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 60, guard: 10, "slash": 20, "wait-and-see": 10},
        battleStatus: [],
        dropItems: [
            {
                id: "woodenBracelet",
                chance: 10
            },
            {
                id: "chainmailOfTheUndead",
                chance: 1
            }
        ],
        money: 50,
        race: RACES.fallen.id,
        sex: null,
        traits: ["regene5"],
        dominationResist: 0.01,
    },

    // ボーナス敵
    {
        id: "little-spirit-of-learning",
        name: "経験の妖精",
        level: 5,
        exp: 200,
        hp: 6,
        maxHp: 6,
        mp: 1,
        maxMp: 1,
        atk: 1,
        description: "成長のオーブを食べてしまった幼い妖精。成長の日を迎えるまで、外敵から逃げ回る羽目になってしまった。",
        def: 1,
        spd: 500,
        int: 1,
        dex: 1,
        size: 1,
        multiAction: 1,
        currentJob: "mysteriousSpirit",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 0, guard: 80, "wait-and-see": 20},
        battleStatus: [],
        dropItems: [
            {
                id: "orbOfGrowthSmall",
                chance: 100
            }
        ],
        money: 5,
        race: RACES.monster.id,
        sex: null,
        traits: [TRAITS.fairy.id],
        dominationResist: 0.01,
    },
    {
        id: "little-spirit-of-skill",
        name: "技能の妖精",
        level: 5,
        exp: 5,
        rankExp: 20,
        hp: 6,
        maxHp: 6,
        mp: 1,
        maxMp: 1,
        atk: 1,
        description: "経験のオーブを食べてしまった幼い妖精。成長の日を迎えるまで、外敵から逃げ回る羽目になってしまった。",
        def: 1,
        spd: 500,
        int: 1,
        dex: 1,
        size: 1,
        multiAction: 1,
        currentJob: "mysteriousSpirit",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 0, guard: 80, "wait-and-see": 20},
        battleStatus: [],
        dropItems: [
            {
                id: "orbOfExperienceSmall",
                chance: 100
            }
        ],
        money: 5,
        race: RACES.monster.id,
        sex: null,
        traits: [TRAITS.fairy.id],
        dominationResist: 0.01,
    },

    // ボス
    {
        id: "guardian-of-the-ruin",
        name: "祠の番人",
        level: 5,
        exp: 25,
        hp: 65,
        maxHp: 65,
        mp: 20,
        maxMp: 20,
        atk: 7,
        description: "森の祠を守っていた静かなる武人。加護は切れてもその繋がりは消えず。",
        def: 11,
        spd: 3,
        int: 3,
        dex: 3,
        size: 10,
        multiAction: 1,
        currentJob: "warrior",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 60, guard: 20, "wait-and-see": 20},
        battleStatus: [],
        dropItems: [],
        money: 100,
        race: RACES.human.id,
        sex: null,
        traits: [],
        dominationResist: 0.01,
    },
    {
        id: "guardian-of-the-forest",
        name: "森の守護者",
        level: 10,
        exp: 28,
        hp: 62,
        maxHp: 62,
        mp: 20,
        maxMp: 20,
        atk: 25,
        description: "住処を荒らすものを容赦なく排除する、森の均衡を守る存在だ。",
        def: 16,
        spd: 18,
        int: 19,
        dex: 18,
        size: 5,
        multiAction: 1,
        currentJob: "warrior",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 50, guard: 0, "heal": 33, "charge": 17},
        battleStatus: [],
        dropItems: [
            {
                id: "clothGloves",
                chance: 30
            },
            {
                id: "forestAmulet",
                chance: 10
            },
            {
                id: "orbOfGrowthSmall",
                chance: 3
            },
            {
                id: "orbOfExperienceSmall",
                chance: 3
            },
        ],
        money: 70,
        race: RACES.elf.id,
        sex: null,
        traits: [],
        dominationResist: 0.01,
    },
    {
        id: "messenger-of-Shadows",
        name: "影の使者",
        level: 20,
        exp: 57,
        hp: 110,
        maxHp: 110,
        mp: 90,
        maxMp: 90,
        atk: 48,
        description: "闇の力を纏う魔族だ。",
        def: 35,
        spd: 28,
        int: 38,
        dex: 40,
        size: 18,
        multiAction: 1,
        currentJob: "warrior",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 30, guard: 0, "full-thunder": 33, "power-slash": 37},
        battleStatus: [],
        dropItems: [
            {
                id: "wearyBrandOfShadow",
                chance: 1
            }
        ],
        money: 120,
        race: RACES.fallen.id,
        sex: null,
        traits: [],
        dominationResist: 0.01,
    },
    {
        id: "guardian-of-the-dawn",
        name: "暁の番人",
        level: 35,
        exp: 360,
        hp: 180,
        maxHp: 180,
        mp: 100,
        maxMp: 100,
        atk: 51,
        description:
        "暁の祠を守っていた静かなる武人。加護は切れてもその繋がりは消えず。",
        def: 37,
        spd: 40,
        int: 51,
        dex: 52,
        size: 40,
        multiAction: 3,
        currentJob: "warrior",
        jobs: {},
        equipmentSlot: [],
        skillList: {attack: 30, guard: 0, "full-thunder": 33, "full-slash": 37},
        battleStatus: [],
        dropItems: [
            {
                id: "emblemOfWindia",
                chance: 10
            }
        ],
        money: 500,
        race: RACES.human.id,
        sex: null,
        traits: [],
        dominationResist: 0.01,
    },
];