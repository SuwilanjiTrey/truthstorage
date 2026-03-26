// app/(tabs)/insights.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Colors, Sz, R } from '@/constants/Colors';
import { STORAGE, DEVICE } from '@/utils/storage';

const CARDS = [
  {
    tag: 'OEM MISMATCH', tagColor: '#F5A623',
    title: '128 GB ≠ 128 GB',
    summary: 'Your device was sold as 128 GB but actual writable space is ~104 GB.',
    detail: 'Storage is measured in GB (1000³ bytes) by manufacturers, but Android uses GiB (1024³ bytes). A "128 GB" drive is really ~119 GiB. On top of that, the system partition, recovery, and pre-installed apps eat another 10–15 GB. What you can actually use is always less than what\'s on the box.',
  },
  {
    tag: 'FACT', tagColor: '#00E5A0',
    title: 'Cache ≠ Junk',
    summary: 'Cache is intentional. Clearing it doesn\'t free permanent space.',
    detail: 'Apps create cache to speed up repeated operations — loading images, storing session data. Android automatically evicts cache when storage runs low. Manually clearing it forces apps to re-download everything, which temporarily frees space but the data comes right back. "Cache cleaners" that show dramatic space savings are misleading.',
  },
  {
    tag: 'ANDROID LIMIT', tagColor: '#9575CD',
    title: 'Apps can\'t clean other apps',
    summary: 'Since Android 6+, sandboxing prevents apps from touching each other\'s data.',
    detail: 'Android\'s security model gives each app its own private storage sandbox. No third-party cleaner can legally access or delete another app\'s /data/data/ directory without root. Any app claiming to do so is either just opening the Settings UI, or outright lying.',
  },
  {
    tag: 'FACT', tagColor: '#00E5A0',
    title: '/data vs /sdcard',
    summary: 'Two separate partitions — both exist even without a physical SD card.',
    detail: '/data is the internal app storage partition — encrypted and protected, where all app data lives. /sdcard (internal shared storage) is where photos, downloads, and media go. They\'re separate regions on the same flash chip. Confusing them leads to wildly wrong storage reports.',
  },
  {
    tag: 'DIAGNOSTIC', tagColor: '#FF4757',
    title: 'Low storage ≠ slow device',
    summary: 'Storage fullness and RAM are completely separate resources.',
    detail: 'RAM boosters that claim to "free up storage" are conflating two different resources. RAM is volatile memory for running apps. Storage is persistent flash for files and app data. Killing background apps frees RAM, not storage. Full storage can cause slowness (no room for temp files), but it\'s a different problem than low RAM.',
  },
  {
    tag: 'HOW TO FIX', tagColor: '#00E5A0',
    title: 'Actually free space',
    summary: 'The only real ways to free internal storage on Android.',
    detail: '1. Uninstall apps you don\'t use.\n2. Move photos/videos to cloud or PC, then delete originals.\n3. Clear app data (resets the app) for apps with huge data usage.\n4. Use Android Files app → Clean for system-detected junk.\n5. Use ADB to pull files and delete originals.\n\nThat\'s it. There is no shortcut.',
  },
];

export default function InsightsScreen() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const reportedGB = Math.round(DEVICE.reportedBytes / 1e9);
  const actualGB   = Math.round(STORAGE.totalBytes   / 1e9);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <Text style={s.eyebrow}>TRUTH ENGINE</Text>
          <Text style={s.title}>Insights</Text>
          <Text style={s.sub}>No BS. Just what Android actually does.</Text>
        </View>

        {/* Live mismatch callout */}
        <View style={s.callout}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <View style={s.calloutDot} />
            <Text style={s.calloutTag}>LIVE MISMATCH DETECTED</Text>
          </View>
          <Text style={s.calloutTitle}>Advertised {reportedGB} GB → Actual {actualGB} GB</Text>
          <Text style={s.calloutSub}>
            {reportedGB - actualGB} GB unaccounted for by Android system overhead and OEM measurement practices.
          </Text>
        </View>

        {CARDS.map((c, i) => (
          <TouchableOpacity
            key={i}
            style={[s.card, expanded === i && s.cardOpen]}
            onPress={() => setExpanded(expanded === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={s.cardTop}>
              <View style={[s.tag, { backgroundColor: c.tagColor + '20', borderColor: c.tagColor + '55' }]}>
                <Text style={[s.tagTxt, { color: c.tagColor }]}>{c.tag}</Text>
              </View>
              <Text style={s.expand}>{expanded === i ? '−' : '+'}</Text>
            </View>
            <Text style={s.cardTitle}>{c.title}</Text>
            <Text style={s.cardSub}>{c.summary}</Text>
            {expanded === i && (
              <View style={s.detail}>
                <Text style={s.detailTxt}>{c.detail}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <Text style={s.footer}>TruthStorage reports real data. No fake cleaning. No misleading claims.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg0 },
  content:     { padding: Sz.md, paddingBottom: 40 },
  header:      { marginBottom: Sz.lg },
  eyebrow:     { color: Colors.accent, fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 2.5, marginBottom: 4 },
  title:       { color: Colors.textPrimary, fontSize: 28, fontWeight: '700', fontFamily: 'SpaceMono', letterSpacing: -1 },
  sub:         { color: Colors.textSecondary, fontSize: 11, fontFamily: 'SpaceMono', marginTop: 2 },
  callout:     { backgroundColor: Colors.warningDim, borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(245,166,35,0.35)', padding: Sz.md, marginBottom: Sz.md },
  calloutDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.warning },
  calloutTag:  { color: Colors.warning, fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 2 },
  calloutTitle:{ color: Colors.warning, fontSize: 17, fontWeight: '700', fontFamily: 'SpaceMono', marginBottom: 4 },
  calloutSub:  { color: Colors.textSecondary, fontSize: 11, fontFamily: 'SpaceMono', lineHeight: 17 },
  card:        { backgroundColor: Colors.bg1, borderRadius: R.lg, borderWidth: 1, borderColor: Colors.bg3, padding: Sz.md, marginBottom: Sz.sm },
  cardOpen:    { borderColor: Colors.accentMid },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tag:         { borderRadius: R.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  tagTxt:      { fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 1 },
  expand:      { color: Colors.textMuted, fontSize: 20, lineHeight: 22 },
  cardTitle:   { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', fontFamily: 'SpaceMono', marginBottom: 4, letterSpacing: -0.5 },
  cardSub:     { color: Colors.textSecondary, fontSize: 12, fontFamily: 'SpaceMono', lineHeight: 18 },
  detail:      { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.bg3 },
  detailTxt:   { color: Colors.textSecondary, fontSize: 12, fontFamily: 'SpaceMono', lineHeight: 19 },
  footer:      { color: Colors.textMuted, fontSize: 10, fontFamily: 'SpaceMono', textAlign: 'center', marginTop: Sz.lg, lineHeight: 16 },
});