// Persist the parsed export between launches.
import * as FS from 'expo-file-system/legacy';

const PATH = FS.documentDirectory + 'health-data.json';

export async function loadStored() {
  try {
    const info = await FS.getInfoAsync(PATH);
    if (!info.exists) return null;
    const txt = await FS.readAsStringAsync(PATH);
    return JSON.parse(txt);
  } catch (e) {
    return null;
  }
}

export async function saveStored(obj) {
  await FS.writeAsStringAsync(PATH, JSON.stringify(obj));
}

export async function clearStored() {
  try {
    await FS.deleteAsync(PATH, { idempotent: true });
  } catch (e) {}
}
