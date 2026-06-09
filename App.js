import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import Overview from './src/screens/Overview';
import Sleep from './src/screens/Sleep';
import Trends from './src/screens/Trends';
import Upload from './src/screens/Upload';
import { colors } from './src/theme';
import { buildModel } from './src/data/buildModel';
import { loadStored } from './src/data/store';
import bundled from './src/data/health-data.json';

const TABS = [
  { key: 'overview', label: 'Overview', icon: '◎' },
  { key: 'sleep', label: 'Sleep', icon: '☾' },
  { key: 'trends', label: 'Trends', icon: '◔' },
  { key: 'import', label: 'Import', icon: '⤓' },
];

export default function App() {
  const [tab, setTab] = useState('overview');
  const [raw, setRaw] = useState(bundled);

  // On launch, prefer a previously imported export over the bundled sample.
  useEffect(() => {
    let alive = true;
    loadStored().then((stored) => {
      if (alive && stored && stored.daily && stored.daily.length) setRaw(stored);
    });
    return () => { alive = false; };
  }, []);

  const model = buildModel(raw);
  const { today: data, sleepStages: stages, week } = model;

  const onImported = (newRaw) => {
    setRaw(newRaw);
    setTab('overview');
  };

  return (
    <View style={s.root}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={s.safe}>
        <View style={s.content}>
          {tab === 'overview' && (
            <Overview data={data} source={data.source} onRefresh={() => {}} refreshing={false} />
          )}
          {tab === 'sleep' && <Sleep data={data} stages={stages} />}
          {tab === 'trends' && <Trends week={week} />}
          {tab === 'import' && (
            <Upload onImported={onImported} currentGeneratedAt={model.generatedAt} />
          )}
        </View>

        {/* Custom bottom tab bar */}
        <View style={s.tabBar}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <TouchableOpacity key={t.key} style={s.tabBtn} onPress={() => setTab(t.key)} activeOpacity={0.7}>
                <Text style={[s.tabIcon, { color: active ? colors.text : colors.textFaint }]}>{t.icon}</Text>
                <Text style={[s.tabLabel, { color: active ? colors.text : colors.textFaint }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#0A0A0A',
    paddingTop: 8,
    paddingBottom: 6,
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 22, marginBottom: 2 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
});
