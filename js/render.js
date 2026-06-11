// 画面描画

import { player, gameState, useItem, equip, unequip } from './game.js';
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
const battleEndButton = document.getElementById("battle-end");
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

const menuModal = document.getElementById("menu-modal");
const menuTabStatus = document.getElementById("status-tab");
const menuTabItems = document.getElementById("items-tab");
const menuTabEquipments = document.getElementById("equipment-tab");

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
    if (gameState.dirty) {
        gameState.dirty = false;
        return;// dirty=falseでもう一度走るためreturn
    }
    showScreen();
    updatePlayerStatus();
    updateLog();

    menuButton.classList.toggle("hidden", gameState.currentScreen !== 'main-game-screen');

    if (gameState.currentScreen === 'main-game-screen') {
        updateExploreCommand();
        updateModal();
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
 * 現在の画面に応じてログを表示する
 */
function updateLog() {
    if (gameState.currentScreen === 'main-game-screen') {
        gameMessage.innerHTML = "";
        for (const message of gameState.exploreLog) {
            const p = document.createElement("p");
            p.textContent = message;
            gameMessage.appendChild(p);
        }
        gameMessage.scrollTop = gameMessage.scrollHeight; // スクロールを一番下へ
    } else if (gameState.currentScreen === 'battle-screen') {
        battleMessage.innerHTML = "";
        for (const message of gameState.combatLog) {
            const p = document.createElement("p");
            p.textContent = message;
            battleMessage.appendChild(p);
        }
        battleMessage.scrollTop = battleMessage.scrollHeight; // スクロールを一番下へ
    }
}

/**
 * プレイヤーデータを描画する
 * 現状名前とHPだけ
 * 探索と戦闘
 */
function updatePlayerStatus() {
    const hpPercentage = Math.max((player.hp / player.maxHp) * 100);

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
 * 戦闘
 */
function updateEnemyStatus() {
    enemyDisplayName.textContent = gameState.currentEnemy.name;
    const hpPercentage = Math.max((gameState.currentEnemy.currentHp / gameState.currentEnemy.hp) * 100, 0);
    enemyHpBarFill.style.width = `${hpPercentage}%`;
    enemyHpText.textContent = `${gameState.currentEnemy.currentHp}/${gameState.currentEnemy.hp}`;
    if (hpPercentage <= 25) {
        enemyHpBarFill.classList.add("low-hp");
    } else {
        enemyHpBarFill.classList.remove("low-hp");
    }
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

    if (gameState.combatPhase === "result") {
        battleEndButton.disabled = false;
        battleEndButton.classList.remove("hidden");
    } else {
        // start | exec | enemy_act | command_waiting
        battleEndButton.disabled = true;
        battleEndButton.classList.add("hidden");
    }
}

/**
 * メニュー/アイテム破棄の表示切替
 * TODO: 定数にあとで置き換え
 */
function updateModal() {
    if (!gameState.openModal) {
        // 背景のスクロール禁止を解除
        document.body.style.overflow = "auto";
        menuModal.classList.add("hidden");
        return;
    }
    if (gameState.openModal === "menu") {
        // 背景のスクロールを禁止
        document.body.style.overflow = "hidden";
        menuModal.classList.remove("hidden");
        updateTab();
    } else {
        menuModal.classList.add("hidden");
    }
}

/**
 * 指定されたタブの内容を更新する
 */
function updateTab() {
    menuTabStatus.classList.toggle("hidden", gameState.menuTab !== "status");
    menuTabItems.classList.toggle("hidden", gameState.menuTab !== "items");
    menuTabEquipments.classList.toggle("hidden", gameState.menuTab !== "equipments");

    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => button.classList.remove("active"));
    document.querySelector(`.tab-button[data-tab="${gameState.menuTab}"]`).classList.add("active");

    // タブが切り替わった際に内容を更新
    if (gameState.menuTab === "status") {
        renderMenuStats();
    } else if (gameState.menuTab === "items") {
        renderMenuItems();
    } else if (gameState.menuTab === "equipments") {
        renderMenuEquip();
    }
}

/**
 * メニューモーダルのステータスタブを更新する
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
        const unequipButton = document.createElement("button");
        unequipButton.classList.add("button");
        unequipButton.textContent = "解除";
        // unequipButton.dataset.equipmentIndex = index;
        unequipButton.addEventListener("click", {item: item, handleEvent: unequip});
        equipmentSlot.appendChild(unequipButton);
        equipmentSlots.appendChild(equipmentSlot);
    });
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