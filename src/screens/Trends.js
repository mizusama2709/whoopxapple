import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { colors, recoveryColor } from '../theme';
import LineChart from '../components/LineChart';
import Svg, { Path, Polyline } from 'react-native-svg';

const METRICS = {
  recovery: { label: 'Recovery', unit: '%', max: 100, color: (v) => recoveryColor(v), key: 'recovery' },
  strain:   { label: 'Strain',   unit: '',  max: 21,  color: () => colors.strain,       key: 'strain' },
  sleepPerf:{ label: 'Sleep',    unit: '%', max: 100, color: () => colors.sleep,         key: 'sleepPerf' },
  hrv:      { label: 'HRV',      unit: 'ms',max: 100, color: () => colors.recoveryHigh,  key: 'hrv' },
};

const SERIES_METRICS = [
  { key: 'recovery', label: 'Recovery', unit: '%',  color: colors.recoveryHigh },
  { key: 'hrv',      label: 'HRV',      unit: 'ms', color: colors.recoveryHigh },
  { key: 'rhr',      label: 'Resting HR',unit: 'bpm',color: colors.recoveryMid },
  { key: 'sleepHrs', label: 'Sleep',    unit: 'h',  color: colors.sleep },
];

const RANGES = [
  { value: 7,  label: '7D' },
  { value: 30, label: '30D' },
  { value: 90, label: '90D' },
];

function Trends({ week = [], series = null, hrvBaseline }) {
  const [metric, setMetric] = useState('recovery');
  const [range, setRange] = useState(7);
  const { width } = useWindowDimensions();
  const chartWidth = width - 40;

  const m = METRICS[metric];
  const vals = week.map((d) => d[m.key]);
  const avg = (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0).toFixed(metric === 'strain' ? 1 : 0);

  const getSeriesSlice = (key) => {
    if (!series || !series[key]) return [];
    return series[key].slice(-range);
  };
  const dateSlice = series ? series.dates.slice(-range) : [];
  const firstDate = dateSlice[0] ? dateSlice[0].slice(5) : '';
  const lastDate  = dateSlice[dateSlice.length - 1] ? dateSlice[dateSlice.length - 1].slice(5) : '';

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Screen title + range segmented control */}
      <View style={s.titleRow}>
        <Text style={s.title}>Trends</Text>
        <View style={s.rangeControl}>
          {RANGES.map((r, i) => {
            const active = range === r.value;
            return (
              <TouchableOpacity
                key={r.value}
                onPress={() => setRange(r.value)}
                style={[
                  s.rangeSegment,
                  i === 0 && s.rangeSegmentFirst,
                  i === RANGES.length - 1 && s.rangeSegmentLast,
                  active && s.rangeSegmentActive,
                ]}
                activeOpacity={0.7}
              >
                <Text style={[s.rangeText, active && s.rangeTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {range === 7 ? (
        <>
          {/* Metric selector tabs */}
          <View style={s.metricControl}>
            {Object.keys(METRICS).map((k) => {
              const active = metric === k;
              return (
                <TouchableOpacity
                  key={k}
                  onPress={() => setMetric(k)}
                  style={[s.metricTab, active && s.metricTabActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[s.metricText, active && s.metricTextActive]}>{METRICS[k].label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Big average value */}
          <View style={s.avgSection}>
            <Text style={s.avgCaption}>7-DAY AVERAGE</Text>
            <View style={s.avgRow}>
              <Text style={[s.avgVal, { color: m.color(Number(avg)) }]}>{avg}</Text>
              {m.unit ? <Text style={[s.avgUnit, { color: m.color(Number(avg)) }]}>{m.unit}</Text> : null}
            </View>
          </View>

          {/* Bar chart */}
          <View style={s.barChartCard}>
            {week.length === 0 ? (
              <Text style={s.noData}>No data for the last 7 days.</Text>
            ) : (
              <View style={s.barChart}>
                {week.map((d) => {
                  const v = d[m.key];
                  const h = Math.max(4, (v / m.max) * 140);
                  const barColor = m.color(v);
                  return (
                    <View key={d.date || d.label} style={s.barCol}>
                      <Text style={s.barVal}>{metric === 'strain' ? v.toFixed(1) : Math.round(v)}</Text>
                      <View style={s.barTrack}>
                        <View style={[s.bar, { height: h, backgroundColor: barColor }]} />
                      </View>
                      <Text style={s.barLabel}>{d.label}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </>
      ) : (
        <>
          <Text style={s.subtitle}>
            {firstDate} – {lastDate}
          </Text>

          {series ? SERIES_METRICS.map(({ key, label, unit, color: lineColor }) => {
            const sliced = getSeriesSlice(key);
            const nonNull = sliced.filter((v) => v != null);
            if (!nonNull.length) return null;
            const avg30 = nonNull.reduce((a, b) => a + b, 0) / nonNull.length;
            const displayAvg = avg30.toFixed(unit === 'h' || unit === 'ms' ? 1 : 0);

            // HRV baseline SVG — only in 30d/90d view when baseline data is present
            let chartContent = null;
            if (key === 'hrv' && hrvBaseline && hrvBaseline.length > 0) {
              const padL = 6, padR = 6, padT = 10, padB = 18;
              const W = chartWidth, H = 100;
              const plotW = W - padL - padR;
              const plotH = H - padT - padB;

              // Map baseline entries by date for alignment with dateSlice
              const baseMap = {};
              (hrvBaseline || []).forEach(b => { baseMap[b.date] = b; });
              const aligned = dateSlice.map(date => baseMap[date] || null);
              const hasBaseline = aligned.some(b => b != null);

              if (hasBaseline) {
                // Unified y-scale spanning HRV values and band extremes
                const allVals = [
                  ...sliced.filter(v => v != null),
                  ...aligned.filter(Boolean).map(b => b.mean + b.sd),
                  ...aligned.filter(Boolean).map(b => b.mean - b.sd),
                ];
                const minV = Math.min(...allVals);
                const maxV = Math.max(...allVals);
                const yOf = v => padT + plotH - ((v - minV) / (maxV - minV || 1)) * plotH;
                const xOf = i => padL + (i / Math.max(dateSlice.length - 1, 1)) * plotW;

                // Band polygon: upper edge L→R, lower edge R→L, closed
                const upperPts = aligned
                  .map((b, i) => b ? `${xOf(i)},${yOf(b.mean + b.sd)}` : null)
                  .filter(Boolean);
                const lowerPts = aligned
                  .map((b, i) => b ? `${xOf(i)},${yOf(b.mean - b.sd)}` : null)
                  .filter(Boolean);
                const bandPath = upperPts.length > 0
                  ? `M${upperPts.join('L')}L${[...lowerPts].reverse().join('L')}Z`
                  : '';

                // Mean dashed line and HRV polyline
                const meanPts = aligned
                  .map((b, i) => b ? `${xOf(i)},${yOf(b.mean)}` : null)
                  .filter(Boolean)
                  .join(' ');
                const hrvPts = sliced
                  .map((v, i) => v != null ? `${xOf(i)},${yOf(v)}` : null)
                  .filter(Boolean)
                  .join(' ');

                chartContent = (
                  <Svg width={W} height={H}>
                    {bandPath ? (
                      <Path
                        d={bandPath}
                        fill={colors.recoveryHigh}
                        fillOpacity={0.12}
                      />
                    ) : null}
                    {meanPts ? (
                      <Polyline
                        points={meanPts}
                        fill="none"
                        stroke={colors.recoveryHigh}
                        strokeOpacity={0.4}
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />
                    ) : null}
                    {hrvPts ? (
                      <Polyline
                        points={hrvPts}
                        fill="none"
                        stroke={colors.recoveryHigh}
                        strokeWidth={2}
                      />
                    ) : null}
                  </Svg>
                );
              }
            }

            // Fall back to standard LineChart when no baseline SVG was built
            if (!chartContent) {
              chartContent = (
                <LineChart
                  data={sliced}
                  labels={[firstDate, lastDate]}
                  color={lineColor}
                  width={chartWidth}
                  height={100}
                />
              );
            }

            return (
              <View key={key} style={s.lineCard}>
                <View style={s.lineHeader}>
                  <View>
                    <Text style={s.lineName}>{label}</Text>
                    <View style={s.lineAvgRow}>
                      <Text style={[s.lineAvgVal, { color: lineColor }]}>{displayAvg}</Text>
                      <Text style={s.lineAvgUnit}>{unit} avg</Text>
                    </View>
                  </View>
                  <View style={[s.lineColorDot, { backgroundColor: lineColor }]} />
                </View>
                {chartContent}
              </View>
            );
          }) : (
            <Text style={s.noData}>No extended trend data available.</Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

export default React.memo(Trends);

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // Segmented control (range picker)
  rangeControl: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  rangeSegment: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  rangeSegmentFirst: {},
  rangeSegmentLast: { borderRightWidth: 0 },
  rangeSegmentActive: {
    backgroundColor: colors.surface4,
  },
  rangeText: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  rangeTextActive: { color: colors.text },

  // Metric selector (7d view)
  metricControl: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 14,
    backgroundColor: colors.surface2,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  metricTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  metricTabActive: { backgroundColor: colors.surface4 },
  metricText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  metricTextActive: { color: colors.text },

  avgSection: {
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 4,
  },
  avgCaption: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  avgRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 },
  avgVal: { fontSize: 56, fontWeight: '900', letterSpacing: -2, lineHeight: 60 },
  avgUnit: { fontSize: 22, fontWeight: '700', marginBottom: 8, marginLeft: 4 },

  barChartCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: colors.surface2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 180,
  },
  barCol: { alignItems: 'center', flex: 1 },
  barVal: { color: colors.textDim, fontSize: 10, marginBottom: 6, fontWeight: '600' },
  barTrack: { flex: 1, width: 26, justifyContent: 'flex-end' },
  bar: { width: 26, borderRadius: 6 },
  barLabel: { color: colors.textMuted, fontSize: 11, marginTop: 8, fontWeight: '500' },

  subtitle: {
    color: colors.textDim,
    fontSize: 13,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 4,
    fontWeight: '500',
  },

  lineCard: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: colors.surface2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    overflow: 'hidden',
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lineName: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  lineAvgRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  lineAvgVal: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  lineAvgUnit: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginLeft: 3, marginBottom: 3 },
  lineColorDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },

  noData: {
    color: colors.textDim,
    paddingHorizontal: 20,
    marginTop: 32,
    fontSize: 14,
  },
});
