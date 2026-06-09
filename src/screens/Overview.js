import React from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import Ring from '../components/Ring';
import MetricCard from '../components/MetricCard';
import { colors, recoveryColor } from '../theme';

function formatDate(iso) {
  if (!iso || iso.length < 10) return iso || '';
  const d = new Date(iso + 'T12:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Overview({ data, source, onRefresh, refreshing }) {
  const recCol = recoveryColor(data.recovery);
  const strainPct = data.strain / 21;
  const sleepDebt = (data.sleepNeeded - data.sleepActual).toFixed(1);

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl tintColor="#fff" refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={s.header}>
        <Text style={s.hello}>Good morning</Text>
        <Text style={s.date}>{formatDate(data.date)}</Text>
        <Text style={[s.sourceTag, { color: source === 'apple-health' ? colors.recoveryHigh : colors.textFaint }]}>
          {source === 'apple-health' ? '● Apple Health export' : '○ Demo data (mock)'}
        </Text>
      </View>

      {/* Recovery hero ring */}
      <View style={s.hero}>
        <Ring size={210} stroke={16} progress={data.recovery / 100} color={recCol}>
          <Text style={[s.heroPct, { color: recCol }]}>{data.recovery}%</Text>
          <Text style={s.heroLabel}>RECOVERY</Text>
        </Ring>
      </View>

      {/* Strain + Sleep dual rings */}
      <View style={s.dualRow}>
        <View style={s.dualItem}>
          <Ring size={130} stroke={11} progress={strainPct} color={colors.strain}>
            <Text style={[s.dualVal, { color: colors.strain }]}>{data.strain.toFixed(1)}</Text>
          </Ring>
          <Text style={s.dualLabel}>DAY STRAIN</Text>
          <Text style={s.dualSub}>target {data.strainTarget}</Text>
        </View>
        <View style={s.dualItem}>
          <Ring size={130} stroke={11} progress={data.sleepPerf / 100} color={colors.sleep}>
            <Text style={[s.dualVal, { color: colors.sleep }]}>{data.sleepPerf}%</Text>
          </Ring>
          <Text style={s.dualLabel}>SLEEP</Text>
          <Text style={s.dualSub}>{data.sleepActual}h / {data.sleepNeeded}h</Text>
        </View>
      </View>

      {/* Metric grid */}
      <View style={s.grid}>
        <View style={s.gridRow}>
          <MetricCard label="HRV" value={data.hrv} unit="ms" accent={colors.recoveryHigh} />
          <MetricCard label="Resting HR" value={data.rhr} unit="bpm" accent={colors.recoveryMid} />
        </View>
        <View style={s.gridRow}>
          <MetricCard label="Resp Rate" value={data.respRate} unit="rpm" />
          <MetricCard label="Blood O₂" value={data.spo2} unit="%" accent={colors.sleep} />
        </View>
        <View style={s.gridRow}>
          <MetricCard label="Calories" value={data.calories} unit="kcal" accent={colors.strain} />
          <MetricCard label="Sleep Debt" value={sleepDebt} unit="h" accent={colors.recoveryLow} />
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  hello: { color: colors.text, fontSize: 28, fontWeight: '800' },
  date: { color: colors.textDim, fontSize: 14, marginTop: 2 },
  sourceTag: { fontSize: 11, marginTop: 6, fontWeight: '600' },
  hero: { alignItems: 'center', marginTop: 16, marginBottom: 8 },
  heroPct: { fontSize: 52, fontWeight: '900' },
  heroLabel: { color: colors.textDim, fontSize: 12, letterSpacing: 2, fontWeight: '700', marginTop: 2 },
  dualRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, marginBottom: 8 },
  dualItem: { alignItems: 'center' },
  dualVal: { fontSize: 28, fontWeight: '800' },
  dualLabel: { color: colors.textDim, fontSize: 11, letterSpacing: 1.5, fontWeight: '700', marginTop: 8 },
  dualSub: { color: colors.textFaint, fontSize: 11, marginTop: 2 },
  grid: { paddingHorizontal: 16, marginTop: 16 },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
});
