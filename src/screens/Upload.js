import React, { useState } from 'react';
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
    try {
      const data = await parseExport(file.uri, file.name, (p) => {
        setProgress(p);
        setStatus(`Parsing… ${Math.round(p * 100)}%`);
      });
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
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <Text style={s.title}>Import Data</Text>
      <Text style={s.sub}>Apple Health → profile → Export All Health Data → share the export.zip here.</Text>

      <View style={s.steps}>
        <Step n="1" t="Open Apple Health app" d="Tap your photo (top-right) → Export All Health Data." />
        <Step n="2" t="Save the export.zip" d="Save to Files / iCloud, or AirDrop to this phone." />
        <Step n="3" t="Import below" d="Pick the export.zip. Parsing a large export can take a few minutes." />
      </View>

      <TouchableOpacity style={[s.btn, busy && s.btnOff]} onPress={pick} disabled={busy} activeOpacity={0.8}>
        {busy ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>Choose export file</Text>}
      </TouchableOpacity>

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
  btn: { backgroundColor: colors.text, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  btnOff: { opacity: 0.6 },
  btnText: { color: colors.bg, fontWeight: '800', fontSize: 16 },
  progWrap: { marginTop: 18 },
  progTrack: { height: 8, borderRadius: 4, backgroundColor: colors.track, overflow: 'hidden' },
  progFill: { height: 8, backgroundColor: colors.recoveryHigh },
  status: { color: colors.textDim, fontSize: 14, marginTop: 14 },
  error: { color: colors.recoveryLow, fontSize: 14, marginTop: 14, lineHeight: 20 },
  note: { color: colors.textFaint, fontSize: 13, marginTop: 28 },
  fine: { color: colors.textFaint, fontSize: 12, marginTop: 12, lineHeight: 18 },
});
