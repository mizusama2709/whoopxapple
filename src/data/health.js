// Health data service.
//
// Strategy: try to load the native HealthKit module. If it's missing
// (e.g. running in Expo Go or on Android), fall back to mock data so the
// UI always renders. In a dev build on a real iPhone this reads live
// Apple Health data.
//
// Requires a DEV BUILD (not Expo Go):
//   npx expo install @kingstinct/react-native-healthkit expo-dev-client
//   npx expo run:ios            (Mac + Xcode)   — or EAS build
//
import { today as mockToday, sleepStages as mockStages } from './mock';

let HK = null;
try {
  // eslint-disable-next-line global-require
  HK = require('@kingstinct/react-native-healthkit');
} catch (e) {
  HK = null;
}

export const isHealthKitAvailable = () => {
  if (!HK) return false;
  try {
    const fn = HK.isHealthDataAvailable || (HK.default && HK.default.isHealthDataAvailable);
    return typeof fn === 'function';
  } catch {
    return false;
  }
};

// HealthKit quantity identifiers we read, with the unit to request.
const ID = {
  hrv: { id: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN', unit: 'ms' },
  rhr: { id: 'HKQuantityTypeIdentifierRestingHeartRate', unit: 'count/min' },
  resp: { id: 'HKQuantityTypeIdentifierRespiratoryRate', unit: 'count/min' },
  spo2: { id: 'HKQuantityTypeIdentifierOxygenSaturation', unit: '%' },
  hr: { id: 'HKQuantityTypeIdentifierHeartRate', unit: 'count/min' },
  energy: { id: 'HKQuantityTypeIdentifierActiveEnergyBurned', unit: 'kcal' },
};

const CAT = {
  sleep: 'HKCategoryTypeIdentifierSleepAnalysis',
};

export async function requestPermissions() {
  if (!isHealthKitAvailable()) return false;
  const api = HK.default || HK;
  const reads = [...Object.values(ID).map((x) => x.id), ...Object.values(CAT)];
  try {
    // signature: requestAuthorization(toShare, toRead)
    await api.requestAuthorization([], reads);
    return true;
  } catch (e) {
    return false;
  }
}

async function latest(api, { id, unit }) {
  try {
    const sample = await api.getMostRecentQuantitySample(id, unit);
    return sample ? sample.quantity : null;
  } catch {
    return null;
  }
}

// Recovery isn't a native HealthKit metric — WHOOP computes it.
// We derive a rough proxy from HRV and resting HR so the ring has meaning.
function deriveRecovery(hrv, rhr) {
  if (hrv == null || rhr == null) return mockToday.recovery;
  const hrvScore = Math.min(100, (hrv / 90) * 100);   // higher HRV = better
  const rhrScore = Math.max(0, 100 - (rhr - 45) * 2);  // lower RHR = better
  return Math.round(Math.max(0, Math.min(100, hrvScore * 0.6 + rhrScore * 0.4)));
}

export async function getToday() {
  if (!isHealthKitAvailable()) {
    return { ...mockToday, source: 'mock' };
  }
  const api = HK.default || HK;
  const [hrv, rhr, resp, spo2, energy] = await Promise.all([
    latest(api, ID.hrv),
    latest(api, ID.rhr),
    latest(api, ID.resp),
    latest(api, ID.spo2),
    latest(api, ID.energy),
  ]);

  return {
    ...mockToday,
    source: 'healthkit',
    hrv: hrv != null ? Math.round(hrv) : mockToday.hrv,
    rhr: rhr != null ? Math.round(rhr) : mockToday.rhr,
    respRate: resp != null ? +resp.toFixed(1) : mockToday.respRate,
    spo2: spo2 != null ? Math.round(spo2) : mockToday.spo2,
    calories: energy != null ? Math.round(energy) : mockToday.calories,
    recovery: deriveRecovery(hrv, rhr),
  };
}

export async function getSleepStages() {
  // Detailed stage breakdown via HealthKit is involved; return mock for now.
  // TODO: aggregate HKCategoryValueSleepAnalysis segments into stages.
  return mockStages;
}
