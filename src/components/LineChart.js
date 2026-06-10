import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Line, Text as SvgText } from 'react-native-svg';

export default function LineChart({ data = [], labels = [], color = '#7BA0FF', width = 300, height = 120 }) {
  const nonNull = data.filter((v) => v != null);
  if (!nonNull.length || data.length < 2) return null;

  const minV = Math.min(...nonNull);
  const maxV = Math.max(...nonNull);
  const range = maxV - minV || 1;
  const padL = 6;
  const padR = 6;
  const padT = 10;
  const padB = 18;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const xOf = (i) => padL + (i / (data.length - 1)) * chartW;
  const yOf = (v) => padT + (1 - (v - minV) / range) * chartH;

  // Split into contiguous segments of non-null values
  const segments = [];
  let current = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i] != null) {
      current.push(`${xOf(i).toFixed(1)},${yOf(data[i]).toFixed(1)}`);
    } else {
      if (current.length > 1) segments.push(current.join(' '));
      else if (current.length === 1) {
        // single isolated point — add a tiny horizontal so Polyline renders a dot
        segments.push(current[0] + ' ' + current[0]);
      }
      current = [];
    }
  }
  if (current.length > 1) segments.push(current.join(' '));
  else if (current.length === 1) segments.push(current[0] + ' ' + current[0]);

  const mean = nonNull.reduce((a, b) => a + b, 0) / nonNull.length;
  const meanY = yOf(mean).toFixed(1);

  const firstLabel = labels[0] || '';
  const lastLabel = labels[labels.length - 1] || '';

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Dashed mean baseline */}
        <Line
          x1={padL} y1={meanY} x2={width - padR} y2={meanY}
          stroke={color} strokeWidth={0.8} strokeOpacity={0.25} strokeDasharray="4,4"
        />
        {/* Data line segments */}
        {segments.map((pts, i) => (
          <Polyline
            key={i}
            points={pts}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {/* Min / max labels on right */}
        <SvgText x={width - padR} y={padT + 3} fontSize={9} fill="#444444" textAnchor="end">{Math.round(maxV)}</SvgText>
        <SvgText x={width - padR} y={height - padB + 10} fontSize={9} fill="#444444" textAnchor="end">{Math.round(minV)}</SvgText>
        {/* Date labels on bottom */}
        {firstLabel ? <SvgText x={padL} y={height - 2} fontSize={9} fill="#444444" textAnchor="start">{firstLabel}</SvgText> : null}
        {lastLabel ? <SvgText x={width - padR} y={height - 2} fontSize={9} fill="#444444" textAnchor="end">{lastLabel}</SvgText> : null}
      </Svg>
    </View>
  );
}
