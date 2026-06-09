// Mock WHOOP-style data. Expo Go can't read HealthKit (needs a dev build),
// so we simulate realistic daily metrics. Swap this module for real
// HealthKit/WHOOP API wiring in a custom dev build later.

const day = (label, recovery, strain, sleepPerf, hrv, rhr, sleepHrs) => ({
  label, recovery, strain, sleepPerf, hrv, rhr, sleepHrs,
});

export const today = {
  date: 'Today',
  recovery: 72,        // %
  strain: 11.4,        // 0-21 scale
  strainTarget: 14.2,
  sleepPerf: 86,       // %
  hrv: 68,             // ms
  rhr: 54,             // bpm
  respRate: 14.8,      // rpm
  spo2: 97,            // %
  skinTemp: 33.4,      // °C
  sleepNeeded: 8.2,    // hrs
  sleepActual: 7.1,    // hrs
  calories: 2380,      // kcal
  maxHr: 162,
  avgHr: 118,
};

export const sleepStages = [
  { name: 'Awake', hrs: 0.4, color: '#FF6B6B' },
  { name: 'Light', hrs: 3.6, color: '#7BA0FF' },
  { name: 'REM', hrs: 1.7, color: '#9B6BFF' },
  { name: 'Deep (SWS)', hrs: 1.4, color: '#2C4BFF' },
];

export const week = [
  day('Mon', 64, 13.1, 78, 58, 56, 6.8),
  day('Tue', 81, 8.4, 91, 74, 52, 8.1),
  day('Wed', 45, 16.2, 70, 41, 60, 6.1),
  day('Thu', 88, 6.9, 94, 82, 51, 8.4),
  day('Fri', 59, 14.7, 81, 53, 57, 7.0),
  day('Sat', 76, 12.3, 88, 69, 53, 7.6),
  day('Sun', 72, 11.4, 86, 68, 54, 7.1),
];

export const workouts = [
  { name: 'Running', time: '7:12 AM', dur: '42 min', strain: 9.8, kcal: 540, avgHr: 148, color: '#0093E7' },
  { name: 'Strength', time: '6:05 PM', dur: '55 min', strain: 6.2, kcal: 310, avgHr: 121, color: '#16EC06' },
];
