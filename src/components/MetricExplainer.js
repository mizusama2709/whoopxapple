import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, recoveryColor } from '../theme';

export default function MetricExplainer({ visible, onClose, title = 'Recovery', detail }) {
  if (!detail) return null;

  const recColor = recoveryColor(detail.recovery);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          {/* Handle pill */}
          <View style={s.handleWrap}>
            <View style={s.handle} />
          </View>

          {/* Title */}
          <Text style={s.sectionLabel}>{title.toUpperCase()}</Text>

          {/* Dramatic score display */}
          <View style={s.scoreRow}>
            <Text style={[s.score, { color: recColor }]}>{detail.recovery}</Text>
            <Text style={[s.scoreUnit, { color: recColor }]}>%</Text>
          </View>
          <Text style={s.scoreCaption}>
            {detail.recovery >= 67 ? 'Well recovered' : detail.recovery >= 34 ? 'Moderate recovery' : 'Low recovery'}
          </Text>

          <View style={s.divider} />

          {/* HRV row */}
          <View style={s.row}>
            <View style={s.rowLeft}>
              <Text style={s.rowLabel}>HRV</Text>
              <Text style={s.rowVal}>{detail.hrv} ms</Text>
            </View>
            <View style={s.rowRight}>
              <Text style={s.rowScore}>{detail.hrvScore} pts</Text>
              <Text style={s.rowWeight}>60% weight</Text>
            </View>
          </View>

          <View style={s.separator} />

          {/* RHR row */}
          <View style={s.row}>
            <View style={s.rowLeft}>
              <Text style={s.rowLabel}>Resting HR</Text>
              <Text style={s.rowVal}>{detail.rhr} bpm</Text>
            </View>
            <View style={s.rowRight}>
              <Text style={s.rowScore}>{detail.rhrScore} pts</Text>
              <Text style={s.rowWeight}>40% weight</Text>
            </View>
          </View>

          <View style={s.divider} />

          {/* Baseline note */}
          <Text style={s.note}>
            Your HRV is{' '}
            <Text style={{ color: detail.aboveBaseline ? colors.recoveryHigh : colors.recoveryLow, fontWeight: '700' }}>
              {detail.aboveBaseline ? 'above' : 'below'}
            </Text>
            {' '}your 30-day baseline of {detail.baseline} ms.
          </Text>
          <Text style={s.fine}>
            Recovery is estimated from HRV and resting heart rate. Apple Health has no native recovery metric.
          </Text>

          <TouchableOpacity style={s.btn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.btnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.80)',
  },
  sheet: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 48,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  handleWrap: { alignItems: 'center', paddingBottom: 20 },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.surface4,
    borderRadius: 2,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  score: {
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 76,
  },
  scoreUnit: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 2,
  },
  scoreCaption: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderFaint,
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: 'flex-end' },
  rowLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  rowVal: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 2, letterSpacing: -0.3 },
  rowScore: { color: colors.textSub, fontSize: 16, fontWeight: '700' },
  rowWeight: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  separator: {
    height: 1,
    backgroundColor: colors.borderFaint,
    marginLeft: 0,
  },
  note: {
    color: colors.textDim,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
  },
  fine: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 28,
  },
  btn: {
    backgroundColor: colors.text,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: { color: '#000', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
});
