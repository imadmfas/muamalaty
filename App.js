import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar as RNStatusBar,
  Animated,
  Keyboard,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from './src/store/useAppStore';
import { useTheme } from './src/theme/ThemeContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { ServicesHubScreen } from './src/screens/ServicesHubScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import { GlassCard } from './src/components/GlassCard';
import * as securityService from './src/services/securityService';

export default function App() {
  const { isLocked, unlockApp, pinLockEnabled, biometricLockEnabled, loadPersistedData } = useAppStore();
  const { theme, isDarkMode, themeConfig } = useTheme();

  const [activeTab, setActiveTab] = useState('home');
  const [showAdmin, setShowAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const keyboardHeight = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPersistedData();
    setupDefaultPINForTest();

    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', (e) => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (isLocked && biometricLockEnabled) {
      handleBiometricUnlock();
    }
  }, [isLocked, biometricLockEnabled]);

  const setupDefaultPINForTest = async () => {
    const hasPin = await securityService.hasPIN();
    if (!hasPin) {
      await securityService.savePIN('1234');
    }
  };

  const handleBiometricUnlock = async () => {
    const success = await securityService.authenticateBiometric();
    if (success) {
      unlockApp();
      setPinInput('');
      setPinError(false);
    }
  };

  // NOTE: in the compiled bundle this function body is empty; Hermes inlined its
  // logic into the keypad onPress handler. Reconstructed here as the original helper.
  const handleKeyPress = (key) => {
    setPinError(false);
    if (pinInput.length < 4) {
      const newPin = pinInput + key;
      setPinInput(newPin);
      if (newPin.length === 4) {
        handlePinSubmit(newPin);
      }
    }
  };

  const handlePinSubmit = async (pin) => {
    const isValid = await securityService.verifyPIN(pin);
    if (isValid) {
      unlockApp();
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
      Alert.alert('رمز خاطئ', 'رمز الـ PIN الذي أدخلته غير صحيح. يرجى المحاولة مرة ثانية (الافتراضي: 1234)');
    }
  };

  // NOTE: likewise inlined into the keypad onPress handler in the bundle.
  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  if (isLocked && (pinLockEnabled || biometricLockEnabled)) {
    return (
      <View style={[styles.lockContainer, { backgroundColor: theme.background }]}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        {isDarkMode && (
          <View style={styles.absoluteGlowContainer}>
            <LinearGradient colors={[theme.primaryBrand + '08', 'transparent']} style={styles.glowBlue} />
            <LinearGradient colors={[theme.secondaryAccent + '05', 'transparent']} style={styles.glowPurple} />
          </View>
        )}
        <GlassCard
          borderColor={theme.border}
          style={[styles.lockCard, { backgroundColor: theme.cardMain }]}
          glow={true}
        >
          <Feather name="lock" size={24} color={theme.primaryBrand} style={{ marginBottom: 12 }} />
          <Text style={[styles.lockTitle, { color: theme.textPrimary }]}>تطبيق معاملاتي مؤمن</Text>
          <Text style={[styles.lockSub, { color: theme.textSecondary }]}>
            يرجى إلغاء القفل بالبصمة أو إدخال رمز الـ PIN (الافتراضي: 1234)
          </Text>

          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      pinInput.length > i
                        ? theme.primaryBrand
                        : isDarkMode
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(16,24,40,0.12)',
                  },
                  pinError && { backgroundColor: theme.danger },
                ]}
              />
            ))}
          </View>

          <View style={styles.keypad}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['البصمة 👁️', '0', '⌫'],
            ].map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keypadRow}>
                {row.map((key, keyIndex) => {
                  const isBio = key === 'البصمة 👁️';
                  return (
                    <TouchableOpacity
                      key={keyIndex}
                      style={[
                        styles.keypadKey,
                        {
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.015)' : 'rgba(16,24,40,0.03)',
                          borderColor: theme.border,
                        },
                        (key === '⌫' || isBio) && {
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(16,24,40,0.05)',
                        },
                        isBio && !biometricLockEnabled && { opacity: 0.3 },
                      ]}
                      onPress={() => {
                        if (key === '⌫') {
                          handleBackspace();
                        } else if (isBio) {
                          if (biometricLockEnabled) {
                            handleBiometricUnlock();
                          } else {
                            Alert.alert('تنبيه', 'البصمة غير مفعلة بعد، يرجى تفعيلها من الإعدادات.');
                          }
                        } else {
                          handleKeyPress(key);
                        }
                      }}
                      disabled={isBio && !biometricLockEnabled}
                    >
                      <Text style={[styles.keyText, { color: theme.textPrimary, fontSize: isBio ? 11 : 16 }]}>
                        {key}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </GlassCard>
      </View>
    );
  }

  const handleSearchSubmit = (query) => {
    setSearchQuery(query);
    setActiveTab('chat');
  };

  const handleQuickSelect = (query) => {
    setSearchQuery(query);
    setActiveTab('chat');
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onSearchSubmit={handleSearchSubmit} onQuickSelect={handleQuickSelect} />;
      case 'transactions':
        return <TransactionsScreen onAskAI={handleSearchSubmit} />;
      case 'services':
        return <ServicesHubScreen onAskAI={handleSearchSubmit} />;
      case 'chat':
        return <ChatScreen initialQuery={searchQuery} clearInitialQuery={() => setSearchQuery('')} />;
      case 'profile':
        return <ProfileScreen onOpenAdmin={() => setShowAdmin(true)} onAskAI={handleSearchSubmit} />;
      default:
        return <HomeScreen onSearchSubmit={handleSearchSubmit} onQuickSelect={handleQuickSelect} />;
    }
  };

  const tabs = [
    { id: 'profile', label: 'حسابي', icon: <Feather name="user" size={20} /> },
    { id: 'chat', label: 'المساعد', icon: <Feather name="message-circle" size={20} /> },
    { id: 'services', label: 'الخدمات', icon: <Feather name="grid" size={20} /> },
    { id: 'transactions', label: 'المعاملات', icon: <Feather name="clipboard" size={20} /> },
    { id: 'home', label: 'الرئيسية', icon: <Feather name="home" size={20} /> },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View style={styles.screenArea}>
        {showAdmin ? <AdminScreen onClose={() => setShowAdmin(false)} /> : renderScreen()}
      </View>

      {!showAdmin && (
        <Animated.View
          style={[
            styles.navBarWrapper,
            {
              transform: [
                {
                  translateY: keyboardHeight.interpolate({
                    inputRange: [0, 1000],
                    outputRange: [0, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[theme.backgroundSecondary, theme.backgroundSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.floatingNavBar,
              {
                borderColor: theme.border,
                shadowColor: isDarkMode ? 'transparent' : '#101828',
                shadowOpacity: isDarkMode ? 0 : 0.08,
                shadowRadius: 24,
                elevation: isDarkMode ? 0 : 4,
              },
            ]}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.navTab, isActive && styles.navTabActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <View style={[styles.iconWrapper, isActive && { shadowColor: theme.primaryBrand }]}>
                    {React.cloneElement(tab.icon, { color: isActive ? theme.primaryBrand : theme.textMuted })}
                  </View>
                  <Text style={[styles.navLabel, { color: theme.textMuted }, isActive && { color: theme.primaryBrand }]}>
                    {tab.label}
                  </Text>
                  {isActive && <View style={[styles.activeIndicator, { backgroundColor: theme.primaryBrand }]} />}
                </TouchableOpacity>
              );
            })}
          </LinearGradient>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: RNStatusBar.currentHeight || 24,
  },
  screenArea: {
    flex: 1,
  },
  navBarWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 100,
  },
  floatingNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 24,
    borderWidth: 1,
    // bundle performs an object spread here whose source register is `undefined` (no-op); see notes
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTabActive: {
    transform: [{ scale: 1.05 }],
  },
  iconWrapper: {
    marginBottom: 4,
    ...{ elevation: 1 }, // spread in bundle; see notes
  },
  navLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  absoluteGlowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  glowBlue: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  glowPurple: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  lockCard: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    padding: 24,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  lockSub: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  keypad: {
    width: '100%',
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  keypadKey: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  keyText: {
    fontWeight: 'bold',
  },
});
