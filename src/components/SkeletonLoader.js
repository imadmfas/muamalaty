import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from './GlassCard';

export const SkeletonLoader = () => {
  const { theme, isDarkMode } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const shimmerStyle = {
    opacity: pulseAnim,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 24, 40, 0.05)',
  };

  return (
    <GlassCard borderColor={theme.border} style={styles.card}>
      <View style={styles.badgeRow}>
        <Animated.View style={[styles.shimmerBadge, shimmerStyle]} />
        <Animated.View style={[styles.shimmerBadgeShort, shimmerStyle]} />
      </View>
      <Animated.View style={[styles.shimmerTitle, shimmerStyle]} />
      <Animated.View style={[styles.shimmerSub, shimmerStyle]} />
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />
      <Animated.View style={[styles.shimmerHeader, shimmerStyle]} />
      <Animated.View style={[styles.shimmerLine, shimmerStyle, { width: '85%' }]} />
      <Animated.View style={[styles.shimmerLine, shimmerStyle, { width: '90%' }]} />
      <Animated.View style={[styles.shimmerLine, shimmerStyle, { width: '75%' }]} />
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />
      <Animated.View style={[styles.shimmerHeader, shimmerStyle]} />
      <Animated.View style={[styles.shimmerLine, shimmerStyle, { width: '40%', height: 24 }]} />
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />
      <Animated.View style={[styles.shimmerHeader, shimmerStyle]} />
      <Animated.View style={[styles.shimmerMap, shimmerStyle]} />
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: { width: '100%', padding: 18 },
  badgeRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 16 },
  shimmerBadge: { width: 140, height: 22, borderRadius: 8 },
  shimmerBadgeShort: { width: 80, height: 22, borderRadius: 8 },
  shimmerTitle: { height: 26, borderRadius: 10, alignSelf: 'flex-end', width: '75%', marginBottom: 8 },
  shimmerSub: { height: 16, borderRadius: 8, alignSelf: 'flex-end', width: '50%', marginBottom: 16 },
  divider: { height: 1, marginVertical: 14 },
  shimmerHeader: { height: 16, borderRadius: 8, alignSelf: 'flex-end', width: '35%', marginBottom: 12 },
  shimmerLine: { height: 14, borderRadius: 6, alignSelf: 'flex-end', marginBottom: 8 },
  shimmerMap: { height: 100, borderRadius: 16, width: '100%', marginTop: 8 },
});
