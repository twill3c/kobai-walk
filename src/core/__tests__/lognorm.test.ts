import { describe, expect, it } from "vitest";
import { logNormLoss } from "@/core/viz";

// T-063(F-08 / HC-002): 発散(非有限値)は正常系 — 挙動を仕様として固定する

describe("logNormLoss", () => {
  it("有限値は対数正規化・NaN/±Inf は 1(上端)・span 0 は 0.5", () => {
    // min = log10(0.01) = -2, span = 2(0.01〜1 の範囲)
    expect(logNormLoss(1, -2, 2)).toBeCloseTo(1, 12);
    expect(logNormLoss(0.1, -2, 2)).toBeCloseTo(0.5, 12);
    expect(logNormLoss(0.01, -2, 2)).toBeCloseTo(0, 12);
    // 発散
    expect(logNormLoss(Number.NaN, -2, 2)).toBe(1);
    expect(logNormLoss(Infinity, -2, 2)).toBe(1);
    expect(logNormLoss(-Infinity, -2, 2)).toBe(1);
    // 定数列
    expect(logNormLoss(0.5, Math.log10(0.5), 0)).toBe(0.5);
  });
});
