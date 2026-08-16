// モデル(F-03)と解析オラクル(G-02 / F-07)。すべて純関数・解析式。

import type { ModelKind, Params, Point } from "./types";

const CLAMP = 1e-12;

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/** 損失。linear = MSE、logistic = BCE(クランプで有限性を保証) */
export function loss(
  kind: ModelKind,
  data: Point[],
  w: number,
  b: number,
): number {
  let sum = 0;
  for (const pt of data) {
    if (kind === "linear") {
      const e = w * pt.x + b - pt.y;
      sum += e * e;
    } else {
      const p = Math.min(Math.max(sigmoid(w * pt.x + b), CLAMP), 1 - CLAMP);
      sum += pt.y === 1 ? -Math.log(p) : -Math.log(1 - p);
    }
  }
  return sum / data.length;
}

/** 解析勾配。linear: (2/n)Σe·[x,1]、logistic: (1/n)Σ(σ−y)·[x,1] */
export function grad(
  kind: ModelKind,
  data: Point[],
  w: number,
  b: number,
): { dw: number; db: number } {
  let dw = 0;
  let db = 0;
  for (const pt of data) {
    if (kind === "linear") {
      const e = w * pt.x + b - pt.y;
      dw += 2 * e * pt.x;
      db += 2 * e;
    } else {
      const d = sigmoid(w * pt.x + b) - pt.y;
      dw += d * pt.x;
      db += d;
    }
  }
  return { dw: dw / data.length, db: db / data.length };
}

/**
 * 正規方程式(G-02)。MSE 最小化の閉形式解:
 *   [Σx² Σx; Σx n]·[w b]ᵀ = [Σxy Σy]ᵀ を 2×2 のクラメル公式で解く
 */
export function solveNormal(data: Point[]): Params {
  let sx = 0;
  let sxx = 0;
  let sy = 0;
  let sxy = 0;
  const n = data.length;
  for (const pt of data) {
    sx += pt.x;
    sxx += pt.x * pt.x;
    sy += pt.y;
    sxy += pt.x * pt.y;
  }
  const det = sxx * n - sx * sx;
  return {
    w: (sxy * n - sx * sy) / det,
    b: (sxx * sy - sx * sxy) / det,
  };
}

/**
 * MSE のヘッセ行列 H = (2/n)[[Σx², Σx],[Σx, n]](定数行列)の最大固有値。
 * 2×2 対称行列の固有値は特性方程式の閉形式で求まる
 */
export function lambdaMax(data: Point[]): number {
  let sx = 0;
  let sxx = 0;
  const n = data.length;
  for (const pt of data) {
    sx += pt.x;
    sxx += pt.x * pt.x;
  }
  const p = (2 * sxx) / n;
  const q = (2 * sx) / n;
  const r = 2;
  return (p + r + Math.sqrt((p - r) * (p - r) + 4 * q * q)) / 2;
}

/** 臨界学習率(F-07 / G-04)。二次形式の GD は lr < 2/λmax でのみ収束する */
export function criticalLr(data: Point[]): number {
  return 2 / lambdaMax(data);
}
