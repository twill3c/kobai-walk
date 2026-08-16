import { describe, expect, it } from "vitest";
import { makeLinearData } from "@/core/data";
import { VIEW, lossColor, lossGrid, raceCurvePoints } from "@/core/viz";

// T-060 / T-061(F-05 / F-08)

describe("viz", () => {
  // T-060: 地形格子と配色
  it("lossGrid は res×res・全て正値、lossColor は単調な #rrggbb", () => {
    const data = makeLinearData(1);
    const g = lossGrid("linear", data, 20, VIEW);
    expect(g.length).toBe(400);
    for (const v of g) expect(v).toBeGreaterThan(0);

    const colors = [0, 0.25, 0.5, 0.75, 1].map(lossColor);
    expect(new Set(colors).size).toBe(5);
    for (const c of colors) expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });

  // T-061: レース曲線(対数軸・kyokai-lab 同型の契約)
  it("raceCurvePoints は正値のみ受理し対数で単調写像する", () => {
    expect(raceCurvePoints([], 100, 50)).toBe("");
    const pts = raceCurvePoints([1, 0.1, 0.01], 100, 50)
      .split(" ")
      .map((p) => p.split(",").map(Number));
    expect(pts.map((p) => p[0])).toEqual([0, 50, 100]);
    expect(pts[0][1]).toBeCloseTo(0, 6);
    expect(pts[1][1]).toBeCloseTo(25, 6);
    expect(pts[2][1]).toBeCloseTo(50, 6);
    expect(() => raceCurvePoints([1, 0], 100, 50)).toThrow();
  });
});
