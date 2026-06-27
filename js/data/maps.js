//  マップデータ定義

export const EVENT_TABLES = {
    lostForestSacred01: {
        treasureSmall: 1.00,
    },
    lostForestShallow01: {
        battle: 0.05,
        eliteEnemy: 0.02,
        rest: 0.03,
        treasureSmall: 0.30,
        smallHerb: 0.30,
        springWater: 0.30,
    },
};
export const ITEM_TABLES = {
    lostForestSacred01: {
        scrollOfFireBullet: 1.00,
    },
    lostForestShallow01: {
        potionOfDecay: 0.20,
        elixirOfShadow: 0.01,
        pigIronKnife: 0.05,
        twigsWand: 0.05,
        singlePieceOfFur: 0.05,
        clothRobe: 0.05,
        woodenShield: 0.05,
        woodenBracelet: 0.05,
        clothGloves: 0.05,
    },
};
export const MONSTER_GROUPS = {
    manaRabbit: ["mana-rabbit"],
    manaRabbitTwo: ["mana-rabbit", "mana-rabbit"],
    guardianOfTheRuin: ["guardian-of-the-ruin"],
    starvingDog: ["starving-dog"],
    rottingCrowThree: ["rotting-crow", "rotting-crow", "rotting-crow"],
    twistedRatAndStarvingDog: ["twisted-rat", "starving-dog"],
    forestGhoulAndStarvingDogTwo: ["starving-dog", "forest-ghoul", "starving-dog"],
    thornSpiderTwo: ["thorn-spider", "thorn-spider"],
    movingMushroom: ["moving-mushroom"],
    forestGhoulAndmovingMushroom: ["forest-ghoul", "moving-mushroom"],
    wildBoar: ["wild-boar"],

    bloodWolf: ["blood-wolf"],
    mossGolem: ["moss-golem"],
    mossGolemAndTwoMovingMushroom: ["moss-golem", "moving-mushroom", "moving-mushroom"],
    rogueBanditFour: ["rogue-bandit", "rogue-bandit", "rogue-bandit", "rogue-bandit"],

    littleSpiritOfLearning: ["little-spirit-of-learning"],
    littleSpiritOfSkill: ["little-spirit-of-skill"],

    guardianOfTheRuins: ["guardian-of-the-ruins"],
    guardianOfTheForestAndwanderingGhostTwo: ["guardian-of-the-forest", "wandering-ghost", "wandering-ghost"],
}
export const ENCOUNTER_TABLES = {
    lostForestSacred01: {
        manaRabbit: 1.00,
    },
    lostForestSacredElite01: {
        manaRabbitTwo: 1.00,
    },
    lostForestSacredBoss01: {
        guardianOfTheRuin: 1.00
    },
    lostForestShallow01: {
        starvingDog: 0.20,
        rottingCrowThree: 0.15,
        twistedRatAndStarvingDog: 0.15,
        forestGhoulAndStarvingDogTwo: 0.10,
        thornSpiderTwo: 0.10,
        movingMushroom: 0.10,
        forestGhoulAndmovingMushroom: 0.10,
        wildBoar: 0.08,
        littleSpiritOfLearning: 0.01,
        littleSpiritOfSkill: 0.01,
    },
    lostForestShallowElite01: {
        bloodWolf: 0.24,
        mossGolemAndTwoMovingMushroom: 0.20,
        rogueBanditFour: 0.20,
        guardianOfTheRuins: 0.30,
        littleSpiritOfLearning: 0.03,
        littleSpiritOfSkill: 0.03,
    },
    lostForestShallowBoss01: {
        guardianOfTheForestAndwanderingGhostTwo: 1.00
    },
}
export const MAPS = {
    beginingForest: {
        id: "beginingForest",
        name: "古き森-聖域",
        description: "奇妙な声に惹かれて迷い込んだ領域。濃密な魔の気配に反してモンスターはあまりいない。",
        condition: {
            mapClear: {lt: {beginingForest: 1}}
        },
        floorCount: 5,
        tileCount: 1,
        tileGenRules: {
            enemy: 0.65,
            eliteEnemy: 0.15,
            event: 0.10,
            adventurer: 0.02,
            rest: 0.08,
        },
        fixFloors: { 1: ["enemy"], 2: ["event"], 3: ["eliteEnemy"], 4: ["rest"], 5: ["boss"], },// 1始まり
        itemTableId: "lostForestSacred01",
        eventTableId: "lostForestSacred01",
        encounterTableId: "lostForestSacred01",
        eliteEncounterTableId: "lostForestSacredElite01",
        bossEncounterTableId: "lostForestSacredBoss01",
        clearBonus: {
            first: {
                addSkill: ["domination"],
            },
        },
    },
    lostForestShallow: {
        id: "lostForestShallow",// マップID。キーと一致させる
        name: "古き森-浅層",// マップ名
        // recommended_level: 10,// 却下。推奨レベルは定義モンスターの中央値で出す
        description: "はるか昔から拡大を続けている森。浅層にはあまりモンスターがいないようだ。",
        condition: {
            mapClear: {gte: {beginingForest: 1}}
        },
        floorCount: 10,// 階層数
        tileCount: 5,// 階層ごとのカード数。列数
        tileGenRules: {// マップ初期化時の各タイル生成処理のイベント割合 タイルの見た目に影響するならここ 合計1になるように設定する
            enemy: 0.75,// 通常エネミー
            eliteEnemy: 0.10,// 強敵
            event: 0.07,// イベント
            adventurer: 0.01,// 冒険者遭遇イベント。戦ったり助けたり勧誘したり？
            rest: 0.07,// 休息マス
        },
        fixFloors: { 10: ["boss", "boss", "boss", "boss", "boss"] },// 1始まり。階層ごとの固定配置タイル。用途は、最終階層をすべてボスに上書きしたり任意の位置に固定イベントを設置したりなど。
        itemTableId: "lostForestShallow01",// 獲得アイテムテーブルID
        eventTableId: "lostForestShallow01",// イベントテーブルID
        encounterTableId: "lostForestShallow01",// モンスターグループの遭遇率テーブルID
        eliteEncounterTableId: "lostForestShallowElite01",// 精鋭グループの遭遇率テーブルID
        bossEncounterTableId: "lostForestShallowBoss01",// ボスグループの遭遇率テーブルID
    },
};
