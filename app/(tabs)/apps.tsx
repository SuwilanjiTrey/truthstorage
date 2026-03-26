// app/(tabs)/apps.tsx
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  SafeAreaView, TouchableOpacity, Modal, ScrollView,
} from 'react-native';
import AppListItem from '@/components/AppListItem';
import { Colors, Sz, R } from '@/constants/Colors';
import { APPS, AppInfo, formatBytes, totalSize } from '@/utils/storage';

type Sort = 'total' | 'data' | 'cache' | 'app';

export default function AppsScreen() {
  const [query,    setQuery]    = useState('');
  const [sort,     setSort]     = useState<Sort>('total');
  const [selected, setSelected] = useState<AppInfo | null>(null);

  const filtered = useMemo(() => {
    let apps = [...APPS];
    if (query.trim()) apps = apps.filter(a => a.appName.toLowerCase().includes(query.toLowerCase()));
    apps.sort((a, b) => {
      if (sort === 'total') return totalSize(b) - totalSize(a);
      if (sort === 'data')  return b.dataBytes  - a.dataBytes;
      if (sort === 'cache') return b.cacheBytes - a.cacheBytes;
      return b.appBytes - a.appBytes;
    });
    return apps;
  }, [query, sort]);

  const maxBytes = useMemo(() => Math.max(...APPS.map(totalSize)), []);
  const grandTotal = APPS.reduce((s, a) => s + totalSize(a), 0);

  const SORTS: { k: Sort; l: string }[] = [
    { k: 'total', l: 'Total' }, { k: 'data', l: 'Data' },
    { k: 'cache', l: 'Cache' }, { k: 'app',  l: 'App'  },
  ];

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.eyebrow}>INSTALLED APPS</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={s.title}>Apps</Text>
          <View style={s.badge}><Text style={s.badgeTxt}>{APPS.length} apps</Text></View>
        </View>
        <Text style={s.sub}>Total: {formatBytes(grandTotal)}</Text>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <Text style={{ color: Colors.textMuted, fontSize: 16, marginRight: 6 }}>⌕</Text>
        <TextInput
          style={s.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search apps..."
          placeholderTextColor={Colors.textMuted}
        />
        {query.length > 0 &&
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={{ color: Colors.textMuted, fontSize: 14, padding: 4 }}>✕</Text>
          </TouchableOpacity>
        }
      </View>

      {/* Sort chips */}
      <View style={s.sortRow}>
        <Text style={s.sortLabel}>SORT</Text>
        {SORTS.map(o => (
          <TouchableOpacity
            key={o.k}
            style={[s.chip, sort === o.k && s.chipOn]}
            onPress={() => setSort(o.k)}
          >
            <Text style={[s.chipTxt, sort === o.k && s.chipTxtOn]}>{o.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={a => a.packageName}
        renderItem={({ item }) => (
          <AppListItem app={item} maxBytes={maxBytes} onPress={() => setSelected(item)} />
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: Colors.textMuted, fontFamily: 'SpaceMono', fontSize: 12 }}>
              No apps match "{query}"
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Detail modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            {selected && <Detail app={selected} onClose={() => setSelected(null)} />}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Detail({ app, onClose }: { app: AppInfo; onClose: () => void }) {
  const total = totalSize(app);
  return (
    <ScrollView>
      <View style={d.header}>
        <View style={d.icon}><Text style={d.initials}>{app.appName.slice(0, 2).toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={d.name}>{app.appName}</Text>
          <Text style={d.pkg} numberOfLines={1}>{app.packageName}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={d.totalRow}>
        <Text style={d.totalLabel}>TOTAL SIZE</Text>
        <Text style={d.totalVal}>{formatBytes(total)}</Text>
      </View>

      <View style={{ paddingHorizontal: Sz.md, paddingTop: Sz.md }}>
        <DRow label="App (APK/OBB)"  bytes={app.appBytes}   color={Colors.accent} />
        <DRow label="User Data"      bytes={app.dataBytes}  color={Colors.warning} />
        <DRow label="Cache"          bytes={app.cacheBytes} color={Colors.textSecondary} last />
      </View>

      <View style={d.note}>
        <Text style={d.noteTxt}>
          ℹ  Cache can be cleared in Android Settings → Apps → {app.appName} → Storage.
          TruthStorage cannot clear other apps' data directly.
        </Text>
      </View>
    </ScrollView>
  );
}

function DRow({ label, bytes, color, last }: any) {
  return (
    <View style={[d.dRow, !last && { borderBottomWidth: 1, borderBottomColor: Colors.bg3 }]}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 10 }} />
      <Text style={d.dLabel}>{label}</Text>
      <Text style={[d.dVal, { color }]}>{formatBytes(bytes)}</Text>
    </View>
  );
}

const d = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', padding: Sz.md, gap: 12 },
  icon:       { width: 48, height: 48, borderRadius: R.md, backgroundColor: Colors.bg3, alignItems: 'center', justifyContent: 'center' },
  initials:   { color: Colors.accent, fontFamily: 'SpaceMono', fontWeight: '700', fontSize: 16 },
  name:       { color: Colors.textPrimary, fontFamily: 'SpaceMono', fontWeight: '700', fontSize: 16 },
  pkg:        { color: Colors.textMuted, fontFamily: 'SpaceMono', fontSize: 10, marginTop: 2 },
  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Sz.md, paddingBottom: Sz.md, borderBottomWidth: 1, borderBottomColor: Colors.bg3 },
  totalLabel: { color: Colors.textMuted, fontFamily: 'SpaceMono', fontSize: 9, letterSpacing: 2 },
  totalVal:   { color: Colors.accent, fontFamily: 'SpaceMono', fontSize: 22, fontWeight: '700' },
  dRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  dLabel:     { flex: 1, color: Colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 13 },
  dVal:       { fontFamily: 'SpaceMono', fontSize: 14, fontWeight: '700' },
  note:       { margin: Sz.md, backgroundColor: Colors.accentDim, borderRadius: R.md, padding: Sz.md, borderWidth: 1, borderColor: Colors.accentMid },
  noteTxt:    { color: Colors.accent, fontFamily: 'SpaceMono', fontSize: 11, lineHeight: 17 },
});

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg0 },
  header:    { paddingHorizontal: Sz.md, paddingTop: Sz.md, paddingBottom: Sz.sm },
  eyebrow:   { color: Colors.accent, fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 2.5, marginBottom: 4 },
  title:     { color: Colors.textPrimary, fontSize: 28, fontWeight: '700', fontFamily: 'SpaceMono', letterSpacing: -1 },
  badge:     { backgroundColor: Colors.accentDim, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: Colors.accentMid },
  badgeTxt:  { color: Colors.accent, fontSize: 10, fontFamily: 'SpaceMono' },
  sub:       { color: Colors.textSecondary, fontSize: 11, fontFamily: 'SpaceMono', marginTop: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg1, borderRadius: R.md, borderWidth: 1, borderColor: Colors.bg3, marginHorizontal: Sz.md, marginBottom: Sz.sm, paddingHorizontal: Sz.sm, height: 44 },
  input:     { flex: 1, color: Colors.textPrimary, fontFamily: 'SpaceMono', fontSize: 13 },
  sortRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Sz.md, gap: 6, marginBottom: Sz.sm },
  sortLabel: { color: Colors.textMuted, fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 1.5 },
  chip:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.full, backgroundColor: Colors.bg1, borderWidth: 1, borderColor: Colors.bg3 },
  chipOn:    { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  chipTxt:   { color: Colors.textMuted, fontSize: 11, fontFamily: 'SpaceMono' },
  chipTxtOn: { color: Colors.accent },
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: Colors.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: Colors.bg3, paddingBottom: 40, maxHeight: '80%' },
});