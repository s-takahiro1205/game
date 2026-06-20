
// TODO 旧データ削除からのリネーム
export const EVENTS = {
    treasureSmall: {
        id: "treasureSmall",
        name: "小さな宝箱",
        start: "choice1",
        nodes: {
            choice1: {
                type: "choice",
                text: "party0nameたちは小さな宝箱を見つけた。",
                choices: [
                    {
                        text: "開ける",
                        next: "reward"
                    },
                    {
                        text: "無視する",
                        next: "end"
                    }
                ]
            },
            reward: {
                type: "getItem",
                data: {
                    count: 1,
                },
                next: "message1"
            },
            message1: {
                type: "message",
                text: "役に立つものがいくつか入っていた。",
                choices: [
                    {
                        text: "立ち去る",
                        next: "end"
                    },
                ]
            },
            end: {
                type: "end"
            }
        }
    },
    smallHerb: {
        id: "smallHerb",
        name: "小さな薬草",
        start: "choice1",
        nodes: {
            choice1: {
                type: "choice",
                text: "一人分の薬草が生えている。",
                choices: [
                    {
                        text: "食べる",
                        desc: "対象：1人 効果：HP+50%",
                        next: "eat"
                    },
                    {
                        text: "摘む",
                        desc: "薬草を1つ入手",
                        next: "reward"
                    },
                    {
                        text: "そっとしておく",
                        next: "end"
                    }
                ]
            },
            eat: {
                type: "heal",
                data: {
                    targetType: "single",
                    targetTerm: "alive",
                    dice: 0,
                    sides: 0,
                    flat: 30,
                    ref: null,
                    rate: 0,
                },
                next: "message1"
            },
            reward: {
                type: "getItem",
                data: {
                    count: 1,
                    id: "noraml_herb",
                },
                next: "message2"
            },
            message1: {
                type: "message",
                text: "傷が癒えた。",
                choices: [
                    {
                        text: "立ち去る",
                        next: "end"
                    },
                ]
            },
            message2: {
                type: "message",
                text: "成長しきったものをいくつか摘んだ。",
                choices: [
                    {
                        text: "立ち去る",
                        next: "end"
                    },
                ]
            },
            end: {
                type: "end"
            }
        }
    },
    springWater: {
        id: "springWater",
        name: "湧き水",
        start: "choice1",
        nodes: {
            choice1: {
                type: "choice",
                text: "綺麗な湧き水が沸いている。",
                choices: [
                    {
                        text: "飲む",
                        desc: "ランダム：回復 / ダメージ / 最大HPアップ / 最大MPアップ",
                        next: "drink"
                    },
                    {
                        text: "汲む",
                        desc: "朽ちた回復薬を1つ入手",
                        next: "reward"
                    },
                    {
                        text: "そっとしておく",
                        next: "end"
                    }
                ]
            },
            reward: {
                type: "getItem",
                data: {
                    count: 1,
                    id: "potion_of_decay",
                },
                next: "message1"
            },
            message1: {
                type: "message",
                text: "使い古した瓶に汲んだ。",
                choices: [
                    {
                        text: "立ち去る",
                        next: "end"
                    },
                ]
            },
            drink: {
                type: "lottery",
                data: {
                    heal: 0.50,
                    damage: 0.30,
                    maxHpUp: 0.10,
                    maxMpUp: 0.10,
                },
                next: "message1"
            },
            heal: {
                type: "heal",
                data: {
                    targetType: "single",
                    targetTerm: "alive",
                    type: "rate",
                    dice: 0,
                    sides: 0,
                    flat: 0,
                    ref: "maxHp",
                    rate: 20,
                },
                next: "message2"
            },
            damage: {
                type: "damage",
                data: {
                    targetType: "single",
                    targetTerm: "alive",
                    dice: 0,
                    sides: 0,
                    flat: 0,
                    ref: "maxHp",
                    rate: 5,
                },
                next: "message2"
            },
            maxHpUp: {
                type: "statusMod",
                data: {
                    targetType: "single",
                    targetTerm: "alive",
                    key: "maxHp",
                    dice: 1,
                    sides: 3,
                    flat: 2,
                    ref: null,
                    rate: 0,
                },
                next: "message2"
            },
            maxMpUp: {
                type: "statusMod",
                data: {
                    targetType: "single",
                    targetTerm: "alive",
                    key: "maxMp",
                    dice: 1,
                    sides: 3,
                    flat: 2,
                    ref: null,
                    rate: 0,
                },
                next: "message2"
            },
            message2: {
                type: "message",
                text: "湧き水を口にした。",
                choices: [
                    {
                        text: "立ち去る",
                        next: "end"
                    },
                ]
            },
            end: {
                type: "end"
            }
        }
    },
    battle: {
        id: "battle",
        name: "戦闘",
        start: "battle",
        nodes: {
            battle: {
                type: "battle",
                win: "end",
                lose: "gameOver",
            },
            end: {
                type: "end"
            },
            gameOver: {
                type: "gameOver"
            }
        }
    },
    eliteEnemy: {
        id: "eliteEnemy",
        name: "強敵戦闘",
        start: "battle",
        nodes: {
            battle: {
                type: "eliteEnemy",
                win: "end",
                lose: "gameOver",
            },
            end: {
                type: "end"
            },
            gameOver: {
                type: "gameOver"
            }
        }
    },
    boss: {
        id: "boss",
        name: "最終戦闘",
        start: "battle",
        nodes: {
            battle: {
                type: "boss",
                win: "clear",
                lose: "gameOver",
            },
            clear: {
                type: "clear"
            },
            gameOver: {
                type: "gameOver"
            }
        }
    },
    rest: {
        id: "rest",
        name: "休息所",
        start: "choice1",
        nodes: {
            choice1: {
                type: "choice",
                text: "party0nameたちは敵の気配のない場所を見つけた。<br>ここなら安全に休息が取れそうだ。",
                choices: [
                    {
                        text: "休息をとる(HP/MP+20%)",
                        next: "heal"
                    },
                    {
                        text: "鍛錬する(ランク経験値+5)",
                        next: "getRankExp"
                    },
                    {
                        text: "団らんする(経験値+Lv*5)",
                        desc: "条件：パーティ4人 レベル10以上が1人以上",
                        condition: {
                            partyCount: {eq: 4},
                            level: {gte: 10},
                        },
                        next: "getExp"
                    },
                    {
                        text: "先を急ぐ",
                        next: "end"
                    }
                ]
            },
            heal: {
                type: "heal",
                data: {
                    targetType: "all",
                    targetTerm: "alive",
                    dice: 0,
                    sides: 0,
                    flat: 0,
                    ref: "maxHp",
                    rate: 20,
                },
                next: "mpHeal"
            },
            mpHeal: {
                type: "mpHeal",
                data: {
                    targetType: "all",
                    targetTerm: "alive",
                    dice: 0,
                    sides: 0,
                    flat: 0,
                    ref: "maxMp",
                    rate: 20,
                },
                next: "message1"
            },
            message1: {
                type: "message",
                text: "party0nameたちは体を休めた。",
                choices: [
                    {
                        text: "探索に戻る",
                        next: "end"
                    },
                ]
            },
            getRankExp: {
                type: "getRankExp",
                data: {
                    targetType: "all",
                    targetTerm: "alive",
                    dice: 0,
                    sides: 0,
                    flat: 5,
                    ref: null,
                    rate: 0,
                },
                next: "message2"
            },
            message2: {
                type: "message",
                text: "party0nameたちは戦いのカンを掴んだ気がした。",
                choices: [
                    {
                        text: "探索に戻る",
                        next: "end"
                    },
                ]
            },
            getExp: {
                type: "getExp",
                data: {
                    targetType: "all",
                    targetTerm: "alive",
                    dice: 0,
                    sides: 0,
                    flat: 0,
                    ref: "level",
                    rate: 5,
                },
                next: "message3"
            },
            message3: {
                type: "message",
                text: "party0nameたちは団らんの中で連携のヒントを得た。",
                choices: [
                    {
                        text: "探索に戻る",
                        next: "end"
                    },
                ]
            },
            end: {
                type: "end"
            }
        }
    },
};
export const EVENT_TABLES = {
    lostForestShallow01: {
        battle: 0.05,
        eliteBattle: 0.02,
        rest: 0.03,
        treasureSmall: 0.30,
        smallHerb: 0.30,
        springWater: 0.30,
    },
};
export const ITEM_TABLES = {
    lostForestShallow01: {
        potion_of_decay: 0.10,
        elixir_of_shadow: 0.10,
    },
};
export const MONSTER_GROUPS = {
    starvingDog: ["starving-dog"],
    rottingCrowTwo: ["rotting-crow", "rotting-crow"],
    twistedRatAndStarvingDog: ["twisted-rat", "starving-dog"],
    forestGhoul: ["forest-ghoul"],
    thornSpider: ["thorn-spider", "thorn-spider"],
    movingMushroom: ["moving-mushroom"],
    forestGhoulAndmovingMushroom: ["forest-ghoul", "moving-mushroom"],
    wildBoar: ["wild-boar"],
    mossGolem: ["moss-golem"],
    mossGolemAndTwoMovingMushroom: ["moss-golem", "moving-mushroom", "moving-mushroom"],
    rogueBanditFour: ["rogue-bandit", "rogue-bandit", "rogue-bandit", "rogue-bandit"],
    guardianOfTheRuins: ["guardian-of-the-ruins"],
    guardianOfTheForestAndwanderingGhostTwo: ["guardian-of-the-forest", "wandering-ghost", "wandering-ghost"],
}
export const ENCOUNTER_TABLES = {
    lostForestShallow01: {
        starvingDog: 0.20,
        rottingCrowTwo: 0.15,
        twistedRatAndStarvingDog: 0.15,
        forestGhoul: 0.10,
        thornSpider: 0.10,
        movingMushroom: 0.10,
        forestGhoulAndmovingMushroom: 0.10,
        wildBoar: 0.10,
    },
    lostForestShallowElite01: {
        mossGolemAndTwoMovingMushroom: 0.50,
        rogueBanditFour: 0.25,
        guardianOfTheRuins: 0.25,
    },
    lostForestShallowBoss01: {
        guardianOfTheForestAndwanderingGhostTwo: 1.00
    },
}
export const MAPS = {
    lostForestShallow: {
        id: "lostForestShallow",// マップID。キーと一致させる
        name: "古き森-浅層",// マップ名
        // recommended_level: 10,// 却下。推奨レベルは定義モンスターの中央値で出す
        description: "はるか昔から拡大を続けている森。浅層にはあまりモンスターがいないようだ。",
        floorCount: 10,// 階層数
        tileCount: 5,// 階層ごとのカード数。列数
        tileGenRules: {// マップ初期化時の各タイル生成処理のイベント割合 タイルの見た目に影響するならここ 合計1になるように設定する
            enemy: 0.65,// 通常エネミー
            eliteEnemy: 0.15,// 強敵
            event: 0.10,// イベント
            adventurer: 0.02,// 冒険者遭遇イベント。戦ったり助けたり勧誘したり？
            rest: 0.08,// 休息マス
        },
        fixFloors: { 10: ["boss", "boss", "boss", "boss", "boss"] },// 1始まり。階層ごとの固定配置タイル。用途は、最終階層をすべてボスに上書きしたり任意の位置に固定イベントを設置したりなど。
        itemTableId: "lostForestShallow01",// 獲得アイテムテーブルID
        eventTableId: "lostForestShallow01",// イベントテーブルID
        encounterTableId: "lostForestShallow01",// モンスターグループの遭遇率テーブルID
        eliteEncounterTableId: "lostForestShallowElite01",// 精鋭グループの遭遇率テーブルID
        bossEncounterTableId: "lostForestShallowBoss01",// ボスグループの遭遇率テーブルID
    },
};


/**
 * マップ定義とアクションタイプからランダムなアクションを実行する
 * @param mapDef
 * @param exploreActionType
 * @returns {Object}
 */
function execExploreAction (mapDef, exploreActionType) {
    player.explore.phase = "actionExec";
    player.explore.action.type = exploreActionType;

    if (exploreActionType === "enemy") {
        // const monsterGroupId = weightedRandom(ENCOUNTER_TABLES[mapDef.encounterTableId]);
        // player.explore.action.data = { monsterIds: MONSTER_GROUPS[monsterGroupId] };
    } else if (exploreActionType === "eliteEnemy") {
        const monsterGroupId = weightedRandom(ENCOUNTER_TABLES[mapDef.eliteEncounterTableId]);
        player.explore.action.data = { monsterIds: MONSTER_GROUPS[monsterGroupId] };
    } else if (exploreActionType === "adventurer") {
        // TODO: ランダムで冒険者を生成して[共闘｜見捨てる｜襲いかかる]
        // 共闘なら精鋭1グループと戦闘、見捨てるなら冒険者データ破棄してイベント終了、襲いかかるなら精鋭2グループ+冒険者と戦闘
        player.explore.action.data = {};// 冒険者イベントIDと冒険者データと精鋭ID
        player.explore.action.phase = "waitingChoiceSelect";
        player.explore.action.choices = [];// イベント定義から生成
    } else if (exploreActionType === "event") {
        const eventId = weightedRandom(EVENT_TABLES[mapDef.eventTableId]);
        player.explore.action.data = { eventId: eventId };
    } else if (exploreActionType === "rest") {
        player.explore.action.data = { eventId: "rest" };// 固定の休息イベント
        player.explore.action.phase = "waitingChoiceSelect";
    } else if (exploreActionType === "boss") {
        const monsterGroupId = weightedRandom(ENCOUNTER_TABLES[mapDef.bossEncounterTableId]);
        player.explore.action.data = { monsterIds: MONSTER_GROUPS[monsterGroupId] };
    } else {
        throw new Error(`Unknown Explore action type: ${exploreActionType}`);
    }
}