import { describe, expect, it } from "vitest";
import { makeLinearData } from "@/core/data";
import { grad } from "@/core/model";
import { ADAGRAD_EPS, MOMENTUM_BETA, initOpt, stepOpt } from "@/core/optim";

// T-050 / T-051(F-04)

const START = { w: -1.5, b: 2.5 };

describe("optim", () => {
  // T-050: 純関数性 + GD 1 歩の手計算
  it("stepOpt は非破壊・決定的で、GD 1 歩が p − lr·∇ と一致する", () => {
    const data = makeLinearData(1);
    const s0 = initOpt(START);
    const snapshot = JSON.parse(JSON.stringify(s0));
    const a = stepOpt("gd", "linear", data, s0, 0.1);
    const b = stepOpt("gd", "linear", data, s0, 0.1);
    expect(s0).toEqual(snapshot);
    expect(a).toEqual(b);

    const g = grad("linear", data, START.w, START.b);
    expect(a.params.w).toBeCloseTo(START.w - 0.1 * g.dw, 12);
    expect(a.params.b).toBeCloseTo(START.b - 0.1 * g.db, 12);
  });

  // T-051: Momentum / AdaGrad の更新式
  it("Momentum は v←βv−lr·g・AdaGrad は G←G+g² を手計算どおり適用する", () => {
    const data = makeLinearData(1);
    const s0 = initOpt(START);
    const g = grad("linear", data, START.w, START.b);

    const m = stepOpt("momentum", "linear", data, s0, 0.1);
    const vw = MOMENTUM_BETA * 0 - 0.1 * g.dw;
    const vb = MOMENTUM_BETA * 0 - 0.1 * g.db;
    expect(m.vw).toBeCloseTo(vw, 12);
    expect(m.params.w).toBeCloseTo(START.w + vw, 12);
    expect(m.params.b).toBeCloseTo(START.b + vb, 12);

    const a = stepOpt("adagrad", "linear", data, s0, 0.5);
    const gw2 = g.dw * g.dw;
    const gb2 = g.db * g.db;
    expect(a.gw2).toBeCloseTo(gw2, 12);
    expect(a.params.w).toBeCloseTo(
      START.w - (0.5 * g.dw) / Math.sqrt(gw2 + ADAGRAD_EPS),
      12,
    );
    expect(a.params.b).toBeCloseTo(
      START.b - (0.5 * g.db) / Math.sqrt(gb2 + ADAGRAD_EPS),
      12,
    );
  });
});
