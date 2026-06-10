import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import Ring from '../components/Ring';
import MetricCard from '../components/MetricCard';
import MetricExplainer from '../components/MetricExplainer';
import { colors, recoveryColor } from '../theme';

function formatDate(iso) {
  if (!iso || iso.length < 10) return iso || '';
  const d = new Date(iso + 'T12:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function freshnessChip(dateStr) {
  if (!dateStr || dateStr.length < 10) return null;
  const daysOld = Math.floor((Date.now() - new Date(dateStr + 'T12:00:00')) / 86400000);
  const stale = daysOld > 14;
  const label = stale
    ? `Data ${daysOld}d old — import a fresh export`
    : `Updated ${daysOld === 0 ? 'today' : daysOld + 'd ago'}`;
  return { label, stale };
}

export default function Overview({ data, source, onRefresh, refreshing, recoveryDetail, generatedAt }) {
  const [showExplainer, setShowExplainer] = useState(false);
  const recCol = recoveryColor(data.recovery);
  const strainPct = data.strain / 21;
  const chip = freshnessChip(data.date);

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ paddingBottom: 48 }}
      refreshControl={<RefreshControl tintColor={colors.textDim} refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.greeting}>{getGreeting()}</Text>
            <Text style={s.date}>{formatDate(data.date)}</Text>
          </View>
          <View style={s.chips}>
            <View style={[s.sourceChip, { borderColor: source === 'apple-health' ? colors.recoveryHigh + '60' : colors.borderFaint }]}>
              <View style={[s.sourceDot, { backgroundColor: source === 'apple-health' ? colors.recoveryHigh : colors.textMuted }]} />
              <Text style={[s.sourceText, { color: source === 'apple-health' ? colors.recoveryHigh : colors.textMuted }]}>
                {source === 'apple-health' ? 'Apple Health' : 'Demo'}
              </Text>
            </View>
            {chip ? (
              <View style={[s.freshChip, chip.stale && s.freshChipStale]}>
                <Text style={[s.freshText, chip.stale && s.freshTextStale]}>{chip.label}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Recovery hero ring */}
      <TouchableOpacity style={s.hero} onPress={() => setShowExplainer(true)} activeOpacity={0.85}>
        <Ring size={220} stroke={17} progress={data.recovery / 100} color={recCol}>
          <Text style={[s.heroPct, { color: recCol }]}>{data.recovery}%</Text>
          <Text style={s.heroLabel}>RECOVERY</Text>
          <View style={s.heroHintWrap}>
            <Text style={s.heroHint}>tap for breakdown</Text>
          </View>
        </Ring>
      </TouchableOpacity>

      {/* Strain + Sleep dual rings */}
      <View style={s.dualRow}>
        <View style={s.dualCard}>
          <Ring size={120} stroke={10} progress={strainPct} color={colors.strain}>
            <Text style={[s.dualVal, { color: colors.strain }]}>{data.strain.toFixed(1)}</Text>
          </Ring>
          <Text style={s.dualLabel}>DAY STRAIN</Text>
          <Text style={s.dualSub}>target {data.strainTarget}</Text>
        </View>
        <View style={s.dualDivider} />
        <View style={s.dualCard}>
          <Ring size={120} stroke={10} progress={data.sleepPerf / 100} color={colors.sleep}>
            <Text style={[s.dualVal, { color: colors.sleep }]}>{data.sleepPerf}%</Text>
          </Ring>
          <Text style={s.dualLabel}>SLEEP PERF</Text>
          <Text style={s.dualSub}>{data.sleepActual}h of {data.sleepNeeded}h</Text>
        </View>
      </View>

      {/* Section header */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>METRICS</Text>
        <View style={s.sectionLine} />
      </View>

      {/* Metric grid */}
      <View style={s.grid}>
        <View style={s.gridRow}>
          <MetricCard label="HRV" value={data.hrv} unit="ms" accent={colors.recoveryHigh} />
          <MetricCard label="Resting HR" value={data.rhr} unit="bpm" accent={colors.recoveryMid} />
        </View>
        <View style={s.gridRow}>
          <MetricCard label="Resp Rate" value={data.respRate} unit="rpm" accent={colors.textDim} />
          <MetricCard label="Blood O₂" value={data.spo2} unit="%" accent={colors.sleep} />
        </View>
        <View style={s.gridRow}>
          <MetricCard label="Calories" value={data.calories} unit="kcal" accent={colors.strain} />
          <MetricCard label="Sleep Debt" value={(data.sleepNeeded - data.sleepActual).toFixed(1)} unit="h" accent={colors.recoveryLow} />
        </View>
      </View>

      <MetricExplainer
        visible={showExplainer}
        onClose={() => setShowExplainer(false)}
        title="Recovery"
        detail={recoveryDetail}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  date: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
  },
  chips: { alignItems: 'flex-end', gap: 6 },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.surface2,
    gap: 5,
  },
  sourceDot: { width: 6, height: 6, borderRadius: 3 },
  sourceText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  freshChip: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderFaint,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  freshChipStale: { borderColor: colors.recoveryMid + '50' },
  freshText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  freshTextStale: { color: colors.recoveryMid },

  hero: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  heroPct: {
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: -2,
  },
  heroLabel: {
    color: colors.textDim,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '700',
    marginTop: 2,
  },
  heroHintWrap: {
    marginTop: 8,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroHint: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  dualRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: colors.surface2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 20,
    alignItems: 'center',
  },
  dualCard: { flex: 1, alignItems: 'center' },
  dualDivider: {
    width: 1,
    height: 80,
    backgroundColor: colors.border,
  },
  dualVal: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  dualLabel: {
    color: colors.textDim,
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '700',
    marginTop: 10,
  },
  dualSub: { color: colors.textMuted, fontSize: 11, marginTop: 3, fontWeight: '500' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.borderFaint },

  grid: { paddingHorizontal: 16 },
  gridRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
});
