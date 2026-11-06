// Reconstructed from Hermes bundle module 734 (decompiled.js lines 287181–287758)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { FamilyScreen } from './FamilyScreen';
import { SavedScreen } from './SavedScreen';
import { SettingsScreen } from './SettingsScreen';

export const ProfileScreen = ({ onOpenAdmin, onAskAI }) => {
  const { theme, isDarkMode, toggleDarkMode, themeConfig } = useTheme();
  const [activeTab, setActiveTab] = useState('docs');

  const textPrimaryStyle = { color: theme.textPrimary };
  const textSecondaryStyle = { color: theme.textSecondary };
  // Read but unused in the original
  const cardBg = theme.cardMain;
  const borderColor = theme.border;

  const activeTabColor = isDarkMode ? theme.background : theme.cardElevated;
  const isSettings = activeTab === 'settings';
  const isSaved = activeTab === 'saved';
  const isDocs = activeTab === 'docs';

  const renderTabContent = () => {
    if (activeTab === 'docs') return <FamilyScreen />;
    if (activeTab === 'saved') return <SavedScreen />;
    if (activeTab === 'settings') return <SettingsScreen onOpenAdmin={onOpenAdmin} />;
    return <FamilyScreen />;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topHeaderRow}>
        <View style={styles.headerLeftActions}>
          <TouchableOpacity
            style={[styles.themeToggleBtn, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={toggleDarkMode}
            activeOpacity={0.8}
          >
            <Feather name={isDarkMode ? 'sun' : 'moon'} size={13} color={theme.textPrimary} />
            <Text style={[styles.themeToggleText, { color: theme.textSecondary }]}>{isDarkMode ? 'فاتح' : 'داكن'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRightText}>
          <Text style={[styles.headerTitleText, textPrimaryStyle]}>حسابي والخصوصية 🔒</Text>
        </View>
      </View>

      <View style={styles.screenHeader}>
        <Text style={[styles.headerSubtitle, textSecondaryStyle]}>مستمسكاتك الآمنة، المعاملات المحفوظة، وإعدادات خصوصيتك</Text>
      </View>

      <View style={styles.tabBarWrapper}>
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
              shadowColor: themeConfig.shadowLight.shadowColor,
              shadowOpacity: isDarkMode ? 0 : 0.02,
              shadowRadius: 8,
              elevation: isDarkMode ? 0 : 1,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.tabBtn, isSettings && { backgroundColor: theme.primaryBrand }]}
            onPress={() => setActiveTab('settings')}
          >
            <Feather name="settings" size={14} color={isSettings ? activeTabColor : theme.textSecondary} style={{ marginLeft: 6 }} />
            <Text style={[styles.tabBtnText, { color: isSettings ? activeTabColor : theme.textSecondary }]}>الضبط والأمان</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, isSaved && { backgroundColor: theme.primaryBrand }]}
            onPress={() => setActiveTab('saved')}
          >
            <Feather name="star" size={14} color={isSaved ? activeTabColor : theme.textSecondary} style={{ marginLeft: 6 }} />
            <Text style={[styles.tabBtnText, { color: isSaved ? activeTabColor : theme.textSecondary }]}>محفوظاتي</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, isDocs && { backgroundColor: theme.primaryBrand }]}
            onPress={() => setActiveTab('docs')}
          >
            <Feather name="folder" size={14} color={isDocs ? activeTabColor : theme.textSecondary} style={{ marginLeft: 6 }} />
            <Text style={[styles.tabBtnText, { color: isDocs ? activeTabColor : theme.textSecondary }]}>مستمسكاتي</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContentArea}>{renderTabContent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenHeader: { paddingHorizontal: 16, marginBottom: 16, alignItems: 'flex-end' },
  headerSubtitle: { fontSize: 12.5, textAlign: 'right' },
  topHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, marginTop: 25 },
  headerLeftActions: { flexDirection: 'row', alignItems: 'center' },
  themeToggleBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, height: 36, justifyContent: 'center' },
  themeToggleText: { fontSize: 11, fontWeight: 'bold' },
  headerRightText: { alignItems: 'flex-end' },
  headerTitleText: { fontSize: 18, fontWeight: 'bold' },
  tabBarWrapper: { paddingHorizontal: 16, marginBottom: 12 },
  tabBar: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 3 },
  tabBtn: { flex: 1, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabBtnText: { fontSize: 12, fontWeight: 'bold' },
  tabContentArea: { flex: 1 },
});
