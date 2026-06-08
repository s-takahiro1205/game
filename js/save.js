// localStorage セーブ・ロード処理

/**
 * ゲームデータをlocalStorageに保存する
 * @param {object} player - プレイヤーデータオブジェクト
 */
function saveGame(player) {
    const data = {
        player: player,
        timestamp: new Date().toISOString(),
        version: "1.0"
    };
    localStorage.setItem("akatsuki_save", JSON.stringify(data));
    console.log("Game saved:", data);
}

/**
 * localStorageからゲームデータをロードする
 * @returns {object|null} ロードされたゲームデータ、またはデータがない場合はnull
 */
function loadGame() {
    const raw = localStorage.getItem("akatsuki_save");
    if (!raw) {
        console.log("No save data found.");
        return null;
    }
    try {
        const data = JSON.parse(raw);
        // セーブデータバージョン確認
        if (data.version !== "1.0") {
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
function deleteSaveData() {
    localStorage.removeItem("akatsuki_save");
    console.log("Save data deleted.");
}