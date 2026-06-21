// ゲームロジック・状態管理・メインループ

import { saveGame, loadGame, deleteSaveData } from './save.js';
import { MAPS, EVENT_TABLES, ITEM_TABLES, MONSTER_GROUPS, ENCOUNTER_TABLES } from './data/maps.js';
import { EVENTS } from './data/events.js';
import { ITEMS } from './data/items.js';
import { ENEMIES } from './data/enemies.js';
import { SKILLS } from './data/skills.js';
import { JOBS } from './data/jobs.js';
import { scheduleRender } from './render.js';
import { LABEL, SCREENS, SUB_SCREENS, BOTTOM_SHEETS, BOTTOM_MENU_TABS, BATTLE_STATUSES, DEBUFF_STATUS_MODIFIERS, SELECT_TARGET_TYPE, TARGET_TYPE_EXTRACTOR, isDead } from './const.js';

// ============================================================================
// 1. グローバル変数とDOM要素
// ============================================================================

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
 * @property {object | null} stat_modifier - 増減ステータス（例: { atk: +5, def: +2 }）
 * @property {"weapon" | "def" | "shield" | "accessory" | null} equip_type - 装備種別
 */

// ops["gte"](player.level, value)など
const ops = {
    gt:  (a, b) => a > b,
    gte: (a, b) => a >= b,
    lt:  (a, b) => a < b,
    lte: (a, b) => a <= b,
    eq:  (a, b) => a === b,
    neq: (a, b) => a !== b,
};

// 任意のミリ秒を止めるやつ
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Proxy用描画付きセット
const setAndRender = (target, prop, value) => {
    target[prop] = value;
    scheduleRender(); // 描画
    return true;
};

/**
 * unitの初期構造 使うときにProxy化してね
 * new Proxy(unit_base, {set: setAndRender})
 */
const unit_base = {        
    id: self.crypto.randomUUID(),
    name: "",
    level: 1,
    exp: 0,
    hp: 0,
    maxHp: 0,
    mp: 0,
    maxMp: 0,
    atk: 0,
    def: 0,
    spd: 0,
    int: 0,
    dex: 0,
    size: 0,
    multiAction: 1,
    race: RACES.human.id,
    currentJob: "warrior",// 例
    jobs: {
        // warrior: {// 例
        //     rank: 4,
        //     exp: 150
        // },
    },
    equipmentSlot: [],
    skillList: [ // スキル
        // getSkillById("thunder"),// 例
    ],
    battleStatus: [ // 状態異常
        // {// 例
        //     id: "weakness",
        //     turn: 3
        // },
    ],
};

export let player = new Proxy({
        day: 0,
        money: 0,
        item_slot: [],// 最大20
        party: [],// 最大4
        explore: { //proxyを剥がしているのはsaveできなくなるため dirtyで反映かな
            mapId: "lostForest",// 現在マップのid
            map: [[]],// マップ入場時のランダム生成タイルデータ保存
            floor: 10,// 現在位置の階層
            line: 5,// 現在位置の列
            phase: "actionExec",//[nodeExec｜clear｜lose]
            event: {
                eventId: "",// 
                node: "",// 現在どのノードを処理中か
                data: {},// ノードごとの必要データ&#26684;納
                phase: "",// waitingChoiceSelect｜exec｜complete
                choices: [],
            },
        },
        achievement: {// 活動実績
            mapClear: {},//id: {count, firstDay}
            defeatedMonsters: {},//id: {count, firstDay}
        }
    },
    {
        set: setAndRender
});

// ゲーム管理用Proxyオブジェクト
export const gameState = new Proxy({
        isDebugMode: true,//デバッグ時に直打ち
        // 強制描画用フラグ
        dirty: false,
        // ページ制御
        screen: null,
        subScreen: null,
        bottomSheet: null,
        bottomMenuTabId: BOTTOM_MENU_TABS.menuTabParty,
        bottomMenuPartyTabIndex: 0,
        bottomMenuPartyTabSubType: "status",
        selectExploreMap: null,
        // ヘッダー開閉
        isHudOpen: false,

        // // モーダル（currentPageと独立して重なる） 後で消す
        openModal: null,// null | "menu" | "item_discard",
        menuTab: "status",// "status" | "items" | "equipments",

        // 探索画面
        explore: new Proxy({
            phase: null,// 探索状態 "idle" | "rolling" | "event_resolve" | "choice"

        }, {set: setAndRender}),

        // 戦闘画面
        battle: new Proxy({
            party: [],// 味方キャラProxy配列
            enemies: [],// 敵キャラProxy配列
            turnOrder: [],// 行動順のparty+enemies
            turn: 0,// ターン数
            phase: null,// string画面制御用フラグ[start|turn_start|pending|command_waiting|exec|result]
            actor: null,// コマンド表示や行動実行用のキャラ保管
            actorStan: null,// 麻痺や睡眠などで行動できないフラグ
            pendingCommand: null,// ターゲット選択や行動実行用のコマンドオブジェクト
            result: {
            //   gold: 120,
            //   exp: 80,
            //   items: [ { name: "回復薬", isNew: true }, ... ],あてにならんよ
            //   levelUps: [ { name: "アレス", oldLv: 3, newLv: 4, statChanges: {maxHp: +10, atk: +2} } ],
            //   rankUps: [ { name: "アレス", oldRank: "D", newRank: "C" } ],
            },
        }, {set: setAndRender}),

        // ログ系
        combatLog: [],
        backLog: [],// {type, text}
    },
    {
        set: setAndRender
});

// DOM Elements
const titleScreen = document.getElementById(SCREENS.titleScreen);
const newGameButton = document.getElementById("new-game-button");
const loadGameButton = document.getElementById("load-game-button");

const characterCreationScreen = document.getElementById(SCREENS.characterCreationScreen);
const playerNameInput = document.getElementById("player-name");
const hpAllocationInput = document.getElementById("hp-allocation");
const mpAllocationInput = document.getElementById("mp-allocation");
const attackAllocationInput = document.getElementById("atk-allocation");
const remainingPointsSpan = document.getElementById("remaining-points");
const displayHpSpan = document.getElementById("display-hp");
const displayMpSpan = document.getElementById("display-mp");
const displayAttackSpan = document.getElementById("display-atk");
const speedAllocationInput = document.getElementById("spd-allocation");
const intelAllocationInput = document.getElementById("int-allocation");
const dexAllocationInput = document.getElementById("dex-allocation");
const sizeAllocationInput = document.getElementById("size-allocation");
const displaySpeedSpan = document.getElementById("display-spd");
const displayIntelSpan = document.getElementById("display-int");
const displayDexSpan = document.getElementById("display-dex");
const displaySizeSpan = document.getElementById("display-size");
const startAdventureButton = document.getElementById("start-adventure-button");

// メニュー
const baseHuds = document.querySelectorAll(".base-hud");
baseHuds.forEach(ele => {
    ele.addEventListener("click", async (e) => {
        const choice = e.target.closest('.menu-switch-btn');
        // メニューボタン以外ならステータス表示開閉
        if (!choice) {
            gameState.isHudOpen = gameState.isHudOpen ? false : true;
        } else {
            if (gameState.bottomSheet !== BOTTOM_SHEETS.menuOverlay) {
                openBottomSheet(BOTTOM_SHEETS.menuOverlay);
            } else {
                closeBottomSheet();
            }
        }
    });
});
// メニュー背景の閉じる制御
const menuOverlay = document.getElementById("menu-overlay");
menuOverlay.addEventListener("click", async (e) => {
    if (e.target.id !== BOTTOM_SHEETS.menuOverlay) {
        return;
    }
    closeBottomSheet();
});
// メニュータブ切り替え
const menuNavTabs = document.querySelectorAll(".menu-nav-tab");
menuNavTabs.forEach(ele => {
    ele.addEventListener("click", async (e) => {
        const choice = e.target.closest('.menu-nav-tab');
        await sleep(50);

        if (choice) {
            moveMenuTab(choice.dataset.tabId);
        }
    });
});
// メニュー：パーティーメンバータブ切り替え
const menuTabPartyMemberTabArea = document.getElementById("menu-tab-party-member-tab-area");
menuTabPartyMemberTabArea.addEventListener("click", async (e) => {
    const choice = e.target.closest('.menu-tab-party-member-tab');
    if (!choice || !choice.dataset.partyIndex) {
        return;
    }
    gameState.bottomMenuPartyTabIndex = parseInt(choice.dataset.partyIndex);
});
// メニュー：パーティーメンバータブ切り替え
const menuTabPartyMemberSubTabArea = document.getElementById("menu-tab-party-member-sub-tab-area");
menuTabPartyMemberSubTabArea.addEventListener("click", async (e) => {
    const choice = e.target.closest('.menu-tab-party-member-sub-tab');
    if (!choice || !choice.dataset.subType) {
        return;
    }
    gameState.bottomMenuPartyTabSubType = choice.dataset.subType;
});

// base
const baseBtnChangeJob = document.getElementById("base-btn-change-job");
baseBtnChangeJob.addEventListener("click", async () => {
    await sleep(100);
    player.party.forEach(unit => {
        const result = changeJob(unit, unit.currentJob === "warrior" ? "mage" : (unit.currentJob === "mage" ? "priest" : "warrior"));
        const job = JOBS[result.after];
        let message = "";
        if (result.success) {
            message += `デバッグ: ${unit.name} は ${job.name} に転職した！`;
            if (result.statChanges) {
                message += "ステータスアップ：" + Object.entries(result.statChanges)
                    .map(([k, v]) => `${k} +${v}`)
                    .join(' | ');
            }
            if (result.learnSkills) {
                message += "スキル習得：" + result.learnSkills.join(' | ');
            }
        } else {
            message += `条件を満たしていません`;
        }
        showToast(message, 5000);
    });
    saveGame(player);
});

const baseBtnMansion = document.getElementById("base-btn-mansion");
baseBtnMansion.addEventListener("click", () => {
    const partyCount = player.party.length;
    if (partyCount >= 4) {
        showToast("パーティーがいっぱいです。");
        return;
    }
    const unit = new Proxy(structuredClone(unit_base), {set: setAndRender});

    let jobId = "";
    if (partyCount === 3) {
        jobId = "warrior";
        unit.name = "センシ";
        unit.maxHp = 45;
        unit.maxMp = 0;
        unit.atk = 25;
        unit.def = 3;
        unit.spd = 2;
        unit.int = 3;
        unit.dex = 12;
        unit.size = 8;
    } else if (partyCount === 2) {
        jobId = "mage";
        unit.name = "マホウツカイ";
        unit.maxHp = 23;
        unit.maxMp = 30;
        unit.atk = 3;
        unit.def = 0;
        unit.spd = 3;
        unit.int = 18;
        unit.dex = 3;
        unit.size = 3;
    } else if (partyCount === 1) {
        jobId = "priest";
        unit.name = "ソウリョ";
        unit.maxHp = 28;
        unit.maxMp = 20;
        unit.atk = 1;
        unit.def = 0;
        unit.spd = 4;
        unit.int = 13;
        unit.dex = 3;
        unit.size = 3;
    }

    unit.id = self.crypto.randomUUID();
    unit.level = 1;
    unit.exp = 0;
    unit.hp = unit.maxHp;
    unit.mp = unit.maxMp;
    unit.multiAction = 1;
    unit.race = RACES.human.id;
    unit.currentJob = null;
    unit.jobs = {};
    unit.equipmentSlot = [];
    unit.skillList = [
        // getSkillById("wait-and-see"),
    ];
    unit.battleStatus = [];
    const result = changeJob(unit, jobId);
    if (!result.success) {
        throw new Error(`Unknown Error: Job change failed`);
    } else {
        showToast(`${unit.name} が加入しました！`, 5000);
    }
    player.party.push(unit);

    gameState.dirty = true;

    console.log("Player initialized:", player);
    saveGame(player);

});
const baseBtnSelectExploreMap = document.getElementById("base-btn-select-explore-map");
baseBtnSelectExploreMap.addEventListener("click", async () => {
    await sleep(100);
    showSelectExploreMap();
});
const baseSelectExploreMapGrid = document.getElementById("base-select-explore-map-grid");
baseSelectExploreMapGrid.addEventListener("click", async (e) => {
    const choice = e.target.closest('.base-btn');
    if (!choice) return;
    await sleep(100);
    onSelectExploreMap(choice.dataset.mapId);
});
const baseSelectExploreMapScreenBack = document.getElementById("base-select-explore-map-screen-back");
baseSelectExploreMapScreenBack.addEventListener("click", async () => {
    await sleep(100);
    backSubScreen();
});

const exploreTileGrid = document.getElementById("explore-tile-grid");
exploreTileGrid.addEventListener("click", async (e) => {
    const choice = e.target.closest('.base-btn');
    if (!choice || !choice.classList.contains("highlight")) return;
    await sleep(100);
    await onSelectExploreTile(parseInt(choice.dataset.floor), parseInt(choice.dataset.line));
});

const exploreClearBack = document.getElementById("explore-clear-back");
const exploreGameOverBack = document.getElementById("explore-game-over-back");
exploreClearBack.addEventListener("click", async (e) => {
    await sleep(100);
    const mapName = MAPS[player.explore.mapId].name;
    // 初クリアなら実績を追加
    if (!player.achievement.mapClear[player.explore.mapId]) {
        player.achievement.mapClear[player.explore.mapId] = {
            count: 1,
            firstDay: player.day
        };
    } else {
        player.achievement.mapClear[player.explore.mapId].count += 1;
    }
    player.explore = null;
    moveScreen(SCREENS.baseScreen);
    showToast(`${mapName}を制覇した！`);
});
exploreGameOverBack.addEventListener("click", async (e) => {
    await sleep(100);
    player.explore = null;
    moveScreen(SCREENS.baseScreen);
    showToast(`全滅した…`);
});

// 探索イベント選択肢ボタン
const exploreChoicesList = document.getElementById("explore-choices-list");
exploreChoicesList.addEventListener("click", async (e) => {
    const choice = e.target.closest('.explore-choice-btn');
    if (!choice || choice.classList.contains("disable")) return;

    // いったん1回選択で実行にしとく
    await sleep(100);
    player.explore.event.data.unitId = choice.dataset.unitId ?? null;

    await resolveEventNode(choice.dataset.next);
    return;

    // 単一選択肢か2回選択で実行
    if (player.explore.event.choices.length === 1 || player.explore.event.choice === choice.dataset.next) {
        await sleep(100);
        player.explore.event.data.unitId = choice.dataset?.unitId ?? null;
        await resolveEventNode(choice.dataset.next);
        return;
    }
    player.explore.event.choice = choice.dataset.next;
});


const battleMessage = document.getElementById("battle-message");
const alertPanel = document.getElementById("alert-panel");
const commandPanel = document.getElementById("command-panel");
const itemPanel = document.getElementById("item-panel");
const skillPanel = document.getElementById("skill-panel");
const targetPanel = document.getElementById("target-panel");
const battleEndButton = document.getElementById("battle-end");

// Debug Elements
const debugPanel = document.getElementById("debug-panel");
const debugPanelToggle = document.getElementById("debug-panel-toggle");
const debugPanelContent = document.getElementById("debug-panel-content");
const debugToggleIcon = document.getElementById("debug-toggle-icon");
const debugEventCategorySelect = document.getElementById("debug-event-category-select");
const debugEventIndexSelect = document.getElementById("debug-event-index-select");
const debugTriggerEventButton = document.getElementById("debug-trigger-event");
const debugEnemySelect = document.getElementById("debug-enemy-select");
const debugItemSelect = document.getElementById("debug-item-select");
const debugAcquireItemButton = document.getElementById("debug-acquire-item-button");
const debugJobUnitSelect = document.getElementById("debug-job-unit-select");
const debugJobSelect = document.getElementById("debug-job-select");
const debugChangeJobButton = document.getElementById("debug-change-job-button");
const debugAddExpInput = document.getElementById("debug-add-exp-input");
const debugAddExpButton = document.getElementById("debug-add-exp-button");
const debugAddRankExpInput = document.getElementById("debug-add-rank-exp-input");
const debugAddRankExpButton = document.getElementById("debug-add-rank-exp-button");
const debugBackLogButton = document.getElementById("debug-back-log-button");
const debugGameStateButton = document.getElementById("debug-game-state-button");

/**
 * デバッグ: 指定したイベントを強制的に発生させる
 * @param {string} eventCategory - イベントのカテゴリ (例: "NORMAL", "BENEFIT", "DANGER", "MILESTONE")
 * @param {number} eventIndex - カテゴリ内のイベントのインデックス
 */
function debugTriggerEvent(eventCategory, eventIndex) {
    let eventData = null;

}

/**
 * デバッグ: アイテム選択ドロップダウンを初期化する
 */
function populateDebugItemSelect() {
    debugItemSelect.innerHTML = ''; // Clear existing options
    ITEMS.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `${item.name} (${item.id})`;
        debugItemSelect.appendChild(option);
    });
}

/**
 * デバッグ: 職業選択ドロップダウンを初期化する
 */
function populateDebugJobSelect() {
    debugJobSelect.innerHTML = ''; // Clear existing options
    for (const job_id in JOBS) {
        const job = JOBS[job_id];
        const option = document.createElement("option");
        option.value = job.id;
        option.textContent = `${job.name} (${job.id})`;
        debugJobSelect.appendChild(option);
    }
    debugJobUnitSelect.innerHTML = ''; // Clear existing options
    player.party.forEach(unit => {
        const option = document.createElement("option");
        option.value = unit.id;
        option.textContent = `${unit.name}`;
        debugJobUnitSelect.appendChild(option);
    });
}
populateDebugItemSelect();
populateDebugJobSelect();
/**
 * デバッグ: 選択されたアイテムをプレイヤーに付与する
 */
async function debugAcquireItem() {
    const selectedItemId = debugItemSelect.value;
    if (selectedItemId) {
        const itemToGive = getItemById(selectedItemId);
        if (itemToGive) {
            await acquireItem(itemToGive);
            addMessage(`デバッグ: ${itemToGive.name} を取得しました！`, false);
            saveGame(player); // アイテム取得後にセーブ
        } else {
            addMessage("デバッグ: 指定されたアイテムが見つかりませんでした。", false);
        }
    } else {
        addMessage("デバッグ: アイテムを選択してください。", false);
    }
}

/**
 * デバッグ: 選択されたユニットを転職させる
 */
async function debugChangeJob() {
    const job_id = debugJobSelect.value;
    const job = JOBS[job_id];
    if (!job_id || !job) {
        addMessage("デバッグ: 職業を選択してください。", false);
        return;
    }
    const unit_id = debugJobUnitSelect.value;
    const unit = getPartyUnitById(unit_id);
    if (!unit_id || !unit) {
        addMessage("デバッグ: ユニットを選択してください。", false);
        return;
    }

    const result = changeJob(unit, job_id);
    if (result.success) {
        addMessage(`デバッグ: ${unit.name} は ${job.name} に転職した！`, false);
        if (result.statChanges) {
            addMessage("ステータスアップ：" + Object.entries(result.statChanges)
                .map(([k, v]) => `${k} +${v}`)
                .join(' | '));
        }
        if (result.learnSkills) {
            addMessage("スキル習得：" + result.learnSkills.join(' | '));
        }
    } else {
        addMessage(`条件を満たしていません`);
    }
    saveGame(player);
}

/**
 * デバッグ: パーティー全員に経験値を加算
 */
function debugAddExp() {
    const exp = debugAddExpInput.value;

    const result = []
    for (const unit of player.party) {
        const ret = addExp(unit, parseInt(exp));
        if (ret) {
            result.push(ret);
        }
    }

    saveGame(player);
    console.log(result);
    showToast(JSON.stringify(result), 10000);
}

/**
 * デバッグ: パーティー全員にランク経験値を加算
 */
function debugAddRankExp() {
    const exp = debugAddRankExpInput.value;

    const result = []
    for (const unit of player.party) {
        const ret = addRankExp(unit, parseInt(exp));
        if (ret) {
            result.push(ret);
        }
    }

    saveGame(player);
    console.log(result);
    showToast(JSON.stringify(result), 10000);
}

const debugStartCombatButton = document.getElementById("debug-start-combat");
const backToTitleFromClearButton = document.getElementById("back-to-title-from-clear");

// ============================================================================
// 2. 画面管理
// ============================================================================

/**
 * スクリーンを移動する
 * @param {string} screenId 
 * @param {string} subScreenId
 */
function moveScreen(screenId, subScreenId = null) {
    if (!SCREENS[screenId.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())]) {
        throw new Error(`Unknown screen: ${screenId}`);
    }
    if (subScreenId !== null && !SUB_SCREENS[subScreenId.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())]) {
        throw new Error(`Unknown screen: ${subScreenId}`);
    }
    // 別画面から拠点への帰還なら全回復
    if (player.screen !== screenId && screenId === SCREENS.baseScreen) {
        systemHealAll();
    }
    gameState.isHudOpen = false;// hudを閉じる
    gameState.bottomSheet = null;// ボトムシートを閉じる
    gameState.screen = screenId;
    gameState.subScreen = subScreenId ?? screenId;
}

/**
 * サブスクリーンからメインスクリーンに戻る
 */
function backSubScreen() {
    gameState.subScreen = null;
    moveScreen(gameState.screen);
}

/**
 * ボトムシートを開く
 */
function openBottomSheet(bottomSheetId) {
    if (!BOTTOM_SHEETS[bottomSheetId.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())]) {
        throw new Error(`Unknown bottom sheet: ${bottomSheetId}`);
    }
    gameState.bottomSheet = bottomSheetId;
}

/**
 * ボトムシートを閉じる
 */
function closeBottomSheet() {
    gameState.bottomSheet = null;
}

/**
 * メニュータブの移動
 */
function moveMenuTab(bottomMenuTabId) {
    if (!BOTTOM_MENU_TABS[bottomMenuTabId.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())]) {
        throw new Error(`Unknown bottom menu tab: ${bottomMenuTabId}`);
    }
    gameState.bottomMenuTabId = bottomMenuTabId;
}


/**
 * タイトル画面を表示する
 */
function showTitleScreen() {
    moveScreen(SCREENS.titleScreen);
    const savedData = loadGame();

    // ボタンを初期状態に戻す
    loadGameButton.classList.add("hidden");

    if (savedData) {
        // セーブデータが存在する場合
        loadGameButton.classList.remove("hidden");
    }
}

/**
 * キャラクター作成画面を表示する
 */
function showCharacterCreationScreen() {
    moveScreen(SCREENS.characterCreationScreen);

    // 初期値を設定
    playerNameInput.value = "";
    hpAllocationInput.value = 10;
    mpAllocationInput.value = 5;
    attackAllocationInput.value = 10;
    speedAllocationInput.value = 5;
    intelAllocationInput.value = 3;
    dexAllocationInput.value = 3;
    sizeAllocationInput.value = 3;
    updateAllocationDisplay();
}

/**
 * 探索マップ選択画面を表示する
 */
function showSelectExploreMap() {
    gameState.selectExploreMap = new Proxy({}, {set: setAndRender});
    const unlockMaps = [];
    for (const mapId in MAPS) {
        const map = MAPS[mapId];
        if (map.condition) {
            const isDisabled = checkMapCondition(map.condition);
            if (isDisabled) {
                continue;
            }
        }
        unlockMaps.push(map);
    }
    gameState.selectExploreMap.mapList = unlockMaps;
    moveScreen(SCREENS.baseScreen, SUB_SCREENS.baseSelectExploreMapScreen);
}

/**
 * 探索マップ選択イベントハンドラ
 */
function onSelectExploreMap(mapId) {
    if (!MAPS[mapId]) {
        throw new Error(`Unknown map: ${mapId}`);
    }
    gameState.selectExploreMap.mapId = mapId;
    // TODO: 本当は選択マップの詳細を出すけどいったんそのまま出発
    startExplore();
}

/**
 * 探索マップ選択却下イベントハンドラ
 */
function onSelectCancelExploreMap(e) {
    gameState.selectExploreMap.mapId = null;
}

/**
 * 探索マップ出発
 */
function startExplore() {
    const mapId = gameState.selectExploreMap.mapId;
    player.day += 1;// TODO: マップの遠さとか作ってもいいかもね
    player.explore = {}
    player.explore.phase = "init";
    player.explore.mapId = mapId;
    player.explore.map = generateMapData(MAPS[mapId])
    player.explore.floor = -1;// データ的には配列のインデックスに合わせる　描画が頑張れ
    player.explore.line = Math.floor(MAPS[mapId].tileCount / 2);
    moveScreen(SCREENS.exploreScreen);
    player.explore.phase = "waitingTileSelect";
    saveGame(player);
}

/**
 * イベントタイル選択ハンドラ
 */
async function onSelectExploreTile(floor, line) {
    player.explore.phase = "tileSelect";
    player.explore.event = {};
    const eventId = getEventForType(player.explore.mapId, player.explore.map[floor][line])
    player.explore.floor = floor;
    player.explore.line = line;
    player.explore.event.eventId = eventId;
    moveScreen(SCREENS.exploreScreen, SUB_SCREENS.exploreEventScreen);//tileselectanime ありなら待つ
    await resolveEventNode(EVENTS[player.explore.event.eventId]["start"]) 
}

/**
 * イベントタイプ取得
 */
function getEventForType(mapId, type) {
    switch (type) {
        case "enemy": return "battle";
        case "eliteEnemy": return "eliteEnemy";
        case "boss": return "boss";
        case "event": {
            return weightedRandom(EVENT_TABLES[MAPS[mapId].eventTableId]);
        }
        case "adventurer": return "adventurer";
        case "rest": return "rest";
    }
}

/**
 * イベントノード実行
 */
async function resolveEventNode(nodeId) {
    const mapDef = MAPS[player.explore.mapId];
    const node = EVENTS[player.explore.event.eventId].nodes[nodeId];
    player.explore.event.node = node;
    player.explore.event.phase = "init";
    player.explore.event.choices = null;
    player.explore.event.choice = null;
    player.explore.event.beforeData = player.explore.event.data ?? {};
    player.explore.event.data = {message: []};

    // 単体対象のノードは対象選択を実施
    if (node.data?.targetType === "single" && !player.explore.event.beforeData.unitId) {
        player.explore.event.choices = [];
        for (const unit of player.party) {
            player.explore.event.choices.push({
                text: `${unit.name}`,
                desc: `Lv${unit.level} HP ${unit.hp}/${unit.maxHp} MP ${unit.mp}/${unit.maxMp}`,
                next: nodeId,
                unitId: unit.id,
                // TODO: 配列化とか判定メソッド化とかして
                disabled: node.data.targetTerm === "alive" && isDead(unit)
            });
        }
        player.explore.phase = "waitingChoiceSelect";
        gameState.dirty = true;
        return;
    }

    let next = null;
    switch (node.type) {
        case "battle": {
            const monsterGroupId = node.fixGroup ?? weightedRandom(ENCOUNTER_TABLES[mapDef.encounterTableId]);
            player.explore.event.data.enemyIds = MONSTER_GROUPS[monsterGroupId];
            player.explore.event.data.winNode = node.win;
            player.explore.event.data.loseNode = node.lose;
            player.explore.phase = "battle"
            await battleInit(player.explore.event.data.enemyIds.map(id => getEnemyById(id)));
            break;
        } case "eliteEnemy": {
            const monsterGroupId = node.fixGroup ?? weightedRandom(ENCOUNTER_TABLES[mapDef.eliteEncounterTableId]);
            player.explore.event.data.enemyIds = MONSTER_GROUPS[monsterGroupId];
            player.explore.event.data.winNode = node.win;
            player.explore.event.data.loseNode = node.lose;
            player.explore.phase = "battle"
            await battleInit(player.explore.event.data.enemyIds.map(id => getEnemyById(id)));
            break;
        } case "boss": {
            const monsterGroupId = node.fixGroup ?? weightedRandom(ENCOUNTER_TABLES[mapDef.bossEncounterTableId]);
            player.explore.event.data.enemyIds = MONSTER_GROUPS[monsterGroupId];
            player.explore.event.data.winNode = node.win;
            player.explore.event.data.loseNode = node.lose;
            player.explore.phase = "battle"
            await battleInit(player.explore.event.data.enemyIds.map(id => getEnemyById(id)));
            break;
        } case "adventurer": {
        //     // TODO: 実装
        //     player.explore.event = {};
        //     player.explore.phase = "waitingTileSelect";
        //     moveScreen(SCREENS.exploreScreen);
        //     battleInit(player.explore.event.data.enemyIds.map(id => getEnemyById(id)));

            next = "end";
            break;
        } case "choice": {
            // TODO: 条件判定して有効でないものにはdisabled付与
            player.explore.event.choices = node.choices.map(choice => {
                choice.disabled = choice.condition ? checkChoiceCondition(choice.condition) : false;
                return choice;
            });
            player.explore.phase = "waitingChoiceSelect";
            break;
        } case "lottery": {
            // player.explore.event.data.message = player.explore.event.beforeData?.message ?? [];
            next = weightedRandom(node.data);
            break;
        } case "message": {
            player.explore.event.choices = node.choices;
            player.explore.phase = "waitingChoiceSelect";
            break;
        } case "heal": {
            player.explore.event.data.message = player.explore.event.beforeData?.message ?? [];
            const unitIds = player.explore.event.beforeData.unitId
                ? [player.explore.event.beforeData.unitId]
                : player.party.map(unit => unit.id);
            for (const unitId of unitIds) {
                const unit = getPartyUnitById(unitId);
                let heal = 0;
                heal += node.data.fix ? node.data.fix : getRandom(node.data.min, node.data.max);
                if (node.data.ref) {
                    heal += Math.floor(unit[node.data.ref] * (node.data.rate / 100));
                }
                if (unit.maxHp !== unit.hp && heal > 0) {
                    player.explore.event.data.message.push(`${unit.name}のHPが${heal}回復した。`);
                }
                unit.hp = Math.min(unit.maxHp, unit.hp + heal);
            }
            next = node.next;
            break;
        } case "mpHeal": {
            player.explore.event.data.message = player.explore.event.beforeData?.message ?? [];
            const unitIds = player.explore.event.beforeData.unitId
                ? [player.explore.event.beforeData.unitId]
                : player.party.map(unit => unit.id);
            for (const unitId of unitIds) {
                const unit = getPartyUnitById(unitId);
                let heal = 0;
                heal += node.data.fix ? node.data.fix : getRandom(node.data.min, node.data.max);
                if (node.data.ref) {
                    heal += Math.floor(unit[node.data.ref] * (node.data.rate / 100));
                }
                if (unit.maxMp !== unit.mp && heal > 0) {
                    player.explore.event.data.message.push(`${unit.name}のMPが${heal}回復した。`);
                }
                unit.mp = Math.min(unit.maxMp, unit.mp + heal);
            }
            next = node.next;
            break;
        } case "damage": {
            player.explore.event.data.message = player.explore.event.beforeData?.message ?? [];
            const unitIds = player.explore.event.beforeData.unitId
                ? [player.explore.event.beforeData.unitId]
                : player.party.map(unit => unit.id);
            for (const unitId of unitIds) {
                const unit = getPartyUnitById(unitId);
                let damage = 0;
                damage += node.data.fix ? node.data.fix : getRandom(node.data.min, node.data.max);
                if (node.data.ref) {
                    damage += Math.floor(unit[node.data.ref] * (node.data.rate / 100));
                }
                player.explore.event.data.message.push(`${unit.name}は${damage}のダメージを受けた。`);
                unit.hp = Math.max(0, unit.hp - damage);
            }
            next = node.next;
            break;
        } case "mpDamage": {
            player.explore.event.data.message = player.explore.event.beforeData?.message ?? [];
            const unitIds = player.explore.event.beforeData.unitId
                ? [player.explore.event.beforeData.unitId]
                : player.party.map(unit => unit.id);
            for (const unitId of unitIds) {
                const unit = getPartyUnitById(unitId);
                let damage = 0;
                damage += node.data.fix ? node.data.fix : getRandom(node.data.min, node.data.max);
                if (node.data.ref) {
                    damage += Math.floor(unit[node.data.ref] * (node.data.rate / 100));
                }
                player.explore.event.data.message.push(`${unit.name}のMPは${heal}減った。`);
                unit.mp = Math.max(0, unit.mp - damage);
            }
            next = node.next;
            break;
        } case "statusMod": {
            player.explore.event.data.message = player.explore.event.beforeData?.message ?? [];
            const unitIds = player.explore.event.beforeData.unitId
                ? [player.explore.event.beforeData.unitId]
                : player.party.map(unit => unit.id);
            for (const unitId of unitIds) {
                const unit = getPartyUnitById(unitId);
                let point = 0;
                point += node.data.fix ? node.data.fix : getRandom(node.data.min, node.data.max);
                if (node.data.ref) {
                    point += Math.floor(unit[node.data.ref] * (node.data.rate / 100));
                }
                player.explore.event.data.message.push(`${unit.name}の${LABEL[node.data.key]}が${point}${point < 0 ? "下がった。" : "上がった。"}`);
                unit[node.data.key] = Math.max(0, unit[node.data.key] + point);
            }
            next = node.next;
            break;
        } case "getExp": {
            player.explore.event.data.message = player.explore.event.beforeData?.message ?? [];
            const unitIds = player.explore.event.beforeData.unitId
                ? [player.explore.event.beforeData.unitId]
                : player.party.map(unit => unit.id);
            for (const unitId of unitIds) {
                const unit = getPartyUnitById(unitId);
                let point = 0;
                point += node.data.fix ? node.data.fix : getRandom(node.data.min, node.data.max);
                if (node.data.ref) {
                    point += Math.floor(unit[node.data.ref] * (node.data.rate / 100));
                }
                const mod_levels = addExp(unit, point);
                if (mod_levels) {
                    // TODO: レベルアップウィンドウを出してもいいかもね
                    player.explore.event.data.message.push(`${JSON.stringify(mod_levels)}`);
                }
            }
            next = node.next;
            break;
        } case "getRankExp": {
            player.explore.event.data.message = player.explore.event.beforeData?.message ?? [];
            const unitIds = player.explore.event.beforeData.unitId
                ? [player.explore.event.beforeData.unitId]
                : player.party.map(unit => unit.id);
            for (const unitId of unitIds) {
                const unit = getPartyUnitById(unitId);
                let point = 0;
                point += node.data.fix ? node.data.fix : getRandom(node.data.min, node.data.max);
                if (node.data.ref) {
                    point += Math.floor(unit[node.data.ref] * (node.data.rate / 100));
                }
                const modRanks = addRankExp(unit, point);
                if (modRanks) {
                    // TODO: ランクアップウィンドウを出してもいいかもね
                    player.explore.event.data.message.push(`${JSON.stringify(modRanks)}`);
                }
            }
            next = node.next;
            break;
        } case "getItem": {
            player.explore.event.data.message = player.explore.event.beforeData?.message ?? [];
            for (let i = 0; i < node.data.count; i++){
                const itemId = node.data.id ?? weightedRandom(ITEM_TABLES[mapDef.itemTableId]);
                const item = getItemById(itemId);
                await acquireItem(item);
                player.explore.event.data.message.push(`${item.name}を手に入れた！`);
            }
            next = node.next;
            break;
        } case "end": {
            player.explore.event = {};
            player.explore.phase = "waitingTileSelect";
            moveScreen(SCREENS.exploreScreen);
            break;
        } case "gameOver": {
            player.explore.event = {};
            player.explore.phase = "gameOver";
            moveScreen(SCREENS.exploreScreen, SUB_SCREENS.exploreGameOverScreen);
            break;
        } case "clear": {
            player.explore.event = {};
            player.explore.phase = "clear";
            moveScreen(SCREENS.exploreScreen, SUB_SCREENS.exploreClearScreen);
            break;
        } default: {
            throw new Error(`Unknown Node Type: ${node.type}`);
        }
    }
    gameState.dirty = true;
    saveGame(player);
    if (next) {
        await resolveEventNode(next);
    }
}

/**
 * 選択肢のconditionsをチェックしdisabledかを返す
 * @param {*} condition
 * @return {boolean}
 */
function checkChoiceCondition(condition) {
    let isDisabled = false;
    for (const key in condition) {
        const obj = condition[key];
        const op = Object.keys(obj)[0];
        const value = obj[op];
        switch (key) {
            case "partyCount": {
                isDisabled = !ops[op](player.party.length, value);
                break;
            } case "level": {
                isDisabled = !player.party.some(unit => ops[op](unit.level, value));
                break;
            } default: {
                throw new Error(`Unknown condition key: ${key}`);
            }
        }
        if (isDisabled) {
            return true;
        }
    }
    return false
}

/**
 * mapのconditionsをチェックしdisabledかを返す
 * @param {*} condition
 * @return {boolean}
 */
function checkMapCondition(condition) {
    let isDisabled = false;
    for (const key in condition) {
        const obj = condition[key];
        const op = Object.keys(obj)[0];
        const value = obj[op];
        switch (key) {
            case "mapClear": {
                for (const mapId in value) {
                    isDisabled = !ops[op](player.achievement.mapClear[mapId]?.count ?? 0, value[mapId])
                }
                break;
            } default: {
                throw new Error(`Unknown condition key: ${key}`);
            }
        }
        if (isDisabled) {
            return true;
        }
    }
    return false
}

/**
 * 各種ルールオブジェクト{キー:重み}からランダムにキーを取り出す
 * @param rules
 * @returns {string}
 */
function weightedRandom(rules) {
    let total = 0;
    for (const key in rules) {
        total += rules[key];
    }
    let r = Math.random() * total;
    for (const key in rules) {
        r -= rules[key];
        if (r < 0) {
            return key;
        }
    }
}

/**
 * マップ定義からマップタイルデータを生成する
 * @param mapDef
 * @returns {(string)[][]}
 */
function generateMapData(mapDef) {
    const mapData = Array.from(
        { length: mapDef.floorCount },
        () => Array.from({ length: mapDef.tileCount }, () => weightedRandom(mapDef.tileGenRules))
    );
    // 固定タイルを追加
    for (const [rowIndex, values] of Object.entries(mapDef.fixFloors)) {
        const row = Number(rowIndex) - 1; // 1始まりなら -1
        values.forEach((value, col) => {
            if (value !== null) {
                mapData[row][col] = value;
            }
        });
    }
    return mapData;
}

// ============================================================================
// 3. プレイヤーキャラクター作成
// ============================================================================
/**
 * 能力値配分の表示を更新する
 */
function updateAllocationDisplay() {
    const hpPts = parseInt(hpAllocationInput.value);
    const mpPts = parseInt(mpAllocationInput.value);
    const atkPts = parseInt(attackAllocationInput.value);
    const speedVal = parseInt(speedAllocationInput.value);
    const intelVal = parseInt(intelAllocationInput.value);
    const dexVal = parseInt(dexAllocationInput.value);
    const sizeVal = parseInt(sizeAllocationInput.value);

    const remaining = 49 - hpPts - mpPts - atkPts - speedVal - intelVal - dexVal - sizeVal;

    remainingPointsSpan.textContent = remaining;
    displayHpSpan.textContent = `HP: ${hpPts * 2}`;
    displayMpSpan.textContent = `MP: ${mpPts * 2}`;
    displayAttackSpan.textContent = `攻撃: ${atkPts}`;
    displaySpeedSpan.textContent = `速度: ${speedVal}`;
    displayIntelSpan.textContent = `知能: ${intelVal}`;
    displayDexSpan.textContent = `器用: ${dexVal}`;
    displaySizeSpan.textContent = `体格: ${sizeVal}`;

    // ポイントがマイナスになったり能力が最低値を下回ったらボタンを無効化
    if (remaining < 0 || hpPts < 1 || mpPts < 0 || atkPts < 1 || speedVal < 1 || intelVal < 1 || dexVal < 1 || sizeVal < 1) {
        startAdventureButton.disabled = true;
    } else {
        startAdventureButton.disabled = false;
    }
}

document.querySelectorAll('.character-creation-stat-plus').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        input.value = Number(input.value) + 1;
        updateAllocationDisplay();
    });
});

document.querySelectorAll('.character-creation-stat-minus').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.nextElementSibling;
        const min = Number(input.min || 0);

        if (Number(input.value) > min) {
            input.value = Number(input.value) - 1;
            updateAllocationDisplay();
        }
    });
});

/**
 * プレイヤーオブジェクトを初期化する
 */
function initializePlayer() {
    const unit = new Proxy(structuredClone(unit_base), {set: setAndRender});
    unit.name = playerNameInput.value || "名もなき探訪者";

    const hpPts = parseInt(hpAllocationInput.value);
    const mpPts = parseInt(mpAllocationInput.value);
    const atkPts = parseInt(attackAllocationInput.value);
    unit.maxHp = hpPts * 2;
    unit.maxMp = mpPts * 2;
    unit.atk = atkPts;
    unit.def = 0;
    unit.spd = parseInt(speedAllocationInput.value);
    unit.int = parseInt(intelAllocationInput.value);
    unit.dex = parseInt(dexAllocationInput.value);
    unit.size = parseInt(sizeAllocationInput.value);

    unit.id = self.crypto.randomUUID();
    unit.level = 1;
    unit.exp = 0;
    unit.hp = unit.maxHp;
    unit.mp = unit.maxMp;
    unit.multiAction = 1;
    unit.race = RACES.human.id;
    unit.currentJob = null;
    unit.jobs = {};
    unit.equipmentSlot = [];
    unit.skillList = [
        // getSkillById("wait-and-see"),
    ];
    unit.battleStatus = [];
    const result = changeJob(unit, "warrior");
    if (!result.success) {
        throw new Error(`Unknown Error: Job change failed`);
    }
    player.party[0] = unit;

    gameState.dirty = true;

    console.log("Player initialized:", player);
    saveGame(player);
}

/**
 * キャラのステータスを計算して返す。getter代替
 * @param {Object} chara 
 * @param {string} property 
 * @returns 
 */
function getStatus(chara, property) {
    const base = chara[property];
    if (!chara.statusEffects || chara.statusEffects.length === 0) {
        return base
    };

    let multiplier = 1.0;
    let flat = 0;

    for (const effect of chara.statusEffects) {
        const mod = DEBUFF_STATUS_MODIFIERS[effect.type]?.[property];
        if (!mod) continue;
        if (mod.rate)  multiplier += mod.rate; // 例: -0.2で20%減
        if (mod.flat)  flat += mod.flat;
    }

    return Math.max(0, Math.floor(base * multiplier) + flat);
}

/**
 * アイテムをプレイヤーのアイテムスロットに追加する。
 * アイテムスロットが満杯の場合、プレイヤーに選択肢を提示する。
 * @param {Item} item - 取得しようとしているアイテムオブジェクト
 * @returns {Promise<boolean>} アイテムが正常に取得された場合はtrue、諦めた場合はfalseを返すPromise
 */
async function acquireItem(item) {
    if (player.item_slot.length < 50) {
        item.uuid = self.crypto.randomUUID();
        player.item_slot.push(item);
        // showToast(`${item.name} を手に入れた！`);
        return true;
    } else {
        // showToast(`持ち物がいっぱいだ！`);
    }
}

/**
 * アイテム破棄モーダルを開き、プレイヤーのアイテムを表示する。
 * プレイヤーがアイテムを破棄するか、キャンセルするまで待機する。
 * @returns {Promise<boolean>} アイテムが破棄された場合はtrue、キャンセルされた場合はfalseを返すPromise
 */
function openDiscardItemModal() {
    return new Promise(resolve => {
        discardItemList.innerHTML = ''; // リストをクリア
        selectedItemToDiscardIndex = -1; // 選択状態をリセット
        discardSelectedItemButton.disabled = true; // ボタンを無効化

        if (player.item_slot.length === 0) {
            discardItemList.innerHTML = '<p>所持アイテムがありません。</p>';
            // アイテムがない場合は破棄できないので、自動的にキャンセル扱い
            addMessage("破棄できるアイテムがありません。アイテムの取得を諦めます。");
            discardItemModal.classList.add("hidden");
            resolve(false);
            return;
        }

        player.item_slot.forEach((item, index) => {
            const listItem = document.createElement("li");
            listItem.textContent = `${item.name}`;// - ${item.description}
            listItem.dataset.index = index;
            listItem.addEventListener("click", () => {
                // 選択状態を切り替える
                if (selectedItemToDiscardIndex === index) {
                    selectedItemToDiscardIndex = -1;
                    listItem.classList.remove("selected");
                } else {
                    // 他の選択を解除
                    const previouslySelected = discardItemList.querySelector(".selected");
                    if (previouslySelected) {
                        previouslySelected.classList.remove("selected");
                    }
                    selectedItemToDiscardIndex = index;
                    listItem.classList.add("selected");
                }
                discardSelectedItemButton.disabled = selectedItemToDiscardIndex === -1;
            });
            discardItemList.appendChild(listItem);
        });

        discardItemModal.classList.remove("hidden");
        document.body.style.overflow = "hidden"; // 背景のスクロールを禁止

        // 閉じるボタンのイベントリスナー (モーダルを閉じてキャンセル)
        const closeHandler = () => {
            discardItemModal.classList.add("hidden");
            document.body.style.overflow = "auto";
            discardCloseButton.removeEventListener("click", closeHandler);
            discardSelectedItemButton.removeEventListener("click", discardHandler);
            resolve(false); // キャンセル
        };
        discardCloseButton.addEventListener("click", closeHandler);

        // 破棄ボタンのイベントリスナー
        const discardHandler = () => {
            if (selectedItemToDiscardIndex !== -1) {
                const discardedItem = player.item_slot.splice(selectedItemToDiscardIndex, 1)[0];
                addMessage(`${discardedItem.name} を捨てました。`);
                discardItemModal.classList.add("hidden");
                document.body.style.overflow = "auto";
                saveGame(player);
                discardCloseButton.removeEventListener("click", closeHandler);
                discardSelectedItemButton.removeEventListener("click", discardHandler);
                resolve(true); // 破棄成功
            }
        };
        discardSelectedItemButton.addEventListener("click", discardHandler);
    });
}

/**
 * 転職
 * @param {Object} unit 
 * @param {string} job_id 
 * @returns 
 */
function changeJob(unit, job_id) {
    const jobData = JOBS[job_id];
    if (!jobData) {
        throw new Error(`Unknown job: ${job_id}`);
    }

    unit.currentJob = job_id;
    let mod_ranks = {};
    const beforeJob = unit.currentJob;

    // 未経験職なら転職条件チェック
    if (!unit.jobs[job_id]) {
        for (const condition of jobData.unlockConditions) {
            if (!checkJobCondition(unit, condition)) {
                return {
                    success: false,
                    reason: "requirements",
                };
            }
        }

        // ランク0で追加してランクアップ判定を行い、ランク1のボーナスを反映
        unit.jobs[job_id] = {
            rank: 0,
            exp: 0,
        };
        mod_ranks = addRankExp(unit, 0);
    }

    return {
        success: true,
        before: beforeJob,
        after: job_id,
        rank: unit.jobs[job_id].rank,
        statChanges: mod_ranks.statChanges ?? null,
        learnSkills: mod_ranks.learnSkills ?? null,
    };
}

/**
 * 初回転職条件をチェック
 * @param {Object} unit 
 * @param {Object} condition 
 */
function checkJobCondition(unit, condition) {
    // TODO: その他の条件に対応
    if (condition.type === "level") {
        return unit.level >= condition.value 
    }
}

// パーティーメンバーの全回復処理
function systemHealAll(isHpMpHeal = true) {
    for (const unit of player.party) {
        if (isHpMpHeal) {
            unit.hp = unit.maxHp;
            unit.mp = unit.maxMp;
        }
        unit.battleStatus = unit.battleStatus.filter(status => false);
    }
}

// ============================================================================
// 4. UI更新関数
// ============================================================================
/**
 * ゲームメッセージをテキストエリアに表示する
 * TODO: いったんbattleにも追加している。のちのち分離。ログ管理
 * @param {string} message - 表示するメッセージ
 * @param {boolean} append - trueの場合、既存のメッセージに追加する
 */
function addMessage(message, append = true) {
    // ログを退避する
    if (!append) {
        gameState.backLog.push(
            ...(gameState.combatLog.map(text => ({type: "explore", text})))
        );
        gameState.combatLog = [];
    }

    gameState.combatLog.push(message);
    gameState.dirty = true;
}

/**
 * デバッグ用の敵選択ドロップダウンを生成する
 */
function populateDebugEnemySelect() {
    debugEnemySelect.innerHTML = '';

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "-- 敵を選択 --";
    debugEnemySelect.appendChild(defaultOption);

    ENEMIES.forEach(enemy => {
        const option = document.createElement("option");
        option.value = enemy.id;
        option.textContent = `${enemy.name} (HP:${enemy.maxHp} (MP:${enemy.maxMp} ATK:${enemy.atk} ARM:${enemy.def} SPD:${enemy.spd})`;
        debugEnemySelect.appendChild(option);
    });
}

/**
 * デバッグ用のイベントカテゴリとインデックス選択ドロップダウンを生成する
 */
function populateDebugEventSelects() {
    // // カテゴリ選択の初期化
    // debugEventCategorySelect.innerHTML = '';
    // const categories = ["-- カテゴリを選択 --", "NORMAL", "BENEFIT", "DANGER", "MILESTONE"];
    // categories.forEach(category => {
    //     const option = document.createElement("option");
    //     option.value = category === "-- カテゴリを選択 --" ? "" : category;
    //     option.textContent = category;
    //     debugEventCategorySelect.appendChild(option);
    // });

    // // インデックス選択の初期化
    // debugEventIndexSelect.innerHTML = '';
    // const defaultIndexOption = document.createElement("option");
    // defaultIndexOption.value = "";
    // defaultIndexOption.textContent = "-- イベントを選択 --";
    // debugEventIndexSelect.appendChild(defaultIndexOption);

    // // カテゴリ選択が変更されたときのイベントリスナー
    // debugEventCategorySelect.addEventListener("change", () => {
    //     const selectedCategory = debugEventCategorySelect.value;
    //     debugEventIndexSelect.innerHTML = '';
    //     debugEventIndexSelect.appendChild(defaultIndexOption.cloneNode(true));

    //     let eventsToPopulate = [];
    //     switch (selectedCategory) {
    //         case "NORMAL":
    //             eventsToPopulate = NORMAL_EVENTS;
    //             break;
    //         case "BENEFIT":
    //             eventsToPopulate = BENEFIT_EVENTS;
    //             break;
    //         case "DANGER":
    //             eventsToPopulate = DANGER_EVENTS;
    //             break;
    //         case "MILESTONE":
    //             // MILESTONE_EVENTS_DATAはオブジェクトなので、values()で配列に変換
    //             eventsToPopulate = Object.values(MILESTONE_EVENTS_DATA);
    //             break;
    //     }

    //     eventsToPopulate.forEach((eventData, index) => {
    //         const option = document.createElement("option");
    //         option.value = index;
    //         option.textContent = eventData.title;
    //         debugEventIndexSelect.appendChild(option);
    //     });
    // });
}

/**
 * デバッグ: 指定した敵と戦闘を開始する
 * @param {string} enemyId
 */
async function debugStartCombat(enemyId) {
    if (!enemyId) {
        addMessage("敵が選択されていません。", false);
        return;
    }
    if (gameState.screen === SCREENS.battleScreen) {
        addMessage("すでに戦闘中です。", false);
        return;
    }

    const enemyToFight = getEnemyById(enemyId);
    if (enemyToFight) {
        addMessage(`デバッグ: ${enemyToFight.name} との戦闘を開始します！`, false);
        await sleep(500);
        await battleInit([enemyToFight, structuredClone(enemyToFight)]);
    } else {
        addMessage(`デバッグ: 敵「${enemyName}」が見つかりませんでした。`, false);
    }
}

/**
 * クリックで消せるトースト通知を表示する
 * TODO: いずれrenderに持ってって
 * @param {string} message
 * @param {number} duration - 自動消去までのms (デフォルト3000)
 */
function showToast(message, duration = 3000) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    if (toast._hideTimer) clearTimeout(toast._hideTimer);

    toast.innerHTML = `<span class="toast-icon">✦</span>${message}`;
    toast.classList.add("toast-show");

    const hide = () => {
        toast.classList.remove("toast-show");
        toast.removeEventListener("click", hide);
    };

    toast.addEventListener("click", hide);
    toast._hideTimer = setTimeout(hide, duration);
}

/**
 * メニューモーダルを開く
 */
function openMenuModal() {
    gameState.openModal = "menu";
}

/**
 * メニューモーダルを閉じる
 */
function closeMenuModal() {
    gameState.openModal = null;
}


/**
 * 使用ボタンのイベント
 */
// export async function useItem(_) {
//         // TODO: 戦闘中と共通化したいね。。無理か
//         const targets = [player.party[0]]; 
//         const actor = player.party[0]; 
//         for (const effect of this.item.effects) {
//             if (effect.type === "damage") {
//                 for (const target of targets) {
//                     const damage = calculateDiceDamage(
//                         actor, target,
//                         effect.dice, effect.sides, effect.flat,
//                         false,
//                         effect.fix ?? 0, effect.armor_pierce ?? 0
//                     );
//                     applyDamage(target, damage, false)
//                 }
//             } else if (effect.type === "heal") {
//                 for (const target of targets) {
//                     const heal = calculateDiceHeal(
//                         actor, target,
//                         effect.dice, effect.sides, effect.flat,
//                         false,
//                         effect.fix ?? 0
//                     );
//                     target.hp = Math.min(target.maxHp, target.hp + heal);
//                     addMessage(`${target.name} は ${heal} 回復した！`);
//                 }
//             } else if (effect.type === "add_state") {
//                 for (const target of targets) {
//                     const is_success = calculateDiceChance(
//                         actor, target, effect.stateId,
//                         effect.dice, effect.sides, effect.flat,
//                         false,
//                         effect.fix ?? 0
//                     );
//                     if (is_success) {
//                         const turn = effect.turn;
//                         addBattleStatus(effect.stateId, target, turn);
//                     }
//                 }
//             } else if (effect.type === "recover_state") {
//                 for (const target of targets) {
//                     // その状態異常になっているか
//                     if (!target.battleStatus.some(s => s.type === effect.stateId)) {
//                         continue;
//                     }
//                     const is_success = calculateDiceChance(
//                         actor, target, effect.stateId,
//                         effect.dice, effect.sides, effect.flat,
//                         false,
//                         effect.fix ?? 0
//                     );
//                     if (is_success) {
//                         recoverBattleStatus(effect.stateId, target)
//                     }
//                 }
//             } else if (effect.type === "revive") {
//                 for (const target of targets) {
//                     // その状態異常になっているか
//                     if (!target.battleStatus.some(s => s.type === "dead")) {
//                         continue;
//                     }
//                     const is_success = calculateDiceChance(
//                         actor, target, "dead",
//                         effect.dice, effect.sides, effect.flat,
//                         false,
//                         effect.fix ?? 0
//                     );
//                     if (is_success) {
//                         revive(target, effect.heal)
//                     }
//                 }
//             } else if (effect.type === "stat_change") {
//                 for (const target of targets) {
//                     const mod = calculateDiceHeal(
//                         actor, target,
//                         effect.dice, effect.sides, effect.flat,
//                         false,
//                         effect.fix ?? 0
//                     );
//                     target[effect.stat] += mod;
//                     addMessage(`${target.name} の ${effect.stat} が ${mod} ` + (mod > 0 ? "上がった！" : "下がった！"));
//                 }
//             }
//         }

//     // 無制限でないものは使用回数を減らす
//     if (this.item.uses) {
//         this.item.uses -= 1;
//     }
//     if (this.item.uses !== null && this.item.uses <= 0) {
//         player.item_slot = player.item_slot.filter(i => i !== this.item);
//         const msg = `${this.item.name} を使い切った！`;
//         addMessage(msg);
//         showToast(msg);
//     } else {
//         const msg = `${this.item.name} を使用した！`;
//         addMessage(msg);
//         showToast(msg);
//     }

//     gameState.dirty = true;
//     saveGame(player);
// }

// /**
//  * 装備ボタンのイベント
//  * TODO: キャラ指定対応
//  */
// export function equip(_) {
//     // 1. 同タイプチェックを先に
//     const sameType = player.party[0].equipmentSlot.some(e => e.equip_type === this.item.equip_type);
//     if (sameType) {
//         showToast(`すでに${this.item.equip_type}を装備しています`);
//         return;
//     }

//     // 2. 枠数チェック
//     if (player.party[0].equipmentSlot.length >= 5) {
//         showToast("装備枠が一杯です");
//         return;
//     }

//     // 3. stat_modifierをプレイヤーに反映
//     if (this.item.stat_modifier) {
//         Object.entries(this.item.stat_modifier).forEach(([stat, val]) => {
//             player.party[0][stat] += val;
//         });
//     }

//     player.party[0].equipmentSlot.push(this.item);
//     player.item_slot = player.item_slot.filter(i => i !== this.item);

//     const equipMsg = `${this.item.name}を装備した`;
//     addMessage(equipMsg);
//     showToast(equipMsg);
//     gameState.dirty = true;
//     saveGame(player);
// }

// /**
//  * 装備解除ボタンのイベント
//  */
// export function unequip(_) {
//     // 1. アイテム枠チェック
//     if (player.item_slot.length >= 20) {
//         // addMessage("アイテム枠が一杯で外せません");
//         showToast("アイテム枠が一杯で外せません");
//         return;
//     }

//     // 2. stat_modifierを戻す
//     if (this.item.stat_modifier) {
//         Object.entries(this.item.stat_modifier).forEach(([stat, val]) => {
//             player.party[0][stat] -= val;
//         });
//         if (player.party[0].hp > player.party[0].maxHp) {
//             player.party[0].hp = player.party[0].maxHp;
//         }
//         if (player.party[0].mp > player.party[0].maxMp) {
//             player.party[0].mp = player.party[0].maxMp;
//         }
//     }

//     player.item_slot.push(this.item);
//     player.party[0].equipmentSlot = player.party[0].equipmentSlot.filter(i => i !== this.item);

//     const unequipMsg = `${this.item.name}を外した`;
//     addMessage(unequipMsg);
//     showToast(unequipMsg);
//     gameState.dirty = true;
//     saveGame(player);
// }

/**
 * IDをキーにアイテムデータをマスタから取得してクローンを返す
 * @param id
 * @returns {Item}
 */
function getItemById(id) {
    const item = ITEMS.find(i => i.id === id);
    if (!item) {
        console.warn(`Item not found: ${id}`);
        return null;
    }
    return structuredClone(item);
}

/**
 * IDをキーにエネミーデータをマスタから取得してクローンを返す
 * @param id
 * @returns {Enemy}
 */
function getEnemyById(id) {
    const enemy = ENEMIES.find(i => i.id === id);
    if (!enemy) {
        console.warn(`Enemy not found: ${id}`);
        return null;
    }
    return structuredClone(enemy);
}

/**
 * IDをキーにスキルデータをマスタから取得してクローンを返す
 * @param id
 * @returns {Skill}
 */
export function getSkillById(id) {
    const skill = SKILLS.find(i => i.id === id);
    if (!skill) {
        console.warn(`Skill not found: ${id}`);
        return null;
    }
    return structuredClone(skill);
}

/**
 * リストから指定されたタイミングで使用可能なリストを返します
 * @param {Array<Skill>} skills
 * @param {string} timing
 * @returns {Array<Skill>}
 */
export function getUsableList(skills, timing) {
    return skills.filter(s => s.usableIn[timing]);
}

/**
 * 対象にダメージを与える
 * @param {Object} target
 * @param {number} damage
 * @param {bool} is_phisycal // 眠りから覚めるか
 */
function applyDamage(target, damage, is_phisycal = false) {
    target.hp = Math.max(0, target.hp - damage);
    addMessage(`${target.name} に ${damage} のダメージ！`);
    takeDead(target);
    // 眠りの解除判定 50%で眠り削除
    if (is_phisycal && target.battleStatus.some(s => s.type === "sleep") && Math.random() < 0.5) {
        recoverBattleStatus("sleep", target);
    }
}

/**
 * ダメージ計算
 * @param {Object} attacker 
 * @param {Object} target 
 * @param {number} power // 小数 ダメージ係数
 * @param {boolean} isMagic // 魔法なら威力にINT乗算
 * @param {number} fix // 固定ダメージ：防御以外のすべてを無視した固定値
 * @param {number} add // 追加ダメージ
 * @param {number} armorPierce // アーマー貫通割合（小数）
 */
function calculateDamage(attacker, target, power = 1.00, isMagic = false, fix = 0, add = 0, armorPierce = 0) {
    let damage = 0;
    if (fix > 0) {
        damage = fix;
    } else {
        let base = 400;// 防御の逆影響度合い。高ければ薄れ、低ければ高まる
        let atk =  attacker.atk;
        let def =  target.def * (1 - armorPierce);
        const rand = Number((0.95 + Math.random() * 0.1).toFixed(2));// 0.95 ~ 1.05の幅
        if (isMagic) {
            // 魔法なら知力どうしで計算
            base = 500;
            atk = attacker.int;
            def =  target.int * (1 - armorPierce);
        }
        damage += ((atk * power) * (base / (base + def))
                + add) * rand;
    }

    // 防御中なら半減
    if (target.battleStatus.some(s => s.type === "guard")) {
        damage = Math.floor(damage / 2);
    }

    // 耐性が出たら廃止かも
    // ダメージが0ならランダムに1か0にする
    if (damage <= 0) {
        damage = Math.random() < 0.5 ? 1 : 0;
    }

    return Math.max(0, Math.floor(damage));
}

/**
 * 回復量計算
 * @param {Object} attacker 
 * @param {Object} target 
 * @param {number} power // 小数 ダメージ係数
 * @param {boolean} isMagic // 魔法なら威力にINT乗算
 * @param {number} fix // 固定ダメージ：防御以外のすべてを無視した固定値
 * @param {number} add // 追加ダメージ
 * @param {number} armorPierce // アーマー貫通割合（小数）
 */
function calculateHeal(attacker, target, power = 1.00, isMagic = false, fix = 0, add = 0,) {
    let heal = 0;
    if (fix > 0) {
        heal = fix;
    } else {
        let atk =  1;
        const rand = Number((0.95 + Math.random() * 0.1).toFixed(2));// 0.95 ~ 1.05の幅
        if (isMagic) {
            // 魔法なら知力どうしで計算
            atk = attacker.int;
        }
        heal += ((atk * power) + add) * rand;
    }

    return Math.max(0, Math.floor(heal));
}

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roll(chance) {
    const roll = Math.ceil(Math.random() * 100);
    return roll <= Math.floor(chance);
}

// ============================================================================
// 6. 戦闘
// battleInit ⇒ loop[battleTurnStart ⇒ battleExecOrder ⇒ battleExecCommand ⇒ battleFinishCommand ⇒ battleTurnEnd] ⇒ battleResult
// ============================================================================
/**
 * 戦闘開始前の準備
 * @param {Array} enemies 
 */
async function battleInit(enemies) {
    gameState.battle = new Proxy({
        party: player.party,
        enemies: enemies.map(enemy => 
            new Proxy({
                ...enemy,
                defId: enemy.id,
                id: self.crypto.randomUUID(),
            }, {set: setAndRender})
        ),
        turnOrder: [],
        turn: 0,
        phase: null,
        actor: null,
        actor_stan: null,// paralyzeなどスタン事由を表記
        pendingCommand: new Proxy({}, {set: setAndRender}),
        result: {},
    }, {set: setAndRender});
    moveScreen(SCREENS.battleScreen);
    gameState.battle.phase = "start";

    for (const enemy of gameState.battle.enemies) {
        await sleep(100);
        addMessage(`${enemy.name}が現れた！`);
    }

    await sleep(1000);
    await battleTurnStart();// ターン開始処理実行
}

/**
 * ターン開始
 */
async function battleTurnStart() {
    gameState.battle.turn++;
    gameState.battle.phase = "turn_start";
    addMessage("　");
    addMessage(`第${gameState.battle.turn}ターン`);
    addMessage("");
    console.log(1);
    // ランダム順にしてからソートする。速度同値がランダムになるように
    const turnOrder = TARGET_TYPE_EXTRACTOR["alive_all"](gameState.battle.party, gameState.battle.enemies)
        .sort(() => Math.random() - 0.5)
        .sort((a, b) => getStatus(b, "spd") - getStatus(a, "spd"));
    // 行動回数を反映
    gameState.battle.turnOrder = turnOrder.flatMap(unit =>
        Array(unit.multiAction ?? 1).fill(unit)
    );

    await sleep(1000);
    await battleExecOrder();// 行動決定処理実行
}

/**
 * 次のオーダーキャラを処理
 */
async function battleExecOrder() {
    console.log(2);
    // 勝敗判定
    // TODO: 戦闘不能判定をメソッド化したほうがいい ダメージ処理でマイナスにならないように
    if (gameState.battle.party.every(unit => isDead(unit))) {
        const name = gameState.battle.party[0].name + (gameState.battle.party.length === 1 ? "": "たち");
        addMessage(`　`);
        addMessage(`${name}は全滅した……`);
        battleResult(false); //敗北。相打ちでも敗北が優先
        return;
    } else if (gameState.battle.enemies.every(unit => isDead(unit))) {
        addMessage(`　`);
        addMessage(`すべての敵を倒した！`);
        battleResult(true); //勝利
        return;
    }

    // 全員行動済みならターン終了処理
    if (gameState.battle.turnOrder.length === 0) {
        await battleTurnEnd();
        return;
    }

    // 味方ならコマンド選択を表示｜敵ならランダムに決定してコマンド実行処理
    gameState.battle.actor = gameState.battle.turnOrder.shift();
    gameState.battle.actor_stan = null;
    applyBatleStatus("act_before", gameState.battle.actor);

    // 麻痺等のスタン状態や戦闘不能なら次へ TODO: 行動不能判定
    if (gameState.battle.actor_stan || isDead(gameState.battle.actor)) {
        await battleExecCommand();
        return;
    }

    if (gameState.battle.party.includes(gameState.battle.actor)) {
        gameState.battle.phase = "command_waiting";// コマンドパネル描画
    } else {
        counterDecideEnemyActionAndTarget = 0;
        gameState.battle.pendingCommand = decideEnemyActionAndTarget(gameState.battle.actor);
        await battleExecCommand();
    }
}

let counterDecideEnemyActionAndTarget = 0;
/**
 * 敵の行動をランダムに決定
 * @param {Object} actor 
 * @returns 
 */
function decideEnemyActionAndTarget(actor) {
    counterDecideEnemyActionAndTarget += 1;
    if (counterDecideEnemyActionAndTarget > 100) {
        throw new Error(`loop counterDecideEnemyActionAndTarget 100 ${actor.name}`);
    }
    // TODO ランダムに敵の行動を決定
    const enemyActions = [
        "attack", "attack", "attack", "guard",
        // TODO: とりあえず
        ...(gameState.battle.actor.skillList)
    ];
    const enemyAction = enemyActions[Math.floor(Math.random() * enemyActions.length)];
    const aliveParty = gameState.battle.party.filter(unit => !isDead(unit))
    if (enemyAction === "attack") {
        return new Proxy({act: "attack", actDetail: null, targets: [
            aliveParty[Math.floor(Math.random() * aliveParty.length)].id
        ]}, {set: setAndRender});
    } else if (enemyAction === "guard") {
        return new Proxy({act: "guard", actDetail: null, targets: [actor.id]}, {set: setAndRender});
    } else {
        const skill = getSkillById(enemyAction);
        let units = TARGET_TYPE_EXTRACTOR[skill.target_type](gameState.battle.enemies, gameState.battle.party, actor);

        if (units.length === 0) {
            return decideEnemyActionAndTarget(actor);
        }
        // 選択が必要な種別の場合、対象をランダムに選択
        if (SELECT_TARGET_TYPE.includes(skill.target_type)) {
            units = [units[Math.floor(Math.random() * units.length)]];
        }
        return new Proxy({act: "skill", actDetail: enemyAction, targets: units.map(unit => unit.id)}, {set: setAndRender});
    }
}

/**
 * コマンド効果処理
 */
async function battleExecCommand() {
    console.log(3);
    addMessage("　");
    gameState.battle.phase = "exec";// ログや演出のパネル描画
    const cmd = gameState.battle.pendingCommand;
    const targets = cmd.targets?.map(id => getUnitById(id));
    const actor = gameState.battle.actor;
    advanceTimeline(actor.id);

    if (isDead(gameState.battle.actor)) {
        // Nothing to do
    } else if (gameState.battle.actor_stan) {
        const status_def = BATTLE_STATUSES.find(_status => _status.id === gameState.battle.actor_stan);
        addMessage(status_def.stanMessageGen(gameState.battle.actor.name));
    } else if (cmd.act === "attack") {
        console.log("攻撃コマンドが実行されました")
        addMessage(`${actor.name} のこうげき！`);
        for (const target of targets) {
            const damage = calculateDamage(actor, target);
            applyDamage(target, damage, true);
        }
    } else if (cmd.act === "guard") {
        console.log("防御コマンドが実行されました")
        for (const target of targets) {
            addBattleStatus("guard", target, 1);
        }

    } else if (cmd.act === "skill") {
        console.log("スキルコマンドが実行されました")

        let skill = null;
        // エネミーならマスタから取得
        if (gameState.battle.enemies.includes(actor)) {
            skill = getSkillById(gameState.battle.pendingCommand.actDetail);
        } else {
            skill = gameState.battle.actor.skillList.find(skill => skill.id === gameState.battle.pendingCommand.actDetail);
        }

        // カスタムメッセージがあれば表示変更
        if (skill.customMessage) {
            // TODO: 変換メソッド化
            addMessage(skill.customMessage.replace("${actor-name}", actor.name));
        } else {
            addMessage(`${actor.name} は ${skill.name} を放った！`);
        }

        // コスト支払い TODO: 敵にも適用
        if (!gameState.battle.enemies.includes(actor)) {
            for (const type in skill.cost) {
                actor[type] = Math.max(0, actor[type] - skill.cost[type]);
            }
        }

        // TODO: これ以外の処理
        for (const effect of skill.effects) {
            if (effect.type === "damage") {
                const is_combat = skill.category === "combat";
                for (const target of targets) {
                    if (isDead(target)) {
                        continue;
                    }
                    const damage = calculateDamage(
                        actor, target, effect.power,
                        skill.category === "magic",
                        effect.fix, effect.add, effect.armor_pierce
                    );
                    applyDamage(target, damage, skill.category !== "magic");
                }
            } else if (effect.type === "heal") {
                for (const target of targets) {
                    if (isDead(target)) {
                        continue;
                    }
                    const heal = calculateHeal(
                        actor, target,
                        effect.power, skill.category === "magic",
                        effect.fix, effect.add
                    );
                    target.hp = Math.min(target.maxHp, target.hp + heal);
                    addMessage(`${target.name} は ${heal} 回復した！`);
                }
            } else if (effect.type === "add_state") {
                for (const target of targets) {
                    if (isDead(target)) {
                        continue;
                    }
                    const is_magic = skill.category === "magic";
                    const is_success = roll(effect.fix);
                    if (is_success) {
                        let turn = effect.turn;
                        // 魔法なら持続増減
                        if (is_magic) {
                            turn *= magicRate(actor.int);
                            turn = Math.floor(turn);
                        }
                        addBattleStatus(effect.stateId, target, turn);
                    }
                }
            } else if (effect.type === "recover_state") {
                for (const target of targets) {
                    if (isDead(target)) {
                        continue;
                    }
                    // その状態異常になっているか
                    if (!target.battleStatus.some(s => s.type === effect.stateId)) {
                        continue;
                    }
                    const is_magic = skill.category === "magic";
                    const is_success = roll(effect.fix)
                    if (is_success) {
                        recoverBattleStatus(effect.stateId, target);
                    }
                }
            } else if (effect.type === "revive") {
                for (const target of targets) {
                    if (!isDead(target)) {
                        continue;
                    }
                    const is_magic = skill.category === "magic";
                    const is_success = effect.roll(effect.fix)
                    if (is_success) {
                        revive(target, effect.heal);
                    }
                }
            }
        }
    } else if (cmd.act === "item") {
        console.log("アイテムコマンドが実行されました");
        const item = player.item_slot.find(item => item.uuid === cmd.actDetail);
        addMessage(`${actor.name} は ${item.name} を使用した！`);

        // TODO: healとdamage以外の処理
        for (const effect of item.effects) {
            if (effect.type === "damage") {
                for (const target of targets) {
                    if (isDead(target)) {
                        continue;
                    }
                    const damage = effect.fix ? effect.fix : getRandom(effect.min, effect.max);
                    applyDamage(target, damage, false)
                }
            } else if (effect.type === "heal") {
                for (const target of targets) {
                    if (isDead(target)) {
                        continue;
                    }
                    const heal = effect.fix ? effect.fix : getRandom(effect.min, effect.max);
                    target.hp = Math.min(target.maxHp, target.hp + heal);
                    addMessage(`${target.name} は ${heal} 回復した！`);
                }
            } else if (effect.type === "add_state") {
                for (const target of targets) {
                    if (isDead(target)) {
                        continue;
                    }
                    const is_success = roll(effect.fix);
                    if (is_success) {
                        const turn = effect.turn;
                        addBattleStatus(effect.stateId, target, turn);
                    }
                }
            } else if (effect.type === "recover_state") {
                for (const target of targets) {
                    if (isDead(target)) {
                        continue;
                    }
                    // その状態異常になっているか
                    if (!target.battleStatus.some(s => s.type === effect.stateId)) {
                        continue;
                    }
                    const is_success = roll(effect.fix)
                    if (is_success) {
                        recoverBattleStatus(effect.stateId, target)
                    }
                }
            } else if (effect.type === "revive") {
                for (const target of targets) {
                    if (!isDead(target)) {
                        continue;
                    }
                    const is_success = roll(effect.fix)
                    if (is_success) {
                        revive(target, effect.heal)
                    }
                }
            }
        }
        // 無制限でないものは使用回数を減らす
        if (item.uses) {
            item.uses -= 1;
            if (item.uses <= 0) {
                player.item_slot = player.item_slot.filter(i => i !== item);
                addMessage(`${actor.name} は ${item.name} を使い切った！`);
            }
        }
    } else {
        throw new Error(`存在しないアクションです[${cmd.act}]`);
    }

    // 戦闘不能キャラを全取得してタイムラインから除く
    const down_chara_list = [...gameState.battle.party, ...gameState.battle.enemies]
        .filter((unit) => isDead(unit));
    gameState.battle.turnOrder = gameState.battle.turnOrder.filter(order =>
        !down_chara_list.some(unit => unit.id === order.id)
    );
    down_chara_list.forEach(unit => advanceTimeline(unit.id));

    gameState.battle.pendingCommand = new Proxy({}, {set: setAndRender});

    await sleep(100);
    await battleFinishCommand();// 行動終了処理実行
}

/**
 * コマンド効果終了処理
 */
async function battleFinishCommand() {
    console.log(4);
    applyBatleStatus("act_after", gameState.battle.actor);
    gameState.battle.actor = null;
    gameState.battle.actor_stan = null;
    // 次の行動につなぐ
    await sleep(750);
    await battleExecOrder();
}

/**
 * ターン終了処理
 */
async function battleTurnEnd() {
    console.log(5);
    gameState.battle.phase = "pending";// ログパネル描画
    
    await sleep(750);
    await battleTurnStart();
}

/**
 * 戦闘終了処理
 * @param {boolean} isVictory 
 */
function battleResult(isVictory) {
    gameState.battle.phase = "result";// ログパネル描画
    if (isVictory) {
        // 勝利時にリザルトを組み立ててセット
        const totalMoney = gameState.battle.enemies.reduce((acc, enemy) => acc + enemy.money, 0);
        const totalExp = gameState.battle.enemies.reduce((acc, enemy) => acc + enemy.exp, 0);
        const totalRankExp = gameState.battle.enemies.reduce((acc, enemy) => acc + Math.floor(enemy.exp / 100) + 1, 0);

        // 経験値加算処理
        const level_ups = [];
        const rank_ups = [];
        for (const unit of player.party.filter(unit => !isDead(unit))) {
            const mod_levels = addExp(unit, totalExp);
            if (mod_levels) {
                level_ups.push(mod_levels)
            }
            const modRanks = addRankExp(unit, totalRankExp);
            if (modRanks) {
                rank_ups.push(modRanks)
            }
        }

        const dropItems = rollDropItems(gameState.battle.enemies);
        gameState.battle.result = {
            isVictory: true,
            exp: totalExp,
            rankExp: totalRankExp,
            gold: totalMoney,
            items: dropItems ?? null,
            levelUps: level_ups ?? null,
            rankUps: rank_ups ?? null,
        };
        gameState.battle.phase = "result";
    } else {
        gameState.battle.result.isVictory = false;
    }
}

/**
 * コマンド[こうげき|ぼうぎょ|スキル|アイテム]押下イベント
 * @param {*} e 
 * @returns 
 */
async function onActSelect(e) {
    const choice = e.target.closest('.cmd');
    if (!choice) return;

    const act = choice.dataset.act;
    gameState.battle.pendingCommand.act = act;
    console.log(act)
    if (act === "attack") {
        const aliveEnemies = getAliveUnits(gameState.battle.enemies);
        // TODO: 攻撃タイプが単体=1なら、全体なら、ランダムなら
        // こうげき選択かつ敵が1体のとき、対象を自動選択して行動
        if (aliveEnemies.length === 1) {
            gameState.battle.pendingCommand.actDetail = null;
            gameState.battle.pendingCommand.targets = [aliveEnemies[0].id];
            await battleExecCommand();
            return;
        }
        // TODO:こうげき選択かつactorの攻撃タイプが全体かランダムのとき
    } else if (act === "guard") {
        // 防御なら自身を対象に行動
        gameState.battle.pendingCommand.actDetail = null;
        gameState.battle.pendingCommand.targets = [gameState.battle.actor.id];
        await battleExecCommand();
        return;
    } else if (act === "skill" && getUsableList(gameState.battle.actor.skillList, "battle").length === 0) {
        gameState.battle.alert = "使用できるスキルがありません";
        gameState.battle.pendingCommand.act = null;
    } else if (act === "item" && !player.item_slot.some((item) => item.usableIn["battle"])) {
        gameState.battle.alert = "使用できるアイテムがありません";
        gameState.battle.pendingCommand.act = null;
    }
}

/**
 * コマンド[アイテム選択]押下イベント
 * @param {*} e 
 * @returns 
 */
async function onActDetailItemSelect(e) {
    const choice = e.target.closest('.cmd');
    if (!choice) return;

    const actDetail = choice.dataset.actDetail;
    console.log(actDetail);
    if (actDetail === "back") {
        gameState.battle.pendingCommand.act = null;
        return;
    }

    const item =  player.item_slot.find(item => item.uuid === actDetail);
    const units = TARGET_TYPE_EXTRACTOR[item.use_target_type](gameState.battle.party, gameState.battle.enemies, gameState.battle.actor);
    if (units.length === 0) {
        gameState.battle.alert = "対象が存在しないため使用できません";
        return;
    }
    gameState.battle.pendingCommand.actDetail = actDetail;

    // 選択が必要な種別でないなら対象を格納して実行
    // 選択が必要であっても対象が1体なら自動選択
    if (!SELECT_TARGET_TYPE.includes(item.use_target_type)
        || units.length === 1) {
        gameState.battle.pendingCommand.targets = units.map(unit => unit.id);
        await battleExecCommand();
        return;
    }
}

/**
 * コマンド[スキル選択]押下イベント
 * @param {*} e 
 * @returns 
 */
async function onActDetailSkillSelect(e) {
    const choice = e.target.closest('.cmd');
    if (!choice) return;

    const actDetail = choice.dataset.actDetail;
    if (actDetail === "back") {
        gameState.battle.pendingCommand.act = null;
        return;
    }

    const skill =  gameState.battle.actor.skillList.find(skill => skill.id === actDetail);
    // TODO: コストの支払いチェックメソッド 特殊なの作らない限りはこれでいけそうだけどね
    if ((skill.cost.hp && gameState.battle.actor.hp <= skill.cost.hp)
        || (skill.cost.mp && gameState.battle.actor.mp < skill.cost.mp)
    ) {
        gameState.battle.alert = "コストが足りないため使用できません";
        return;
    }
    const units = TARGET_TYPE_EXTRACTOR[skill.target_type](gameState.battle.party, gameState.battle.enemies, gameState.battle.actor);
    if (units.length === 0) {
        gameState.battle.alert = "対象が存在しないため使用できません";
        return;
    }
    gameState.battle.pendingCommand.actDetail = actDetail;

    // 選択が必要な種別でないなら対象を格納して実行
    // 選択が必要であっても対象が1体なら自動選択
    if (!SELECT_TARGET_TYPE.includes(skill.target_type)
        || units.length === 1) {
        gameState.battle.pendingCommand.targets = units.map(unit => unit.id);
        await battleExecCommand();
        return;
    }
}

/**
 * コマンド[対象選択]押下イベント
 * @param {*} e 
 * @returns 
 */
async function onTargetSelect(e) {
    const choice = e.target.closest('.cmd');
    if (!choice) return;

    const targets = choice.dataset.targets;
    if (targets === "back") {
        if (gameState.battle.pendingCommand.actDetail) {
            gameState.battle.pendingCommand.actDetail = null;
            return;
        } else {
            gameState.battle.pendingCommand.act = null;
            return;
        }
    }
    gameState.battle.pendingCommand.targets = [targets];
    await battleExecCommand();
}

/**
 * 戦闘画面から戻る処理
 */
async function battleEnd() {
    const result = gameState.battle.result;
    systemHealAll(false);// 状態異常だけ初期化
    if (result.isVictory) {
        player.money += result.gold;
        player.currentEventCompleted = true; // 戦闘イベント完了

        for (const item of result.items) {
            await acquireItem(item);
        }
        for (const enemy of gameState.battle.enemies) {
            if (!player.achievement.defeatedMonsters[enemy.defId]) {
                player.achievement.defeatedMonsters[enemy.defId] = {
                    count: 1,
                    firstDay: player.day
                };
            } else {
                player.achievement.defeatedMonsters[enemy.defId].count += 1;
            }
        }
    }
    await resolveEventNode(result.isVictory ? player.explore.event.data.winNode : player.explore.event.data.loseNode);
    gameState.battle = null;
}

/**
 * 必要経験値の算出
 * @param {number} level 
 * @returns 
 */
export function getRequiredExp(level) {
    const n = level - 1; 
    return Math.floor(
        (2.5 * n * (n + 1) * (2 * n + 1) / 6) + (10 * level)
    );
}

/**
 * レベルアップ処理
 * 上昇ステータスオブジェクトを返す
 * @param {Object} unit 
 * @returns 
 */
function levelUp(unit) {
    unit.level++;

    // TODO: 装備や職業加算
    const job = JOBS[unit.currentJob];
    const growthRates = {
        maxHp: 75 + (job.growthRates.maxHp ?? 0),
        maxMp: 50 + (job.growthRates.maxMp ?? 0),
        atk: 35 + (job.growthRates.atk ?? 0),
        def: 35 + (job.growthRates.def ?? 0),
        spd: 35 + (job.growthRates.spd ?? 0),
        int: 35 + (job.growthRates.int ?? 0),
        dex: 35 + (job.growthRates.dex ?? 0),
        size: 35 + (job.growthRates.size ?? 0),
    };


    const statusUp = {};
    for (const [stat, rate] of Object.entries(growthRates)) {
        const gain = rollGrowth(rate);
        if (gain > 0) {
            unit[stat] += gain;
            if (stat === "maxHp") {
                unit.hp += gain;
            } else if (stat === "maxMp") {
                unit.mp += gain;
            }
            statusUp[stat] = gain;
        }
    }

    return statusUp;
}

/**
 * 成長判定を行います
 * @param {number} rate 
 * @returns 
 */
function rollGrowth(rate) {
    let growth = 0;
    while (rate > 0) {
        const roll = Math.floor(Math.random() * 100) + 1;
        if (roll <= rate) {
            growth++;
        }
        rate -= roll;
    }
    return growth;
}

/**
 * 経験値を加算してレベルアップを行う
 * @param {Object} unit 
 * @param {number} exp 
 * @returns 
 */
function addExp(unit, exp) {
    const before_level = unit.level;
    // 累積経験値
    unit.exp += exp;

    // 上昇量集計
    const total_status_up = {};
    while (unit.exp >= getRequiredExp(unit.level)) {
        // レベルアップ
        const status_up = levelUp(unit);
        // 上昇量を加算
        for (const [key, value] of Object.entries(status_up)) {
            total_status_up[key] = (total_status_up[key] ?? 0) + value;
        }
    }
    if (before_level === unit.level) {
        return;
    }

    return {
        name: unit.name,
        before: before_level,
        after: unit.level,
        statChanges: total_status_up,
    };
}

/**
 * 必要ランク経験値の算出
 * 基礎経験値 * (倍率 ** ランク) + 5 * ランク
 * @param {text} job_id 
 * @param {number} level 
 * @returns 
 */
export function getRequiredRankExp(job_id, rank) {
    const job = JOBS[job_id];
    return Math.floor(rank * rank * 1.5 + rank * 10 * job.rateExp);
}

/**
 * ランク経験値を加算してランクアップを行う
 * @param {Object} unit 
 * @param {number} exp 
 * @returns 
 */
function addRankExp(unit, exp) {
    const job_history = unit.jobs[unit.currentJob];
    const before_rank = job_history.rank;
    const job = JOBS[unit.currentJob];
    // 累積ランク経験値
    job_history.exp += exp;

    // 上昇量集計
    const total_status_up = {};
    const total_skills = [];
    while (job.maxRank > job_history.rank && job_history.exp >= getRequiredRankExp(unit.currentJob, job_history.rank)) {
        // レベルアップ
        const [status_up, skills] = rankUp(unit, job_history);
        // 上昇量を加算
        for (const [key, value] of Object.entries(status_up)) {
            total_status_up[key] = (total_status_up[key] ?? 0) + value;
        }
        total_skills.push(...skills);
    }
    gameState.dirty = true;
    if (before_rank === job_history.rank) {
        return;
    }

    return {
        name: unit.name,
        before: before_rank,
        after: job_history.rank,
        statChanges: total_status_up,
        learnSkills: total_skills,
        jobId: unit.currentJob,
    };
}

/**
 * ランクアップ処理
 * [上昇ステータスオブジェクト, スキルID配列]を返す
 * @param {Object} unit 
 * @param {Object} unit 
 * @returns 
 */
function rankUp(unit, job_history) {
    job_history.rank++;

    // 現在のランクのボーナスを取得して適用
    const statusUp = {};
    const skills = [];
    const job = JOBS[unit.currentJob];
    const bonuses = job.rankBonuses.filter((bonus) => bonus.rank === job_history.rank);
    for (const bonus of bonuses) {
        if (bonus.status) {
            for (const [stat, gain] of Object.entries(bonus.status)) {
                unit[stat] += gain;
                if (stat === "maxHp") {
                    unit.hp += gain;
                } else if (stat === "maxMp") {
                    unit.mp += gain;
                }
                statusUp[stat] = gain;
            }
        }
        if (bonus.learnSkills) {
            bonus.learnSkills.forEach(skill_id => {
                if (!unit.skillList.some((skill) => skill.id === skill_id)) {
                    unit.skillList.push(getSkillById(skill_id));
                }
            });
            skills.push(...bonus.learnSkills);
        }
    }

    return [statusUp, skills];
}

/**
 * 戦闘終了時のアイテムドロップ判定
 * @param {Array<Object>} enemies 
 * @returns // {id: count}形式
 */
function rollDropItems(enemies) {
    const result = {};

    for (const enemy of enemies) {
        for (const drop of enemy.dropItems ?? []) {
            const roll = Math.floor(Math.random() * 100) + 1;

            if (roll <= drop.chance) {
                result[drop.id] = (result[drop.id] ?? 0) + 1;
            }
        }
    }

    const items = [];
    for (const itemId in result) {
        const item = getItemById(itemId);
        for (let i = 0; i < result[itemId]; i++) {
            items.push(item);
        }
    }

    return items;
}

/**
 * 戦闘画面のアラートを消去
 */
function battleAlertClear() {
    gameState.battle.alert = null;
}

alertPanel.addEventListener("click", battleAlertClear);
commandPanel.addEventListener("click", onActSelect);
itemPanel.addEventListener("click", onActDetailItemSelect);
skillPanel.addEventListener("click", onActDetailSkillSelect);
targetPanel.addEventListener("click", onTargetSelect);
battleEndButton.addEventListener("click", battleEnd);

/**
 * 描画：行動後にタイムライン更新
 * @param {string} unitId 
 * @returns 
 */
async function advanceTimeline(unitId) {
    const el = document.querySelector(
        `.timeline-unit[data-id="${unitId}"]`
    );
    if (!el) {
        return;
    }

    el.classList.add("removing");
    await new Promise(resolve =>
        setTimeout(resolve, 300)
    );
    el.remove();

    const units = document.querySelectorAll(
        "#timeline-panel .timeline-unit"
    );
    const step = 86 / units.length;
    units.forEach((unit, index) => {
        unit.style.left = `${index * step + 7}%`;
    });
}

/**
 * 状態異常の効果発揮、減算処理
 * 行動開始/終了などはtargetあり、その他は全体に反映なのでなし
 */
function applyBatleStatus(timing, target = null) {
    // 処理を格納
    const func = (target, timing) => {
        for (const status of target.battleStatus) {
            const status_def = BATTLE_STATUSES.find(_status => _status.id === status.type);

            // 効果発揮
            if (status_def.exec_timing === timing) {
                const apply_message = status_def.applyEffect(gameState, target);
                if (apply_message) {
                    addMessage(apply_message);
                }
            }

            // 減算
            if (status_def.sub_timing === timing) {
                if (status.turn === 1) {
                    recoverBattleStatus(status.type, target);
                } else {
                    status.turn -= 1;
                }
            }
        }
    }

    // 個別処理の場合
    if (target) {
        func(target, timing);
        return;
    }
    // 全体処理の場合
    TARGET_TYPE_EXTRACTOR["alive_all"](gameState.battle.party, gameState.battle.enemies)
        .forEach(unit => {
            func(unit, timing);
    });
}

/**
 * hpが0かチェックしてdead状態を付与する
 * @param {Object} target 
 * @param {boolean} is_allow_zero // 何か特殊な事情があれば 
 */
function takeDead(target, is_allow_zero = false) {
    // TODO* ゾンビ状態など作るなら判定
    if (!is_allow_zero && target.hp === 0) {
        // 既存の状態異常をすべて除く
        target.battleStatus = target.battleStatus.filter(_status => false);
        addBattleStatus("dead", target, -1);
    }
}

/**
 * 戦闘不能から復帰させる
 * @param {Object} target 
 * @param {number} heal
 * @param {boolean} is_allow_zero // 何か特殊な事情があれば 
 */
function revive(target, heal, is_allow_zero = false) {
    target.hp = Math.min(target.maxHp, target.hp + heal);
    if (is_allow_zero || target.hp >= 0) {
        recoverBattleStatus("dead", target);
    }
}

/**
 * 魔法のpowerに乗ずる値をintから計算する
 * @param {number} int
 * @returns 
 */
function magicRate(int) {
    const t = int / 999;
    return 0.5 + 2.5 * Math.pow(t, 0.7);
}

/**
 * 状態異常を付与する
 * @param {string} state_id 
 * @param {Object} target 
 * @param {number} turn 
 */
function addBattleStatus(state_id, target, turn) {
    const status_def = BATTLE_STATUSES.find(_status => _status.id === state_id);
    // メッセージ表示
    const add_message = status_def.addMessageGen(target.name);
    if (add_message) {
        addMessage(add_message);
    }

    const current_status = target.battleStatus.find(s => s.type === state_id);
    if (!current_status) {
        target.battleStatus.push({type: state_id, turn: turn});
    } else if (state_id !== "guard") {
        //　防御以外ならターンを最大値に更新する
        current_status.turn = Math.max(current_status.turn, turn);
    }
}

/**
 * 状態異常を解除する
 * @param {string} state_id 
 * @param {Object} target 
 * @param {number} turn 
 */
function recoverBattleStatus(state_id, target) {
    const status_def = BATTLE_STATUSES.find(_status => _status.id === state_id);
    const sub_message = status_def.subMessageGen(target.name);
    if (sub_message) {
        addMessage(sub_message);
    }
    target.battleStatus = target.battleStatus.filter(_status => _status.type !== state_id);
}

/**
 * 生存している対象を抽出
 * @param {Array} list 
 * @returns {Array}
 */
function getAliveUnits(list) {
    return list.filter(unit => unit.hp > 0);
}

/**
 * IDから対象キャラを取得
 * @param {string} id 
 * @returns {Proxy}
 */
function getPartyUnitById(id) {
    return player.party.find(unit => unit.id === id)
}

/**
 * IDから対象キャラを取得
 * @param {string} id 
 * @returns {Proxy}
 */
function getUnitById(id) {
    return gameState.battle.party.find(unit => unit.id === id) ||
        gameState.battle.enemies.find(unit => unit.id === id);
}


// ============================================================================
// 8. イベントリスナー
// ============================================================================
newGameButton.addEventListener("click", () => {
    deleteSaveData(); // 新しく始める場合はセーブデータを削除
    showCharacterCreationScreen();
});

loadGameButton.addEventListener("click", async () => {
    const savedData = loadGame();
    if (savedData) {
        player = new Proxy(savedData.player, {
            set: setAndRender
        });
        gameState.dirty = true;
        // 探索中なら探索画面へ
        if (player.explore.phase === "waitingTileSelect") {
            moveScreen(SCREENS.exploreScreen);
            showToast("探索を再開します。");
            return;
        } else if (player.explore.phase === "waitingChoiceSelect") {
            moveScreen(SCREENS.exploreScreen, SUB_SCREENS.exploreEventScreen);
            return;
        } else if (player.explore.phase === "battle") {
            await battleInit(player.explore.event.data.enemyIds.map(id => getEnemyById(id)));
            return;
        } else if (player.explore.phase === "gameOver" || player.explore.phase === "clear") {
            player.explore = null;
        }
        moveScreen(SCREENS.baseScreen);
        showToast("おかえりなさい！");
    } else {
        addMessage("セーブデータが見つかりませんでした。", false);
        loadGameButton.classList.add("hidden"); // ボタンを非表示にする
    }
});

hpAllocationInput.addEventListener("input", updateAllocationDisplay);
mpAllocationInput.addEventListener("input", updateAllocationDisplay);
attackAllocationInput.addEventListener("input", updateAllocationDisplay);
speedAllocationInput.addEventListener("input", updateAllocationDisplay);
intelAllocationInput.addEventListener("input", updateAllocationDisplay);
dexAllocationInput.addEventListener("input", updateAllocationDisplay);
sizeAllocationInput.addEventListener("input", updateAllocationDisplay);

startAdventureButton.addEventListener("click", () => {
    initializePlayer();
    moveScreen(SCREENS.baseScreen);
    showToast(`はじめまして！ ${player.party[0].name}`);
});

debugTriggerEventButton.addEventListener("click", () => {
    const eventCategory = debugEventCategorySelect.value;
    const eventIndex = parseInt(debugEventIndexSelect.value);
    if (eventCategory && !isNaN(eventIndex)) {
        debugTriggerEvent(eventCategory, eventIndex);
    } else {
        addMessage("デバッグ: イベントカテゴリとインデックスを選択してください。", false);
    }
});

debugStartCombatButton.addEventListener("click", async () => {
    const enemyId = debugEnemySelect.value;
    await debugStartCombat(enemyId);
});

debugAcquireItemButton.addEventListener("click", debugAcquireItem);
debugChangeJobButton.addEventListener("click", debugChangeJob);
debugAddExpButton.addEventListener("click", debugAddExp);
debugAddRankExpButton.addEventListener("click", debugAddRankExp);

debugBackLogButton.addEventListener("click", () => {console.log(gameState.backLog)});
debugBackLogButton.addEventListener("click", () => {console.log(gameState)});

// デバッグパネルの切り替え
debugPanelToggle.addEventListener("click", () => {
    debugPanelContent.classList.toggle("hidden");
    debugToggleIcon.classList.toggle("open");
});

// ============================================================================
// 9. 初期化
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    showTitleScreen();
});
