import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from './GlassCard';
import { StoreAdapter } from '../engine/index';
import { PathFinder, ConstraintSolver } from '../engine/solver';
import { PathSimulator } from '../engine/simulator';

export const TransactionDetailModal = ({ service, visible, onClose, onAskAI }) => {
  const { theme, isDarkMode, toggleDarkMode, themeConfig } = useTheme();
  const { favorites, addFavorite, removeFavorite } = useAppStore();

  const [checkedDocs, setCheckedDocs] = useState({});
  const [showAllSteps, setShowAllSteps] = useState(false);

  // Second, un-selected subscription to the whole store (fed into the engine).
  const storeState = useAppStore();

  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);

  const engineResult = React.useMemo(() => {
    try {
      const graph = StoreAdapter.buildGraphFromStore(storeState);
      const paths = PathFinder.generatePaths(graph, `service_${service.service_id}`);
      const solvedPaths = ConstraintSolver.solveConstraints(graph, paths, todayStr);
      const rankedPaths = PathSimulator.simulateAndRank(graph, solvedPaths, todayStr);
      const bestPath = rankedPaths.find((p) => p.isValid) || rankedPaths[0];
      if (bestPath) {
        const confidence = PathSimulator.calculateConfidence(
          graph,
          bestPath.path,
          bestPath.isValid,
          todayStr
        );
        return { bestPath, confidence, allPaths: rankedPaths };
      }
    } catch (error) {
      console.error('Error running engine in Modal:', error);
    }
    return null;
  }, [service.service_id, storeState, todayStr]);

  const isSaved = favorites.includes(service.service_id);

  const handleToggleDoc = (doc) => {
    setCheckedDocs((prev) => ({ ...prev, [doc]: !prev[doc] }));
  };

  const handleOpenLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('خطأ', 'لا يمكن فتح الرابط الرسمي حالياً.');
      });
    }
  };

  const handleAddDocToReminders = (doc) => {
    Alert.alert(
      'حفظ في مستمسكاتي 🔒',
      `هل ترغب بإضافة [${doc}] إلى قائمة مستمسكاتك الآمنة لجدولة تنبيه بانتهاء صلاحيتها؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، إضافة',
          onPress: () => {
            Alert.alert(
              'نجاح',
              "تمت الإضافة بنجاح! يرجى مراجعة صفحة 'مستمسكاتي' في تبويب حسابي لضبط تاريخ الانتهاء."
            );
          },
        },
      ]
    );
  };

  const bgColor = theme.background;
  const cardColor = theme.cardMain;
  const borderColor = theme.border;
  const textStyle = { color: theme.textPrimary };
  const subTextStyle = { color: theme.textSecondary };

  const warningBg = isDarkMode ? 'rgba(253, 176, 34, 0.05)' : 'rgba(247, 144, 9, 0.08)';
  const warningColor = theme.warning;
  const warningBorder = isDarkMode ? 'rgba(253, 176, 34, 0.2)' : 'rgba(247, 144, 9, 0.25)';

  let trustColor = theme.success;
  let trustLabel = 'موثوق رسمي';
  if (service.verification_status === 'portal') {
    trustColor = theme.primaryBrand;
    trustLabel = 'البوابة الرسمية';
  } else if (service.verification_status === 'verified_web') {
    trustColor = theme.secondaryAccent;
    trustLabel = 'تحقق الويب';
  }

  const toggleSave = () => {
    if (!isSaved) {
      addFavorite(service.service_id);
      Alert.alert('تم الحفظ', `تم حفظ [${service.service_name_ar}] في محفوظاتك للرجوع إليها لاحقاً.`);
    } else {
      removeFavorite(service.service_id);
      Alert.alert('تم الإزالة', `تم إزالة [${service.service_name_ar}] من محفوظاتك.`);
    }
  };

  const handleTriggerAI = () => {
    onClose();
    onAskAI(
      `أريد معلومات كاملة وخطوات تقديم معاملة: ${service.service_name_ar} التابعة لـ ${service.ministry_name} بالتفصيل.`
    );
  };

  const stepBadgeBg = isDarkMode ? 'rgba(96, 165, 250, 0.1)' : theme.cardSoftTint;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: bgColor }]}>
        <SafeAreaView style={{ flex: 1, width: '100%' }}>
          <View style={[styles.headerRow, { borderBottomColor: borderColor }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.iconBtn, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, textStyle]} numberOfLines={1}>
              تفاصيل المعاملة
            </Text>
            <TouchableOpacity
              onPress={toggleSave}
              style={[styles.iconBtn, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Ionicons
                name={isSaved ? 'star' : 'star-outline'}
                size={22}
                color={isSaved ? theme.warning : theme.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.titleSection}>
              <Text style={[styles.serviceTitle, textStyle]}>{service.service_name_ar}</Text>
              <Text style={[styles.serviceMinistry, subTextStyle]}>
                {service.ministry_name} - {service.department_name}
              </Text>
              <View style={styles.badgeRow}>
                <View style={[styles.trustBadge, { borderColor: trustColor }]}>
                  <View style={[styles.trustDot, { backgroundColor: trustColor }]} />
                  <Text style={[styles.trustText, { color: trustColor }]}>{trustLabel}</Text>
                </View>
                <Text style={[styles.waitBadge, subTextStyle]}>
                  ⏱️ {service.expected_processing_time}
                </Text>
                {engineResult && (
                  <View
                    style={[styles.trustBadge, { borderColor: theme.success, paddingHorizontal: 6 }]}
                  >
                    <Feather
                      name="shield"
                      size={11}
                      color={theme.success}
                      style={{ marginLeft: 3 }}
                    />
                    <Text style={[styles.trustText, { color: theme.success }]}>
                      ثقة: {engineResult.confidence}%
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {engineResult && !engineResult.bestPath.isValid && (
              <GlassCard
                borderColor={theme.danger}
                style={[
                  styles.tipsCard,
                  {
                    backgroundColor: isDarkMode
                      ? 'rgba(239, 68, 68, 0.05)'
                      : 'rgba(239, 68, 68, 0.08)',
                    marginBottom: 16,
                    borderRadius: 16,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <Feather name="alert-octagon" size={16} color={theme.danger} />
                  <Text style={[styles.sectionTitle, { color: theme.danger }]}>
                    موانع أهلية / وثائق منتهية الصلاحية ⚠️
                  </Text>
                </View>
                <Text
                  style={[
                    styles.tipsText,
                    { color: theme.danger, marginTop: 4, textAlign: 'right', fontSize: 11 },
                  ]}
                >
                  {engineResult.bestPath.reason ||
                    'هناك وثائق منتهية الصلاحية تؤثر على إمكانية إنجاز هذه المعاملة.'}
                </Text>
              </GlassCard>
            )}

            <GlassCard
              borderColor={borderColor}
              style={[styles.statsCard, { backgroundColor: cardColor }]}
            >
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={[styles.statLabel, subTextStyle]}>الرسوم التقريبية</Text>
                  <Text style={[styles.statVal, { color: theme.primaryBrand }]}>
                    {service.estimated_fees_iqd === 0
                      ? 'مجانية'
                      : `${service.estimated_fees_iqd.toLocaleString()} د.ع`}
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statLabel, subTextStyle]}>الدائرة المختصة</Text>
                  <Text
                    style={[styles.statVal, { fontSize: 11, color: theme.primaryBrand }]}
                    numberOfLines={2}
                  >
                    {service.office_name}
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statLabel, subTextStyle]}>حجز مسبق</Text>
                  <Text style={[styles.statVal, { color: theme.primaryBrand }]}>
                    {service.booking_required ? 'مطلوب' : 'غير مطلوب'}
                  </Text>
                </View>
              </View>
            </GlassCard>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRowCompact}>
                <Feather
                  name="file-text"
                  size={16}
                  color={theme.primaryBrand}
                  style={{ marginLeft: 6 }}
                />
                <Text style={[styles.sectionTitle, textStyle]}>المستمسكات والوثائق المطلوبة</Text>
              </View>
              <Text style={[styles.sectionSubtitle, subTextStyle]}>
                حدد المستمسكات التي جهزتها بالفعل لتتبع تقدمك:
              </Text>
              <View style={styles.docsList}>
                {service.required_documents.map((doc, index) => {
                  const isChecked = !!checkedDocs[doc];
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.docItemRow,
                        isChecked &&
                          (isDarkMode ? styles.docItemRowActiveDark : styles.docItemRowActiveLight),
                        { backgroundColor: theme.cardMain, borderColor: borderColor },
                      ]}
                      onPress={() => handleToggleDoc(doc)}
                    >
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text
                          style={[
                            styles.docItemText,
                            textStyle,
                            isChecked && styles.docItemTextActive,
                            isChecked && { color: theme.success },
                          ]}
                        >
                          {doc}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                          style={[
                            styles.miniAddBtn,
                            {
                              backgroundColor: isDarkMode
                                ? 'rgba(96, 165, 250, 0.1)'
                                : theme.cardSoftTint,
                            },
                          ]}
                          onPress={() => handleAddDocToReminders(doc)}
                        >
                          <Feather name="plus" size={14} color={theme.primaryBrand} />
                        </TouchableOpacity>
                        <Ionicons
                          name={isChecked ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={isChecked ? theme.success : theme.textMuted}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <TouchableOpacity onPress={() => setShowAllSteps(!showAllSteps)}>
                  <Text style={[styles.toggleText, { color: theme.primaryBrand }]}>
                    {showAllSteps ? 'طي الخطوات' : 'عرض الكل'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.sectionHeaderRowCompact}>
                  <Feather
                    name="check-circle"
                    size={16}
                    color={theme.primaryBrand}
                    style={{ marginLeft: 6 }}
                  />
                  <Text style={[styles.sectionTitle, textStyle]}>خطوات تقديم المعاملة بالتفصيل</Text>
                </View>
              </View>

              <View style={styles.stepsContainer}>
                {engineResult ? (
                  engineResult.bestPath.path.steps.map((step, index) => (
                    <View
                      key={step.id}
                      style={[styles.stepRow, { backgroundColor: theme.cardMain, borderColor }]}
                    >
                      <View style={styles.stepContent}>
                        <Text style={[styles.stepTitleText, textStyle]}>
                          الخطوة {index + 1}: {step.label}
                        </Text>
                        <Text style={[styles.stepDescText, subTextStyle]}>
                          المدة المتوقعة: {step.duration} أيام.
                          {step.requiredDocs.length > 0 &&
                            ` | الوثائق: ${step.requiredDocs.join('، ')}`}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.stepNumberBadge,
                          { borderColor: theme.primaryBrand, backgroundColor: stepBadgeBg },
                        ]}
                      >
                        <Text style={[styles.stepNumberText, { color: theme.primaryBrand }]}>
                          {index + 1}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <>
                    <View style={[styles.stepRow, { backgroundColor: theme.cardMain, borderColor }]}>
                      <View style={styles.stepContent}>
                        <Text style={[styles.stepTitleText, textStyle]}>
                          الخطوة 1: تجهيز المستمسكات وحجز الموعد
                        </Text>
                        <Text style={[styles.stepDescText, subTextStyle]}>
                          تأكد من مطابقة جميع الوثائق المطلوبة وحجز موعد عبر البوابة الإلكترونية إن وجد.
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.stepNumberBadge,
                          { borderColor: theme.primaryBrand, backgroundColor: stepBadgeBg },
                        ]}
                      >
                        <Text style={[styles.stepNumberText, { color: theme.primaryBrand }]}>1</Text>
                      </View>
                    </View>

                    {(showAllSteps || service.booking_required) && (
                      <>
                        <View
                          style={[styles.stepRow, { backgroundColor: theme.cardMain, borderColor }]}
                        >
                          <View style={styles.stepContent}>
                            <Text style={[styles.stepTitleText, textStyle]}>
                              الخطوة 2: مراجعة الدائرة المعنية وأخذ البصمات
                            </Text>
                            <Text style={[styles.stepDescText, subTextStyle]}>
                              {'التوجه حضورياً إلى '}
                              {service.office_name}
                              {' الكائن في '}
                              {service.office_address}
                              {'، والذهاب لشعبة التدقيق والتقاط الصورة الحيوية والبصمات.'}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.stepNumberBadge,
                              { borderColor: theme.primaryBrand, backgroundColor: stepBadgeBg },
                            ]}
                          >
                            <Text style={[styles.stepNumberText, { color: theme.primaryBrand }]}>
                              2
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[styles.stepRow, { backgroundColor: theme.cardMain, borderColor }]}
                        >
                          <View style={styles.stepContent}>
                            <Text style={[styles.stepTitleText, textStyle]}>
                              الخطوة 3: تسديد الرسوم والحصول على الوصل
                            </Text>
                            <Text style={[styles.stepDescText, subTextStyle]}>
                              {'دفع الرسوم البالغة '}
                              {service.estimated_fees_iqd > 0
                                ? `${service.estimated_fees_iqd.toLocaleString()} د.ع`
                                : 'مجانية'}
                              {' عبر '}
                              {service.payment_method}
                              {' والحصول على وصل الحسابات.'}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.stepNumberBadge,
                              { borderColor: theme.primaryBrand, backgroundColor: stepBadgeBg },
                            ]}
                          >
                            <Text style={[styles.stepNumberText, { color: theme.primaryBrand }]}>
                              3
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[styles.stepRow, { backgroundColor: theme.cardMain, borderColor }]}
                        >
                          <View style={styles.stepContent}>
                            <Text style={[styles.stepTitleText, textStyle]}>
                              الخطوة 4: تسليم الطلب النهائي واستلام الخدمة
                            </Text>
                            <Text style={[styles.stepDescText, subTextStyle]}>
                              {'تسليم معاملتك المنجزة لقسم الصادر وتتبع حالتها حتى الاستلام في مدة '}
                              {service.expected_processing_time}
                              {' تقريباً.'}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.stepNumberBadge,
                              { borderColor: theme.primaryBrand, backgroundColor: stepBadgeBg },
                            ]}
                          >
                            <Text style={[styles.stepNumberText, { color: theme.primaryBrand }]}>
                              4
                            </Text>
                          </View>
                        </View>
                      </>
                    )}
                  </>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRowCompact}>
                <Feather
                  name="globe"
                  size={16}
                  color={theme.primaryBrand}
                  style={{ marginLeft: 6 }}
                />
                <Text style={[styles.sectionTitle, textStyle]}>
                  الروابط الحكومية الرسمية والمصادر
                </Text>
              </View>
              <View
                style={[
                  styles.sourceMetaCard,
                  {
                    borderRightColor: theme.primaryBrand,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
              >
                <Text style={[styles.sourceMetaText, textStyle]}>
                  🏛️ الجهة الرسمية المصدرة للخدمة:{' '}
                  {service.last_source_check ||
                    'وزارة الداخلية العراقية - مديرية الأحوال المدنية والجوازات والإقامة'}
                </Text>
                <Text style={[styles.sourceMetaText, subTextStyle]}>
                  ⏱️ تاريخ آخر تدقيق للتعليمات: {service.last_verified_date || '2026-05-20'}
                </Text>
              </View>
              <View style={styles.linksGrid}>
                {service.online_service_link ? (
                  <TouchableOpacity
                    style={[styles.linkBtn, { backgroundColor: theme.primaryBrand }]}
                    onPress={() => handleOpenLink(service.online_service_link || '')}
                  >
                    <Feather
                      name="external-link"
                      size={16}
                      color={isDarkMode ? theme.background : 'white'}
                    />
                    <Text
                      style={[
                        styles.linkBtnText,
                        { color: isDarkMode ? theme.background : 'white' },
                      ]}
                    >
                      فتح رابط التقديم الإلكتروني المباشر (بوابة أور) 🔗
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.noSourceText, subTextStyle]}>
                    ⚠️ التقديم لهذه الخدمة يتم يدوياً وحضورياً في الدائرة المختصة فقط حالياً.
                  </Text>
                )}
              </View>
            </View>

            {service.citizen_notes && (
              <GlassCard
                borderColor={warningBorder}
                style={[styles.tipsCard, { backgroundColor: warningBg }]}
              >
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <Feather name="alert-triangle" size={16} color={warningColor} />
                  <Text style={[styles.sectionTitle, { color: warningColor }]}>
                    تنبيهات هامة ومخالفات قانونية للمواطن
                  </Text>
                </View>
                <Text style={[styles.tipsText, { color: warningColor }]}>
                  {service.citizen_notes}
                </Text>
                <Text
                  style={[styles.tipsLaw, { color: warningColor, borderTopColor: warningBorder }]}
                >
                  ⚖️ المادة القانونية: يرجى العلم بأن التأخر في التجديد يعرضك للغرامات المالية طبقاً لقوانين جمهورية العراق السارية.
                </Text>
              </GlassCard>
            )}

            <View style={styles.actionGridRow}>
              <TouchableOpacity style={styles.askAiButton} onPress={handleTriggerAI}>
                <LinearGradient
                  colors={[theme.primaryBrand, theme.secondaryAccent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.askAiGrad}
                >
                  <MaterialCommunityIcons
                    name="robot"
                    size={20}
                    color="white"
                    style={{ marginLeft: 8 }}
                  />
                  <Text style={styles.askAiText}>اسأل موسى AI عن تفاصيل أدق لهذه المعاملة 🤖</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={[styles.microDisclaimer, subTextStyle]}>
              إخلاء مسؤولية: هذا الدليل لأغراض إرشادية وتدقيقية فقط مبني على البيانات المفتوحة، ويجب دوماً تأكيد الأوراق والرسوم من الدائرة الرسمية المختصة.
            </Text>

            <View style={{ height: 100 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 16 },
  titleSection: { alignItems: 'flex-end', marginBottom: 16 },
  serviceTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'right' },
  serviceMinistry: { fontSize: 12.5, marginTop: 2, textAlign: 'right' },
  badgeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginTop: 10 },
  trustBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  trustDot: { width: 6, height: 6, borderRadius: 3 },
  trustText: { fontSize: 10.5, fontWeight: 'bold' },
  waitBadge: { fontSize: 11.5 },
  statsCard: { padding: 14, borderRadius: 20, borderWidth: 1, marginBottom: 18 },
  statsGrid: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10.5, fontWeight: 'bold', marginBottom: 4 },
  statVal: { fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  statDivider: { width: 1, height: 28 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 14.5, fontWeight: 'bold' },
  sectionSubtitle: { fontSize: 12, textAlign: 'right', marginTop: 2, marginBottom: 10 },
  docsList: { gap: 8 },
  docItemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  docItemRowActiveDark: {
    backgroundColor: 'rgba(50, 213, 131, 0.04)',
    borderColor: 'rgba(50, 213, 131, 0.18)',
  },
  docItemRowActiveLight: {
    backgroundColor: 'rgba(18, 183, 106, 0.04)',
    borderColor: 'rgba(18, 183, 106, 0.18)',
  },
  docItemText: { fontSize: 13, textAlign: 'right' },
  docItemTextActive: { textDecorationLine: 'line-through' },
  miniAddBtn: { padding: 4, borderRadius: 6 },
  stepsContainer: { gap: 12 },
  stepRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  stepNumberText: { fontSize: 11, fontWeight: 'bold' },
  stepContent: { flex: 1, alignItems: 'flex-end' },
  stepTitleText: { fontSize: 13, fontWeight: 'bold', textAlign: 'right' },
  stepDescText: { fontSize: 11.5, marginTop: 4, lineHeight: 16, textAlign: 'right' },
  linksGrid: { gap: 8 },
  linkBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 40,
    borderRadius: 12,
  },
  linkBtnText: { fontSize: 12.5, fontWeight: 'bold' },
  noSourceText: { fontSize: 12, textAlign: 'right' },
  tipsCard: { padding: 14, gap: 8 },
  tipsText: { fontSize: 12, lineHeight: 18, textAlign: 'right' },
  tipsLaw: { fontSize: 10, textAlign: 'right', borderTopWidth: 1, paddingTop: 6 },
  actionGridRow: { marginVertical: 14 },
  askAiButton: { borderRadius: 14, overflow: 'hidden' },
  askAiGrad: {
    flexDirection: 'row-reverse',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askAiText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
  microDisclaimer: { fontSize: 10, lineHeight: 14, textAlign: 'center', marginTop: 10 },
  sectionHeaderRowCompact: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
    gap: 2,
  },
  sourceMetaCard: {
    borderRightWidth: 3,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    gap: 6,
  },
  sourceMetaText: { fontSize: 12, textAlign: 'right' },
  toggleText: { fontSize: 12.5, fontWeight: 'bold' },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
});
