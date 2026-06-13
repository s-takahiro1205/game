// アイテムデータ定義

/**
 * @typedef {object} Effect
 * @property {string} type - 効果のタイプ (例: "heal", "stat_change")
 * @property {number} [value] - 効果量（固定値の場合）
 * @property {string} [stat] - 変更するステータス名（stat_changeの場合）
 * @property {number} [min] - 効果量の最小値（ランダム値の場合）
 * @property {number} [max] - 効果量の最大値（ランダム値の場合）
 * @property {number} [rate] - 割合（rate_referenceと併用）
 * @property {string} [rate_reference] - 割合の参照元ステータス（rateと併用）
 * @property {string} [text] - 効果メッセージ（個別のメッセージが必要な場合）
 */

/**
 * @typedef {object} Item
 * @property {string} id - アイテムID
 * @property {string} name - アイテム名
 * @property {string} description - アイテム説明文
 * @property {"consumable" | "equipment"} category - アイテムカテゴリ
 * @property {number} price - 価格
 * @property {Effect[] | null} effects - 使用効果配列（消費アイテム用）
 * @property {number} uses - 使用可能回数（消費アイテム。装備は0）
 * @property {number} use_type - 消費アイテム種別（装備はnull）
 * @property {object | null} stat_modifier - 増減ステータス（例: { attack: +5, armor: +2 }）
 * @property {"weapon" | "armor" | "shield" | "accessory" | null} equip_type - 装備種別
 */

/**
 * @type {Item[]}
 */
export const ITEMS = [
    // 消費アイテム
    {
        id: "potion_of_decay",
        name: "朽ちた回復薬",
        description: "古びた瓶に入った、不気味な色合いの薬。飲むとわずかに活力が戻る。",
        category: "consumable",
        price: 50,
        effects: [
            { type: "heal", value: 10, text: "朽ちた回復薬を飲んだ。10 HP回復した！" }
        ],
        uses: 2,
        use_type: "heal",
        use_target_type: "alive_ally_one",
        stat_modifier: null,
        equip_type: null
    },
    {
        id: "elixir_of_shadow",
        name: "影の秘薬",
        description: "闇の奥底から抽出された、禍々しい輝きを放つ秘薬。体に力が漲り存在感が増す。",
        category: "consumable",
        price: 200,
        effects: [
            { type: "stat_change", stat: "attack", value: 1, text: "影の秘薬を飲んだ。攻撃力が1上昇した！" },
            { type: "stat_change", stat: "maxHp", value: 3, text: "最大HPが3上昇した！" },
            { type: "heal", value: 3 },
            { type: "stat_change", stat: "size", value: 1, text: "体格が1上昇した！" }
        ],
        uses: 1,
        use_type: "mod_status",
        use_target_type: "alive_ally_one",
        stat_modifier: null,
        equip_type: null
    },
    {
        id: "scroll_of_oblivion",
        name: "忘却の巻物",
        description: "古の呪文が記された巻物。使用すると、過去の記憶が薄れる代わりに精神が研ぎ澄まされる。",
        category: "consumable",
        price: 150,
        effects: [
            { type: "stat_change", stat: "intel", value: 2, text: "忘却の巻物を使った。知能が2上昇した！" },
        ],
        uses: 1,
        use_type: "mod_status",
        use_target_type: "alive_ally_one",
        stat_modifier: null,
        equip_type: null
    },
    {
        id: "scroll_of_sand_storm",
        name: "砂嵐の巻物",
        description: "古の呪文が記された巻物。使用すると、激しい砂嵐が身を切り裂く。",
        category: "consumable",
        price: 300,
        effects: [
            { type: "damage", value: 10},
        ],
        uses: 1,
        use_type: "attack",
        use_target_type: "alive_enemy_all",
        stat_modifier: null,
        equip_type: null
    },
    {
        id: "scroll_of_fire_bullet",
        name: "火弾の巻物",
        description: "古の呪文が記された巻物。使用すると、激しい砂嵐が身を切り裂く。",
        category: "consumable",
        price: 100,
        effects: [
            { type: "damage", value: 20},
        ],
        uses: 1,
        use_type: "attack",
        use_target_type: "alive_enemy_one",
        stat_modifier: null,
        equip_type: null
    },
    // 装備アイテム
    {
        id: "cursed_dagger",
        name: "呪われた短剣",
        description: "血に塗れた刃を持つ短剣。装備すると攻撃力が増すが、常に微かな悪寒がつきまとう。",
        category: "equipment",
        price: 150,
        effects: null,
        uses: 0,
        use_type: null,
        use_target_type: null,
        stat_modifier: { attack: 5 },
        equip_type: "weapon"
    },
    {
        id: "chainmail_of_the_undead",
        name: "亡者の鎖帷子",
        description: "死者の骨と錆びた鎖で編まれた鎖帷子。身につけると防御力が増すが、重く動きを鈍らせる。",
        category: "equipment",
        price: 200,
        effects: null,
        uses: 0,
        use_type: null,
        use_target_type: null,
        stat_modifier: { armor: 3, speed: -1 }, // 防御力+3、速度-1
        equip_type: "armor"
    },
    {
        id: "ring_of_the_ancients",
        name: "古き者の指輪",
        description: "古代の魔術師が身につけていたとされる指輪。知性を高める力がある。",
        category: "equipment",
        price: 120,
        effects: null,
        uses: 0,
        use_type: null,
        use_target_type: null,
        stat_modifier: { intel: 2 },
        equip_type: "accessory"
    }
];