// app/(tabs)/connect.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Colors, Sz, R } from '@/constants/Colors';

type Tab = 'usb' | 'wifi';

const USB_STEPS = [
  { n: '01', title: 'Enable Developer Options', desc: 'Settings → About Phone → tap "Build Number" 7 times rapidly.' },
  { n: '02', title: 'Enable USB Debugging',     desc: 'Settings → Developer Options → toggle USB Debugging ON.' },
  { n: '03', title: 'Connect via USB',           desc: 'Plug into your PC. Tap "Allow" on the RSA fingerprint prompt.' },
  { n: '04', title: 'Verify on PC',              desc: 'Run:\n\nadb devices\n\nShould show your device as "device" (not "unauthorized").' },
  { n: '05', title: 'Inspect /data partition',   desc: 'Run:\n\nadb shell df -h /data\n\nReal partition truth from the kernel.' },
];

const WIFI_STEPS = [
  { n: '01', title: 'Same Wi-Fi network',       desc: 'Your PC and phone must be on the same network.' },
  { n: '02', title: 'Enable Wireless Debugging', desc: 'Settings → Developer Options → Wireless Debugging → enable.' },
  { n: '03', title: 'Get pairing code',          desc: 'Tap "Pair device with pairing code". Note the IP:port and code.' },
  { n: '04', title: 'Run pairing command',       desc: 'On PC:\n\nadb pair [IP]:[port]\n\nEnter the code when prompted.' },
  { n: '05', title: 'Connect',                   desc: 'adb connect [IP]:[port]\n\nVerify with:\n\nadb devices' },
];

const CMDS = [
  { cmd: 'adb shell df -h /data',        desc: 'Real /data partition usage' },
  { cmd: 'adb shell du -sh /data/data/*',desc: 'Per-app data sizes' },
  { cmd: 'adb shell pm list packages',   desc: 'All installed packages' },
  { cmd: 'adb pull /sdcard/ ./backup/',  desc: 'Pull all media to PC' },
  { cmd: 'adb shell getprop ro.build.version.release', desc: 'Android version' },
];

export default function ConnectScreen() {
  const [tab,     setTab]     = useState<Tab>('usb');
  const [copied,  setCopied]  = useState<string | null>(null);

  const steps = tab === 'usb' ? USB_STEPS : WIFI_STEPS;

  const copy = (cmd: string) => {
    // production: Clipboard.setStringAsync(cmd)
    setCopied(cmd);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <Text style={s.eyebrow}>DEVELOPER TOOLS</Text>
          <Text style={s.title}>Connect</Text>
          <Text style={s.sub}>ADB gives you ground truth. No app can match it.</Text>
        </View>

        {/* Status dot */}
        <View style={s.statusCard}>
          <View style={s.statusDot} />
          <View style={{ flex: 1 }}>
            <Text style={s.statusTitle}>ADB Not Connected</Text>
            <Text style={s.statusSub}>Follow the steps below to connect via USB or Wi-Fi</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {(['usb', 'wifi'] as Tab[]).map(t => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabOn]} onPress={() => setTab(t)}>
              <Text style={[s.tabTxt, tab === t && s.tabTxtOn]}>{t === 'usb' ? 'USB / ADB' : 'Wireless'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Steps */}
        <View style={s.stepsCard}>
          {steps.map((step, i) => (
            <View key={step.n} style={[s.stepRow, i < steps.length - 1 && s.stepBorder]}>
              <View style={s.stepLeft}>
                <Text style={s.stepNum}>{step.n}</Text>
                {i < steps.length - 1 && <View style={s.stepLine} />}
              </View>
              <View style={s.stepBody}>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Commands */}
        <Text style={s.sectionLabel}>USEFUL COMMANDS</Text>
        <View style={s.cmdsCard}>
          {CMDS.map(({ cmd, desc }) => (
            <TouchableOpacity key={cmd} style={s.cmdRow} onPress={() => copy(cmd)} activeOpacity={0.7}>
              <View style={{ flex: 1 }}>
                <Text style={s.cmdText}>{cmd}</Text>
                <Text style={s.cmdDesc}>{desc}</Text>
              </View>
              <View style={[s.copyBadge, copied === cmd && s.copyBadgeOn]}>
                <Text style={[s.copyTxt, copied === cmd && s.copyTxtOn]}>{copied === cmd ? '✓' : 'COPY'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.note}>
          <Text style={s.noteTxt}>
            ADB is a free developer tool from Google. It requires no rooting and works on any Android 4.1+ device.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg0 },
  content:      { padding: Sz.md, paddingBottom: 40 },
  header:       { marginBottom: Sz.lg },
  eyebrow:      { color: Colors.accent, fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 2.5, marginBottom: 4 },
  title:        { color: Colors.textPrimary, fontSize: 28, fontWeight: '700', fontFamily: 'SpaceMono', letterSpacing: -1 },
  sub:          { color: Colors.textSecondary, fontSize: 11, fontFamily: 'SpaceMono', marginTop: 2 },
  statusCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg1, borderRadius: R.lg, borderWidth: 1, borderColor: Colors.bg3, padding: Sz.md, marginBottom: Sz.md, gap: 12 },
  statusDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.danger },
  statusTitle:  { color: Colors.textPrimary, fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '700' },
  statusSub:    { color: Colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 11, marginTop: 2 },
  tabRow:       { flexDirection: 'row', backgroundColor: Colors.bg1, borderRadius: R.lg, padding: 3, borderWidth: 1, borderColor: Colors.bg3, marginBottom: Sz.md },
  tab:          { flex: 1, paddingVertical: 8, borderRadius: R.md, alignItems: 'center' },
  tabOn:        { backgroundColor: Colors.bg3 },
  tabTxt:       { color: Colors.textMuted, fontFamily: 'SpaceMono', fontSize: 12 },
  tabTxtOn:     { color: Colors.accent },
  stepsCard:    { backgroundColor: Colors.bg1, borderRadius: R.lg, borderWidth: 1, borderColor: Colors.bg3, paddingHorizontal: Sz.md, paddingTop: Sz.md, marginBottom: Sz.lg },
  stepRow:      { flexDirection: 'row', paddingBottom: Sz.md, gap: 12 },
  stepBorder:   {},
  stepLeft:     { alignItems: 'center', width: 28 },
  stepNum:      { color: Colors.accent, fontFamily: 'SpaceMono', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  stepLine:     { width: 1, flex: 1, backgroundColor: Colors.bg3, marginTop: 4 },
  stepBody:     { flex: 1, paddingBottom: Sz.md },
  stepTitle:    { color: Colors.textPrimary, fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  stepDesc:     { color: Colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 11, lineHeight: 17 },
  sectionLabel: { color: Colors.textMuted, fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 2, marginBottom: Sz.sm },
  cmdsCard:     { backgroundColor: Colors.bg1, borderRadius: R.lg, borderWidth: 1, borderColor: Colors.bg3, marginBottom: Sz.md, overflow: 'hidden' },
  cmdRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Sz.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.bg3, gap: 10 },
  cmdText:      { color: Colors.accent, fontFamily: 'SpaceMono', fontSize: 11 },
  cmdDesc:      { color: Colors.textMuted, fontFamily: 'SpaceMono', fontSize: 10, marginTop: 2 },
  copyBadge:    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: R.sm, backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.bg3 },
  copyBadgeOn:  { backgroundColor: Colors.accentDim, borderColor: Colors.accentMid },
  copyTxt:      { color: Colors.textMuted, fontFamily: 'SpaceMono', fontSize: 9, letterSpacing: 1 },
  copyTxtOn:    { color: Colors.accent },
  note:         { backgroundColor: Colors.bg1, borderRadius: R.md, padding: Sz.md, borderWidth: 1, borderColor: Colors.bg3 },
  noteTxt:      { color: Colors.textMuted, fontFamily: 'SpaceMono', fontSize: 11, lineHeight: 17 },
});