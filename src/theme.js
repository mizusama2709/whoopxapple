export const colors = {
  bg: '#000000',
  card: '#141414',
  cardAlt: '#1C1C1E',
  border: '#262626',
  text: '#FFFFFF',
  textDim: '#8A8A8E',
  textFaint: '#5A5A5E',

  // WHOOP signature metric colors
  strain: '#0093E7',      // blue
  recoveryHigh: '#16EC06', // green
  recoveryMid: '#FFDE00',  // yellow
  recoveryLow: '#FF0026',  // red
  sleep: '#7BA0FF',        // light blue
  track: '#2A2A2A',        // unfilled ring track
};

export const recoveryColor = (pct) => {
  if (pct >= 67) return colors.recoveryHigh;
  if (pct >= 34) return colors.recoveryMid;
  return colors.recoveryLow;
};

export const font = {
  // WHOOP uses condensed numerics; system works fine in Expo Go
  number: 'System',
};
