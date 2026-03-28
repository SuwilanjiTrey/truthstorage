// app/(tabs)/about.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Colors, Sz, R } from '@/constants/Colors';
import { formatBytes } from '@/utils/storage';
import { useStorage } from '@/context/StorageContext';

const PRINCIPLES = [
  'Read-only inspection. We never modify your data.',
  'No fake cleaning animations or misleading progress bars.',
  'We report what the kernel says, not what looks impressive.',
  'No background processes. No battery drain.',
  "What you see is what's actually happening.",
];

const APIs = [
  { name: 'StatFs',              desc: 'Real partition usage from kernel' },
  { name: 'StorageStatsManager', desc: 'Per-app storage breakdown' },
  { name: 'PackageManager',      desc: 'Installed app enumeration' },
  { name: 'Build',               desc: 'Device & Android version info' },
];

export default function AboutScreen() {
  const { storage, device } = useStorage();
  const reportedGB = Math.round(device.reportedBytes / 1e9);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.logoOuter}>
            <View style={s.logoInner}>
              <Text style={s.logoTxt}>TS</Text>
            </View>
          </View>
          <Text style={s.heroTitle}>TruthStorage</Text>
          <Text style={s.heroVersion}>v1.0.0 · DIAGNOSTIC BUILD</Text>
          <Text style={s.heroTagline}>
            A read-only, honest storage inspector for Android.{'\n'}No fake cleaning. No misleading claims.
          </Text>
        </View>

        {/* Principles */}
        <Label text="PRINCIPLES" />
        <View style={s.card}>
          {PRINCIPLES.map((p, i) => (
            <View key={i} style={[s.pRow, i < PRINCIPLES.length - 1 && s.pBorder]}>
              <Text style={s.pDot}>◈</Text>
              <Text style={s.pTxt}>{p}</Text>
            </View>
          ))}
        </View>

        {/* Device */}
        <Label text="THIS DEVICE" />
        <View style={s.card}>
          <KV k="MANUFACTURER"  v={device.manufacturer} />
          <KV k="MODEL"         v={device.model} />
          <KV k="ANDROID"       v={`${device.androidVersion} (SDK ${device.sdkVersion})`} />
          <KV k="TOTAL STORAGE" v={formatBytes(storage.totalBytes)} />
          <KV k="FREE"          v={formatBytes(storage.freeBytes)} />
          <KV k="ENCRYPTED"     v={device.isEncrypted ? 'YES' : 'NO'} vc={device.isEncrypted ? Colors.accent : Colors.danger} />
          <KV k="ROOTED"        v={device.isRooted    ? 'YES' : 'NO'} vc={device.isRooted    ? Colors.warning : Colors.textSecondary} />
          <KV k="OEM REPORTED"  v={`${reportedGB} GB`} last />
        </View>

        {/* Why */}
        <Label text="WHY THIS EXISTS" />
        <View style={[s.card, s.quoteCard]}>
          <View style={s.quoteLine} />
          <Text style={s.quoteTxt}>
            Most storage cleaner apps lie to you. They show scary numbers, fake progress, and "clean" things that were never dirty. The Android ecosystem deserved something honest.
          </Text>
          <View style={{ height: Sz.sm }} />
          <Text style={s.quoteTxt}>
            TruthStorage reads what the kernel reports via StatFs and StorageStatsManager — the same sources Android Settings uses. No inflation. No guesswork.
          </Text>
        </View>

        {/* Data sources */}
        <Label text="DATA SOURCES" />
        <View style={s.card}>
          {APIs.map((a, i) => (
            <View key={a.name} style={[s.apiRow, i < APIs.length - 1 && s.pBorder]}>
              <Text style={s.apiName}>{a.name}</Text>
              <Text style={s.apiDesc}>{a.desc}</Text>
            </View>
          ))}
        </View>

        <View style={s.footer}>
          <Text style={s.footerTxt}>Built with React Native + Expo</Text>
          <Text style={s.footerTxt}>MVVM · Clean Architecture · No tracking</Text>
          <View style={{ width: 40, height: 1, backgroundColor: Colors.bg3, marginVertical: Sz.md }} />
          <Text style={s.disclaimer}>
            TruthStorage requires the PACKAGE_USAGE_STATS permission to read per-app storage data.
            Grant it in Settings → Special App Access → Usage Access.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return (
    <Text style={{ color: Colors.textMuted, fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 2, marginBottom: 8, marginTop: 4 }}>
      {text}
    </Text>
  );
}

function KV({ k, v, vc, last }: { k: string; v: string; vc?: string; last?: boolean }) {
  return (
    <View style={[kv.row, !last && kv.border]}>
      <Text style={kv.key}>{k}</Text>
      <Text style={[kv.val, vc ? { color: vc } : {}]}>{v}</Text>
    </View>
  );
}
const kv = StyleSheet.create({
  row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.bg3 },
  key:    { color: Colors.textMuted, fontFamily: 'SpaceMono', fontSize: 9, letterSpacing: 1.5 },
  val:    { color: Colors.textPrimary, fontFamily: 'SpaceMono', fontSize: 12, flex: 1, textAlign: 'right' },
});

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg0 },
  content:     { padding: Sz.md, paddingBottom: 40 },
  hero:        { alignItems: 'center', paddingVertical: Sz.xl, marginBottom: Sz.sm },
  logoOuter:   { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: Sz.md },
  logoInner:   { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.accentDim, borderWidth: 2, borderColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  logoTxt:     { color: Colors.accent, fontFamily: 'SpaceMono', fontWeight: '700', fontSize: 20, letterSpacing: 2 },
  heroTitle:   { color: Colors.textPrimary, fontFamily: 'SpaceMono', fontSize: 22, fontWeight: '700', letterSpacing: -1 },
  heroVersion: { color: Colors.textMuted, fontFamily: 'SpaceMono', fontSize: 10, letterSpacing: 2, marginTop: 4, marginBottom: 12 },
  heroTagline: { color: Colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 12, textAlign: 'center', lineHeight: 19 },
  card:        { backgroundColor: Colors.bg1, borderRadius: R.lg, borderWidth: 1, borderColor: Colors.bg3, paddingHorizontal: Sz.md, marginBottom: Sz.md },
  quoteCard:   { paddingVertical: Sz.md },
  quoteLine:   { position: 'absolute', left: 0, top: Sz.md, bottom: Sz.md, width: 3, backgroundColor: Colors.accent, borderRadius: 2 },
  quoteTxt:    { color: Colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 12, lineHeight: 19 },
  pRow:        { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 10 },
  pBorder:     { borderBottomWidth: 1, borderBottomColor: Colors.bg3 },
  pDot:        { color: Colors.accent, fontSize: 12, marginTop: 1 },
  pTxt:        { flex: 1, color: Colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 12, lineHeight: 18 },
  apiRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  apiName:     { color: Colors.accent, fontFamily: 'SpaceMono', fontSize: 11 },
  apiDesc:     { color: Colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 11, flex: 1, textAlign: 'right' },
  footer:      { marginTop: Sz.lg, alignItems: 'center' },
  footerTxt:   { color: Colors.textMuted, fontFamily: 'SpaceMono', fontSize: 10, letterSpacing: 1, marginBottom: 2 },
  disclaimer:  { color: Colors.textMuted, fontFamily: 'SpaceMono', fontSize: 10, textAlign: 'center', lineHeight: 16, paddingHorizontal: Sz.md },
});
