//  イベントデータ定義

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
                    min: 0,
                    max: 0,
                    fix: 30,
                    ref: null,
                    rate: 0,
                },
                next: "message1"
            },
            reward: {
                type: "getItem",
                data: {
                    count: 1,
                    id: "noramlHerb",
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
                    id: "potionOfDecay",
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
                    min: 0,
                    max: 0,
                    fix: 0,
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
                    min: 0,
                    max: 0,
                    fix: 0,
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
                    min: 0,
                    max: 0,
                    fix: 0,
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
                    min: 0,
                    max: 0,
                    fix: 0,
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
                    min: 0,
                    max: 0,
                    fix: 0,
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
                    min: 0,
                    max: 0,
                    fix: 0,
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
                    min: 0,
                    max: 0,
                    fix: 5,
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
                    min: 0,
                    max: 0,
                    fix: 0,
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