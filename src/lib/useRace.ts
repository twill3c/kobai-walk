"use client";

// レースループフック(F-06 / N-03)。描画は rAF、最適化は 1 フレームあたり
// batchSize(speed) ステップに制限。3 走者は同一スタート・同一 lr で同時に進む。
//
// 制約: モデル切替時は呼び出し側が key={model} で remount すること(フリート共通の教訓)。

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ModelKind,
  OptState,
  OptimizerKind,
  Params,
  Point,
} from "@/core/types";
import { initOpt, stepOpt } from "@/core/optim";
import { loss } from "@/core/model";
import type { Speed } from "@/core/schedule";
import { batchSize } from "@/core/schedule";

export const RACERS: readonly OptimizerKind[] = ["gd", "momentum", "adagrad"];

const LOSS_CAP = 512;
const TRAIL_CAP = 2000;

/** cap 超過で偶数 index を残して半減(kyokai-lab の pushLoss と同型) */
function pushCapped<T>(xs: T[], v: T, cap: number): T[] {
  const next = xs.length >= cap ? xs.filter((_, i) => i % 2 === 0) : [...xs];
  next.push(v);
  return next;
}

interface RaceState {
  states: Record<OptimizerKind, OptState>;
  trails: Record<OptimizerKind, Params[]>;
  losses: Record<OptimizerKind, number[]>;
  steps: number;
}

function freshRace(start: Params): RaceState {
  return {
    states: {
      gd: initOpt(start),
      momentum: initOpt(start),
      adagrad: initOpt(start),
    },
    trails: { gd: [start], momentum: [start], adagrad: [start] },
    losses: { gd: [], momentum: [], adagrad: [] },
    steps: 0,
  };
}

export interface Race extends RaceState {
  playing: boolean;
  speed: Speed;
  play: () => void;
  pause: () => void;
  stepOnce: () => void;
  reset: () => void;
  setSpeed: (s: Speed) => void;
}

export function useRace(
  model: ModelKind,
  data: Point[],
  start: Params,
  lr: number,
): Race {
  const [state, setState] = useState<RaceState>(() => freshRace(start));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(10);

  const lrRef = useRef(lr);
  lrRef.current = lr;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const advance = useCallback(
    (n: number) => {
      setState((cur) => {
        const states = { ...cur.states };
        const trails = { ...cur.trails };
        const losses = { ...cur.losses };
        for (let i = 0; i < n; i++) {
          for (const kind of RACERS) {
            const next = stepOpt(kind, model, data, states[kind], lrRef.current);
            states[kind] = next;
            trails[kind] = pushCapped(trails[kind], next.params, TRAIL_CAP);
            losses[kind] = pushCapped(
              losses[kind],
              loss(model, data, next.params.w, next.params.b),
              LOSS_CAP,
            );
          }
        }
        return { states, trails, losses, steps: cur.steps + n };
      });
    },
    [model, data],
  );

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      advance(batchSize(speedRef.current));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, advance]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const stepOnce = useCallback(() => {
    setPlaying(false);
    advance(1);
  }, [advance]);
  const reset = useCallback(() => {
    setPlaying(false);
    setState(freshRace(start));
  }, [start]);

  return {
    ...state,
    playing,
    speed,
    play,
    pause,
    stepOnce,
    reset,
    setSpeed,
  };
}
