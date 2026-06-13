// イベントデータ配列（100マス分）

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
 * @property {array} skill_list
 * @property {array} battle_state
 * @property {number} money // 撃破時にプレイヤーが獲得するお金
 */

/**
 * heal、damage、stat_changeイベントは効果量の指定として次のいずれかを実装すること
 * value=固定値
 * min, max=ランダム値
 * rate,rate_reference=能力の割合値
 * @typedef {object} Effect
 * @property {string} type - "heal" | "damage" | "stat_change" | "acquire_item" | "money_change" | "random_item"
 * @property {number} value
 * @property {number} min
 * @property {number} max
 * @property {number} rate
 * @property {string} rate_reference - "maxHp" | "hp" | "maxMp" | "mp" | "attack" | "armor" | "speed" | "intel" | "dex" | "size"
 * @property {string} item_id
 */

/**
 * @typedef {object} EventCell
 * @property {number} id
 * @property {string} type - "normal" | "benefit" | "danger" | "milestone" | "boss"
 * @property {string} title
 * @property {string} text
 * @property {array<Effect> | null} effects
 * @property {array<String> | null} enemyIds
 * @property {boolean} isMilestone
 * @property {Array<Choice> | null} choices // 選択肢
 */

/**
 * @typedef {object} Choice // 選択肢の型定義
 * @property {string} text
 * @property {string} outcomeText
 * @property {array<Effect> | null} effects
 * @property {array<String> | null} enemyIds
 * @property {next | null} next
 */

export const NORMAL_EVENTS = [
    {
        title: "静かな森",
        text: "木々の間を縫うように進む。鳥のさえずりが聞こえるが、他には何も起こらない。ただ静寂がそこにあるだけだ。",
        choices: [
            {
                text: "森の奥を探索する",
                outcomeText: "森の奥深くへと足を踏み入れた。小さな薬草を見つけ、体力が少し回復した。",
                effects: [{ type: "heal", value: 5 }],
                enemyIds: null,
                next: null
            },
            {
                text: "大地を踏みしめる",
                outcomeText: "巨体を生かして力いっぱい大地を踏みしめた。周囲の木から見慣れない果実が落ちてきた。あなたはそれを口にした。",
                condition: { stat: "size", operator: "gte", value: 6 },
                effects: [{ type: "stat_change", value: 1, stat: "armor", text: "あなたの体は硬くなった。" }],
                enemyIds: null,
                next: null
            },
            {
                text: "来た道を戻る",
                outcomeText: "来た道を慎重に戻った。特に何も起こらなかった。",
                effects: null,
                enemyIds: null,
                next: null
            }
        ]
    },
    { title: "古びた道", text: "苔むした石畳の道が続く。かつて多くの者が行き交ったであろう痕跡が、今はただ静かに横たわっている。" },
    { title: "風の囁き", text: "どこからともなく風が吹き抜け、耳元で何かを囁くように通り過ぎていく。その声は、遠い過去の記憶を呼び覚ますようだ。" },
    { title: "薄暗い洞窟", text: "入り口は狭いが、奥へと続く洞窟を見つけた。中を覗き込むが、暗闇が全てを覆い隠している。" },
    { title: "朽ちた標識", text: "道端に朽ちた木製の標識が立っている。文字は風化して読めないが、かつては旅人を導いたのだろう。" },
    { title: "霧の谷", text: "深い霧が立ち込める谷に差し掛かった。視界は悪く、足元を慎重に進む必要がある。何が潜んでいるか分からない。" },
    { title: "忘れられた泉", text: "ひっそりと湧き出る泉を見つけた。水面は静かで、周囲の景色を鏡のように映し出している。誰も訪れない場所のようだ。" },
    { title: "奇妙な足跡", text: "地面に奇妙な足跡が残されている。獣のものとも、人のものとも違う。未知の存在がこの地を歩いたのだろうか。" },
    { title: "沈黙の遺跡", text: "草木に覆われた古代の遺跡が姿を現す。かつての繁栄を物語るかのように、巨大な石柱が空を突いている。" },
    { title: "遠い雷鳴", text: "遠くの空で雷鳴が轟く。しかし、雨の気配はなく、ただ音が響くだけだ。不穏な予感がする。" },
    {
        title: "謎の祭壇",
        text: "古びた祭壇を見つけた。何かの儀式に使われたようだが、今は静かに佇んでいる。触れてみるか？",
        choices: [
            {
                text: "祭壇に触れる",
                outcomeText: "祭壇に触れると、不思議な力が体に流れ込んできた。",
                effects: [{
                    type: "dice_check",
                    success_threshold: 3, // 3以上で成功
                    success_effect: { type: "stat_change", value: 1, stat: "attack", text: "あなたの体に力がみなぎった。" },
                    fail_effect: { type: "damage", value: 5, text: "あなたは暴走した力によって傷ついた。" }
                }],
                next: null
            },
            {
                text: "力を捧げる",
                outcomeText: "力を捧げると不思議と体が軽くなった。",
                condition: { stat: "attack", operator: "gte", value: 1 },
                effects: [
                    { type: "stat_change", stat: "attack", value: -1 },
                    { type: "stat_change", stat: "speed", value: 1 },
                ],
                next: null
            },
            {
                text: "触れずに立ち去る",
                outcomeText: "祭壇には触れず、そのまま立ち去った。何も起こらなかった。",
                effects: null,
                next: null
            }
        ]
    }
];

export const BENEFIT_EVENTS = [
    { title: "癒しの光", text: "空から柔らかな光が降り注ぎ、疲れた体を癒していく。傷が少しだけ和らいだ気がする。", effects: [{ type: "heal", value: 8 }] },
    { title: "不思議な果実", text: "見慣れない木に、輝く果実が実っていた。一口食べると、力が湧いてくるのを感じる。", effects: [{type: "stat_change", stat: "maxHp", value: 1 }, { type: "heal", value: 12 }] },
    { title: "隠された薬草", text: "足元に珍しい薬草を見つけた。煎じて飲むと、体の奥から活力が蘇る。", effects: [{ type: "heal", rate: 0.8, rate_reference: "maxHp" }] },
    { title: "古の加護", text: "朽ちた祭壇に触れると、温かい力が流れ込んできた。少し打たれ強くなった。", effects: [{ type: "stat_change", stat: "maxHp", value: 3 }] },
    { title: "鍛冶屋の忘れ物", text: "道端に落ちていた古びた砥石を拾った。武器を研ぐと切れ味が増した。", effects: [{ type: "stat_change", stat: "attack", value: 1 }] },
    { title: "精霊の贈り物（攻）", text: "森の奥で精霊と出会った。彼らはあなたに力を分け与え、攻撃の威力を高めてくれた。", effects: [{ type: "stat_change", stat: "attack", value: 2 }] },
    { title: "精霊の贈り物（守）", text: "森の奥で精霊と出会った。彼らはあなたへ加護を与え、あなたは不思議な力に守られた。", effects: [{ type: "stat_change", stat: "armor", value: 1 }] },
    {
        title: "旅の商人",
        text: "道の脇に色鮮やかな幌馬車が止まっている。陽気な商人が手を振りながら声をかけてきた。「旅の方、よい品を揃えておりますよ！」",
        choices: [
            {
                text: "100G 支払う（アイテム3つ）",
                outcomeText: "商人は嬉しそうに荷物をまとめ、3つのアイテムを手渡してくれた。",
                condition: { stat: "money", operator: "gte", value: 100 },
                effects: [
                    { type: "money_change", value: -100 },
                    { type: "random_item", count: 3 }
                ],
                next: null
            },
            {
                text: "50G 支払う（アイテム1つ）",
                outcomeText: "商人は「毎度！」と笑顔で硬貨を受け取り、アイテムを1つ渡してくれた。",
                condition: { stat: "money", operator: "gte", value: 50 },
                effects: [
                    { type: "money_change", value: -50 },
                    { type: "random_item", count: 1 }
                ],
                next: null
            },
            {
                text: "立ち去る",
                outcomeText: "「またのお越しを！」商人の声を背に受けながら、あなたは先を急いだ。",
                effects: null,
                next: null
            }
        ]
    }
];

export const DANGER_EVENTS = [
    { title: "野獣の襲撃", text: "茂みから飢えた野獣が飛び出してきた！警戒を怠った代償を払う時だ。", enemyIds: ["starving-dog"]},
    { title: "盗賊の待ち伏せ", text: "人気のない道で、盗賊の一団が待ち伏せていた。彼らはあなたの持ち物を狙っている。", enemyIds: ["rogue-bandit"]},
    { title: "毒沼", text: "足を踏み入れた場所は、毒々しい沼地だった。体に痺れが走り、体力が奪われる。", effects: [{ type: "damage", value: 5 }] },
    {
        title: "底なし沼",
        text: "あなたは底のない沼に足を取られてしまった",
        choices: [
            {
                text: "もがく",
                outcomeText: "もがいて抜け出そうとした。",
                effects: [{ type: "damage", rate: 0.05, rate_reference: "maxHp" }],
                next: {
                    type: "random_branch",
                    branches: [
                        { probability: 0.3, event: { title: "底なし沼", text: "なんとか抜け出せた。"} },
                        { probability: 0.7, event: "SELF" }
                    ]
                }
            }
        ]
    },
    { title: "落石", text: "頭上から突然、大きな岩が落ちてきた！間一髪で避けたが、かすり傷を負ってしまった。", effects: [{ type: "damage", min: 3, max: 8 }] },
    { title: "呪われた像", text: "不気味な像に近づくと、邪悪なオーラに包まれた。体が重くなり、力が抜けていく。", effects: [{ type: "damage", value: 10 }] },
    { title: "彷徨う亡霊", text: "夜の帳が下りる頃、彷徨う亡霊と遭遇した。その冷たい視線があなたを貫く。", enemyIds: ["wandering-ghost"] }
];

export const MILESTONE_EVENTS_DATA = {
    20: {
        title: "廃墟の番人",
        text: "森の奥にある荒れ果てた廃墟にて、巨大な番人が立ちはだかる。その目は、侵入者を決して許さないと告げている。",
        enemyIds: ["guardian-of-the-ruins"],
        type: "milestone"
    },
    50: {
        title: "森の守護者",
        text: "鬱蒼とした森の中心で、自然の怒りを体現する守護者が現れた。その威圧感は、大地を震わせる。",
        enemyIds: ["guardian-of-the-forest", "starving-dog", "starving-dog"],
        type: "milestone"
    },
    80: {
        title: "影の使者",
        text: "闇が深まる森の深部、影から現れた使者があなたを待ち受ける。その存在は、この世界の者ではないかのような尋常ならざる気配だ。",
        enemyIds: ["messenger-of-Shadows", "wandering-ghost", "wandering-ghost"],
        type: "milestone"
    },
    100: {
        title: "暁の番人",
        text: "森の最深部、異界の気配を纏った祠が鎮座していた。祠へと近づいたその瞬間、同じ気配を纏う武人が襲い掛かってきた。",
        enemyIds: ["guardian-of-the-dawn"],
        type: "boss"
    }
};

/**
 * ランダムなイベントを生成するヘルパー関数
 * @param {number} id - マスID
 * @returns {{event: EventCell, category: string, index: number}} - 生成されたイベント、カテゴリ、インデックス
 */
export function generateRandomEvent(id) {
    const rand = Math.random();
    let eventData;
    let type;
    let index;

    if (rand < 0.5) { // 50% normal
        index = Math.floor(Math.random() * NORMAL_EVENTS.length);
        eventData = NORMAL_EVENTS[index];
        type = "NORMAL"; // カテゴリ名を文字列で保存
    } else if (rand < 0.7) { // 20% benefit
        index = Math.floor(Math.random() * BENEFIT_EVENTS.length);
        eventData = BENEFIT_EVENTS[index];
        type = "BENEFIT"; // カテゴリ名を文字列で保存
    } else { // 20% danger
        index = Math.floor(Math.random() * DANGER_EVENTS.length);
        eventData = DANGER_EVENTS[index];
        type = "DANGER"; // カテゴリ名を文字列で保存
    }

    const event = {
        id: id,
        type: type.toLowerCase(), // EventCellのtypeは小文字
        title: eventData.title,
        text: eventData.text,
        effects: eventData.effects || null,
        enemyIds: eventData.enemyIds,
        isMilestone: false,
        choices: eventData.choices || null,
        // セーブ用にカテゴリとインデックスをEventCell自体にも含める
        eventCategory: type,
        eventIndex: index
    };

    return { event: event, category: type, index: index };
}

export const EVENTS = [];
for (let i = 0; i <= 100; i++) {
    if (MILESTONE_EVENTS_DATA[i]) {
        const milestone = MILESTONE_EVENTS_DATA[i];
        EVENTS.push({
            id: i,
            type: milestone.type,
            title: milestone.title,
            text: milestone.text,
            effects: null, // マイルストーンは効果なし、戦闘のみ
            enemyIds: milestone.enemyIds,
            isMilestone: true,
            choices: milestone.choices || null, // 現状ないけど一応
            eventCategory: "MILESTONE", // マイルストーンイベントのカテゴリ
            eventIndex: Object.keys(MILESTONE_EVENTS_DATA).indexOf(String(i)) // マイルストーンイベントのインデックス
        });
    } else {
        const randomEventResult = generateRandomEvent(i);
        EVENTS.push(randomEventResult.event);
    }
}

// マス0は常にノーマルイベント（スタート地点）
EVENTS[0] = {
    id: 0,
    type: "normal",
    title: "旅の始まり",
    text: "あなたは暁の探訪者として、未知の世界へと足を踏み入れた。ここから、あなたの壮大な物語が始まる。",
    effects: null,
    enemyIds: null,
    isMilestone: false,
    choices: null,
    eventCategory: "NORMAL", // スタートイベントのカテゴリ
    eventIndex: 0 // スタートイベントのインデックス (NORMAL_EVENTSの最初の要素を想定)
};