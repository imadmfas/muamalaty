// Reconstructed from Hermes bundle module 733 (decompiled.js lines 285219–287181)
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { loadIndicators, formatUpdatedAt } from '../services/liveIndicators';

export const ServicesHubScreen = ({ onAskAI }) => {
  const { theme, isDarkMode, toggleDarkMode, themeConfig } = useTheme();
  const { chronicMedications, removeChronicMedication, childVaccines, removeChildVaccine } = useAppStore();

  const [expandedChildId, setExpandedChildId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [live, setLive] = useState(null);
  useEffect(() => {
    let alive = true;
    loadIndicators().then((d) => alive && setLive(d)).catch(() => alive && setLive({}));
    return () => {
      alive = false;
    };
  }, []);
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : '—');
  const updated = live?.at ? 'آخر تحديث: ' + formatUpdatedAt(live.at) : live ? 'تعذر التحديث، تحقق من الاتصال' : 'جاري التحديث...';

  const formatMedTime = (time) => {
    if (!time) return '';
    const [hourStr, minute] = time.split(':');
    const hour = parseInt(hourStr);
    const suffix = hour >= 12 ? 'مساءً' : 'صباحاً';
    const hour12 = hour % 12 !== 0 ? hour % 12 : 12;
    return `${hour12}:${minute} ${suffix}`;
  };

  const textPrimaryStyle = { color: theme.textPrimary };
  const textSecondaryStyle = { color: theme.textSecondary };
  // Read but unused in the original
  const cardBg = theme.cardMain;
  const borderColor = theme.border;

  const isSmart = activeFilter === 'smart';
  const isFinance = activeFilter === 'finance';
  const isHealth = activeFilter === 'health';
  const isAll = activeFilter === 'all';

  const activePillStyle = { backgroundColor: theme.primaryBrand, borderColor: theme.primaryBrand };
  const activePillTextStyle = { color: isDarkMode ? theme.background : 'white' };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isDarkMode && (
        <View style={styles.absoluteGlowContainer}>
          <LinearGradient colors={[theme.primaryBrand + '05', 'transparent']} style={styles.glowBlue} />
          <LinearGradient colors={[theme.secondaryAccent + '03', 'transparent']} style={styles.glowPurple} />
        </View>
      )}

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
          <Text style={[styles.headerTitleText, textPrimaryStyle]}>الخدمات والمؤشرات</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
        <View style={styles.screenHeader}>
          <Text style={[styles.headerSubtitle, textSecondaryStyle]}>طقس بغداد، أسعار الذهب والدولار، والخدمات العائلية</Text>
        </View>

        <View style={styles.pillsRow}>
          <TouchableOpacity
            style={[styles.pillBtn, { backgroundColor: theme.cardMain, borderColor: theme.border }, isSmart && activePillStyle]}
            onPress={() => setActiveFilter('smart')}
          >
            <Text style={[styles.pillText, { color: theme.textSecondary }, isSmart && activePillTextStyle]}>ذكية</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pillBtn, { backgroundColor: theme.cardMain, borderColor: theme.border }, isFinance && activePillStyle]}
            onPress={() => setActiveFilter('finance')}
          >
            <Text style={[styles.pillText, { color: theme.textSecondary }, isFinance && activePillTextStyle]}>مالية</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pillBtn, { backgroundColor: theme.cardMain, borderColor: theme.border }, isHealth && activePillStyle]}
            onPress={() => setActiveFilter('health')}
          >
            <Text style={[styles.pillText, { color: theme.textSecondary }, isHealth && activePillTextStyle]}>صحة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pillBtn, { backgroundColor: theme.cardMain, borderColor: theme.border }, isAll && activePillStyle]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.pillText, { color: theme.textSecondary }, isAll && activePillTextStyle]}>الكل</Text>
          </TouchableOpacity>
        </View>

        {(isAll || isFinance) && (
          <View style={styles.indicatorRow}>
            <GlassCard borderColor={theme.border} style={[styles.indicatorCard, { backgroundColor: theme.cardMain }]}>
              <View style={styles.indicatorHeader}>
                <Feather name="sun" size={16} color={theme.warning} />
                <Text style={[styles.indicatorTitle, textSecondaryStyle]}>
                  بغداد{live?.weather?.desc ? ' • ' + live.weather.desc : ''}
                </Text>
              </View>
              <Text style={[styles.indicatorValue, textPrimaryStyle]}>{live?.weather ? live.weather.temp + '°م' : '—'}</Text>
              <Text style={[styles.indicatorSub, textSecondaryStyle]}>{updated}</Text>
            </GlassCard>
            <GlassCard borderColor={theme.border} style={[styles.indicatorCard, { backgroundColor: theme.cardMain }]}>
              <View style={styles.indicatorHeader}>
                <Feather name="trending-up" size={16} color={theme.success} />
                <Text style={[styles.indicatorTitle, textSecondaryStyle]}>سعر الدولار (مرجعي)</Text>
              </View>
              <Text style={[styles.indicatorValue, { color: theme.success }]}>{live?.usdIqd ? fmt(Math.round(live.usdIqd)) + ' د.ع' : '—'}</Text>
              <Text style={[styles.indicatorSub, textSecondaryStyle]}>مصدر عالمي؛ أسعار المصارف والسوق تختلف</Text>
            </GlassCard>
          </View>
        )}

        {(isAll || isFinance) && (
          <View style={styles.goldCardWrapper}>
            <LinearGradient
              colors={isDarkMode ? ['#FFB300', '#D97706'] : ['#FFF9C4', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.goldCard, { borderColor: isDarkMode ? '#FFE082' : '#F59E0B' }]}
            >
              <View style={styles.goldHeader}>
                <MaterialCommunityIcons name="gold" size={24} color={isDarkMode ? 'white' : '#78350F'} />
                <Text style={[styles.goldTitle, { color: isDarkMode ? 'white' : '#78350F' }]}>بورصة الذهب العراقي عيار 21</Text>
              </View>
              <View style={styles.goldPriceRow}>
                <Text style={[styles.goldPriceText, { color: isDarkMode ? 'white' : '#78350F' }]}>
                  {live?.gold21Mithqal ? fmt(live.gold21Mithqal) + ' دينار عراقي' : '—'}
                </Text>
                <Text style={[styles.goldUnitText, { color: isDarkMode ? '#FFECB3' : '#78350F' }]}>للمثقال الواحد</Text>
              </View>
              <Text style={[styles.goldSub, { color: isDarkMode ? '#FFECB3' : '#78350F' }]}>📈 تقدير محسوب من السعر العالمي للأونصة بلا أجور صياغة • {updated}</Text>
            </LinearGradient>
          </View>
        )}

        {(isAll || isHealth) && (
          <GlassCard borderColor={theme.border} style={[styles.sectionCard, { backgroundColor: theme.cardMain }]}>
            <View style={styles.sectionTitleRow}>
              <Feather name="activity" size={18} color={theme.primaryBrand} style={{ marginLeft: 6 }} />
              <Text style={[styles.sectionCardTitle, { color: theme.primaryBrand }]}>الأمراض المزمنة والأدوية</Text>
            </View>
            <Text style={[styles.sectionCardSub, textSecondaryStyle]}>جدولة تنبيهات جرعات أدويتك مشفرة ومحميّة بالكامل على الهاتف:</Text>
            {chronicMedications.length !== 0 ? (
              <View style={styles.medsList}>
                {chronicMedications.map((med) => (
                  <View
                    key={med.id}
                    style={[styles.medItem, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                  >
                    <View style={styles.medMeta}>
                      <Text style={[styles.medName, { color: theme.textPrimary }]}>{med.medName}</Text>
                      <Text style={[styles.medSub, textSecondaryStyle]}>
                        المرض: {med.diseaseName} • الوقت: {formatMedTime(med.time)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert('حذف العلاج', 'هل تريد حذف ' + med.medName + ' وإيقاف تذكيراته؟', [
                          { text: 'إلغاء', style: 'cancel' },
                          {
                            text: 'حذف',
                            style: 'destructive',
                            onPress: async () => {
                              await removeChronicMedication(med.id);
                              Alert.alert('تم الحذف', 'تم إيقاف جدولة تنبيهات العلاج.');
                            },
                          },
                        ])
                      }
                      style={styles.trashBtn}
                    >
                      <Feather name="trash-2" size={14} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="pill" size={32} color={theme.textMuted} style={{ marginBottom: 6 }} />
                <Text style={[styles.emptyText, textPrimaryStyle]}>لا يوجد أدوية مضاف حالياً</Text>
                <Text style={[styles.emptySubText, textSecondaryStyle]}>أضف أدويتك اليومية من صفحة "حسابي" لجدولة تنبيهات الجرعة تلقائياً.</Text>
              </View>
            )}
          </GlassCard>
        )}

        {(isAll || isHealth) && (
          <GlassCard borderColor={theme.border} style={[styles.sectionCard, { backgroundColor: theme.cardMain }]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="medical-outline" size={18} color={theme.primaryBrand} style={{ marginLeft: 6 }} />
              <Text style={[styles.sectionCardTitle, { color: theme.primaryBrand }]}>جدول اللقاحات الوطنية للأطفال</Text>
            </View>
            <Text style={[styles.sectionCardSub, textSecondaryStyle]}>حساب وجدولة مواعيد اللقاحات لأطفالك دون سن السادسة تلقائياً:</Text>
            {childVaccines.length !== 0 ? (
              <View style={styles.childrenList}>
                {childVaccines.map((child) => (
                  <View key={child.id} style={[styles.childCard, { borderColor: theme.border }]}>
                    <TouchableOpacity
                      style={[styles.childHeader, { backgroundColor: theme.backgroundSecondary }]}
                      onPress={() => setExpandedChildId(expandedChildId !== child.id ? child.id : null)}
                    >
                      <Feather
                        name={expandedChildId === child.id ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={theme.primaryBrand}
                      />
                      <Text style={[styles.childName, { color: theme.textPrimary }]}>
                        {child.name} 👶 ({child.gender})
                      </Text>
                    </TouchableOpacity>
                    {expandedChildId === child.id && (
                      <View style={[styles.vaccineTimeline, { backgroundColor: theme.background }]}>
                        {(child.scheduledDates || []).map((item, index) => {
                          // v1.1.0: a past date means the due date has passed, not that the dose was given.
                          const isPast = new Date(item.date + 'T23:59:59').getTime() < new Date().getTime();
                          const statusColor = isPast ? theme.success : theme.warning;
                          const statusBg = isPast ? theme.success + '14' : theme.warning + '14';
                          return (
                            <View key={index} style={[styles.vaccineItem, { borderBottomColor: theme.border }]}>
                              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                              <View style={styles.vaccineDetails}>
                                <Text style={[styles.vaccineLabel, { color: theme.textPrimary }]}>{item.label}</Text>
                                <Text style={[styles.vaccineText, textSecondaryStyle]}>{item.vaccine}</Text>
                                <Text style={[styles.vaccineDate, { color: statusColor }]}>تاريخ الاستحقاق: {item.date}</Text>
                              </View>
                              <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                                <Text style={{ color: statusColor, fontSize: 9.5, fontWeight: 'bold' }}>
                                  {isPast ? 'مضى موعده' : 'قادم'}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="baby-face-outline" size={32} color={theme.textMuted} style={{ marginBottom: 6 }} />
                <Text style={[styles.emptyText, textPrimaryStyle]}>لا يوجد أطفال مضافين حالياً</Text>
                <Text style={[styles.emptySubText, textSecondaryStyle]}>أضف أطفالك من صفحة "حسابي" (أفراد العائلة) لتهيئة بطاقاتهم وجدولة لقاحاتهم فوراً.</Text>
              </View>
            )}
          </GlassCard>
        )}

        {(isAll || isSmart) && (
          <GlassCard borderColor={theme.border} style={[styles.sectionCard, { backgroundColor: theme.cardMain }]}>
            <View style={styles.sectionTitleRow}>
              <Feather name="layers" size={16} color={theme.textSecondary} style={{ marginLeft: 6 }} />
              <Text style={[styles.sectionCardTitle, textPrimaryStyle]}>أهم الخدمات</Text>
            </View>
            {/* v1.1.0: v1.0.0 showed three invented statuses here ("تم الإيداع بنجاح"…).
                These are now shortcuts that open the assistant on that service. */}
            <View style={styles.mockServicesList}>
              {[
                { title: 'إصدار جواز سفر عراقي', icon: 'airplane', query: 'إصدار جواز سفر' },
                { title: 'إصدار البطاقة الوطنية الموحدة', icon: 'card', query: 'البطاقة الوطنية' },
                { title: 'إضافة مولود للبطاقة التموينية', icon: 'basket', query: 'إضافة مولود للبطاقة التموينية' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.title}
                  activeOpacity={0.8}
                  onPress={() => onAskAI && onAskAI(item.query)}
                  style={[styles.mockServiceItem, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                >
                  <View style={styles.mockServiceLeft}>
                    <Feather name="chevron-left" size={16} color={theme.primaryBrand} />
                    <Text style={[styles.mockServiceStatus, { color: theme.primaryBrand }]}>اسأل المساعد</Text>
                  </View>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                    <Ionicons name={item.icon} size={15} color={theme.textSecondary} />
                    <Text style={[styles.mockServiceTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        )}

        <View style={{ height: 180 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  absoluteGlowContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden' },
  glowPurple: { position: 'absolute', top: -50, left: -50, width: 250, height: 250, borderRadius: 125 },
  glowBlue: { position: 'absolute', bottom: 100, right: -50, width: 250, height: 250, borderRadius: 125 },
  scrollArea: { paddingHorizontal: 16, paddingTop: 12 },
  screenHeader: { marginBottom: 16, alignItems: 'flex-end' },
  headerSubtitle: { fontSize: 12.5, marginBottom: 4, textAlign: 'right' },
  topHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, marginTop: 25 },
  headerLeftActions: { flexDirection: 'row', alignItems: 'center' },
  themeToggleBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, height: 36, justifyContent: 'center' },
  themeToggleText: { fontSize: 11, fontWeight: 'bold' },
  headerRightText: { alignItems: 'flex-end' },
  headerTitleText: { fontSize: 18, fontWeight: 'bold' },
  pillsRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 16 },
  pillBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  pillText: { fontSize: 12.5, fontWeight: 'bold' },
  indicatorRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  indicatorCard: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1, alignItems: 'flex-end' },
  indicatorHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 6 },
  indicatorTitle: { fontSize: 11, fontWeight: 'bold' },
  indicatorValue: { fontSize: 18, fontWeight: 'bold' },
  indicatorSub: { fontSize: 9.5, marginTop: 2 },
  goldCardWrapper: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  goldCard: { padding: 14, borderWidth: 1, borderRadius: 16 },
  goldHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 8 },
  goldTitle: { fontSize: 12.5, fontWeight: 'bold' },
  goldPriceRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 6 },
  goldPriceText: { fontSize: 18, fontWeight: 'bold' },
  goldUnitText: { fontSize: 11 },
  goldSub: { fontSize: 9.5, marginTop: 4, textAlign: 'right' },
  sectionCard: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 4 },
  sectionCardTitle: { fontSize: 15, fontWeight: 'bold' },
  sectionCardSub: { fontSize: 11, textAlign: 'right', marginBottom: 12, lineHeight: 16 },
  emptyCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderWidth: 1, borderRadius: 12 },
  emptyText: { fontSize: 12.5, fontWeight: 'bold', marginBottom: 2 },
  emptySubText: { fontSize: 10.5, textAlign: 'center', paddingHorizontal: 12, lineHeight: 14 },
  medsList: { gap: 8 },
  medItem: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1 },
  medMeta: { alignItems: 'flex-end', flex: 1, paddingRight: 6 },
  medName: { fontSize: 13.5, fontWeight: 'bold' },
  medSub: { fontSize: 11, marginTop: 2 },
  trashBtn: { padding: 6, backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 8 },
  childrenList: { gap: 8 },
  childCard: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  childHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  childName: { fontSize: 13.5, fontWeight: 'bold' },
  vaccineTimeline: { padding: 8, gap: 8 },
  vaccineItem: { flexDirection: 'row-reverse', alignItems: 'center', paddingBottom: 6, borderBottomWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 8 },
  vaccineDetails: { flex: 1, alignItems: 'flex-end', paddingRight: 6 },
  vaccineLabel: { fontSize: 12, fontWeight: 'bold' },
  vaccineText: { fontSize: 10.5, textAlign: 'right', marginTop: 1 },
  vaccineDate: { fontSize: 9.5, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  mockServicesList: { gap: 8 },
  mockServiceItem: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1 },
  mockServiceTitle: { fontSize: 13.5, fontWeight: 'bold' },
  mockServiceLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mockServiceStatus: { fontSize: 11, fontWeight: '600' },
});
