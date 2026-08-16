// 可視化用の純関数(F-05 / F-08)。地形は単色ランプ(走者色と競合しない)。

import type { ModelKind, Point } from "./types";
import { loss } from "./model";

/** 地形の表示範囲(w, b 平面)。線形の最適解(≈1.6, −0.4)を含む */
export const VIEW = { w0: -2.5, w1: 4.5, b0: -3.5, b1: 3.5 } as const;

export interface View {
  w0: number;
  w1: number;
  b0: number;
  b1: number;
}

/**
 * 損失格子(T-060)。view を res×res に分割し各セル中心の損失を
 * 行優先(index = row·res + col、row は b 軸・col は w 軸)で返す
 */
export function lossGrid(
  kind: ModelKind,
  data: Point[],
  res: number,
  view: View,
): number[] {
  const out: number[] = new Array(res * res);
  for (let r = 0; r < res; r++) {
    const b = view.b0 + ((r + 0.5) * (view.b1 - view.b0)) / res;
    for (let c = 0; c < res; c++) {
      const w = view.w0 + ((c + 0.5) * (view.w1 - view.w0)) / res;
      out[r * res + c] = loss(kind, data, w, b);
    }
  }
  return out;
}

/** 対数正規化: 損失列 → [0,1](最小 = 0 = 谷底) */
export function normalizeLog(losses: number[]): number[] {
  const logs = losses.map((v) => Math.log10(Math.max(v, 1e-300)));
  const min = Math.min(...logs);
  const max = Math.max(...logs);
  const span = max - min;
  return logs.map((v) => (span === 0 ? 0 : (v - min) / span));
}

const VALLEY: [number, number, number] = [0x10, 0x15, 0x12]; // 谷底 = 背景色
const RIDGE: [number, number, number] = [0xa8, 0xc4, 0xb2]; // 高地 = 明るい緑灰

function hex(rgb: [number, number, number]): string {
  return (
    "#" +
    rgb
      .map((c) => Math.round(c).toString(16).padStart(2, "0"))
      .join("")
      .toLowerCase()
  );
}

/** 正規化済み損失 t ∈ [0,1] → 地形色(谷底が暗い)。等高線風の段付き(12 段) */
export function lossColor(t: number): string {
  const bands = 12;
  const q = Math.min(Math.floor(t * bands), bands - 1) / (bands - 1);
  return hex([
    VALLEY[0] + (RIDGE[0] - VALLEY[0]) * q,
    VALLEY[1] + (RIDGE[1] - VALLEY[1]) * q,
    VALLEY[2] + (RIDGE[2] - VALLEY[2]) * q,
  ]);
}

/** レース曲線の SVG points(T-061)。対数軸・kyokai-lab と同じ契約 */
export function raceCurvePoints(
  losses: number[],
  width: number,
  height: number,
): string {
  if (losses.length === 0) return "";
  const logs = losses.map((v) => {
    if (v <= 0) throw new Error(`raceCurvePoints: 非正値 ${v}`);
    return Math.log10(v);
  });
  const min = Math.min(...logs);
  const max = Math.max(...logs);
  const span = max - min;
  const dx = logs.length > 1 ? width / (logs.length - 1) : 0;
  return logs
    .map((v, i) => {
      const t = span === 0 ? 0.5 : (v - min) / span;
      return `${i * dx},${(1 - t) * height}`;
    })
    .join(" ");
}
