// Reconstructed from Hermes bytecode — Metro module 735 (FamilyScreen)
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme/ThemeContext';
import * as securityService from '../services/securityService';
import { GlassCard } from '../components/GlassCard';
import { DatePicker } from '../components/DatePicker';

const DISEASE_TYPES = ['ضغط', 'قلب', 'سكر', 'كولسترول', 'أخرى'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const RELATIONSHIPS = ['زوجة', 'زوج', 'ابن', 'بنت', 'أب', 'أم'];

export const FamilyScreen = () => {
  // eslint-disable-next-line no-unused-vars
  const { theme, isDarkMode, toggleDarkMode, themeConfig } = useTheme();
  const {
    familyHead,
    familyMembers,
    saveFamilyHead,
    addFamilyMember,
    removeFamilyMember,
    drivingLicenseExpiry,
    vehicleAnnualExpiry,
    rationCardUpdate,
    saveExpiries,
    biometricLockEnabled,
    setSecurityEnabled,
    chronicMedications,
    addChronicMedication,
    removeChronicMedication,
  } = useAppStore();

  // ---- Family head form ----
  const [headName, setHeadName] = useState(familyHead?.name || '');
  const [headBirthDate, setHeadBirthDate] = useState(familyHead?.birthDate || '');
  const [headNidNumber, setHeadNidNumber] = useState(familyHead?.nidNumber || '');
  const [headNidExpiry, setHeadNidExpiry] = useState(familyHead?.nidExpiryDate || '');
  const [headPassportNumber, setHeadPassportNumber] = useState(familyHead?.passportNumber || '');
  const [headPassportExpiry, setHeadPassportExpiry] = useState(familyHead?.passportExpiryDate || '');
  const [headHousingNumber, setHeadHousingNumber] = useState(familyHead?.housingNumber || '');
  const [headHousingExpiry, setHeadHousingExpiry] = useState(familyHead?.housingExpiryDate || '');

  // ---- Extra expiries ----
  const [drivingExpiry, setDrivingExpiry] = useState(drivingLicenseExpiry || '');
  const [vehicleExpiry, setVehicleExpiry] = useState(vehicleAnnualExpiry || '');
  const [rationExpiry, setRationExpiry] = useState(rationCardUpdate || '');

  // ---- Add member modal ----
  const [showAddModal, setShowAddModal] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRelationship, setMemberRelationship] = useState('ابن');
  const [memberBirthDate, setMemberBirthDate] = useState('');
  const [memberNidExpiry, setMemberNidExpiry] = useState('');
  const [memberPassportExpiry, setMemberPassportExpiry] = useState('');

  const [isEditingHead, setIsEditingHead] = useState(!familyHead);

  // ---- Chronic medications ----
  const [showMedForm, setShowMedForm] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDisease, setMedDisease] = useState('ضغط');
  const [medHour, setMedHour] = useState('8');
  const [medMinute, setMedMinute] = useState('00');
  const [medAmPm, setMedAmPm] = useState('AM');

  // Body was inlined by the Hermes compiler at its single call site; rebuilt from that inlined code.
  const formatMedTime = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const period = hour >= 12 ? 'مساءً' : 'صباحاً';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${period}`;
  };

  // Body was inlined by the Hermes compiler at its single call site; rebuilt from that inlined code.
  const getAgeInYears = (birthDate) => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age = age - 1;
    }
    return age;
  };

  const textPrimaryStyle = { color: theme.textPrimary };
  const textSecondaryStyle = { color: theme.textSecondary };
  const borderColor = theme.border;
  const cardMain = theme.cardMain;
  const shieldBg = isDarkMode ? 'rgba(50, 213, 131, 0.04)' : 'rgba(18, 183, 106, 0.04)';
  const successColor = theme.success;
  const shieldBorder = isDarkMode ? 'rgba(50, 213, 131, 0.18)' : 'rgba(18, 183, 106, 0.18)';
  const warningColor = theme.warning;

  const handleToggleBiometrics = async () => {
    if (biometricLockEnabled) {
      if (!(await securityService.authenticateBiometric())) {
        Alert.alert('تعذر التحقق', 'لإلغاء القفل البيومتري أكّد هويتك بالبصمة، أو ألغِه من الإعدادات برمز الـ PIN.');
        return;
      }
      await securityService.setBiometricEnabled(false);
      await setSecurityEnabled(useAppStore.getState().pinLockEnabled, false);
      Alert.alert('تم الإلغاء', 'تم إلغاء القفل البيومتري لبيانات العائلة.');
    } else {
      if (!(await securityService.isBiometricAvailable())) {
        Alert.alert('غير متاح', 'البصمة غير متاحة على هذا الجهاز أو في نسخة المتصفح. يمكنك حماية بياناتك برمز PIN من الإعدادات.');
        return;
      }
      if (!(await securityService.hasPIN())) {
        Alert.alert('أنشئ رمز PIN أولاً', 'فعّل القفل برمز PIN من الإعدادات أولاً ليكون بديلاً عند تعذر قراءة البصمة.');
        return;
      }
      const success = await securityService.authenticateBiometric();
      if (!success) {
        Alert.alert('فشل التفعيل', 'لم نتمكن من تأكيد الهوية البيومترية لجهازك.');
        return;
      }
      await securityService.setBiometricEnabled(true);
      await setSecurityEnabled(useAppStore.getState().pinLockEnabled, true);
      Alert.alert('نجاح', 'تم تفعيل القفل البيومتري (البصمة/الوجه) لحماية مستمسكاتك بنجاح! 🔒');
    }
  };

  const handleSaveHead = async () => {
    if (!headName || !headBirthDate || !headNidExpiry || !headPassportExpiry || !headHousingExpiry) {
      return Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة لرب العائلة');
    }
    await saveFamilyHead({
      name: headName,
      birthDate: headBirthDate,
      // v1.1.0: no more fake placeholder numbers/dates saved as if they were real data.
      nidNumber: headNidNumber.trim(),
      nidIssueDate: familyHead?.nidIssueDate || '',
      nidExpiryDate: headNidExpiry,
      passportNumber: headPassportNumber.trim(),
      passportIssueDate: familyHead?.passportIssueDate || '',
      passportExpiryDate: headPassportExpiry,
      housingNumber: headHousingNumber.trim(),
      housingIssueDate: familyHead?.housingIssueDate || '',
      housingExpiryDate: headHousingExpiry,
    });
    setIsEditingHead(false);
    return Alert.alert('نجاح', 'تم حفظ وتشفير مستمسكات رب العائلة بنجاح! وجاري إعداد التنبيهات الذكية.');
  };

  const handleAddMedication = async () => {
    if (!medName.trim()) {
      return Alert.alert('خطأ', 'يرجى كتابة اسم العلاج');
    }
    const hourNum = parseInt(medHour);
    let hour24;
    if (medAmPm === 'PM' && hourNum < 12) {
      hour24 = hourNum + 12;
    } else if (medAmPm === 'AM' && hourNum === 12) {
      hour24 = 0;
    } else {
      hour24 = hourNum;
    }
    const time = `${hour24.toString().padStart(2, '0')}:${medMinute.padStart(2, '0')}`;
    await addChronicMedication(medName.trim(), medDisease, time);
    setMedName('');
    setShowMedForm(false);
    return Alert.alert(
      'نجاح',
      'تمت إضافة العلاج وجدولة تذكيرين تلقائيين: الأول قبل الموعد بـ 10 دقائق، والثاني عند الموعد تماماً! 💊'
    );
  };

  const handleSaveExpiries = async () => {
    await saveExpiries(drivingExpiry || null, vehicleExpiry || null, rationExpiry || null);
    return Alert.alert('نجاح', 'تم حفظ تواريخ التنبيهات بنجاح!');
  };

  const handleAddMember = async () => {
    if (!memberName || !memberBirthDate || !memberNidExpiry || !memberPassportExpiry) {
      return Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة للفرد');
    }
    await addFamilyMember({
      id: Math.random().toString(),
      name: memberName,
      relationship: memberRelationship,
      birthDate: memberBirthDate,
      nidExpiryDate: memberNidExpiry,
      passportExpiryDate: memberPassportExpiry,
    });
    setMemberName('');
    setMemberBirthDate('');
    setMemberNidExpiry('');
    setMemberPassportExpiry('');
    setShowAddModal(false);
    return Alert.alert('نجاح', 'تمت إضافة فرد العائلة وتأمين مستمسكاته بنجاح!');
  };

  const inputThemeStyle = {
    color: theme.textPrimary,
    backgroundColor: theme.cardSoftTint,
    borderColor: theme.border,
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.headerTitle, textPrimaryStyle]}>🗃️ مستمسكاتي وعائلتي</Text>
        <Text style={[styles.subtitle, textSecondaryStyle]}>
          إدارة آمنة ومشفرة بالكامل لبيانات العائلة وتنبيهات انتهاء الصلاحية
        </Text>

        {/* Hardware-encryption banner */}
        <GlassCard borderColor={shieldBorder} style={[styles.shieldBanner, { backgroundColor: shieldBg }]}>
          <View style={styles.bannerTitleRow}>
            <Feather name="shield" size={18} color={successColor} style={{ marginLeft: 6 }} />
            <Text style={[styles.shieldTitle, { color: successColor }]}>تشفير عتادي وتأمين كامل 🔒</Text>
          </View>
          <Text style={[styles.shieldText, { color: successColor }]}>
            جميع بيانات العائلة ومستمسكاتهم مشفرة محلياً على جهازك باستخدام تشفير عتادي آمن تماماً داخل الهاتف. لا يتم مشاركة أي بيانات حساسة خارج جهازك لضمان السرية المطلقة.
          </Text>
        </GlassCard>

        {/* Biometric lock */}
        <GlassCard borderColor={borderColor} style={{ backgroundColor: cardMain }}>
          <View style={styles.settingRow}>
            <TouchableOpacity
              style={[
                styles.bioBtn,
                biometricLockEnabled && {
                  backgroundColor: theme.primaryBrand + '1F',
                  borderColor: theme.primaryBrand,
                },
                { borderColor: theme.border },
              ]}
              onPress={handleToggleBiometrics}
            >
              <Text style={[styles.bioBtnText, biometricLockEnabled && { color: theme.primaryBrand }]}>
                {biometricLockEnabled ? '🔒 قفل بيومتري مفعل' : '⬜ تفعيل القفل'}
              </Text>
            </TouchableOpacity>
            <View style={styles.settingMeta}>
              <Text style={[styles.settingLabel, textPrimaryStyle]}>حماية المستمسكات بالبصمة / الوجه</Text>
              <Text style={[styles.settingSub, textSecondaryStyle]}>قفل شاشة البيانات بمستشعر البصمة الحيوي للجوال</Text>
            </View>
          </View>
        </GlassCard>

        {/* Family head */}
        <GlassCard borderColor={theme.border} style={{ backgroundColor: cardMain, marginTop: 12 }}>
          <View style={styles.sectionHeaderRow}>
            {familyHead && (
              <TouchableOpacity onPress={() => setIsEditingHead(!isEditingHead)}>
                <Text style={[styles.editText, { color: theme.primaryBrand }]}>
                  {isEditingHead ? 'إلغاء' : '✏️ تعديل البيانات'}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.sectionTitle, textPrimaryStyle]}>بيانات رب العائلة (الأساسي)</Text>
          </View>

          {isEditingHead ? (
            <View style={styles.form}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, textPrimaryStyle]}>الاسم الكامل لرب العائلة:</Text>
                <TextInput
                  style={[styles.input, inputThemeStyle]}
                  value={headName}
                  onChangeText={setHeadName}
                  placeholder="مثال: عماد محمد فرحان"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <DatePicker
                label="تاريخ الميلاد:"
                value={headBirthDate}
                onChange={setHeadBirthDate}
                placeholder="اختر تاريخ ميلاد رب العائلة"
              />
              <View style={styles.formGroup}>
                <Text style={[styles.label, textPrimaryStyle]}>رقم البطاقة الوطنية الموحدة (اختياري):</Text>
                <TextInput
                  style={[styles.input, inputThemeStyle]}
                  value={headNidNumber}
                  onChangeText={setHeadNidNumber}
                  placeholder="مثال: 199012345678"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <DatePicker
                label="تاريخ انتهاء البطاقة الوطنية:"
                value={headNidExpiry}
                onChange={setHeadNidExpiry}
                placeholder="اختر تاريخ انتهاء البطاقة الوطنية"
              />
              <View style={styles.formGroup}>
                <Text style={[styles.label, textPrimaryStyle]}>رقم جواز السفر (اختياري):</Text>
                <TextInput
                  style={[styles.input, inputThemeStyle]}
                  value={headPassportNumber}
                  onChangeText={setHeadPassportNumber}
                  placeholder="مثال: A12345678"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="characters"
                />
              </View>
              <DatePicker
                label="تاريخ انتهاء جواز السفر العراقي:"
                value={headPassportExpiry}
                onChange={setHeadPassportExpiry}
                placeholder="اختر تاريخ انتهاء جواز السفر"
              />
              <View style={styles.formGroup}>
                <Text style={[styles.label, textPrimaryStyle]}>رقم بطاقة السكن (اختياري):</Text>
                <TextInput
                  style={[styles.input, inputThemeStyle]}
                  value={headHousingNumber}
                  onChangeText={setHeadHousingNumber}
                  placeholder="مثال: 123456"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                />
              </View>
              <DatePicker
                label="تاريخ انتهاء بطاقة السكن العائلية:"
                value={headHousingExpiry}
                onChange={setHeadHousingExpiry}
                placeholder="اختر تاريخ انتهاء بطاقة السكن"
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveHead}>
                <LinearGradient
                  colors={[theme.primaryBrand, theme.secondaryAccent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveBtnGrad}
                >
                  <Text style={styles.saveBtnText}>💾 حفظ وتأمين مستمسكاتك</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            familyHead && (
              <View style={styles.headDetails}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name="account-tie" size={24} color={theme.primaryBrand} />
                  <Text style={[styles.detailsName, textPrimaryStyle]}>{familyHead.name}</Text>
                </View>
                <Text style={[styles.detailsSub, textSecondaryStyle]}>🎂 المواليد: {familyHead.birthDate}</Text>
                <View style={[styles.detailDivider, { backgroundColor: theme.divider }]} />
                <View style={styles.expiryRow}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                    <FontAwesome5 name="id-card" size={14} color={theme.success} />
                    <Text style={[styles.expiryLabel, textPrimaryStyle]}>البطاقة الوطنية الموحدة:</Text>
                  </View>
                  <Text style={[styles.expiryValue, { color: warningColor }]}>تنتهي: {familyHead.nidExpiryDate}</Text>
                </View>
                <View style={styles.expiryRow}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="passport" size={16} color={theme.primaryBrand} />
                    <Text style={[styles.expiryLabel, textPrimaryStyle]}>جواز السفر العراقي:</Text>
                  </View>
                  <Text style={[styles.expiryValue, { color: warningColor }]}>ينتهي: {familyHead.passportExpiryDate}</Text>
                </View>
                <View style={styles.expiryRow}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="home-outline" size={15} color={theme.warning} />
                    <Text style={[styles.expiryLabel, textPrimaryStyle]}>بطاقة السكن العائلية:</Text>
                  </View>
                  <Text style={[styles.expiryValue, { color: warningColor }]}>تنتهي: {familyHead.housingExpiryDate}</Text>
                </View>
              </View>
            )
          )}
        </GlassCard>

        {/* Chronic diseases & medications */}
        <GlassCard borderColor={theme.border} style={{ backgroundColor: cardMain, marginTop: 12 }}>
          <View style={styles.sectionHeaderRow}>
            <TouchableOpacity onPress={() => setShowMedForm(!showMedForm)}>
              <Text style={[styles.editText, { color: theme.primaryBrand }]}>
                {showMedForm ? 'إلغاء' : '➕ إضافة علاج'}
              </Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="pill" size={20} color={theme.primaryBrand} />
              <Text style={[styles.sectionTitle, textPrimaryStyle, { marginBottom: 0 }]}>الأمراض المزمنة والأدوية</Text>
            </View>
          </View>
          <Text style={[styles.sectionCardSub, textSecondaryStyle]}>
            التذكير بجرعات الأدوية للمشترك وعائلته. يقوم التطبيق بالتذكير مرتين: الأولى قبل الموعد بـ 10 دقائق، والثانية في الموعد تماماً.
          </Text>

          {showMedForm && (
            <View style={[styles.form, { marginBottom: 12 }]}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, textPrimaryStyle]}>اسم العلاج:</Text>
                <TextInput
                  style={[styles.input, inputThemeStyle]}
                  value={medName}
                  onChangeText={setMedName}
                  placeholder="مثال: ضغط، قلب، سكر، إلخ"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, textPrimaryStyle]}>نوع المرض المزمن:</Text>
                <View style={styles.relationshipSelectRow}>
                  {DISEASE_TYPES.map((item) => {
                    const selected = medDisease === item;
                    return (
                      <TouchableOpacity
                        key={item}
                        style={[styles.relationshipSelectChip, selected && { backgroundColor: theme.primaryBrand }]}
                        onPress={() => setMedDisease(item)}
                      >
                        <Text style={[styles.relSelectText, selected && { color: 'white', fontWeight: 'bold' }]}>{item}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, textPrimaryStyle]}>وقت أخذ العلاج:</Text>
                <View style={styles.timeSelectRow}>
                  {/* AM / PM */}
                  <View style={styles.timePartColumn}>
                    <TouchableOpacity
                      style={[styles.ampmBtn, medAmPm === 'AM' && { backgroundColor: theme.primaryBrand }]}
                      onPress={() => setMedAmPm('AM')}
                    >
                      <Text style={[styles.ampmText, medAmPm === 'AM' && { color: 'white' }]}>صباحاً</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.ampmBtn, medAmPm === 'PM' && { backgroundColor: theme.primaryBrand }]}
                      onPress={() => setMedAmPm('PM')}
                    >
                      <Text style={[styles.ampmText, medAmPm === 'PM' && { color: 'white' }]}>مساءً</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Minute */}
                  <View style={styles.timePartColumn}>
                    <Text style={[styles.timeLabel, textSecondaryStyle]}>الدقيقة</Text>
                    <ScrollView style={styles.timeScroll} nestedScrollEnabled={true}>
                      {MINUTES.map((m) => {
                        const selected = medMinute === m;
                        return (
                          <TouchableOpacity
                            key={m}
                            style={[styles.timeItem, selected && { backgroundColor: theme.primaryBrand }]}
                            onPress={() => setMedMinute(m)}
                          >
                            <Text style={[styles.timeItemText, textPrimaryStyle, selected && { color: 'white' }]}>{m}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Hour */}
                  <View style={styles.timePartColumn}>
                    <Text style={[styles.timeLabel, textSecondaryStyle]}>الساعة</Text>
                    <ScrollView style={styles.timeScroll} nestedScrollEnabled={true}>
                      {HOURS.map((h) => {
                        const selected = medHour === h;
                        return (
                          <TouchableOpacity
                            key={h}
                            style={[styles.timeItem, selected && { backgroundColor: theme.primaryBrand }]}
                            onPress={() => setMedHour(h)}
                          >
                            <Text style={[styles.timeItemText, textPrimaryStyle, selected && { color: 'white' }]}>{h}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddMedication}>
                <LinearGradient
                  colors={[theme.primaryBrand, theme.secondaryAccent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveBtnGrad}
                >
                  <Text style={styles.saveBtnText}>🔔 حفظ وجدولة تذكير العلاج</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {chronicMedications.length !== 0 ? (
            <View style={styles.medsList}>
              {chronicMedications.map((med) => (
                <View
                  key={med.id}
                  style={[styles.medItem, { backgroundColor: theme.cardSoftTint, borderColor: borderColor }]}
                >
                  <View style={styles.medMeta}>
                    <Text style={[styles.medName, textPrimaryStyle]}>{med.medName}</Text>
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
                            Alert.alert('تم الحذف', 'تم إيقاف تذكيرات هذا العلاج.');
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
            <Text style={[styles.noMedsText, textSecondaryStyle]}>لا توجد أدوية مضافة حالياً.</Text>
          )}
        </GlassCard>

        {/* Driving licence / vehicle annual / ration card */}
        <GlassCard borderColor={theme.border} style={{ backgroundColor: cardMain, marginTop: 12 }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Feather name="bell" size={18} color={theme.primaryBrand} />
            <Text style={[styles.sectionTitle, textPrimaryStyle, { marginBottom: 0 }]}>تنبيهات إضافية وجدولة إجازة/سنوية</Text>
          </View>
          <View style={styles.form}>
            <DatePicker
              label="تاريخ انتهاء إجازة السوق (سيارة):"
              value={drivingExpiry}
              onChange={setDrivingExpiry}
              placeholder="اختر تاريخ انتهاء إجازة السوق"
            />
            <DatePicker
              label="تاريخ انتهاء سنوية سيارتك الحالية:"
              value={vehicleExpiry}
              onChange={setVehicleExpiry}
              placeholder="اختر تاريخ انتهاء سنوية السيارة"
            />
            <DatePicker
              label="تاريخ التحديث القادم للبطاقة التموينية:"
              value={rationExpiry}
              onChange={setRationExpiry}
              placeholder="اختر تاريخ التحديث القادم"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveExpiries}>
              <LinearGradient
                colors={[theme.primaryBrand, theme.secondaryAccent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveBtnGrad}
              >
                <Text style={styles.saveBtnText}>🔔 حفظ وجدولة تنبيهات الإجازة والسنوية</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Family members */}
        <View style={styles.membersSection}>
          <View style={styles.sectionHeaderRow}>
            <TouchableOpacity style={styles.addMemberBtn} onPress={() => setShowAddModal(true)}>
              <LinearGradient
                colors={[theme.primaryBrand, theme.secondaryAccent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addMemberBtnGrad}
              >
                <Text style={styles.addMemberBtnText}>➕ إضافة فرد</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, textPrimaryStyle]}>أفراد العائلة المضافين</Text>
          </View>

          {familyMembers.length !== 0 ? (
            familyMembers.map((member) => {
              const age = getAgeInYears(member.birthDate);
              const isYoungChild =
                (member.relationship === 'ابن' || member.relationship === 'بنت') && age < 6;
              return (
                <GlassCard
                  key={member.id}
                  borderColor={borderColor}
                  style={[styles.memberCard, { backgroundColor: cardMain }]}
                >
                  <View style={styles.memberHeader}>
                    <TouchableOpacity onPress={() =>
                      Alert.alert('حذف فرد من العائلة', 'هل تريد حذف ' + member.name + ' وإلغاء تذكيراته؟', [
                        { text: 'إلغاء', style: 'cancel' },
                        { text: 'حذف', style: 'destructive', onPress: () => removeFamilyMember(member.id) },
                      ])
                    }>
                      <Text style={styles.deleteMemberText}>🗑️ إزالة الفرد</Text>
                    </TouchableOpacity>
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, textPrimaryStyle]}>{member.name}</Text>
                      <View style={[styles.relationshipBadge, { backgroundColor: theme.primaryBrand + '1F' }]}>
                        <Text style={[styles.relationshipText, { color: theme.primaryBrand }]}>{member.relationship}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.memberExpiries, { borderTopColor: theme.divider }]}>
                    <Text style={[styles.memberDetailText, textSecondaryStyle]}>
                      🎂 تاريخ الميلاد: {member.birthDate} (العمر: {age} سنوات)
                    </Text>
                    <Text style={[styles.memberDetailText, textSecondaryStyle]}>🪪 انتهاء الوطنية: {member.nidExpiryDate}</Text>
                    <Text style={[styles.memberDetailText, textSecondaryStyle]}>✈️ انتهاء الجواز: {member.passportExpiryDate}</Text>
                    {isYoungChild && (
                      <View
                        style={[
                          styles.vaccineBadge,
                          { backgroundColor: theme.success + '0A', borderColor: theme.success + '33' },
                        ]}
                      >
                        <Ionicons name="medical" size={12} color={theme.success} />
                        <Text style={[styles.vaccineBadgeText, { color: theme.success }]}>
                          طفل دون الـ 6 سنوات - جدول اللقاحات وتنبيهاتها مفعلة تلقائياً 💉
                        </Text>
                      </View>
                    )}
                  </View>
                </GlassCard>
              );
            })
          ) : (
            <View style={[styles.emptyMembers, { backgroundColor: theme.cardElevated, borderColor: borderColor }]}>
              <Ionicons name="people-outline" size={40} color={theme.textMuted} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyMembersText, textPrimaryStyle]}>لا يوجد أفراد عائلة مضافين حالياً.</Text>
              <Text style={[styles.emptyMembersSub, textSecondaryStyle]}>
                إضافة الأبناء تساعد في التذكير التلقائي بمواعيد لقاحاتهم وسن التسجيل للمدارس الابتدائية.
              </Text>
            </View>
          )}
        </View>

        {/* Add member modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showAddModal}
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.cardElevated,
                  borderColor: theme.border,
                  borderWidth: isDarkMode ? 1 : 0,
                },
              ]}
            >
              <Text style={[styles.modalTitle, textPrimaryStyle]}>➕ إضافة فرد عائلة جديد</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, textPrimaryStyle]}>الاسم الكامل للفرد:</Text>
                  <TextInput
                    style={[styles.input, inputThemeStyle]}
                    value={memberName}
                    onChangeText={setMemberName}
                    placeholder="مثال: يوسف عماد محمد"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, textPrimaryStyle]}>صلة القرابة:</Text>
                  <View style={styles.relationshipSelectRow}>
                    {RELATIONSHIPS.map((rel) => {
                      const selected = memberRelationship === rel;
                      return (
                        <TouchableOpacity
                          key={rel}
                          style={[styles.relationshipSelectChip, selected && { backgroundColor: theme.primaryBrand }]}
                          onPress={() => setMemberRelationship(rel)}
                        >
                          <Text style={[styles.relSelectText, selected && { color: 'white', fontWeight: 'bold' }]}>{rel}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <DatePicker
                  label="تاريخ الميلاد:"
                  value={memberBirthDate}
                  onChange={setMemberBirthDate}
                  placeholder="اختر تاريخ ميلاد الفرد"
                />
                <DatePicker
                  label="تاريخ انتهاء البطاقة الوطنية:"
                  value={memberNidExpiry}
                  onChange={setMemberNidExpiry}
                  placeholder="اختر تاريخ انتهاء البطاقة الوطنية"
                />
                <DatePicker
                  label="تاريخ انتهاء جواز السفر:"
                  value={memberPassportExpiry}
                  onChange={setMemberPassportExpiry}
                  placeholder="اختر تاريخ انتهاء جواز السفر"
                />

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalCancelBtn, { backgroundColor: theme.cardSoftTint }]}
                    onPress={() => setShowAddModal(false)}
                  >
                    <Text style={[styles.modalCancelText, textSecondaryStyle]}>إلغاء</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, styles.modalAddBtn]} onPress={handleAddMember}>
                    <LinearGradient
                      colors={[theme.primaryBrand, theme.secondaryAccent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.modalAddBtnGrad}
                    >
                      <Text style={styles.modalAddText}>إضافة وتأمين 🔒</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <View style={{ height: 180 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 24 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'right' },
  subtitle: { fontSize: 12, textAlign: 'right', marginTop: 2, marginBottom: 16 },
  shieldBanner: { marginBottom: 12, padding: 12 },
  bannerTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 4 },
  shieldTitle: { fontWeight: 'bold', fontSize: 14 },
  shieldText: { fontSize: 11.5, lineHeight: 18, textAlign: 'right' },
  settingRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  settingMeta: { flex: 1, alignItems: 'flex-end', marginLeft: 12 },
  settingLabel: { fontSize: 14, fontWeight: 'bold' },
  settingSub: { fontSize: 11, marginTop: 2, textAlign: 'right' },
  bioBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  bioBtnActiveDark: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'blue' },
  bioBtnActiveLight: { backgroundColor: 'rgba(37, 99, 235, 0.1)', borderColor: 'blue' },
  bioBtnText: { color: 'gray', fontSize: 11.5, fontWeight: 'bold' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
  sectionCardSub: { fontSize: 11, textAlign: 'right', lineHeight: 16, marginBottom: 12 },
  editText: { color: 'blue', fontSize: 14, fontWeight: 'bold' },
  form: { gap: 12 },
  formGroup: { marginBottom: 4 },
  label: { fontSize: 12.5, fontWeight: 'bold', textAlign: 'right', marginBottom: 6 },
  input: { height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 13.5, textAlign: 'right' },
  saveBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 10 },
  saveBtnGrad: { height: 44, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  headDetails: { paddingVertical: 4 },
  detailsName: { fontSize: 17, fontWeight: 'bold', textAlign: 'right' },
  detailsSub: { fontSize: 12, textAlign: 'right', marginTop: 4 },
  detailDivider: { height: 1, marginVertical: 14 },
  expiryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  expiryLabel: { fontSize: 13, fontWeight: 'bold' },
  expiryValue: { fontSize: 12.5, fontWeight: 'bold' },
  membersSection: { marginTop: 24 },
  addMemberBtn: { borderRadius: 16, overflow: 'hidden' },
  addMemberBtnGrad: { paddingHorizontal: 16, paddingVertical: 6, justifyContent: 'center', alignItems: 'center' },
  addMemberBtnText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  emptyMembers: { alignItems: 'center', padding: 30, borderRadius: 20, borderWidth: 1 },
  emptyMembersText: { fontSize: 14, fontWeight: 'bold' },
  emptyMembersSub: { fontSize: 11, textAlign: 'center', marginTop: 6, lineHeight: 16 },
  memberCard: { marginBottom: 10, padding: 14 },
  memberHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deleteMemberText: { color: 'red', fontSize: 12, fontWeight: 'bold' },
  memberInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { fontSize: 15.5, fontWeight: 'bold' },
  relationshipBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  relationshipText: { fontSize: 11, fontWeight: 'bold' },
  memberExpiries: { marginTop: 12, borderTopWidth: 1, paddingTop: 10, gap: 6 },
  memberDetailText: { fontSize: 12.5, textAlign: 'right' },
  vaccineBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  vaccineBadgeText: { fontSize: 10.5, fontWeight: 'bold', flex: 1, textAlign: 'right' },
  noMedsText: { fontSize: 12, textAlign: 'center', marginVertical: 12 },
  medsList: { gap: 8, marginTop: 6 },
  medItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  medMeta: { alignItems: 'flex-end', flex: 1, paddingRight: 6 },
  medName: { fontSize: 13.5, fontWeight: 'bold' },
  medSub: { fontSize: 11, marginTop: 2 },
  trashBtn: { padding: 6, backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 8 },
  timeSelectRow: { flexDirection: 'row-reverse', gap: 12, height: 120, marginTop: 4 },
  timePartColumn: { flex: 1, alignItems: 'center' },
  timeLabel: { fontSize: 11.5, fontWeight: 'bold', marginBottom: 4 },
  timeScroll: { width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 10 },
  timeItem: { height: 30, justifyContent: 'center', alignItems: 'center', marginVertical: 1 },
  timeItemText: { fontSize: 12 },
  ampmBtn: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    marginVertical: 2,
  },
  ampmText: { fontSize: 12.5, color: 'gray', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 24, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 16 },
  relationshipSelectRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  relationshipSelectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.05)' },
  chipActiveDark: { backgroundColor: 'blue' },
  chipActiveLight: { backgroundColor: 'blue' },
  relSelectText: { fontSize: 12.5, color: 'gray' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 },
  modalBtn: { flex: 1, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalCancelBtn: { borderWidth: 0 },
  modalCancelText: { fontWeight: 'bold' },
  modalAddBtn: { borderRadius: 12, overflow: 'hidden' },
  modalAddBtnGrad: { height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center' },
  modalAddText: { color: 'white', fontWeight: 'bold' },
});
