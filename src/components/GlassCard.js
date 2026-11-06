import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

export const GlassCard = ({ children, style, borderColor, glow = false }) => {
  const { theme, isDarkMode, themeConfig } = useTheme();

  return (
    <LinearGradient
      colors={[theme.cardMain, theme.cardMain]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        {
          borderRadius: themeConfig.borderRadius,
          borderColor: borderColor || theme.border,
          ...(isDarkMode
            ? { shadowColor: 'transparent', shadowOpacity: 0, elevation: 0 }
            : themeConfig.shadowLight),
        },
        glow && isDarkMode && { borderColor: theme.border },
        glow && !isDarkMode && {
          shadowColor: '#101828',
          shadowOpacity: 0.12,
          shadowRadius: 18,
          elevation: 4,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.reflectionOverlay,
          { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.006)' : 'rgba(255,255,255,0.018)' },
        ]}
      />
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 18,
    marginVertical: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  reflectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    transform: [{ scaleX: 1.5 }],
  },
});
