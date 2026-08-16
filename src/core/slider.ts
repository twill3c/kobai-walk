// 学習率スライダーの対数目盛写像(F-07)。s ∈ [0,1] ↔ lr ∈ [0.01, 4.0]

export const LR_MIN = 0.01;
export const LR_MAX = 4.0;

export function lrFromSlider(s: number): number {
  const lo = Math.log10(LR_MIN);
  const hi = Math.log10(LR_MAX);
  return Math.pow(10, lo + (hi - lo) * s);
}

export function sliderFromLr(lr: number): number {
  const lo = Math.log10(LR_MIN);
  const hi = Math.log10(LR_MAX);
  return (Math.log10(lr) - lo) / (hi - lo);
}
