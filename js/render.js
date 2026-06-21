// 画面描画

import { player, gameState, getUsableList, getRequiredExp, getRequiredRankExp } from './game.js';
import { loadGame } from './save.js';
import { JOBS } from './data/jobs.js';
import { MAPS } from './data/maps.js';
import { EVENTS } from './data/events.js';
import { SCREENS, SUB_SCREENS, LABEL, BATTLE_STATUSES, TARGET_TYPE_EXTRACTOR } from './const.js';

// DOM Elements
// TODO:精査してね
const titleScreen = document.getElementById(SCREENS.titleScreen);

const characterCreationScreen = document.getElementById(SCREENS.characterCreationScreen);
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

// 拠点
const baseScreen = document.getElementById(SCREENS.baseScreen);
const baseSelectExploreMapScreen = document.getElementById(SUB_SCREENS.baseSelectExploreMapScreen);
const baseSelectExploreMapGrid = document.getElementById("base-select-explore-map-grid");

// 探索
const exploreScreen = document.getElementById("explore-screen");
const exploreMapTitle = document.getElementById("explore-map-title");
const baseExploreTileGrid = document.getElementById("explore-tile-grid");

const exploreEventScreen = document.getElementById(SUB_SCREENS.exploreEventScreen);
const exploreEventTitle = document.getElementById("explore-event-title");
const exploreEventFloorLabel = document.getElementById("explore-event-floor-label");
const exploreEventIllustBg = document.getElementById("explore-event-illust-bg");
const exploreEventSubEmoji = document.querySelectorAll('.explore-event-sub-emoji');
const exploreEventMainEmoji = document.getElementById('explore-event-main-emoji');
const exploreEventIllustMapTitleLabel = document.getElementById("explore-event-illust-map-title-label");
const exploreEventNarrativeText = document.getElementById("explore-event-narrative-text");
const exploreChoicesList = document.getElementById("explore-choices-list");

const exploreClearScreen = document.getElementById(SUB_SCREENS.exploreClearScreen);
const exploreGameOverScreen = document.getElementById(SUB_SCREENS.exploreGameOverScreen);

const mainGameScreen = document.getElementById(SCREENS.mainGameScreen);
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
const attackButton = document.getElementById("attack-button");
const battleEndButton = document.getElementById("battle-end");
const menuButton = document.getElementById("menu-button");

// 戦闘画面
const battleScreen = document.getElementById(SCREENS.battleScreen);
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

const gameOverScreen = document.getElementById(SCREENS.gameOverScreen);
const backToTitleFromGameOverButton = document.getElementById("back-to-title-from-gameover");
const clearScreen = document.getElementById(SCREENS.clearScreen);

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

    // デバッグパネルの表示/非表示
    debugPanel.classList.toggle("hidden", (!gameState.is_debug_mode || gameState.screen !== SCREENS.exploreScreen));

    // ============================================================================
    // 各画面固有の描画
    // ============================================================================

    // 拠点：探索マップ選択
    if (gameState.screen === SCREENS.baseScreen && gameState.subScreen === SUB_SCREENS.baseSelectExploreMapScreen) {
        renderBaseSelectExploreMap();
    }

    // 探索画面
    if (gameState.screen === SCREENS.exploreScreen && gameState.screen === gameState.subScreen) {
        renderExplore();
    } else if (gameState.subScreen === SUB_SCREENS.exploreEventScreen) {
        renderExploreEvent();
    }

    if (gameState.screen === SCREENS.battleScreen) {
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
        [SCREENS.titleScreen]: titleScreen,
        [SCREENS.characterCreationScreen]: characterCreationScreen,
        [SCREENS.baseScreen]: baseScreen,
        [SCREENS.exploreScreen]: exploreScreen,
        [SCREENS.battleScreen]: battleScreen,
    };
    const subScreens = {
        [SUB_SCREENS.baseSelectExploreMapScreen]: baseSelectExploreMapScreen,
        [SUB_SCREENS.exploreEventScreen]: exploreEventScreen,
        [SUB_SCREENS.exploreClearScreen]: exploreClearScreen,
        [SUB_SCREENS.exploreGameOverScreen]: exploreGameOverScreen,
    };
    for (const id in screens) {
        screens[id].classList.add("hidden");
        screens[id].classList.remove("active");
    }
    for (const id in subScreens) {
        // fade-inつきサブスクリーンはhiddenで管理
        if (subScreens[id].classList.contains("fade-in")) {
            subScreens[id].classList.add("hidden");
            subScreens[id].classList.remove("active");
        } else {
            subScreens[id].classList.add("close");
            subScreens[id].classList.remove("open");
        }
    }
    // メインスクリーンなら
    if (gameState.screen === gameState.subScreen) {
        screens[gameState.screen].classList.remove("hidden");
        screens[gameState.screen].classList.add("active");
    } else {
        if (gameState.subScreen === null) {
            return;
        }
        if (subScreens[gameState.subScreen].classList.contains("fade-in")) {
            subScreens[gameState.subScreen].classList.remove("hidden");
            subScreens[gameState.subScreen].classList.add("active");
        } else {
            subScreens[gameState.subScreen].classList.remove("close");
            subScreens[gameState.subScreen].classList.add("open");
        }
    }
}


// /**
//  * メニューモーダルのステータスタブを更新する
//  * TODO: 再定義
//  */
// function renderMenuStats() {
//     const statusTab = document.getElementById("status-tab");
//     // TODO: 仮作成
//     let skill_names = "";
//     player.party[0].skill_list.forEach(skill => {
//         skill_names += "<p>・" + skill.name + "</p>";
//     });
//     const job = JOBS[player.party[0].currentJob];
//     const job_history = player.party[0].jobs[player.party[0].currentJob];
//     const rank_exp = job.maxRank === job_history.rank
//                     ? "★"
//                     : job_history.exp + "/" + getRequiredRankExp(job.id, job_history.rank);
//     statusTab.innerHTML = `
//         <div class="player-stats-display">
//             <p>所持金: <span>${player.money}</span>G</p>
//             <p>名前: <span>${player.party[0].name}</span></p>
//             <p></p>
//             <p>レベル: <span>${player.party[0].level}</span></p>
//             <p>経験値: <span>${player.party[0].exp} / ${getRequiredExp(player.party[0].level)}</span></p>
//             <p>職業: <span>${job.name} - ランク${job_history.rank}</span></p>
//             <p>職業経験値: <span>${rank_exp}</span></p>
//             <p>HP: <span>${player.party[0].hp}</span>/<span>${player.party[0].maxHp}</span></p>
//             <p>MP: <span>${player.party[0].mp}</span>/<span>${player.party[0].maxMp}</span></p>
//             <p>攻撃力: <span>${player.party[0].attack}</span></p>
//             <p>防御力: <span>${player.party[0].armor}</span></p>
//             <p>速度: <span>${player.party[0].speed}</span></p>
//             <p>知能: <span>${player.party[0].intel}</span></p>
//             <p>器用: <span>${player.party[0].dex}</span></p>
//             <p>体格: <span>${player.party[0].size}</span></p>
//             <p>行動回数: <span>${player.party[0].multi_action}</span></p>
//             <p></p>
//         </div>
//         <div class="player-stats-display" style="grid-template-columns: 1fr; gap:0;">
//             <p>習得スキル</p>
//             ${skill_names}
//         <div>
//     `;
// }

// /**
//  * メニューモーダルのアイテムタブを更新する
//  */
// function renderMenuItems() {
//     const itemsTab = document.getElementById("items-tab");
//     const itemGrid = itemsTab.querySelector(".item-grid");
//     itemGrid.innerHTML = '';

//     if (player.item_slot.length === 0) {
//         itemGrid.innerHTML = "<p>アイテムはありません。</p>";
//         return;
//     }

//     player.item_slot.forEach((item, index) => {
//         const itemCard = document.createElement("div");
//         itemCard.classList.add("item-card");
//         const effectText = formatItemEffect(item);
//         itemCard.innerHTML = `
//             <h4>${item.name}</h4>
//             <p>${item.description}</p>`;
//         if (item.uses) {
//             itemCard.innerHTML += `<p style="margin: 0;">残り${item.uses}回</p>`;
//         }
//         itemCard.innerHTML += `
//             ${effectText ? `<p class="item-effect-text">${effectText}</p>` : ""}
//         `;
//         if (item.usableIn.explore) {
//             const useButton = document.createElement("button");
//             useButton.classList.add("button");
//             useButton.textContent = "使用";
//             useButton.addEventListener("click", {item: item, handleEvent: useItem});
//             itemCard.appendChild(useButton);
//         }

//         if (item.category === "equipment") {
//             const equipButton = document.createElement("button");
//             equipButton.classList.add("button");
//             equipButton.textContent = "装備";
//             equipButton.addEventListener("click", {item: item, handleEvent: equip});
//             itemCard.appendChild(equipButton);
//         }
//         itemGrid.appendChild(itemCard);
//     });
// }

// /**
//  * メニューモーダルの装備タブを更新する
//  * 再定義
//  */
// function renderMenuEquip() {
//     const equipmentTab = document.getElementById("equipment-tab");
//     const equipmentSlots = equipmentTab.querySelector(".equipment-slots");
//     equipmentSlots.innerHTML = ''; // クリア

//     if (player.party[0].equipment_slot.length === 0) {
//         equipmentSlots.innerHTML = "<p>装備中のアイテムはありません。</p>";
//         return;
//     }

//     player.party[0].equipment_slot.forEach((item, index) => {
//         const equipmentSlot = document.createElement("div");
//         equipmentSlot.classList.add("equipment-slot");
//         const effectText = formatItemEffect(item);
//         equipmentSlot.innerHTML = `
//             <h4>${item.name}</h4>
//             <p>${item.description}</p>
//             ${effectText ? `<p class="item-effect-text">${effectText}</p>` : ""}
//         `;
//         const unequipButton = document.createElement("button");
//         unequipButton.classList.add("button");
//         unequipButton.textContent = "解除";
//         // unequipButton.dataset.equipmentIndex = index;
//         unequipButton.addEventListener("click", {item: item, handleEvent: unequip});
//         equipmentSlot.appendChild(unequipButton);
//         equipmentSlots.appendChild(equipmentSlot);
//     });
// }

// /**
//  * アイテムの効果を人間が読める形式の文字列に変換する
//  * @param {Item} item
//  * @returns {string|null}
//  */
// function formatItemEffect(item) {
//     const parts = [];
//     if (item.effects && item.effects.length > 0) {
//         parts.push(`対象 ${LABEL[item.use_target_type]}`)
//         const diceLabelFun = (ef) => {return ef.fix ? ef.fix : ef.dice + "D" + ef.sides + "+" + ef.flat};
//         item.effects.forEach(ef => {
//             switch (ef.type) {
//                 case "heal":
//                     parts.push(`HP +` + diceLabelFun(ef));
//                     break;
//                 case "damage":
//                     parts.push(`ダメージ ` + diceLabelFun(ef));
//                     break;
//                 case "stat_change": {
//                     const label = LABEL[ef.stat] || ef.stat;
//                     const sign = ef.value >= 0 ? "+" : "";
//                     parts.push(`${label} ${sign}` + diceLabelFun(ef));
//                     break;
//                 }
//                 case "add_state": {
//                     const label = LABEL[ef.stateId] || ef.stateId;
//                     parts.push(`${label} 付与(約${ef.turn}ターン)`);
//                     break;
//                 }
//                 case "recover_state": {
//                     const label = LABEL[ef.stateId] || ef.stateId;
//                     parts.push(`${label} 解除`);
//                     break;
//                 }
//                 case "revive": {
//                     const label = LABEL[ef.stateId] || ef.stateId;
//                     parts.push(`蘇生`);
//                     break;
//                 }
//                 case "dice_check":
//                     parts.push(`ダイスチェック (閾値:${ef.success_threshold})`);
//                     break;
//                 case "acquire_item":
//                     parts.push("アイテム獲得");
//                     break;
//             }
//         });
//     }

//     if (item.stat_modifier) {
//         Object.entries(item.stat_modifier).forEach(([stat, val]) => {
//             const label = LABEL[stat] || stat;
//             const sign = val >= 0 ? "+" : "";
//             parts.push(`${label} ${sign}${val}`);
//         });
//     }

//     if (item.dice_modifier) {
//             const dice = (item.dice_modifier.dice >= 0 ? "" : "-") + item.dice_modifier.dice;
//             const sides = (item.dice_modifier.sides >= 0 ? "" : "-") + item.dice_modifier.sides;
//             const flat = (item.dice_modifier.flat >= 0 ? "+" : "-") + item.dice_modifier.flat;
//             parts.push(`${dice}D${sides}${flat}`);
//     }

//     return parts.length > 0 ? parts.join(" / ") : null;
// }


/* ======================
    探索マップ選択
====================== */
// TODO: 中身暫定
function renderBaseSelectExploreMap() {
    baseSelectExploreMapGrid.innerHTML = "";
    for (const map of gameState.selectExploreMap.mapList) {

        const btn = document.createElement("div");
        // TODO: highlightいらんかも
        btn.className = "base-btn highlight base-btn-wide";
        btn.dataset.mapId = map.id;
        // TODO: アイコンとか追加したら差し込み
        btn.innerHTML = `
                    <span class="base-btn-icon"></span>
                    <div>
                        <div class="base-btn-label">${map.name}</div>
                        <div class="base-btn-sub">${map.description}</div>
                    </div>
        `;

        baseSelectExploreMapGrid.appendChild(btn);
    }
}

/* ======================
    探索
====================== */
// TODO: 中身暫定
function renderExplore() {
    exploreMapTitle.innerHTML = "";
    exploreMapTitle.innerHTML = MAPS[player.explore.mapId].name;
    baseExploreTileGrid.innerHTML = "";
    baseExploreTileGrid.style.gridTemplateColumns = `repeat(${player.explore.map[0].length}, 1fr)`;
    [...player.explore.map].reverse().forEach((row, floor) =>{
        const realFloor = player.explore.map.length - floor;
        row.forEach((eventType, line) => {
            const btn = document.createElement("div");
            btn.className = "base-btn";
            btn.style.minHeight = "66px";
            // 自分のいるマスの前方3マスのみ選択可能
            if (player.explore.floor + 2 === realFloor
                && (player.explore.line - 1 <= line && line <= player.explore.line + 1)) {
                btn.dataset.line = line;
                btn.dataset.floor = realFloor - 1;
                btn.classList.add("highlight");
            } else if (player.explore.floor + 1 === realFloor && (line === player.explore.line)) {
                // 自分より後方のマスを非表示
                btn.classList.add("disabled");
            } else if (player.explore.floor + 2 >= realFloor && (player.explore.line - 1 < line || line < player.explore.line + 1)) {
                // 自分より後方のマスを非表示
                btn.classList.add("soft-hidden");
            }

            const tileLabel = {
                enemy: "⚔️戦闘",
                eliteEnemy: "💥強敵",
                boss: "☠️ボス",
                event: "⭐事件",
                rest: "🛖休息",
                adventurer: "💬遭遇",
            };
            btn.classList.add(row[line]);
            btn.innerHTML = `
                        <span class="base-btn-icon"></span>
                        <div>
                            <div class="base-btn-label">${tileLabel[row[line]]}</div>
                            <div class="base-btn-sub">${realFloor} - ${line + 1}</div>
                        </div>
            `;

            baseExploreTileGrid.appendChild(btn);
        });
    });
}

function renderExploreEvent() {
    // ヘッダー
    exploreEventTitle.innerHTML = "";
    exploreEventTitle.innerHTML = EVENTS[player.explore.event.eventId].name;
    exploreEventFloorLabel.innerHTML = "";
    exploreEventFloorLabel.innerHTML = `フロア ${player.explore.floor + 1}-${player.explore.line + 1}`;

    // イラストエリア
    const styleMap = {
        enemy: {
            emoji: '⚔️',
            subEmojis: [
                {e:'🛡️',top:'10%',left:'5%'},
                {e:'🔥',top:'15%',right:'8%'},
                {e:'💀',bottom:'30%',left:'10%'},
                {e:'🩸',bottom:'20%',right:'12%'},
            ],
            paperTone: 'linear-gradient(170deg,#8a2010 0%,#6a1808 40%,#4a1006 70%,#2a0802 100%)',
        },
        eliteEnemy: {
            emoji: '⚔️',
            subEmojis: [
                {e:'🛡️',top:'10%',left:'5%'},
                {e:'🔥',top:'15%',right:'8%'},
                {e:'💀',bottom:'30%',left:'10%'},
                {e:'🩸',bottom:'20%',right:'12%'},
            ],
            paperTone: 'linear-gradient(170deg,#8a2010 0%,#6a1808 40%,#4a1006 70%,#2a0802 100%)',
        },
        boss: {
            emoji: '☠️',
            subEmojis: [
                {e:'💥',top:'10%',left:'6%'},
                {e:'🩸',top:'18%',right:'9%'},
                {e:'⚡',bottom:'30%',left:'12%'},
                {e:'☠️',bottom:'22%',right:'10%'},
            ],
            paperTone: 'linear-gradient(170deg,#3a1808 0%,#2a1004 40%,#1a0802 70%,#0e0402 100%)',
        },
        event: {
            emoji: '📜',
            subEmojis: [
                {e:'✨',top:'12%',left:'8%'},
                {e:'🌿',top:'20%',right:'10%'},
                {e:'💎',bottom:'28%',left:'14%'},
                {e:'⚗️',bottom:'22%',right:'8%'},
            ],
            paperTone: 'linear-gradient(170deg,#c8a850 0%,#b09040 35%,#8a7028 70%,#6a5018 100%)',
        },
        adventurer: {
            emoji: '💬',
            subEmojis: [
            {e:'🪙',top:'10%',left:'6%'},
            {e:'🧪',top:'18%',right:'9%'},
            {e:'⚔️',bottom:'30%',left:'12%'},
            {e:'📦',bottom:'22%',right:'10%'},
            ],
            paperTone: 'linear-gradient(170deg,#2a3820 0%,#1e2c14 40%,#141e0e 70%,#0a1208 100%)',
        },
        rest: {
            emoji: '🏕️',
            subEmojis: [
            {e:'🌙',top:'10%',left:'6%'},
            {e:'⭐',top:'16%',right:'8%'},
            {e:'🌿',bottom:'28%',left:'12%'},
            {e:'🔥',bottom:'24%',right:'10%'},
            ],
            paperTone: 'linear-gradient(170deg,#1a3820 0%,#142c18 40%,#0e2010 70%,#081408 100%)',
        },
    }
    const eventType = player.explore.map[player.explore.floor][player.explore.line];
    const ev = styleMap[eventType];
    exploreEventIllustBg.style.background = [
        'radial-gradient(ellipse 90% 70% at 50% 35%,rgba(17, 15, 15, 0.1) 0%,transparent 65%)',
        'radial-gradient(circle at 10% 85%,rgba(0,0,0,.25) 0%,transparent 40%)',
        ev.paperTone
    ].join(',');

    // サブ絵文字
    exploreEventSubEmoji.forEach((el,i) => {
        const s = ev.subEmojis[i];
        if (!s) { el.style.display='none'; return; }
        el.style.display = '';
        el.textContent = s.e;
        el.style.top    = s.top    || '';
        el.style.left   = s.left   || '';
        el.style.right  = s.right  || '';
        el.style.bottom = s.bottom || '';
        if (!s.top)    el.style.removeProperty('top');
        if (!s.left)   el.style.removeProperty('left');
        if (!s.right)  el.style.removeProperty('right');
        if (!s.bottom) el.style.removeProperty('bottom');
    });

    exploreEventMainEmoji.style.opacity   = '0';
    exploreEventMainEmoji.style.transform = 'scale(.8)';
    setTimeout(() => {
        exploreEventMainEmoji.textContent    = ev.emoji;
        exploreEventMainEmoji.style.opacity  = '1';
        exploreEventMainEmoji.style.transform= 'scale(1)';
    }, 60);

    exploreEventIllustMapTitleLabel.innerHTML = "";
    exploreEventIllustMapTitleLabel.innerHTML = `${MAPS[player.explore.mapId].name} ${player.explore.floor + 1}-${player.explore.line + 1}`;

    exploreEventNarrativeText.innerHTML = "";
    exploreEventNarrativeText.innerHTML = `${convertRenderText(player.explore.event.node.text ?? "")}`;
    if (player.explore.event.node.type === "message") {
        for (const text of player.explore.event.beforeData.message) {
            exploreEventNarrativeText.innerHTML += `<br>${text}`;
        }
    }

    renderChoices();

}


function renderChoices() {
    exploreChoicesList.innerHTML = '';
    if (!player.explore.event.choices) {
        return;
    }
    player.explore.event.choices.forEach((choice, i) => {
        const div = document.createElement('div');
        div.className = `explore-choice-btn${choice.disabled ? ' disabled' : ''}`;
        // div.id = `choice-${i}`;
        div.dataset.next = choice.next;
        // 2回選択が有効な時用の判定
        if (player.explore.event.choice === choice.next) {
            div.classList.add('selected');
        }

        if (choice.unitId) {
            div.dataset.unitId = choice.unitId;
        }

        let reqHtml = '';
        // if (c.req) {
        //     const cls = { stat:'req-stat', item:'req-item', gold:'req-gold', ok:'req-ok' }[c.req.type] || 'req-ok';
        //     reqHtml = `<span class="choice-req ${cls}">${c.req.label}</span>`;
        // }

        div.innerHTML = `
            <div class="explore-choice-icon"></div>
            <div class="explore-choice-body">
                <div class="explore-choice-label">${choice.text}</div>
                ${choice.desc ? `<div class="explore-choice-desc">${choice.desc}</div>` : ''}
            </div>
            ${reqHtml}
        `;

        exploreChoicesList.appendChild(div);
    });
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

    // ログの更新
    battleMessage.innerHTML = "";
    for (const message of gameState.combatLog) {
        const p = document.createElement("p");
        p.textContent = message;
        battleMessage.appendChild(p);
    }
    battleMessage.scrollTop = battleMessage.scrollHeight; // スクロールを一番下へ

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
                const item = player.item_slot.find(item => item.uuid === gameState.battle.pendingCommand.actDetail);
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
    if (!gameState.battle.result.isVictory) {
        resultTitle.innerHTML = "パーティーは全滅した…";
    } else {
        resultTitle.innerHTML = "⚔️ 戦闘勝利！";
    }

    // EXP/Gold
    document.querySelector('#result-exp span').textContent = r.exp ?? 0;
    document.querySelector('#result-rank-exp span').textContent = r.rankExp ?? 0;
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
                ${JOBS[ru.jobId].maxRank === ru.after ? '<br><span class="result-rankup-card" style="color:#ffd700">★' + JOBS[ru.jobId].name + 'をマスターした！！</span>' : ''}
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

// 描画用のテキスト変換メソッド
function convertRenderText(text) {
    const map = {
        party0name : player.party[0].name,
        party1name : player.party[1]?.name,
        party2name : player.party[2]?.name,
        party3name : player.party[3]?.name,
    }

    return text.replace(
        new RegExp(Object.keys(map).join("|"), "g"),
        match => map[match]
        );
}