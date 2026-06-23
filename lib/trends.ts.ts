// lib/trends.ts
// Turns a time-ordered affect history into the "shape" a human reads off the
// Russell scatter plot, expressed as numbers an LLM can reason about.
// Pure functions, no dependencies. Safe on empty/short histories.

export type AffectPoint = {
  valence?: number | null;
  arousal?: number | null;
  predicted_emotion?: string | null;
  restlessness?: number | null;
  wellbeing_deviation?: number | null;
  created_at?: string | null;
};

export type TrendSummary = {
  nPoints: number;
  windowMinutes: number | null;
  current: { v: number; a: number; quadrant: string } | null;
  // drift = where the cloud is heading (recent mean minus earlier mean)
  drift: { dv: number; da: number; direction: string; speed: number } | null;
  // least-squares slope of v and a vs time (per-point), captures steady trend
  slope: { v: number; a: number } | null;
  // tightness: how clustered recent points are (low = settled, high = erratic)
  spread: number | null;
  volatility: number | null; // mean step size between consecutive points
  // share of recent time spent in each emotion quadrant
  quadrantShare: Record<string, number>;
  dominantQuadrant: string | null;
  restlessnessTrend: "rising" | "falling" | "steady" | null;
  wellbeing: { current: number | null; trend: "rising" | "falling" | "steady" | null };
  description: string; // one-line plain-English shape summary
};

function clampNum(x: any): number | null {
  return typeof x === "number" && isFinite(x) ? x : null;
}
function mean(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}
function quadrant(v: number, a: number): string {
  if (Math.hypot(v, a) < 0.2) return "UNCERTAIN";
  if (v >= 0 && a >= 0) return "HAPPY";
  if (v < 0 && a >= 0) return "ANGRY";
  if (v < 0 && a < 0) return "SAD";
  return "RELAXED";
}
// least-squares slope of y vs index 0..n-1, normalized to "per 10 points"
function slopePer10(ys: number[]): number {
  const n = ys.length;
  if (n < 3) return 0;
  const xm = (n - 1) / 2;
  const ym = mean(ys);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - xm) * (ys[i] - ym); den += (i - xm) ** 2; }
  return den === 0 ? 0 : (num / den) * 10;
}
function dirWord(dv: number, da: number): string {
  const eps = 0.05;
  const h = dv > eps ? "more positive" : dv < -eps ? "more negative" : "steady valence";
  const k = da > eps ? "more aroused" : da < -eps ? "calmer" : "steady arousal";
  if (Math.hypot(dv, da) < eps) return "holding steady";
  return `${h}, ${k}`;
}
function trendWord(slope: number, eps = 0.02): "rising" | "falling" | "steady" {
  return slope > eps ? "rising" : slope < -eps ? "falling" : "steady";
}

export function computeTrends(history: AffectPoint[], maxPoints = 120): TrendSummary {
  const pts = (history || [])
    .map((p) => ({
      v: clampNum(p.valence), a: clampNum(p.arousal),
      rest: clampNum(p.restlessness), well: clampNum(p.wellbeing_deviation),
      t: p.created_at ? new Date(p.created_at).getTime() : null,
    }))
    .filter((p) => p.v !== null && p.a !== null) as
    { v: number; a: number; rest: number | null; well: number | null; t: number | null }[];

  const recent = pts.slice(-maxPoints);
  const empty: TrendSummary = {
    nPoints: 0, windowMinutes: null, current: null, drift: null, slope: null,
    spread: null, volatility: null, quadrantShare: {}, dominantQuadrant: null,
    restlessnessTrend: null, wellbeing: { current: null, trend: null },
    description: "Not enough data yet to read a trend.",
  };
  if (recent.length === 0) return empty;

  const last = recent[recent.length - 1];
  const current = { v: last.v, a: last.a, quadrant: quadrant(last.v, last.a) };

  // window minutes
  let windowMinutes: number | null = null;
  const times = recent.map((p) => p.t).filter((t): t is number => t !== null);
  if (times.length >= 2) windowMinutes = Math.round((Math.max(...times) - Math.min(...times)) / 60000);

  // drift: recent third vs earlier third
  let drift: TrendSummary["drift"] = null;
  if (recent.length >= 6) {
    const k = Math.max(2, Math.floor(recent.length / 3));
    const early = recent.slice(0, k), late = recent.slice(-k);
    const dv = mean(late.map((p) => p.v)) - mean(early.map((p) => p.v));
    const da = mean(late.map((p) => p.a)) - mean(early.map((p) => p.a));
    drift = { dv, da, direction: dirWord(dv, da), speed: Math.hypot(dv, da) };
  }

  // slope per 10 points
  const slope = recent.length >= 3
    ? { v: slopePer10(recent.map((p) => p.v)), a: slopePer10(recent.map((p) => p.a)) }
    : null;

  // spread (tightness) over last third, and volatility (mean consecutive step)
  const tail = recent.slice(-Math.max(3, Math.floor(recent.length / 3)));
  const cv = mean(tail.map((p) => p.v)), ca = mean(tail.map((p) => p.a));
  const spread = tail.length
    ? Math.sqrt(mean(tail.map((p) => (p.v - cv) ** 2 + (p.a - ca) ** 2)))
    : null;
  let volatility: number | null = null;
  if (recent.length >= 2) {
    let steps = 0;
    for (let i = 1; i < recent.length; i++)
      steps += Math.hypot(recent[i].v - recent[i - 1].v, recent[i].a - recent[i - 1].a);
    volatility = steps / (recent.length - 1);
  }

  // quadrant share
  const share: Record<string, number> = {};
  for (const p of recent) { const q = quadrant(p.v, p.a); share[q] = (share[q] || 0) + 1; }
  for (const k of Object.keys(share)) share[k] = Math.round((share[k] / recent.length) * 100);
  const dominantQuadrant = Object.keys(share).sort((a, b) => share[b] - share[a])[0] || null;

  // restlessness + wellbeing trends
  const restVals = recent.map((p) => p.rest).filter((x): x is number => x !== null);
  const restlessnessTrend = restVals.length >= 3 ? trendWord(slopePer10(restVals)) : null;
  const wellVals = recent.map((p) => p.well).filter((x): x is number => x !== null);
  const wellbeing = {
    current: wellVals.length ? wellVals[wellVals.length - 1] : null,
    trend: wellVals.length >= 3 ? trendWord(slopePer10(wellVals)) : null,
  };

  const settled = spread !== null && spread < 0.25;
  const description =
    `${dominantQuadrant ?? "mixed"} has dominated the last ${recent.length} readings` +
    (windowMinutes ? ` (~${windowMinutes} min)` : "") +
    `; the trend is ${drift ? drift.direction : "still forming"}` +
    `; the cloud is ${settled ? "tight/settled" : spread !== null ? "spread out/restless" : "forming"}.`;

  return {
    nPoints: recent.length, windowMinutes, current, drift, slope,
    spread: spread === null ? null : +spread.toFixed(3),
    volatility: volatility === null ? null : +volatility.toFixed(3),
    quadrantShare: share, dominantQuadrant, restlessnessTrend, wellbeing, description,
  };
}
