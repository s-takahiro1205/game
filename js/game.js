// ゲームロジック・状態管理・メインループ

import { saveGame, loadGame, deleteSaveData } from './save.js';
import { ITEMS } from './data/items.js';
import { ENEMIES } from './data/enemies.js';
import { SKILLS } from './data/skills.js';
import { JOBS } from './data/jobs.js';
import { NORMAL_EVENTS, BENEFIT_EVENTS, DANGER_EVENTS, MILESTONE_EVENTS_DATA, EVENTS, generateRandomEvent } from './data/events.js';
import { scheduleRender } from './render.js';
import { BATTLE_STATUSES, DEBUFF_STATUS_MODIFIERS, SELECT_TARGET_TYPE, TARGET_TYPE_EXTRACTOR } from './const.js';

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
 * @property {object | null} stat_modifier - 増減ステータス（例: { attack: +5, armor: +2 }）
 * @property {"weapon" | "armor" | "shield" | "accessory" | null} equip_type - 装備種別
 */

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
    attack: 0,
    armor: 0,
    speed: 0,
    intel: 0,
    dex: 0,
    size: 0,
    multi_action: 1,
    currentJob: "warrior",// 例
    jobs: {
        // warrior: {// 例
        //     rank: 4,
        //     exp: 150
        // },
    },
    equipment_slot: [], // 最大5
    skill_list: [ // スキル
        // getSkillById("thunder"),// 例
    ],
    battle_status: [ // 状態異常
        // {// 例
        //     id: "weakness",
        //     turn: 3
        // },
    ],
};

export let player = new Proxy({
        position: 0,
        isGameOver: false,
        isCleared: false,
        currentEventCompleted: false, // 現在のマスでのイベントが完了したか
        savedEventCategory: null, // セーブされたイベントのカテゴリ
        savedEventIndex: null,    // セーブされたイベントのインデックス
        money: 0,
        item_slot: [],// 最大20
        party: [new Proxy(unit_base, {set: setAndRender})],// 最大4
    },
    {
        set: setAndRender
});

// ゲーム管理用Proxyオブジェクト
export const gameState = new Proxy({
        // 強制描画用フラグ
        dirty: false,
        // ページ制御
        currentScreen: null,
        // 探索内サブ状態
        explorePhase: null,// "idle" | "rolling" | "event_resolve" | "choice"
        // 戦闘内サブ状態
        combatPhase: null,// "start" | "command_waiting" | "exec" | "enemy_act" | "result",
        // // モーダル（currentPageと独立して重なる）
        openModal: null,// null | "menu" | "item_discard",
        menuTab: "status",// "status" | "items" | "equipments",
        // // データ
        // currentEvent: null,
        // currentChoices: null,

        // 戦闘系
        battle: new Proxy({
            party: [],// 味方キャラProxy配列
            enemies: [],// 敵キャラProxy配列
            turnOrder: [],// 行動順のparty+enemies
            turn: 0,// ターン数
            phase: null,// string画面制御用フラグ[start|turn_start|pending|command_waiting|exec|result]
            actor: null,// コマンド表示や行動実行用のキャラ保管
            actorStan: null,// 麻痺や睡眠などで行動できないフラグ
            pendingCommand: null,// ターゲット選択や行動実行用のコマンドオブジェクト
            result: {},
            // {
            //   gold: 120,
            //   exp: 80,
            //   items: [ { name: "回復薬", isNew: true }, ... ],
            //   levelUps: [ { name: "アレス", oldLv: 3, newLv: 4, statChanges: {maxHp: +10, attack: +2} } ],
            //   rankUps: [ { name: "アレス", oldRank: "D", newRank: "C" } ],
            // }
        }, {set: setAndRender}),

        // ログ系
        exploreLog: [],
        combatLog: [],
        backLog: [],// {type, text}
    },
    {
        set: setAndRender
});

// DOM Elements
const titleScreen = document.getElementById("title-screen");
const newGameButton = document.getElementById("new-game-button");
const loadGameButton = document.getElementById("load-game-button");

const characterCreationScreen = document.getElementById("character-creation-screen");
const playerNameInput = document.getElementById("player-name");
const hpAllocationInput = document.getElementById("hp-allocation");
const mpAllocationInput = document.getElementById("mp-allocation");
const attackAllocationInput = document.getElementById("attack-allocation");
const remainingPointsSpan = document.getElementById("remaining-points");
const displayHpSpan = document.getElementById("display-hp");
const displayMpSpan = document.getElementById("display-mp");
const displayAttackSpan = document.getElementById("display-attack");
const speedAllocationInput = document.getElementById("speed-allocation");
const intelAllocationInput = document.getElementById("intel-allocation");
const dexAllocationInput = document.getElementById("dex-allocation");
const sizeAllocationInput = document.getElementById("size-allocation");
const displaySpeedSpan = document.getElementById("display-speed");
const displayIntelSpan = document.getElementById("display-intel");
const displayDexSpan = document.getElementById("display-dex");
const displaySizeSpan = document.getElementById("display-size");
const startAdventureButton = document.getElementById("start-adventure-button");

const mainGameScreen = document.getElementById("main-game-screen");
const currentPositionSpan = document.getElementById("current-position");
const playerDisplayName = document.getElementById("player-display-name");
const playerHpText = document.getElementById("player-hp-text");
const playerAttackSpan = document.getElementById("player-attack");
const playerArmorSpan = document.getElementById("player-armor");
const playerSpeedSpan = document.getElementById("player-speed");
const playerIntelSpan = document.getElementById("player-intel");
const playerDexSpan = document.getElementById("player-dex");
const playerSizeSpan = document.getElementById("player-size");
const gameMessage = document.getElementById("game-message");
const choicesContainer = document.getElementById("choices-container");
const advanceButton = document.getElementById("advance-button");
const attackButton = document.getElementById("attack-button");
const menuButton = document.getElementById("menu-button");

const battleMessage = document.getElementById("battle-message");
const alertPanel = document.getElementById("alert-panel");
const commandPanel = document.getElementById("command-panel");
const itemPanel = document.getElementById("item-panel");
const skillPanel = document.getElementById("skill-panel");
const targetPanel = document.getElementById("target-panel");
const battleEndButton = document.getElementById("battle-end");

// アイテム破棄モーダル用DOM要素
const discardItemModal = document.getElementById("discard-item-modal");
const discardCloseButton = document.querySelector(".discard-close-button");
const discardItemList = document.getElementById("discard-item-list");
const discardSelectedItemButton = document.getElementById("discard-selected-item-button");

let selectedItemToDiscardIndex = -1; // 破棄するアイテムのインデックス
let itemToAcquireAfterDiscard = null; // 破棄後に取得するアイテム


const gameOverScreen = document.getElementById("game-over-screen");
const backToTitleFromGameOverButton = document.getElementById("back-to-title-from-gameover");

const clearScreen = document.getElementById("clear-screen");

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
    let eventId = player.position;

    switch (eventCategory) {
        case "NORMAL":
            if (NORMAL_EVENTS[eventIndex]) {
                eventData = { ...NORMAL_EVENTS[eventIndex], type: "normal" };
            }
            break;
        case "BENEFIT":
            if (BENEFIT_EVENTS[eventIndex]) {
                eventData = { ...BENEFIT_EVENTS[eventIndex], type: "benefit" };
            }
            break;
        case "DANGER":
            if (DANGER_EVENTS[eventIndex]) {
                eventData = { ...DANGER_EVENTS[eventIndex], type: "danger" };
            }
            break;
        case "MILESTONE":
            // MILESTONE_EVENTS_DATAはオブジェクトなので、キーでアクセス
            const milestoneKeys = Object.keys(MILESTONE_EVENTS_DATA);
            if (milestoneKeys[eventIndex]) {
                const key = milestoneKeys[eventIndex];
                eventData = { ...MILESTONE_EVENTS_DATA[key], type: "milestone" };
                eventId = parseInt(key); // マイルストーンイベントはIDをそのマイルストーンのマスに設定
            }
            break;
    }

    if (eventData) {
        // イベントIDを現在のプレイヤー位置に設定
        const triggeredEvent = {
            id: eventId,
            type: eventData.type,
            title: eventData.title,
            text: eventData.text,
            effects: eventData.effects || null,
            enemyIds: eventData.enemyIds,
            isMilestone: eventData.type === "milestone",
            choices: eventData.choices || null
        };
        addMessage(`デバッグ: イベント「${triggeredEvent.title}」を強制実行します！`, false);
        displayCurrentEvent(triggeredEvent);
        player.position = eventId; // プレイヤー位置も更新
        saveGame(player);
    } else {
        addMessage("デバッグ: 指定されたイベントが見つかりませんでした。", false);
    }
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
    const unit = player.party.find(unit => unit.id === unit_id);
    if (!unit_id || !unit) {
        addMessage("デバッグ: ユニットを選択してください。", false);
        return;
    }

    await changeJob(unit, job_id);
    addMessage(`デバッグ: ${unit.name} は ${job.name} に転職した！`, false);
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
 * タイトル画面を表示する
 */
function showTitleScreen() {
    gameState.currentScreen = 'title-screen';
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
    gameState.currentScreen = 'character-creation-screen';

    // 初期値を設定
    playerNameInput.value = "名もなき探訪者";
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
 * メインゲーム画面を表示する
 */
function showMainGameScreen() {
    gameState.currentScreen = 'main-game-screen';
    gameState.explorePhase = "idle";
    populateDebugEnemySelect(); // デバッグ用敵選択を初期化
    populateDebugEventSelects(); // デバッグイベント選択を初期化
    populateDebugItemSelect(); // デバッグ用アイテム選択を初期化
    populateDebugJobSelect(); // デバッグ用アイテム選択を初期化

    // ロード時にイベントが未完了だった場合の処理
    if (!player.currentEventCompleted && player.savedEventCategory && player.savedEventIndex !== null) {
        const event = getEventFromSavedData(player.savedEventCategory, player.savedEventIndex);
        if (event) {
            displayCurrentEvent(event);
        } else {
            console.error("Saved event not found:", player.savedEventCategory, player.savedEventIndex);
            // フォールバックとして、現在の位置のイベントを再生成するか、エラーメッセージを表示する
            // 今回はエラーメッセージを表示し、進むボタンを有効にする
            addMessage("セーブされたイベントが見つかりませんでした。先に進んでください。", false);
            gameState.explorePhase = "idle";
            player.currentEventCompleted = true; // イベントが見つからない場合は完了とみなす
        }
    } else if (!player.currentEventCompleted) {
        // savedEventCategoryやsavedEventIndexがない場合（古いセーブデータなど）
        // またはマス0でイベントが未完了の場合
        const event = EVENTS[player.position];
        displayCurrentEvent(event);
    }
}

/**
 * 保存されたカテゴリとインデックスからイベントオブジェクトを再構築する
 * @param {string} category - イベントカテゴリ (例: "NORMAL", "BENEFIT", "DANGER", "MILESTONE")
 * @param {number} index - カテゴリ内のイベントのインデックス
 * @returns {object|null} 再構築されたEventCellオブジェクト、または見つからない場合はnull
 */
function getEventFromSavedData(category, index) {
    let eventData = null;
    let eventType = category.toLowerCase(); // EventCellのtypeは小文字

    switch (category) {
        case "NORMAL":
            if (NORMAL_EVENTS[index]) {
                eventData = NORMAL_EVENTS[index];
            }
            break;
        case "BENEFIT":
            if (BENEFIT_EVENTS[index]) {
                eventData = BENEFIT_EVENTS[index];
            }
            break;
        case "DANGER":
            if (DANGER_EVENTS[index]) {
                eventData = DANGER_EVENTS[index];
            }
            break;
        case "MILESTONE":
            const milestoneKeys = Object.keys(MILESTONE_EVENTS_DATA);
            if (milestoneKeys[index]) {
                const key = milestoneKeys[index];
                eventData = MILESTONE_EVENTS_DATA[key];
                eventType = "milestone"; // マイルストーンイベントのtypeは"milestone"
            }
            break;
    }

    if (eventData) {
        return {
            id: player.position, // 現在のプレイヤー位置をIDとする
            type: eventType,
            title: eventData.title,
            text: eventData.text,
            effects: eventData.effects || null,
            enemyIds: eventData.enemyIds,
            isMilestone: category === "MILESTONE",
            choices: eventData.choices || null,
            eventCategory: category, // 保存用にカテゴリとインデックスをEventCell自体にも含める
            eventIndex: index
        };
    }
    return null;
}

/**
 * ゲームオーバー画面を表示する
 */
function showGameOverScreen() {
    gameState.currentScreen = 'game-over-screen';
}

/**
 * クリア画面を表示する
 */
function showClearScreen() {
    gameState.currentScreen = 'clear-screen';
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

    const remaining = 39 - hpPts - mpPts - atkPts - speedVal - intelVal - dexVal - sizeVal;

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
    player.position = 0;
    player.isGameOver = false;
    player.isCleared = false;
    player.currentEventCompleted = false;
    player.savedEventCategory = null;
    player.savedEventIndex = null;

    const unit = new Proxy(structuredClone(unit_base), {set: setAndRender});
    unit.name = playerNameInput.value || "名もなき探訪者";

    const hpPts = parseInt(hpAllocationInput.value);
    const mpPts = parseInt(mpAllocationInput.value);
    const atkPts = parseInt(attackAllocationInput.value);
    unit.maxHp = hpPts * 2;
    unit.maxMp = mpPts * 2;
    unit.attack = atkPts;
    unit.armor = 0;
    unit.speed = parseInt(speedAllocationInput.value);
    unit.intel = parseInt(intelAllocationInput.value);
    unit.dex = parseInt(dexAllocationInput.value);
    unit.size = parseInt(sizeAllocationInput.value);

    unit.id = self.crypto.randomUUID();
    unit.level = 1;
    unit.exp = 0;
    unit.hp = unit.maxHp;
    unit.mp = unit.maxMp;
    unit.multi_action = 1;
    unit.currentJob = null;
    unit.jobs = {};
    unit.equipment_slot = [];
    unit.skill_list = [
        // getSkillById("wait-and-see"),
    ];
    unit.battle_status = [];
    changeJob(unit, "warrior");
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
    if (player.item_slot.length < 20) {
        item.uuid = self.crypto.randomUUID();
        player.item_slot.push(item);
        addMessage(`${item.name} を手に入れた！`);
        return true;
    } else {
        addMessage("アイテムスロットが満杯です（20/20）。");
        addMessage("アイテムの取得を諦めますか、それとも何かを捨てて取得しますか？");

        return new Promise(resolve => {
            // 選択肢ボタンを生成
            choicesContainer.innerHTML = '';
            choicesContainer.classList.remove("hidden");

            const giveUpButton = document.createElement("button");
            giveUpButton.textContent = "諦める";
            giveUpButton.classList.add("choice-button");
            giveUpButton.addEventListener("click", () => {
                choicesContainer.innerHTML = '';
                choicesContainer.classList.add("hidden");
                addMessage("アイテムの取得を諦めました。");
                // saveGame(player);
                resolve(false); // 諦めた
            });
            choicesContainer.appendChild(giveUpButton);

            const discardButton = document.createElement("button");
            discardButton.textContent = "捨てて取得する";
            discardButton.classList.add("choice-button");
            discardButton.addEventListener("click", async () => {
                choicesContainer.innerHTML = '';
                choicesContainer.classList.add("hidden");
                itemToAcquireAfterDiscard = item; // 破棄後に取得するアイテムを保存
                const discarded = await openDiscardItemModal(); // 破棄モーダルを開く
                if (discarded) {
                    // 破棄が成功したら、保存しておいたアイテムを取得
                    player.item_slot.push(itemToAcquireAfterDiscard);
                    addMessage(`${itemToAcquireAfterDiscard.name} を手に入れた！`);
                    resolve(true); // 取得成功
                } else {
                    addMessage("アイテムの破棄をキャンセルしました。アイテムの取得を諦めます。");
                    resolve(false); // 破棄をキャンセルしたため、取得も諦める
                }
                itemToAcquireAfterDiscard = null; // 使用済みなのでクリア
            });
            choicesContainer.appendChild(discardButton);
        });
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

        unit.jobs[job_id] = {
            rank: 1,
            exp: 0,
        };
    }

    const beforeJob = unit.currentJob;

    unit.currentJob = job_id;

    return {
        success: true,
        before: beforeJob,
        after: job_id,
        rank: unit.jobs[job_id].rank,
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
function systemHealAll() {
    for (const unit of player.party) {
        unit.hp = unit.maxHp;
        unit.mp = unit.maxMp;
        unit.battle_status = unit.battle_status.filter(status => false);
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
            ...(gameState.exploreLog.map(text => ({type: "explore", text}))),
            ...(gameState.combatLog.map(text => ({type: "explore", text})))
        );
        gameState.exploreLog = [];
        gameState.combatLog = [];
    }

    if (gameState.currentScreen === 'main-game-screen') {
        gameState.exploreLog.push(message);
    } else if (gameState.currentScreen === 'battle-screen') {
        gameState.combatLog.push(message);
    }
    gameState.dirty = true;
}

/**
 * 選択肢ボタンを描画する
 * @param {Array<Object>} choices - 選択肢の配列。各要素は { text: string, next: Object, effects: Array<Object> } の形式。
 * @param {Object} event - イベント本体
 */
function renderChoices(choices, event) {
    choicesContainer.innerHTML = ''; // 既存の選択肢をクリア

    if (!choices || choices.length === 0) {
        choicesContainer.classList.add("hidden"); // 選択肢がない場合は非表示
        return;
    }

    choicesContainer.classList.remove("hidden"); // 選択肢がある場合は表示

    choices.forEach((choice, index) => {
        const button = document.createElement("button");
        button.textContent = choice.text;
        button.classList.add("choice-button"); // スタイリング用のクラスを追加
        button.dataset.choiceIndex = index; // 選択肢のインデックスをデータ属性として保存

        // 条件チェック
        if (choice.condition) {
            if (!checkCondition(choice.condition)) {
                button.disabled = true;
                button.classList.add("disabled-choice"); // グレーアウト用のクラス
            }
        }

        button.addEventListener("click", async () => {
            // 無効化されているボタンはクリックしても何もしない
            if (button.disabled) {
                return;
            }

            // 1. そのchoiceのeffectを適用する
            addMessage(choice.outcomeText);
            if (choice.effects) {
                for (const ef of choice.effects) {
                    await applyEffect(ef);
                }
            }

            // 2. choicesボタン群を非表示にする
            choicesContainer.innerHTML = '';
            choicesContainer.classList.add("hidden");

            // 3. nextEventがあるならば続けて処理
            const nextEvent = resolveNext(choice.next, event);
            if (nextEvent !== null) {
                displayCurrentEvent(nextEvent);
            } else {
                // nextがない場合、イベントはここで終了し、進むボタンを再有効化
                if (!player.isGameOver && !player.isCleared) {
                    // 選択肢が選ばれたので、現在のイベントは完了
                    player.currentEventCompleted = true;
                    gameState.explorePhase = "idle";
                }
                saveGame(player); // 選択肢処理後にセーブ
            }
        });
        choicesContainer.appendChild(button);
    });
}

/**
 * 選択肢のnext処理
 * @param next
 * @param currentEvent
 * @returns {Event}
 */
function resolveNext(next, currentEvent) {
    if (next === undefined || next === null) return null;
    if (next === "SELF") return currentEvent;

    if (next.type === "random_branch") {
        const roll = Math.random();
        let cumulative = 0;
        for (const branch of next.branches) {
            cumulative += branch.probability;
            if (roll <= cumulative) {
                return branch.event === "SELF" ? currentEvent : branch.event;
            }
        }
    }

    return next;  // 通常のEventCell
}

/**
 * 現在のプレイヤー位置のイベントを表示し、UIを更新する
 * @param {Object} event - 現在のEventCellオブジェクト
 */
function displayCurrentEvent(event) {
    addMessage(`--- ${event.title} ---`, false); // 既存メッセージをクリアして表示
    addMessage(event.text);

    gameState.explorePhase = "event_resolve";
    player.currentEventCompleted = false; // イベント処理開始時に未完了にリセット
    player.savedEventCategory = event.eventCategory || null;
    player.savedEventIndex = event.eventIndex !== undefined ? event.eventIndex : null;

    choicesContainer.innerHTML = ''; // 念のためクリア
    choicesContainer.classList.add("hidden"); // 念のため非表示に

    if (event.choices && event.choices.length > 0) {
        gameState.explorePhase = "choice_waiting";
        renderChoices(event.choices, event);
        // player.currentEventCompleted は false のまま
    } else if (event.enemyIds) {
        setTimeout(
            battleInit.bind(null, event.enemyIds.map(id => getEnemyById(id)))
        , 100);
        // player.currentEventCompleted は false のまま
    } else if (event.effects) {
        for (const ef of event.effects) {
            applyEffect(ef);
        }
        player.currentEventCompleted = true; // 効果イベントは即座に完了
    } else {
        player.currentEventCompleted = true; // 何もないマスは即座に完了
    }

    // ゲーム終了判定
    checkGameEnd();

    // 探索状態に戻す判定 敗北かクリアでなくイベント完了なら待機に戻す
    if (!player.isGameOver && !player.isCleared && player.currentEventCompleted) {
        gameState.explorePhase = "idle";
    }
    saveGame(player); // イベント処理後にセーブ
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
        option.textContent = `${enemy.name} (HP:${enemy.maxHp} (MP:${enemy.maxMp} ATK:${enemy.attack} ARM:${enemy.armor} SPD:${enemy.speed})`;
        debugEnemySelect.appendChild(option);
    });
}

/**
 * デバッグ用のイベントカテゴリとインデックス選択ドロップダウンを生成する
 */
function populateDebugEventSelects() {
    // カテゴリ選択の初期化
    debugEventCategorySelect.innerHTML = '';
    const categories = ["-- カテゴリを選択 --", "NORMAL", "BENEFIT", "DANGER", "MILESTONE"];
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category === "-- カテゴリを選択 --" ? "" : category;
        option.textContent = category;
        debugEventCategorySelect.appendChild(option);
    });

    // インデックス選択の初期化
    debugEventIndexSelect.innerHTML = '';
    const defaultIndexOption = document.createElement("option");
    defaultIndexOption.value = "";
    defaultIndexOption.textContent = "-- イベントを選択 --";
    debugEventIndexSelect.appendChild(defaultIndexOption);

    // カテゴリ選択が変更されたときのイベントリスナー
    debugEventCategorySelect.addEventListener("change", () => {
        const selectedCategory = debugEventCategorySelect.value;
        debugEventIndexSelect.innerHTML = '';
        debugEventIndexSelect.appendChild(defaultIndexOption.cloneNode(true));

        let eventsToPopulate = [];
        switch (selectedCategory) {
            case "NORMAL":
                eventsToPopulate = NORMAL_EVENTS;
                break;
            case "BENEFIT":
                eventsToPopulate = BENEFIT_EVENTS;
                break;
            case "DANGER":
                eventsToPopulate = DANGER_EVENTS;
                break;
            case "MILESTONE":
                // MILESTONE_EVENTS_DATAはオブジェクトなので、values()で配列に変換
                eventsToPopulate = Object.values(MILESTONE_EVENTS_DATA);
                break;
        }

        eventsToPopulate.forEach((eventData, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = eventData.title;
            debugEventIndexSelect.appendChild(option);
        });
    });
}

/**
 * デバッグ: 指定した敵と戦闘を開始する
 * @param {string} enemyId
 */
function debugStartCombat(enemyId) {
    if (!enemyId) {
        addMessage("敵が選択されていません。", false);
        return;
    }
    if (gameState.currentScreen === 'battle-screen') {
        addMessage("すでに戦闘中です。", false);
        return;
    }

    const enemyToFight = getEnemyById(enemyId);
    if (enemyToFight) {
        addMessage(`デバッグ: ${enemyToFight.name} との戦闘を開始します！`, false);
        setTimeout(
            // TODO: 正式な複数体デバッグ
            battleInit.bind(null, [enemyToFight, structuredClone(enemyToFight)])
        , 100);
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
export async function useItem(_) {
        // TODO: 戦闘中と共通化したいね。。無理か
        const targets = [player.party[0]]; 
        const actor = player.party[0]; 
        for (const effect of this.item.effects) {
            if (effect.type === "damage") {
                for (const target of targets) {
                    const damage = calculateDiceDamage(
                        actor, target,
                        effect.dice, effect.sides, effect.flat,
                        false,
                        effect.fix ?? 0, effect.armor_pierce ?? 0
                    );
                    applyDamage(target, damage, false)
                }
            } else if (effect.type === "heal") {
                for (const target of targets) {
                    const heal = calculateDiceHeal(
                        actor, target,
                        effect.dice, effect.sides, effect.flat,
                        false,
                        effect.fix ?? 0
                    );
                    target.hp = Math.min(target.maxHp, target.hp + heal);
                    addMessage(`${target.name} は ${heal} 回復した！`);
                }
            } else if (effect.type === "add_state") {
                for (const target of targets) {
                    const is_success = calculateDiceChance(
                        actor, target, effect.stateId,
                        effect.dice, effect.sides, effect.flat,
                        false,
                        effect.fix ?? 0
                    );
                    if (is_success) {
                        const turn = effect.turn;
                        addBattleStatus(effect.stateId, target, turn);
                    }
                }
            } else if (effect.type === "recover_state") {
                for (const target of targets) {
                    // その状態異常になっているか
                    if (!target.battle_status.some(s => s.type === effect.stateId)) {
                        continue;
                    }
                    const is_success = calculateDiceChance(
                        actor, target, effect.stateId,
                        effect.dice, effect.sides, effect.flat,
                        false,
                        effect.fix ?? 0
                    );
                    if (is_success) {
                        recoverBattleStatus(effect.stateId, target)
                    }
                }
            } else if (effect.type === "revive") {
                for (const target of targets) {
                    // その状態異常になっているか
                    if (!target.battle_status.some(s => s.type === "dead")) {
                        continue;
                    }
                    const is_success = calculateDiceChance(
                        actor, target, "dead",
                        effect.dice, effect.sides, effect.flat,
                        false,
                        effect.fix ?? 0
                    );
                    if (is_success) {
                        revive(target, effect.heal)
                    }
                }
            } else if (effect.type === "stat_change") {
                for (const target of targets) {
                    const mod = calculateDiceHeal(
                        actor, target,
                        effect.dice, effect.sides, effect.flat,
                        false,
                        effect.fix ?? 0
                    );
                    target[effect.stat] += mod;
                    addMessage(`${target.name} の ${effect.stat} が ${mod} ` + (mod > 0 ? "上がった！" : "下がった！"));
                }
            }
        }

    // 無制限でないものは使用回数を減らす
    if (this.item.uses) {
        this.item.uses -= 1;
    }
    if (this.item.uses !== null && this.item.uses <= 0) {
        player.item_slot = player.item_slot.filter(i => i !== this.item);
        const msg = `${this.item.name} を使い切った！`;
        addMessage(msg);
        showToast(msg);
    } else {
        const msg = `${this.item.name} を使用した！`;
        addMessage(msg);
        showToast(msg);
    }

    gameState.dirty = true;
    saveGame(player);
}

/**
 * 装備ボタンのイベント
 * TODO: キャラ指定対応
 */
export function equip(_) {
    // 1. 同タイプチェックを先に
    const sameType = player.party[0].equipment_slot.some(e => e.equip_type === this.item.equip_type);
    if (sameType) {
        showToast(`すでに${this.item.equip_type}を装備しています`);
        return;
    }

    // 2. 枠数チェック
    if (player.party[0].equipment_slot.length >= 5) {
        showToast("装備枠が一杯です");
        return;
    }

    // 3. stat_modifierをプレイヤーに反映
    if (this.item.stat_modifier) {
        Object.entries(this.item.stat_modifier).forEach(([stat, val]) => {
            player.party[0][stat] += val;
        });
    }

    player.party[0].equipment_slot.push(this.item);
    player.item_slot = player.item_slot.filter(i => i !== this.item);

    const equipMsg = `${this.item.name}を装備した`;
    addMessage(equipMsg);
    showToast(equipMsg);
    gameState.dirty = true;
    saveGame(player);
}

/**
 * 装備解除ボタンのイベント
 */
export function unequip(_) {
    // 1. アイテム枠チェック
    if (player.item_slot.length >= 20) {
        // addMessage("アイテム枠が一杯で外せません");
        showToast("アイテム枠が一杯で外せません");
        return;
    }

    // 2. stat_modifierを戻す
    if (this.item.stat_modifier) {
        Object.entries(this.item.stat_modifier).forEach(([stat, val]) => {
            player.party[0][stat] -= val;
        });
    }

    player.item_slot.push(this.item);
    player.party[0].equipment_slot = player.party[0].equipment_slot.filter(i => i !== this.item);

    const unequipMsg = `${this.item.name}を外した`;
    addMessage(unequipMsg);
    showToast(unequipMsg);
    gameState.dirty = true;
    saveGame(player);
}

// ============================================================================
// 5. ゲームループ (「進む」ボタン押下時)
async function advance() {
    if (player.isGameOver || player.isCleared) return;

    // 現在のマスでのイベントが未完了の場合、先に進めない
    if (player.position > 0 && !player.currentEventCompleted) {
        addMessage("現在のイベントを完了するまで先に進めません！", false);
        return;
    }

    gameState.explorePhase = "rolling";

    // 1. ダイスロール
    const roll = Math.ceil(Math.random() * 6);
    addMessage(`🎲 ${roll}が出た！`, false); // 既存メッセージをクリアしてダイス結果を表示

    // 2. プレイヤー位置更新
    const oldPosition = player.position;
    let targetPosition = oldPosition + roll;
    let newPosition = targetPosition;

    const milestones = [20, 50, 80, 100];
    for (const milestone of milestones) {
        if (oldPosition < milestone && milestone <= targetPosition) {
            newPosition = milestone;
            break;
        }
    }
    player.position = Math.min(newPosition, 100);
    player.currentEventCompleted = false;

    // 3. ダイス演出テキスト表示
    await new Promise(resolve => setTimeout(() => {
        addMessage(`${roll}マス進む（現在: ${player.position}マス）`);
        resolve();
    }, 1000)); // 1.5秒後にイベントテキストを追記

    // 4. イベント取得と処理
    let event;
    if (MILESTONE_EVENTS_DATA[player.position]) {
        // マイルストーンイベントはEVENTS配列から直接取得
        event = EVENTS[player.position];
    } else if (player.position === 0) {
        // スタート地点もEVENTS配列から直接取得
        event = EVENTS[0];
    } else {
        // それ以外のマスでは新しいランダムイベントを生成
        const randomEventResult = generateRandomEvent(player.position);
        event = randomEventResult.event;
        // 生成されたイベントのカテゴリとインデックスをプレイヤーに保存
        player.savedEventCategory = randomEventResult.category;
        player.savedEventIndex = randomEventResult.index;
    }

    console.log("Current event:", event);
    displayCurrentEvent(event);
}

/**
 * 効果をプレイヤーに適用する
 * TODO: 対象指定
 * @param {Effect} effect - 適用する効果オブジェクト
 */
async function applyEffect(effect) {
    let value = 0;
    switch (effect.type) {
        case "heal":
            value = resolveValue(effect, player.party[0]);
            player.party[0].hp = Math.min(player.party[0].hp + value, player.party[0].maxHp);
            addMessage(`${value} HP回復した！`);
            break;
        case "damage":
            value = resolveValue(effect, player.party[0]);
            const actualDamage = calculateDamage(value, player.party[0].armor);
            applyDamage(player.party[0], actualDamage);
            break;
        case "stat_change":
            value = resolveValue(effect, player.party[0]);
            player.party[0][effect.stat] = Math.max(0, player.party[0][effect.stat] + value);
            if (value > 0) {
                addMessage(`${effect.stat} が ${value} 上がった！`);// TODO: effect.statに応じたラベル表示
            } else {
                addMessage(`${effect.stat} が ${Math.abs(value)} 下がった！`);// TODO: effect.statに応じたラベル表示
            }
            break;
        case "dice_check":
            const roll = Math.ceil(Math.random() * 6);
            addMessage(`🎲 ダイスロール！ ${roll} が出た！ (成功閾値: ${effect.success_threshold})`);

            if (roll >= effect.success_threshold) {
                addMessage("ダイスロール成功！");
                if (effect.success_effect) {
                    // TODO: effectsにするか決断
                    addMessage(effect.success_effect.text);
                    await applyEffect(effect.success_effect); // 成功時の効果を適用
                }
            } else {
                addMessage("ダイスロール失敗...");
                if (effect.fail_effect) {
                    addMessage(effect.fail_effect.text);
                    await applyEffect(effect.fail_effect); // 失敗時の効果を適用
                }
            }
            break;
        case "acquire_item":
            const item = getItemById(effect.item_id);
            await acquireItem(item);
            break;
        case "money_change":
            player.money = Math.max(0, player.money + effect.value);
            if (effect.value >= 0) {
                addMessage(`${effect.value}G を得た！`);
            } else {
                addMessage(`${Math.abs(effect.value)}G 支払った。`);
            }
            break;
        case "random_item": {
            const count = effect.count ?? 1;
            const pool = ITEMS;
            for (let i = 0; i < count; i++) {
                const randomItem = getItemById(pool[Math.floor(Math.random() * pool.length)].id);
                await acquireItem(randomItem);
            }
            break;
        }
    }
    checkGameEnd(); // 効果適用後にゲーム終了判定
}

/**
 * イベントの効果量を計算して返す
 * @param effect - イベントの効果
 * @param unit - キャラクター
 * @returns {number} イベントの効果量
 */
function resolveValue(effect, unit) {
    if (effect.min !== undefined && effect.max !== undefined) {
        return Math.floor(Math.random() * (effect.max - effect.min + 1)) + effect.min;
    }
    if (effect.rate !== undefined && effect.rate_reference !== undefined) {
        const base = unit[effect.rate_reference];
        return Math.floor(base * effect.rate);
    }
    if (effect.value !== undefined) {
        return effect.value;
    }
    console.warn("effect has no valid value definition:", effect);
    return 0;
}

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
 * ダメージ計算（アーマー軽減込み）
 * @param {number} rawDamage - 軽減前のダメージ
 * @param {number} targetArmor - 対象のアーマー値
 * @returns {number} 軽減後のダメージ
 */
function calculateDamage(rawDamage, targetArmor) {
    return Math.max(0, rawDamage - targetArmor);
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
    if (is_phisycal && target.battle_status.some(s => s.type === "sleep") && Math.random() < 0.5) {
        recoverBattleStatus("sleep", target);
    }
}

// キャラの能力値からダイス数値を計算する
function unitDiceCreate(unit) {
    //装備の攻撃ダイス修正を収集
    const equip_dices = unit.equipment_slot
        .filter((equip) => equip.dice_modifier)
        .map((equip) => equip.dice_modifier)
    // ダイス数：速度 / 333 + 装備の値 + 1：下限1 999で3
    const dice = Math.max(
        Math.floor(unit.speed / 333) + equip_dices.reduce((sum, _dice) => sum + _dice.dice, 0) + 1,
        1
    );
    // ダイス面：攻撃の25% + 装備の値：下限1 999で250
    const sides = Math.max(
        Math.floor(unit.attack * 0.25) + equip_dices.reduce((sum, _dice) => sum + _dice.sides, 0),
        1
    );
    // 修正値：器用 ^ 0.80 - 1 + 装備の値：下限0 999で250
    const flat = Math.max(
        Math.floor(unit.dex ^ 0.80 - 1) + equip_dices.reduce((sum, _dice) => sum + _dice.flat, 0),
        1
    );
    return {
        dice: dice,
        sides: sides,
        flat: flat
    }
}

/**
 * ダイスによるダメージ計算（アーマー軽減込み）
 * @param {Object} attacker 
 * @param {Object} target 
 * @param {number} dice // ダイス数
 * @param {number} sides // ダイス1つあたりの出目最大数
 * @param {number} flat // ダイス出目の補正値+N
 * @param {boolean} is_magic // 魔法なら威力にINT乗算
 * @param {number} fix_value // 固定ダメージ：防御以外のすべてを無視した固定値
 * @param {number} armor_pierce // アーマー貫通割合（小数）
 * @returns 
 */
function calculateDiceDamage(attacker, target, dice, sides, flat, is_magic = false, fix_value = 0, armor_pierce = 0) {
    let damage = flat;

    if (fix_value > 0) {
        damage = fix_value;
    } else {
        for (let i = 0; i < dice; i++) {
            damage += 1 + Math.floor(Math.random() * sides);
        }
        // 魔法なら威力増減
        if (is_magic) {
            damage *= magicRate(attacker.int);
        }
        // アーマー軽減
        damage = damage * (1 - armor_pierce);
    }

    // 防御中なら半減
    if (target.battle_status.some(s => s.type === "guard")) {
        damage = Math.floor(damage / 2);
    }

    return Math.max(0, Math.floor(damage));
}

/**
 * ダイスによる回復量計算
 * @param {Object} healer 
 * @param {Object} target 
 * @param {number} dice // ダイス数
 * @param {number} sides // ダイス1つあたりの出目最大数
 * @param {number} flat // ダイス出目の補正値+N
 * @param {boolean} is_magic // 魔法なら威力にINT乗算
 * @param {number} fix_value // 固定回復量：すべてを無視した固定値
 * @returns 
 */
function calculateDiceHeal(attacker, target, dice, sides, flat, is_magic = false, fix_value = 0) {
    let heal = flat;

    if (fix_value > 0) {
        heal = fix_value;
    } else {
        for (let i = 0; i < dice; i++) {
            heal += 1 + Math.floor(Math.random() * sides);
        }
        // 魔法なら威力増減
        if (is_magic) {
            heal *= magicRate(attacker.int);
        }
    }

    return Math.max(0, Math.floor(heal));
}

/**
 * ダイスによる確率計算 判定を返す
 * @param {Object} modifier
 * @param {Object} target
 * @param {string} state_id // 状態異常種別
 * @param {number} dice // ダイス数
 * @param {number} sides // ダイス1つあたりの出目最大数
 * @param {number} flat // ダイス出目の補正値+N
 * @param {boolean} is_magic // 魔法なら威力にINT乗算
 * @param {number} fix_value // 固定回復量：すべてを無視した固定確率
 * @returns {bool}
 */
function calculateDiceChance(attacker, target, state_id, dice, sides, flat, is_magic = false, fix_value = 0) {
    let chance_rate = flat;

    if (fix_value > 0) {
        chance_rate = fix_value;
    } else {
        for (let i = 0; i < dice; i++) {
            chance_rate += 1 + Math.floor(Math.random() * sides);
        }
        // 魔法なら威力増減
        if (is_magic) {
            chance_rate *= magicRate(attacker.int);
        }
    }
    // TODO: 抵抗力の増減

    // 1D100を実施しchance以下であれば成功判定を返す
    const roll = Math.ceil(Math.random() * 100);
    return roll <= Math.floor(chance_rate);
}

/**
 * 条件をチェックし、プレイヤーが満たしているか判定する
 * @param {Object} condition - Conditionオブジェクト { stat: string, operator: string, value: number }
 * @returns {boolean} 条件を満たしていれば true、そうでなければ false
 */
function checkCondition(condition) {
    if (!condition || !condition.stat || !condition.operator || condition.value === undefined) {
        console.warn("Invalid condition object:", condition);
        return true; // 無効な条件は常に満たすとみなす
    }

    // TODO: ちゃんと作り直して
    if (condition.stat === "money") {
        switch (condition.operator) {
            case "gte": // Greater Than or Equal to
                return player[condition.stat] >= condition.value;
            case "lte": // Less Than or Equal to
                return player[condition.stat] <= condition.value;
            case "eq":  // Equal to
                return player[condition.stat] === condition.value;
            default:
                console.warn("Unknown operator in condition:", condition.operator);
                return false;
        }
    }

    const playerStat = player.party[0][condition.stat];
    if (playerStat === undefined) {
        console.warn(`Player stat "${condition.stat}" not found for condition check.`);
        return false; // 存在しないステータスは条件を満たさない
    }

    switch (condition.operator) {
        case "gte": // Greater Than or Equal to
            return playerStat >= condition.value;
        case "lte": // Less Than or Equal to
            return playerStat <= condition.value;
        case "eq":  // Equal to
            return playerStat === condition.value;
        default:
            console.warn("Unknown operator in condition:", condition.operator);
            return false;
    }
}

// ============================================================================
// 6. 戦闘
// battleInit ⇒ loop[battleTurnStart ⇒ battleExecOrder ⇒ battleExecCommand ⇒ battleFinishCommand ⇒ battleTurnEnd] ⇒ battleResult
// ============================================================================
/**
 * 戦闘開始前の準備
 * @param {Array} enemies 
 */
function battleInit(enemies) {
    gameState.battle = new Proxy({
        party: player.party,
        enemies: enemies.map(enemy => 
            new Proxy({
                ...enemy,
                id: self.crypto.randomUUID()
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
    gameState.currentScreen = 'battle-screen';
    gameState.battle.phase = "start";

    for (const enemy of gameState.battle.enemies) {
        setTimeout(() => {
            addMessage(`${enemy.name}が現れた！`);
        }, 100);
    }

    setTimeout(() => {
        battleTurnStart();// ターン開始処理実行
    }, 1000);
}

/**
 * ターン開始
 */
function battleTurnStart() {
    gameState.battle.turn++;
    gameState.battle.phase = "turn_start";
    addMessage("　");
    addMessage(`第${gameState.battle.turn}ターン`);
    addMessage("");
    console.log(1);
    // ランダム順にしてからソートする。速度同値がランダムになるように
    const turnOrder = TARGET_TYPE_EXTRACTOR["alive_all"](gameState.battle.party, gameState.battle.enemies)
        .sort(() => Math.random() - 0.5)
        .sort((a, b) => getStatus(b, "speed") - getStatus(a, "speed"));
    // 行動回数を反映
    gameState.battle.turnOrder = turnOrder.flatMap(unit =>
        Array(unit.multi_action ?? 1).fill(unit)
    );

    setTimeout(() => {
        battleExecOrder();// 行動決定処理実行
    }, 1000);
}

/**
 * 次のオーダーキャラを処理
 */
function battleExecOrder() {
    console.log(2);
    // 勝敗判定
    // TODO: 戦闘不能判定をメソッド化したほうがいい ダメージ処理でマイナスにならないように
    if (gameState.battle.party.every(unit => unit.hp === 0)) {
        const name = gameState.battle.party[0].name + (gameState.battle.party.length === 1 ? "": "たち");
        addMessage(`　`);
        addMessage(`${name}は全滅した……`);
        battleResult(false); //敗北。相打ちでも敗北が優先
        return;
    } else if (gameState.battle.enemies.every(unit => unit.hp === 0)) {
        addMessage(`　`);
        addMessage(`すべての敵を倒した！`);
        battleResult(true); //勝利
        return;
    }

    // 全員行動済みならターン終了処理
    if (gameState.battle.turnOrder.length === 0) {
        battleTurnEnd();
        return;
    }

    // 味方ならコマンド選択を表示｜敵ならランダムに決定してコマンド実行処理
    gameState.battle.actor = gameState.battle.turnOrder.shift();
    gameState.battle.actor_stan = null;
    applyBatleStatus("act_before", gameState.battle.actor);

    // 麻痺等のスタン状態や戦闘不能なら次へ TODO: 行動不能判定
    if (gameState.battle.actor_stan || gameState.battle.actor.hp === 0) {
        battleExecCommand();
        return;
    }

    if (gameState.battle.party.includes(gameState.battle.actor)) {
        gameState.battle.phase = "command_waiting";// コマンドパネル描画
    } else {
        // TODO ランダムに敵の行動を決定
        const enemy_actions = [
            "attack", "attack", "attack", "guard",
            // TODO: とりあえず
            ...(gameState.battle.actor.skill_list)
        ];
        const enemy_action = enemy_actions[Math.floor(Math.random() * enemy_actions.length)];
        if (enemy_action === "attack") {
            gameState.battle.pendingCommand = new Proxy({act: "attack", actDetail: null, targets: [gameState.battle.party[Math.floor(Math.random() * gameState.battle.party.length)].id]}, {set: setAndRender});
        } else if (enemy_action === "guard") {
            gameState.battle.pendingCommand = new Proxy({act: "guard", actDetail: null, targets: [gameState.battle.actor.id]}, {set: setAndRender});
        } else {
            const skill = getSkillById(enemy_action);
            let units = TARGET_TYPE_EXTRACTOR[skill.target_type](gameState.battle.enemies, gameState.battle.party, gameState.battle.actor);
            // 選択が必要な種別の場合、対象をランダムに選択
            if (SELECT_TARGET_TYPE.includes(skill.target_type)) {
                units = [units[Math.floor(Math.random() * units.length)]];
            }
            gameState.battle.pendingCommand = new Proxy({act: "skill", actDetail: enemy_action, targets: units.map(unit => unit.id)}, {set: setAndRender});
        }
        battleExecCommand();
    }
}

/**
 * コマンド効果処理
 */
function battleExecCommand() {
    console.log(3);
    addMessage("　");
    gameState.battle.phase = "exec";// ログや演出のパネル描画
    const cmd = gameState.battle.pendingCommand;
    const targets = cmd.targets?.map(id => getUnitById(id));
    const actor = gameState.battle.actor;
    advanceTimeline(actor.id);

    if ( gameState.battle.actor.hp === 0) {
        // Nothing to do
    } else if (gameState.battle.actor_stan) {
        const status_def = BATTLE_STATUSES.find(_status => _status.id === gameState.battle.actor_stan);
        addMessage(status_def.stanMessageGen(gameState.battle.actor.name));
    } else if (cmd.act === "attack") {
        console.log("攻撃コマンドが実行されました")
        addMessage(`${actor.name} のこうげき！`);
        const dice = unitDiceCreate(actor);
        for (const target of targets) {
            const damage = calculateDiceDamage(
                actor, target,
                dice.dice, dice.sides, dice.flat,
                false,// TODO: 魔法武器とかが今後出れば
                dice.fix ?? 0, dice.armor_pierce ?? 0
            );
            applyDamage(target, damage, true);
        }
    } else if (cmd.act === "guard") {
        console.log("防御コマンドが実行されました")
        for (const target of targets) {
            addBattleStatus("guard", target, 1);
        }

    } else if (cmd.act === "skill") {
        console.log("スキルコマンドが実行されました")

        // TODO: 敵のスキル保持の仕組みがそもそもヤバいかも
        let skill = null;
        if (gameState.battle.enemies.includes(actor)) {
            skill = getSkillById(gameState.battle.pendingCommand.actDetail);
        } else {
            skill = gameState.battle.actor.skill_list.find(skill => skill.id === gameState.battle.pendingCommand.actDetail);
        }

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
                const unit_dice = unitDiceCreate(actor);
                for (const target of targets) {
                    // 戦技なら通常ダイスに加算
                    const dice = is_combat ? (unit_dice.dice ?? 0) + (effect.dice ?? 0) : (effect.dice ?? 0);
                    const sides = is_combat ? (unit_dice.sides ?? 0) + (effect.sides ?? 0) : (effect.sides ?? 0);
                    const flat = is_combat ? (unit_dice.flat ?? 0) + (effect.flat ?? 0) : (effect.flat ?? 0);
                    const fix = is_combat ? (unit_dice.fix ?? 0) + (effect.fix ?? 0) : (effect.fix ?? 0);
                    const armor_pierce = is_combat ? (unit_dice.armor_pierce ?? 0) + (effect.armor_pierce ?? 0) : (effect.armor_pierce ?? 0);
                    const damage = calculateDiceDamage(
                        actor, target,
                        dice, sides, flat,
                        effect.category === "magic" ? true : false,
                        fix ?? 0, armor_pierce ?? 0
                    );
                    applyDamage(target, damage, effect.category !== "magic");
                }
            } else if (effect.type === "heal") {
                for (const target of targets) {
                    const heal = calculateDiceHeal(
                        actor, target,
                        effect.dice, effect.sides, effect.flat,
                        effect.category === "magic" ? true : false,
                        effect.fix ?? 0
                    );
                    target.hp = Math.min(target.maxHp, target.hp + heal);
                    addMessage(`${target.name} は ${heal} 回復した！`);
                }
            } else if (effect.type === "add_state") {
                for (const target of targets) {
                    const is_magic = effect.category === "magic";
                    const is_success = calculateDiceChance(
                        actor, target, effect.stateId,
                        effect.dice, effect.sides, effect.flat,
                        is_magic,
                        effect.fix ?? 0
                    );
                    if (is_success) {
                        const turn = effect.turn;
                        // 魔法なら持続増減
                        if (is_magic) {
                            turn *= magicRate(attacker.int);
                            turn = Math.floor(turn);
                        }
                        addBattleStatus(effect.stateId, target, turn);
                    }
                }
            } else if (effect.type === "recover_state") {
                for (const target of targets) {
                    // その状態異常になっているか
                    if (!target.battle_status.some(s => s.type === effect.stateId)) {
                        continue;
                    }
                    const is_magic = effect.category === "magic";
                    const is_success = calculateDiceChance(
                        actor, target, effect.stateId,
                        effect.dice, effect.sides, effect.flat,
                        is_magic,
                        effect.fix ?? 0
                    );
                    if (is_success) {
                        recoverBattleStatus(effect.stateId, target);
                    }
                }
            } else if (effect.type === "revive") {
                for (const target of targets) {
                    if (!target.battle_status.some(s => s.type === "dead")) {
                        continue;
                    }
                    const is_magic = effect.category === "magic";
                    const is_success = calculateDiceChance(
                        actor, target, "dead",
                        effect.dice, effect.sides, effect.flat,
                        is_magic,
                        effect.fix ?? 0
                    );
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
                    const damage = calculateDiceDamage(
                        actor, target,
                        effect.dice, effect.sides, effect.flat,
                        false,
                        effect.fix ?? 0, effect.armor_pierce ?? 0
                    );
                    applyDamage(target, damage, false)
                }
            } else if (effect.type === "heal") {
                for (const target of targets) {
                    const heal = calculateDiceHeal(
                        actor, target,
                        effect.dice, effect.sides, effect.flat,
                        false,
                        effect.fix ?? 0
                    );
                    target.hp = Math.min(target.maxHp, target.hp + heal);
                    addMessage(`${target.name} は ${heal} 回復した！`);
                }
            } else if (effect.type === "add_state") {
                for (const target of targets) {
                    const is_success = calculateDiceChance(
                        actor, target, effect.stateId,
                        effect.dice, effect.sides, effect.flat,
                        false,
                        effect.fix ?? 0
                    );
                    if (is_success) {
                        const turn = effect.turn;
                        addBattleStatus(effect.stateId, target, turn);
                    }
                }
            } else if (effect.type === "recover_state") {
                for (const target of targets) {
                    // その状態異常になっているか
                    if (!target.battle_status.some(s => s.type === effect.stateId)) {
                        continue;
                    }
                    const is_success = calculateDiceChance(
                        actor, target, effect.stateId,
                        effect.dice, effect.sides, effect.flat,
                        false,
                        effect.fix ?? 0
                    );
                    if (is_success) {
                        recoverBattleStatus(effect.stateId, target)
                    }
                }
            } else if (effect.type === "revive") {
                for (const target of targets) {
                    // その状態異常になっているか
                    if (!target.battle_status.some(s => s.type === "dead")) {
                        continue;
                    }
                    const is_success = calculateDiceChance(
                        actor, target, "dead",
                        effect.dice, effect.sides, effect.flat,
                        false,
                        effect.fix ?? 0
                    );
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
        .filter((unit) => unit.hp === 0);
    gameState.battle.turnOrder = gameState.battle.turnOrder.filter(order =>
        !down_chara_list.some(unit => unit.id === order.id)
    );
    down_chara_list.forEach(unit => advanceTimeline(unit.id));

    gameState.battle.pendingCommand = new Proxy({}, {set: setAndRender});
    setTimeout(() => {
        battleFinishCommand();// 行動終了処理実行
    }, 100);
}

/**
 * コマンド効果終了処理
 */
function battleFinishCommand() {
    console.log(4);
    applyBatleStatus("act_after", gameState.battle.actor);
    gameState.battle.actor = null;
    gameState.battle.actor_stan = null;
    // 次の行動につなぐ
    setTimeout(battleExecOrder, 750);
}

/**
 * ターン終了処理
 */
function battleTurnEnd() {
    console.log(5);
    gameState.battle.phase = "pending";// ログパネル描画
    setTimeout(battleTurnStart, 750);
}

/**
 * 戦闘終了処理
 * @param {boolean} is_victory 
 */
function battleResult(is_victory) {
    gameState.battle.phase = "result";// ログパネル描画
    if (is_victory) {
        // 勝利時にリザルトを組み立ててセット
        const total_money = gameState.battle.enemies.reduce((acc, enemy) => acc + enemy.money, 0);
        const total_exp = gameState.battle.enemies.reduce((acc, enemy) => acc + enemy.exp, 0);
        const total_rank_exp = gameState.battle.enemies.reduce((acc, enemy) => acc + Math.floor(enemy.exp / 100) + 1, 0);

        // 経験値加算処理
        const level_ups = [];
        const rank_ups = [];
        for (const unit of player.party) {
            const mod_levels = addExp(unit, total_exp);
            if (mod_levels) {
                level_ups.push(mod_levels)
            }
            const mod_ranks = addRankExp(unit, total_rank_exp);
            if (mod_ranks) {
                rank_ups.push(mod_ranks)
            }
        }

        const drop_items = rollDropItems(gameState.battle.enemies);
        gameState.battle.result = {
            is_victory: true,
            exp: total_exp,
            gold: total_money,
            items: drop_items ?? null,
            levelUps: level_ups ?? null,
            rankUps: rank_ups ?? null,
        };
        gameState.battle.phase = "result";
    } else {
        gameState.battle.result.is_victory = false;
    }
}

/**
 * コマンド[こうげき|ぼうぎょ|スキル|アイテム]押下イベント
 * @param {*} e 
 * @returns 
 */
function onActSelect(e) {
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
            battleExecCommand();
            return;
        }
        // TODO:こうげき選択かつactorの攻撃タイプが全体かランダムのとき
    } else if (act === "guard") {
        // 防御なら自身を対象に行動
        gameState.battle.pendingCommand.actDetail = null;
        gameState.battle.pendingCommand.targets = [gameState.battle.actor.id];
        battleExecCommand();
        return;
    } else if (act === "skill" && getUsableList(gameState.battle.actor.skill_list, "battle").length === 0) {
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
function onActDetailItemSelect(e) {
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
        battleExecCommand();
        return;
    }
}

/**
 * コマンド[スキル選択]押下イベント
 * @param {*} e 
 * @returns 
 */
function onActDetailSkillSelect(e) {
    const choice = e.target.closest('.cmd');
    if (!choice) return;

    const actDetail = choice.dataset.actDetail;
    if (actDetail === "back") {
        gameState.battle.pendingCommand.act = null;
        return;
    }

    const skill =  gameState.battle.actor.skill_list.find(skill => skill.id === actDetail);
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
        battleExecCommand();
        return;
    }
}

/**
 * コマンド[対象選択]押下イベント
 * @param {*} e 
 * @returns 
 */
function onTargetSelect(e) {
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
    battleExecCommand();
}

/**
 * 戦闘画面から戻る処理
 */
async function battleEnd() {
    gameState.currentScreen = 'main-game-screen';
    gameState.explorePhase = "idle";
    const result = gameState.battle.result;
    if (result.is_victory) {
        const enemy_name = gameState.battle.enemies[0].name + (gameState.battle.enemies.length === 1 ? "" : "たち");
        addMessage(`${enemy_name}を倒した！`);
        addMessage(`${result.gold}Gを手に入れた！`);
        player.money += result.gold;
        player.currentEventCompleted = true; // 戦闘イベント完了

        for (const item of result.items) {
            await acquireItem(item);
        }

        // 最終ボス撃破判定
        if (player.position === 100) {
            player.isCleared = true;
        }
    }
    checkGameEnd();
    saveGame(player); // 戦闘勝利後にセーブ
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
        attack: 35 + (job.growthRates.attack ?? 0),
        armor: 35 + (job.growthRates.armor ?? 0),
        speed: 35 + (job.growthRates.speed ?? 0),
        intel: 35 + (job.growthRates.intel ?? 0),
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
                if (!unit.skill_list.some((skill) => skill.id === skill_id)) {
                    unit.skill_list.push(getSkillById(skill_id));
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
        for (const drop of enemy.drop_items ?? []) {
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
        for (const status of target.battle_status) {
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
        target.battle_status = target.battle_status.filter(_status => false);
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

    const current_status = target.battle_status.find(s => s.type === state_id);
    if (!current_status) {
        target.battle_status.push({type: state_id, turn: turn});
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
    target.battle_status = target.battle_status.filter(_status => _status.type !== state_id);
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
function getUnitById(id) {
    return gameState.battle.party.find(unit => unit.id === id) ||
        gameState.battle.enemies.find(unit => unit.id === id);
}


// ============================================================================
// 7. ゲーム終了判定
// ============================================================================
function checkGameEnd() {
    if (getAliveUnits(player.party).length === 0 && !player.isGameOver) {
        systemHealAll();
        player.position = 0;
        player.isGameOver = false;
        player.isCleared = false;
        player.currentEventCompleted = false;
        player.savedEventCategory = null;
        player.savedEventIndex = null;
        // player.isGameOver = true;

        addMessage("HPが0になった... あなたの冒険はここで終わった...");
        saveGame(player);
        setTimeout(showGameOverScreen, 10);
        return true;
    }

    if (player.isCleared) {
        systemHealAll();
        player.position = 0;
        player.isGameOver = false;
        player.isCleared = false;
        player.currentEventCompleted = false;
        player.savedEventCategory = null;
        player.savedEventIndex = null;
        addMessage("暁の番人を打ち破り、あなたは新たな夜明けを迎えた！");
        saveGame(player);
        setTimeout(showClearScreen, 10);
        return true;
    }
    return false;
}

// ============================================================================
// 8. イベントリスナー
// ============================================================================
newGameButton.addEventListener("click", () => {
    deleteSaveData(); // 新しく始める場合はセーブデータを削除
    showCharacterCreationScreen();
});

loadGameButton.addEventListener("click", () => {
    const savedData = loadGame();
    if (savedData) {
        player = new Proxy(savedData.player, {
            set: setAndRender
        });
        gameState.dirty = true;
        showMainGameScreen();
        addMessage("セーブデータをロードしました。冒険を再開します.");
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
    showMainGameScreen();
    addMessage("新たな冒険が始まります！");
});

advanceButton.addEventListener("click", advance);
// attackButton.addEventListener("click", attack);

backToTitleFromGameOverButton.addEventListener("click", () => {
    // ゲームオーバー時はセーブデータを削除しないが、タイトルに戻る
    showTitleScreen();
});

backToTitleFromClearButton.addEventListener("click", () => {
    // クリア時はセーブデータを削除しないが、タイトルに戻る
    showTitleScreen();
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

debugStartCombatButton.addEventListener("click", () => {
    const enemyId = debugEnemySelect.value;
    debugStartCombat(enemyId);
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

// メニューボタンのイベントリスナー
menuButton.addEventListener("click", openMenuModal);

// モーダルの閉じるボタンのイベントリスナー
document.querySelector("#menu-modal .close-button").addEventListener("click", closeMenuModal);

// タブボタンのイベントリスナー
document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", (event) => {
        const tab = event.target.dataset.tab;
        gameState.menuTab = tab;
    });
});

// ============================================================================
// 9. 初期化
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    showTitleScreen();
});