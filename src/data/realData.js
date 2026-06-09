// Loads the parsed Apple Health export (scripts/parse_health.py output)
// and shapes it into the structures the screens expect. Pure JS + bundled
// JSON, so it runs in Expo Go with no native module / dev build.
import health from './health-data.json';

const SLEEP_NEEDED = 8.0; // hrs target

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekday = (iso) => WEEKDAY[new Date(iso + 'T12:00:00').getDay()];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Recovery isn't a native metric — WHOOP computes it. Proxy from HRV + RHR.
export function deriveRecovery(hrv, rhr) {
  if (hrv == null || rhr == null) return 50;
  const hrvScore = Math.min(100, (hrv / 90) * 100);
  const rhrScore = Math.max(0, 100 - (rhr - 45) * 2);
  return Math.round(clamp(hrvScore * 0.6 + rhrScore * 0.4, 0, 100));
}

// Day strain (0-21) proxy from active energy + peak HR.
function deriveStrain(energy, maxHr) {
  const e = (energy || 0) / 250;
  const h = maxHr ? (maxHr - 100) / 12 : 0;
  return +clamp(e + Math.max(0, h), 0, 21).toFixed(1);
}

function sleepPerf(hrs) {
  if (!hrs) return 0;
  return Math.round(clamp((hrs / SLEEP_NEEDED) * 100, 0, 100));
}

const daily = health.daily || [];

// A "complete" day has the signals the hero rings need.
const isComplete = (d) => d.hrv != null && d.sleepHrs != null;

// Most recent complete day = "today" in the app.
const latest = [...daily].reverse().find(isComplete) || daily[daily.length - 1] || {};

export const today = {
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

export const sleepStages =
  (latest.stages && latest.stages.length)
    ? latest.stages
    : [{ name: 'No sleep data', hrs: 1, color: '#333' }];

// Last 7 complete days for the trends chart.
export const week = daily
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

export const workouts = (health.workouts || []).map((w) => ({
  name: w.name,
  time: '',
  dur: `${w.dur} min`,
  strain: deriveStrain(w.kcal, null),
  kcal: w.kcal,
  avgHr: null,
  color: w.color,
}));
