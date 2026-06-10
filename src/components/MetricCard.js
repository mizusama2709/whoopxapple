import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function MetricCard({ label, value, unit, accent = colors.text, sub }) {
  // Derive a very subtle left-border glow color from the accent
  const accentBorder = accent + '40'; // ~25% opacity hex
  const accentGlow   = accent + '14'; // ~8% opacity hex

  return (
    <View style={[s.card, { borderLeftColor: accentBorder, backgroundColor: colors.surface2 }]}>
      {/* Faint accent wash behind the top-left corner */}
      <View style={[s.accentWash, { backgroundColor: accentGlow }]} pointerEvents="none" />
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  accentWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: 80,
    borderRadius: 80,
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 10 },
  value: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  unit: {
    color: colors.textDim,
    fontSize: 12,
    marginLeft: 3,
    marginBottom: 5,
    fontWeight: '600',
  },
  sub: { color: colors.textFaint, fontSize: 11, marginTop: 5 },
});
