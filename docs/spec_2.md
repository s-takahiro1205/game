# 暁の探訪者 — 実装仕様書

> 最終更新: 2026-06-07  
> ステータス: 仕様確定（9割）

---

## 0. 現状スナップショット（実装済み）

| 機能 | 状態 |
|------|------|
| タイトル・キャラ作成画面 | ✅ |
| ダイスロールでマスを進む | ✅ |
| ランダムイベント（NORMAL / BENEFIT / DANGER） | ✅ |
| マイルストーンボス（20 / 50 / 80 / 100マス） | ✅ |
| 戦闘（攻撃のみ・1対1） | ✅ |
| アイテム・装備システム（取得・使用・装備・解除） | ✅ |
| メニューモーダル（ステータス・アイテム・装備タブ） | ✅ |
| localStorageセーブ・ロード | ✅ |
| 強くてニューゲーム | ✅ |
| アイテム効果テキスト表示 | ✅ |
| アイテム操作時トースト通知 | ✅ |

### 現状のファイル構成

```
debug.html          # HTML + CSS + JS をすべて含む単一ファイル
index.html
events.js
items.js
save.js
game.js
style.css
```

### 現状のプレイヤーデータ構造

```js
{
  name, hp, maxHp, attack, armor, speed, intel, dex, size,
  money, position,
  isGameOver, isCleared, currentEventCompleted,
  savedEventCategory, savedEventIndex,
  item_slot[],       // 最大20
  equipment_slot[]   // 最大5
}
```

---

## 非機能要件

### 対応環境

| 優先度 | 環境 |
|--------|------|
| 最優先 | 縦持ちスマートフォン（iOS Safari / Android Chrome） |
| 次点 | PC ブラウザ（Chrome / Firefox / Edge） |

### ファイル構成

Phase 1 開始時に以下に分割する。JS は `<script type="module">` で読み込む。

```
index.html
css/
  style.css
js/
  data/
    items.js        # アイテム定義
    enemies.js      # 敵定義
    events.js       # イベント定義
    jobs.js         # 職業・スキル定義
    companions.js   # 仲間定義
  save.js           # セーブ・ロード処理
  game.js           # ゲームロジック（メインエントリ）
assets/
  map/              # 地図画像（Phase 3）
  icons/            # キャラミニアイコン（Phase 3）
```

### デザイン

- フォント: `Arial` 優先 → `sans-serif` フォールバック（Noto Sans JP は削除）
- カラーテーマ: 現状（ダークネイビー背景 `#1a1a2e` + ゴールド `#ffcc00`）を継続
- アニメーション: フェードインのみ（CSS `@keyframes fadeIn`）
- BGM・SE: なし

### セーブ仕様

| 種別 | タイミング | 保存先 |
|------|-----------|--------|
| 自動セーブ（中断用） | イベント処理のたびにこまめに | localStorage |
| 探索完了セーブ | マップ探索終了・拠点帰還時 | localStorage + クラウド同期 |
| 手動セーブ | 拠点のセーブボタン押下 | localStorage + クラウド同期 |

- 複数スロット: なし（1スロットのみ）
- バージョン管理: マイグレーション関数で対応（旧バージョンのデータを変換して読み込む）
- クラウドセーブ失敗時: トースト通知 → 拠点のセーブボタンで手動再試行
- データ破損時: 保証しない

### セーブデータ最適化

熟練度データは値が初期値（ランクF・ポイント0）と同一のエントリを保存時に省略する。

```js
// 保存時: 初期値エントリを除去
function compressJobMastery(mastery) {
  return Object.fromEntries(
    Object.entries(mastery).filter(([, v]) => v.rank !== "F" || v.points !== 0)
  );
}
// 読込時: 存在しないキーは初期値として補完
function expandJobMastery(saved) {
  return Object.fromEntries(
    ALL_JOB_IDS.map(id => [id, saved[id] ?? { rank: "F", points: 0 }])
  );
}
```

### アクセシビリティ

- キーボード操作: 対応しない
- スクリーンリーダー: 対応しない

---

## Phase 1 — 戦闘システム再設計 + 職業

> 以降の全フェーズの土台。最初に完成させる。
> Phase 1 開始と同時にファイル分割も実施する。

### 1-1. ターン制戦闘の基本設計

#### ターン進行フロー

```
戦闘開始
  └─ ターン開始
       └─ 全キャラの speed で行動順を決定（同値はランダム）
            └─ 行動順に 1 キャラずつ処理
                 ├─ 戦闘不能キャラはスキップ
                 ├─ 味方の番 → コマンド選択 UI を表示 → 入力待ち → 行動実行
                 └─ 敵の番  → 重み付き確率でコマンドを自動選択 → 行動実行
       └─ 全キャラ行動完了 → 状態異常ターン経過処理 → 次ターンへ
  └─ 勝利条件: 全敵を撃破
  └─ 敗北条件: パーティ全員が戦闘不能
     → 拠点へ戻る（ペナルティなし・マップ先頭からやり直し）
```

#### 戦闘状態の管理

```js
combatState = {
  isActive: boolean,
  turnOrder: CombatCharacter[],  // speed 順に並べた全キャラの配列
  currentIndex: number,
  turnCount: number
}
```

#### 戦闘不能の扱い

- HP が 0 になったキャラは「戦闘不能」状態になり行動できない
- 戦闘不能のまま戦闘が終了する（HP は 1 で戦闘後に復帰しない）
- 戦闘不能の解消は拠点の屋敷で全回復、または回復アイテムを使用

### 1-2. コマンド体系

#### 味方コマンド

| コマンド | 対象 | 概要 |
|----------|------|------|
| 攻撃 | 敵1体 | 通常攻撃。ダイス式ダメージ計算 |
| 防御 | 自分 | 次に受けるダメージを50%軽減。次の自分のターン開始まで持続 |
| スキル | 定義による | 習得済みスキル一覧から選択 |
| アイテム | 定義による | 所持アイテムから選択。戦闘中はメニューからのアイテム使用不可 |
| 捕獲 | 敵1体 | 主人公専用。敵HPが赤ゲージのときのみ出現（詳細は Phase 2） |

**コマンドボタン UI:**
- `#combat-commands` コンテナにボタンを動的生成（既存の `#attack-button` / `#surrender-button` は廃止）
- 6 つ以上はページネーション（前へ / 次へ）で切り替え

#### 帰還ボタン

- 戦闘中以外・イベント選択中以外なら常に表示
- 押下すると確認ダイアログ → 拠点へ戻る
- 帰還するとそのマップの最初（マス 0）からやり直し

#### 敵コマンドの定義

```js
// Enemy データに追加
commands: [
  { id: "attack",     weight: 60 },
  { id: "guard",      weight: 20 },
  { id: "poison_bite",weight: 20 }
]
```

### 1-3. ダメージ計算（Elona 式ダイス）

#### 記法

```
NdS+B  →  N 個の S 面ダイスを振り、合計に B を加算
例: 2d3+2 → 2〜8 の値
```

#### 通常攻撃のダメージ式

```
ダメージ =
  rollDice(武器のdice_count + 1, 武器のdice_side)
  + (attack + 武器のattack_bonus)   ← 上限として参照
  + 固定ダメージボーナス
  - max(0, 防御側の armor - 攻撃側の armor_pierce)
```

#### 武器データに追加するフィールド

```js
{
  attack_bonus:  number,   // attack に加算
  dice_count:    number,   // ダイス個数
  dice_side:     number,   // ダイス面数
  fixed_damage:  number,   // 固定ダメージ加算
  armor_pierce:  number    // アーマー貫通値
}
```

#### 特殊属性

| 属性 | 効果 |
|------|------|
| `multi_action: N` | 同一ターンに N 回行動 |
| `aoe: true` | 対象を敵全体にする |
| `armor_pierce: N` | 防御側の armor を N 点無視 |

### 1-4. 複数敵対応

- イベントデータの `enemy` を `enemies: Enemy[]` に変更
  - 後方互換: `enemy` 単体フィールドがある場合は `enemies: [enemy]` に自動変換
- 攻撃・スキル使用時はターゲット選択 UI を表示（`aoe` の場合は自動全体）
- 捕獲コマンドで消えるのは捕獲した敵のみ。残敵がいれば戦闘継続

### 1-5. 状態異常

| 状態異常 | 効果 | 重複ルール |
|----------|------|-----------|
| 毒 | ターン終了時に MaxHP の 5% ダメージ | 同種は継続ターン延長 |
| 麻痺 | ターン開始時に確率で行動スキップ | 同種は継続ターン延長 |
| 睡眠 | 被攻撃まで行動不能、被攻撃で解除 | 同種は継続ターン延長 |
| 燃焼 | ターン終了時に固定ダメージ | 同種は継続ターン延長 |

- 異種の状態異常は同時に重複して付与できる
- 付与確率はスキルごとに `statusChance: 0.0〜1.0` で定義

```js
statusEffects: [
  { type: "poison" | "paralyze" | "sleep" | "burn", remainingTurns: number }
]
```

### 1-6. 戦闘リザルト画面

全敵撃破後、メイン画面の前にリザルト画面を挟む。

| 表示項目 | 内容 |
|----------|------|
| 獲得G | 戦闘で得たゴールド |
| 獲得EXP | パーティ全員に100%付与 |
| 熟練度 | 現在職業に +1（全仲間分） |
| ドロップアイテム | 抽選結果を表示 |
| レベルアップ | 発生した場合に演出表示 |
| 職業ランクアップ | 発生した場合に演出表示 |

リザルト確認後、「続ける」ボタンで探索に戻る。

### 1-7. 職業システム

#### キャラ作成への追加

名前・能力値配分 → **職業選択** → 冒険開始（職業選択ステップを追加）

#### 初期実装職業

| 職業ID | 職業名 | 特性 |
|--------|--------|------|
| `warrior` | 戦士 | HP・attack 成長高め。防御コマンドの軽減率 UP |
| `mage` | 魔法使い | intel 成長高め。MP 消費スキルが豊富 |
| `rogue` | 盗賊 | speed・dex 成長高め。先制・回避補正 |
| `cleric` | 僧侶 | HP・MP 成長高め。回復・補助スキル |

転職は拠点「転職」メニューから。条件を満たした職業のみ選択可。

#### 職業熟練度ランク

- 戦闘勝利ごとに現在職業の熟練度ポイント +1
- 閾値到達でランクアップ。ランクアップ時にステータスが直接加算・スキル習得
- **ランクアップで加算されたステータスは転職後も永続**（キャラクター本体に加算）
- 転職しても習得済みスキルはすべて保持。習得した全スキルを戦闘中に使用可能

```js
JOB_MASTERY["warrior"] = {
  ranks: [
    { rank: "F", requiredPoints: 0,  statBonus: { attack: 1 },           skillUnlock: null },
    { rank: "E", requiredPoints: 10, statBonus: { attack: 1, maxHp: 5 }, skillUnlock: "power_strike" },
    { rank: "D", requiredPoints: 25, statBonus: { armor: 1 },            skillUnlock: null },
  ]
}

// キャラクターフィールド（省略最適化あり）
jobMastery: {
  warrior: { rank: "E", points: 12 }
  // F ランク・0 ポイントのエントリは省略して保存
}
```

#### スキルのデータ構造

スキルにはpowerを設定する。INTに応じて威力を計算するため、それを加味して設定すること。
INT	倍率
0	  0.5
100	0.95
300	1.40
500	1.82
700	2.23
999	3.0

```js
{
  id: string,
  name: string,
  description: string,
  mpCost: number,
  targetType: "single_enemy" | "all_enemies" | "random_enemy"
            | "self" | "single_ally" | "all_allies",
  effects: Effect[],        // 既存 Effect と互換
  statusChance: number      // 状態異常付与確率（0.0〜1.0）
}
```

#### 装備の職業制限

装備データに `allowed_jobs: string[]` を追加。空配列は制限なし。

```js
{
  id: "plate_mail",
  equip_type: "armor_heavy",
  allowed_jobs: ["warrior", "cleric"],  // 戦士と僧侶のみ装備可
}
```

#### 装備スロット定義

| スロット名 | 許容種別 | 最大枠数 |
|-----------|---------|---------|
| `weapon` | `weapon` | 1 |
| `armor1` | `armor_light`, `armor_heavy` | 1 |
| `armor2` | `armor_light`, `armor_heavy` | 1 |
| `accessory1` | `accessory` | 1 |
| `accessory2` | `accessory` | 1 |

### 1-8. プレイヤーデータ拡張（Phase 1 追加分）

```js
{
  // 既存フィールドに追加
  jobId:         string,
  mp:            number,
  maxMp:         number,
  level:         number,
  exp:           number,
  statusEffects: [],
  skills:        Skill[],     // 習得済みスキル（全職業横断）
  jobMastery:    object       // 省略最適化済み
}
```

---

## Phase 2 — キャラクター拡張

### 2-1. レベル・経験値システム

#### 必要経験値

```
必要EXP(Lv) = floor( 10 × 1.05^Lv )
```

#### 経験値の獲得源

| タイミング | 対象 | 量 |
|-----------|------|----|
| 戦闘勝利 | パーティ全員 | `enemy.exp` を 100% そのまま付与（分配しない） |
| イベントクリア | パーティ全員 | `event.exp` を付与 |

#### レベルアップ時のステータス成長

```
各ステータスについて:
  g = 基礎成長率(0.1) + 職業成長率補正 + 装備成長率補正
  確定加算 = floor(g)
  剰余確率 = g - floor(g)
  合計加算 = 確定加算 + (Math.random() < 剰余確率 ? 1 : 0)
```

```js
JOB_GROWTH["warrior"] = {
  maxHp: 1.5, attack: 1.2, armor: 1.0,
  speed: 0.5, intel: 0.2, dex:  0.6, maxMp: 0.3
}
```

### 2-2. イベント発生確率の重み付け

| ラベル | 重み値 |
|--------|--------|
| `very_low` | 1 |
| `low` | 3 |
| `normal` | 5 |
| `high` | 8 |
| `very_high` | 13 |

- イベントデータに `weight` フィールドを追加
- 未指定は `normal` として扱う（後方互換）
- 抽選: 各イベントの重み値を合計し、重み付き抽選で 1 件を選ぶ

### 2-3. 仲間キャラクター

#### 加入・待機の仕組み

- 探索イベント経由で仲間候補が出現し、加入を選択できる
- **同行上限: 3人**（主人公 + 最大 3 人で行動）
- **待機上限: 100人**（拠点「待機所」で管理）
- 戦闘は同行中の仲間全員が自動参加

#### 仲間の自動生成

専用定義ファイル `companions.js` にキャラクターを固定で定義し、イベント時にランダムに選んで生成する。

```js
COMPANION_DEFINITIONS = [
  {
    id: "npc_gareth",
    name: "ガレス",
    jobId: "warrior",
    baseStats: { maxHp: 30, maxMp: 8, attack: 8, armor: 4, speed: 4, intel: 2, dex: 3, size: 3 },
    initialEquipment: ["iron_sword", "leather_armor"]
  }
]
```

#### メニューの 2 段構造

- **1 段目タブ**: 主人公 / 仲間A / 仲間B / 仲間C
- **2 段目タブ**: ステータス / スキル / アイテム / 装備

ステータス表示: `10（+3）` 形式（合計値 + 装備補正値の内訳）

#### アイテム自動整頓

メニューのアイテムタブに整頓ボタンを追加。

| ソート種別 | 動作 |
|-----------|------|
| 種別順 | 消費アイテム → 装備の順に並べ替え |
| 五十音順 | アイテム名で昇順ソート |

#### ショップの売値

売値 = `floor(買値 / 2)`

#### アイテム所持枠

現状の 20 枠を 100 枠に拡張。重複制限なし。

#### イベントによるステータス増減

- 対象「全員」: パーティ全員に適用
- 対象「1人」: 同行キャラクターからランダムに 1 人を選んで適用

### 2-4. 捕獲システム

#### 仕様

- 主人公専用コマンド「捕獲」
- 敵の現在 HP が `captureHpThreshold`（例: 30%）以下のとき出現
- `capturable: false` の敵（ボス等）には使用不可

#### 成功判定

```
主人公スコア = attack + armor + speed + intel + dex + size の合計
対象敵スコア = 同上

rollDice(主人公スコア) > rollDice(敵スコア) なら成功
```

#### 成功時の処理

1. 対象の敵を戦闘から除外（撃破扱いではない）
2. 残敵がいれば戦闘続行、いなければ戦闘終了
3. 戦闘終了後、同行が 2 人以下 → そのまま同行加入。3 人の場合 → 待機所に送る

```js
// Enemy データに追加
capturable: boolean,
captureHpThreshold: number   // 例: 0.3
```

---

## Phase 3 — 世界・拠点拡張

### 3-1. 画面遷移

```
起動
  ├─ セーブデータなし → タイトル → キャラ作成 → 拠点（初回）
  └─ セーブデータあり → 拠点
```

### 3-2. 拠点画面

拠点専用の画面を用意する（現状のモーダル方式ではなく独立した `#base-screen`）。

| メニュー項目 | 内容 |
|-------------|------|
| 冒険に出る | マップ選択画面へ遷移 |
| ショップ | アイテム・装備の売買。解放済みマップ数に応じて品揃え増加 |
| 屋敷 | HP/MP/戦闘不能を全回復。待機中の仲間一覧を確認できる |
| 転職 | 同行パーティメンバーの職業変更。解放済み職業のみ選択可 |
| 待機所 | 同行⇔待機の入替、並び順変更、仲間の解雇（上限 100 人） |
| 依頼板 | クエストの確認・受注・達成報告 |
| セーブ | 手動クラウドセーブ |

### 3-3. 依頼（クエスト）システム

#### 依頼板 UI

専用モーダル。テーブル形式で一覧表示。

| カラム | 内容 |
|--------|------|
| 依頼主 | フレーバーテキスト（NPC 名など） |
| 種別 | 討伐 / 探索 / 納品 |
| 目標 | 達成条件の概要テキスト |
| 報酬 | G + アイテム概要 |
| 状態 | 未受注 / 進行中 / 達成済 / 報告済 |

#### 操作フロー

```
依頼板を開く
  ├─ 未受注タブ → 受注ボタン
  ├─ 進行中タブ → 進捗表示（例: 3/5体撃破）
  └─ 完了タブ  → 達成報告ボタン → 報酬受取
```

達成条件クリア時に探索中トースト通知を表示。報酬は拠点での達成報告時に付与。

#### 依頼データ構造

```js
{
  id: string,
  title: string,
  client: string,          // 依頼主（フレーバー）
  type: "defeat" | "explore" | "deliver",
  description: string,
  conditions: [
    { type: "defeat_enemy", enemyId: string, count: number },
    { type: "reach_map",    mapId: string },
    { type: "reach_square", mapId: string, square: number }
  ],
  rewards: { money: number, items: string[], exp: number },
  unlocks: {
    jobId: string | null,   // 達成で解放される転職先
    mapId: string | null    // 達成で解放されるマップ
  }
}
```

#### セーブデータへの追加

```js
questLog: {
  active:    [{ questId: string, progress: object }],
  completed: string[]   // 報告済みクエスト ID 一覧
}
```

### 3-4. 別マップ

#### 解放条件

特定ボスの撃破または特定依頼の達成でマップを解放する。  
解放状態は `unlockedMaps: string[]` でセーブデータに保持。

#### マップ選択 UI

- 拠点「冒険に出る」から遷移する専用画面
- `assets/map/world.png`（別途用意）を背景に表示
- 各マップはクリッカブルエリア（SVG `<rect>` または CSS 絶対配置）として定義
- 未解放マップはグレーアウト表示

#### マップデータ構造

```js
MAP_DATA["map_01"] = {
  id: "map_01",
  name: "暁の森",
  totalSquares: 100,
  milestones: { 20: {...}, 50: {...}, 80: {...}, 100: {...} },
  categoryWeights: { NORMAL: 5, BENEFIT: 2, DANGER: 3 },
  mapImageArea: { x: 120, y: 80, w: 60, h: 60 }
}
```

---

## Phase 4 — インフラ（クラウドセーブ・認証）

> Phase 3 完了後、セーブデータ構造が確定してから着手する。

### 技術スタック

**Supabase を推奨する。**

| 項目 | 内容 |
|------|------|
| DB | Supabase（PostgreSQL。認証・REST API が即時利用可） |
| 認証 | Supabase Auth（メール＋パスワード） |
| サーバー | 不要（Supabase の managed API を利用） |
| SDK | `@supabase/supabase-js`（CDN 経由で読み込み可） |

Node.js / PHP の自前サーバーは管理コストと VPS 費用が発生するため非推奨。

### DB テーブル設計

```sql
create table saves (
  user_id  uuid references auth.users primary key,
  data     jsonb not null,
  saved_at timestamptz default now()
);
```

### クラウドセーブ API

```js
// 保存（探索終了・手動セーブ時）
await supabase.from("saves").upsert({ user_id, data: saveData });

// 読み込み（拠点起動時）
const { data } = await supabase
  .from("saves").select("data").eq("user_id", userId).single();
```

### 認証フロー

```
起動
  ├─ ログイン済み → クラウドからセーブ読込 → 拠点
  └─ 未ログイン  → ゲストモード（localStorage のみ）→ 拠点
                   拠点にログインバナーを表示
```

### 同期タイミング

| タイミング | 動作 |
|-----------|------|
| 探索終了・拠点帰還 | 自動クラウド同期 |
| 手動セーブボタン | 即時クラウド同期 |
| オフライン時 | ローカルのみ保存。次回オンライン時に同期 |
| 同期失敗時 | トースト通知 → 手動セーブを促す |

---

## 戦闘 UI レイアウト（スマートフォン縦持ち）

```
┌──────────────────────┐
│ 味方ステータスエリア（2×2グリッド）│
│ [戦] Lv1  [僧] Lv1           │
│ HP ████  HP ████             │
│ MP ████  MP ████             │
│ [魔] Lv1  [盗] Lv1           │
│ HP ████  HP ████             │
├──────────────────────┤
│ 敵エリア（最大2行×4列）          │
│ ┌──┐┌──┐┌──┐┌──┐        │
│ │敵1 ││敵2 ││敵3 ││敵4 │        │
│ │HP ││HP ││HP ││HP │        │
│ └──┘└──┘└──┘└──┘        │
├──────────────────────┤
│ 行動順（基準線の上=敵 / 下=味方）  │
│ 敵1  敵2     戦  盗  魔  僧  │
│ ─────────────────── │
├──────────────────────┤
│ ログ表示ゾーン（スクロール可）      │
├──────────────────────┤
│ [攻撃][スキル][防御][アイテム]    │
│       （捕獲）                  │
└──────────────────────┘
```

**ダメージポップアップ:**
- 敵が受けたダメージ → 該当敵カードの上に表示（赤）
- 味方が受けたダメージ → 該当味方カードの上に表示（赤）
- 回復量 → 緑で表示

**HP バーの色変化閾値:**
- 60% 以上: 緑
- 30〜60%: 黄
- 30% 未満: 赤（捕獲コマンドの出現トリガーも兼ねる）

---

## 未決定事項（TODO）

| 項目 | 検討タイミング |
|------|--------------|
| 職業の熟練度ランク閾値の具体値・ランク数 | Phase 1 着手前 |
| 全職業リスト・転職解放条件 | Phase 1 着手前 |
| スキル全リストと効果 | Phase 1 着手前 |
| ミニアイコンのデザイン・実装方法 | Phase 2 着手前 |
| 仲間の名前・職業・ステータス全リスト（`companions.js`） | Phase 2 着手前 |
| 依頼の具体的な内容・本数 | Phase 3 着手前 |
| マップの総数と各マップの概要・解放条件 | Phase 3 着手前 |
| 世界地図画像のデザイン | Phase 3 着手前 |
| Supabase プロジェクト作成・環境変数管理方法 | Phase 4 着手前 |
