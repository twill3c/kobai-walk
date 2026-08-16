// 描画と学習の分離(N-03)。1 フレームに実行する学習ステップ数の上限。

export const SPEEDS = [1, 10, 50] as const;
export type Speed = (typeof SPEEDS)[number];

/** 1 フレームの学習バッチ上限(全バッチ GD は 1 ステップが重いため控えめに) */
export const MAX_STEPS_PER_FRAME = 50;

export function batchSize(speed: Speed): number {
  return Math.min(speed, MAX_STEPS_PER_FRAME);
}
