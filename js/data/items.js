// アイテムデータ定義

import { EQUIP_CATEGORIES } from '../const.js';
import { JOBS } from './jobs.js';
/**
 * @typedef {object} Effect
 * @property {string} type - 効果のタイプ (例: "heal", "statChange")
 * @property {number} [value] - 効果量（固定値の場合）
 * @property {string} [stat] - 変更するステータス名（statChangeの場合）
 * @property {string} [rate_reference] - 割合の参照元ステータス（rateと併用）
 * @property {string} [text] - 効果メッセージ（個別のメッセージが必要な場合）
 * @property {string} [itemId] - 取得するアイテムのID（acquire_itemの場合）
 */

/**
 * @typedef {object} Item
 * @property {string} id - アイテムID
 * @property {string} name - アイテム名
 * @property {string} description - アイテム説明文
 * @property {"consumable" | "equipment"} category - アイテムカテゴリ
 * @property {number} price - 価格
 * @property {Effect[] | null} effects - 使用効果配列（消費アイテム用）
 * @property {Object} usableIn - どの場面で使用可能か home|explore|battle
 * @property {number} uses - 使用回数制限（無制限ならnull）
 * @property {string} useType - 使用種別
 * @property {string} useTargetType - 使用対象種別
 * @property {object | null} statModifier - 増減ステータス（例: { atk: +5, def: +2 }）
 * @property {"weapon" | "def" | "shield" | "accessory" | null} equipCategory - 装備種別
 * @property {array} equipCondition - 装備条件
 */

/**
 * @type {Item[]}
 */
export const ITEMS = [
    // 消費アイテム
    {
        id: "noramlHerb",
        name: "薬草",
        description: "いたって普通の薬草。すりつぶして傷口に塗るとわずかに傷が治る。",
        category: "consumable",
        price: 100,
        effects: [
            {
                type: "heal",
                min: 0,
                max: 0,
                fix: 20,
                text: "薬草を使った。HPが20回復した！"
            }
        ],
        usableIn: {
            home: false,
            explore: true,
            battle: true,
        },
        uses: 2,
        useType: "heal",
        useTargetType: "damaged_ally_one",
        statModifier: null,
        equipCategory: null,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "potionOfDecay",
        name: "朽ちた回復薬",
        description: "古びた瓶に入った、不気味な色合いの薬。飲むとわずかに活力が戻る。",
        category: "consumable",
        price: 50,
        effects: [
            {
                type: "heal",
                min: 0,
                max: 0,
                fix: 10,
                text: "朽ちた回復薬を飲んだ。10 HP回復した！"
            }
        ],
        usableIn: {
            home: false,
            explore: true,
            battle: true,
        },
        uses: 2,
        useType: "heal",
        useTargetType: "damaged_ally_one",
        statModifier: null,
        equipCategory: null,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "elixirOfShadow",
        name: "影の秘薬",
        description: "闇の奥底から抽出された、禍々しい輝きを放つ秘薬。体に力が漲り存在感が増す。",
        category: "consumable",
        price: 200,
        effects: [
            {
                type: "statChange",
                stat: "atk",
                min: 0,
                max: 0,
                fix: 1,
                text: "影の秘薬を飲んだ。攻撃力が1上昇した！"
            },
            {
                type: "statChange",
                stat: "size",
                min: 0,
                max: 0,
                fix: 1,
                text: "体格が1上昇した！"
            },
            {
                type: "statChange",
                stat: "maxHp",
                min: 0,
                max: 0,
                fix: 3,
                text: "最大HPが3上昇した！"
            },
            { 
                type: "heal", 
                min: 0,
                max: 0,
                fix: 3,
            },
        ],
        usableIn: {
            home: true,
            explore: true,
            battle: false,
        },
        uses: 1,
        useType: "mod_status",
        useTargetType: "alive_ally_one",
        statModifier: null,
        equipCategory: null,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "scrollOfOblivion",
        name: "忘却の巻物",
        description: "古の呪文が記された巻物。使用すると、過去の記憶が薄れる代わりに精神が研ぎ澄まされる。",
        category: "consumable",
        price: 150,
        effects: [
            {
                type: "stat_change",
                stat: "int",
                min: 0,
                max: 0,
                fix: 1,
                text: "忘却の巻物を使った。知能が2上昇した！"
            },
        ],
        usableIn: {
            home: true,
            explore: true,
            battle: false,
        },
        uses: 1,
        useType: "mod_status",
        useTargetType: "alive_ally_one",
        statModifier: null,
        equipCategory: null,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "scrollOfSandStorm",
        name: "砂嵐の巻物",
        description: "古の呪文が記された巻物。使用すると、激しい砂嵐が身を切り裂く。",
        category: "consumable",
        price: 300,
        effects: [
            {
                type: "damage",
                min: 12,
                max: 32,
                fix: 0,
            },
        ],
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        uses: 3,
        useType: "attack",
        useTargetType: "alive_enemy_all",
        statModifier: null,
        equipCategory: null,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "scrollOfFireBullet",
        name: "火弾の巻物",
        description: "古の呪文が記された巻物。使用すると、激しい砂嵐が身を切り裂く。",
        category: "consumable",
        price: 100,
        effects: [
            {
                type: "damage",
                min: 15,
                max: 40,
                fix: 0,
            },
        ],
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        uses: 3,
        useType: "attack",
        useTargetType: "alive_enemy_one",
        statModifier: null,
        equipCategory: null,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "potionOfPoison",
        name: "バルサグの毒粉",
        description: "南部地方に生える植物の花粉。多量に吸うと全身に激しい痛みが走る。",
        category: "consumable",
        price: 50,
        effects: [
            {
                type: "addState",
                stateId: "poison",
                min: 0,
                max: 0,
                fix: 100,
                turn: 4,
            }
        ],
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        uses: 1,
        useType: "attack",
        useTargetType: "alive_enemy_one",
        statModifier: null,
        equipCategory: null,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "powderOfSleep",
        name: "アンミネルケの粉",
        description: "アンミネルケの花粉を集めたもの。多量に摂取すると意識障害が起きる。",
        category: "consumable",
        price: 50,
        effects: [
            {
                type: "addState",
                stateId: "sleep",
                min: 0,
                max: 0,
                fix: 100,
                turn: 4,
            }
        ],
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        uses: 1,
        useType: "attack",
        useTargetType: "alive_enemy_one",
        statModifier: null,
        equipCategory: null,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "congasStomach",
        name: "コンガの胃袋",
        description: "コンガの胃袋。大きく膨らませて破裂させることで、とてつもない爆音が鳴り響く。",
        category: "consumable",
        price: 50,
        effects: [
            {
                type: "addState",
                stateId: "stan",
                min: 0,
                max: 0,
                fix: 100,
                turn: 1,
            }
        ],
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        uses: 1,
        useType: "attack",
        useTargetType: "alive_enemy_one",
        statModifier: null,
        equipCategory: null,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "ketsukuruFruit",
        name: "ケツクルルの実",
        description: "隣の地区まで流れるほどの悪臭を放つ木の実。栄養満点のうえ、その臭気から気付けにも適している。",
        category: "consumable",
        price: 50,
        effects: [
            {
                type: "recoverState",
                stateId: "poison",
                min: 0,
                max: 0,
                fix: 100,
            },
            {
                type: "recoverState",
                stateId: "paralyze",
                min: 0,
                max: 0,
                fix: 100,
            },
            {
                type: "recoverState",
                stateId: "sleep",
                min: 0,
                max: 0,
                fix: 100,
            },
            {
                type: "recoverState",
                stateId: "stan",
                min: 0,
                max: 0,
                fix: 100,
            }
        ],
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        uses: 1,
        useType: "heal",
        useTargetType: "alive_ally_one",
        statModifier: null,
        equipCategory: null,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "rootOfAmbrosius",
        name: "アンブロシウスの根",
        description: "肥沃で魔力に富む地域に稀に生える植物の根。その強すぎる強心作用は、毒として利用されることもあるほど。",
        category: "consumable",
        price: 1000,
        effects: [
            {
                type: "revive",
                heal: 100,
                min: 0,
                max: 0,
                fix: 100,
            },
        ],
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        uses: 1,
        useType: "heal",
        useTargetType: "dead_ally_one",
        statModifier: null,
        equipCategory: null,
        equipCondition: null,
        uuid: "",
    },
    // 装備アイテム
    {
        id: "pigIronKnife",
        name: "銑鉄のナイフ",
        description: "かき集めた鉄で作られた脆いナイフ。ないよりはマシだが攻撃力に期待はできない。",
        category: "equipment",
        price: 200,
        effects: null,
        usableIn: {
            home: false,
            explore: false,
            battle: false,
        },
        uses: null,
        useType: null,
        useTargetType: null,
        statModifier: {
            atk: 2
        },
        equipCategory: EQUIP_CATEGORIES.weapon.id,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "twigsWand",
        name: "小枝の杖",
        description: "適当な小枝を編んで作った杖。お金に余裕がない初心者に最適。",
        category: "equipment",
        price: 200,
        effects: null,
        usableIn: {
            home: false,
            explore: false,
            battle: false,
        },
        uses: null,
        useType: null,
        useTargetType: null,
        statModifier: {
            int: 2
        },
        equipCategory: EQUIP_CATEGORIES.weapon.id,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "cursedDagger",
        name: "呪われた短剣",
        description: "血に塗れた刃を持つ短剣。装備すると攻撃力が増すが、常に微かな悪寒がつきまとう。",
        category: "equipment",
        price: 800,
        effects: null,
        usableIn: {
            home: false,
            explore: false,
            battle: false,
        },
        uses: null,
        useType: null,
        useTargetType: null,
        statModifier: {
            atk: 10,
            dex: -1
        },
        equipCategory: EQUIP_CATEGORIES.weapon.id,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "singlePieceOfFur",
        name: "毛皮の一枚布",
        description: "猪の毛皮をなめした一枚布。加工せず着る物好きもいるようだ。",
        category: "equipment",
        price: 300,
        effects: null,
        usableIn: {
            home: false,
            explore: false,
            battle: false,
        },
        uses: null,
        useType: null,
        useTargetType: null,
        statModifier: { maxHp: 5, def: 4 },
        equipCategory: EQUIP_CATEGORIES.mainArmor.id,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "clothRobe",
        name: "布のローブ",
        description: "一般的な布のローブ。戦闘向きではない。",
        category: "equipment",
        price: 300,
        effects: null,
        usableIn: {
            home: false,
            explore: false,
            battle: false,
        },
        uses: null,
        useType: null,
        useTargetType: null,
        statModifier: { maxMp: 5, def: 1, spd: 1 },
        equipCategory: EQUIP_CATEGORIES.mainArmor.id,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "chainmailOfTheUndead",
        name: "亡者の鎖帷子",
        description: "死者の骨と錆びた鎖で編まれた鎖帷子。身につけると防御力が増すが、重く動きを鈍らせる。",
        category: "equipment",
        price: 2000,
        effects: null,
        usableIn: {
            home: false,
            explore: false,
            battle: false,
        },
        uses: null,
        useType: null,
        useTargetType: null,
        statModifier: { maxHp: 15, def: 15, spd: -1 },
        equipCategory: EQUIP_CATEGORIES.mainArmor.id,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "woodenShield",
        name: "木の盾",
        description: "木の板を組み合わせて作った盾。弱い攻撃ならなんとか受け流せる。",
        category: "equipment",
        price: 300,
        effects: null,
        usableIn: {
            home: false,
            explore: false,
            battle: false,
        },
        uses: null,
        useType: null,
        useTargetType: null,
        statModifier: { def: 2 },
        equipCategory: EQUIP_CATEGORIES.subArmor.id,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "woodenBracelet",
        name: "木の腕輪",
        description: "木材を削り出して作った腕輪。魔法の触媒にするのにちょうどいい。",
        category: "equipment",
        price: 300,
        effects: null,
        usableIn: {
            home: false,
            explore: false,
            battle: false,
        },
        uses: null,
        useType: null,
        useTargetType: null,
        statModifier: { int: 3 },
        equipCategory: EQUIP_CATEGORIES.accessory.id,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "clothGloves",
        name: "布の手袋",
        description: "一般的な布の手袋。つけると少しだけ器用になる気がする。",
        category: "equipment",
        price: 150,
        effects: null,
        usableIn: {
            home: false,
            explore: false,
            battle: false,
        },
        uses: null,
        useType: null,
        useTargetType: null,
        statModifier: { dex: 3 },
        equipCategory: EQUIP_CATEGORIES.accessory.id,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "forestAmulet",
        name: "森のお守り",
        description: "森の守護者が身に着けていたネックレス。魔法の紋様が刻まれており、身に着けると戦闘能力が向上する。",
        category: "equipment",
        price: 1500,
        effects: null,
        usableIn: {
            home: false,
            explore: false,
            battle: false,
        },
        uses: null,
        useType: null,
        useTargetType: null,
        statModifier: { maxHp: 5, maxMp: 5, atk: 2, def: 2, spd: 2, int: 2, dex: 2, },
        equipCategory: EQUIP_CATEGORIES.accessory.id,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "ringOfTheAncients",
        name: "古き者の指輪",
        description: "古代の魔術師が身につけていたとされる指輪。知性を高める力がある。",
        category: "equipment",
        price: 1500,
        effects: null,
        usableIn: {
            home: false,
            explore: false,
            battle: false,
        },
        uses: null,
        useType: null,
        useTargetType: null,
        statModifier: { int: 5, maxMp: 5 },
        equipCategory: EQUIP_CATEGORIES.accessory.id,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "wearyBrandOfShadow",
        name: "擦り切れた影の烙印",
        description: "影の大精霊によって紋章を授けられている指輪。長い時間が経ち紋章が風化している。",
        category: "equipment",
        price: 1000000,
        effects: null,
        usableIn: {
            home: false,
            explore: false,
            battle: false,
        },
        uses: null,
        useType: null,
        useTargetType: null,
        statModifier: { maxMp: 50, int: 10 },
        equipCategory: EQUIP_CATEGORIES.accessory.id,
        equipCondition: null,
        uuid: "",
    },
    {
        id: "emblemOfWindia",
        name: "ウィンディアの紋章",
        description: "風の大精霊によって紋章を授けられているネックレス。身に着けるだけで普段の倍の速さで動けるという。",
        category: "equipment",
        price: 1000000,
        effects: null,
        usableIn: {
            home: false,
            explore: false,
            battle: false,
        },
        uses: null,
        useType: null,
        useTargetType: null,
        statModifier: { spd: 15, multiAction: 1 },
        equipCategory: EQUIP_CATEGORIES.accessory.id,
        equipCondition: {notJob: [JOBS.warrior.id]},
        uuid: "",
    },
];