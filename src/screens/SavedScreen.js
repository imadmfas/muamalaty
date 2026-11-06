import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme/ThemeContext';
import { getFullInitialServices } from '../data/servicesData';
import { GlassCard } from '../components/GlassCard';
import { getConfidenceText, getConfidenceColor } from '../services/verificationService';

export const SavedScreen = () => {
  // isDarkMode / toggleDarkMode / themeConfig are destructured in the original but never used.
  const { theme, isDarkMode, toggleDarkMode, themeConfig } = useTheme();
  const { favorites, removeFavorite } = useAppStore();
  const [selectedService, setSelectedService] = useState(null);

  const savedServices = getFullInitialServices().filter((service) =>
    favorites.includes(service.service_id)
  );

  const handleShare = async (service) => {
    try {
      const docsList = service.required_documents
        .map((doc, index) => `${index + 1}. ${doc}`)
        .join('\n');
      const message = `
*تطبيق معاملاتي - دليل المعاملات الحكومية*
الخدمة: ${service.service_name_ar}
الوزارة: ${service.ministry_name} - ${service.department_name}
الرسوم التقريبية: ${service.estimated_fees_iqd.toLocaleString()} دينار عراقي
المستمسكات المطلوبة:
${docsList}

حالة التحقق: ${getConfidenceText(service.verification_score)}
البرنامج إرشادي وليس حكومياً رسمياً.
    `;
      await Share.share({
        message,
        title: service.service_name_ar,
      });
    } catch (error) {
      Alert.alert('خطأ', 'فشل مشاركة البيانات');
    }
  };

  const cardBackground = theme.cardMain;
  const borderColor = theme.border;
  const textPrimaryStyle = { color: theme.textPrimary };
  const textSecondaryStyle = { color: theme.textSecondary };

  if (selectedService) {
    const notesBackground = theme.warning + '14';
    const notesBorder = theme.warning + '33';
    const notesColor = theme.warning;

    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView contentContainerStyle={styles.detailContainer} style={{ flex: 1 }}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: theme.backgroundSecondary, borderColor },
            ]}
            onPress={() => setSelectedService(null)}
          >
            <Text style={[styles.backButtonText, { color: theme.primaryBrand }]}>
              🔙 رجوع للقائمة
            </Text>
          </TouchableOpacity>

          <GlassCard borderColor={borderColor} style={{ backgroundColor: cardBackground }}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.scoreBadge,
                  { backgroundColor: getConfidenceColor(selectedService.verification_score) },
                ]}
              >
                <Text style={styles.scoreBadgeText}>
                  درجة الثقة: {selectedService.verification_score}%
                </Text>
              </View>
              <View style={[styles.offlineBadge, { backgroundColor: theme.danger }]}>
                <Text style={styles.offlineBadgeText}>وضع دون اتصال</Text>
              </View>
            </View>

            <Text style={[styles.serviceTitle, textPrimaryStyle]}>
              📋 {selectedService.service_name_ar}
            </Text>
            <Text style={[styles.serviceMeta, textSecondaryStyle]}>
              🏛️ {selectedService.ministry_name} - {selectedService.department_name}
            </Text>

            <View style={[styles.detailsSection, { borderBottomColor: borderColor }]}>
              <Text style={[styles.sectionHeader, { color: theme.primaryBrand }]}>
                📂 المستمسكات المطلوبة:
              </Text>
              {selectedService.required_documents.map((doc, index) => (
                <Text key={index} style={[styles.docItem, textPrimaryStyle]}>
                  • {doc}
                </Text>
              ))}
            </View>

            <View style={[styles.detailsSection, { borderBottomColor: borderColor }]}>
              <Text style={[styles.sectionHeader, { color: theme.primaryBrand }]}>
                💰 الرسوم المتوقعة:
              </Text>
              <Text style={[styles.feeText, textPrimaryStyle]}>
                {selectedService.estimated_fees_iqd > 0
                  ? `${selectedService.estimated_fees_iqd.toLocaleString()} دينار عراقي`
                  : 'مجانية'}
              </Text>
              <Text style={[styles.paymentMethod, textSecondaryStyle]}>
                💳 {selectedService.payment_method}
              </Text>
            </View>

            <View style={[styles.detailsSection, { borderBottomColor: borderColor }]}>
              <Text style={[styles.sectionHeader, { color: theme.primaryBrand }]}>
                🏢 مكان التقديم والدائرة المختصة:
              </Text>
              <Text style={[styles.officeName, textPrimaryStyle]}>
                📍 {selectedService.office_name}
              </Text>
              <Text style={[styles.officeAddress, textPrimaryStyle]}>
                {selectedService.office_address}
              </Text>
              <Text style={[styles.workingHours, textPrimaryStyle]}>
                🕒 أيام العمل: {selectedService.working_days.join('، ')} (
                {selectedService.working_hours})
              </Text>
            </View>

            {selectedService.citizen_notes && (
              <View
                style={[
                  styles.notesBox,
                  { backgroundColor: notesBackground, borderColor: notesBorder },
                ]}
              >
                <Text style={[styles.notesTitle, { color: notesColor }]}>
                  💡 ملاحظات وتنبيهات هامة للمواطن:
                </Text>
                <Text style={[styles.notesText, { color: notesColor }]}>
                  {selectedService.citizen_notes}
                </Text>
              </View>
            )}

            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.border,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => handleShare(selectedService)}
              >
                <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>
                  📤 مشاركة
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.danger }]}
                onPress={() => {
                  removeFavorite(selectedService.service_id);
                  setSelectedService(null);
                  Alert.alert('تم', 'أزيلت المعاملة من المفضلة');
                }}
              >
                <Text style={styles.actionBtnText}>🗑️ إزالة</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.headerTitle, textPrimaryStyle]}>⭐ المعاملات المحفوظة</Text>
      <Text style={[styles.subtitle, textSecondaryStyle]}>
        الوصول السريع للمستمسكات والإجراءات بدون إنترنت
      </Text>

      {savedServices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={[styles.emptyText, textPrimaryStyle]}>
            لا توجد معاملات محفوظة حالياً عيني.
          </Text>
          <Text style={[styles.emptySubText, textSecondaryStyle]}>
            تقدر تحفظ أي معاملة تبحث عنها من خلال زر الحفظ المتاح بشاشة المحادثة لتصل إليها هنا بدون اتصال بالإنترنت.
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedServices}
          keyExtractor={(item) => item.service_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedService(item)}>
              <GlassCard
                borderColor={borderColor}
                style={[styles.savedCard, { backgroundColor: cardBackground }]}
              >
                <View style={styles.savedCardHeader}>
                  <Text style={[styles.savedCardTitle, textPrimaryStyle]}>
                    {item.service_name_ar}
                  </Text>
                  <Text style={styles.savedCardIcon}>📋</Text>
                </View>
                <Text style={[styles.savedCardMeta, textSecondaryStyle]}>
                  🏛️ {item.ministry_name} - {item.department_name}
                </Text>
                <View style={[styles.savedCardFooter, { borderTopColor: borderColor }]}>
                  <Text style={[styles.savedCardAction, { color: theme.primaryBrand }]}>
                    تفاصيل المعاملة 🔍
                  </Text>
                  <Text style={[styles.savedCardFee, { color: theme.success }]}>
                    🪙{' '}
                    {item.estimated_fees_iqd > 0
                      ? `${item.estimated_fees_iqd.toLocaleString()} د.ع`
                      : 'مجاني'}
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 24 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'right' },
  subtitle: { fontSize: 12, textAlign: 'right', marginTop: 2, marginBottom: 16 },
  listContent: { paddingBottom: 180 },
  savedCard: { marginBottom: 8 },
  savedCardHeader: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
  savedCardTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'right', flex: 1 },
  savedCardIcon: { fontSize: 20 },
  savedCardMeta: { fontSize: 11, textAlign: 'right', marginTop: 4 },
  savedCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  savedCardAction: { fontSize: 12, fontWeight: 'bold' },
  savedCardFee: { fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, marginTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16, opacity: 0.6 },
  emptyText: { fontSize: 18, fontWeight: 'bold' },
  emptySubText: { fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  detailContainer: { padding: 16, paddingTop: 24, paddingBottom: 180 },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  backButtonText: { fontSize: 13, fontWeight: 'bold' },
  badgeRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 10 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  scoreBadgeText: { color: 'black', fontSize: 11, fontWeight: 'bold' },
  offlineBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  offlineBadgeText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  serviceTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'right' },
  serviceMeta: { fontSize: 12.5, textAlign: 'right', marginTop: 2, marginBottom: 16 },
  detailsSection: { marginTop: 12, borderBottomWidth: 1, paddingBottom: 10 },
  sectionHeader: { fontSize: 13.5, fontWeight: 'bold', textAlign: 'right', marginBottom: 6 },
  docItem: { fontSize: 13, textAlign: 'right', marginBottom: 4 },
  feeText: { fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
  paymentMethod: { fontSize: 12, textAlign: 'right', marginTop: 2 },
  officeName: { fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
  officeAddress: { fontSize: 12.5, textAlign: 'right', marginTop: 2 },
  workingHours: { fontSize: 11.5, textAlign: 'right', marginTop: 2 },
  notesBox: { borderRadius: 12, padding: 10, marginTop: 12, borderWidth: 1 },
  notesTitle: { fontSize: 13, fontWeight: 'bold', textAlign: 'right' },
  notesText: { fontSize: 12, textAlign: 'right', marginTop: 4, lineHeight: 18 },
  cardActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 8 },
  actionBtn: { flex: 1, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  actionBtnText: { fontSize: 14, fontWeight: 'bold' },
});
