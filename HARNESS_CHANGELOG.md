# HARNESS_CHANGELOG.md — ハーネス改訂台帳(kobai-walk)

原則: **エージェントがミスをするたびに、そのミスが二度と起きないようハーネスを改良する。**
起票条件: 同一失敗コード累計 2 回(LL-10)、または severity S1(LL-12)。

HC-001 は fleet 共通の looplog 記録規範(AGENTS.md §2 参照)。本台帳は HC-002 から始める。

---

## HC-002

| 項目 | 内容 |
|---|---|
| 起票日 | 2026-08-17 |
| トリガー | `VERIF-GAP` × 2(loop_002: TerrainCanvas が useMemo 内で document を触り SSR 500 / loop_002: 発散時の損失 NaN で RaceCurves が NaN 座標の SVG を生成) |
| 診断 | core 純関数主義によりテストが core に集中し、UI 層固有の失敗モード(SSR に DOM が無い・可視化への非有限値入力)にゲートがない。特に「発散」はこのアプリの主要機能なのに、非有限値の描画挙動が未定義だった |
| 改訂 | AGENTS.md §4 に追記: (1) クライアント専用 API(document / window / canvas)は useEffect 内でのみ触る(useMemo・レンダ本体では禁止) (2) 可視化系の純関数は非有限値(NaN / ±Inf)入力の挙動を仕様として定義し、core でテストする(発散を描く UI は非有限値が正常系) |
| 種別 | agents_md |
| SCAFFOLD_VERSION | 変更なし(プロジェクト局所。姉妹作でも同型 2 件(kyoka-grid のマップ切替・kyokai-lab 同型実装)が既出のため、再発すればレジストリ還流を検討) |
| 効果検証 | 以後 5 ループで VERIF-GAP 再発 0 件なら Closed |
| propagation | kobai-walk のみ |
| 状態 | Open |
