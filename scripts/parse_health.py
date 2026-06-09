#!/usr/bin/env python3
"""Stream-parse Apple Health export.xml into a compact daily JSON for the app.

Usage:
  python3 scripts/parse_health.py /path/to/export.zip
  python3 scripts/parse_health.py /path/to/export.xml

Output: src/data/health-data.json
"""
import sys, os, json, zipfile, io
from collections import defaultdict
from datetime import datetime
import xml.etree.ElementTree as ET

QTYPES = {
    'HKQuantityTypeIdentifierHeartRateVariabilitySDNN': 'hrv',
    'HKQuantityTypeIdentifierRestingHeartRate': 'rhr',
    'HKQuantityTypeIdentifierRespiratoryRate': 'resp',
    'HKQuantityTypeIdentifierOxygenSaturation': 'spo2',
    'HKQuantityTypeIdentifierActiveEnergyBurned': 'energy',
    'HKQuantityTypeIdentifierHeartRate': 'hr',
}
SLEEP_T = 'HKCategoryTypeIdentifierSleepAnalysis'

# map Apple sleep category values -> our stage buckets
SLEEP_MAP = {
    'HKCategoryValueSleepAnalysisAwake': 'Awake',
    'HKCategoryValueSleepAnalysisAsleepREM': 'REM',
    'HKCategoryValueSleepAnalysisAsleepDeep': 'Deep (SWS)',
    'HKCategoryValueSleepAnalysisAsleepCore': 'Light',
    'HKCategoryValueSleepAnalysisAsleepUnspecified': 'Light',
    # 'HKCategoryValueSleepAnalysisInBed' ignored (overlaps stages)
}
STAGE_COLOR = {
    'Awake': '#FF6B6B', 'Light': '#7BA0FF', 'REM': '#9B6BFF', 'Deep (SWS)': '#2C4BFF',
}

def parse_dt(s):
    # "2025-01-30 08:35:13 +0530"
    return datetime.strptime(s, '%Y-%m-%d %H:%M:%S %z')

# daily accumulators
qsum = defaultdict(lambda: defaultdict(float))   # day -> metric -> sum
qcnt = defaultdict(lambda: defaultdict(int))     # day -> metric -> count
qmax = defaultdict(lambda: defaultdict(float))   # day -> metric -> max
sleep = defaultdict(lambda: defaultdict(float))  # day -> stage -> hours
workouts = []  # recent workouts

def open_xml(path):
    if path.endswith('.zip'):
        z = zipfile.ZipFile(path)
        name = next(n for n in z.namelist() if n.endswith('export.xml') and 'cda' not in n)
        return z.open(name)
    return open(path, 'rb')

def main(src):
    f = open_xml(src)
    ctx = ET.iterparse(f, events=('end',))
    n = 0
    for _, el in ctx:
        tag = el.tag
        if tag == 'Record':
            t = el.get('type')
            if t in QTYPES:
                metric = QTYPES[t]
                day = el.get('startDate', '')[:10]
                try:
                    v = float(el.get('value'))
                except (TypeError, ValueError):
                    el.clear(); continue
                if metric == 'spo2':
                    v *= 100.0
                if metric == 'energy':
                    qsum[day][metric] += v
                else:
                    qsum[day][metric] += v
                    qcnt[day][metric] += 1
                    if v > qmax[day][metric]:
                        qmax[day][metric] = v
            elif t == SLEEP_T:
                val = el.get('value')
                stage = SLEEP_MAP.get(val)
                if stage:
                    try:
                        dur = (parse_dt(el.get('endDate')) - parse_dt(el.get('startDate'))).total_seconds() / 3600.0
                    except Exception:
                        dur = 0
                    day = el.get('endDate', '')[:10]  # attribute to wake day
                    sleep[day][stage] += dur
            el.clear()
        elif tag == 'Workout':
            try:
                dur_min = float(el.get('duration', 0))
            except ValueError:
                dur_min = 0
            wtype = (el.get('workoutActivityType') or '').replace('HKWorkoutActivityType', '')
            day = el.get('startDate', '')[:10]
            kcal = 0.0
            for c in el.findall('WorkoutStatistics'):
                if c.get('type') == 'HKQuantityTypeIdentifierActiveEnergyBurned':
                    try: kcal = float(c.get('sum', 0))
                    except ValueError: kcal = 0.0
            workouts.append({'day': day, 'name': wtype or 'Workout',
                             'dur': round(dur_min), 'kcal': round(kcal)})
            el.clear()
        n += 1
        if n % 2_000_000 == 0:
            print(f'  ...{n:,} elements', file=sys.stderr)
    f.close()

    # build daily summaries (only days that have any signal)
    days = set(qsum) | set(sleep)
    daily = []
    for day in sorted(days):
        def avg(m):
            c = qcnt[day][m]
            return round(qsum[day][m] / c, 1) if c else None
        st = sleep.get(day, {})
        sleep_hrs = round(sum(v for k, v in st.items() if k != 'Awake'), 1)
        rec = {
            'date': day,
            'hrv': round(avg('hrv')) if avg('hrv') is not None else None,
            'rhr': round(avg('rhr')) if avg('rhr') is not None else None,
            'resp': avg('resp'),
            'spo2': round(avg('spo2')) if avg('spo2') is not None else None,
            'energy': round(qsum[day].get('energy', 0)),
            'maxHr': round(qmax[day].get('hr', 0)) or None,
            'avgHr': round(avg('hr')) if avg('hr') is not None else None,
            'sleepHrs': sleep_hrs or None,
            'stages': [
                {'name': k, 'hrs': round(v, 1), 'color': STAGE_COLOR[k]}
                for k, v in st.items() if k in STAGE_COLOR and v > 0.05
            ],
        }
        daily.append(rec)

    # keep last 90 days that actually have data
    daily = [d for d in daily if any(d[k] is not None for k in ('hrv', 'rhr', 'sleepHrs', 'energy'))]
    daily = daily[-90:]

    # recent workouts (last 10) attach color
    palette = ['#0093E7', '#16EC06', '#FFDE00', '#9B6BFF']
    recent_w = workouts[-10:]
    for i, w in enumerate(recent_w):
        w['color'] = palette[i % len(palette)]

    out = {'daily': daily, 'workouts': recent_w,
           'generatedAt': datetime.now().isoformat()}

    dest = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'health-data.json')
    dest = os.path.abspath(dest)
    with open(dest, 'w') as o:
        json.dump(out, o, separators=(',', ':'))
    print(f'Wrote {len(daily)} days, {len(recent_w)} workouts -> {dest}', file=sys.stderr)
    sz = os.path.getsize(dest)
    print(f'JSON size: {sz/1024:.0f} KB', file=sys.stderr)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('usage: parse_health.py <export.zip|export.xml>', file=sys.stderr); sys.exit(1)
    main(sys.argv[1])
