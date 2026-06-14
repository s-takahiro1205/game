//  エネミーデータ定義

/**
 * @typedef {object} Enemy
 * @property {string} id // 識別子UUID
 * @property {string} name
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
        name: "飢えた野獣",
        level: 2,
        exp: 5,
        hp: 15,
        maxHp: 15,
        mp: 15,
        maxMp: 15,
        attack: 3,
        description: "鋭い爪と牙を持つ、獰猛な獣だ。",
        isBoss: false,
        armor: 0,
        speed: 4,
        intel: 2,
        dex: 3,
        size: 3,
        multi_action: 1,
        equipment_slot: [],
        skill_list: [],
        battle_status: [],
        drop_items: [
            {
                id: "potion_of_decay",
                chance: 10
            }
        ],
        money: 10,
    },
    {
        id: "rogue-bandit",
        name: "ならず者の盗賊",
        level: 4,
        exp: 10,
        hp: 20,
        maxHp: 20,
        mp: 20,
        maxMp: 20,
        attack: 4,
        description: "数の利を活かそうとする、卑劣な盗賊だ。",
        isBoss: false,
        armor: 1,
        speed: 6,
        intel: 1,
        dex: 6,
        size: 6,
        multi_action: 1,
        equipment_slot: [],
        skill_list: [],
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
        money: 20,
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
        equipment_slot: [],
        skill_list: [],
        battle_status: [],
        drop_items: [
            {
                id: "elixir_of_shadow",
                chance: 5
            }
        ],
        money: 30,
    },

    // ボス
    {
        id: "guardian-of-the-ruins",
        name: "廃墟の番人",
        level: 5,
        exp: 15,
        hp: 20,
        maxHp: 20,
        mp: 20,
        maxMp: 20,
        attack: 8,
        description: "守るものを失った悲しき守護者だ。",
        isBoss: true,
        armor: 2,
        speed: 4,
        intel: 1,
        dex: 1,
        size: 20,
        multi_action: 1,
        equipment_slot: [],
        skill_list: [],
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
        exp: 33,
        hp: 35,
        maxHp: 35,
        mp: 20,
        maxMp: 20,
        attack: 10,
        description: "住処を荒らすものを容赦なく排除する、森の均衡を守る存在だ。",
        isBoss: true,
        armor: 3,
        speed: 6,
        intel: 1,
        dex: 10,
        size: 5,
        multi_action: 1,
        equipment_slot: [],
        skill_list: [],
        battle_status: [],
        drop_items: [
            {
                id: "ring_of_the_ancients",
                chance: 10
            }
        ],
        money: 100,
    },
    {
        id: "messenger-of-Shadows",
        name: "影の使者",
        level: 20,
        exp: 57,
        hp: 50,
        maxHp: 50,
        mp: 20,
        maxMp: 20,
        attack: 18,
        description: "闇の力を纏う魔族だ。",
        isBoss: true,
        armor: 5,
        speed: 8,
        intel: 18,
        dex: 10,
        size: 8,
        multi_action: 1,
        equipment_slot: [],
        skill_list: [],
        battle_status: [],
        drop_items: [
            {
                id: "weary_brand_of_Shadow",
                chance: 10
            }
        ],
        money: 200,
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
        attack: 25,
        description:
        "暁の祠を守っていた静かなる武人。加護は切れてもその繋がりは消えず。",
        isBoss: true,
        armor: 7,
        speed: 10,
        intel: 11,
        dex: 12,
        size: 20,
        multi_action: 2,
        equipment_slot: [],
        skill_list: [],
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