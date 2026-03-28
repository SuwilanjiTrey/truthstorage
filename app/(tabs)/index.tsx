// app/(tabs)/index.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, SafeAreaView, ActivityIndicator } from 'react-native';
import StorageRing from '@/components/StorageRing';
import { Colors, Sz, R } from '@/constants/Colors';
import { formatBytes, usagePct } from '@/utils/storage';
import { useStorage } from '@/context/StorageContext';

export default function HomeScreen() {
  const { storage, device, loading, mismatch, appsSize, cacheSize, systemSize } = useStorage();

  const reportedGB = Math.round(device.reportedBytes / 1e9);
  const actualGB   = Math.round(storage.totalBytes   / 1e9);

  // Staggered entrance animations
  const anims = Array.from({ length: 5 }, () => ({
    op: useRef(new Animated.Value(0)).current,
    y:  useRef(new Animated.Value(16)).current,
  }));

  useEffect(() => {
    Animated.stagger(90, anims.map(a =>
      Animated.parallel([
        Animated.timing(a.op, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(a.y,  { toValue: 0, duration: 480, useNativeDriver: true }),
      ])
    )).start();
  }, [loading]); // re-trigger entrance when data loads

  const Row = ({ i, children, style }: any) => (
    <Animated.View style={[{ opacity: anims[i].op, transform: [{ translateY: anims[i].y }] }, style]}>
      {children}
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={{ color: Colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 11, marginTop: 12 }}>
          READING STORAGE...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Row i={0} style={s.header}>
          <Text style={s.eyebrow}>DIAGNOSTIC REPORT</Text>
          <Text style={s.title}>Storage</Text>
          <Text style={s.sub}>
            {device.manufacturer} {device.model} · Android {device.androidVersion}
          </Text>
        </Row>

        {/* Ring */}
        <Row i={1} style={{ alignItems: 'center', marginBottom: Sz.xl }}>
          <StorageRing totalBytes={storage.totalBytes} usedBytes={storage.usedBytes} size={230} />
        </Row>

        {/* OEM mismatch warning */}
        {mismatch && (
          <Row i={2}>
            <View style={s.warnBanner}>
              <Text style={s.warnIcon}>⚠</Text>
              <Text style={s.warnText}>
                OEM reports {reportedGB} GB — actual writable partition is ~{actualGB} GB.
                Common on budget Android devices.
              </Text>
            </View>
          </Row>
        )}

        {/* Used / Free cards */}
        <Row i={2} style={s.cardRow}>
          <MiniCard
            label="USED"
            value={formatBytes(storage.usedBytes)}
            sub={`${usagePct(storage.usedBytes, storage.totalBytes)}% of disk`}
            color={Colors.accent}
          />
          <View style={{ width: Sz.sm }} />
          <MiniCard
            label="FREE"
            value={formatBytes(storage.freeBytes)}
            sub="Available now"
            color="#4FC3F7"
          />
        </Row>

        {/* Breakdown */}
        <Row i={3}>
          <Label text="BREAKDOWN" />
          <View style={s.card}>
            <BarRow label="System"    bytes={systemSize} total={storage.usedBytes} color="#9575CD" />
            <BarRow label="Apps+Data" bytes={appsSize}   total={storage.usedBytes} color={Colors.accent} />
            <BarRow label="Cache"     bytes={cacheSize}  total={storage.usedBytes} color={Colors.warning} last />
          </View>
        </Row>

        {/* Device info */}
        <Row i={4}>
          <Label text="DEVICE" />
          <View style={s.card}>
            <KV k="MANUFACTURER" v={device.manufacturer} />
            <KV k="MODEL"        v={device.model} />
            <KV k="ANDROID"      v={`${device.androidVersion} (SDK ${device.sdkVersion})`} />
            <KV k="ENCRYPTED"    v={device.isEncrypted ? 'YES' : 'NO'} vc={device.isEncrypted ? Colors.accent : Colors.danger} />
            <KV k="ROOTED"       v={device.isRooted    ? 'YES' : 'NO'} vc={device.isRooted    ? Colors.warning : Colors.textSecondary} />
            <KV k="REPORTED"     v={`${reportedGB} GB`} last />
          </View>
        </Row>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Label({ text }: { text: string }) {
  return (
    <Text style={{ color: Colors.textMuted, fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 2, marginBottom: 8, marginTop: 4 }}>
      {text}
    </Text>
  );
}

function MiniCard({ label, value, sub, color }: any) {
  return (
    <View style={mc.card}>
      <View style={[mc.bar, { backgroundColor: color }]} />
      <View style={mc.body}>
        <Text style={mc.label}>{label}</Text>
        <Text style={[mc.value, { color }]}>{value}</Text>
        <Text style={mc.sub}>{sub}</Text>
      </View>
    </View>
  );
}
const mc = StyleSheet.create({
  card:  { flex: 1, backgroundColor: Colors.bg1, borderRadius: R.lg, borderWidth: 1, borderColor: Colors.bg3, flexDirection: 'row', alignItems: 'center', paddingVertical: Sz.md, paddingRight: Sz.md, overflow: 'hidden' },
  bar:   { width: 3, height: 36, borderRadius: 2, marginHorizontal: 12 },
  body:  { flex: 1 },
  label: { color: Colors.textSecondary, fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  value: { fontFamily: 'SpaceMono', fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
  sub:   { color: Colors.textMuted, fontSize: 9, fontFamily: 'SpaceMono', marginTop: 2 },
});

function BarRow({ label, bytes, total, color, last }: any) {
  const pct = total > 0 ? (bytes / total) * 100 : 0;
  return (
    <View style={[br.row, !last && br.border]}>
      <View style={[br.dot, { backgroundColor: color }]} />
      <Text style={br.label}>{label}</Text>
      <View style={br.track}>
        <View style={[br.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={br.val}>{formatBytes(bytes)}</Text>
    </View>
  );
}
const br = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.bg3 },
  dot:    { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  label:  { color: Colors.textSecondary, fontSize: 10, fontFamily: 'SpaceMono', width: 80 },
  track:  { flex: 1, height: 4, backgroundColor: Colors.bg3, borderRadius: 2, overflow: 'hidden' },
  fill:   { height: '100%', borderRadius: 2 },
  val:    { color: Colors.textPrimary, fontSize: 10, fontFamily: 'SpaceMono', width: 58, textAlign: 'right' },
});

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
  val:    { color: Colors.textPrimary, fontFamily: 'SpaceMono', fontSize: 12 },
});

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg0 },
  content:    { padding: Sz.md, paddingBottom: 40 },
  header:     { marginBottom: Sz.lg },
  eyebrow:    { color: Colors.accent, fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 2.5, marginBottom: 4 },
  title:      { color: Colors.textPrimary, fontSize: 30, fontWeight: '700', fontFamily: 'SpaceMono', letterSpacing: -1 },
  sub:        { color: Colors.textSecondary, fontSize: 11, fontFamily: 'SpaceMono', marginTop: 2 },
  warnBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.warningDim, borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(245,166,35,0.3)', padding: Sz.md, marginBottom: Sz.md },
  warnIcon:   { color: Colors.warning, fontSize: 12 },
  warnText:   { flex: 1, color: Colors.warning, fontFamily: 'SpaceMono', fontSize: 11, lineHeight: 17 },
  cardRow:    { flexDirection: 'row', marginBottom: Sz.md },
  card:       { backgroundColor: Colors.bg1, borderRadius: R.lg, borderWidth: 1, borderColor: Colors.bg3, paddingHorizontal: Sz.md, marginBottom: Sz.md },
});
