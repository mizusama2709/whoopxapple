import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../theme';

export default function Ring({
  size = 180,
  stroke = 14,
  progress = 0,
  color = colors.strain,
  track = colors.track,
  children,
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = c * (1 - clamped);

  // Outer glow ring: slightly larger radius, same color at very low opacity
  const glowStroke = stroke * 2.2;
  const glowR = (size - glowStroke) / 2 + (glowStroke - stroke) / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Outer ambient glow halo */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={glowR}
            stroke={color}
            strokeWidth={glowStroke}
            strokeOpacity={0.07}
            fill="none"
          />
          {/* Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={track}
            strokeWidth={stroke}
            fill="none"
          />
          {/* Progress arc */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            fill="none"
          />
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
