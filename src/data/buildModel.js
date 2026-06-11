// Pure transform: raw parsed export ({daily, workouts}) -> screen model.
// Used both for the bundled JSON and for a freshly uploaded export.
const SLEEP_NEEDED = 8.0;
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekday = (iso) => WEEKDAY[new Date(iso + 'T12:00:00').getDay()];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function deriveRecovery(hrv, rhr) {
  if (hrv == null || rhr == null) return 50;
  const hrvScore = Math.min(100, (hrv / 90) * 100);
  const rhrScore = Math.max(0, 100 - (rhr - 45) * 2);
  return Math.round(clamp(hrvScore * 0.6 + rhrScore * 0.4, 0, 100));
}

function deriveStrain(energy, maxHr) {
  const e = (energy || 0) / 250;
  const h = maxHr ? (maxHr - 100) / 12 : 0;
  return +clamp(e + Math.max(0, h), 0, 21).toFixed(1);
}

function sleepPerf(hrs) {
  if (!hrs) return 0;
  return Math.round(clamp((hrs / SLEEP_NEEDED) * 100, 0, 100));
}

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

const isComplete = (d) => d.hrv != null && d.sleepHrs != null;

export function buildModel(health) {
  const daily = (health && health.daily) || [];

  const latest = [...daily].reverse().find(isComplete) || daily[daily.length - 1] || {};

  const today = {
    date: latest.date || '—',
    source: 'apple-health',
    recovery: deriveRecovery(latest.hrv, latest.rhr),
    strain: deriveStrain(latest.energy, latest.maxHr),
    strainTarget: +(deriveRecovery(latest.hrv, latest.rhr) / 100 * 21).toFixed(1),
    sleepPerf: sleepPerf(latest.sleepHrs),
    hrv: latest.hrv ?? 0,
    rhr: latest.rhr ?? 0,
    respRate: latest.resp ?? 0,
    spo2: latest.spo2 ?? 0,
    sleepNeeded: SLEEP_NEEDED,
    sleepActual: latest.sleepHrs ?? 0,
    calories: latest.energy ?? 0,
    maxHr: latest.maxHr ?? 0,
    avgHr: latest.avgHr ?? 0,
  };

  const sleepStages =
    latest.stages && latest.stages.length
      ? latest.stages
      : [{ name: 'No sleep data', hrs: 1, color: '#333' }];

  const week = daily
    .filter(isComplete)
    .slice(-7)
    .map((d) => ({
      label: weekday(d.date),
      recovery: deriveRecovery(d.hrv, d.rhr),
      strain: deriveStrain(d.energy, d.maxHr),
      sleepPerf: sleepPerf(d.sleepHrs),
      hrv: d.hrv ?? 0,
      rhr: d.rhr ?? 0,
      sleepHrs: d.sleepHrs ?? 0,
    }));

  // Full series for trend charts — all days, null for missing, no isComplete filter
  const series = {
    dates: daily.map((d) => d.date),
    hrv: daily.map((d) => d.hrv ?? null),
    rhr: daily.map((d) => d.rhr ?? null),
    sleepHrs: daily.map((d) => d.sleepHrs ?? null),
    energy: daily.map((d) => (d.energy > 0 ? d.energy : null)),
    recovery: daily.map((d) => (d.hrv != null && d.rhr != null ? deriveRecovery(d.hrv, d.rhr) : null)),
  };

  // 14-night sleep history for Sleep screen
  const sleepHistory = daily
    .filter((d) => d.sleepHrs != null && d.stages && d.stages.length > 0)
    .slice(-14)
    .map((d) => ({ date: d.date, sleepHrs: d.sleepHrs, stages: d.stages }));

  const stageTotals = {};
  sleepHistory.forEach(({ stages }) => {
    stages.forEach(({ name, hrs }) => {
      stageTotals[name] = (stageTotals[name] || 0) + hrs;
    });
  });
  const stageAverages = {};
  if (sleepHistory.length > 0) {
    Object.keys(stageTotals).forEach((k) => {
      stageAverages[k] = +(stageTotals[k] / sleepHistory.length).toFixed(1);
    });
  }

  // Recovery detail for the explainer modal
  const hrv30 = median(daily.slice(-30).map((d) => d.hrv).filter((v) => v != null));
  const latestHrv = latest.hrv || 0;
  const latestRhr = latest.rhr || 0;
  const hrvScore = Math.round(Math.min(100, (latestHrv / 90) * 100));
  const rhrScore = Math.round(Math.max(0, 100 - (latestRhr - 45) * 2));
  const recoveryDetail = {
    recovery: today.recovery,
    hrv: latestHrv,
    rhr: latestRhr,
    hrvScore,
    rhrScore,
    baseline: hrv30,
    aboveBaseline: latestHrv >= hrv30,
  };

  const hrvsWithDate = daily.filter(d => d.hrv != null).map(d => ({ date: d.date, hrv: d.hrv }));
  const hrvBaseline = hrvsWithDate.map((d, i, arr) => {
    const window = arr.slice(Math.max(0, i - 29), i + 1).map(x => x.hrv);
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    const sd = window.length > 1
      ? Math.sqrt(window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / window.length)
      : 0;
    return { date: d.date, hrv: d.hrv, mean: +mean.toFixed(1), sd: +sd.toFixed(1) };
  });
  const latestBaseline = hrvBaseline.length ? hrvBaseline[hrvBaseline.length - 1] : null;
  const hrvDelta = latestBaseline && latestBaseline.mean > 0
    ? Math.round(((latestBaseline.hrv - latestBaseline.mean) / latestBaseline.mean) * 100)
    : null;

  const palette = ['#0093E7', '#16EC06', '#FFDE00', '#9B6BFF'];
  const workouts = ((health && health.workouts) || []).map((w, i) => ({
    name: w.name,
    dur: `${w.dur} min`,
    strain: deriveStrain(w.kcal, null),
    kcal: w.kcal,
    color: w.color || palette[i % palette.length],
  }));

  return { today, sleepStages, week, series, sleepHistory, stageAverages, recoveryDetail, workouts, generatedAt: health && health.generatedAt, hrvBaseline, hrvDelta };
}
