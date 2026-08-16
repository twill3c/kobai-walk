"use client";

// 地形キャンバス(F-05 / F-09)。損失地形(等高線ランプ)は model・data にのみ
// 依存するため useMemo でビットマップ化し、毎フレームは軌跡と走者だけ重ね描きする。

import { useEffect, useMemo, useRef } from "react";
import type { ModelKind, OptimizerKind, Params, Point } from "@/core/types";
import { solveNormal } from "@/core/model";
import { VIEW, lossColor, lossGrid, normalizeLog } from "@/core/viz";
import { RACERS } from "@/lib/useRace";

const RES = 96;
const SIZE = 480;

export const RACER_COLORS: Record<OptimizerKind, string> = {
  gd: "#3987e5",
  momentum: "#d95926",
  adagrad: "#1baf7a",
};

export const RACER_NAMES: Record<OptimizerKind, string> = {
  gd: "GD",
  momentum: "Momentum",
  adagrad: "AdaGrad",
};

function toPx(p: Params): [number, number] {
  const x = ((p.w - VIEW.w0) / (VIEW.w1 - VIEW.w0)) * SIZE;
  const y = ((p.b - VIEW.b0) / (VIEW.b1 - VIEW.b0)) * SIZE;
  return [x, y];
}

export function TerrainCanvas({
  model,
  data,
  trails,
  positions,
}: {
  model: ModelKind;
  data: Point[];
  trails: Record<OptimizerKind, Params[]>;
  positions: Record<OptimizerKind, Params>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 地形ビットマップのキャッシュ。DOM 生成を伴うため useMemo でなく
  // useEffect 内(クライアント専用)で構築する — SSR プリレンダで document は無い
  const terrainRef = useRef<{ key: string; canvas: HTMLCanvasElement } | null>(
    null,
  );

  const optimum = useMemo(
    () => (model === "linear" ? solveNormal(data) : null),
    [model, data],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (terrainRef.current?.key !== model) {
      const grid = normalizeLog(lossGrid(model, data, RES, VIEW));
      const off = document.createElement("canvas");
      off.width = RES;
      off.height = RES;
      const offCtx = off.getContext("2d")!;
      const img = offCtx.createImageData(RES, RES);
      for (let i = 0; i < grid.length; i++) {
        const c = lossColor(grid[i]);
        img.data[i * 4] = parseInt(c.slice(1, 3), 16);
        img.data[i * 4 + 1] = parseInt(c.slice(3, 5), 16);
        img.data[i * 4 + 2] = parseInt(c.slice(5, 7), 16);
        img.data[i * 4 + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0);
      terrainRef.current = { key: model, canvas: off };
    }

    ctx.imageSmoothingEnabled = false; // 等高線の段を保つ
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(terrainRef.current.canvas, 0, 0, SIZE, SIZE);

    // 軌跡
    for (const kind of RACERS) {
      const trail = trails[kind];
      if (trail.length < 2) continue;
      ctx.beginPath();
      const [x0, y0] = toPx(trail[0]);
      ctx.moveTo(x0, y0);
      for (let i = 1; i < trail.length; i++) {
        const [x, y] = toPx(trail[i]);
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = RACER_COLORS[kind];
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.85;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 最適解 ★(線形のみ)
    if (optimum) {
      const [x, y] = toPx(optimum);
      ctx.fillStyle = "#e8efe9";
      ctx.font = "18px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★", x, y);
    }

    // 走者
    for (const kind of RACERS) {
      const [x, y] = toPx(positions[kind]);
      if (x < -20 || y < -20 || x > SIZE + 20 || y > SIZE + 20) continue;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = RACER_COLORS[kind];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#101512";
      ctx.stroke();
    }
  }, [model, data, trails, positions, optimum]);

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      role="img"
      aria-label="損失地形と 3 走者の軌跡。明るいほど損失が高く、暗い谷底の★が最適解"
      style={{ width: "100%", height: "auto", display: "block", borderRadius: 6 }}
    />
  );
}
