// 職業データ配列

export const JOBS = {
    warrior: {
        id: "warrior",
        name: "戦士",
        grade: 1,// 職業の階位
        maxRank: 10,// 最大ランク
        rateExp: 1.0,// 必要経験値倍率
        visibleConditions: {// 存在認知
        },
        unlockConditions: { // 条件表示
        },
        allowConditions: { // 転職条件
            level: 1,
        },
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
            "spear",
            "axe",
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
            },
            {
                rank: 7,
                status: {
                    maxHp: 8,
                    atk: 3,
                }
            },
            {
                rank: 10,
                learnSkills: ["full-slash"],
                status: {
                    maxHp: 12,
                    atk: 4,
                    size: 2,
                }
            }
        ]
    },
    highWarrior: {
        id: "highWarrior",
        name: "闘士",
        grade: 2,// 職業の階位
        maxRank: 15,// 最大ランク
        rateExp: 1.5,// 必要経験値倍率
        visibleConditions: {// 存在認知
            // mapClear: ["lostForestShallow"],
        },
        unlockConditions: { // 条件表示
            level: 10,
        },
        allowConditions: { // 転職条件
            jobHistory: {warrior: 10}
        },
        growthRates: {// 成長率補正 250
            maxHp: 110,
            maxMp: 0,
            atk: 65,
            def: 45,
            spd: 20,
            int: -30,
            dex: 20,
            size: 20,
        },
        equipTypes: [// 装備適正(仮)
            "sword",
            "spear",
            "axe",
            "heavy",
        ],
        rankBonuses: [// ランクボーナス
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
            },
            {
                rank: 7,
                status: {
                    maxHp: 8,
                    atk: 3,
                }
            },
            {
                rank: 10,
                learnSkills: ["full-slash"],
                status: {
                    maxHp: 12,
                    atk: 4,
                    size: 2,
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
        visibleConditions: {// 存在認知
        },
        unlockConditions: { // 条件表示
        },
        allowConditions: { // 転職条件
            level: 1,
        },
        growthRates: {// 成長率補正 165 魔法職は1割増し
            maxHp: 30,
            maxMp: 75,
            atk: 0,
            def: 0,
            spd: 15,
            int: 30,
            dex: 15,
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
            },
            {
                rank: 7,
                status: {
                    maxMp: 8,
                    int: 3,
                }
            },
            {
                rank: 10,
                learnSkills: ["full-thunder"],
                status: {
                    maxMp: 12,
                    int: 4,
                    spd: 2,
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
        visibleConditions: {// 存在認知
        },
        unlockConditions: { // 条件表示
        },
        allowConditions: { // 転職条件
            level: 1,
        },
        growthRates: {// 成長率補正 165 魔法職は1割増し
            maxHp: 35,
            maxMp: 80,
            atk: 0,
            def: 10,
            spd: 10,
            int: 25,
            dex: 5,
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
            },
            {
                rank: 7,
                status: {
                    maxMp: 8,
                    int: 3,
                }
            },
            {
                rank: 10,
                learnSkills: ["ra-heal"],
                status: {
                    maxMp: 12,
                    int: 4,
                    def: 2,
                }
            }
        ]
    },
    scout: {
        id: "scout",
        name: "斥候",
        grade: 1,
        maxRank: 10,
        rateExp: 1.0,
        visibleConditions: {// 存在認知
        },
        unlockConditions: { // 条件表示
        },
        allowConditions: { // 転職条件
            level: 1,
        },
        growthRates: {// 成長率補正 150
            maxHp: 35,
            maxMp: 10,
            atk: 25,
            def: 10,
            spd: 35,
            int: 0,
            dex: 35,
            size: 0,
        },
        equipTypes: [// 装備適正(仮)
            "sword",
            "shield",
            "heavyArmor"
        ],
        rankBonuses: [// ランクボーナス
            {
                rank: 1,
                learnSkills: ["aim-shot"]
            },
            {
                rank: 2,
                status: {
                    maxHp: 3,
                    spd: 2,
                    tek: 2,
                }
            },
            {
                rank: 5,
                learnSkills: ["leg-shot", "poison-slash"],
            },
            {
                rank: 7,
                status: {
                    maxHp: 4,
                    spd: 2,
                    tek: 2,
                }
            },
            {
                rank: 10,
                learnSkills: ["double-shot"],
                status: {
                    maxHp: 10,
                    atk: 2,
                    spd: 3,
                    tek: 3,
                }
            }
        ]
    },
    monster: {
        id: "monster",
        name: "魔物",
        grade: 1,
        maxRank: 30,
        rateExp: 0.5,
        visibleConditions: {// 存在認知
            race: {require: ["monster"]}
        },
        unlockConditions: { // 条件表示
        },
        allowConditions: { // 転職条件
            level: 1,
        },
        growthRates: {// 成長率補正 150
            maxHp: 30,
            maxMp: 30,
            atk: 15,
            def: 15,
            spd: 15,
            int: 15,
            dex: 15,
            size: 15,
        },
        equipTypes: [],// 装備適正(仮)
        rankBonuses: [// ランクボーナス
            {
                rank: 1,
                learnSkills: ["bite"]
            },
            {
                rank: 3,
                status: {
                    maxHp: 3,
                    maxMp: 3,
                    atk: 1,
                    def: 1,
                    spd: 1,
                    int: 1,
                    dex: 1,
                    size: 1,
                }
            },
            {
                rank: 5,
                status: {
                    maxHp: 3,
                    maxMp: 3,
                    atk: 1,
                    def: 1,
                    spd: 1,
                    int: 1,
                    dex: 1,
                    size: 1,
                }
            },
            {
                rank: 7,
                status: {
                    maxHp: 3,
                    maxMp: 3,
                    atk: 1,
                    def: 1,
                    spd: 1,
                    int: 1,
                    dex: 1,
                    size: 1,
                }
            },
            {
                rank: 10,
                learnSkills: ["charge"],
                status: {
                    maxHp: 10,
                    maxMp: 10,
                }
            },
            {
                rank: 13,
                status: {
                    maxHp: 3,
                    maxMp: 3,
                    atk: 1,
                    def: 1,
                    spd: 1,
                    int: 1,
                    dex: 1,
                    size: 1,
                }
            },
            {
                rank: 17,
                status: {
                    maxHp: 3,
                    maxMp: 3,
                    atk: 1,
                    def: 1,
                    spd: 1,
                    int: 1,
                    dex: 1,
                    size: 1,
                }
            },
            {
                rank: 20,
                learnSkills: ["double-bite"],
                status: {
                    maxHp: 15,
                    maxMp: 15,
                }
            },
            {
                rank: 25,
                status: {
                    maxHp: 5,
                    maxMp: 5,
                    atk: 5,
                    def: 5,
                    spd: 5,
                    int: 5,
                    dex: 5,
                    size: 5,
                }
            },
            {
                rank: 30,
                learnSkills: ["thrash"],
                status: {
                    maxHp: 30,
                    maxMp: 30,
                    atk: 10,
                    def: 10,
                    spd: 10,
                    int: 10,
                    dex: 10,
                    size: 10,
                }
            },
        ]
    },
};