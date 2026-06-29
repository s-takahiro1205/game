// 画面描画

import { player, gameState, getItemById, getUsableList, getRequiredExp, getRequiredRankExp, canEquip, calcAllStatus, checkJobCondition, getLevelUpText, getRankUpText } from './game.js';
import { loadGame } from './save.js';
import { JOBS } from './data/jobs.js';
import { MAPS } from './data/maps.js';
import { EVENTS } from './data/events.js';
import { SCREENS, SUB_SCREENS, BOTTOM_SHEETS, BOTTOM_MENU_TABS, LABEL, TRAITS, BATTLE_STATUSES, SEXES, RACES, EQUIP_CATEGORIES, EQUIP_TAGS, TARGET_TYPE_EXTRACTOR } from './const.js';

// DOM Elements
// TODO:精査してね
const titleScreen = document.getElementById(SCREENS.titleScreen);

const characterCreationScreen = document.getElementById(SCREENS.characterCreationScreen);
const playerNameInput = document.getElementById("player-name");
const hpAllocationInput = document.getElementById("hp-allocation");
const attackAllocationInput = document.getElementById("atk-allocation");
const remainingPointsSpan = document.getElementById("remaining-points");
const displayHpSpan = document.getElementById("display-hp");
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

// ヘッダー・メニュー
const menuOverlay = document.getElementById("menu-overlay");
const menuTabHome = document.getElementById("menu-tab-home");
const menuTabParty = document.getElementById("menu-tab-party");
const menuTabItems = document.getElementById("menu-tab-items");
const menuTabSetting = document.getElementById("menu-tab-setting");

const menuTabPartyMemberTabArea = document.getElementById("menu-tab-party-member-tab-area");

// モーダル
const modalOverlay = document.getElementById("modal-overlay");
const modalIcon = document.getElementById("modal-icon");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalActions = document.getElementById("modal-actions");
const modalInputContents = document.getElementById("modal-input-contents");
const modalTextInput = document.getElementById("modal-text-input");

// 拠点
const baseScreen = document.getElementById(SCREENS.baseScreen);
const changeJobScreen = document.getElementById(SUB_SCREENS.changeJobScreen);
const mansionScreen = document.getElementById(SUB_SCREENS.mansionScreen);
const baseSelectExploreMapScreen = document.getElementById(SUB_SCREENS.baseSelectExploreMapScreen);

// 転職
const jobMemberSelect = document.getElementById("job-member-select");


// マップ選択
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
    renderToast();
    const isShowModal = showModal();
    if (isShowModal) {
        return;
    }

    showScreen();

    // デバッグパネルの表示/非表示
    debugPanel.classList.toggle("hidden", (!gameState.isDebugMode || gameState.screen === SCREENS.battleScreen));

    // ============================================================================
    // 各画面固有の描画
    // ============================================================================

    // 拠点か探索メインならヘッダー、メニューの描画
    if (gameState.screen === SCREENS.baseScreen || gameState.subScreen === SCREENS.exploreScreen) {
        renderHeader();
        // メニューを開いているならメニュー内の描画
        if (gameState.bottomSheet === BOTTOM_SHEETS.menuOverlay) {
            renderMenu();
        }
    }

    // 拠点：サブ
    if (gameState.screen === SCREENS.baseScreen && gameState.subScreen === SUB_SCREENS.mansionScreen) {
        // 拠点：待機所
        renderBaseMansion();
    } else if (gameState.screen === SCREENS.baseScreen && gameState.subScreen === SUB_SCREENS.changeJobScreen) {
        // 拠点：転職
        renderBaseChangeJob();
    } else if (gameState.screen === SCREENS.baseScreen && gameState.subScreen === SUB_SCREENS.baseSelectExploreMapScreen) {
        // 拠点：探索マップ選択
        renderBaseSelectExploreMap();
    }

    // 探索画面
    if (gameState.screen === SCREENS.exploreScreen && gameState.screen === gameState.subScreen) {
        renderExplore();
    } else if (gameState.subScreen === SUB_SCREENS.exploreEventScreen) {
        renderExploreEvent();
    } else if (gameState.subScreen === SUB_SCREENS.exploreClearScreen) {
        document.getElementById("clear-map-name").innerHTML = MAPS[player.explore.mapId].name;
    }

    // 戦闘画面
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
        [SUB_SCREENS.mansionScreen]: mansionScreen,
        [SUB_SCREENS.changeJobScreen]: changeJobScreen,
        [SUB_SCREENS.baseSelectExploreMapScreen]: baseSelectExploreMapScreen,
        [SUB_SCREENS.exploreEventScreen]: exploreEventScreen,
        [SUB_SCREENS.exploreClearScreen]: exploreClearScreen,
        [SUB_SCREENS.exploreGameOverScreen]: exploreGameOverScreen,
    };
    const bottomSheets = {
        [BOTTOM_SHEETS.menuOverlay]: menuOverlay,
    };
    const bottomMenuTabs = {
        [BOTTOM_MENU_TABS.menuTabHome]: menuTabHome,
        [BOTTOM_MENU_TABS.menuTabParty]: menuTabParty,
        [BOTTOM_MENU_TABS.menuTabItems]: menuTabItems,
        [BOTTOM_MENU_TABS.menuTabSetting]: menuTabSetting,
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
    // ボトムシートの初期化
    for (const id in bottomSheets) {
        bottomSheets[id].classList.remove("open");
    }
    // メニュータブの初期化
    for (const id in bottomMenuTabs) {
        bottomMenuTabs[id].classList.remove("active");
    }
    // メニュータブのアクティブ解除
    document.querySelectorAll(".menu-nav-tab").forEach(ele => {
        ele.classList.remove("active");
    });
    document.querySelectorAll(".menu-tab-party-member-sub-tab").forEach(ele => {
        ele.classList.remove("active");
    });
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
    // ボトムシートオンなら
    if (gameState.bottomSheet) {
        bottomSheets[gameState.bottomSheet].classList.add("open");
        if (gameState.bottomSheet === BOTTOM_SHEETS.menuOverlay) {
            bottomMenuTabs[gameState.bottomMenuTabId].classList.add("active");
            renderMenuTabs();
            document.querySelector(`.menu-nav-tab[data-tab-id="${gameState.bottomMenuTabId}"]`).classList.add("active");
            document.querySelector(`.menu-tab-party-member-sub-tab[data-sub-type="${gameState.bottomMenuPartyTabSubType}"]`).classList.add("active");
        }
    }
}

/**
 * トーストを表示する
 * @returns boolean
 */
function renderToast() {
    const area = document.getElementById('toast-area');
    for(const toast of gameState.toast) {
        // すでにあるものは処理しない
        if (document.getElementById(toast.uuid)) {
            continue;
        }
        const el = document.createElement('div');
        el.id = toast.uuid;
        el.className = 'toast ' + toast.type;
        el.innerHTML = toast.text;
        area.appendChild(el);
    }
    for (const toastDiv of area.querySelectorAll('.toast')) {
        if (gameState.toast.some(toast => toast.uuid === toastDiv.id)) {
            continue;
        }
        toastDiv.classList.add("toast-leave")
        setTimeout(() => toastDiv.remove(), 320);
    }
}

/**
 * モーダルを表示する
 * @returns boolean
 */
function showModal() {
    if(!gameState.modal) {
        modalOverlay.classList.remove("active");
        return false;
    }

    // 選択肢
    modalActions.classList.add("hidden");
    modalTitle.innerHTML = gameState.modal.title;
    modalBody.innerHTML = gameState.modal.body;
    // modalIcon.innerHTML = gameState.modal.icon ?? "ⓘ";
    // 文字入力 初回表示だったか
    const isTextInputHidden = modalInputContents.classList.contains("hidden");
    modalInputContents.classList.add("hidden");
    modalTextInput.classList.add("hidden");

    if (gameState.modal.type === "choice") {
        modalActions.classList.remove("hidden");
        const actions = gameState.modal.actions.map(button => {
            const data = Object.keys(button.data).map(key => {
                return ` data-${key}="${button.data[key]}"`;
            });
            return `<button class="modal-btn ${button.type ?? ""}" ${data}>${button.text}</button>`;
        });
        modalActions.innerHTML = actions.join("");
    } else if (gameState.modal.type === "textInput") {
        if (isTextInputHidden) {
            modalTextInput.value = gameState.modal.default;
        }
        modalInputContents.classList.remove("hidden");
        modalTextInput.classList.remove("hidden");
    }
    modalOverlay.classList.add("active");
    return true;
}

/* ======================
    ヘッダー・メニュー
====================== */
// ヘッダーの描画更新
function renderHeader() {
    const hudStatMoney = document.querySelector(`#${gameState.subScreen} .hud-stat.money`);
    const hudStatDay = document.querySelector(`#${gameState.subScreen} .hud-stat.day`);
    if (hudStatMoney) {
        hudStatMoney.innerHTML = `🪙 ${player.money}`;
    }
    if (hudStatDay) {
        hudStatDay.innerHTML = `Day ${player.day}`;
    }
    // メニューが開いているならレンダリング
    const hud = document.querySelector(`#${gameState.subScreen} .hud-party-panel`);
    if (gameState.isHudOpen) {
        hud.classList.add("open");
        buildPartyGrid();
    } else {
        hud.classList.remove("open");
    }
}

//ヘッダー内パーティー表示の更新
function buildPartyGrid() {
    const grid = document.querySelector(`#${gameState.subScreen} .hud-party-grid`);
    if (!grid) return;
    grid.innerHTML = player.party.map(unit => {
        const buffedStatus = calcAllStatus(unit);
        const hp = Math.round(unit.hp/buffedStatus.maxHp*100);
        const mp = Math.round(unit.mp/buffedStatus.maxMp*100);
        return `<div class="hud-party-member">
        <!-- <div class="hud-party-icon">${unit.icon ?? ""}</div> -->
        <div class="hud-party-bars">
            <div class="hud-party-name">${unit.name} Lv${unit.level} (${JOBS[unit.currentJob].name} : ランク${unit.jobs[unit.currentJob].rank})</div>
            <div class="hud-party-bar-row"><span class="hud-party-bar-label">HP</span><div class="hud-party-bar-track"><div class="hud-party-bar-fill fill-hp" style="width:${hp}%"></div></div><span class="hud-party-bar-val">${unit.hp}</span></div>
            <div class="hud-party-bar-row"><span class="hud-party-bar-label">MP</span><div class="hud-party-bar-track"><div class="hud-party-bar-fill fill-mp" style="width:${mp}%"></div></div><span class="hud-party-bar-val">${unit.mp}</span></div>
            <!-- <div class="hud-party-status">${unit.cond}</div> -->
        </div>
        </div>`;
    }).join('');
    if (player.party.length < 4) {
        for (let i = player.party.length; i < 4; i++) {
            grid.innerHTML += `
                <div class="hud-party-member">
                    <div class="hud-party-name" style="margin:auto">-- empty --</div>
                </div>
            `;
        }
    }
}

function renderMenuTabs() {
    menuTabPartyMemberTabArea.innerHTML = "";
    for (const index in player.party) {
        const unit = player.party[index];
        const buffedStatus = calcAllStatus(unit);
        const hp = Math.round(unit.hp/buffedStatus.maxHp*100);
        const iconMap = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ"];
        menuTabPartyMemberTabArea.innerHTML += `<div class="menu-tab-party-member-tab${gameState.bottomMenuPartyTabIndex === parseInt(index) ? " active" : ""}" data-party-index="${index}">
            <span class="menu-tab-party-member-tab-icon">${iconMap[index]}</span>
            <span class="menu-tab-party-member-tab-name">${unit.name}</span>
            <span class="menu-tab-party-member-tab-hp">${hp >= 50 ? "🟢" : hp >= 20 ? "🟡" : "🔴"} ${unit.hp + "/" + buffedStatus.maxHp}<span>
        </div>`
    };
}

/**
 * メニュータブ内の描画
 * 現在のタブの情報のみ更新する
 */
function renderMenu() {
    if (gameState.bottomMenuTabId === BOTTOM_MENU_TABS.menuTabHome) {
    } else if (gameState.bottomMenuTabId === BOTTOM_MENU_TABS.menuTabParty) {
        const unit = player.party[gameState.bottomMenuPartyTabIndex];
        const buffedStatus = calcAllStatus(unit);
        const area = document.getElementById('menu-tab-party-member-content');
        const hpP = Math.round(unit.hp/buffedStatus.maxHp*100);
        const mpP = Math.round(unit.mp/buffedStatus.maxMp*100);
        if (gameState.bottomMenuPartyTabSubType === 'status') {
            const job = JOBS[unit.currentJob];
            const jobHistory = unit.jobs[unit.currentJob];
            const rankExp = job.maxRank === jobHistory.rank
                            ? "★"
                            : "ランク経験値: " + jobHistory.exp + " / " + getRequiredRankExp(job.id, jobHistory.rank);
            const exp = "経験値: " + unit.exp + " / " + getRequiredExp(unit.level);
            area.innerHTML = `<div class="status-panel">
            <div class="status-header">
                <!-- <div class="status-avatar">${unit.icon}</div> -->
                <div>
                <div class="status-name"><button class="status-rename-btn">🖌︎</button>${unit.name}</div>
                <div class="status-class">${RACES[unit.race].name} ${SEXES[unit.sex].name}</div>
                <div class="status-lv">Lv ${unit.level} - [${exp}]<br>${job.name} - ランク${jobHistory.rank} - [${rankExp}]</div>
                <!-- <div class="status-cond">${unit.cond}</div> -->
                </div>
            </div>
            <div class="status-bars-box">
                <div class="status-bar-row"><span class="status-bar-label">HP</span><div class="status-bar-track"><div class="status-bar-fill fill-hp" style="width:${hpP}%"></div></div><span class="status-bar-val">${unit.hp} / ${buffedStatus.maxHp}</span></div>
                <div class="status-bar-row"><span class="status-bar-label">MP</span><div class="status-bar-track"><div class="status-bar-fill fill-mp" style="width:${mpP}%"></div></div><span class="status-bar-val">${unit.mp} / ${buffedStatus.maxMp}</span></div>
            </div>`;
            const statuses = {
                atk: buffedStatus.atk,
                def: buffedStatus.def,
                spd: buffedStatus.spd,
                int: buffedStatus.int,
                dex: buffedStatus.dex,
                size: buffedStatus.size,
                hit: buffedStatus.hit,
                dodge: buffedStatus.dodge,
                critical: buffedStatus.critical,
                multiAction: buffedStatus.multiAction,
            };
            // TODO: 装備のstateModifierを収集して同じキーで格納し+値表示 buffedStatus一部解除
            area.innerHTML += `<div class="status-params">
                ${Object.entries(statuses).map(([k,v])=>`<div class="status-param"><span class="status-param-label">${LABEL[k]}</span><span class="status-param-val">${v}</span></div>`).join('')}</div>
            </div>`;
            // 職歴を表示
            area.innerHTML += `<div class="status-params-header">職歴</div>`
                + `<div class="status-params">
                ${Object.entries(unit.jobs).map(([k,v])=>`<div class="status-param"><span class="status-param-label">${JOBS[k].name}</span><span class="status-param-val">ランク${v.rank}</span></div>`).join('')}</div>
            </div>`;
            // 特性を表示
            area.innerHTML += `<div class="status-params-header">特性</div>`
                + `<div class="status-params" style="margin-bottom: 2em">`
                + (
                    buffedStatus.traits.length > 0
                        ? `${buffedStatus.traits.map(k => `<div class="status-param"><span class="status-param-label">${TRAITS[k].name}</span></div>`).join('')}`
                        : "なし"
                )
                + `</div>
            </div>`;
        } else if (gameState.bottomMenuPartyTabSubType === 'equip') {
            area.innerHTML = `<div class="equip-panel">${unit.equipmentSlot.map(e=>{
                const stats = e.equippedItem
                            ? Object.keys(e.equippedItem.statModifier).map(st => LABEL[st] + (e.equippedItem.statModifier[st] >= 0 ? "+" + e.equippedItem.statModifier[st] : e.equippedItem.statModifier[st])).join(" ")
                            : "";
                return `
            <div class="equip-slot" data-slot-id="${e.id}">
                <span class="equip-slot-label">${EQUIP_CATEGORIES[e.category].name}</span>
                <div class="equip-slot-icon">${e.icon||'─'}</div>
                <div class="equip-slot-info">${e.equippedItem
                ? `<div class="equip-slot-name rarity-${e.rarity ?? ""}">${e.equippedItem.name}</div><div class="equip-slot-stats">${stats}</div>`
                : `<div class="equip-slot-empty">未装備</div>`}</div>
                <span class="equip-slot-arrow">▶</span>
            </div>`}).join('')}
            </div>`;
        } else if (gameState.bottomMenuPartyTabSubType === 'equipChange') {
            area.innerHTML = "";
            renderEquipChange(area, unit);
        } else if (gameState.bottomMenuPartyTabSubType === "skill") {
            const tagList = {
                attack:'攻撃', heal:'回復', support:'補助',
                combat:'物理', magic:'魔法', special:'特殊',
            };
            area.innerHTML = `<div class="skill-panel">${unit.skillList.map(s=>{
            const effectLabels = s.effects.map(ef => {
                if(ef.type === "damage" || ef.type === "heal") {
                    return `威力 ${ef.fix ? ef.fix : ((ef.power * 100))}`
                            + `${ef.add ? `+${ef.add}`: ""}`
                            + `${ef.hit ? ` ${LABEL["hit"]}${ef.hit > 0 ? "+" : ""}${ef.hit}`: ""}`
                            + `${ef.critical ? ` ${LABEL["critical"]}${ef.critical > 0 ? "+" : ""}${ef.critical}`: ""}`
                            + `${ef.armor_pierce ? "(貫通)" + (ef.armor_pierce * 100) + "%" : ""}`
                            ;
                } else if(ef.type === "addState") {
                    return `付与:${LABEL[ef.stateId]} 約${ef.turn}ターン ${ef.fix}%`;
                } else if(ef.type === "recoverState") {
                    return `治癒:${LABEL[ef.stateId]} ${ef.fix}%`;
                } else if(ef.type === "revive") {
                    return `蘇生 ${ef.fix}%`;
                }
                return 
            });
            // 使用タイミングを満たさないか、コストが足りないか対象がいないならfalse
            const isDisabled = !s.usableIn[gameState.screen === SCREENS.baseScreen ? "home" : "explore"]
                || TARGET_TYPE_EXTRACTOR[s.target_type](player.party).length === 0
                || (s.cost && Object.keys(s.cost).some(key => unit[key] < s.cost[key]));
            return `
            <div class="skill-card">
                <div class="skill-icon">${s.icon ?? ""}</div>
                <div class="skill-info">
                    <div class="skill-name">${s.name}</div>
                    <div class="skill-tags">
                        ${`<span class="skill-tag tag-${s.type}">${tagList[s.type]}</span>`}
                        ${`<span class="skill-tag tag-${s.category}">${tagList[s.category]}</span>`}
                    </div>
                    <div class="skill-desc">${LABEL[s.target_type]}</div>
                    ${effectLabels.map(label => `<div class="skill-desc">${label}</div>`).join("")}
                    <div class="skill-cost">${Object.keys(s.cost).map(key => key + "" + (-1 * s.cost[key])).join(' ')}</div>
                    <!-- 下段：ボタン -->
                    <div class="skill-btn-buttons${!s.usableIn[gameState.screen === SCREENS.baseScreen ? "home" : "explore"] ? " hidden" : ""}">
                        <button class="skill-btn skill-btn-use"${isDisabled ? " disabled" : ' data-id="' + s.id + '"'}>使用</button>
                    </div>
                </div>
            </div>`}).join('')}
            </div>`;
        }
    } else if (gameState.bottomMenuTabId === BOTTOM_MENU_TABS.menuTabItems) {
        renderMenuItems();
    } else if (gameState.bottomMenuTabId === BOTTOM_MENU_TABS.menuTabSetting) {
    }
}

/**
 * 装備変更タブを描画する
 * @param {Object} area 
 */
function renderEquipChange(area, unit) {
    const grid = document.createElement("div");
    grid.classList.add("equip-grid");
    const slot = unit.equipmentSlot.find(s => s.id === gameState.equipChangeSlotId);
    const sameTypeItems = player.itemSlot.filter(item => item.category === "equipment" && item.equipCategory === slot.category);
    grid.innerHTML = sameTypeItems.map(item => {
        const effectLabels = item.effects
            ? item.effects.map(ef => {
                if(ef.type === "damage" || ef.type === "heal") {
                    return `威力 ${ef.fix ? ef.fix : (ef.min + "～" + ef.max)}`;
                } else if(ef.type === "addState") {
                    return `付与:${LABEL[ef.stateId]} 約${ef.turn}ターン ${ef.fix}%`;
                } else if(ef.type === "recoverState") {
                    return `治癒:${LABEL[ef.stateId]} ${ef.fix}%`;
                } else if(ef.type === "revive") {
                    return `蘇生 ${ef.fix}%`;
                }
                return 
            }) : [];
        if (item.statModifier) {
            effectLabels.push(...Object.keys(item.statModifier).map(key => {
                    return `${LABEL[key]}${item.statModifier[key] >= 0 ? "+" + item.statModifier[key] : item.statModifier[key]}`;
                }));
        }
        const iconMap = {
            attack: "💥", heal: "💚", mod_status: "💪",
            weapon: "⚔️", mainArmor: "🛡️", subArmor: "⛨", accessory: "💍",
        };
        // 装備できないならfalse
        const isDisabled = !canEquip(unit, item);
        return `
        <div class="equip-item${isDisabled ? " disabled" : ""}" data-item-uuid="${item.uuid}">
            <div class="equip-item-main">
                <div class="equip-item-icon" style="width:32px;height:32px;font-size:18px">${item.useType ? iconMap[item.useType] : (item.equipCategory ? iconMap[item.equipCategory] : "")}</div>
                <div>
                    <div class="equip-item-name" style="font-size:10px">${item.name}</div>
                    <div class="equip-item-sub" style="font-size:8px">${effectLabels||'—'}</div>`
                    + (item.equipTags || item.equipCondition ? `<div class="equip-item-tag" style="font-size:8px">タグ：${item.equipTags.map(t => EQUIP_TAGS[t].name).join("|")}</div>` : "")
                    +`
                </div>
            </div>
    </div>`}).join('');
    area.innerHTML += `<div class="equip-item-back base-btn base-btn-wide highlight" style="margin: 1em 2em; display: block;"><div class="base-btn-label" style="margin: auto;">戻る</div></div>`;
    // すでにそのスロットで装備しているなら装備解除ボタンを表示
    if (slot.equippedItem) {
        area.innerHTML += `<div class="equip-item-unequip base-btn base-btn-wide highlight" style="margin: 1em 2em; display: block;"><div class="base-btn-label" style="margin: auto; color: #FFF">装備解除</div></div>`;
    }
    area.appendChild(grid);
}

/* メニュー内アイテム */
function renderMenuItems() {
    const grid = document.getElementById('menu-tab-item-grid');
    grid.innerHTML = player.itemSlot.map(item => {
        const effectLabels = item.effects
            ? item.effects.map(ef => {
                if(ef.type === "damage" || ef.type === "heal") {
                    return `威力 ${ef.fix ? ef.fix : (ef.min + "～" + ef.max)}`;
                } else if(ef.type === "statChange") {
                    return `能力${ef.fix >= 0 ? "上昇" : "減少"}:${LABEL[ef.stat]} ${ef.prefix >= 0 ? "+" : ""}${ef.fix}`;
                } else if(ef.type === "addState") {
                    return `付与:${LABEL[ef.stateId]} 約${ef.turn}ターン ${ef.fix}%`;
                } else if(ef.type === "recoverState") {
                    return `治癒:${LABEL[ef.stateId]} ${ef.fix}%`;
                } else if(ef.type === "revive") {
                    return `蘇生 ${ef.fix}%`;
                } else if(ef.type === "addExp") {
                    return `経験値獲得 ${ef.fix}%`;
                } else if(ef.type === "addRankExp") {
                    return `ランク経験値獲得 ${ef.fix}%`;
                }
                return 
            }) : [];
        if (item.statModifier) {
            effectLabels.push(...Object.keys(item.statModifier).map(key => {
                    return `${LABEL[key]}${item.statModifier[key] >= 0 ? "+" + item.statModifier[key] : item.statModifier[key]}`;
                }));
        }
        const iconMap = {
            attack: "💥", heal: "💚", mod_status: "💪",
            weapon: "⚔️", mainArmor: "🛡️", subArmor: "⛨", accessory: "💍",
        };
        // 使用タイミングを満たさないか、対象がいないならfalse
        const isDisabled = !item.usableIn[gameState.screen === SCREENS.baseScreen ? "home" : "explore"]
            || TARGET_TYPE_EXTRACTOR[item.useTargetType](player.party).length === 0;
        return `
        <!-- 上段：既存コンテンツをrowでまとめる -->
        <div class="storage-item" data-item-uuid="${item.uuid}">
            <div class="storage-item-main" style="background:var(--panel2)">
                <div class="storage-item-icon" style="width:32px;height:32px;font-size:18px">${item.useType ? iconMap[item.useType] : (item.equipCategory ? iconMap[item.equipCategory] : "")}</div>
                <div>
                    <div class="storage-item-name" style="font-size:10px">${item.name}</div>
                    <div class="storage-item-sub" style="font-size:8px">${effectLabels||'—'}</div>
                </div>
            </div>
            <!-- 下段：ボタン -->
            <div class="storage-item-buttons">
                <button class="storage-btn storage-btn-use"${isDisabled ? " disabled" : ""}>使用</button>
                <button class="storage-btn storage-btn-discard">破棄</button>
            </div>
        ${item.uses>=1?`<div class="storage-item-qty">${item.uses}回</div>`:''}
        </div>`}).join('');
}

/* ======================
    待機所
====================== */
function renderBaseMansion() {
    document.getElementById("mansion-screen-back").classList.toggle("hidden", gameState.mansion.formationMode);
    document.getElementById("formation-start").classList.toggle("hidden", gameState.mansion.formationMode);
    document.getElementById("formation-cancel").classList.toggle("hidden", !gameState.mansion.formationMode);
    document.getElementById("formation-end").classList.toggle("hidden", !gameState.mansion.formationMode);
    document.getElementById("formation-end").classList.toggle("disabled", gameState.mansion.selectedIds.length === 0);
    // パーティー描画
    const row = document.getElementById('mansion-party-row');
    // 通常モード：現パーティ4スロット表示
    // 編成モード：選択中ユニットをスロットに反映
    const displayIds = gameState.mansion.formationMode ? gameState.mansion.selectedIds : player.party.map(unit => unit.id);
    row.innerHTML = '';
    for (let slot = 0; slot < 4; slot++) {
        const unitId = displayIds[slot];
        const all = [...player.party, ...player.standby];
        const unit = unitId ? all.find(x => x.id === unitId) : null;
        const div = document.createElement('div');
        div.className = `mansion-party-slot${unit ? '' : ' empty'}`;
        if (unit) {
        div.innerHTML = `
            <div class="mansion-party-slot-icon">${unit.icon ?? ""}</div>
            <div class="mansion-party-slot-name">${unit.name}</div>
            <div class="mansion-party-slot-job">Lv${unit.level}<br>${JOBS[unit.currentJob].name}-${unit.jobs[unit.currentJob].rank === JOBS[unit.currentJob].maxRank ? "マスター" : "ランク" + unit.jobs[unit.currentJob].rank}</div>`
        } else {
            div.innerHTML = `<div style="font-size:18px;color:var(--border)">＋</div><div class="mansion-party-slot-name" style="color:var(--text-dim)">空き</div>`;
        }
        row.appendChild(div);
    }

    // 待機ユニット描画
    const standbys = gameState.mansion.formationMode ? [...player.party, ...player.standby] : player.standby;
    const grid = document.getElementById('standby-grid');

    grid.innerHTML = standbys.map((unit) => {
        const selIdx = gameState.mansion.formationMode ? gameState.mansion.selectedIds.indexOf(unit.id) : -1;
        const isSel = selIdx >= 0;
        const inParty = player.party.some(_unit => _unit.id === unit.id);
        const unitBS = calcAllStatus(unit);

        const GKEYS = ['maxHp','maxMp','atk','def','spd','int','dex','size'];
        // 4列2行に分割（左カラム: HP/攻撃/速度/器用、右カラム: MP/防御/知能/体格）
        const LEFT  = ['maxHp','atk','spd','dex'];
        const RIGHT = ['maxMp','def','int','size'];
        const tableRows = LEFT.map((lk, ri) => {
            const rk = RIGHT[ri];
            return `<tr>
                <td class="standby-card-status-label">${LABEL[lk]}</td>
                <td><div class="standby-card-status-value">${unitBS[lk]}</div></td>
                <td style="width:8px"></td>
                <td class="standby-card-status-label">${LABEL[rk]}</td>
                <td><div class="standby-card-status-value">${unitBS[rk]}</div></td>
            </tr>`;
        }).join('');

        // ${job.name}${rankText}
        return `<div class="standby-card${gameState.mansion.formationMode ? ' selectable' : ''}${isSel ? ' selected' : ''}" data-unit-id="${unit.id}">
            <div class="standby-card-icon">
                ${unit.icon ?? ""}
                ${isSel ? `<div class="select-num-badge">${selIdx+1}</div>` : ''}
            </div>
            <div class="standby-card-name">
                ${unit.name}
                ${inParty ? '<span style="font-size:8px;color:var(--gold);margin-left:4px">編成中</span>' : ''}
            </div>
            <div class="standby-card-job">Lv${unit.level} [${JOBS[unit.currentJob].name}-${unit.jobs[unit.currentJob].rank === JOBS[unit.currentJob].maxRank ? "マスター" : "ランク" + unit.jobs[unit.currentJob].rank}]</div>
            <div class="standby-card-sub">${RACES[unit.race].name} ${SEXES[unit.sex].name}</div>
            <table class="standby-card-statuses">${tableRows}</table>
        </div>`;
    }).join('');
}

/* ======================
    転職
====================== */
function renderBaseChangeJob() {
    // ユニットカード描画
    jobMemberSelect.innerHTML = player.party.map(unit => `
            <div class="job-member-btn${unit.id === gameState.changeJob.unitId ? ' active' : ''}" data-id="${unit.id}">
                <span>${unit.icon ?? ""}</span>
                <span class="job-member-btn-name">${unit.name.slice(0, 5)}</span>
                <span class="job-member-btn-cls">Lv${unit.level}</span>
            </div>`).join('');
    
    // ジョブカード描画
    const grid = document.getElementById('job-grid');
    grid.innerHTML = Object.keys(JOBS).map((jobId) => {
        const unit = player.party.find(_unit => _unit.id === gameState.changeJob.unitId);
        const isCurrent = unit.currentJob === jobId;
        const isSelected = gameState.changeJob.jobId === jobId;
        const job = JOBS[jobId];
        // 表示条件を満たさないなら非表示
        if (job.visibleConditions !== {} && !checkJobCondition(unit, job.visibleConditions)) {
            return "";
        }

        // 成長率テーブル生成
        // g=0→↓↓  g=1→↓  g=2→─  g=3→↑  g=4→↑↑
        function arrows(g) {
            const up = `<span class="g-arrow g-up">↑</span>`;
            const mid = `<span class="g-arrow g-mid">-</span>`;
            const down = `<span class="g-arrow g-down">↓</span>`;
            if (g >= 100) return up + up + up;
            if (g >= 50) return up + up + mid;
            if (g >= 1) return up + mid + mid;
            if (g === 0) return mid + mid + mid;
            if (g > -30) return down + mid + mid;
            if (g > -50) return down + down + mid;
            return down + down + down;
        }
        const GKEYS = ['maxHp','maxMp','atk','def','spd','int','dex','size'];
        // 4列2行に分割（左カラム: HP/攻撃/速度/器用、右カラム: MP/防御/知能/体格）
        const LEFT  = ['maxHp','atk','spd','dex'];
        const RIGHT = ['maxMp','def','int','size'];
        const tableRows = LEFT.map((lk, ri) => {
            const rk = RIGHT[ri];
            return `<tr>
                <td class="job-growth-label">${LABEL[lk]}</td>
                <td><div class="job-growth-arrows">${arrows(job.growthRates[lk])}</div></td>
                <td style="width:8px"></td>
                <td class="job-growth-label">${LABEL[rk]}</td>
                <td><div class="job-growth-arrows">${arrows(job.growthRates[rk])}</div></td>
            </tr>`;
        }).join('');

        // 職歴
        const history = unit.jobs[jobId];
        const rankText = history ? "<span class='job-card-rank'>(" + (history.rank === job.maxRank ? `★マスター` : `ランク-${history.rank}`) + ")</span>"
                        : "";

        // 職歴はすべてに勝る
        const isUnlock = history || checkJobCondition(unit, job.unlockConditions);
        let conditions = !isUnlock ? getConditionText(job.unlockConditions) : "";
        const isPaid = history || (isUnlock && checkJobCondition(unit, job.cost));
        const cost = getConditionText(job.cost);
        const isAllow = history || (isUnlock && checkJobCondition(unit, job.allowConditions));
        conditions += !isAllow ? getConditionText(job.allowConditions) : "";
        return `<div class="job-card${isCurrent ? ' current' : (isSelected ? " selected" : '')}${isAllow && isPaid ? '' : ' locked'}"${isAllow ? 'data-job-id="' + job.id + '"' : ""}>
            <div class="job-card-icon">${isAllow ? (job.icon ?? "") : ''}</div>
            <div class="job-card-name">${isAllow ? job.name : '🔒 '+ job.name}${rankText}</div>
            <table class="job-growth-table">${tableRows}</table>
            ${!isUnlock || !isAllow ? `<div class="job-req">転職条件${conditions}</div>` : ''}
            ${!history && cost !== "" ? `<div class="job-req">転職コスト${cost}</div>` : ''}
        </div>`;
    }).join('');
}

function getConditionText(conditions) {
    let result = "";
    for (const type in conditions) {
        result += "<br>";
        if (type === "race") {
            result += "種族：" + conditions[type].map(raceId => RACES[raceId].name).join("か")
        } else if (type === "level") {
            result += "レベル：" + conditions[type] + "以上" 
        } else if (type === "money") {
            result += conditions[type] + "G" 
        } else if (type === "item") {
            result += Object.keys(conditions[type]).map(itemId => getItemById(itemId).name + "-" + conditions[type][itemId] + "個").join(' & ') 
        } else if (type === "jobHistory") {
            result += "職歴：" + Object.keys(conditions[type]).map(jobId => JOBS[jobId].name + " ランク" + conditions[type][jobId] + "以上").join(' & ')
        } else if (type === "mapClear") {
            result += "マップクリア：" + conditions[type].map(mapId => MAPS[mapId].name).join(' & ')
        }
    }
    return result;
}

/* ======================
    探索マップ選択
====================== */
// TODO: 中身暫定
function renderBaseSelectExploreMap() {
    baseSelectExploreMapGrid.innerHTML = "";
    for (const map of gameState.selectExploreMap.mapList) {
        const isClear = !!player.achievement?.mapClear[map.id];
        const btn = document.createElement("div");
        // TODO: highlightいらんかも
        btn.className = "base-btn highlight base-btn-wide";
        btn.dataset.mapId = map.id;
        // TODO: アイコンとか追加したら差し込み
        btn.innerHTML = `
                    ${isClear ? `<div class="clear-map-badge">CLEAR!!</div>` : ""}
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
    baseExploreTileGrid.style.width = `${player.explore.map[0].length * 20}%`;
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
                const skill = gameState.battle.actor.skillList.find(skill => skill.id === gameState.battle.pendingCommand.actDetail);
                const candidates = TARGET_TYPE_EXTRACTOR[skill.target_type](gameState.battle.party, gameState.battle.enemies);
                renderTargetPanel(candidates);
                targetPanel.classList.remove("hidden");
            } else if (gameState.battle.pendingCommand.act === "item" && gameState.battle.pendingCommand.actDetail) {
                const item = player.itemSlot.find(item => item.uuid === gameState.battle.pendingCommand.actDetail);
                const candidates = TARGET_TYPE_EXTRACTOR[item.useTargetType](gameState.battle.party, gameState.battle.enemies);
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
            const statLines = getLevelUpText(lu);
            card.innerHTML = `
                <strong>${lu.name}</strong>
                Lv${lu.before} → <span style="color:#ffd700">Lv${lu.after}</span>
                ${statLines === "" ?  "" : ("<br><small>ステータスアップ：" + statLines + "</small>")}
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
            const [statLines, skillLines, traitText] = getRankUpText(ru);
            card.innerHTML = `
                <strong>${ru.name}-${JOBS[ru.jobId].name}</strong>
                <span class="result-rankup-card">${ru.before}</span>
                → 
                <span class="result-rankup-card" style="color:#ffd700">${ru.after}</span>
                ${JOBS[ru.jobId].maxRank === ru.after ? '<br><span class="result-rankup-card" style="color:#ffd700">★' + JOBS[ru.jobId].name + 'をマスターした！！</span>' : ''}
                ${statLines === "" ? "" : ("<br><small>ステータスアップ：" + statLines + "</small>")}
                ${skillLines === "" ? "" : "<br><small>スキル習得：" + skillLines + "</small>"}
                ${traitText === "" ? "" : "<br><small>特性獲得：" + traitText + "</small>"}
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
        const buffedStatus = calcAllStatus(unit);
        const hpPercentage = Math.max(
            (unit.hp / buffedStatus.maxHp) * 100,
            0
        );
        let hpText = `HP ${unit.hp}/${buffedStatus.maxHp}`;
        // 状態異常アイコンの描画
        if (unit.battleStatus) {
            for (const status of unit.battleStatus) {
                const statusDef = BATTLE_STATUSES.find(_status => _status.id === status.type);
                const color = statusDef.color ? `color: ${statusDef.color};` : "";
                const isDown = status.value && status.value < 0 ? `display: inline-block; transform: scaleY(-1);` : "";
                hpText += `<span${color || isDown ? ` style="${color + isDown}"` : ""}>${statusDef.icon + (status.turn >= 0 ? status.turn : "")}</span>`;
            }
        }
        card.querySelector('.hp-label').innerHTML = hpText;
        // 戦闘不能ならクラスを追加
        card.classList.toggle("dead", unit.battleStatus.some(s => s.type === "dead"));

        const hpFill = card.querySelector('.hp-bar-fill');
        hpFill.style.width = `${hpPercentage}%`;
        hpFill.classList.toggle('low-hp', hpPercentage <= 25);

        const mpPercentage = Math.max(
            (unit.mp / buffedStatus.maxMp) * 100,
            0
        );
        card.querySelector('.mp-label').textContent = `MP ${unit.mp}/${buffedStatus.maxMp}`;
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
        const buffedStatus = calcAllStatus(unit);
        const hpPercentage = Math.max(
            (unit.hp / buffedStatus.maxHp) * 100,
            0
        );

        let hpText = `HP ${unit.hp}/${buffedStatus.maxHp}`;
        // 状態異常アイコンの描画
        if (unit.battleStatus) {
            for (const status of unit.battleStatus) {
                const statusDef = BATTLE_STATUSES.find(_status => _status.id === status.type);
                const color = statusDef.color ? `color: ${statusDef.color};` : "";
                const isDown = status.value && status.value < 0 ? `display: inline-block; transform: scaleY(-1);` : "";
                hpText += `<span${color || isDown ? ` style="${color + isDown}"` : ""}>${statusDef.icon + (status.turn >= 0 ? status.turn : "")}</span>`;
            }
        }
        card.querySelector('.hp-label').innerHTML = hpText;

        // 戦闘不能ならクラスを追加
        card.classList.toggle("dead", unit.battleStatus.some(s => s.type === "dead"));

        const hpFill = card.querySelector('.hp-bar-fill');
        hpFill.style.width = `${hpPercentage}%`;
        hpFill.classList.toggle('low-hp', hpPercentage <= 25);
    });
    gameState.battle.dominations.forEach(unit => {
        const card = document.querySelector(
            `.enemy-card[data-id="${unit.id}"]:not(.hidden)`
        );
        if (!card) return;
        card.classList.add("hidden");
    });
}

/**
 * パーティーパネル作成
 */
function createPartyPanel() {
    // 念のためクリア
    partyPanel.innerHTML = "";

    gameState.battle.party.slice(0, 4).forEach(actor => {
        const buffedStatus = calcAllStatus(actor);
        const hpPercent = (actor.hp / buffedStatus.maxHp) * 100;
        const mpPercent = (actor.mp / buffedStatus.maxMp) * 100;

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
                            HP ${actor.hp}/${buffedStatus.maxHp}
                        </label>
                        <div class="bar">
                            <div class="hp-bar-fill"
                                style="width:${hpPercent}%">
                            </div>
                        </div>
                    </div>

                    <div class="status-row mp-row">
                        <label class="mp-label">
                            MP ${actor.mp}/${buffedStatus.maxMp}
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

    player.itemSlot.forEach((item, index) => {
        if (!item.usableIn.battle) {
            return;
        }

        const button = document.createElement('button');
        button.classList.add('cmd', item.useType);
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

    getUsableList(gameState.battle.actor.skillList, "battle").forEach((skill, index) => {
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
        if (candidate.battleStatus) {
            for (const status of candidate.battleStatus) {
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