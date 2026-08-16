// データ生成(F-02)。シード決定的・各 60 点。

import type { Point } from "./types";
import { rngInit, rngNext } from "./prng";

const N = 60;

interface RngBox {
  state: number;
}

function uniform(box: RngBox, lo: number, hi: number): number {
  const r = rngNext(box.state);
  box.state = r.state;
  return lo + r.value * (hi - lo);
}

/** 線形回帰用: y = 1.6x − 0.4 + 一様ノイズ ±0.3、x ∈ [-1, 1] */
export function makeLinearData(seed: number): Point[] {
  const box = { state: rngInit(seed) };
  const out: Point[] = [];
  for (let i = 0; i < N; i++) {
    const x = uniform(box, -1, 1);
    out.push({ x, y: 1.6 * x - 0.4 + uniform(box, -0.3, 0.3) });
  }
  return out;
}

/**
 * ロジスティック回帰用: 中心 ∓0.5 の 2 クラスタ(広がり ±0.8)。
 * 意図的に重ねて完全分離を避ける — 分離可能だと最適解が無限遠に逃げ、
 * 地形に谷底が存在しなくなる(T-011 で検算)
 */
export function makeLogisticData(seed: number): Point[] {
  const box = { state: rngInit(seed) };
  const out: Point[] = [];
  for (let i = 0; i < N; i++) {
    const label = i % 2;
    const center = label === 1 ? 0.5 : -0.5;
    out.push({ x: center + uniform(box, -0.8, 0.8), y: label });
  }
  return out;
}
