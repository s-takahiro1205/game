
/**
 * ステータス変動デバフの効果
 */
const DEBUFF_STATUS_MODIFIERS = {
    weakness: { attack: { rate: -0.2 } },
    haste:    { speed:  { rate:  0.5 } },
    // poison:   {}, // ダメージ系はターン処理で扱うのでここには書かない
};
