import { describe, expect, it } from "vitest";
import { makeLinearData, makeLogisticData } from "@/core/data";
import { grad, loss } from "@/core/model";
import type { Point } from "@/core/types";

// T-010 / T-011 / T-020 / T-021 / T-030(F-02 / F-03 / G-01)

describe("data", () => {
  // T-010
  it("両データセットが 60 点・決定的・範囲と両ラベルを満たす", () => {
    const lin = makeLinearData(1);
    expect(lin.length).toBe(60);
    expect(lin).toEqual(makeLinearData(1));
    expect(lin).not.toEqual(makeLinearData(2));
    for (const p of lin) expect(Math.abs(p.x)).toBeLessThanOrEqual(1);

    const log = makeLogisticData(1);
    expect(log.length).toBe(60);
    expect(log).toEqual(makeLogisticData(1));
    expect(new Set(log.map((p) => p.y))).toEqual(new Set([0, 1]));
  });

  // T-011: クラスタが重なる = 最適解が有限(完全分離だと重みが無限大へ逃げる)
  it("ロジスティックデータの 2 クラスタは x 範囲が交差する", () => {
    const log = makeLogisticData(1);
    const xs0 = log.filter((p) => p.y === 0).map((p) => p.x);
    const xs1 = log.filter((p) => p.y === 1).map((p) => p.x);
    expect(Math.max(...xs0)).toBeGreaterThan(Math.min(...xs1));
  });
});

describe("model", () => {
  // T-020: 極小データの MSE 手計算
  it("線形 MSE が手計算と一致する", () => {
    const data: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];
    // w=0.5, b=0: 残差 0 と −0.5 → MSE = (0 + 0.25)/2 = 0.125
    expect(loss("linear", data, 0.5, 0)).toBeCloseTo(0.125, 12);
  });

  // T-021: ロジスティック loss の基準点
  it("w=b=0 の BCE は ln2・極端な重みでも有限", () => {
    const data = makeLogisticData(1);
    expect(loss("logistic", data, 0, 0)).toBeCloseTo(Math.LN2, 10);
    expect(Number.isFinite(loss("logistic", data, 1000, -500))).toBe(true);
  });

  // T-030 / G-01: 解析勾配 vs 中心差分
  // オラクルはテスト側で独立実装: (L(θ+ε) − L(θ−ε)) / 2ε、ε=1e-6。
  // 相対誤差 = |a−b| / max(1e-10, |a|+|b|)
  it("解析勾配が中心差分と相対誤差 < 1e-5 で一致する", () => {
    const EPS = 1e-6;
    const relErr = (a: number, b: number): number =>
      Math.abs(a - b) / Math.max(1e-10, Math.abs(a) + Math.abs(b));
    const points = [
      { w: 0, b: 0 },
      { w: 1.2, b: -0.5 },
      { w: -2, b: 1.5 },
      { w: 0.3, b: 0.9 },
      { w: 3.5, b: -2.5 },
    ];
    for (const kind of ["linear", "logistic"] as const) {
      const data = kind === "linear" ? makeLinearData(1) : makeLogisticData(1);
      for (const { w, b } of points) {
        const g = grad(kind, data, w, b);
        const ndw =
          (loss(kind, data, w + EPS, b) - loss(kind, data, w - EPS, b)) /
          (2 * EPS);
        const ndb =
          (loss(kind, data, w, b + EPS) - loss(kind, data, w, b - EPS)) /
          (2 * EPS);
        expect(relErr(g.dw, ndw)).toBeLessThan(1e-5);
        expect(relErr(g.db, ndb)).toBeLessThan(1e-5);
      }
    }
  });
});
