//  エネミーデータ定義

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
 * @property {number} attack
 * @property {string} description
 * @property {boolean} isBoss
 * @property {number} armor
 * @property {number} speed
 * @property {number} intel
 * @property {number} dex
 * @property {number} size
 * @property {number} multi_action
 * @property {array} skill_list
 * @property {array} battle_status
 * @property {number} money // 撃破時にプレイヤーが獲得するお金
 */

/**
 * @type {Enemy[]}
 */
export const ENEMIES = [
    // 一般エネミー
    {
        id: "starving-dog",
        name: "飢えた野犬",
        level: 2,
        exp: 5,
        hp: 15,
        maxHp: 15,
        mp: 15,
        maxMp: 15,
        attack: 11,
        description: "鋭い爪と牙を持つ、獰猛な獣だ。",
        isBoss: false,
        armor: 0,
        speed: 4,
        intel: 2,
        dex: 3,
        size: 3,
        multi_action: 1,
        currentJob: null,
        jobs: {},
        equipment_slot: [],
        skill_list: ["bite"],
        battle_status: [],
        drop_items: [
            {
                id: "potion_of_decay",
                chance: 1
            }
        ],
        money: 3,
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
        attack: 9,
        description: "死肉を漁る不吉な烏。群れると危険だ。",
        isBoss: false,
        armor: 0,
        speed: 5,
        intel: 1,
        dex: 4,
        size: 1,
        multi_action: 1,
        currentJob: null,
        jobs: {},
        equipment_slot: [],
        skill_list: [],
        battle_status: [],
        drop_items: [
            {
                id: "potion_of_decay",
                chance: 1
            }
        ],
        money: 2,
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
        attack: 10,
        description: "異常な成長を遂げ幾重にも体が捻じれた巨大な鼠。",
        isBoss: false,
        armor: 0,
        speed: 4,
        intel: 1,
        dex: 4,
        size: 2,
        multi_action: 1,
        currentJob: null,
        jobs: {},
        equipment_slot: [],
        skill_list: [],
        battle_status: [],
        drop_items: [
            {
                id: "potion_of_decay",
                chance: 1
            }
        ],
        money: 3,
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
        attack: 12,
        description: "行き場を失い森を徘徊する亡者。見かけたら天に召してあげよう。",
        isBoss: false,
        armor: 1,
        speed: 3,
        intel: 2,
        dex: 2,
        size: 3,
        multi_action: 1,
        currentJob: null,
        jobs: {},
        equipment_slot: [],
        skill_list: [],
        battle_status: [],
        drop_items: [
            {
                id: "potion_of_decay",
                chance: 1
            }
        ],
        money: 5,
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
        attack: 11,
        description: "鋭い棘に覆われた大型の毒蜘蛛。",
        isBoss: false,
        armor: 0,
        speed: 6,
        intel: 1,
        dex: 5,
        size: 2,
        multi_action: 1,
        currentJob: null,
        jobs: {},
        equipment_slot: [],
        skill_list: ["poison-bite"],
        battle_status: [],
        drop_items: [
            {
                id: "potion_of_decay",
                chance: 1
            }
        ],
        money: 4,
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
        attack: 11,
        description: "魔力を浴びて運動能力を得たキノコ。強い生命力を持ち、通常のキノコよりも美味しいとされる。",
        isBoss: false,
        armor: 0,
        speed: 1,
        intel: 1,
        dex: 1,
        size: 7,
        multi_action: 1,
        currentJob: null,
        jobs: {},
        equipment_slot: [],
        skill_list: [],
        battle_status: [],
        drop_items: [
            {
                id: "potion_of_decay",
                chance: 1
            }
        ],
        money: 8,
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
        attack: 17,
        description: "ひどく発達した筋肉を持つ狂暴な猪。",
        isBoss: false,
        armor: 2,
        speed: 3,
        intel: 1,
        dex: 2,
        size: 4,
        multi_action: 1,
        currentJob: null,
        jobs: {},
        equipment_slot: [],
        skill_list: ["charge"],
        battle_status: [],
        drop_items: [
            {
                id: "potion_of_decay",
                chance: 1
            }
        ],
        money: 10,
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
        attack: 17,
        description: "何者かによって造られた、森を巡回するゴーレム。",
        isBoss: false,
        armor: 4,
        speed: 2,
        intel: 4,
        dex: 2,
        size: 4,
        multi_action: 1,
        currentJob: null,
        jobs: {},
        equipment_slot: [],
        skill_list: [],
        battle_status: [],
        drop_items: [
            {
                id: "potion_of_decay",
                chance: 1
            }
        ],
        money: 20,
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
        attack: 11,
        description: "数の利を活かそうとする、卑劣な盗賊だ。",
        isBoss: false,
        armor: 1,
        speed: 6,
        intel: 1,
        dex: 6,
        size: 6,
        multi_action: 1,
        currentJob: null,
        jobs: {},
        equipment_slot: [],
        skill_list: ["slash"],
        battle_status: [],
        drop_items: [
            {
                id: "potion_of_decay",
                chance: 10
            },
            {
                id: "cursed_dagger",
                chance: 5
            }
        ],
        money: 10,
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
        attack: 5,
        description: "実体のない、怨念の塊だ。",
        isBoss: false,
        armor: 0,
        speed: 2,
        intel: 11,
        dex: 6,
        size: 1,
        multi_action: 1,
        currentJob: null,
        jobs: {},
        equipment_slot: [],
        skill_list: ["fire", "thunder"],
        battle_status: [],
        drop_items: [
            {
                id: "elixir_of_shadow",
                chance: 5
            }
        ],
        money: 13,
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
        attack: 18,
        description: "守るものを失った悲しき守護者だ。",
        isBoss: true,
        armor: 5,
        speed: 4,
        intel: 1,
        dex: 1,
        size: 20,
        multi_action: 1,
        currentJob: null,
        jobs: {},
        equipment_slot: [],
        skill_list: ["power-slash"],
        battle_status: [],
        drop_items: [
            {
                id: "chainmail_of_the_undead",
                chance: 10
            }
        ],
        money: 50,
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
        attack: 20,
        description: "住処を荒らすものを容赦なく排除する、森の均衡を守る存在だ。",
        isBoss: true,
        armor: 3,
        speed: 11,
        intel: 1,
        dex: 10,
        size: 5,
        multi_action: 1,
        currentJob: null,
        jobs: {},
        equipment_slot: [],
        skill_list: ["heal", "charge"],
        battle_status: [],
        drop_items: [
            {
                id: "ring_of_the_ancients",
                chance: 10
            }
        ],
        money: 70,
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
        attack: 23,
        description: "闇の力を纏う魔族だ。",
        isBoss: true,
        armor: 5,
        speed: 8,
        intel: 18,
        dex: 10,
        size: 8,
        multi_action: 1,
        currentJob: null,
        jobs: {},
        equipment_slot: [],
        skill_list: ["full-thunder", "power-slash"],
        battle_status: [],
        drop_items: [
            {
                id: "weary_brand_of_Shadow",
                chance: 10
            }
        ],
        money: 120,
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
        attack: 41,
        description:
        "暁の祠を守っていた静かなる武人。加護は切れてもその繋がりは消えず。",
        isBoss: true,
        armor: 7,
        speed: 10,
        intel: 11,
        dex: 12,
        size: 20,
        multi_action: 2,
        currentJob: null,
        jobs: {},
        equipment_slot: [],
        skill_list: ["power-slash", "full-slash"],
        battle_status: [],
        drop_items: [
            {
                id: "emblem_of_windia",
                chance: 10
            }
        ],
        money: 500,
    },
];