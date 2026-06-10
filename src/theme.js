export const colors = {
  // Surface hierarchy — black is not one color
  bg:         '#000000',
  surface0:   '#000000',
  surface1:   '#0A0A0A',
  surface2:   '#111111',
  surface3:   '#1A1A1A',
  surface4:   '#222222',

  // Card / container tokens
  card:       '#111111',
  cardAlt:    '#1A1A1A',
  cardDeep:   '#0A0A0A',
  cardRaised: '#1E1E1E',

  // Border tokens
  border:     '#2A2A2A',
  borderSub:  '#1E1E1E',
  borderFaint:'#161616',

  // Text hierarchy — 5 levels
  text:       '#FFFFFF',
  textSub:    '#D0D0D0',
  textDim:    '#888888',
  textMuted:  '#555555',
  textFaint:  '#333333',

  // WHOOP signature metric colors (kept identical)
  strain:       '#0093E7',
  recoveryHigh: '#16EC06',
  recoveryMid:  '#FFDE00',
  recoveryLow:  '#FF0026',
  sleep:        '#7BA0FF',

  // Glow variants (accent at low opacity — used for ring halos, card accents)
  glowStrain:       'rgba(0, 147, 231, 0.10)',
  glowRecoveryHigh: 'rgba(22, 236, 6, 0.10)',
  glowRecoveryMid:  'rgba(255, 222, 0, 0.10)',
  glowRecoveryLow:  'rgba(255, 0, 38, 0.10)',
  glowSleep:        'rgba(123, 160, 255, 0.10)',

  // Track
  track: '#242424',
};

export const recoveryColor = (pct) => {
  if (pct >= 67) return colors.recoveryHigh;
  if (pct >= 34) return colors.recoveryMid;
  return colors.recoveryLow;
};

export const recoveryGlow = (pct) => {
  if (pct >= 67) return colors.glowRecoveryHigh;
  if (pct >= 34) return colors.glowRecoveryMid;
  return colors.glowRecoveryLow;
};

export const font = {
  number: 'System',
};

// Card elevation — subtle border + background pairing
export const elevation = {
  low:    { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  medium: { backgroundColor: colors.surface3, borderWidth: 1, borderColor: colors.border },
  flush:  { backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.borderFaint },
};
