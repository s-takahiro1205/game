// ゲームロジック・状態管理・メインループ

import { saveGame, loadGame, deleteSaveData } from './save.js';
import { ITEMS } from './data/items.js';
import { NORMAL_EVENTS, BENEFIT_EVENTS, DANGER_EVENTS, MILESTONE_EVENTS_DATA, EVENTS, generateRandomEvent } from './data/events.js';
import { scheduleRender } from './render.js';

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
 * @property {number} uses - 使用可能回数（消費アイテム。装備は0）
 * @property {object | null} stat_modifier - 増減ステータス（例: { attack: +5, armor: +2 }）
 * @property {"weapon" | "armor" | "shield" | "accessory" | null} equip_type - 装備種別
 */

// Proxy用描画付きセット
const setAndRender = (target, prop, value) => {
    target[prop] = value;
    scheduleRender(); // 描画
    return true;
};

export let player = new Proxy({
        name: "",
        hp: 0,
        maxHp: 0,
        attack: 0,
        position: 0,
        isGameOver: false,
        isCleared: false,
        currentEventCompleted: false, // 現在のマスでのイベントが完了したか
        savedEventCategory: null, // セーブされたイベントのカテゴリ
        savedEventIndex: null,    // セーブされたイベントのインデックス
        armor: 0,
        speed: 0,
        intel: 0,
        dex: 0,
        size: 0,
        money: 0,
        item_slot: [],       // 最大20
        equipment_slot: []  // 最大5
    },
    {
        set: setAndRender
});

// ゲーム管理用Proxyオブジェクト
export const gameState = new Proxy({
        // ページ制御
        currentScreen: null,
        // 探索内サブ状態
        explorePhase: null,// "idle" | "rolling" | "event_resolve" | "choice"
        // 戦闘内サブ状態
        combatPhase: null,// "start" | "command_waiting" | "exec" | "enemy_act" | "result",
        // // モーダル（currentPageと独立して重なる）
        // openModal: null | "menu" | "item_discard",
        // menuTab: "status" | "items" | "equipment",
        // // データ
        // currentEvent: null,
        // currentChoices: null,
        currentEnemy: null,
        // exploreLog: [],
        // combatLog: []
    },
    {
        set: setAndRender
});

// DOM Elements
const titleScreen = document.getElementById("title-screen");
const newGameButton = document.getElementById("new-game-button");
const loadGameButton = document.getElementById("load-game-button");
const strongNewGameButton = document.getElementById("strong-new-game-button");

const characterCreationScreen = document.getElementById("character-creation-screen");
const playerNameInput = document.getElementById("player-name");
const hpAllocationInput = document.getElementById("hp-allocation");
const attackAllocationInput = document.getElementById("attack-allocation");
const remainingPointsSpan = document.getElementById("remaining-points");
const displayHpSpan = document.getElementById("display-hp");
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

// 強くてニューゲーム用の表示要素
const strongNewGameStatsDisplay = document.getElementById("strong-new-game-stats-display");
const strongNewGameHpDisplay = document.getElementById("strong-new-game-hp");
const strongNewGameAttackDisplay = document.getElementById("strong-new-game-attack");
const strongNewGameArmorDisplay = document.getElementById("strong-new-game-armor");
const strongNewGameSpeedDisplay = document.getElementById("strong-new-game-speed");
const strongNewGameIntelDisplay = document.getElementById("strong-new-game-intel");
const strongNewGameDexDisplay = document.getElementById("strong-new-game-dex");
const strongNewGameSizeDisplay = document.getElementById("strong-new-game-size");

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
const gameHpBarFill = document.getElementById("game-hp-bar-fill");
const gameMessage = document.getElementById("game-message");
const choicesContainer = document.getElementById("choices-container");
const advanceButton = document.getElementById("advance-button");
const attackButton = document.getElementById("attack-button");
const surrenderButton = document.getElementById("surrender-button");
const menuButton = document.getElementById("menu-button");

const battleMessage = document.getElementById("battle-message");

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
            enemy: eventData.enemy ? JSON.parse(JSON.stringify(eventData.enemy)) : null,
            isMilestone: eventData.type === "milestone",
            choices: eventData.choices || null
        };
        displayMessage(`デバッグ: イベント「${triggeredEvent.title}」を強制実行します！`, false);
        displayCurrentEvent(triggeredEvent);
        player.position = eventId; // プレイヤー位置も更新
        saveGame(player);
    } else {
        displayMessage("デバッグ: 指定されたイベントが見つかりませんでした。", false);
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
 * デバッグ: 選択されたアイテムをプレイヤーに付与する
 */
async function debugAcquireItem() {
    const selectedItemId = debugItemSelect.value;
    if (selectedItemId) {
        const itemToGive = getItemById(selectedItemId);
        if (itemToGive) {
            await acquireItem(itemToGive);
            displayMessage(`デバッグ: ${itemToGive.name} を取得しました！`, false);
            saveGame(player); // アイテム取得後にセーブ
        } else {
            displayMessage("デバッグ: 指定されたアイテムが見つかりませんでした。", false);
        }
    } else {
        displayMessage("デバッグ: アイテムを選択してください。", false);
    }
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
    strongNewGameButton.classList.add("hidden");
    menuButton.classList.add("hidden");

    if (savedData) {
        // セーブデータが存在する場合
        if (savedData.player.isGameOver || savedData.player.isCleared) {
            // ゲームオーバーまたはクリア済みのセーブデータがある場合
            strongNewGameButton.classList.remove("hidden");
        } else {
            // 進行中のセーブデータがある場合
            loadGameButton.classList.remove("hidden");
        }
    }
}

/**
 * キャラクター作成画面を表示する
 * @param {boolean} isStrongNewGame - 強くてニューゲームかどうか (変更)
 * @param {string} inheritedName - 強くてニューゲームの場合に引き継ぐ名前
 * @param {number} inheritedMaxHp - 強くてニューゲームの場合に引き継ぐ最大HP
 * @param {number} inheritedAttack - 強くてニューゲームの場合に引き継ぐ攻撃力
 * @param {number} inheritedArmor - 強くてニューゲームの場合に引き継ぐアーマー
 * @param {number} inheritedSpeed - 強くてニューゲームの場合に引き継ぐ速度
 * @param {number} inheritedIntel - 強くてニューゲームの場合に引き継ぐ知能
 * @param {number} inheritedDex - 強くてニューゲームの場合に引き継ぐ器用
 * @param {number} inheritedSize - 強くてニューゲームの場合に引き継ぐ体格
 */
function showCharacterCreationScreen(isStrongNewGame = false, inheritedName = "名もなき探訪者", inheritedMaxHp = 0, inheritedAttack = 0, inheritedArmor = 0, inheritedSpeed = 0, inheritedIntel = 0, inheritedDex = 0, inheritedSize = 0) {
    gameState.currentScreen = 'character-creation-screen';

    if (isStrongNewGame) {
        // 強くてニューゲームの場合
        hpAllocationInput.classList.add("hidden");
        attackAllocationInput.classList.add("hidden");
        speedAllocationInput.classList.add("hidden");
        intelAllocationInput.classList.add("hidden");
        dexAllocationInput.classList.add("hidden");
        sizeAllocationInput.classList.add("hidden");
        remainingPointsSpan.parentElement.classList.add("hidden");

        strongNewGameStatsDisplay.classList.remove("hidden");
        strongNewGameHpDisplay.textContent = inheritedMaxHp;
        strongNewGameAttackDisplay.textContent = inheritedAttack;
        strongNewGameArmorDisplay.textContent = inheritedArmor;
        strongNewGameSpeedDisplay.textContent = inheritedSpeed;
        strongNewGameIntelDisplay.textContent = inheritedIntel;
        strongNewGameDexDisplay.textContent = inheritedDex;
        strongNewGameSizeDisplay.textContent = inheritedSize;

        // 名前入力以外は無効化
        playerNameInput.value = inheritedName;
        playerNameInput.disabled = false;
        startAdventureButton.disabled = false; // 名前入力のみなので常に有効
    } else {
        // 通常の新規ゲームの場合
        hpAllocationInput.classList.remove("hidden");
        attackAllocationInput.classList.remove("hidden");
        speedAllocationInput.classList.remove("hidden");
        intelAllocationInput.classList.remove("hidden");
        dexAllocationInput.classList.remove("hidden");
        sizeAllocationInput.classList.remove("hidden");
        remainingPointsSpan.parentElement.classList.remove("hidden");
        strongNewGameStatsDisplay.classList.add("hidden");

        // 初期値を設定
        playerNameInput.value = "名もなき探訪者";
        hpAllocationInput.value = 10;
        attackAllocationInput.value = 10;
        speedAllocationInput.value = 5;
        intelAllocationInput.value = 3;
        dexAllocationInput.value = 3;
        sizeAllocationInput.value = 3;
        updateAllocationDisplay();
    }
}

/**
 * メインゲーム画面を表示する
 */
function showMainGameScreen() {
    gameState.currentScreen = 'main-game-screen';
    populateDebugEnemySelect(); // デバッグ用敵選択を初期化
    populateDebugEventSelects(); // デバッグイベント選択を初期化
    populateDebugItemSelect(); // デバッグ用アイテム選択を初期化
    menuButton.classList.remove("hidden");

    // ロード時にイベントが未完了だった場合の処理
    if (!player.currentEventCompleted && player.savedEventCategory && player.savedEventIndex !== null) {
        const event = getEventFromSavedData(player.savedEventCategory, player.savedEventIndex);
        if (event) {
            displayCurrentEvent(event);
        } else {
            console.error("Saved event not found:", player.savedEventCategory, player.savedEventIndex);
            // フォールバックとして、現在の位置のイベントを再生成するか、エラーメッセージを表示する
            // 今回はエラーメッセージを表示し、進むボタンを有効にする
            displayMessage("セーブされたイベントが見つかりませんでした。先に進んでください。", false);
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
            enemy: eventData.enemy ? JSON.parse(JSON.stringify(eventData.enemy)) : null,
            isMilestone: category === "MILESTONE",
            choices: eventData.choices || null,
            eventCategory: category, // 保存用にカテゴリとインデックスをEventCell自体にも含める
            eventIndex: index
        };
    }
    return null;
}

/**
 * 戦闘画面を表示する
 * enemyは生オブジェクト
 */
function showBattleScreen(enemy) {
    gameState.currentScreen = 'battle-screen';
    gameState.combatPhase = "start";
    gameState.currentEnemy = new Proxy(enemy,
        {
            set: setAndRender
        });
    displayMessage(`\n${gameState.currentEnemy.description}`, false);
    displayMessage(`${gameState.currentEnemy.name}が現れた！戦闘開始！`);
    gameState.combatPhase = "command_waiting";
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
    const atkPts = parseInt(attackAllocationInput.value);
    const speedVal = parseInt(speedAllocationInput.value);
    const intelVal = parseInt(intelAllocationInput.value);
    const dexVal = parseInt(dexAllocationInput.value);
    const sizeVal = parseInt(sizeAllocationInput.value);

    const remaining = 34 - hpPts - atkPts - speedVal - intelVal - dexVal - sizeVal;

    remainingPointsSpan.textContent = remaining;
    displayHpSpan.textContent = `HP: ${hpPts * 2}`;
    displayAttackSpan.textContent = `攻撃力: ${atkPts}`;
    displaySpeedSpan.textContent = `速度: ${speedVal}`;
    displayIntelSpan.textContent = `知能: ${intelVal}`;
    displayDexSpan.textContent = `器用: ${dexVal}`;
    displaySizeSpan.textContent = `体格: ${sizeVal}`;

    // ポイントがマイナスになったり能力が最低値を下回ったらボタンを無効化
    if (remaining < 0 || hpPts < 5 || atkPts < 3 || speedVal < 3 || intelVal < 3 || dexVal < 3 || sizeVal < 3) {
        startAdventureButton.disabled = true;
    } else {
        startAdventureButton.disabled = false;
    }
}

/**
 * プレイヤーオブジェクトを初期化する
 * @param {boolean} isStrongNewGame - 強くてニューゲームかどうか
 * @param {number} inheritedMaxHp - 強くてニューゲームの場合に引き継ぐ最大HP
 * @param {number} inheritedAttack - 強くてニューゲームの場合に引き継ぐ攻撃力
 * @param {number} inheritedArmor - 強くてニューゲームの場合に引き継ぐアーマー
 * @param {number} inheritedSpeed - 強くてニューゲームの場合に引き継ぐ速度
 * @param {number} inheritedIntel - 強くてニューゲームの場合に引き継ぐ知能
 * @param {number} inheritedDex - 強くてニューゲームの場合に引き継ぐ器用
 * @param {number} inheritedSize - 強くてニューゲームの場合に引き継ぐ体格
 */
function initializePlayer(isStrongNewGame = false, inheritedMaxHp = 0, inheritedAttack = 0, inheritedArmor = 0, inheritedSpeed = 0, inheritedIntel = 0, inheritedDex = 0, inheritedSize = 0) {
    player.name = playerNameInput.value || "名もなき探訪者";
    player.position = 0;
    player.isGameOver = false;
    player.isCleared = false;
    player.currentEventCompleted = false;
    player.savedEventCategory = null;
    player.savedEventIndex = null;

    if (isStrongNewGame) {
        player.maxHp = inheritedMaxHp;
        player.attack = inheritedAttack;
        // 強くてニューゲームの場合、既存のステータスを引き継ぐ
        player.armor = inheritedArmor;
        player.speed = inheritedSpeed;
        player.intel = inheritedIntel;
        player.dex = inheritedDex;
        player.size = inheritedSize;
    } else {
        const hpPts = parseInt(hpAllocationInput.value);
        const atkPts = parseInt(attackAllocationInput.value);
        player.maxHp = hpPts * 2;
        player.attack = atkPts;
        player.armor = 0;
        player.speed = parseInt(speedAllocationInput.value);
        player.intel = parseInt(intelAllocationInput.value);
        player.dex = parseInt(dexAllocationInput.value);
        player.size = parseInt(sizeAllocationInput.value);
    }
    player.hp = player.maxHp;

    console.log("Player initialized:", player);
    saveGame(player); // 初期化時にセーブ
}

/**
 * アイテムをプレイヤーのアイテムスロットに追加する。
 * アイテムスロットが満杯の場合、プレイヤーに選択肢を提示する。
 * @param {Item} item - 取得しようとしているアイテムオブジェクト
 * @returns {Promise<boolean>} アイテムが正常に取得された場合はtrue、諦めた場合はfalseを返すPromise
 */
async function acquireItem(item) {
    if (player.item_slot.length < 20) {
        player.item_slot.push(item);
        displayMessage(`${item.name} を手に入れた！`);
        return true;
    } else {
        displayMessage("アイテムスロットが満杯です（20/20）。");
        displayMessage("アイテムの取得を諦めますか、それとも何かを捨てて取得しますか？");

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
                displayMessage("アイテムの取得を諦めました。");
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
                    displayMessage(`${itemToAcquireAfterDiscard.name} を手に入れた！`);
                    resolve(true); // 取得成功
                } else {
                    displayMessage("アイテムの破棄をキャンセルしました。アイテムの取得を諦めます。");
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
            displayMessage("破棄できるアイテムがありません。アイテムの取得を諦めます。");
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
                displayMessage(`${discardedItem.name} を捨てました。`);
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

// ============================================================================
// 4. UI更新関数
// ============================================================================
/**
 * ゲームメッセージをテキストエリアに表示する
 * TODO: いったんbattleにも追加している。のちのち分離。ログ管理
 * @param {string} message - 表示するメッセージ
 * @param {boolean} append - trueの場合、既存のメッセージに追加する
 */
function displayMessage(message, append = true) {
    let targetArea = null;
    if (gameState.currentScreen === 'battle-screen') {
        targetArea = battleMessage;
    } else {
        targetArea = gameMessage;
    }


    const p = document.createElement("p");
    p.textContent = message;
    if (append) {
        targetArea.appendChild(p);
    } else {
        targetArea.innerHTML = "";
        targetArea.appendChild(p);
    }
    targetArea.scrollTop = targetArea.scrollHeight; // スクロールを一番下へ\
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
            displayMessage(choice.outcomeText);
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
    displayMessage(`--- ${event.title} ---`, false); // 既存メッセージをクリアして表示
    displayMessage(event.text);

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
    } else if (event.enemy) {
        showBattleScreen({ ...event.enemy, currentHp: event.enemy.hp });
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
    const uniqueEnemies = new Map();

    EVENTS.forEach(event => {
        if (event.enemy && !uniqueEnemies.has(event.enemy.name)) {
            uniqueEnemies.set(event.enemy.name, event.enemy);
        }
    });

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "-- 敵を選択 --";
    debugEnemySelect.appendChild(defaultOption);

    uniqueEnemies.forEach(enemy => {
        const option = document.createElement("option");
        option.value = enemy.name;
        option.textContent = `${enemy.name} (HP:${enemy.hp} ATK:${enemy.attack} ARM:${enemy.armor} SPD:${enemy.speed})`;
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
 * @param {string} enemyName
 */
function debugStartCombat(enemyName) {
    if (!enemyName) {
        displayMessage("敵が選択されていません。", false);
        return;
    }
    if (gameState.currentScreen === 'battle-screen') {
        displayMessage("すでに戦闘中です。", false);
        return;
    }

    let enemyToFight = null;
    // EVENTS配列から敵データを探す
    for (const event of EVENTS) {
        if (event.enemy && event.enemy.name === enemyName) {
            enemyToFight = event.enemy;
            break;
        }
    }
    // DANGER_EVENTSからも探す (generateRandomEventで使われるため)
    if (!enemyToFight) {
        for (const eventData of DANGER_EVENTS) {
            if (eventData.enemy && eventData.enemy.name === enemyName) {
                enemyToFight = eventData.enemy;
                break;
            }
        }
    }
    // MILESTONE_EVENTS_DATAからも探す
    if (!enemyToFight) {
        for (const key in MILESTONE_EVENTS_DATA) {
            const milestoneEvent = MILESTONE_EVENTS_DATA[key];
            if (milestoneEvent.enemy && milestoneEvent.enemy.name === enemyName) {
                enemyToFight = milestoneEvent.enemy;
                break;
            }
        }
    }


    if (enemyToFight) {
        showBattleScreen({ ...enemyToFight, currentHp: enemyToFight.hp });
        displayMessage(`デバッグ: ${gameState.currentEnemy.name} との戦闘を開始します！`, false);
    } else {
        displayMessage(`デバッグ: 敵「${enemyName}」が見つかりませんでした。`, false);
    }
}

/**
 * クリックで消せるトースト通知を表示する
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
    showTab("status-tab");
    const menuModal = document.getElementById("menu-modal");
    menuModal.classList.remove("hidden");
    // 背景のスクロールを禁止
    document.body.style.overflow = "hidden";
}

/**
 * メニューモーダルを閉じる
 */
function closeMenuModal() {
    const menuModal = document.getElementById("menu-modal");
    menuModal.classList.add("hidden");
    // 背景のスクロール禁止を解除
    document.body.style.overflow = "auto";
}

/**
 * メニューモーダルのステータスタブを更新する
 * (renderMenuStatsにリネームし、表形式で全ステータスを表示するように変更)
 */
function renderMenuStats() {
    const statusTab = document.getElementById("status-tab");
    statusTab.innerHTML = `
        <div class="player-stats-display">
            <p>名前: <span>${player.name}</span></p>
            <p>現在地: <span>${player.position}</span></p>
            <p>HP: <span>${player.hp}</span>/<span>${player.maxHp}</span></p>
            <p>攻撃力: <span>${player.attack}</span></p>
            <p>防御力: <span>${player.armor}</span></p>
            <p>速度: <span>${player.speed}</span></p>
            <p>知能: <span>${player.intel}</span></p>
            <p>器用: <span>${player.dex}</span></p>
            <p>体格: <span>${player.size}</span></p>
            <p>所持金: <span>${player.money}</span>G</p>
        </div>
    `;
}

/**
 * アイテムの効果を人間が読める形式の文字列に変換する
 * @param {Item} item
 * @returns {string|null}
 */
function formatItemEffect(item) {
    const parts = [];
    const STAT_LABEL = { hp: "HP", attack: "攻撃力", armor: "防御力", speed: "速度", intel: "知能", dex: "器用", size: "体格" };

    if (item.effects && item.effects.length > 0) {
        item.effects.forEach(ef => {
            switch (ef.type) {
                case "heal":
                    if (ef.value !== undefined)      parts.push(`HP +${ef.value}`);
                    else if (ef.min !== undefined)   parts.push(`HP +${ef.min}〜${ef.max}`);
                    else if (ef.rate !== undefined)  parts.push(`HP +${ef.rate * 100}%`);
                    break;
                case "damage":
                    if (ef.value !== undefined)      parts.push(`ダメージ ${ef.value}`);
                    else if (ef.min !== undefined)   parts.push(`ダメージ ${ef.min}〜${ef.max}`);
                    break;
                case "stat_change": {
                    const label = STAT_LABEL[ef.stat] || ef.stat;
                    const sign = (ef.value ?? ef.min ?? 0) >= 0 ? "+" : "";
                    if (ef.value !== undefined)      parts.push(`${label} ${sign}${ef.value}`);
                    else if (ef.min !== undefined)   parts.push(`${label} ${sign}${ef.min}〜${ef.max}`);
                    break;
                }
                case "dice_check":
                    parts.push(`ダイスチェック (閾値:${ef.success_threshold})`);
                    break;
                case "acquire_item":
                    parts.push("アイテム獲得");
                    break;
            }
        });
    }

    if (item.stat_modifier) {
        Object.entries(item.stat_modifier).forEach(([stat, val]) => {
            const label = STAT_LABEL[stat] || stat;
            const sign = val >= 0 ? "+" : "";
            parts.push(`${label} ${sign}${val}`);
        });
    }

    return parts.length > 0 ? parts.join(" / ") : null;
}

/**
 * メニューモーダルのアイテムタブを更新する
 */
function renderMenuItems() {
    const itemsTab = document.getElementById("items-tab");
    const itemGrid = itemsTab.querySelector(".item-grid");
    itemGrid.innerHTML = '';

    if (player.item_slot.length === 0) {
        itemGrid.innerHTML = "<p>アイテムはありません。</p>";
        return;
    }

    player.item_slot.forEach((item, index) => {
        const itemCard = document.createElement("div");
        itemCard.classList.add("item-card");
        const effectText = formatItemEffect(item);
        itemCard.innerHTML = `
            <h4>${item.name}</h4>
            <p>${item.description}</p>`;
        if (item.uses > 0) {
            itemCard.innerHTML += `<p style="margin: 0;">残り${item.uses}回</p>`;
        }
        itemCard.innerHTML += `
            ${effectText ? `<p class="item-effect-text">${effectText}</p>` : ""}
        `;
        if (item.effects && item.effects.length > 0) {
            const useButton = document.createElement("button");
            useButton.classList.add("button");
            useButton.textContent = "使用";
            useButton.addEventListener("click", {item: item, handleEvent: useItem});
            itemCard.appendChild(useButton);
        }

        if (item.category === "equipment") {
            const equipButton = document.createElement("button");
            equipButton.classList.add("button");
            equipButton.textContent = "装備";
            equipButton.addEventListener("click", {item: item, handleEvent: equip});
            itemCard.appendChild(equipButton);
        }
        itemGrid.appendChild(itemCard);
    });
}

/**
 * 使用ボタンのイベント
 */
async function useItem(_) {
    for (const ef of this.item.effects) {
        await applyEffect(ef);
    }

    this.item.uses -= 1;
    if (this.item.uses <= 0) {
        player.item_slot = player.item_slot.filter(i => i !== this.item);
        const msg = `${this.item.name} を使い切った！`;
        displayMessage(msg);
        showToast(msg);
    } else {
        const msg = `${this.item.name} を使用した！`;
        displayMessage(msg);
        showToast(msg);
    }

    renderMenuItems();
    saveGame(player);
}

/**
 * 装備ボタンのイベント
 */
function equip(_) {
    // 1. 同タイプチェックを先に
    const sameType = player.equipment_slot.some(e => e.equip_type === this.item.equip_type);
    if (sameType) {
        showToast(`すでに${this.item.equip_type}を装備しています`);
        return;
    }

    // 2. 枠数チェック
    if (player.equipment_slot.length >= 5) {
        showToast("装備枠が一杯です");
        return;
    }

    // 3. stat_modifierをプレイヤーに反映
    if (this.item.stat_modifier) {
        Object.entries(this.item.stat_modifier).forEach(([stat, val]) => {
            player[stat] += val;
        });
    }

    player.equipment_slot.push(this.item);
    player.item_slot = player.item_slot.filter(i => i !== this.item);

    const equipMsg = `${this.item.name}を装備した`;
    displayMessage(equipMsg);
    showToast(equipMsg);
    renderMenuItems();
    renderMenuEquip();
    saveGame(player);
}

/**
 * メニューモーダルの装備タブを更新する
 */
function renderMenuEquip() {
    const equipmentTab = document.getElementById("equipment-tab");
    const equipmentSlots = equipmentTab.querySelector(".equipment-slots");
    equipmentSlots.innerHTML = ''; // クリア

    if (player.equipment_slot.length === 0) {
        equipmentSlots.innerHTML = "<p>装備中のアイテムはありません。</p>";
        return;
    }

    player.equipment_slot.forEach((item, index) => {
        const equipmentSlot = document.createElement("div");
        equipmentSlot.classList.add("equipment-slot");
        const effectText = formatItemEffect(item);
        equipmentSlot.innerHTML = `
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            ${effectText ? `<p class="item-effect-text">${effectText}</p>` : ""}
        `;
        // 戦闘中でないなら
        if (gameState.currentScreen !== 'battle-screen') {
            const unequipButton = document.createElement("button");
            unequipButton.classList.add("button");
            unequipButton.textContent = "解除";
            // unequipButton.dataset.equipmentIndex = index;
            unequipButton.addEventListener("click", {item: item, handleEvent: unequip});
            equipmentSlot.appendChild(unequipButton);
            equipmentSlots.appendChild(equipmentSlot);
        }
    });
}

/**
 * 装備解除ボタンのイベント
 */
function unequip(_) {
    // 1. アイテム枠チェック
    if (player.item_slot.length >= 20) {
        // displayMessage("アイテム枠が一杯で外せません");
        showToast("アイテム枠が一杯で外せません");
        return;
    }

    // 2. stat_modifierを戻す
    if (this.item.stat_modifier) {
        Object.entries(this.item.stat_modifier).forEach(([stat, val]) => {
            player[stat] -= val;
        });
    }

    player.item_slot.push(this.item);
    player.equipment_slot = player.equipment_slot.filter(i => i !== this.item);

    const unequipMsg = `${this.item.name}を外した`;
    displayMessage(unequipMsg);
    showToast(unequipMsg);
    renderMenuItems();
    renderMenuEquip();
    saveGame(player);
}

/**
 * 指定されたタブを表示し、他のタブを非表示にする
 * @param {string} tabId - 表示するタブのID (例: "status-tab")
 */
function showTab(tabId) {
    const tabs = document.querySelectorAll(".tab-content");
    tabs.forEach(tab => tab.classList.add("hidden"));
    document.getElementById(tabId).classList.remove("hidden");

    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => button.classList.remove("active"));
    document.querySelector(`.tab-button[data-tab="${tabId.replace("-tab", "")}"]`).classList.add("active");

    // タブが切り替わった際に内容を更新
    if (tabId === "status-tab") {
        renderMenuStats();
    } else if (tabId === "items-tab") {
        renderMenuItems();
    } else if (tabId === "equipment-tab") {
        renderMenuEquip();
    }
}

// ============================================================================
// 5. ゲームループ (「進む」ボタン押下時)
async function advance() {
    if (player.isGameOver || player.isCleared) return;

    // 現在のマスでのイベントが未完了の場合、先に進めない
    if (player.position > 0 && !player.currentEventCompleted) {
        displayMessage("現在のイベントを完了するまで先に進めません！", false);
        return;
    }

    gameState.explorePhase = "rolling";

    // 1. ダイスロール
    const roll = Math.ceil(Math.random() * 6);
    displayMessage(`🎲 ${roll}が出た！`, false); // 既存メッセージをクリアしてダイス結果を表示

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
        displayMessage(`${roll}マス進む（現在: ${player.position}マス）`);
        resolve();
    }, 1500)); // 1.5秒後にイベントテキストを追記

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
 * @param {Effect} effect - 適用する効果オブジェクト
 */
async function applyEffect(effect) {
    let value = 0;
    switch (effect.type) {
        case "heal":
            value = resolveValue(effect, player);
            player.hp = Math.min(player.hp + value, player.maxHp);
            displayMessage(`${value} HP回復した！`);
            break;
        case "damage":
            value = resolveValue(effect, player);
            const actualDamage = calculateDamage(value, player.armor);
            player.hp -= actualDamage;
            displayMessage(`${actualDamage} ダメージを受けた！ (元ダメージ: ${value}, あなたのアーマー: ${player.armor})`);
            break;
        case "stat_change":
            value = resolveValue(effect, player);
            player[effect.stat] = Math.max(0, player[effect.stat] + value);
            if (value > 0) {
                displayMessage(`${effect.stat} が ${value} 上がった！`);// TODO: effect.statに応じたラベル表示
            } else {
                displayMessage(`${effect.stat} が ${Math.abs(value)} 下がった！`);// TODO: effect.statに応じたラベル表示
            }
            break;
        case "dice_check":
            const roll = Math.ceil(Math.random() * 6);
            displayMessage(`🎲 ダイスロール！ ${roll} が出た！ (成功閾値: ${effect.success_threshold})`);

            if (roll >= effect.success_threshold) {
                displayMessage("ダイスロール成功！");
                if (effect.success_effect) {
                    // TODO: effectsにするか決断
                    displayMessage(effect.success_effect.text);
                    await applyEffect(effect.success_effect); // 成功時の効果を適用
                }
            } else {
                displayMessage("ダイスロール失敗...");
                if (effect.fail_effect) {
                    displayMessage(effect.fail_effect.text);
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
                displayMessage(`${effect.value}G を得た！`);
            } else {
                displayMessage(`${Math.abs(effect.value)}G 支払った。`);
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
 * @param player - プレイヤー
 * @returns {number} イベントの効果量
 */
function resolveValue(effect, player) {
    if (effect.min !== undefined && effect.max !== undefined) {
        return Math.floor(Math.random() * (effect.max - effect.min + 1)) + effect.min;
    }
    if (effect.rate !== undefined && effect.rate_reference !== undefined) {
        const base = player[effect.rate_reference];
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
 * ダメージ計算（アーマー軽減込み）
 * @param {number} rawDamage - 軽減前のダメージ
 * @param {number} targetArmor - 対象のアーマー値
 * @returns {number} 軽減後のダメージ
 */
function calculateDamage(rawDamage, targetArmor) {
    return Math.max(0, rawDamage - targetArmor);
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

    const playerStat = player[condition.stat];
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
// 6. 戦闘ロジック
// ============================================================================
async function attack() {
    if (player.isGameOver || player.isCleared) return;

    gameState.combatPhase = 'exec';

    let turnOrder = [];
    if (player.speed >= gameState.currentEnemy.speed) {
        turnOrder = ['player', 'enemy'];
    } else {
        turnOrder = ['enemy', 'player'];
    }

    for (const attacker of turnOrder) {
        if (player.isGameOver || player.isCleared) break; // 途中で戦闘終了した場合

        await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機

        if (attacker === 'player') {
            // プレイヤー攻撃
            const playerRawDmg = Math.ceil(Math.random() * player.attack);
            const actualDamageToEnemy = calculateDamage(playerRawDmg, gameState.currentEnemy.armor);
            gameState.currentEnemy.currentHp -= actualDamageToEnemy;
            displayMessage(`あなたの攻撃！ ${gameState.currentEnemy.name} に ${actualDamageToEnemy} のダメージ！ (元ダメージ: ${playerRawDmg}, 敵アーマー: ${gameState.currentEnemy.armor})`);

            if (gameState.currentEnemy.currentHp <= 0) {
                displayMessage(`${gameState.currentEnemy.name}を倒した！`);
                player.money += gameState.currentEnemy.money; // お金の加算
                displayMessage(`${gameState.currentEnemy.money}Gを手に入れた！`); // 獲得メッセージ
                gameState.combatPhase = "result";

                gameState.currentScreen = 'main-game-screen';
                gameState.explorePhase = "idle";
                gameState.currentEnemy = null; // 敵をクリア
                player.currentEventCompleted = true; // 戦闘イベント完了

                // 最終ボス撃破判定
                if (player.position === 100 && EVENTS[100].enemy.isBoss) {
                    player.isCleared = true;
                }
                checkGameEnd();
                saveGame(player); // 戦闘勝利後にセーブ
                return;
            }
        } else {
            // 敵攻撃
            const enemyRawDmg = Math.ceil(Math.random() * gameState.currentEnemy.attack);
            const actualDamageToPlayer = calculateDamage(enemyRawDmg, player.armor);
            player.hp -= actualDamageToPlayer;
            displayMessage(`${gameState.currentEnemy.name} の攻撃！ ${actualDamageToPlayer} のダメージを受けた！ (元ダメージ: ${enemyRawDmg}, あなたのアーマー: ${player.armor})`);

            if (player.hp <= 0) {
                checkGameEnd();
                saveGame(player); // ゲームオーバー時にセーブ
                return; // 戦闘終了
            }
        }
    }

    gameState.combatPhase = "command_waiting";
}

// ============================================================================
// 7. ゲーム終了判定
// ============================================================================
function checkGameEnd() {
    if (player.hp <= 0 && !player.isGameOver) {
        player.isGameOver = true;
        displayMessage("HPが0になった... あなたの冒険はここで終わった...");
        saveGame(player);
        setTimeout(showGameOverScreen, 3000); // 3秒後にゲームオーバー画面へ
        return true;
    }

    if (player.isCleared) {
        displayMessage("暁の番人を打ち破り、あなたは新たな夜明けを迎えた！");
        saveGame(player);
        setTimeout(showClearScreen, 3000); // 3秒後にクリア画面へ
        return true;
    }
    return false;
}

/**
 * プレイヤーが降参する
 */
function surrender() {
    closeMenuModal();
    player.isGameOver = true;
    displayMessage("あなたは降参した... 冒険はここで終わった...");
    saveGame(player);
    setTimeout(showGameOverScreen, 3000); // 3秒後にゲームオーバー画面へ
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
        player.name = player.name;//再描画用のムダ代入
        showMainGameScreen();
        displayMessage("セーブデータをロードしました。冒険を再開します.");
    } else {
        displayMessage("セーブデータが見つかりませんでした。", false);
        loadGameButton.classList.add("hidden"); // ボタンを非表示にする
    }
});

strongNewGameButton.addEventListener("click", () => {
    startStrongNewGame();
});

hpAllocationInput.addEventListener("input", updateAllocationDisplay);
attackAllocationInput.addEventListener("input", updateAllocationDisplay);
speedAllocationInput.addEventListener("input", updateAllocationDisplay);
intelAllocationInput.addEventListener("input", updateAllocationDisplay);
dexAllocationInput.addEventListener("input", updateAllocationDisplay);
sizeAllocationInput.addEventListener("input", updateAllocationDisplay);

startAdventureButton.addEventListener("click", () => {
    // 強くてニューゲームかどうかを判定
    const isStrong = strongNewGameStatsDisplay && !strongNewGameStatsDisplay.classList.contains("hidden");
    const inheritedMaxHp = isStrong ? parseInt(strongNewGameHpDisplay.textContent) : 0;
    const inheritedAttack = isStrong ? parseInt(strongNewGameAttackDisplay.textContent) : 0;
    const inheritedArmor = isStrong ? parseInt(strongNewGameArmorDisplay.textContent) : 0;
    const inheritedSpeed = isStrong ? parseInt(strongNewGameSpeedDisplay.textContent) : 0;
    const inheritedIntel = isStrong ? parseInt(strongNewGameIntelDisplay.textContent) : 0;
    const inheritedDex = isStrong ? parseInt(strongNewGameDexDisplay.textContent) : 0;
    const inheritedSize = isStrong ? parseInt(strongNewGameSizeDisplay.textContent) : 0;

    initializePlayer(isStrong, inheritedMaxHp, inheritedAttack, inheritedArmor, inheritedSpeed, inheritedIntel, inheritedDex, inheritedSize);
    showMainGameScreen();
    displayMessage("新たな冒険が始まります！");
});

advanceButton.addEventListener("click", advance);
attackButton.addEventListener("click", attack);
surrenderButton.addEventListener("click", surrender);

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
        displayMessage("デバッグ: イベントカテゴリとインデックスを選択してください。", false);
    }
});

debugStartCombatButton.addEventListener("click", () => {
    const enemyName = debugEnemySelect.value;
    debugStartCombat(enemyName);
});

debugAcquireItemButton.addEventListener("click", debugAcquireItem);

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
        showTab(`${tab}-tab`);
    });
});

/**
 * 強くてニューゲームを開始する
 */
function startStrongNewGame() {
    const savedData = loadGame();
    if (savedData && (savedData.player.isGameOver || savedData.player.isCleared)) {
        const inheritedName = savedData.player.name;
        const inheritedMaxHp = savedData.player.maxHp;
        const inheritedAttack = savedData.player.attack;
        const inheritedArmor = savedData.player.armor || 0;
        const inheritedSpeed = savedData.player.speed || 0;
        const inheritedIntel = savedData.player.intel || 0;
        const inheritedDex = savedData.player.dex || 0;
        const inheritedSize = savedData.player.size || 0;
        showCharacterCreationScreen(true, inheritedName, inheritedMaxHp, inheritedAttack, inheritedArmor, inheritedSpeed, inheritedIntel, inheritedDex, inheritedSize);
    } else {
        // エラーハンドリング、通常はここには来ないはず
        console.error("強くてニューゲームを開始できません。適切なセーブデータが見つかりません。");
        showTitleScreen();
    }
}

// ============================================================================
// 9. 初期化
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    showTitleScreen();
});