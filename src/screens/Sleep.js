import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Ring from '../components/Ring';
import StackedBars from '../components/StackedBars';
import { colors } from '../theme';

const STAGE_ORDER = ['Deep (SWS)', 'REM', 'Light', 'Awake'];

export default function Sleep({ data, stages, sleepHistory = [], stageAverages = {} }) {
  const totalSleep = stages.reduce((a, b) => a + b.hrs, 0);
  const allStageNames = STAGE_ORDER.filter((n) => stageAverages[n] != null);

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Screen title */}
      <View style={s.titleRow}>
        <Text style={s.title}>Sleep</Text>
      </View>

      {/* Hero ring */}
      <View style={s.hero}>
        <Ring size={196} stroke={15} progress={data.sleepPerf / 100} color={colors.sleep}>
          <Text style={[s.pct, { color: colors.sleep }]}>{data.sleepPerf}%</Text>
          <Text style={s.pctLabel}>PERFORMANCE</Text>
        </Ring>
      </View>

      {/* Summary stats */}
      <View style={s.summary}>
        <View style={s.sumItem}>
          <Text style={s.sumVal}>{data.sleepActual}h</Text>
          <Text style={s.sumLabel}>Time asleep</Text>
        </View>
        <View style={s.sumDivider} />
        <View style={s.sumItem}>
          <Text style={s.sumVal}>{data.sleepNeeded}h</Text>
          <Text style={s.sumLabel}>Sleep goal</Text>
        </View>
        <View style={s.sumDivider} />
        <View style={s.sumItem}>
          <Text style={s.sumVal}>{Math.round((data.sleepActual / data.sleepNeeded) * 100)}%</Text>
          <Text style={s.sumLabel}>Fulfilled</Text>
        </View>
      </View>

      {/* Sleep stages section */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionLabel}>SLEEP STAGES</Text>
        <View style={s.sectionLine} />
      </View>

      {/* Stage bar — rounded, gapped segments */}
      <View style={s.stageBarWrap}>
        {stages.map((st, i) => {
          const isFirst = i === 0;
          const isLast = i === stages.length - 1;
          return (
            <View
              key={st.name}
              style={[
                s.stageSegment,
                { flex: st.hrs, backgroundColor: st.color },
                isFirst && s.stageSegmentFirst,
                isLast && s.stageSegmentLast,
              ]}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={s.legendCard}>
        {stages.map((st, i) => (
          <View key={st.name} style={[s.legendRow, i < stages.length - 1 && s.legendRowBorder]}>
            <View style={[s.dot, { backgroundColor: st.color }]} />
            <Text style={s.legendName}>{st.name}</Text>
            <Text style={s.legendVal}>{st.hrs.toFixed(1)}h</Text>
            <View style={s.legendPctWrap}>
              <Text style={s.legendPct}>{Math.round((st.hrs / totalSleep) * 100)}%</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 14-night history */}
      {sleepHistory.length > 1 ? (
        <>
          <View style={s.sectionHeader}>
            <Text style={s.sectionLabel}>LAST {sleepHistory.length} NIGHTS</Text>
            <View style={s.sectionLine} />
          </View>

          <View style={s.historyCard}>
            <StackedBars data={sleepHistory} height={64} />
          </View>

          {allStageNames.length > 0 ? (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionLabel}>STAGE AVERAGES</Text>
                <View style={s.sectionLine} />
              </View>

              <View style={s.avgCard}>
                {allStageNames.map((name, i) => {
                  const stageInfo = sleepHistory[0]?.stages?.find((st) => st.name === name);
                  const stageColor = stageInfo ? stageInfo.color : colors.textDim;
                  return (
                    <View key={name} style={[s.avgRow, i < allStageNames.length - 1 && s.avgRowBorder]}>
                      <View style={[s.avgAccent, { backgroundColor: stageColor }]} />
                      <View style={s.avgContent}>
                        <Text style={s.avgName}>{name}</Text>
                        <Text style={[s.avgVal, { color: stageColor }]}>
                          {stageAverages[name].toFixed(1)}h
                        </Text>
                      </View>
                      <Text style={s.avgUnit}>avg per night</Text>
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  titleRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  hero: { alignItems: 'center', marginTop: 16, marginBottom: 4 },
  pct: { fontSize: 48, fontWeight: '900', letterSpacing: -1.5 },
  pctLabel: {
    color: colors.textDim,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '700',
    marginTop: 2,
  },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
    backgroundColor: colors.surface2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 18,
  },
  sumItem: { flex: 1, alignItems: 'center' },
  sumDivider: { width: 1, height: 32, backgroundColor: colors.border },
  sumVal: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  sumLabel: { color: colors.textMuted, fontSize: 11, marginTop: 3, fontWeight: '500' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
    gap: 10,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.borderFaint },

  stageBarWrap: {
    flexDirection: 'row',
    height: 20,
    marginHorizontal: 20,
    gap: 2,
  },
  stageSegment: { borderRadius: 4 },
  stageSegmentFirst: { borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
  stageSegmentLast:  { borderTopRightRadius: 10, borderBottomRightRadius: 10 },

  legendCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: colors.surface2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  legendRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  legendName: { color: colors.text, fontSize: 14, flex: 1, fontWeight: '500' },
  legendVal: { color: colors.textSub, fontSize: 15, fontWeight: '700', width: 44, textAlign: 'right' },
  legendPctWrap: { width: 44, alignItems: 'flex-end' },
  legendPct: { color: colors.textMuted, fontSize: 13, width: 36, textAlign: 'right' },

  historyCard: {
    marginHorizontal: 20,
    backgroundColor: colors.surface2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    overflow: 'hidden',
  },

  avgCard: {
    marginHorizontal: 20,
    backgroundColor: colors.surface2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
  },
  avgRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
  },
  avgAccent: {
    width: 3,
    height: 36,
    borderRadius: 1.5,
    marginLeft: 16,
    marginRight: 14,
  },
  avgContent: { flex: 1 },
  avgName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  avgVal: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginTop: 1 },
  avgUnit: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
});
