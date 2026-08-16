"use client";

import { useMemo, useState } from "react";
import { RaceCurves } from "@/components/RaceCurves";
import {
  RACER_COLORS,
  RACER_NAMES,
  TerrainCanvas,
} from "@/components/TerrainCanvas";
import { makeLinearData, makeLogisticData } from "@/core/data";
import { criticalLr, grad, solveNormal } from "@/core/model";
import type { Speed } from "@/core/schedule";
import { SPEEDS } from "@/core/schedule";
import { lrFromSlider, sliderFromLr } from "@/core/slider";
import type { ModelKind, Point } from "@/core/types";
import { RACERS, useRace } from "@/lib/useRace";

const SEED = 1;
const START = { w: -1.5, b: 2.5 };

const MODELS: Array<{ id: ModelKind; name: string }> = [
  { id: "linear", name: "線形回帰(MSE)" },
  { id: "logistic", name: "ロジスティック回帰(BCE)" },
];

export default function Home() {
  const [model, setModel] = useState<ModelKind>("linear");
  const [lr, setLr] = useState(0.3);

  const data = useMemo(
    () => (model === "linear" ? makeLinearData(SEED) : makeLogisticData(SEED)),
    [model],
  );

  return (
    <main className="app">
      <header className="header">
        <h1>kobai-walk</h1>
        <p className="subtitle">
          損失地形を 3 つのオプティマイザが降りていくレースを観る
        </p>
      </header>

      <nav className="map-tabs" aria-label="モデル選択">
        {MODELS.map((m) => (
          <button
            type="button"
            key={m.id}
            className={m.id === model ? "active" : ""}
            onClick={() => setModel(m.id)}
          >
            {m.name}
          </button>
        ))}
      </nav>

      {/* key で remount してモデル切替時にレース状態を作り直す */}
      <Playground
        key={model}
        model={model}
        data={data}
        lr={lr}
        onLrChange={setLr}
      />
    </main>
  );
}

function Playground({
  model,
  data,
  lr,
  onLrChange,
}: {
  model: ModelKind;
  data: Point[];
  lr: number;
  onLrChange: (next: number) => void;
}) {
  const race = useRace(model, data, START, lr);
  const crit = model === "linear" ? criticalLr(data) : null;
  const optimum = model === "linear" ? solveNormal(data) : null;

  const positions = {
    gd: race.states.gd.params,
    momentum: race.states.momentum.params,
    adagrad: race.states.adagrad.params,
  };

  return (
    <div className="layout">
      <section className="board">
        <TerrainCanvas
          model={model}
          data={data}
          trails={race.trails}
          positions={positions}
        />
        <div className="controls" aria-label="実行制御">
          <div className="control-row">
            {race.playing ? (
              <button type="button" onClick={race.pause}>
                ⏸ 一時停止
              </button>
            ) : (
              <button type="button" onClick={race.play}>
                ▶ レース開始
              </button>
            )}
            <button type="button" onClick={race.stepOnce}>
              1 ステップ
            </button>
            <button type="button" onClick={race.reset}>
              リセット
            </button>
          </div>
          <div className="control-row" role="group" aria-label="速度">
            {SPEEDS.map((s: Speed) => (
              <button
                type="button"
                key={s}
                className={race.speed === s ? "active" : ""}
                onClick={() => race.setSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="panel">
        <label className="param">
          <span className="param-label">
            学習率 η(対数目盛)
            <span
              className="param-value"
              style={
                crit !== null && lr > crit ? { color: "var(--warn)" } : undefined
              }
            >
              {lr.toFixed(3)}
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={sliderFromLr(lr)}
            onChange={(e) => onLrChange(lrFromSlider(Number(e.target.value)))}
          />
          {crit !== null && (
            <span className="crit-note">
              臨界学習率 2/λmax = {crit.toFixed(3)}
              {lr > crit && (
                <strong style={{ color: "var(--warn)" }}> — 発散域!</strong>
              )}
            </span>
          )}
        </label>

        <RaceCurves losses={race.losses} />

        <div className="racers">
          {RACERS.map((k) => {
            const p = race.states[k].params;
            const lastLoss =
              race.losses[k].length > 0
                ? race.losses[k][race.losses[k].length - 1]
                : null;
            const g = grad(model, data, p.w, p.b);
            const gnorm = Math.hypot(g.dw, g.db);
            const dist = optimum
              ? Math.hypot(p.w - optimum.w, p.b - optimum.b)
              : null;
            return (
              <div className="racer" key={k}>
                <span
                  className="racer-dot"
                  style={{ background: RACER_COLORS[k] }}
                />
                <span className="racer-name">{RACER_NAMES[k]}</span>
                <span className="racer-stat">
                  {lastLoss !== null && !Number.isFinite(lastLoss) ? (
                    <strong style={{ color: "var(--warn)" }}>発散!</strong>
                  ) : (
                    `損失 ${lastLoss !== null ? lastLoss.toExponential(2) : "—"}`
                  )}
                </span>
                <span className="racer-stat">
                  {dist !== null
                    ? `★まで ${Number.isFinite(dist) ? dist.toExponential(1) : "∞"}`
                    : `‖∇‖ ${Number.isFinite(gnorm) ? gnorm.toExponential(1) : "∞"}`}
                </span>
              </div>
            );
          })}
        </div>

        <dl className="stats">
          <div>
            <dt>ステップ</dt>
            <dd>{race.steps}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
