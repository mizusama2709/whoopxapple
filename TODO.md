# WhoopxApple — Progress & Changelog

## Status key
- [x] Done
- [ ] Todo
- [~] In progress

---

## Completed

### Bug Fixes
- [x] Import hang bug — 60s watchdog via `Promise.race` in `Upload.js`
- [x] fflate fatal-capture — silent errors in `ondata` callback now surface correctly
- [x] `total=0` guard — clear error when file size unreadable (iCloud not downloaded)
- [x] Diagnostic log on parse start (`[parseExport] start { total, isZip, name }`)

### New Features
- [x] **Multi-day trend charts** — 7/30/90d range toggle in Trends screen with SVG line charts
- [x] **Sleep stage history** — 14-night stacked bar history + stage averages in Sleep screen
- [x] **Recovery explainer** — tap the recovery ring → bottom sheet explains HRV/RHR breakdown
- [x] **Data freshness chip** — shows data age in Overview header, amber warning if >14 days old
- [x] **buildModel** extended — now returns `series`, `sleepHistory`, `stageAverages`, `recoveryDetail`

### New Components
- [x] `src/components/LineChart.js` — SVG line chart with null-gap handling
- [x] `src/components/StackedBars.js` — stacked night columns for sleep history
- [x] `src/components/MetricExplainer.js` — recovery breakdown bottom sheet modal

### Infrastructure
- [x] Files copied to Expansion drive → `/Volumes/Expansion/Claude Projects/whoopxapple`

---

## In Progress

- [~] Premium UI redesign — WHOOP-style but more elevated (agent running)

---

## Todo

### Features
- [ ] Steps tracking — add `HKQuantityTypeIdentifierStepCount` to `QTYPES` in `parseExport.js` (sum, not avg)
- [ ] Sleep streaks — count consecutive nights with ≥7h sleep
- [ ] Strain explainer modal (same pattern as recovery explainer)
- [ ] 30/90-day rolling baseline band on line charts
- [ ] Workout detail screen / workout list

### Polish
- [ ] Empty state for Trends when `week` is empty
- [ ] Haptic feedback on ring tap
- [ ] Animated ring fill on screen load
- [ ] Dark/light mode support

### Infrastructure
- [ ] Publish fresh EAS Update after UI redesign: `npx eas-cli update --branch preview -m "..."`
- [ ] Set up automated EAS Update in CI (optional)

---

## Changelog

### 2026-06-10
- Fixed: import hang — watchdog + fatal-capture + size guard
- Added: 7/30/90d trend charts (SVG line, null-safe)
- Added: 14-night sleep stage history
- Added: Recovery explainer modal (tap recovery ring)
- Added: Data freshness chip in Overview header
- Moved: project to `/Volumes/Expansion/Claude Projects/whoopxapple`

### 2026-06-09
- Built: in-app Apple Health export import (Upload screen)
- Built: streaming fflate parser for 437MB export.zip
- Built: EAS Update OTA via Expo Go — branch `preview`
- Built: real data pipeline from Apple Health export.xml
