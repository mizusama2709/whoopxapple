import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Ring from '../components/Ring';
import { colors } from '../theme';

export default function Sleep({ data, stages }) {
  const totalSleep = stages.reduce((a, b) => a + b.hrs, 0);

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.title}>Sleep</Text>

      <View style={s.hero}>
        <Ring size={190} stroke={15} progress={data.sleepPerf / 100} color={colors.sleep}>
          <Text style={[s.pct, { color: colors.sleep }]}>{data.sleepPerf}%</Text>
          <Text style={s.pctLabel}>PERFORMANCE</Text>
        </Ring>
      </View>

      <View style={s.summary}>
        <View style={s.sumItem}>
          <Text style={s.sumVal}>{data.sleepActual}h</Text>
          <Text style={s.sumLabel}>Time asleep</Text>
        </View>
        <View style={s.sumItem}>
          <Text style={s.sumVal}>{data.sleepNeeded}h</Text>
          <Text style={s.sumLabel}>Needed</Text>
        </View>
        <View style={s.sumItem}>
          <Text style={s.sumVal}>{Math.round((data.sleepActual / data.sleepNeeded) * 100)}%</Text>
          <Text style={s.sumLabel}>Fulfilled</Text>
        </View>
      </View>

      {/* Stacked stage bar */}
      <Text style={s.section}>SLEEP STAGES</Text>
      <View style={s.stageBar}>
        {stages.map((st) => (
          <View key={st.name} style={{ flex: st.hrs, backgroundColor: st.color }} />
        ))}
      </View>

      <View style={s.legend}>
        {stages.map((st) => (
          <View key={st.name} style={s.legendRow}>
            <View style={[s.dot, { backgroundColor: st.color }]} />
            <Text style={s.legendName}>{st.name}</Text>
            <Text style={s.legendVal}>{st.hrs.toFixed(1)}h</Text>
            <Text style={s.legendPct}>{Math.round((st.hrs / totalSleep) * 100)}%</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', paddingHorizontal: 20, paddingTop: 8 },
  hero: { alignItems: 'center', marginTop: 16 },
  pct: { fontSize: 46, fontWeight: '900' },
  pctLabel: { color: colors.textDim, fontSize: 11, letterSpacing: 2, fontWeight: '700', marginTop: 2 },
  summary: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, marginBottom: 8 },
  sumItem: { alignItems: 'center' },
  sumVal: { color: colors.text, fontSize: 22, fontWeight: '800' },
  sumLabel: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  section: { color: colors.textDim, fontSize: 11, letterSpacing: 1.5, fontWeight: '700', paddingHorizontal: 20, marginTop: 24, marginBottom: 10 },
  stageBar: { flexDirection: 'row', height: 22, marginHorizontal: 20, borderRadius: 6, overflow: 'hidden' },
  legend: { paddingHorizontal: 20, marginTop: 16 },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  legendName: { color: colors.text, fontSize: 15, flex: 1 },
  legendVal: { color: colors.textDim, fontSize: 15, width: 50, textAlign: 'right' },
  legendPct: { color: colors.textFaint, fontSize: 14, width: 44, textAlign: 'right' },
});
