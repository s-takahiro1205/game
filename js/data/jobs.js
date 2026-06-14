// 職業データ配列

export const JOBS = {
    warrior: {
        id: "warrior",
        name: "戦士",
        maxRank: 10,// 最大ランク
        baseExp: 10,// 基礎必要経験値
        rateExp: 1.1,// 必要経験値倍率 10 * (1.1 ^ ランク) + 5 * ランク
        unlockConditions: [// 転職条件
            {
                type: "level",
                value: 1
            }
        ],
        growthRates: {// 成長率補正 200
            maxHp: 100,
            maxMp: 0,
            attack: 50,
            armor: 20,
            speed: 10,
            intel: 0,
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
                rank: 2,
                status: {
                    maxHp: 5,
                    attack: 3,
                }
            },
            {
                rank: 3,
                learnSkills: ["slash"]
            },
            {
                rank: 5,
                learnSkills: ["power-slash"],
                status: {
                    maxHp: 10,
                    attack: 5,
                }
            },
            {
                rank: 10,
                learnSkills: ["full-slash"],
                status: {
                    maxHp: 20,
                    attack: 5,
                    size: 5,
                }
            }
        ]
    },
    mage: {
        id: "mage",
        name: "魔法使い",
        maxRank: 10,
        baseExp: 10,
        rateExp: 1.1,
        unlockConditions: [
            {
                type: "level",
                value: 1
            }
        ],
        growthRates: {// 成長率補正 200
            maxHp: 40,
            maxMp: 90,
            attack: 0,
            armor: 0,
            speed: 20,
            intel: 30,
            dex: 20,
            size: 0,
        },
        equipTypes: [
            "wand",
            "stuff",
        ],
        rankBonuses: [
            {
                rank: 2,
                status: {
                    maxMp: 5,
                    intel: 3,
                }
            },
            {
                rank: 3,
                learnSkills: ["fire"]
            },
            {
                rank: 5,
                learnSkills: ["thunder"],
                status: {
                    maxMp: 15,
                    intel: 5,
                }
            },
            {
                rank: 10,
                learnSkills: ["full-thunder"],
                status: {
                    maxMp: 25,
                    intel: 5,
                    speed: 3,
                }
            }
        ]
    },
};