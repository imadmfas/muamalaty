// Reconstructed from Hermes bytecode — Metro module 736 (DatePicker, wheel-style list picker)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Computed at module load in the original but never used (dead code).
// eslint-disable-next-line no-unused-vars
const SCREEN_WIDTH = Dimensions.get('window').width;

export const DatePicker = ({ value, onChange, placeholder = 'اختر التاريخ...', label, error }) => {
  const { theme, isDarkMode } = useTheme();

  const [isVisible, setIsVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      setSelectedYear(y);
      setSelectedMonth(m);
      setSelectedDay(d);
    }
  }, [value, isVisible]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 96 }, (_, i) => currentYear + 10 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedYear, selectedMonth, daysInMonth]);

  const cardMain = theme.cardMain;
  const cardSoftTint = theme.cardSoftTint;
  const textPrimary = theme.textPrimary;
  const textMuted = theme.textMuted;
  const borderColor = theme.border;
  const primaryBrand = theme.primaryBrand;
  const selectedTextColor = 'white';
  const monthNames = [
    'كانون الثاني (1)',
    'شباط (2)',
    'آذار (3)',
    'نيسان (4)',
    'أيار (5)',
    'حزيران (6)',
    'تموز (7)',
    'آب (8)',
    'أيلول (9)',
    'تشرين الأول (10)',
    'تشرين الثاني (11)',
    'كانون الأول (12)',
  ];

  const handleConfirm = () => {
    const mm = selectedMonth.toString().padStart(2, '0');
    const dd = selectedDay.toString().padStart(2, '0');
    onChange(`${selectedYear}-${mm}-${dd}`);
    setIsVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: textPrimary }]}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.inputField,
          {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.01)' : theme.cardElevated,
            borderColor: error ? theme.danger : borderColor,
          },
        ]}
        onPress={() => setIsVisible(true)}
      >
        <Ionicons
          name="calendar-outline"
          size={16}
          color={error ? theme.danger : primaryBrand}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.valueText, { color: value ? textPrimary : textMuted }]}>{value || placeholder}</Text>
      </TouchableOpacity>

      {error && <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>}

      <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={() => setIsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: cardMain, borderTopColor: borderColor, borderWidth: isDarkMode ? 1 : 0 },
            ]}
          >
            <Text style={[styles.modalHeaderTitle, { color: textPrimary }]}>📅 اختر التاريخ بدقة</Text>
            <Text style={[styles.modalHeaderSub, { color: textMuted }]}>يرجى تحديد اليوم، الشهر، والسنة من القوائم أدناه</Text>

            <View style={styles.columnsContainer}>
              {/* Year */}
              <View style={[styles.columnBox, { borderColor: borderColor }]}>
                <Text style={[styles.columnLabel, { color: primaryBrand }]}>السنة</Text>
                <FlatList
                  data={years}
                  keyExtractor={(item) => `y-${item}`}
                  showsVerticalScrollIndicator={false}
                  initialScrollIndex={years.indexOf(selectedYear) > 0 ? years.indexOf(selectedYear) - 2 : 0}
                  getItemLayout={(data, index) => ({ length: 40, offset: 40 * index, index })}
                  renderItem={({ item }) => {
                    const isSelected = item === selectedYear;
                    return (
                      <TouchableOpacity
                        style={[styles.itemBtn, isSelected && { backgroundColor: primaryBrand }]}
                        onPress={() => setSelectedYear(item)}
                      >
                        <Text
                          style={[
                            styles.itemText,
                            {
                              color: isSelected ? selectedTextColor : textPrimary,
                              fontWeight: isSelected ? 'bold' : 'normal',
                            },
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>

              {/* Month */}
              <View style={[styles.columnBox, { borderColor: borderColor, flex: 1.3 }]}>
                <Text style={[styles.columnLabel, { color: primaryBrand }]}>الشهر</Text>
                <FlatList
                  data={months}
                  keyExtractor={(item) => `m-${item}`}
                  showsVerticalScrollIndicator={false}
                  initialScrollIndex={selectedMonth - 1 > 1 ? selectedMonth - 3 : 0}
                  getItemLayout={(data, index) => ({ length: 40, offset: 40 * index, index })}
                  renderItem={({ item }) => {
                    const isSelected = item === selectedMonth;
                    return (
                      <TouchableOpacity
                        style={[styles.itemBtn, isSelected && { backgroundColor: primaryBrand }]}
                        onPress={() => setSelectedMonth(item)}
                      >
                        <Text
                          style={[
                            styles.itemText,
                            {
                              color: isSelected ? selectedTextColor : textPrimary,
                              fontSize: 11.5,
                              fontWeight: isSelected ? 'bold' : 'normal',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {monthNames[item - 1]}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>

              {/* Day */}
              <View style={[styles.columnBox, { borderColor: borderColor }]}>
                <Text style={[styles.columnLabel, { color: primaryBrand }]}>اليوم</Text>
                <FlatList
                  data={days}
                  keyExtractor={(item) => `d-${item}`}
                  showsVerticalScrollIndicator={false}
                  initialScrollIndex={selectedDay - 1 > 1 ? selectedDay - 3 : 0}
                  getItemLayout={(data, index) => ({ length: 40, offset: 40 * index, index })}
                  renderItem={({ item }) => {
                    const isSelected = item === selectedDay;
                    return (
                      <TouchableOpacity
                        style={[styles.itemBtn, isSelected && { backgroundColor: primaryBrand }]}
                        onPress={() => setSelectedDay(item)}
                      >
                        <Text
                          style={[
                            styles.itemText,
                            {
                              color: isSelected ? selectedTextColor : textPrimary,
                              fontWeight: isSelected ? 'bold' : 'normal',
                            },
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: cardSoftTint }]}
                onPress={() => setIsVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: textMuted }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn, { backgroundColor: primaryBrand }]}
                onPress={handleConfirm}
              >
                <Text style={[styles.confirmBtnText, { color: 'white' }]}>💾 تأكيد واختيار</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 10 },
  label: { fontSize: 12.5, fontWeight: 'bold', textAlign: 'right', marginBottom: 6 },
  inputField: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
  },
  valueText: { fontSize: 13.5, textAlign: 'right', flex: 1 },
  errorText: { fontSize: 11, textAlign: 'right', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeaderTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  modalHeaderSub: { fontSize: 11.5, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  columnsContainer: { flexDirection: 'row-reverse', height: 220, gap: 8, marginBottom: 20 },
  columnBox: { flex: 1, borderWidth: 1, borderRadius: 14, overflow: 'hidden', paddingTop: 8 },
  columnLabel: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  itemBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    marginVertical: 2,
    borderRadius: 8,
  },
  itemText: { fontSize: 13.5 },
  modalBtnRow: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { borderWidth: 0 },
  cancelBtnText: { fontWeight: 'bold', fontSize: 13.5 },
  confirmBtn: { elevation: 2 },
  confirmBtnText: { fontWeight: 'bold', fontSize: 13.5 },
});
