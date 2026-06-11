import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Animated } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, G } from 'react-native-svg';
import Overview from './src/screens/Overview';
import Sleep from './src/screens/Sleep';
import Trends from './src/screens/Trends';
import Upload from './src/screens/Upload';
import { colors } from './src/theme';
import { buildModel } from './src/data/buildModel';
import { loadStored } from './src/data/store';
import { requestPermissions, getToday as getHealthKitToday } from './src/data/health';
import bundled from './src/data/health-data.json';

// SVG tab icons — each renders a clean minimal icon
function IconOverview({ active }) {
  const c = active ? colors.text : colors.textMuted;
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx="11" cy="11" r="8.5" stroke={c} strokeWidth="1.6" />
      <Circle cx="11" cy="11" r="4" stroke={c} strokeWidth="1.6" />
      <Path d="M11 2.5V4.5M11 17.5V19.5M2.5 11H4.5M17.5 11H19.5" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function IconSleep({ active }) {
  const c = active ? colors.text : colors.textMuted;
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M9 4.5C5.96 4.5 3.5 6.96 3.5 10C3.5 13.04 5.96 15.5 9 15.5C10.48 15.5 11.82 14.94 12.83 14.01C12.22 14.17 11.62 14.25 11 14.25C7.69 14.25 5 11.56 5 8.25C5 6.82 5.5 5.5 6.3 4.46C5.85 4.48 5.42 4.5 5 4.5" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M13 4.5C13 8.09 15.91 11 19.5 11C15.91 11 13 13.91 13 17.5C13 13.91 10.09 11 6.5 11C10.09 11 13 8.09 13 4.5Z" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconTrends({ active }) {
  const c = active ? colors.text : colors.textMuted;
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M3.5 16.5L8 11L12 13.5L18.5 6.5" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="8" cy="11" r="1.5" fill={c} />
      <Circle cx="12" cy="13.5" r="1.5" fill={c} />
      <Circle cx="18.5" cy="6.5" r="1.5" fill={c} />
    </Svg>
  );
}

function IconImport({ active }) {
  const c = active ? colors.text : colors.textMuted;
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M11 3.5V14.5M11 14.5L7.5 11M11 14.5L14.5 11" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 17.5H18" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

const TABS = [
  { key: 'overview', label: 'Overview', Icon: IconOverview },
  { key: 'sleep',    label: 'Sleep',    Icon: IconSleep },
  { key: 'trends',   label: 'Trends',   Icon: IconTrends },
  { key: 'import',   label: 'Import',   Icon: IconImport },
];

function TabButton({ tab, active, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const { Icon } = tab;

  return (
    <TouchableOpacity style={s.tabBtn} onPress={handlePress} activeOpacity={1}>
      <Animated.View style={[s.tabInner, { transform: [{ scale }] }]}>
        {active && <View style={s.tabPill} />}
        <Icon active={active} />
        <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function App() {
  const [tab, setTab] = useState('overview');
  const [raw, setRaw] = useState(bundled);
  const [liveToday, setLiveToday] = useState(null);

  useEffect(() => {
    let alive = true;
    loadStored().then((stored) => {
      if (alive && stored && stored.daily && stored.daily.length) setRaw(stored);
    });
    requestPermissions().then((granted) => {
      if (!granted || !alive) return;
      getHealthKitToday().then((today) => {
        if (alive) setLiveToday(today);
      });
    });
    return () => { alive = false; };
  }, []);

  const model = useMemo(() => buildModel(raw), [raw]);
  const { today: modelToday, sleepStages: stages, week, series, sleepHistory, stageAverages, recoveryDetail, hrvBaseline, hrvDelta } = model;
  const data = liveToday ? { ...modelToday, ...liveToday } : modelToday;

  const onImported = useCallback((newRaw) => {
    setRaw(newRaw);
    setTab('overview');
  }, []);

  return (
    <View style={s.root}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={s.safe}>
        <View style={s.content}>
          {tab === 'overview' && (
            <Overview data={data} source={data.source} onRefresh={() => {}} refreshing={false} recoveryDetail={recoveryDetail} generatedAt={model.generatedAt} hrvDelta={hrvDelta} />
          )}
          {tab === 'sleep' && <Sleep data={data} stages={stages} sleepHistory={sleepHistory} stageAverages={stageAverages} />}
          {tab === 'trends' && <Trends week={week} series={series} hrvBaseline={hrvBaseline} />}
          {tab === 'import' && (
            <Upload onImported={onImported} currentGeneratedAt={model.generatedAt} />
          )}
        </View>

        {/* Premium bottom tab bar */}
        <View style={s.tabBar}>
          <View style={s.tabBarInner}>
            {TABS.map((t) => (
              <TabButton key={t.key} tab={t} active={tab === t.key} onPress={() => setTab(t.key)} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },

  tabBar: {
    backgroundColor: colors.surface1,
    borderTopWidth: 1,
    borderTopColor: colors.borderFaint,
    paddingBottom: 4,
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    position: 'relative',
    minWidth: 60,
  },
  tabPill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: colors.surface4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 4,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.text,
  },
});
