import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../theme';
import { parseExport } from '../data/parseExport';
import { saveStored } from '../data/store';

export default function Upload({ onImported, currentGeneratedAt }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const cancelRef = useRef(null);
  const slowTimerRef = useRef(null);

  // Cleanup timers on unmount
  useEffect(() => () => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
  }, []);

  function cancel() {
    if (cancelRef.current) cancelRef.current();
  }

  async function pick() {
    setError('');
    setStatus('');
    let res;
    try {
      res = await DocumentPicker.getDocumentAsync({
        type: ['application/zip', 'application/xml', 'text/xml', '*/*'],
        copyToCacheDirectory: true,
      });
    } catch (e) {
      setError('Could not open file picker.');
      return;
    }
    if (res.canceled || !res.assets || !res.assets[0]) return;
    const file = res.assets[0];

    setBusy(true);
    setProgress(0);
    setStatus('Reading ' + (file.name || 'file') + '…');

    // If no progress after 8s, hint about iCloud
    slowTimerRef.current = setTimeout(() => {
      setStatus('Still reading… If picking from iCloud, the file may need to download first. Try Files app → long-press export.zip → Download Now, then re-import.');
    }, 8000);

    try {
      let rejectFn;
      const cancelPromise = new Promise((_, reject) => { rejectFn = reject; cancelRef.current = () => reject(new Error('Import cancelled')); });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timed out after 30s — the file may be stored in iCloud and not downloaded. In Files app, long-press export.zip → Download Now, then re-import.')), 30000)
      );

      const data = await Promise.race([
        parseExport(file.uri, file.name, (p) => {
          // Clear slow hint as soon as progress starts
          if (slowTimerRef.current) { clearTimeout(slowTimerRef.current); slowTimerRef.current = null; }
          setProgress(p);
          setStatus(`Parsing… ${Math.round(p * 100)}%`);
        }),
        timeoutPromise,
        cancelPromise,
      ]);

      if (!data.daily.length) {
        throw new Error('No health records found. Pick the Apple Health export.zip (or export.xml inside it).');
      }
      await saveStored(data);
      setStatus(`Imported ${data.daily.length} days. Latest: ${data.daily[data.daily.length - 1].date}`);
      onImported(data);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
      cancelRef.current = null;
      if (slowTimerRef.current) { clearTimeout(slowTimerRef.current); slowTimerRef.current = null; }
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <Text style={s.title}>Import Data</Text>
      <Text style={s.sub}>Apple Health → profile → Export All Health Data → share the export.zip here.</Text>

      <View style={s.steps}>
        <Step n="1" t="Export from Apple Health" d="Tap your photo (top-right) → Export All Health Data." />
        <Step n="2" t="Download the file locally" d="In Files app, find export.zip → long-press → Download Now. Must be fully downloaded (no cloud icon) before importing." />
        <Step n="3" t="Import below" d="Pick the export.zip from Files. Parsing a large export can take a minute." />
      </View>

      {busy ? (
        <View style={s.busyRow}>
          <View style={[s.btn, s.btnOff, { flex: 1 }]}>
            <ActivityIndicator color="#000" />
          </View>
          <TouchableOpacity style={s.cancelBtn} onPress={cancel} activeOpacity={0.7}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={s.btn} onPress={pick} activeOpacity={0.8}>
          <Text style={s.btnText}>Choose export file</Text>
        </TouchableOpacity>
      )}

      {busy ? (
        <View style={s.progWrap}>
          <View style={s.progTrack}>
            <View style={[s.progFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </View>
      ) : null}

      {status ? <Text style={s.status}>{status}</Text> : null}
      {error ? <Text style={s.error}>{error}</Text> : null}

      <Text style={s.note}>
        {currentGeneratedAt
          ? `Showing imported data from ${new Date(currentGeneratedAt).toLocaleString()}.`
          : 'Currently showing the bundled sample export.'}
      </Text>
      <Text style={s.fine}>
        Parsing runs entirely on your phone — nothing is uploaded anywhere. Recovery & strain are
        estimates (Apple Health has no native recovery/strain metric).
      </Text>
    </ScrollView>
  );
}

function Step({ n, t, d }) {
  return (
    <View style={s.step}>
      <View style={s.stepNum}><Text style={s.stepNumT}>{n}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={s.stepT}>{t}</Text>
        <Text style={s.stepD}>{d}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 6, lineHeight: 20 },
  steps: { marginTop: 22, marginBottom: 8 },
  step: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepNumT: { color: colors.text, fontWeight: '800', fontSize: 13 },
  stepT: { color: colors.text, fontSize: 15, fontWeight: '600' },
  stepD: { color: colors.textDim, fontSize: 13, marginTop: 2, lineHeight: 18 },
  busyRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { backgroundColor: colors.text, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  btnOff: { opacity: 0.6 },
  btnText: { color: colors.bg, fontWeight: '800', fontSize: 16 },
  cancelBtn: { marginTop: 16, backgroundColor: colors.surface3, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.textDim, fontWeight: '700', fontSize: 15 },
  progWrap: { marginTop: 18 },
  progTrack: { height: 8, borderRadius: 4, backgroundColor: colors.track, overflow: 'hidden' },
  progFill: { height: 8, backgroundColor: colors.recoveryHigh },
  status: { color: colors.textDim, fontSize: 13, marginTop: 14, lineHeight: 19 },
  error: { color: colors.recoveryLow, fontSize: 14, marginTop: 14, lineHeight: 20 },
  note: { color: colors.textFaint, fontSize: 13, marginTop: 28 },
  fine: { color: colors.textFaint, fontSize: 12, marginTop: 12, lineHeight: 18 },
});
