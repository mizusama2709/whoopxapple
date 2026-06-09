import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function MetricCard({ label, value, unit, accent = colors.text, sub }) {
  return (
    <View style={s.card}>
      <Text style={s.label}>{label}</Text>
      <View style={s.row}>
        <Text style={[s.value, { color: accent }]}>{value}</Text>
        {unit ? <Text style={s.unit}>{unit}</Text> : null}
      </View>
      {sub ? <Text style={s.sub}>{sub}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.textDim, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 },
  value: { fontSize: 26, fontWeight: '800' },
  unit: { color: colors.textDim, fontSize: 13, marginLeft: 4, marginBottom: 4, fontWeight: '600' },
  sub: { color: colors.textFaint, fontSize: 11, marginTop: 4 },
});
