// localStorage セーブ・ロード処理

const SAVE_KEY = "akatsuki_save";
const SAVE_VERSION = "3.6.0";
const versionDisplay = document.getElementById("version-display");
versionDisplay.innerHTML = `Ver. ${SAVE_VERSION}`;

/**
 * ゲームデータをlocalStorageに保存する
 * @param {object} player - プレイヤーデータオブジェクト
 */
export function saveGame(player) {
    const data = {
        player: player,
        timestamp: new Date().toISOString(),
        version: SAVE_VERSION
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    console.log("Game saved:", data);
}

/**
 * localStorageからゲームデータをロードする
 * @returns {object|null} ロードされたゲームデータ、またはデータがない場合はnull
 */
export function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
        console.log("No save data found.");
        return null;
    }
    try {
        const data = JSON.parse(raw);
        // セーブデータバージョン確認
        if (data.version !== SAVE_VERSION) {
            console.warn("Save data version mismatch. Ignoring old save data.");
            return null;
        }
        console.log("Game loaded:", data);
        return data;
    } catch (e) {
        console.error("Failed to parse save data:", e);
        return null;
    }
}

/**
 * localStorageからセーブデータを削除する
 */
export function deleteSaveData() {
    localStorage.removeItem(SAVE_KEY);
    console.log("Save data deleted.");
}