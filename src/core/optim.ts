// オプティマイザ 3 種(F-04)。stepOpt は純関数・状態は OptState で持ち回る。

import type { ModelKind, OptState, OptimizerKind, Params, Point } from "./types";
import { grad } from "./model";

export const MOMENTUM_BETA = 0.9;
export const ADAGRAD_EPS = 1e-8;

export function initOpt(start: Params): OptState {
  return { params: { ...start }, vw: 0, vb: 0, gw2: 0, gb2: 0 };
}

/** 最適化 1 ステップ(純関数) */
export function stepOpt(
  kind: OptimizerKind,
  model: ModelKind,
  data: Point[],
  state: OptState,
  lr: number,
): OptState {
  const g = grad(model, data, state.params.w, state.params.b);

  if (kind === "gd") {
    return {
      ...state,
      params: {
        w: state.params.w - lr * g.dw,
        b: state.params.b - lr * g.db,
      },
    };
  }

  if (kind === "momentum") {
    const vw = MOMENTUM_BETA * state.vw - lr * g.dw;
    const vb = MOMENTUM_BETA * state.vb - lr * g.db;
    return {
      ...state,
      vw,
      vb,
      params: { w: state.params.w + vw, b: state.params.b + vb },
    };
  }

  // adagrad
  const gw2 = state.gw2 + g.dw * g.dw;
  const gb2 = state.gb2 + g.db * g.db;
  return {
    ...state,
    gw2,
    gb2,
    params: {
      w: state.params.w - (lr * g.dw) / Math.sqrt(gw2 + ADAGRAD_EPS),
      b: state.params.b - (lr * g.db) / Math.sqrt(gb2 + ADAGRAD_EPS),
    },
  };
}
