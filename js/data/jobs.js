// 職業データ配列

export const JOBS = {
    warrior: {
        id: "warrior",
        name: "戦士",
        grade: 1,// 職業の階位
        maxRank: 10,// 最大ランク
        rateExp: 1.0,// 必要経験値倍率
        unlockConditions: [// 転職条件
            {
                type: "level",
                value: 1
            }
        ],
        growthRates: {// 成長率補正 150
            maxHp: 60,
            maxMp: 0,
            atk: 40,
            def: 20,
            spd: 10,
            int: 0,
            dex: 10,
            size: 10,
        },
        equipTypes: [// 装備適正(仮)
            "sword",
            "shield",
            "heavyArmor"
        ],
        rankBonuses: [// ランクボーナス
            {
                rank: 1,
                learnSkills: ["slash"]
            },
            {
                rank: 2,
                status: {
                    maxHp: 5,
                    atk: 3,
                }
            },
            {
                rank: 5,
                learnSkills: ["power-slash"],
                status: {
                    maxHp: 10,
                    atk: 5,
                }
            },
            {
                rank: 10,
                learnSkills: ["full-slash"],
                status: {
                    maxHp: 20,
                    atk: 5,
                    size: 5,
                }
            }
        ]
    },
    mage: {
        id: "mage",
        name: "魔法使い",
        grade: 1,
        maxRank: 10,
        rateExp: 1.0,
        unlockConditions: [
            {
                type: "level",
                value: 1
            }
        ],
        growthRates: {// 成長率補正 165 魔法職は1割増し
            maxHp: 40,
            maxMp: 90,
            atk: 0,
            def: 0,
            spd: 20,
            int: 30,
            dex: 20,
            size: 0,
        },
        equipTypes: [
            "wand",
            "stuff",
        ],
        rankBonuses: [
            {
                rank: 1,
                learnSkills: ["fire"]
            },
            {
                rank: 2,
                status: {
                    maxMp: 5,
                    int: 3,
                }
            },
            {
                rank: 5,
                learnSkills: ["thunder"],
                status: {
                    maxMp: 15,
                    int: 5,
                }
            },
            {
                rank: 10,
                learnSkills: ["full-thunder"],
                status: {
                    maxMp: 25,
                    int: 5,
                    spd: 3,
                }
            }
        ]
    },
    priest: {
        id: "priest",
        name: "僧侶",
        grade: 1,
        maxRank: 10,
        rateExp: 1.0,
        unlockConditions: [
            {
                type: "level",
                value: 1
            }
        ],
        growthRates: {// 成長率補正 165 魔法職は1割増し
            maxHp: 50,
            maxMp: 80,
            atk: 0,
            def: 10,
            spd: 20,
            int: 30,
            dex: 10,
            size: 0,
        },
        equipTypes: [
            "wand",
            "stuff",
        ],
        rankBonuses: [
            {
                rank: 1,
                learnSkills: ["heal"]
            },
            {
                rank: 2,
                status: {
                    maxMp: 5,
                    int: 3,
                }
            },
            {
                rank: 5,
                learnSkills: ["poi-cure"],
                status: {
                    maxMp: 10,
                    int: 8,
                }
            },
            {
                rank: 10,
                learnSkills: ["ra-heal"],
                status: {
                    maxMp: 20,
                    int: 5,
                    def: 3,
                }
            }
        ]
    },
};