import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StackedBars({ data = [], height = 60 }) {
  if (!data.length) return null;
  return (
    <View style={[s.row, { height }]}>
      {data.map((night, i) => {
        const total = night.stages.reduce((a, b) => a + b.hrs, 0);
        if (!total) {
          return <View key={i} style={[s.col, { backgroundColor: '#1A1A1A' }]} />;
        }
        return (
          <View key={i} style={s.col}>
            {night.stages.map((st, j) => (
              <View key={j} style={{ flex: st.hrs, backgroundColor: st.color }} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3, alignItems: 'stretch' },
  col: { flex: 1, borderRadius: 3, overflow: 'hidden', flexDirection: 'column' },
});
