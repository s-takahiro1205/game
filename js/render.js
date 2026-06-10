// 画面描画

import { player, gameState } from './game.js';
import { loadGame } from './save.js';

// DOM Elements
// TODO:精査してね
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

const battleScreen = document.getElementById("battle-screen");
const battlePlayerDisplayName = document.getElementById("battle-player-display-name");
const battlePlayerHpText = document.getElementById("battle-player-hp-text");
const battleHpBarFill = document.getElementById("battle-hp-bar-fill");
const battleMessage = document.getElementById("battle-message");
const enemyStatusArea = document.getElementById("enemy-status-area");
const enemyDisplayName = document.getElementById("enemy-display-name");
const enemyHpBarFill = document.getElementById("enemy-hp-bar-fill");
const enemyHpText = document.getElementById("enemy-hp-text");

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

// レンダリング管理用　触らない
let renderReserved = false;

// レンダリングメソッド
function render() {
    showScreen();
    updatePlayerStatus();

    if (gameState.currentScreen === 'main-game-screen') {
        updateExploreCommand();
    }
    if (gameState.currentScreen === 'battle-screen') {
        updateEnemyStatus();
        updateCombatCommand();
    }
}

// レンダリング実行メソッド
export function scheduleRender() {
    if (renderReserved) return;
    renderReserved = true;
    requestAnimationFrame(() => {
        renderReserved = false;
        render();
    });
}

/**
 * 全てのゲーム画面を非表示にし、指定された画面を表示する
 * @param {HTMLElement} screenToShow - 表示する画面のDOM要素
 */
function showScreen() {
    const screens = {
        'title-screen': titleScreen,
        'character-creation-screen': characterCreationScreen,
        'main-game-screen': mainGameScreen,
        'battle-screen': battleScreen,
        'game-over-screen': gameOverScreen,
        'clear-screen': clearScreen
    };
    for (const id in screens) {
        screens[id].classList.add("hidden");
    }
    screens[gameState.currentScreen].classList.remove("hidden");
    screens[gameState.currentScreen].classList.add("active");

    // デバッグパネルの表示/非表示
    if (player.name === "デバッグ" && gameState.currentScreen === 'main-game-screen') {
        debugPanel.classList.remove("hidden");
    } else {
        debugPanel.classList.add("hidden");
    }
}

/**
 * プレイヤーデータを描画する
 * 現状名前とHPだけ
 */
function updatePlayerStatus() {
    const hpPercentage = (player.hp / player.maxHp) * 100;

    if (gameState.currentScreen === 'battle-screen') {
        battlePlayerDisplayName.textContent = player.name;
        battlePlayerHpText.textContent = `${player.hp}/${player.maxHp}`;
        battleHpBarFill.style.width = `${hpPercentage}%`;
        if (hpPercentage <= 25) {
            gameHpBarFill.classList.add("low-hp");
        } else {
            gameHpBarFill.classList.remove("low-hp");
        }
    } else {
        playerDisplayName.textContent = player.name;
        playerHpText.textContent = `${player.hp}/${player.maxHp}`;
        gameHpBarFill.style.width = `${hpPercentage}%`;
        if (hpPercentage <= 25) {
            gameHpBarFill.classList.add("low-hp");
        } else {
            gameHpBarFill.classList.remove("low-hp");
        }
    }
}

/**
 * 敵のステータス表示を更新する
 */
function updateEnemyStatus() {
    enemyDisplayName.textContent = gameState.currentEnemy.name;
    const hpPercentage = (gameState.currentEnemy.currentHp / gameState.currentEnemy.hp) * 100;
    enemyHpBarFill.style.width = `${hpPercentage}%`;
    enemyHpText.textContent = `${gameState.currentEnemy.currentHp}/${gameState.currentEnemy.hp}`;
}

/**
 * 探索コマンドの表示切替
 * TODO: 定数にあとで置き換え
 */
function updateExploreCommand() {
    if (gameState.explorePhase === "idle") {
        advanceButton.disabled = false;
        advanceButton.classList.remove("hidden");
    } else {
        // rolling | event_resolve | choice_waiting
        advanceButton.disabled = true;
        advanceButton.classList.add("hidden");        
    }

    if (gameState.explorePhase === "choice") {
        
    }
}


/**
 * 戦闘コマンドの表示切替
 * TODO: 定数にあとで置き換え
 */
function updateCombatCommand() {
    if (gameState.combatPhase === "command_waiting") {
        attackButton.disabled = false;
        attackButton.classList.remove("hidden");
    } else {
        // start | exec | enemy_act | result
        attackButton.disabled = true;
        attackButton.classList.add("hidden");        
    }
}
