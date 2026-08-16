"use client";

// レース曲線(F-08)。3 系列を色+直ラベルで識別(対数軸)。
// 発散した走者の曲線は上端に張り付く(logNormLoss・HC-002)。

import type { OptimizerKind } from "@/core/types";
import { logNormLoss } from "@/core/viz";
import { RACERS } from "@/lib/useRace";
import { RACER_COLORS, RACER_NAMES } from "./TerrainCanvas";

const W = 320;
const H = 110;

export function RaceCurves({
  losses,
}: {
  losses: Record<OptimizerKind, number[]>;
}) {
  const empty = RACERS.every((k) => losses[k].length === 0);

  // 3 系列を共通スケールで描くため、有限値のみからスケールを決める
  const finite = RACERS.flatMap((k) => losses[k]).filter((v) =>
    Number.isFinite(v),
  );
  const logs = finite.map((v) => Math.log10(Math.max(v, 1e-300)));
  const min = logs.length > 0 ? Math.min(...logs) : 0;
  const max = logs.length > 0 ? Math.max(...logs) : 0;
  const span = max - min;

  const pointsOf = (xs: number[]): string => {
    if (xs.length === 0) return "";
    const dx = xs.length > 1 ? W / (xs.length - 1) : 0;
    return xs
      .map((v, i) => {
        const t = Math.min(Math.max(logNormLoss(v, min, span), 0), 1);
        return `${i * dx},${(1 - t) * H}`;
      })
      .join(" ");
  };

  return (
    <figure className="curve">
      <figcaption>損失レース(対数軸・上端張り付き = 発散)</figcaption>
      <svg
        viewBox={`0 0 ${W + 84} ${H + 8}`}
        role="img"
        aria-label="3 つのオプティマイザの損失推移(対数軸)。上端に張り付いた曲線は発散を表す"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <line x1={0} y1={H} x2={W} y2={H} stroke="#383835" strokeWidth={1} />
        {empty ? (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={12} fill="#8a9089">
            レース開始を待機中
          </text>
        ) : (
          (() => {
            const series = RACERS.map((k) => {
              const pts = pointsOf(losses[k]);
              const lastY =
                pts === "" ? H / 2 : Number(pts.split(" ").pop()!.split(",")[1]);
              return { k, pts, lastY: Math.min(Math.max(lastY, 8), H - 2) };
            }).filter((s) => s.pts !== "");
            // 直ラベルの衝突回避: y 順に並べ、12px 未満の間隔を押し広げる
            const sorted = [...series].sort((a, b) => a.lastY - b.lastY);
            for (let i = 1; i < sorted.length; i++) {
              if (sorted[i].lastY - sorted[i - 1].lastY < 12) {
                sorted[i].lastY = sorted[i - 1].lastY + 12;
              }
            }
            return series.map((s) => (
              <g key={s.k}>
                <polyline
                  points={s.pts}
                  fill="none"
                  stroke={RACER_COLORS[s.k]}
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                <text
                  x={W + 6}
                  y={s.lastY}
                  fontSize={11}
                  fill={RACER_COLORS[s.k]}
                >
                  {RACER_NAMES[s.k]}
                </text>
              </g>
            ));
          })()
        )}
      </svg>
    </figure>
  );
}
