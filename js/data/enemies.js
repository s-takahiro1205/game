//  エネミーデータ定義

import { RACES, SEXES } from '../const.js';

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
        exp: 10,
        hp: 10,
        maxHp: 10,
        mp: 15,
        maxMp: 15,
        atk: 6,
        description: "魔力によって大きく成長したウサギ。習性や食性には変化がないため、住処を荒らさない限り脅威にはならない。",
        def: 0,
        spd: 4,
        int: 8,
        dex: 3,
        size: 3,
        multiAction: 1,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: ["bite"],
        battleStatus: [],
        dropItems: [
            {
                id: "potionOfDecay",
                chance: 33
            }
        ],
        money: 10,
        race: RACES.monster.id,
        sex: null,
    },
    {
        id: "starving-dog",
        name: "飢えた野犬",
        level: 2,
        exp: 5,
        hp: 15,
        maxHp: 15,
        mp: 15,
        maxMp: 15,
        atk: 11,
        description: "鋭い爪と牙を持つ、獰猛な獣だ。",
        def: 0,
        spd: 4,
        int: 2,
        dex: 3,
        size: 3,
        multiAction: 1,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: ["bite"],
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
    },
    {
        id: "rotting-crow",
        name: "腐肉烏",
        level: 1,
        exp: 3,
        hp: 10,
        maxHp: 10,
        mp: 0,
        maxMp: 0,
        atk: 9,
        description: "死肉を漁る不吉な烏。群れると危険だ。",
        def: 0,
        spd: 5,
        int: 1,
        dex: 4,
        size: 1,
        multiAction: 1,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: [],
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
    },
    {
        id: "twisted-rat",
        name: "ねじれネズミ",
        level: 1,
        exp: 4,
        hp: 12,
        maxHp: 12,
        mp: 0,
        maxMp: 0,
        atk: 10,
        description: "異常な成長を遂げ幾重にも体が捻じれた巨大な鼠。",
        def: 0,
        spd: 4,
        int: 1,
        dex: 4,
        size: 2,
        multiAction: 1,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: [],
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
    },
    {
        id: "forest-ghoul",
        name: "フォレストグール",
        level: 2,
        exp: 6,
        hp: 18,
        maxHp: 18,
        mp: 5,
        maxMp: 5,
        atk: 12,
        description: "行き場を失い森を徘徊する亡者。見かけたら天に召してあげよう。",
        def: 1,
        spd: 3,
        int: 2,
        dex: 2,
        size: 3,
        multiAction: 1,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: [],
        battleStatus: [],
        dropItems: [
            {
                id: "potionOfDecay",
                chance: 1
            }
        ],
        money: 5,
        race: RACES.monster.id,
        sex: null,
    },
    {
        id: "thorn-spider",
        name: "トゲグモ",
        level: 2,
        exp: 7,
        hp: 14,
        maxHp: 14,
        mp: 0,
        maxMp: 0,
        atk: 11,
        description: "鋭い棘に覆われた大型の毒蜘蛛。",
        def: 0,
        spd: 6,
        int: 1,
        dex: 5,
        size: 2,
        multiAction: 1,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: ["poison-bite"],
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
    },
    {
        id: "moving-mushroom",
        name: "うごくキノコ",
        level: 3,
        exp: 10,
        hp: 24,
        maxHp: 24,
        mp: 0,
        maxMp: 0,
        atk: 11,
        description: "魔力を浴びて運動能力を得たキノコ。強い生命力を持ち、通常のキノコよりも美味しいとされる。",
        def: 0,
        spd: 1,
        int: 1,
        dex: 1,
        size: 7,
        multiAction: 1,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: [],
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
        atk: 17,
        description: "ひどく発達した筋肉を持つ狂暴な猪。",
        def: 2,
        spd: 3,
        int: 1,
        dex: 2,
        size: 4,
        multiAction: 1,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: ["charge"],
        battleStatus: [],
        dropItems: [
            {
                id: "potionOfDecay",
                chance: 1
            }
        ],
        money: 10,
        race: RACES.monster.id,
        sex: null,
    },
    {
        id: "moss-golem",
        name: "苔ゴーレム",
        level: 5,
        exp: 20,
        hp: 48,
        maxHp: 48,
        mp: 10,
        maxMp: 10,
        atk: 17,
        description: "何者かによって造られた、森を巡回するゴーレム。",
        def: 4,
        spd: 2,
        int: 4,
        dex: 2,
        size: 4,
        multiAction: 1,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: [],
        battleStatus: [],
        dropItems: [
            {
                id: "potionOfDecay",
                chance: 1
            }
        ],
        money: 20,
        race: RACES.monster.id,
        sex: null,
    },
    {
        id: "rogue-bandit",
        name: "ならず者の盗賊",
        level: 4,
        exp: 10,
        hp: 30,
        maxHp: 30,
        mp: 20,
        maxMp: 20,
        atk: 11,
        description: "数の利を活かそうとする、卑劣な盗賊だ。",
        def: 1,
        spd: 6,
        int: 1,
        dex: 6,
        size: 6,
        multiAction: 1,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: ["slash"],
        battleStatus: [],
        dropItems: [
            {
                id: "potionOfDecay",
                chance: 10
            },
            {
                id: "cursedDagger",
                chance: 5
            }
        ],
        money: 10,
        race: RACES.human.id,
        sex: null,
    },
    {
        id: "wandering-ghost",
        name: "彷徨う亡霊",
        level: 4,
        exp: 8,
        hp: 25,
        maxHp: 25,
        mp: 25,
        maxMp: 25,
        atk: 5,
        description: "実体のない、怨念の塊だ。",
        def: 0,
        spd: 2,
        int: 11,
        dex: 6,
        size: 1,
        multiAction: 1,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: ["fire", "thunder"],
        battleStatus: [],
        dropItems: [
            {
                id: "elixirOfShadow",
                chance: 5
            }
        ],
        money: 13,
        race: RACES.monster.id,
        sex: null,
    },

    // ボス
    {
        id: "guardian-of-the-ruins",
        name: "廃墟の番人",
        level: 5,
        exp: 30,
        hp: 60,
        maxHp: 60,
        mp: 0,
        maxMp: 0,
        atk: 18,
        description: "守るものを失った悲しき守護者だ。",
        def: 5,
        spd: 4,
        int: 1,
        dex: 1,
        size: 20,
        multiAction: 1,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: ["power-slash"],
        battleStatus: [],
        dropItems: [
            {
                id: "chainmailOfTheUndead",
                chance: 1
            }
        ],
        money: 50,
        race: RACES.fallen.id,
        sex: null,
    },
    {
        id: "guardian-of-the-forest",
        name: "森の守護者",
        level: 10,
        exp: 44,
        hp: 62,
        maxHp: 62,
        mp: 20,
        maxMp: 20,
        atk: 20,
        description: "住処を荒らすものを容赦なく排除する、森の均衡を守る存在だ。",
        def: 3,
        spd: 11,
        int: 1,
        dex: 10,
        size: 5,
        multiAction: 1,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: ["heal", "charge"],
        battleStatus: [],
        dropItems: [
            {
                id: "ringOfTheAncients",
                chance: 1
            }
        ],
        money: 70,
        race: RACES.elf.id,
        sex: null,
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
        atk: 23,
        description: "闇の力を纏う魔族だ。",
        def: 5,
        spd: 8,
        int: 18,
        dex: 10,
        size: 8,
        multiAction: 1,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: ["full-thunder", "power-slash"],
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
    },
    {
        id: "guardian-of-the-ruin",
        name: "祠の番人",
        level: 5,
        exp: 40,
        hp: 100,
        maxHp: 100,
        mp: 20,
        maxMp: 20,
        atk: 10,
        description: "森の祠を守っていた静かなる武人。加護は切れてもその繋がりは消えず。",
        def: 1,
        spd: 3,
        int: 3,
        dex: 3,
        size: 10,
        multiAction: 2,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: ["slash", "wait-and-see"],
        battleStatus: [],
        dropItems: [],
        money: 100,
        race: RACES.human.id,
        sex: null,
    },
    {
        id: "guardian-of-the-dawn",
        name: "暁の番人",
        level: 35,
        exp: 360,
        hp: 80,
        maxHp: 80,
        mp: 100,
        maxMp: 100,
        atk: 41,
        description:
        "暁の祠を守っていた静かなる武人。加護は切れてもその繋がりは消えず。",
        def: 7,
        spd: 10,
        int: 11,
        dex: 12,
        size: 20,
        multiAction: 2,
        currentJob: null,
        jobs: {},
        equipmentSlot: [],
        skillList: ["power-slash", "full-slash"],
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
    },
];