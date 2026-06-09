import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, recoveryColor } from '../theme';
import { week } from '../data/realData';

const METRICS = {
  recovery: { label: 'Recovery', unit: '%', max: 100, color: (v) => recoveryColor(v), key: 'recovery' },
  strain: { label: 'Strain', unit: '', max: 21, color: () => colors.strain, key: 'strain' },
  sleepPerf: { label: 'Sleep', unit: '%', max: 100, color: () => colors.sleep, key: 'sleepPerf' },
  hrv: { label: 'HRV', unit: 'ms', max: 100, color: () => colors.recoveryHigh, key: 'hrv' },
};

export default function Trends() {
  const [metric, setMetric] = useState('recovery');
  const m = METRICS[metric];
  const vals = week.map((d) => d[m.key]);
  const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(metric === 'strain' ? 1 : 0);

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.title}>Trends</Text>
      <Text style={s.subtitle}>Last 7 days</Text>

      {/* Metric selector */}
      <View style={s.tabs}>
        {Object.keys(METRICS).map((k) => (
          <TouchableOpacity key={k} onPress={() => setMetric(k)} style={[s.tab, metric === k && s.tabActive]}>
            <Text style={[s.tabText, metric === k && s.tabTextActive]}>{METRICS[k].label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.avgRow}>
        <Text style={s.avgLabel}>7-DAY AVERAGE</Text>
        <Text style={[s.avgVal, { color: m.color(Number(avg)) }]}>{avg}{m.unit}</Text>
      </View>

      {/* Bar chart */}
      <View style={s.chart}>
        {week.map((d) => {
          const v = d[m.key];
          const h = Math.max(4, (v / m.max) * 150);
          return (
            <View key={d.label} style={s.barCol}>
              <Text style={s.barVal}>{metric === 'strain' ? v.toFixed(1) : Math.round(v)}</Text>
              <View style={[s.bar, { height: h, backgroundColor: m.color(v) }]} />
              <Text style={s.barLabel}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', paddingHorizontal: 20, paddingTop: 8 },
  subtitle: { color: colors.textDim, fontSize: 14, paddingHorizontal: 20, marginTop: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 18, gap: 8 },
  tab: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.text, borderColor: colors.text },
  tabText: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: colors.bg },
  avgRow: { paddingHorizontal: 20, marginTop: 24 },
  avgLabel: { color: colors.textDim, fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
  avgVal: { fontSize: 40, fontWeight: '900', marginTop: 4 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 28, height: 210 },
  barCol: { alignItems: 'center', flex: 1 },
  barVal: { color: colors.textDim, fontSize: 11, marginBottom: 6, fontWeight: '600' },
  bar: { width: 26, borderRadius: 6 },
  barLabel: { color: colors.textFaint, fontSize: 12, marginTop: 8 },
});
