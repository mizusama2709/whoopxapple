// On-device streaming parser for Apple Health export (zip or xml).
// Never loads the whole 400MB+ file: reads the file in fixed byte chunks,
// (optionally) inflates them through fflate's streaming Unzip, and scans the
// decompressed text incrementally for <Record>/<Workout> elements.
import { File as FSFile } from 'expo-file-system/next';
import { Unzip, UnzipInflate } from 'fflate';


const QTYPES = {
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: 'hrv',
  HKQuantityTypeIdentifierRestingHeartRate: 'rhr',
  HKQuantityTypeIdentifierRespiratoryRate: 'resp',
  HKQuantityTypeIdentifierOxygenSaturation: 'spo2',
  HKQuantityTypeIdentifierActiveEnergyBurned: 'energy',
  HKQuantityTypeIdentifierHeartRate: 'hr',
};
const SLEEP_T = 'HKCategoryTypeIdentifierSleepAnalysis';
const SLEEP_MAP = {
  HKCategoryValueSleepAnalysisAwake: 'Awake',
  HKCategoryValueSleepAnalysisAsleepREM: 'REM',
  HKCategoryValueSleepAnalysisAsleepDeep: 'Deep (SWS)',
  HKCategoryValueSleepAnalysisAsleepCore: 'Light',
  HKCategoryValueSleepAnalysisAsleepUnspecified: 'Light',
};
const STAGE_COLOR = { Awake: '#FF6B6B', Light: '#7BA0FF', REM: '#9B6BFF', 'Deep (SWS)': '#2C4BFF' };

// bytes -> string treating as latin1 (safe: the fields we read are ASCII).
// TextDecoder is available in Hermes (RN 0.70+) and is ~10x faster than the
// old char-by-char loop — single native call, no intermediate allocations.
const _latin1Dec = new TextDecoder('latin1');
function bytesToStr(u8) {
  return _latin1Dec.decode(u8);
}

function attr(s, name) {
  const i = s.indexOf(name + '="');
  if (i < 0) return null;
  const start = i + name.length + 2;
  const end = s.indexOf('"', start);
  return end < 0 ? null : s.slice(start, end);
}

// "2025-01-30 08:35:13 +0530" -> ms
function appleMs(s) {
  if (!s || s.length < 25) return NaN;
  const iso = s.slice(0, 10) + 'T' + s.slice(11, 19) + s.slice(20, 23) + ':' + s.slice(23, 25);
  return Date.parse(iso);
}

export async function parseExport(uri, name, onProgress) {
  const fsFile = new FSFile(uri);
  const total = fsFile.size || 0;
  const isZip = /\.zip$/i.test(name || uri);
  if (!total) throw new Error('Could not read file size — re-pick the export from the Files app, not iCloud Drive');
  console.log('[parseExport] start', { total, isZip, name });

  // aggregation state
  const agg = {}; // day -> {sum:{}, cnt:{}, max:{}}
  const sleep = {}; // day -> {stage: hours}
  const workouts = [];

  const dayBucket = (d) => (agg[d] || (agg[d] = { sum: {}, cnt: {}, max: {} }));

  let leftover = '';
  // Process in 512KB sub-slices so leftover stays small even when fflate
  // delivers 100MB+ in a single ondata callback.
  const SUB = 512 * 1024;
  function feed(u8) {
    for (let i = 0; i < u8.length; i += SUB) {
      leftover += bytesToStr(u8.subarray(i, Math.min(i + SUB, u8.length)));
      const cut = leftover.lastIndexOf('>');
      if (cut < 0) continue;
      scan(leftover.slice(0, cut + 1));
      leftover = leftover.slice(cut + 1);
    }
  }
  // Single regex pass — one scan instead of two indexOf calls per iteration.
  // The alternation |Workout means we find whichever tag comes first in one go.
  const TAG_RE = /<(Record|Workout) /g;
  function scan(text) {
    TAG_RE.lastIndex = 0;
    let m;
    while ((m = TAG_RE.exec(text)) !== null) {
      const next = m.index;
      const kind = m[1][0]; // 'R' or 'W'
      const gt = text.indexOf('>', next);
      if (gt < 0) break;
      const tag = text.slice(next, gt);
      if (kind === 'R') handleRecord(tag); else handleWorkout(tag);
      TAG_RE.lastIndex = gt + 1;
    }
  }
  function handleRecord(tag) {
    const t = attr(tag, 'type');
    if (!t) return;
    if (QTYPES[t]) {
      const m = QTYPES[t];
      const day = (attr(tag, 'startDate') || '').slice(0, 10);
      if (!day) return;
      let v = parseFloat(attr(tag, 'value'));
      if (isNaN(v)) return;
      if (m === 'spo2') v *= 100;
      const b = dayBucket(day);
      b.sum[m] = (b.sum[m] || 0) + v;
      if (m !== 'energy') {
        b.cnt[m] = (b.cnt[m] || 0) + 1;
        if (!(m in b.max) || v > b.max[m]) b.max[m] = v;
      }
    } else if (t === SLEEP_T) {
      const stage = SLEEP_MAP[attr(tag, 'value')];
      if (!stage) return;
      const dur = (appleMs(attr(tag, 'endDate')) - appleMs(attr(tag, 'startDate'))) / 3600000;
      if (!(dur > 0)) return;
      const day = (attr(tag, 'endDate') || '').slice(0, 10);
      if (!day) return;
      (sleep[day] || (sleep[day] = {}))[stage] = (sleep[day][stage] || 0) + dur;
    }
  }
  function handleWorkout(tag) {
    const day = (attr(tag, 'startDate') || '').slice(0, 10);
    const dur = parseFloat(attr(tag, 'duration')) || 0;
    const kcal = parseFloat(attr(tag, 'totalEnergyBurned')) || 0;
    const name2 = (attr(tag, 'workoutActivityType') || '').replace('HKWorkoutActivityType', '');
    if (day) workouts.push({ day, name: name2 || 'Workout', dur: Math.round(dur), kcal: Math.round(kcal) });
  }

  // ---- read loop ----
  // Throttle progress callbacks to 1% increments — avoids thousands of React
  // re-renders for a 400MB file read in small chunks.
  let lastProgressPct = -1;
  function maybeProgress(bytesRead) {
    if (!onProgress) return;
    const pct = Math.floor((bytesRead / total) * 100);
    if (pct > lastProgressPct) {
      lastProgressPct = pct;
      onProgress(bytesRead / total);
    }
  }

  if (isZip) {
    let started = false;
    let fatal = null;
    const unzip = new Unzip();
    unzip.register(UnzipInflate);
    unzip.onfile = (file) => {
      if (file.name.endsWith('export.xml') && !file.name.includes('export_cda')) {
        started = true;
        file.ondata = (err, chunk) => {
          if (err) { fatal = err; return; }
          try { feed(chunk); } catch (e) { fatal = e; }
        };
        file.start();
      }
    };
    let bytesRead = 0;
    const stream = new FSFile(uri).readableStream();
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      unzip.push(value, false);
      if (fatal) throw fatal;
      bytesRead += value.length;
      maybeProgress(bytesRead);
      await new Promise((r) => setTimeout(r, 0));
    }
    unzip.push(new Uint8Array(0), true);
    if (!started) throw new Error('export.xml not found in zip');
  } else {
    let bytesRead = 0;
    const stream = new FSFile(uri).readableStream();
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      feed(value);
      bytesRead += value.length;
      maybeProgress(bytesRead);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  // ---- finalize daily ----
  const days = new Set([...Object.keys(agg), ...Object.keys(sleep)]);
  const daily = [];
  for (const day of [...days].sort()) {
    const b = agg[day] || { sum: {}, cnt: {}, max: {} };
    const avg = (m) => (b.cnt[m] ? b.sum[m] / b.cnt[m] : null);
    const st = sleep[day] || {};
    const sleepHrs = Object.entries(st).reduce((a, [k, v]) => a + (k === 'Awake' ? 0 : v), 0);
    daily.push({
      date: day,
      hrv: avg('hrv') != null ? Math.round(avg('hrv')) : null,
      rhr: avg('rhr') != null ? Math.round(avg('rhr')) : null,
      resp: avg('resp') != null ? +avg('resp').toFixed(1) : null,
      spo2: avg('spo2') != null ? Math.round(avg('spo2')) : null,
      energy: Math.round(b.sum.energy || 0),
      maxHr: b.max.hr != null ? Math.round(b.max.hr) : null,
      avgHr: avg('hr') != null ? Math.round(avg('hr')) : null,
      sleepHrs: sleepHrs > 0 ? +sleepHrs.toFixed(1) : null,
      stages: Object.entries(st)
        .filter(([k, v]) => STAGE_COLOR[k] && v > 0.05)
        .map(([k, v]) => ({ name: k, hrs: +v.toFixed(1), color: STAGE_COLOR[k] })),
    });
  }
  const filtered = daily
    .filter((d) => d.hrv != null || d.rhr != null || d.sleepHrs != null || d.energy)
    .slice(-90);

  const palette = ['#0093E7', '#16EC06', '#FFDE00', '#9B6BFF'];
  const recentW = workouts.slice(-10).map((w, i) => ({ ...w, color: palette[i % palette.length] }));

  return { daily: filtered, workouts: recentW, generatedAt: new Date().toISOString() };
}
