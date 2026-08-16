import { describe, expect, it } from "vitest";
import { makeLinearData } from "@/core/data";
import { criticalLr, loss, solveNormal } from "@/core/model";
import type { OptState } from "@/core/types";
import { initOpt, stepOpt } from "@/core/optim";
import type { OptimizerKind } from "@/core/types";

// T-100〜T-103(G-03〜G-06)。予算・許容誤差は較正実験の証拠つきで確定する

const START = { w: -1.5, b: 2.5 };

function run(
  kind: OptimizerKind,
  lr: number,
  steps: number,
): { state: OptState; losses: number[] } {
  const data = makeLinearData(1);
  let s = initOpt(START);
  const losses: number[] = [];
  for (let i = 0; i < steps; i++) {
    s = stepOpt(kind, "linear", data, s, lr);
    losses.push(loss("linear", data, s.params.w, s.params.b));
  }
  return { state: s, losses };
}

describe("数理ゲート", () => {
  // T-100 / G-03: GD が正規方程式解へ
  it("G-03: GD・lr=1/λmax・500 ステップで解析解との距離 < 1e-6", () => {
    const data = makeLinearData(1);
    const opt = solveNormal(data);
    const lr = criticalLr(data) / 2; // = 1/λmax
    const { state } = run("gd", lr, 500);
    const dist = Math.hypot(state.params.w - opt.w, state.params.b - opt.b);
    expect(dist).toBeLessThan(1e-6);
  });

  // T-101 / G-04: 臨界学習率の両側
  it("G-04: lr=1.5/λmax で単調非増加・lr=2.2/λmax で発散する", () => {
    const data = makeLinearData(1);
    const crit = criticalLr(data);
    const initial = loss("linear", data, START.w, START.b);

    const safe = run("gd", 0.75 * crit, 200).losses;
    let prev = initial;
    for (const l of safe) {
      expect(l).toBeLessThanOrEqual(prev + 1e-12);
      prev = l;
    }

    const diverged = run("gd", 1.1 * crit, 200).losses;
    expect(diverged[diverged.length - 1]).toBeGreaterThan(initial * 10);
  });

  // T-102 / G-05: 決定論
  it("G-05: 同一設定の 2 回のレースが全軌跡で深い等値", () => {
    for (const kind of ["gd", "momentum", "adagrad"] as const) {
      const a = run(kind, 0.3, 100);
      const b = run(kind, 0.3, 100);
      expect(a.state).toEqual(b.state);
      expect(a.losses).toEqual(b.losses);
    }
  });

  // T-103 / G-06: Momentum / AdaGrad も同じ谷底へ(予算は較正で確定)
  it("G-06: Momentum(500 歩)と AdaGrad(3000 歩)が解析解との距離 < 1e-3", () => {
    const data = makeLinearData(1);
    const opt = solveNormal(data);
    const lr = criticalLr(data) / 2;
    const dist = (s: OptState): number =>
      Math.hypot(s.params.w - opt.w, s.params.b - opt.b);
    expect(dist(run("momentum", lr, 500).state)).toBeLessThan(1e-3);
    expect(dist(run("adagrad", lr, 3000).state)).toBeLessThan(1e-3);
  });
});
