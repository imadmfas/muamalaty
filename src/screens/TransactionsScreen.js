import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { getFullInitialServices } from '../data/servicesData';
import { TransactionDetailModal } from '../components/TransactionDetailModal';

export const TransactionsScreen = ({ onAskAI }) => {
  const { theme, isDarkMode, toggleDarkMode, themeConfig } = useTheme();

  const [activeTab, setActiveTab] = useState('track');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const allServices = useMemo(() => getFullInitialServices(), []);

  const trackedTransactions = useMemo(
    () => [
      {
        id: '1',
        title: 'إصدار جواز سفر',
        ref: '2024/5689',
        date: 'منذ 3 أيام',
        status: 'قيد التنفيذ',
        progress: 0.6,
        icon: 'passport',
        color: theme.primaryBrand,
      },
      {
        id: '2',
        title: 'تجديد بطاقة وطنية',
        ref: '2024/5688',
        date: 'منذ 5 أيام',
        status: 'قيد التنفيذ',
        progress: 0.4,
        icon: 'id-card',
        color: theme.primaryBrand,
      },
      {
        id: '3',
        title: 'إجازة سوق',
        ref: '2024/5687',
        date: 'منذ 10 أيام',
        status: 'مكتملة',
        progress: 1,
        icon: 'car-sport',
        color: theme.success,
      },
      {
        id: '4',
        title: 'شهادة ولادة',
        ref: '2024/5686',
        date: 'منذ 12 يوم',
        status: 'مكتملة',
        progress: 1,
        icon: 'baby',
        color: theme.success,
      },
    ],
    [theme]
  );

  const guideCategories = [
    { label: 'الهوية والجنسية', icon: 'card-account-details-outline', count: 12, categoryKey: 'بطاقة' },
    { label: 'السكن والعقارات', icon: 'home-city-outline', count: 18, categoryKey: 'عقار' },
    { label: 'الصحة والولادات', icon: 'baby-carriage', count: 8, categoryKey: 'ولادة' },
    { label: 'المركبات والنقل', icon: 'car-outline', count: 15, categoryKey: 'سيارة' },
    { label: 'العمل والضمان', icon: 'briefcase-outline', count: 10, categoryKey: 'رعاية' },
    { label: 'البلديات والخدمات', icon: 'office-building', count: 14, categoryKey: 'بلدية' },
  ];

  const filteredServices = useMemo(() => {
    return allServices.filter((service) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        service.service_name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.ministry_name.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesCategory = true;
      if (selectedCategory) {
        if (selectedCategory === 'الهوية والجنسية') {
          matchesCategory =
            service.category.includes('بطاقة') || service.category.includes('إقامة');
        } else if (selectedCategory === 'السكن والعقارات') {
          matchesCategory = [
            'عقار',
            'بلدية',
            'كهرباء',
            'إفراز أرض',
            'خدمات ماء',
            'خدمات مجاري',
          ].includes(service.category);
        } else if (selectedCategory === 'الصحة والولادات') {
          matchesCategory = ['ولادة', 'وفاة', 'لقاحات', 'تقرير طبي', 'فحص زواج'].includes(
            service.category
          );
        } else if (selectedCategory === 'المركبات والنقل') {
          matchesCategory =
            service.category.includes('سيارة') || service.category.includes('سوق');
        } else if (selectedCategory === 'العمل والضمان') {
          matchesCategory =
            service.category.includes('رعاية') ||
            service.category.includes('تموين') ||
            service.category.includes('ضمان');
        } else if (selectedCategory === 'البلديات والخدمات') {
          matchesCategory =
            service.category.includes('بلدية') || service.category.includes('خدمات');
        }
      }

      return matchesSearch && matchesCategory;
    });
  }, [allServices, searchQuery, selectedCategory]);

  const handleOpenDetail = (service) => {
    setSelectedService(service);
    setIsModalVisible(true);
  };

  const textStyle = { color: theme.textPrimary };
  const subTextStyle = { color: theme.textSecondary };
  // Dead reads present in the compiled bundle (values computed but never used).
  const cardBg = theme.cardMain;
  const borderColor = theme.border;

  const renderServiceCard = ({ item }) => (
    <TouchableOpacity style={styles.cardWrapper} onPress={() => handleOpenDetail(item)}>
      <GlassCard
        borderColor={theme.border}
        style={[
          styles.serviceCard,
          {
            backgroundColor: theme.cardMain,
            shadowColor: themeConfig.shadowLight.shadowColor,
            shadowOpacity: isDarkMode ? 0 : themeConfig.shadowLight.shadowOpacity,
            shadowRadius: themeConfig.shadowLight.shadowRadius,
            elevation: isDarkMode ? 0 : themeConfig.shadowLight.elevation,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.arrowIcon}>
            <Feather name="chevron-left" size={16} color={theme.textMuted} />
          </View>
          <View style={styles.cardTextContent}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              {item.service_name_ar}
            </Text>
            <Text style={[styles.cardMinistry, { color: theme.textSecondary }]}>
              {item.ministry_name}
            </Text>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isDarkMode && (
        <View style={styles.absoluteGlowContainer}>
          <LinearGradient
            colors={['rgba(116, 183, 255, 0.02)', 'transparent']}
            style={styles.glowBlue}
          />
          <LinearGradient
            colors={['rgba(38, 198, 218, 0.012)', 'transparent']}
            style={styles.glowPurple}
          />
        </View>
      )}

      <View style={styles.topHeaderRow}>
        <View style={styles.headerLeftActions}>
          <TouchableOpacity
            style={[
              styles.themeToggleBtn,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
            ]}
            onPress={toggleDarkMode}
            activeOpacity={0.8}
          >
            <Feather name={isDarkMode ? 'sun' : 'moon'} size={13} color={theme.textPrimary} />
            <Text style={[styles.themeToggleText, { color: theme.textSecondary }]}>
              {isDarkMode ? 'فاتح' : 'داكن'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRightText}>
          <Text style={[styles.headerTitleText, textStyle]}>المعاملات الحكومية</Text>
        </View>
      </View>

      <View style={styles.segmentedControlWrapper}>
        <View
          style={[
            styles.segmentedControl,
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
            style={[
              styles.segmentBtn,
              activeTab === 'guide' && { backgroundColor: theme.primaryBrand },
            ]}
            onPress={() => {
              setActiveTab('guide');
              setSelectedCategory(null);
            }}
          >
            <Text
              style={[
                styles.segmentText,
                { color: theme.textSecondary },
                activeTab === 'guide' && {
                  color: isDarkMode ? theme.background : theme.cardElevated,
                },
              ]}
            >
              دليل المعاملات
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'track' && { backgroundColor: theme.primaryBrand },
            ]}
            onPress={() => setActiveTab('track')}
          >
            <Text
              style={[
                styles.segmentText,
                { color: theme.textSecondary },
                activeTab === 'track' && {
                  color: isDarkMode ? theme.background : theme.cardElevated,
                },
              ]}
            >
              تتبع المعاملات
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'track' && (
        <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
          <View style={styles.screenHeader}>
            <Text style={[styles.headerSubtitle, subTextStyle]}>
              تتبع حالة معاملاتك الحكومية المفتوحة والمنتهية
            </Text>
          </View>

          <View style={styles.transactionsList}>
            {trackedTransactions.map((item) => {
              const isInProgress = item.status === 'قيد التنفيذ';
              const statusColor = isInProgress ? theme.primaryBrand : theme.success;
              const statusBg = isInProgress
                ? isDarkMode
                  ? 'rgba(96, 165, 250, 0.1)'
                  : 'rgba(29, 78, 216, 0.08)'
                : isDarkMode
                ? 'rgba(50, 213, 131, 0.1)'
                : 'rgba(18, 183, 106, 0.08)';

              return (
                <GlassCard
                  key={item.id}
                  borderColor={theme.border}
                  style={[
                    styles.trackCard,
                    {
                      backgroundColor: theme.cardMain,
                      shadowColor: themeConfig.shadowLight.shadowColor,
                      shadowOpacity: isDarkMode ? 0 : themeConfig.shadowLight.shadowOpacity,
                      shadowRadius: themeConfig.shadowLight.shadowRadius,
                      elevation: isDarkMode ? 0 : themeConfig.shadowLight.elevation,
                    },
                  ]}
                >
                  <View style={styles.trackCardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                        {item.status}
                      </Text>
                    </View>
                    <View style={styles.trackHeaderRight}>
                      <View style={styles.trackMeta}>
                        <Text style={[styles.trackTitle, { color: theme.textPrimary }]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.trackSub, subTextStyle]}>
                          رقم المعاملة: {item.ref} • {item.date}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.trackIconCircle,
                          {
                            backgroundColor: theme.backgroundSecondary,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        {item.icon === 'passport' && (
                          <MaterialCommunityIcons name="passport" size={18} color={statusColor} />
                        )}
                        {item.icon === 'id-card' && (
                          <FontAwesome5 name="id-card" size={14} color={statusColor} />
                        )}
                        {item.icon === 'car-sport' && (
                          <Ionicons name="car-sport" size={18} color={statusColor} />
                        )}
                        {item.icon === 'baby' && (
                          <FontAwesome5 name="baby" size={14} color={statusColor} />
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.progressSection}>
                    <View style={styles.progressTextRow}>
                      <Text style={[styles.progressPercent, { color: theme.textPrimary }]}>
                        {(item.progress * 100).toFixed(0)}%
                      </Text>
                      <Text style={[styles.progressLabel, subTextStyle]}>نسبة الإنجاز</Text>
                    </View>
                    <View
                      style={[
                        styles.progressBarBg,
                        {
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : theme.divider,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${item.progress * 100}%`,
                            backgroundColor: statusColor,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </GlassCard>
              );
            })}
          </View>

          <View style={{ height: 180 }} />
        </ScrollView>
      )}

      {activeTab === 'guide' && (
        <View style={{ flex: 1 }}>
          <View style={[styles.screenHeader, { paddingHorizontal: 16 }]}>
            <Text style={[styles.headerSubtitle, subTextStyle]}>
              ابحث وتصفح الدليل الشامل لجميع المعاملات الرسمية
            </Text>
          </View>

          <View style={styles.searchSection}>
            <View
              style={[
                styles.searchRow,
                {
                  backgroundColor: theme.cardMain,
                  borderColor: theme.border,
                  shadowColor: themeConfig.shadowLight.shadowColor,
                  shadowOpacity: isDarkMode ? 0 : themeConfig.shadowLight.shadowOpacity,
                  shadowRadius: themeConfig.shadowLight.shadowRadius,
                  elevation: isDarkMode ? 0 : themeConfig.shadowLight.elevation,
                },
              ]}
            >
              <TextInput
                placeholder="ابحث عن معاملة..."
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { color: theme.textPrimary }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                textAlign="right"
              />
              <Feather
                name="search"
                size={18}
                color={theme.textSecondary}
                style={{ marginRight: 10 }}
              />
            </View>
          </View>

          {!selectedCategory && !searchQuery && (
            <ScrollView
              contentContainerStyle={styles.guideScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.guideGrid}>
                {guideCategories.map((cat, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.guideCard,
                      {
                        backgroundColor: theme.cardMain,
                        borderColor: theme.border,
                        shadowColor: themeConfig.shadowLight.shadowColor,
                        shadowOpacity: isDarkMode ? 0 : themeConfig.shadowLight.shadowOpacity,
                        shadowRadius: themeConfig.shadowLight.shadowRadius,
                        elevation: isDarkMode ? 0 : themeConfig.shadowLight.elevation,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat.label)}
                  >
                    <View style={styles.guideCardLeft}>
                      <Feather name="chevron-left" size={16} color={theme.textSecondary} />
                    </View>
                    <View style={styles.guideCardRight}>
                      <View style={styles.guideCardMeta}>
                        <Text style={[styles.guideCardTitle, { color: theme.textPrimary }]}>
                          {cat.label}
                        </Text>
                        <Text style={[styles.guideCardSub, subTextStyle]}>
                          {cat.count} معاملات
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.guideIconWrapper,
                          {
                            backgroundColor: isDarkMode
                              ? 'rgba(96, 165, 250, 0.1)'
                              : 'rgba(29, 78, 216, 0.08)',
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={cat.icon}
                          size={20}
                          color={theme.primaryBrand}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ height: 180 }} />
            </ScrollView>
          )}

          {(selectedCategory || searchQuery) && (
            <View style={{ flex: 1 }}>
              {selectedCategory && (
                <View style={styles.categoryHeaderRow}>
                  <TouchableOpacity
                    style={[
                      styles.backBtn,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(96, 165, 250, 0.1)'
                          : 'rgba(29, 78, 216, 0.08)',
                      },
                    ]}
                    onPress={() => setSelectedCategory(null)}
                  >
                    <Feather
                      name="arrow-left"
                      size={16}
                      color={theme.primaryBrand}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.backBtnText, { color: theme.primaryBrand }]}>
                      العودة للدليل
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.categoryTitleText, textStyle]}>{selectedCategory}</Text>
                </View>
              )}

              <FlatList
                data={filteredServices}
                keyExtractor={(item) => item.service_id}
                renderItem={renderServiceCard}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      )}

      {selectedService && (
        <TransactionDetailModal
          service={selectedService}
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onAskAI={onAskAI}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  absoluteGlowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  glowPurple: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  glowBlue: {
    position: 'absolute',
    bottom: 100,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  screenHeader: { marginBottom: 16, alignItems: 'flex-end' },
  headerSubtitle: { fontSize: 12.5, marginBottom: 4, textAlign: 'right' },
  scrollArea: { paddingHorizontal: 16, paddingTop: 12 },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 25,
  },
  headerLeftActions: { flexDirection: 'row', alignItems: 'center' },
  themeToggleBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
  },
  themeToggleText: { fontSize: 11, fontWeight: 'bold' },
  headerRightText: { alignItems: 'flex-end' },
  headerTitleText: { fontSize: 18, fontWeight: 'bold' },
  segmentedControlWrapper: { paddingHorizontal: 16, marginBottom: 16 },
  segmentedControl: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 3 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  segmentText: { fontSize: 12, fontWeight: 'bold' },
  transactionsList: { gap: 12 },
  trackCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  trackCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10.5, fontWeight: 'bold' },
  trackHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trackMeta: { alignItems: 'flex-end' },
  trackTitle: { fontSize: 14.5, fontWeight: 'bold' },
  trackSub: { fontSize: 11, marginTop: 2 },
  trackIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: { marginTop: 14 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressPercent: { fontSize: 11.5, fontWeight: 'bold' },
  progressLabel: { fontSize: 11 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  searchSection: { paddingHorizontal: 16, marginBottom: 16 },
  searchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13.5,
    fontWeight: '500',
    textAlign: 'right',
  },
  guideScrollContent: { paddingHorizontal: 16 },
  guideGrid: { gap: 10 },
  guideCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  guideCardLeft: { paddingLeft: 6 },
  guideCardRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guideCardMeta: { alignItems: 'flex-end' },
  guideCardTitle: { fontSize: 14.5, fontWeight: 'bold' },
  guideCardSub: { fontSize: 11, marginTop: 2 },
  guideIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryTitleText: { fontSize: 15, fontWeight: 'bold' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  backBtnText: { fontSize: 11.5, fontWeight: 'bold' },
  listContainer: { paddingHorizontal: 16, paddingBottom: 180 },
  cardWrapper: { marginBottom: 8 },
  serviceCard: { padding: 12, borderRadius: 16, borderWidth: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  arrowIcon: { paddingLeft: 4 },
  cardTextContent: { alignItems: 'flex-end', flex: 1, paddingRight: 6 },
  cardTitle: { fontSize: 14, fontWeight: 'bold' },
  cardMinistry: { fontSize: 11, marginTop: 2 },
});
