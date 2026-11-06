import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme/ThemeContext';
import * as securityService from '../services/securityService';
import { GlassCard } from '../components/GlassCard';
import { PinPromptModal } from '../components/PinPromptModal';

export const SettingsScreen = ({ onOpenAdmin }) => {
  // themeConfig is destructured in the original but never used.
  const { theme, isDarkMode, toggleDarkMode, themeConfig } = useTheme();
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    pinLockEnabled,
    biometricLockEnabled,
    setSecurityEnabled,
    clearAllData,
  } = useAppStore();

  const [pinDialog, setPinDialog] = useState(null); // 'create' | 'verify' | null
  const [bioAvailable, setBioAvailable] = useState(false);
  useEffect(() => {
    securityService.isBiometricAvailable().then(setBioAvailable);
  }, []);

  const cardBackground = theme.cardMain;
  const borderColor = theme.border;
  const textPrimaryStyle = { color: theme.textPrimary };
  const textSecondaryStyle = { color: theme.textSecondary };

  const handleBiometricToggle = async (value) => {
    if (value) {
      // v1.1.0: the PIN is the fallback for the fingerprint lock, so one must exist first.
      if (!(await securityService.hasPIN())) {
        Alert.alert('أنشئ رمز PIN أولاً', 'فعّل القفل برمز PIN أولاً ليكون بديلاً عند تعذر قراءة البصمة.');
        return;
      }
      const success = await securityService.authenticateBiometric();
      if (success) {
        await setSecurityEnabled(pinLockEnabled, true);
        Alert.alert('نجاح', 'تم تفعيل حماية البصمة/الوجه للتطبيق بنجاح! 🔒');
      } else {
        Alert.alert('فشل التفعيل', 'لم نتمكن من التحقق من البصمة البيومترية لجهازك.');
      }
    } else {
      const ok = await securityService.authenticateBiometric();
      if (ok) await setSecurityEnabled(pinLockEnabled, false);
      else setPinDialog('verify-bio');
    }
  };

  // v1.1.0: switching the lock on asks the user to choose a PIN; switching it off
  // asks for the current PIN (v1.0.0 used a hard-coded "1234" and asked nothing).
  const handlePinToggle = async (value) => {
    setPinDialog(value ? 'create' : 'verify');
  };

  const onPinDone = async (pin) => {
    if (pinDialog === 'create') {
      await securityService.savePIN(pin);
      await setSecurityEnabled(true, biometricLockEnabled);
      setPinDialog(null);
      Alert.alert('تم تفعيل القفل', 'سيُطلب رمز الـ PIN عند كل فتح للتطبيق. احفظ الرمز في مكان آمن.');
      return true;
    }
    const ok = await securityService.verifyPIN(pin);
    if (!ok) return false;
    if (pinDialog === 'verify-bio') {
      await setSecurityEnabled(pinLockEnabled, false);
    } else {
      await securityService.deletePIN();
      await setSecurityEnabled(false, false);
    }
    setPinDialog(null);
    return true;
  };

  const openDeveloperEmail = () => {
    Linking.openURL('mailto:info@drimad.net?subject=' + encodeURIComponent('تطبيق معاملاتي'));
  };

  const handleResetData = () => {
    Alert.alert(
      'حذف الحساب وكافة البيانات ⚠️',
      'هل أنت متأكد من مسح جميع بياناتك المشفرة ومستمسكات العائلة والعمليات المفضلة بشكل نهائي من هذا الجهاز؟ لا يمكن استرجاع البيانات بعد الحذف.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، احذف كل شيء',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('تم الحذف', 'تم مسح كافة البيانات والكاش وإعادة ضبط التطبيق بنجاح.');
          },
        },
      ]
    );
  };

  const sectionTitleStyle = [styles.sectionTitle, textPrimaryStyle, { borderBottomColor: theme.divider }];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.headerTitle, textPrimaryStyle]}>⚙️ الإعدادات والضبط</Text>
        <Text style={[styles.subtitle, textSecondaryStyle]}>
          تخصيص تجربة التطبيق وإدارة التنبيهات والأمان العتادي
        </Text>

        <GlassCard borderColor={borderColor} style={{ backgroundColor: cardBackground, marginBottom: 12 }}>
          <Text style={sectionTitleStyle}>المظهر وتخصيص النظام</Text>
          <View style={[styles.settingRow, { borderBottomColor: theme.divider }]}>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: theme.textMuted, true: theme.primaryBrand }}
              thumbColor={isDarkMode ? theme.primaryBrand : theme.cardElevated}
            />
            <Text style={[styles.settingLabel, textPrimaryStyle]}>الوضع الداكن (Dark Mode)</Text>
          </View>
          <View style={[styles.settingRow, { borderBottomColor: 'transparent' }]}>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.textMuted, true: theme.primaryBrand }}
              thumbColor={notificationsEnabled ? theme.primaryBrand : theme.cardElevated}
            />
            <Text style={[styles.settingLabel, textPrimaryStyle]}>إشعارات التذكير التلقائية</Text>
          </View>
        </GlassCard>

        <GlassCard borderColor={borderColor} style={{ backgroundColor: cardBackground, marginBottom: 12 }}>
          <Text style={sectionTitleStyle}>🔒 الحماية والأمن العتادي</Text>
          <View style={[styles.settingRow, { borderBottomColor: theme.divider }]}>
            <Switch
              value={biometricLockEnabled}
              disabled={!bioAvailable && !biometricLockEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: theme.textMuted, true: theme.primaryBrand }}
              thumbColor={biometricLockEnabled ? theme.primaryBrand : theme.cardElevated}
            />
            <View style={styles.settingMeta}>
              <Text style={[styles.settingLabel, textPrimaryStyle]}>القفل البيومتري (البصمة/الوجه)</Text>
              <Text style={[styles.settingSub, textSecondaryStyle]}>
                {bioAvailable ? 'تأمين الدخول بحماية الجوال البيومترية' : 'غير متاح على هذا الجهاز أو في نسخة المتصفح'}
              </Text>
            </View>
          </View>
          <View style={[styles.settingRow, { borderBottomColor: 'transparent' }]}>
            <Switch
              value={pinLockEnabled}
              onValueChange={handlePinToggle}
              trackColor={{ false: theme.textMuted, true: theme.primaryBrand }}
              thumbColor={pinLockEnabled ? theme.primaryBrand : theme.cardElevated}
            />
            <View style={styles.settingMeta}>
              <Text style={[styles.settingLabel, textPrimaryStyle]}>القفل برمز PIN</Text>
              <Text style={[styles.settingSub, textSecondaryStyle]}>
                {pinLockEnabled ? 'مفعّل — يُطلب الرمز عند فتح التطبيق' : 'اختر رمزاً من 4 أرقام لحماية بياناتك'}
              </Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard borderColor={borderColor} style={{ backgroundColor: cardBackground, marginBottom: 12 }}>
          <Text style={sectionTitleStyle}>{'👨‍💻 معلومات المطور والناشر'}</Text>
          <View style={styles.devContainer}>
            <Text style={[styles.devLabel, textPrimaryStyle]}>الجهة المطورة والمسؤولة:</Text>
            <Text style={[styles.devValue, { color: theme.primaryBrand }]}>البروفيسور عماد محمد فرحان</Text>
            <Text style={[styles.devLabel, textPrimaryStyle, { marginTop: 12 }]}>
              البريد الإلكتروني للدعم والاستفسار:
            </Text>
            <TouchableOpacity onPress={openDeveloperEmail}>
              <Text style={[styles.devEmail, { color: theme.primaryBrand }]}>info@drimad.net</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <GlassCard borderColor={borderColor} style={{ backgroundColor: cardBackground, marginBottom: 12 }}>
          <Text style={sectionTitleStyle}>📄 الشروط والخصوصية</Text>
          <View style={styles.legalSection}>
            <Text style={[styles.legalTitle, textPrimaryStyle]}>سياسة سلامة وحماية البيانات:</Text>
            <Text style={[styles.legalText, textSecondaryStyle]}>
              يلتزم التطبيق بحفظ وتأمين كافة المستندات والبيانات الشخصية محلياً على ذاكرة جهازك بشكل مشفر بالكامل ولا نقوم بنقل أو مشاركة أي بيانات حساسة مع مخدمات خارجية.
            </Text>
            <Text style={[styles.legalTitle, textPrimaryStyle, { marginTop: 12 }]}>شروط وأحكام الاستخدام:</Text>
            <Text style={[styles.legalText, textSecondaryStyle]}>
              المعلومات المقدمة في هذا التطبيق إرشادية وتدقيقية مبنية على قنوات ومصادر حكومية عراقية مفتوحة لتبسيط الروتين الإداري، ويجب دوماً تأكيد الأوراق والرسوم النهائية من الدائرة الحكومية المعنية.
            </Text>
          </View>
        </GlassCard>

        <GlassCard borderColor={theme.border} style={{ backgroundColor: cardBackground, marginBottom: 12 }}>
          <Text style={sectionTitleStyle}>🛠️ لوحة التطوير والمحاكاة</Text>
          <Text style={[styles.legalText, textSecondaryStyle]}>
            هذا الخيار متاح لأغراض المراجعة والتحقق، ويتيح لك إدارة وتعديل الخدمات ديناميكياً.
          </Text>
          <TouchableOpacity style={styles.adminBtn} onPress={onOpenAdmin}>
            <LinearGradient
              colors={[theme.primaryBrand, theme.secondaryAccent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.adminBtnGrad}
            >
              <Text style={[styles.adminBtnText, { color: isDarkMode ? theme.background : 'white' }]}>
                📂 الدخول إلى لوحة إدارة الخدمات (Admin Mode)
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </GlassCard>

        <TouchableOpacity style={[styles.resetBtn, { borderColor: theme.danger }]} onPress={handleResetData}>
          <Text style={[styles.resetBtnText, { color: theme.danger }]}>
            🗑️ إعادة ضبط التطبيق بالكامل (حذف الحساب)
          </Text>
        </TouchableOpacity>

        <View style={{ height: 180 }} />
      </ScrollView>
      <PinPromptModal
        visible={!!pinDialog}
        mode={pinDialog === 'create' ? 'create' : 'verify'}
        title={pinDialog === 'create' ? 'إنشاء رمز PIN' : 'تأكيد الهوية'}
        onCancel={() => setPinDialog(null)}
        onDone={onPinDone}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 24 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'right' },
  subtitle: { fontSize: 12, textAlign: 'right', marginTop: 2, marginBottom: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 12,
    borderBottomWidth: 1,
    paddingBottom: 6,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  settingMeta: { flex: 1, alignItems: 'flex-end', marginLeft: 12 },
  settingLabel: { fontSize: 14.5, textAlign: 'right', fontWeight: 'bold' },
  settingSub: { fontSize: 11, textAlign: 'right', marginTop: 2 },
  devContainer: { paddingVertical: 4 },
  devLabel: { fontSize: 13.5, textAlign: 'right' },
  devValue: { fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginTop: 4 },
  devEmail: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  legalSection: { paddingVertical: 4 },
  legalTitle: { fontSize: 13.5, fontWeight: 'bold', textAlign: 'right' },
  legalText: { fontSize: 12, textAlign: 'right', marginTop: 4, lineHeight: 18 },
  adminBtn: { borderRadius: 10, overflow: 'hidden', marginTop: 12 },
  adminBtnGrad: { height: 40, justifyContent: 'center', alignItems: 'center' },
  adminBtnText: { fontWeight: 'bold', fontSize: 12 },
  resetBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  resetBtnText: { fontWeight: 'bold', fontSize: 13.5 },
});
