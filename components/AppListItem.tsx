// components/AppListItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppInfo, formatBytes, totalSize } from '@/utils/storage';
import { Colors, Sz, R } from '@/constants/Colors';

interface Props {
  app: AppInfo;
  maxBytes: number;
  onPress?: () => void;
}

export default function AppListItem({ app, maxBytes, onPress }: Props) {
  const total    = totalSize(app);
  const appPct   = total > 0 ? (app.appBytes   / total) * 100 : 0;
  const dataPct  = total > 0 ? (app.dataBytes  / total) * 100 : 0;
  const cachePct = total > 0 ? (app.cacheBytes / total) * 100 : 0;

  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <View style={s.icon}>
        <Text style={s.initials}>{app.appName.slice(0, 2).toUpperCase()}</Text>
      </View>
      <View style={s.body}>
        <View style={s.top}>
          <Text style={s.name} numberOfLines={1}>{app.appName}</Text>
          <Text style={s.total}>{formatBytes(total)}</Text>
        </View>
        <View style={s.barTrack}>
          <View style={[s.seg, { width: `${appPct}%`,   backgroundColor: Colors.accent }]} />
          <View style={[s.seg, { width: `${dataPct}%`,  backgroundColor: Colors.warning }]} />
          <View style={[s.seg, { width: `${cachePct}%`, backgroundColor: Colors.textMuted }]} />
        </View>
        <View style={s.legend}>
          <LegendDot color={Colors.accent}   label={`App ${formatBytes(app.appBytes)}`} />
          <LegendDot color={Colors.warning}  label={`Data ${formatBytes(app.dataBytes)}`} />
          <LegendDot color={Colors.textMuted}label={`Cache ${formatBytes(app.cacheBytes)}`} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ color: Colors.textMuted, fontFamily: 'SpaceMono', fontSize: 9 }}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Sz.md, paddingHorizontal: Sz.md, borderBottomWidth: 1, borderBottomColor: Colors.bg3, gap: 12 },
  icon:     { width: 42, height: 42, borderRadius: R.md, backgroundColor: Colors.bg3, alignItems: 'center', justifyContent: 'center' },
  initials: { color: Colors.accent, fontFamily: 'SpaceMono', fontWeight: '700', fontSize: 13 },
  body:     { flex: 1, minWidth: 0 },
  top:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  name:     { color: Colors.textPrimary, fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 },
  total:    { color: Colors.accent, fontFamily: 'SpaceMono', fontSize: 12, fontWeight: '700' },
  barTrack: { height: 4, backgroundColor: Colors.bg3, borderRadius: 2, flexDirection: 'row', overflow: 'hidden', marginBottom: 6 },
  seg:      { height: '100%' },
  legend:   { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});