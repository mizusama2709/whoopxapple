import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import Overview from './src/screens/Overview';
import Sleep from './src/screens/Sleep';
import Trends from './src/screens/Trends';
import { colors } from './src/theme';
import { today as healthToday, sleepStages as healthStages } from './src/data/realData';

const TABS = [
  { key: 'overview', label: 'Overview', icon: '◎' },
  { key: 'sleep', label: 'Sleep', icon: '☾' },
  { key: 'trends', label: 'Trends', icon: '◔' },
];

export default function App() {
  const [tab, setTab] = useState('overview');
  const data = healthToday;
  const stages = healthStages;
  const load = useCallback(() => {}, []);

  return (
    <View style={s.root}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={s.safe}>
        <View style={s.content}>
          {tab === 'overview' && (
            <Overview data={data} source={data.source} onRefresh={load} refreshing={false} />
          )}
          {tab === 'sleep' && <Sleep data={data} stages={stages} />}
          {tab === 'trends' && <Trends />}
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
