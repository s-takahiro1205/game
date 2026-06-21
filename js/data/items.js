// アイテムデータ定義

/**
 * @typedef {object} Effect
 * @property {string} type - 効果のタイプ (例: "heal", "stat_change")
 * @property {number} [value] - 効果量（固定値の場合）
 * @property {string} [stat] - 変更するステータス名（stat_changeの場合）
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
 * @property {string} use_type - 使用種別
 * @property {string} use_target_type - 使用対象種別
 * @property {object | null} stat_modifier - 増減ステータス（例: { attack: +5, armor: +2 }）
 * @property {"weapon" | "armor" | "shield" | "accessory" | null} equip_type - 装備種別
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
                dice: 0,
                sides: 0,
                flat: 0,
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
        use_type: "heal",
        use_target_type: "damaged_ally_one",
        stat_modifier: null,
        equip_type: null,
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
                dice: 0,
                sides: 0,
                flat: 0,
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
        use_type: "heal",
        use_target_type: "damaged_ally_one",
        stat_modifier: null,
        equip_type: null,
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
                type: "stat_change",
                stat: "attack",
                dice: 0,
                sides: 0,
                flat: 0,
                fix: 1,
                text: "影の秘薬を飲んだ。攻撃力が1上昇した！"
            },
            {
                type: "stat_change",
                stat: "size",
                dice: 0,
                sides: 0,
                flat: 0,
                fix: 1,
                text: "体格が1上昇した！"
            },
            {
                type: "stat_change",
                stat: "maxHp",
                dice: 0,
                sides: 0,
                flat: 0,
                fix: 3,
                text: "最大HPが3上昇した！"
            },
            { 
                type: "heal", 
                dice: 0,
                sides: 0,
                flat: 0,
                fix: 3,
            },
        ],
        usableIn: {
            home: true,
            explore: true,
            battle: false,
        },
        uses: 1,
        use_type: "mod_status",
        use_target_type: "alive_ally_one",
        stat_modifier: null,
        equip_type: null,
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
                stat: "intel",
                dice: 0,
                sides: 0,
                flat: 0,
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
        use_type: "mod_status",
        use_target_type: "alive_ally_one",
        stat_modifier: null,
        equip_type: null,
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
                dice: 5,
                sides: 5,
                flat: 7,
                fix: 0,
                armor_pierce: 1,//アイテムは全部アーマー無視
            },
        ],
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        uses: 3,
        use_type: "attack",
        use_target_type: "alive_enemy_all",
        stat_modifier: null,
        equip_type: null,
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
                dice: 5,
                sides: 6,
                flat: 10,
                fix: 0,
                armor_pierce: 1,
            },
        ],
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        uses: 3,
        use_type: "attack",
        use_target_type: "alive_enemy_one",
        stat_modifier: null,
        equip_type: null,
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
                type: "add_state",
                stateId: "poison",
                dice: 0,
                sides: 0,
                flat: 0,
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
        use_type: "attack",
        use_target_type: "alive_enemy_one",
        stat_modifier: null,
        equip_type: null,
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
                type: "add_state",
                stateId: "sleep",
                dice: 0,
                sides: 0,
                flat: 0,
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
        use_type: "attack",
        use_target_type: "alive_enemy_one",
        stat_modifier: null,
        equip_type: null,
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
                type: "add_state",
                stateId: "stan",
                dice: 0,
                sides: 0,
                flat: 0,
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
        use_type: "attack",
        use_target_type: "alive_enemy_one",
        stat_modifier: null,
        equip_type: null,
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
                type: "recover_state",
                stateId: "poison",
                dice: 0,
                sides: 0,
                flat: 0,
                fix: 100,
            },
            {
                type: "recover_state",
                stateId: "paralyze",
                dice: 0,
                sides: 0,
                flat: 0,
                fix: 100,
            },
            {
                type: "recover_state",
                stateId: "sleep",
                dice: 0,
                sides: 0,
                flat: 0,
                fix: 100,
            },
            {
                type: "recover_state",
                stateId: "stan",
                dice: 0,
                sides: 0,
                flat: 0,
                fix: 100,
            }
        ],
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        uses: 1,
        use_type: "heal",
        use_target_type: "alive_ally_one",
        stat_modifier: null,
        equip_type: null,
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
                dice: 0,
                sides: 0,
                flat: 0,
                fix: 100,
            },
        ],
        usableIn: {
            home: false,
            explore: false,
            battle: true,
        },
        uses: 1,
        use_type: "heal",
        use_target_type: "dead_ally_one",
        stat_modifier: null,
        equip_type: null,
        uuid: "",
    },
    // 装備アイテム
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
        use_type: null,
        use_target_type: null,
        stat_modifier: {
            attack: 5,
            dex: -1
        },
        dice_modifier: {
            dice: 0,
            sides: 3,
            flat: 2
        },
        equip_type: "weapon",
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
        use_type: null,
        use_target_type: null,
        stat_modifier: { maxHp: 15, armor: 3, speed: -1 },
        equip_type: "armor",
        uuid: "",
    },
    {
        id: "ringOfTheAncients",
        name: "古き者の指輪",
        description: "古代の魔術師が身につけていたとされる指輪。知性を高める力がある。",
        category: "equipment",
        price: 2500,
        effects: null,
        usableIn: {
            home: false,
            explore: false,
            battle: false,
        },
        uses: null,
        use_type: null,
        use_target_type: null,
        stat_modifier: { intel: 10, maxMp: 10 },
        dice_modifier: {
            dice: 0,
            sides: 0,
            flat: 3
        },
        equip_type: "accessory",
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
        use_type: null,
        use_target_type: null,
        stat_modifier: { maxHp: 10, maxMp: 50, dex: 3 },
        dice_modifier: {
            dice: 0,
            sides: 0,
            flat: 0
        },
        equip_type: "accessory",
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
        use_type: null,
        use_target_type: null,
        stat_modifier: { speed: 15, multi_action: 1 },
        dice_modifier: {
            dice: 0,
            sides: 5,
            flat: 5
        },
        equip_type: "accessory",
        uuid: "",
    },
];