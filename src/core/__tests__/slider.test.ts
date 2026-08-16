import { describe, expect, it } from "vitest";
import { LR_MAX, LR_MIN, lrFromSlider, sliderFromLr } from "@/core/slider";

// T-062(F-07): 学習率スライダーの対数目盛写像

describe("lr slider", () => {
  it("端点が 0.01 / 4.0・往復写像が一致・中央は幾何平均", () => {
    expect(lrFromSlider(0)).toBeCloseTo(LR_MIN, 12);
    expect(lrFromSlider(1)).toBeCloseTo(LR_MAX, 12);
    expect(lrFromSlider(0.5)).toBeCloseTo(Math.sqrt(LR_MIN * LR_MAX), 10);
    for (const s of [0, 0.1, 0.33, 0.5, 0.77, 1]) {
      expect(sliderFromLr(lrFromSlider(s))).toBeCloseTo(s, 10);
    }
    // 単調性
    expect(lrFromSlider(0.6)).toBeGreaterThan(lrFromSlider(0.4));
  });
});
