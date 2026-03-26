// components/StorageRing.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { formatBytes, statusColor } from '@/utils/storage';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  totalBytes: number;
  usedBytes:  number;
  size?: number;
}

export default function StorageRing({ totalBytes, usedBytes, size = 220 }: Props) {
  const pct    = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
  const color  = statusColor(pct);
  const radius = (size - 32) / 2;
  const circ   = 2 * Math.PI * radius;
  const targetOffset = circ - (pct / 100) * circ;

  const animOffset  = useRef(new Animated.Value(circ)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animOffset,  { toValue: targetOffset, duration: 1400, useNativeDriver: false }),
      Animated.timing(animOpacity, { toValue: 1,            duration: 600,  useNativeDriver: false }),
    ]).start();
  }, []);

  const cx = size / 2, cy = size / 2;

  return (
    <Animated.View style={{ opacity: animOpacity, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%"   stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.35" />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1C2230" strokeWidth={16} />
        {/* Inner glow */}
        <Circle cx={cx} cy={cy} r={radius - 22} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.12} />
        {/* Progress */}
        <AnimatedCircle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="url(#g)"
          strokeWidth={16}
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={animOffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
      </Svg>

      {/* Centre text */}
      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[s.pct, { color }]}>{Math.round(pct)}<Text style={s.pctSign}>%</Text></Text>
        <Text style={s.used}>{formatBytes(usedBytes)}</Text>
        <Text style={s.total}>of {formatBytes(totalBytes)}</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  pct:     { fontFamily: 'SpaceMono', fontSize: 42, fontWeight: '700', letterSpacing: -1 },
  pctSign: { fontSize: 22, fontWeight: '400' },
  used:    { color: '#E8EDF5', fontFamily: 'SpaceMono', fontSize: 16, fontWeight: '600', marginTop: 2 },
  total:   { color: '#7A8899', fontFamily: 'SpaceMono', fontSize: 12, marginTop: 2 },
});