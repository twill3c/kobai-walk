import { describe, expect, it } from "vitest";
import { makeLinearData } from "@/core/data";
import { criticalLr, grad, lambdaMax, loss, solveNormal } from "@/core/model";

// T-040 / T-041(G-02 / F-07): 解析オラクル自身の自己検証

describe("正規方程式オラクル(G-02)", () => {
  // T-040: 解で勾配ゼロ・格子全点より低い(凸性の独立検算)
  it("solveNormal の解は勾配ゼロかつ 41×41 格子の最小", () => {
    const data = makeLinearData(1);
    const opt = solveNormal(data);
    const g = grad("linear", data, opt.w, opt.b);
    expect(Math.hypot(g.dw, g.db)).toBeLessThan(1e-10);

    const lOpt = loss("linear", data, opt.w, opt.b);
    for (let i = 0; i <= 40; i++) {
      for (let j = 0; j <= 40; j++) {
        const w = -2 + (6 * i) / 40;
        const b = -3 + (6 * j) / 40;
        expect(loss("linear", data, w, b)).toBeGreaterThanOrEqual(
          lOpt - 1e-12,
        );
      }
    }
  });

  // T-041: λmax の独立検算
  // MSE = (1/n)Σ(wx+b−y)² のヘッセ行列は H = (2/n)[[Σx², Σx],[Σx, n]](定数)。
  // 2×2 対称行列 [[p,q],[q,r]] の最大固有値 = ((p+r) + √((p−r)² + 4q²)) / 2
  it("lambdaMax がテスト内の特性方程式の解と一致する", () => {
    const data = makeLinearData(1);
    const n = data.length;
    let sx = 0;
    let sxx = 0;
    for (const pt of data) {
      sx += pt.x;
      sxx += pt.x * pt.x;
    }
    const p = (2 * sxx) / n;
    const q = (2 * sx) / n;
    const r = 2;
    const expected = (p + r + Math.sqrt((p - r) ** 2 + 4 * q * q)) / 2;
    expect(lambdaMax(data)).toBeCloseTo(expected, 12);
    expect(criticalLr(data)).toBeCloseTo(2 / expected, 12);
  });
});
