import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/GlassCard';

const GOVERNORATES_DISTRICTS = {
  'بغداد': ['الرصافة', 'الكرخ', 'الأعظمية', 'الصدر', 'الكاظمية', 'التاجي', 'المحمودية', 'أبو غريب', 'المدائن'],
  'نينوى': ['الموصل', 'تلعفر', 'سنجار', 'الحمدانية', 'الشيخان', 'الحضر', 'البعاج', 'تلكيف'],
  'البصرة': ['البصرة', 'القرنة', 'الزبير', 'الفاو', 'أبي الخصيب', 'شط العرب', 'المدينة'],
  'الأنبار': ['الرمادي', 'الفلوجة', 'القائم', 'هيت', 'حديثة', 'الرطبة', 'عانة', 'راوة'],
  'بابل': ['الحلة', 'المحاويل', 'الهاشمية', 'المسيب', 'الكفل'],
  'النجف': ['النجف', 'الكوفة', 'المناذرة'],
  'كربلاء': ['كربلاء', 'عين التمر', 'الهندية'],
  'ذي قار': ['الناصرية', 'الشطرة', 'الرفاعي', 'الجبايش', 'سوق الشيوخ'],
  'القادسية': ['الديوانية', 'عفك', 'الحمزة', 'الشامية'],
  'ميسان': ['العمارة', 'الكحلاء', 'الميمونة', 'المجر الكبير', 'قلعة صالح', 'علي الغربي'],
  'المثنى': ['السماوة', 'الرميثة', 'الخضر', 'السلمان'],
  'كركوك': ['كركوك', 'الحويجة', 'الدبس', 'داقوق'],
  'صلاح الدين': ['تكريت', 'سامراء', 'بلد', 'الدجيل', 'الشرقاط', 'طوزخورماتو', 'الدور'],
  'ديالى': ['بعقوبة', 'المقدادية', 'خانقين', 'الخالص', 'بلدروز', 'كفري'],
  'واسط': ['الكوت', 'النعمانية', 'الحي', 'الصويرة', 'العزيزية', 'بدرة'],
  'أربيل': ['أربيل', 'كويه', 'شقلاوة', 'سوران', 'عمادية'],
  'السليمانية': ['السليمانية', 'حلبجة', 'رانية', 'دوكان', 'دربندخان', 'بنجوين'],
  'دهوك': ['دهوك', 'زاخو', 'عمادية', 'عقرة'],
};

export const HomeScreen = ({ onSearchSubmit, onQuickSelect, onSwitchTab }) => {
  const { recentSearches, clearRecentSearches, currentUser, registerUser } = useAppStore();
  // eslint-disable-next-line no-unused-vars
  const { theme, isDarkMode, toggleDarkMode, themeConfig } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showGovPicker, setShowGovPicker] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);

  const quickServices = [
    { label: 'تموينية', query: 'تموينية', icon: <MaterialCommunityIcons name="food-apple" size={20} color={theme.primaryBrand} /> },
    { label: 'إجازة سوق', query: 'إجازة سوق', icon: <Ionicons name="car-sport" size={20} color={theme.primaryBrand} /> },
    { label: 'بطاقة وطنية', query: 'بطاقة وطنية', icon: <FontAwesome5 name="id-card" size={16} color={theme.primaryBrand} /> },
    { label: 'جواز سفر', query: 'جواز', icon: <MaterialCommunityIcons name="passport" size={20} color={theme.primaryBrand} /> },
    { label: 'المزيد', query: 'المزيد', icon: <Feather name="more-horizontal" size={20} color={theme.textMuted} /> },
    { label: 'شهادة ولادة', query: 'ولادة', icon: <FontAwesome5 name="baby" size={16} color={theme.primaryBrand} /> },
    { label: 'إطلاق مركبة', query: 'سيارة', icon: <Ionicons name="car-outline" size={20} color={theme.primaryBrand} /> },
    { label: 'بطاقة سكن', query: 'سكن', icon: <Ionicons name="home" size={20} color={theme.primaryBrand} /> },
  ];

  const textPrimaryStyle = { color: theme.textPrimary };
  const textSecondaryStyle = { color: theme.textSecondary };
  const cardBg = theme.cardMain;
  const borderColor = theme.border;

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    onSearchSubmit(searchQuery);
    setSearchQuery('');
  };

  // OTP is generated locally and displayed in an Alert; nothing is actually sent.
  const handleRequestOtp = () => {
    if (phoneNumber.length === 9 && !isNaN(Number(phoneNumber))) {
      if (!selectedGovernorate || !selectedDistrict) {
        Alert.alert('خطأ', 'يرجى اختيار المحافظة والقضاء');
        return;
      }
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setOtpSent(true);
      Alert.alert(
        '💬 تفعيل حساب المواطن (WhatsApp)',
        `تم إرسال كود التفعيل إلى حساب الواتساب الخاص بالرقم 07${phoneNumber} بنجاح!\n\nكود التفعيل الخاص بك هو: ${code}`
      );
      return;
    }
    Alert.alert('خطأ', 'يرجى إدخال رقم هاتف محمول عراقي صحيح (9 أرقام بعد 07)');
  };

  const handleVerifyOtp = () => {
    if (otpInput !== generatedOtp) {
      Alert.alert('خطأ بتنسيق الكود', 'كود التفعيل الذي أدخلته غير صحيح.');
      return;
    }
    registerUser(phoneNumber, selectedGovernorate, selectedDistrict);
    Alert.alert(
      'تم بنجاح',
      `أهلاً بك! تم تفعيل حسابك كمواطن من ${selectedGovernorate} - ${selectedDistrict}.`
    );
    setShowLoginModal(false);
    setPhoneNumber('');
    setSelectedGovernorate('');
    setSelectedDistrict('');
    setGeneratedOtp('');
    setOtpInput('');
    setOtpSent(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isDarkMode && (
        <View style={styles.absoluteGlowContainer}>
          <LinearGradient colors={['rgba(116, 183, 255, 0.025)', 'transparent']} style={styles.glowBlue} />
          <LinearGradient colors={['rgba(38, 198, 218, 0.015)', 'transparent']} style={styles.glowPurple} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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

            <TouchableOpacity
              style={[
                styles.headerSquareBtn,
                {
                  backgroundColor: cardBg,
                  borderColor: borderColor,
                  shadowColor: theme.primaryBrand,
                  shadowOpacity: isDarkMode ? 0 : 0.03,
                  shadowRadius: 8,
                  elevation: isDarkMode ? 0 : 2,
                },
              ]}
              onPress={() => setShowLoginModal(true)}
            >
              <Feather name="maximize" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerRightProfile}>
            <View style={styles.profileTextWrapper}>
              <Text style={[styles.welcomeSubtitle, textSecondaryStyle]}>كيف يمكنني مساعدتك اليوم؟</Text>
              <Text style={[styles.welcomeTitle, textPrimaryStyle]}>
                مرحباً، {currentUser ? `07${currentUser.phone}` : 'أحمد'}
              </Text>
            </View>
            <View
              style={[
                styles.profileAvatarBorder,
                { backgroundColor: isDarkMode ? theme.primaryBrand + '40' : theme.primaryBrand + '26' },
              ]}
            >
              <LinearGradient
                colors={[theme.primaryBrand, theme.secondaryAccent]}
                style={styles.profileAvatarGrad}
              >
                <Ionicons name="person" size={18} color="white" />
              </LinearGradient>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchRow,
              {
                backgroundColor: cardBg,
                borderColor: borderColor,
                shadowColor: theme.primaryBrand,
                shadowOpacity: isDarkMode ? 0 : 0.03,
                shadowRadius: 8,
                elevation: isDarkMode ? 0 : 2,
              },
            ]}
          >
            <TextInput
              placeholder="ابحث عن خدمة أو معاملة..."
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.textPrimary }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              textAlign="right"
            />
            <Feather name="search" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
          </View>
        </View>

        <GlassCard
          borderColor={borderColor}
          style={[styles.smartAssistantCard, { backgroundColor: cardBg }]}
          glow={true}
        >
          <View style={styles.assistantGraphicSphere}>
            <LinearGradient
              colors={
                isDarkMode
                  ? [theme.primaryBrand + '12', 'transparent']
                  : [theme.primaryBrand + '10', 'transparent']
              }
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View style={styles.assistantTextContent}>
            <Text style={[styles.assistantTitle, textPrimaryStyle]}>المساعد الذكي موسى</Text>
            <Text style={[styles.assistantSubtitle, textSecondaryStyle]}>
              استشرني في كافة المعاملات والروتين الحكومي العراقي
            </Text>
            <TouchableOpacity style={styles.assistantSpeakBtn} onPress={() => onQuickSelect('مرحباً')}>
              <LinearGradient
                colors={[theme.primaryBrand, theme.secondaryAccent]}
                style={styles.assistantSpeakBtnGrad}
              >
                <Text style={[styles.assistantSpeakBtnText, { color: 'white' }]}>تحدث الآن</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <View style={styles.quickServicesTitleRow}>
          <TouchableOpacity onPress={() => onSwitchTab?.('transactions')}>
            <Text style={[styles.viewAllText, { color: theme.primaryBrand }]}>عرض الكل</Text>
          </TouchableOpacity>
          <Text style={[styles.quickServicesTitle, textPrimaryStyle]}>الخدمات السريعة</Text>
        </View>

        <View style={styles.quickGrid}>
          {quickServices.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickCard}
              onPress={() => {
                if (item.label !== 'المزيد') {
                  onQuickSelect(item.query);
                } else if (onSwitchTab != null) {
                  onSwitchTab('services');
                }
              }}
            >
              <View
                style={[
                  styles.quickIconWrapper,
                  {
                    backgroundColor: theme.cardSoftTint,
                    borderColor: borderColor,
                    shadowColor: theme.primaryBrand,
                  },
                ]}
              >
                {item.icon}
              </View>
              <Text style={[styles.quickCardText, { color: theme.textSecondary }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <GlassCard
          borderColor={borderColor}
          style={[styles.privacyReassuranceCard, { backgroundColor: cardBg }]}
        >
          <View style={styles.privacyHeaderRow}>
            <Feather name="shield" size={18} color={theme.primaryBrand} style={{ marginLeft: 6 }} />
            <Text style={[styles.privacyTitleText, { color: theme.primaryBrand }]}>
              مستمسكاتك مشفرة ومحفوظة محلياً 100% 🔒
            </Text>
          </View>
          <Text style={[styles.privacyDescriptionText, textSecondaryStyle]}>
            يتم تشفير كافة مستمسكاتك الشخصية محلياً باستخدام تشفير عسكري آمن ومفاتيح محمية عتادياً داخل هاتفك. لا يتم مشاركة أي بيانات خارج الجهاز مطلقاً، والتطبيق آمن تماماً دون اتصال بالإنترنت.
          </Text>
        </GlassCard>

        {recentSearches.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text style={[styles.clearText, { color: theme.danger }]}>مسح الكل</Text>
              </TouchableOpacity>
              <Text style={[styles.quickServicesTitle, textPrimaryStyle]}>عمليات البحث الأخيرة</Text>
            </View>
            <View style={styles.recentContainer}>
              {recentSearches.slice(0, 6).map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.recentItem,
                    { backgroundColor: theme.cardSoftTint, borderColor: borderColor, borderWidth: 1 },
                  ]}
                  onPress={() => onSearchSubmit(item)}
                >
                  <Text style={[styles.recentText, textPrimaryStyle]}>🔍 {item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showLoginModal}
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard
            borderColor={borderColor}
            style={[styles.modalContentCard, { backgroundColor: cardBg }]}
            glow={true}
          >
            <View style={[styles.modalHeaderRow, { borderBottomColor: theme.divider }]}>
              <TouchableOpacity onPress={() => setShowLoginModal(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitleText, textPrimaryStyle]}>🔒 تفعيل حساب المواطن</Text>
            </View>

            {!otpSent ? (
              <ScrollView contentContainerStyle={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalSubText, { color: theme.textSecondary }]}>
                  يرجى إدخال رقم هاتفك المحمول عدا الصفر وتحديد موقعك الجغرافي لتخصيص معاملاتك.
                </Text>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, textPrimaryStyle]}>رقم الموبايل العراقي:</Text>
                  <View
                    style={[
                      styles.phoneInputContainer,
                      { backgroundColor: theme.cardSoftTint, borderColor: borderColor },
                    ]}
                  >
                    <TextInput
                      style={[styles.phoneInput, { color: theme.textPrimary }]}
                      keyboardType="numeric"
                      maxLength={9}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="7701234567"
                      placeholderTextColor={theme.textMuted}
                      textAlign="center"
                    />
                    <View style={[styles.phonePrefixContainer, { borderLeftColor: borderColor }]}>
                      <Text style={[styles.phonePrefixText, { color: theme.textSecondary }]}>07</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, textPrimaryStyle]}>المحافظة:</Text>
                  <TouchableOpacity
                    style={[
                      styles.selectorBtn,
                      { backgroundColor: theme.cardSoftTint, borderColor: borderColor },
                    ]}
                    onPress={() => {
                      setShowGovPicker(true);
                      setShowDistrictPicker(false);
                    }}
                  >
                    <Ionicons name="chevron-down" size={16} color={theme.primaryBrand} />
                    <Text style={[styles.selectorText, textPrimaryStyle]}>
                      {selectedGovernorate || 'اختر محافظتك'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, textPrimaryStyle]}>القضاء / المدينة:</Text>
                  <TouchableOpacity
                    style={[
                      styles.selectorBtn,
                      !selectedGovernorate && { opacity: 0.4 },
                      { backgroundColor: theme.cardSoftTint, borderColor: borderColor },
                    ]}
                    onPress={() => {
                      if (!selectedGovernorate) return;
                      setShowDistrictPicker(true);
                      setShowGovPicker(false);
                    }}
                    disabled={!selectedGovernorate}
                  >
                    <Ionicons name="chevron-down" size={16} color={theme.primaryBrand} />
                    <Text style={[styles.selectorText, textPrimaryStyle]}>
                      {selectedDistrict || 'اختر قضاءك'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showGovPicker && (
                  <View style={[styles.pickerSection, { backgroundColor: theme.cardSoftTint }]}>
                    <ScrollView style={styles.pickerScroll} nestedScrollEnabled={true}>
                      <View style={styles.pickerGrid}>
                        {Object.keys(GOVERNORATES_DISTRICTS).map((gov) => {
                          const isSelected = selectedGovernorate === gov;
                          return (
                            <TouchableOpacity
                              key={gov}
                              style={[
                                styles.pickerGridItem,
                                { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : theme.cardElevated },
                                isSelected && { backgroundColor: theme.primaryBrand },
                              ]}
                              onPress={() => {
                                setSelectedGovernorate(gov);
                                setSelectedDistrict('');
                                setShowGovPicker(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.pickerGridItemText,
                                  textPrimaryStyle,
                                  isSelected && {
                                    color: isDarkMode ? theme.background : 'white',
                                    fontWeight: 'bold',
                                  },
                                ]}
                              >
                                {gov}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {showDistrictPicker && selectedGovernorate && (
                  <View style={[styles.pickerSection, { backgroundColor: theme.cardSoftTint }]}>
                    <ScrollView style={styles.pickerScroll} nestedScrollEnabled={true}>
                      <View style={styles.pickerGrid}>
                        {GOVERNORATES_DISTRICTS[selectedGovernorate].map((district) => {
                          const isSelected = selectedDistrict === district;
                          return (
                            <TouchableOpacity
                              key={district}
                              style={[
                                styles.pickerGridItem,
                                { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : theme.cardElevated },
                                isSelected && { backgroundColor: theme.primaryBrand },
                              ]}
                              onPress={() => {
                                setSelectedDistrict(district);
                                setShowDistrictPicker(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.pickerGridItemText,
                                  textPrimaryStyle,
                                  isSelected && {
                                    color: isDarkMode ? theme.background : 'white',
                                    fontWeight: 'bold',
                                  },
                                ]}
                              >
                                {district}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                )}

                <TouchableOpacity style={styles.submitRegBtn} onPress={handleRequestOtp}>
                  <LinearGradient
                    colors={[theme.primaryBrand, theme.secondaryAccent]}
                    style={styles.submitRegGrad}
                  >
                    <Text style={[styles.submitRegBtnText, { color: 'white' }]}>
                      تفعيل الحساب مجاناً عبر الواتساب 💬
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.otpForm}>
                <Text style={[styles.modalSubText, { color: theme.textSecondary }]}>
                  تم إرسال رمز التفعيل بنجاح عبر الواتساب إلى الرقم:{'\n'}
                  <Text style={{ color: theme.primaryBrand, fontWeight: 'bold' }}>07{phoneNumber}</Text>
                </Text>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, textPrimaryStyle]}>رمز التفعيل (4 أرقام):</Text>
                  <TextInput
                    style={[
                      styles.otpInput,
                      {
                        color: theme.textPrimary,
                        backgroundColor: theme.cardSoftTint,
                        borderColor: borderColor,
                      },
                    ]}
                    keyboardType="numeric"
                    maxLength={4}
                    value={otpInput}
                    onChangeText={setOtpInput}
                    placeholder="XXXX"
                    placeholderTextColor={theme.textMuted}
                    textAlign="center"
                  />
                </View>

                <TouchableOpacity style={styles.submitRegBtn} onPress={handleVerifyOtp}>
                  <LinearGradient
                    colors={[theme.success, theme.secondaryAccent]}
                    style={styles.submitRegGrad}
                  >
                    <Text style={[styles.submitRegBtnText, { color: 'white' }]}>تحقق وتفعيل 🔓</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>
        </View>
      </Modal>
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
  glowBlue: { position: 'absolute', top: -100, right: -100, width: 250, height: 250, borderRadius: 125 },
  glowPurple: { position: 'absolute', bottom: 120, left: -100, width: 220, height: 220, borderRadius: 110 },
  scrollContainer: { padding: 16, paddingTop: 12, paddingBottom: 180 },
  privacyReassuranceCard: { padding: 14, marginBottom: 16, borderWidth: 1 },
  privacyHeaderRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 6 },
  privacyTitleText: { fontSize: 13.5, fontWeight: 'bold' },
  privacyDescriptionText: { fontSize: 11.5, textAlign: 'right', lineHeight: 16.5 },
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
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 25,
  },
  headerLeftActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerSquareBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightProfile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileTextWrapper: { alignItems: 'flex-end' },
  welcomeSubtitle: { fontSize: 11, fontWeight: '500' },
  welcomeTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  profileAvatarBorder: { width: 42, height: 42, borderRadius: 21, padding: 1.5 },
  profileAvatarGrad: { flex: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { marginBottom: 16 },
  searchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: { flex: 1, height: '100%', fontSize: 13.5, fontWeight: '500', textAlign: 'right' },
  smartAssistantCard: {
    padding: 18,
    marginBottom: 20,
    position: 'relative',
    height: 140,
    justifyContent: 'center',
  },
  assistantGraphicSphere: {
    position: 'absolute',
    left: -20,
    top: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    opacity: 0.8,
  },
  assistantTextContent: { alignItems: 'flex-end', width: '100%', paddingRight: 6 },
  assistantTitle: { fontSize: 18, fontWeight: 'bold' },
  assistantSubtitle: { fontSize: 12, marginTop: 4, marginBottom: 12 },
  assistantSpeakBtn: { borderRadius: 14, overflow: 'hidden', width: 100 },
  assistantSpeakBtnGrad: { paddingVertical: 6, alignItems: 'center', justifyContent: 'center' },
  assistantSpeakBtnText: { fontSize: 11.5, fontWeight: 'bold' },
  quickServicesTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: { fontSize: 11.5, fontWeight: '600' },
  quickServicesTitle: { fontSize: 15, fontWeight: 'bold' },
  quickGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  quickCard: { width: '23%', alignItems: 'center', marginBottom: 10 },
  quickIconWrapper: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  quickCardText: { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  sectionContainer: { marginTop: 15 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearText: { fontSize: 12 },
  recentContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  recentItem: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  recentText: { fontSize: 11.5 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
  },
  modalContentCard: { width: '100%', maxWidth: 380, padding: 18 },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 12,
  },
  closeModalBtn: { padding: 2 },
  modalTitleText: { fontSize: 16.5, fontWeight: 'bold' },
  modalFormScroll: { gap: 10 },
  modalSubText: { fontSize: 11.5, textAlign: 'right', lineHeight: 16, marginBottom: 6 },
  formGroup: { marginBottom: 6 },
  formLabel: { fontSize: 12, fontWeight: 'bold', textAlign: 'right', marginBottom: 5 },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    height: 42,
  },
  phoneInput: { flex: 1, height: '100%', fontSize: 14, fontWeight: 'bold' },
  phonePrefixContainer: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    borderLeftWidth: 1,
  },
  phonePrefixText: { fontSize: 13, fontWeight: 'bold' },
  selectorBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  selectorText: { fontSize: 12.5 },
  pickerSection: { borderRadius: 10, padding: 10, maxHeight: 150 },
  pickerScroll: { flex: 1 },
  pickerGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  pickerGridItem: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  pickerGridItemText: { fontSize: 11.5 },
  submitRegBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 10 },
  submitRegGrad: { height: 42, justifyContent: 'center', alignItems: 'center' },
  submitRegBtnText: { fontSize: 12.5, fontWeight: 'bold' },
  otpForm: { gap: 12 },
  otpInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
});
