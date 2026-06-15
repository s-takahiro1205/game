// 画面描画

import { player, gameState, useItem, equip, unequip, getUsableList, getRequiredExp, getRequiredRankExp } from './game.js';
import { loadGame } from './save.js';
import { JOBS } from './data/jobs.js';
import { BATTLE_STATUSES, TARGET_TYPE_EXTRACTOR } from './const.js';

// DOM Elements
// TODO:精査してね
const titleScreen = document.getElementById("title-screen");
const newGameButton = document.getElementById("new-game-button");
const loadGameButton = document.getElementById("load-game-button");

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
const menuButton = document.getElementById("menu-button");

// 戦闘画面
const battleScreen = document.getElementById("battle-screen");
const partyPanel = document.getElementById("party-panel");
const enemyPanel = document.getElementById("enemy-panel");
const timelinePanel = document.getElementById("timeline-panel");
const battleMessage = document.getElementById("battle-message");
const alertPanel = document.getElementById("alert-panel");
const commandPanel = document.getElementById("command-panel");
const itemPanel = document.getElementById("item-panel");
const skillPanel = document.getElementById("skill-panel");
const targetPanel = document.getElementById("target-panel");
const resultPanel = document.getElementById("result-panel");
const resultTitle = document.getElementById("result-title");

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
        renderBattle();
        updateEnemyStatus();
        updatePartyStatus();
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
    // TODO: この処理危うい
    if (player.party[0].name === "デバッグ" && gameState.currentScreen === 'main-game-screen') {
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
 * TODO: 再定義
 */
function updatePlayerStatus() {
    const hpPercentage = Math.max((player.party[0].hp / player.party[0].maxHp) * 100);

    if (gameState.currentScreen === 'battle-screen') {
        // battlePlayerDisplayName.textContent = player.name;
        // battlePlayerHpText.textContent = `${player.hp}/${player.maxHp}`;
        // battleHpBarFill.style.width = `${hpPercentage}%`;
        if (hpPercentage <= 25) {
            gameHpBarFill.classList.add("low-hp");
        } else {
            gameHpBarFill.classList.remove("low-hp");
        }
    } else {
        playerDisplayName.textContent = player.party[0].name;
        playerHpText.textContent = `${player.party[0].hp}/${player.party[0].maxHp}`;
        gameHpBarFill.style.width = `${hpPercentage}%`;
        if (hpPercentage <= 25) {
            gameHpBarFill.classList.add("low-hp");
        } else {
            gameHpBarFill.classList.remove("low-hp");
        }
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
 * TODO: 再定義
 */
function renderMenuStats() {
    const statusTab = document.getElementById("status-tab");
    // TODO: 仮作成
    let skill_names = "";
    player.party[0].skill_list.forEach(skill => {
        skill_names += "<p>・" + skill.name + "</p>";
    });
    const job = JOBS[player.party[0].currentJob];
    const job_history = player.party[0].jobs[player.party[0].currentJob];
    const rank_exp = job.maxRank === job_history.rank
                    ? "★"
                    : job_history.exp + "/" + getRequiredRankExp(job.id, job_history.rank);
    statusTab.innerHTML = `
        <div class="player-stats-display">
            <p>現在地: <span>${player.position}</span></p>
            <p>所持金: <span>${player.money}</span>G</p>
            <p>名前: <span>${player.party[0].name}</span></p>
            <p></p>
            <p>レベル: <span>${player.party[0].level}</span></p>
            <p>経験値: <span>${player.party[0].exp} / ${getRequiredExp(player.party[0].level)}</span></p>
            <p>職業: <span>${job.name} - ランク${job_history.rank}</span></p>
            <p>職業経験値: <span>${rank_exp}</span></p>
            <p>HP: <span>${player.party[0].hp}</span>/<span>${player.party[0].maxHp}</span></p>
            <p>MP: <span>${player.party[0].mp}</span>/<span>${player.party[0].maxMp}</span></p>
            <p>攻撃力: <span>${player.party[0].attack}</span></p>
            <p>防御力: <span>${player.party[0].armor}</span></p>
            <p>速度: <span>${player.party[0].speed}</span></p>
            <p>知能: <span>${player.party[0].intel}</span></p>
            <p>器用: <span>${player.party[0].dex}</span></p>
            <p>体格: <span>${player.party[0].size}</span></p>
            <p>行動回数: <span>${player.party[0].multi_action}</span></p>
            <p></p>
        </div>
        <div class="player-stats-display" style="grid-template-columns: 1fr; gap:0;">
            <p>習得スキル</p>
            ${skill_names}
        <div>
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
        if (item.uses) {
            itemCard.innerHTML += `<p style="margin: 0;">残り${item.uses}回</p>`;
        }
        itemCard.innerHTML += `
            ${effectText ? `<p class="item-effect-text">${effectText}</p>` : ""}
        `;
        if (item.usableIn.explore) {
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
 * 再定義
 */
function renderMenuEquip() {
    const equipmentTab = document.getElementById("equipment-tab");
    const equipmentSlots = equipmentTab.querySelector(".equipment-slots");
    equipmentSlots.innerHTML = ''; // クリア

    if (player.party[0].equipment_slot.length === 0) {
        equipmentSlots.innerHTML = "<p>装備中のアイテムはありません。</p>";
        return;
    }

    player.party[0].equipment_slot.forEach((item, index) => {
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
    // TODO: ここに置いてんじゃねーよバカ
    const LABEL = {
        maxHp: "最大HP", maxMp: "最大MP", attack: "攻撃力", armor: "防御力", speed: "速度", intel: "知能", dex: "器用", size: "体格" , multi_action: "行動回数",
        poizon: "毒", paralyze: "麻痺", sleep: "眠り", stan: "スタン", blind: "盲目", seal: "魔封じ", bind: "捕縛",
        alive_enemy_all: "敵全員", alive_enemy_random: "ランダムな敵1体", alive_enemy_one: "敵1体", dead_enemy_all: "戦闘不能中の敵全員", dead_enemy_random: "戦闘不能中のランダムな敵1体", dead_enemy_one: "戦闘不能中の敵1体",
        alive_ally_all: "味方全員", alive_ally_random: "ランダムな味方1体", alive_ally_one: "味方1体", dead_ally_all: "戦闘不能中の味方全員", dead_ally_random: "戦闘不能中のランダムな味方1体", dead_ally_one: "戦闘不能中の味方1体",
        alive_all: "全員", alive_random: "ランダムな1体", alive_one: "1体", dead_all: "戦闘不能中の全員", dead_random: "戦闘不能中のランダムな1体", dead_one: "戦闘不能中の1体",
    };

    if (item.effects && item.effects.length > 0) {
        parts.push(`対象 ${LABEL[item.use_target_type]}`)
        const diceLabelFun = (ef) => {return ef.fix ? ef.fix : ef.dice + "D" + ef.sides + "+" + ef.flat};
        item.effects.forEach(ef => {
            switch (ef.type) {
                case "heal":
                    parts.push(`HP +` + diceLabelFun(ef));
                    break;
                case "damage":
                    parts.push(`ダメージ ` + diceLabelFun(ef));
                    break;
                case "stat_change": {
                    const label = LABEL[ef.stat] || ef.stat;
                    const sign = ef.value >= 0 ? "+" : "";
                    parts.push(`${label} ${sign}` + diceLabelFun(ef));
                    break;
                }
                case "add_state": {
                    const label = LABEL[ef.stateId] || ef.stateId;
                    parts.push(`${label} 付与(約${ef.turn}ターン)`);
                    break;
                }
                case "recover_state": {
                    const label = LABEL[ef.stateId] || ef.stateId;
                    parts.push(`${label} 解除`);
                    break;
                }
                case "revive": {
                    const label = LABEL[ef.stateId] || ef.stateId;
                    parts.push(`蘇生`);
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
            const label = LABEL[stat] || stat;
            const sign = val >= 0 ? "+" : "";
            parts.push(`${label} ${sign}${val}`);
        });
    }

    if (item.dice_modifier) {
            const dice = (item.dice_modifier.dice >= 0 ? "" : "-") + item.dice_modifier.dice;
            const sides = (item.dice_modifier.sides >= 0 ? "" : "-") + item.dice_modifier.sides;
            const flat = (item.dice_modifier.flat >= 0 ? "+" : "-") + item.dice_modifier.flat;
            parts.push(`${dice}D${sides}${flat}`);
    }

    return parts.length > 0 ? parts.join(" / ") : null;
}


/* ======================
    戦闘
====================== */
function renderBattle() {
    // pending | command_waiting | exec | result
    const phase = gameState.battle.phase;
    if (phase === null) {
        return;
    }

    battleMessage.classList.add("hidden");
    alertPanel.classList.add("hidden");
    commandPanel.classList.add("hidden");
    skillPanel.classList.add("hidden");
    itemPanel.classList.add("hidden");
    targetPanel.classList.add("hidden");
    resultPanel.classList.add("hidden");

    if (phase === "start") {
        // 初期描画
        // パーティーカード生成
        createPartyPanel();
        // エネミーカード生成
        createEnemyPanel();
        // タイムライン初期化
        document.querySelectorAll('#timeline-panel > .timeline-unit').forEach(el => el.remove());
        // ログ表示
        battleMessage.classList.remove("hidden");
    } else if (phase === "turn_start") {
        showBanner();
        createTimeline();
        // ログ表示
        battleMessage.classList.remove("hidden");
    } else if (phase === "pending" || phase === "exec") {
        // ログ表示
        battleMessage.classList.remove("hidden");
    } else if (phase === "result") {
        // ログ表示
        // battleMessage.classList.remove("hidden");
        renderResultPanel();
        resultPanel.classList.remove("hidden");
    } else if (phase === "command_waiting") {
        if (gameState.battle.alert) {
            alertPanel.innerHTML = "";
            const p = document.createElement("p");
            p.textContent = gameState.battle.alert;
            alertPanel.appendChild(p);
            alertPanel.scrollTop = alertPanel.scrollHeight; // スクロールを一番下へ
            alertPanel.classList.remove("hidden");
            return;
        }
        // コマンドパネル表示
        if (!gameState.battle.pendingCommand.act) {
            // 基本行動4つのパネル表示
            commandPanel.classList.remove("hidden");
        } else if (gameState.battle.pendingCommand.act === "skill" && !gameState.battle.pendingCommand.actDetail) {
            // スキル一覧を生成
            renderSkillPanel();
            skillPanel.classList.remove("hidden");
        } else if (gameState.battle.pendingCommand.act === "item" && !gameState.battle.pendingCommand.actDetail) {
            // アイテム一覧を生成
            renderItemPanel();
            itemPanel.classList.remove("hidden");
        } else if (gameState.battle.pendingCommand.act) {
            // 対象選択
            if (gameState.battle.pendingCommand.act === "attack") {
                const candidates = TARGET_TYPE_EXTRACTOR["alive_enemy_one"]([], gameState.battle.enemies);
                renderTargetPanel(candidates);
                targetPanel.classList.remove("hidden");
            } else if (gameState.battle.pendingCommand.act === "skill" && gameState.battle.pendingCommand.actDetail) {
                const skill = gameState.battle.actor.skill_list.find(skill => skill.id === gameState.battle.pendingCommand.actDetail);
                const candidates = TARGET_TYPE_EXTRACTOR[skill.target_type](gameState.battle.party, gameState.battle.enemies);
                renderTargetPanel(candidates);
                targetPanel.classList.remove("hidden");
            } else if (gameState.battle.pendingCommand.act === "item" && gameState.battle.pendingCommand.actDetail) {
                const item = player.item_slot[gameState.battle.pendingCommand.actDetail];
                const candidates = TARGET_TYPE_EXTRACTOR[item.use_target_type](gameState.battle.party, gameState.battle.enemies);
                renderTargetPanel(candidates);
                targetPanel.classList.remove("hidden");
            }
        }
    }
}

/**
 * リザルトパネルを描画する
 */
function renderResultPanel() {
    const r = gameState.battle.result;
    if (!r) return;

    // 敗北時
    if (!gameState.battle.result.is_victory) {
        resultTitle.innerHTML = "パーティーは全滅した…";
    } else {
        resultTitle.innerHTML = "⚔️ 戦闘勝利！";
    }

    // EXP/Gold
    document.querySelector('#result-exp span').textContent = r.exp ?? 0;
    document.querySelector('#result-gold span').textContent = r.gold ?? 0;

    // 獲得アイテム
    const itemsList = document.getElementById('result-items-list');
    const itemsSection = document.getElementById('result-items-section');
    itemsList.innerHTML = '';
    if (r.items && r.items.length > 0) {
        itemsSection.classList.remove('hidden');
        r.items.forEach(item => {
            const p = document.createElement('p');
            p.textContent = `・${item.name}`;
            itemsList.appendChild(p);
        });
    } else {
        itemsSection.classList.add('hidden');
    }

    // レベルアップ
    const lvList = document.getElementById('result-levelup-list');
    const lvSection = document.getElementById('result-levelup-section');
    lvList.innerHTML = '';
    if (r.levelUps && r.levelUps.length > 0) {
        lvSection.classList.remove('hidden');
        r.levelUps.forEach(lu => {
            const card = document.createElement('div');
            card.className = 'result-levelup-card';
            const statLines = Object.entries(lu.statChanges || {})
                .map(([k, v]) => `${k} +${v}`)
                .join(' | ');
            card.innerHTML = `
                <strong>${lu.name}</strong>
                Lv${lu.before} → <span style="color:#ffd700">Lv${lu.after}</span>
                <br><small>ステータスアップ：${statLines}</small>
            `;
            lvList.appendChild(card);
        });
    } else {
        lvSection.classList.add('hidden');
    }

    // ランクアップ
    const rkList = document.getElementById('result-rankup-list');
    const rkSection = document.getElementById('result-rankup-section');
    rkList.innerHTML = '';
    if (r.rankUps && r.rankUps.length > 0) {
        rkSection.classList.remove('hidden');
        r.rankUps.forEach(ru => {
            const card = document.createElement('div');
            card.className = 'result-levelup-card';
            const statLines = Object.entries(ru.statChanges || {})
                .map(([k, v]) => `${k} +${v}`)
                .join(' | ');
            const skillLines = (ru.learnSkills ?? [])
                .join(' | ');
            card.innerHTML = `
                <strong>${ru.name}-${JOBS[ru.jobId].name}</strong>
                <span class="result-rankup-card">${ru.before}</span>
                → 
                <span class="result-rankup-card" style="color:#ffd700">${ru.after}</span>
                <br><small>ステータスアップ：${statLines}</small>
                <br><small>スキル習得：${skillLines}</small>
            `;
            rkList.appendChild(card);
        });
    } else {
        rkSection.classList.add('hidden');
    }

    resultPanel.classList.remove('hidden');
}

/**
 * ターン表示
 */
function showBanner() {
    const banner = document.createElement("div");
    banner.textContent = `第${gameState.battle.turn}ターン`;
    Object.assign(banner.style, {
        position: "fixed",
        inset: "50% 0 auto",
        transform: "translateY(-50%)",
        background: "rgba(0,0,0,.8)",
        color: "#fff",
        textAlign: "center",
        padding: "20px",
        fontSize: "32px",
        fontWeight: "bold",
        zIndex: "9999",
    });

    document.body.appendChild(banner);
    banner
        .animate(
        [
            { opacity: 0, transform: "translateY(-50%) scale(1.2)" },
            { opacity: 1, transform: "translateY(-50%) scale(1)" },
            { opacity: 1, transform: "translateY(-50%) scale(1)" },
            { opacity: 0, transform: "translateY(-50%) scale(.9)" },
        ],
        {
            duration: 2000,
            easing: "ease",
        }
        )
        .finished.then(() => banner.remove());
}

/**
 * 味方のステータス表示を更新する
 */
function updatePartyStatus() {
    gameState.battle.party.forEach(unit => {
        const card = document.querySelector(
            `.actor-card[data-id="${unit.id}"]`
        );
        if (!card) return;
        const hpPercentage = Math.max(
            (unit.hp / unit.maxHp) * 100,
            0
        );
        card.querySelector('.hp-label').textContent = `HP ${unit.hp}/${unit.maxHp}`;
        // 状態異常アイコンの描画
        if (unit.battle_status) {
            for (const status of unit.battle_status) {
                const status_def = BATTLE_STATUSES.find(_status => _status.id === status.type);
                card.querySelector('.hp-label').textContent += status_def.icon;
            }
        }
        // 戦闘不能ならクラスを追加
        card.classList.toggle("dead", unit.battle_status.some(s => s.type === "dead"));

        const hpFill = card.querySelector('.hp-bar-fill');
        hpFill.style.width = `${hpPercentage}%`;
        hpFill.classList.toggle('low-hp', hpPercentage <= 25);

        const mpPercentage = Math.max(
            (unit.mp / unit.maxMp) * 100,
            0
        );
        card.querySelector('.mp-label').textContent = `MP ${unit.mp}/${unit.maxMp}`;
        const mpFill = card.querySelector('.mp-bar-fill');
        mpFill.style.width = `${mpPercentage}%`;
    });
}

/**
 * 敵のステータス表示を更新する
 */
function updateEnemyStatus() {
    gameState.battle.enemies.forEach(unit => {
        const card = document.querySelector(
            `.enemy-card[data-id="${unit.id}"]`
        );
        if (!card) return;
        const hpPercentage = Math.max(
            (unit.hp / unit.maxHp) * 100,
            0
        );
        card.querySelector('.hp-label').textContent =`HP ${unit.hp}/${unit.maxHp}`;
        // 状態異常アイコンの描画
        if (unit.battle_status) {
            for (const status of unit.battle_status) {
                const status_def = BATTLE_STATUSES.find(_status => _status.id === status.type);
                card.querySelector('.hp-label').textContent += status_def.icon;
            }
        }
        // 戦闘不能ならクラスを追加
        card.classList.toggle("dead", unit.battle_status.some(s => s.type === "dead"));

        const hpFill = card.querySelector('.hp-bar-fill');
        hpFill.style.width = `${hpPercentage}%`;
        hpFill.classList.toggle('low-hp', hpPercentage <= 25);
    });
}

/**
 * パーティーパネル作成
 */
function createPartyPanel() {
    // 念のためクリア
    partyPanel.innerHTML = "";

    gameState.battle.party.slice(0, 4).forEach(actor => {
        const hpPercent = (actor.hp / actor.maxHp) * 100;
        const mpPercent = (actor.mp / actor.maxMp) * 100;

        const card = document.createElement("div");
        card.className = "actor-card";
        card.dataset.id = actor.id;

        card.innerHTML = `
            <div class="actor-name">
                ${actor.name}
                <!-- <span class="job ${actor.jobClass}">
                    ${actor.jobShort}
                </span> -->
                <span class="level">
                    Lv${actor.level}
                </span>
            </div>

            <div class="actor-info">
                <div class="portrait"></div>

                <div class="actor-status">

                    <div class="status-row hp-row">
                        <label class="hp-label">
                            HP ${actor.hp}/${actor.maxHp}
                        </label>
                        <div class="bar">
                            <div class="hp-bar-fill"
                                style="width:${hpPercent}%">
                            </div>
                        </div>
                    </div>

                    <div class="status-row mp-row">
                        <label class="mp-label">
                            MP ${actor.mp}/${actor.maxMp}
                        </label>
                        <div class="bar">
                            <div class="mp-bar-fill"
                                style="width:${mpPercent}%">
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;

        partyPanel.appendChild(card);
    });
}

/**
 * エネミーパネル作成
 */
function createEnemyPanel() {
    enemyPanel.innerHTML = "";
    for (const enemy of gameState.battle.enemies) {
        const enemyCard = document.createElement('div');
        enemyCard.classList.add("enemy-card");
        enemyCard.dataset.id = enemy.id;
        const hpPercentage = Math.max((enemy.hp / enemy.maxHp) * 100);
        // HP初期設定が出れば有効化
        // let addClass = "";
        // if (hpPercentage <= 25) {
        //     let addClass = "low-hp";
        // }
        enemyCard.innerHTML = `
            <div class="enemy-name">${enemy.name}</div>
            <div class="enemy-image"></div>
            <div class="hp-label"">HP ${enemy.hp}/${enemy.maxHp}</div>
            <div class="bar">
                <div class="hp-bar-fill" style="width: ${hpPercentage}%"></div>
            </div>
        `;

        enemyPanel.appendChild(enemyCard);
    }
}

/**
 * タイムライン作成
 */
function createTimeline() {
    const timelinePanel = document.getElementById("timeline-panel");
    const turnOrder = gameState.battle.turnOrder;

    const step = 86 / turnOrder.length;

    turnOrder.forEach((unit, index) => {
        const el = document.createElement("div");
        const type = gameState.battle.party.includes(unit) ? "ally" : "enemy";

        el.className = `timeline-unit ${type}`;
        el.dataset.id = unit.id;
        el.style.left = `${index * step + 7}%`;

        el.innerHTML = `
            <div class="timeline-icon"></div>
            <div class="timeline-name">${unit.name.substr(0,2)}</div>
        `;

        timelinePanel.appendChild(el);
    });
}

/**
 * アイテムボタン生成
 */
function renderItemPanel() {
    itemPanel.innerHTML = '';
    const backButton = document.createElement('button');
    backButton.classList.add('cmd', 'back');
    backButton.dataset.actDetail = "back";
    backButton.textContent = "戻る";
    itemPanel.appendChild(backButton);

    player.item_slot.forEach((item, index) => {
        if (!item.usableIn.battle) {
            return;
        }

        const button = document.createElement('button');
        button.classList.add('cmd', item.use_type);
        button.dataset.actDetail = item.uuid;
        button.innerHTML = item.name + "<br>" + (item.uses ? item.uses + "回" : "無制限");
        itemPanel.appendChild(button);
    });
}

/**
 * スキルボタン生成
 */
function renderSkillPanel() {
    skillPanel.innerHTML = '';
    const backButton = document.createElement('button');
    backButton.classList.add('cmd', 'back');
    backButton.dataset.actDetail = "back";
    backButton.textContent = "戻る";
    skillPanel.appendChild(backButton);

    getUsableList(gameState.battle.actor.skill_list, "battle").forEach((skill, index) => {
        const button = document.createElement('button');
        button.classList.add('cmd', skill.type);
        button.dataset.actDetail = skill.id;
        const cost_text = `(${Object.entries(skill.cost)
            .map(([key, value]) => `${key}:${value}`)
            .join(", ")})`;

        button.innerHTML = skill.name + (cost_text !== "()" ? "<br>" + cost_text : "");
        skillPanel.appendChild(button);
    });
}

/**
 * 対象選択生成
 * @param {*} candidates 
 */
function renderTargetPanel(candidates) {
    targetPanel.innerHTML = '';
    const backButton = document.createElement('button');
    backButton.classList.add('cmd', 'back');
    backButton.dataset.targets = "back";
    backButton.textContent = "戻る";
    targetPanel.appendChild(backButton);

    candidates.forEach((candidate, index) => {
        const button = document.createElement('button');
        button.classList.add('cmd', gameState.battle.party.includes(candidate) ? "ally" : "enemy");
        button.dataset.targets = candidate.id;
        button.textContent = candidate.name;
        // 状態異常アイコンの描画
        if (candidate.battle_status) {
            for (const status of candidate.battle_status) {
                const status_def = BATTLE_STATUSES.find(_status => _status.id === status.type);
                button.textContent += status_def.icon;
            }
        }
        targetPanel.appendChild(button);
    });
}
