import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getFullInitialServices } from '../data/servicesData';
import { GlassCard } from '../components/GlassCard';
import { getUpdateLogs, getConfidenceColor } from '../services/verificationService';

export const AdminScreen = ({ onClose }) => {
  // toggleDarkMode / themeConfig are destructured in the original but never used.
  const { theme, isDarkMode, toggleDarkMode, themeConfig } = useTheme();

  const [logs, setLogs] = useState([]);
  const [services, setServices] = useState([]);

  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newMinistry, setNewMinistry] = useState('');
  const [newFees, setNewFees] = useState('');
  const [newDocs, setNewDocs] = useState('');

  useEffect(() => {
    setServices(getFullInitialServices());
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const data = await getUpdateLogs();
    setLogs(data);
  };

  const handleMarkOutdated = (serviceId) => {
    setServices((prev) =>
      prev.map((service) =>
        service.service_id === serviceId
          ? {
              ...service,
              verification_score: 35,
              verification_status: 'local',
              last_verified_date: '2020-01-01',
              citizen_notes:
                'تنبيه: تم وضع علامة على هذه المعلومات بأنها قد تكون قديمة وتحتاج تدقيق عاجل!',
            }
          : service
      )
    );
    Alert.alert(
      'تم',
      'تم وسم المعاملة كبيانات قديمة بنجاح! ستظهر للمواطنين باللون الأحمر مع تنبيه عدم التأكيد.'
    );
  };

  const handleCreateService = () => {
    if (!newName || !newMinistry || !newCategory) {
      Alert.alert('خطأ', 'يرجى تعبئة الحقول الأساسية لإضافة الخدمة');
      return;
    }

    const newService = {
      service_id: `custom_${Math.random().toString(36).substring(7)}`,
      service_name_ar: newName,
      service_name_en: 'Custom Service',
      category: newCategory,
      ministry_name: newMinistry,
      department_name: 'الدائرة العامة المحدثة',
      provider_name: 'مديرية الخدمة الفرعية',
      governorate: 'كل المحافظات',
      district: 'الأقضية والنواحي',
      office_name: `دائرة ${newCategory} المختصة`,
      office_address: 'العراق، المركز الرئيسي',
      latitude: 33.3152,
      longitude: 44.3661,
      google_maps_link: 'https://maps.google.com/?q=33.3152,44.3661',
      phone_number: '07700000000',
      email: 'info@drimad.net',
      official_website: 'https://eservice.ur.gov.iq',
      online_service_link: 'https://eservice.ur.gov.iq',
      booking_required: false,
      application_form: 'استمارة مخصصة',
      required_documents: newDocs ? newDocs.split('،') : ['البطاقة الوطنية الموحدة'],
      optional_documents: [],
      eligibility_conditions: [],
      estimated_fees_iqd: parseInt(newFees) || 0,
      payment_method: 'الدفع عند المراجعة نقداً',
      expected_processing_time: 'من 3 إلى 5 أيام',
      working_days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
      working_hours: '8:00 صباحاً - 1:30 ظهراً',
      citizen_notes: '',
      ai_keywords: [newName, newCategory],
      search_aliases: [newName],
      verification_status: 'official',
      verification_score: 95,
      last_verified_date: new Date().toISOString().split('T')[0],
      last_source_check: new Date().toISOString().split('T')[0],
      internet_required: false,
      fallback_allowed: true,
      source_priority: 'local_database',
      service_status: 'نشط',
      legal_reference: '',
      required_photos: 2,
      appointment_needed: false,
      estimated_wait_days: 2,
      digital_available: true,
      qr_link: '',
      source_url: '',
      office_type: 'حكومي',
      citizen_category: 'المواطنون العراقيون',
      gender_restrictions: 'لا يوجد',
      age_requirements: 'لا يوجد',
      priority_level: 'متوسط',
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
    };

    setServices((prev) => [newService, ...prev]);
    setNewName('');
    setNewCategory('');
    setNewMinistry('');
    setNewFees('');
    setNewDocs('');
    Alert.alert('أضيفت للمعاينة', 'أضيفت الخدمة إلى قائمة هذه الجلسة للمعاينة فقط؛ لا تُحفظ دائماً ولا تظهر لبقية المستخدمين. التعديل الدائم يكون في ملف src/data/servicesData.js.');
  };

  const cardBackground = theme.cardMain;
  const borderColor = theme.border;
  const textPrimaryStyle = { color: theme.textPrimary };
  const textSecondaryStyle = { color: theme.textSecondary };

  const inputStyle = [
    styles.input,
    { color: theme.textPrimary, backgroundColor: theme.backgroundSecondary, borderColor },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: theme.backgroundSecondary }]}
            onPress={onClose}
          >
            <Text style={[styles.closeBtnText, { color: theme.danger }]}>❌ إغلاق اللوحة</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, textPrimaryStyle]}>👑 لوحة الإدارة والتحكم</Text>
        </View>

        <Text style={[styles.subtitle, textSecondaryStyle]}>
          إدارة الخدمات الحكومية، محاكاة تحديثات مصادر الإنترنت والمؤشرات الإحصائية
        </Text>

        <Text style={[styles.sectionTitle, textPrimaryStyle]}>📊 الإحصائيات والمؤشرات العامة</Text>
        <View style={styles.statsRow}>
          <GlassCard borderColor={theme.border} style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <Text style={[styles.statVal, { color: theme.primaryBrand }]}>{services.length}</Text>
            <Text style={[styles.statLabel, textSecondaryStyle]}>إجمالي الخدمات</Text>
          </GlassCard>
          <GlassCard borderColor={theme.border} style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <Text style={[styles.statVal, { color: theme.success }]}>
              {services.filter((s) => s.verification_score >= 95).length}
            </Text>
            <Text style={[styles.statLabel, textSecondaryStyle]}>موثقة رسمياً</Text>
          </GlassCard>
          <GlassCard borderColor={theme.border} style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <Text style={[styles.statVal, { color: theme.danger }]}>
              {services.filter((s) => s.verification_score < 50).length}
            </Text>
            <Text style={[styles.statLabel, textSecondaryStyle]}>قديمة / غير مؤكدة</Text>
          </GlassCard>
        </View>

        <GlassCard borderColor={theme.border} style={[styles.formCard, { backgroundColor: cardBackground }]}>
          <Text style={[styles.sectionTitle, textPrimaryStyle]}>➕ إضافة خدمة حكومية جديدة</Text>
          <View style={styles.form}>
            <TextInput
              placeholder="اسم المعاملة باللغة العربية"
              placeholderTextColor={theme.textMuted}
              style={inputStyle}
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              placeholder="التصنيف (مثلاً: جوازات، عقار، تموينية)"
              placeholderTextColor={theme.textMuted}
              style={inputStyle}
              value={newCategory}
              onChangeText={setNewCategory}
            />
            <TextInput
              placeholder="الوزارة المسؤولة"
              placeholderTextColor={theme.textMuted}
              style={inputStyle}
              value={newMinistry}
              onChangeText={setNewMinistry}
            />
            <TextInput
              placeholder="الرسوم التقديرية بالدينار العراقي"
              placeholderTextColor={theme.textMuted}
              style={inputStyle}
              value={newFees}
              onChangeText={setNewFees}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="المستمسكات المطلوبة (مفصولة بعلامة ،)"
              placeholderTextColor={theme.textMuted}
              style={inputStyle}
              value={newDocs}
              onChangeText={setNewDocs}
            />
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: theme.primaryBrand }]}
              onPress={handleCreateService}
            >
              <Text style={[styles.addBtnText, { color: isDarkMode ? theme.background : 'white' }]}>
                ➕ إضافة للمعاينة في هذه الجلسة
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <GlassCard borderColor={theme.border} style={[styles.formCard, { backgroundColor: cardBackground }]}>
          <Text style={[styles.sectionTitle, textPrimaryStyle]}>🖥️ سجل تحديثات الإنترنت ومطابقة الكاش</Text>
          {logs.length === 0 ? (
            <Text style={[styles.emptyLogsText, textSecondaryStyle]}>
              لا يوجد عمليات زحف أو مقارنة إنترنت مسجلة بعد.
            </Text>
          ) : (
            logs.map((log, index) => (
              <View key={index} style={[styles.logItem, { borderBottomColor: theme.divider }]}>
                <View style={styles.logHeader}>
                  <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
                  <Text
                    style={[
                      styles.logType,
                      { color: log.sourceType === 'official' ? theme.success : theme.primaryBrand },
                    ]}
                  >
                    المصدر: {log.sourceType}
                  </Text>
                </View>
                <Text style={[styles.logText, textPrimaryStyle]}>المعاملة: {log.serviceId}</Text>
                <Text style={[styles.logConflicts, { color: theme.warning }]}>
                  ✓ التغييرات المحلولة: {log.resolvedConflicts.join('، ')}
                </Text>
              </View>
            ))
          )}
        </GlassCard>

        <Text style={[styles.sectionTitle, textPrimaryStyle, { marginTop: 20 }]}>
          📋 التحكم وتعديل صلاحيات الخدمات
        </Text>
        {services.map((service) => (
          <GlassCard
            key={service.service_id}
            borderColor={borderColor}
            style={{ backgroundColor: cardBackground, marginBottom: 8 }}
          >
            <View style={styles.serviceRow}>
              <View style={styles.serviceMeta}>
                <Text style={[styles.serviceName, textPrimaryStyle]}>{service.service_name_ar}</Text>
                <Text style={[styles.serviceSub, textSecondaryStyle]}>
                  {service.ministry_name} - {service.department_name}
                </Text>
                <View
                  style={[
                    styles.trustBadge,
                    { backgroundColor: getConfidenceColor(service.verification_score) },
                  ]}
                >
                  <Text style={styles.trustBadgeText}>درجة الثقة: {service.verification_score}%</Text>
                </View>
              </View>
              {service.verification_score >= 50 && (
                <TouchableOpacity
                  style={[styles.outdateBtn, { borderColor: theme.danger }]}
                  onPress={() => handleMarkOutdated(service.service_id)}
                >
                  <Text style={[styles.outdateBtnText, { color: theme.danger }]}>⚠️ وسم كقديمة</Text>
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>
        ))}

        <View style={{ height: 180 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'right' },
  closeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  closeBtnText: { fontSize: 12, fontWeight: 'bold' },
  subtitle: { fontSize: 11.5, textAlign: 'right', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginBottom: 12 },
  statsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', padding: 12 },
  statVal: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 10, marginTop: 4, textAlign: 'center' },
  formCard: { padding: 14, marginBottom: 14 },
  form: { gap: 10 },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    textAlign: 'right',
  },
  addBtn: { height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  addBtnText: { fontWeight: 'bold', fontSize: 13 },
  emptyLogsText: { fontSize: 12, textAlign: 'center' },
  logItem: { borderBottomWidth: 1, paddingVertical: 8 },
  logHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  logTime: { fontSize: 10, color: 'gray' },
  logType: { fontSize: 10, fontWeight: 'bold' },
  logText: { fontSize: 12, textAlign: 'right', marginTop: 2 },
  logConflicts: { fontSize: 11, textAlign: 'right', marginTop: 2 },
  serviceRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  serviceMeta: { flex: 1, alignItems: 'flex-end' },
  serviceName: { fontSize: 15, fontWeight: 'bold' },
  serviceSub: { fontSize: 11.5, marginTop: 2 },
  trustBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  trustBadgeText: { color: 'black', fontSize: 10, fontWeight: 'bold' },
  outdateBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
  },
  outdateBtnText: { fontSize: 11, fontWeight: 'bold' },
});
