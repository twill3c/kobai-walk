// kobai-walk コア型定義。src/core は純関数のみ(AGENTS.md §4)

export type ModelKind = "linear" | "logistic";

export type OptimizerKind = "gd" | "momentum" | "adagrad";

/** データ点。linear では y は実数値、logistic では 0 | 1 */
export interface Point {
  x: number;
  y: number;
}

export interface Params {
  w: number;
  b: number;
}

/** オプティマイザ状態。v* は Momentum の速度、g*2 は AdaGrad の勾配二乗和 */
export interface OptState {
  params: Params;
  vw: number;
  vb: number;
  gw2: number;
  gb2: number;
}
