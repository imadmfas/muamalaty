// PIN entry dialog (new in v1.1.0). Used to create a PIN when the lock is switched on
// (v1.0.0 switched the lock on with a hard-coded "1234") and to confirm the current
// PIN before the lock is switched off.
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

// mode: 'create' (enter + confirm) or 'verify' (enter once)
export const PinPromptModal = ({ visible, mode = 'create', title, onCancel, onDone }) => {
  const { theme } = useTheme();
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setFirst('');
      setSecond('');
      setStep(1);
      setError('');
    }
  }, [visible]);

  const value = step === 1 ? first : second;
  const setValue = (v) => {
    const digits = v.replace(/[^0-9٠-٩]/g, '').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).slice(0, 4);
    setError('');
    step === 1 ? setFirst(digits) : setSecond(digits);
  };

  const submit = async () => {
    if (value.length !== 4) return setError('يجب أن يتكون الرمز من 4 أرقام');
    if (mode === 'verify') {
      const ok = await onDone(first);
      if (ok === false) {
        setFirst('');
        setError('الرمز غير صحيح');
      }
      return;
    }
    if (step === 1) return setStep(2);
    if (first !== second) {
      setSecond('');
      return setError('الرمزان غير متطابقين، أعد كتابة التأكيد');
    }
    await onDone(first);
  };

  const label =
    mode === 'verify' ? 'أدخل رمز الـ PIN الحالي' : step === 1 ? 'اختر رمز PIN من 4 أرقام' : 'أعد كتابة الرمز للتأكيد';

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.cardMain, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
          <TextInput
            key={step}
            autoFocus
            value={value}
            onChangeText={setValue}
            onSubmitEditing={submit}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            style={[styles.input, { color: theme.textPrimary, borderColor: error ? theme.danger : theme.border }]}
            placeholder="••••"
            placeholderTextColor={theme.textMuted}
          />
          {!!error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}
          <View style={styles.row}>
            <Pressable onPress={submit} style={[styles.btn, { backgroundColor: theme.primaryBrand, borderColor: theme.primaryBrand }]}>
              <Text style={[styles.btnText, { color: '#fff' }]}>{mode === 'create' && step === 1 ? 'التالي' : 'تأكيد'}</Text>
            </Pressable>
            <Pressable onPress={onCancel} style={[styles.btn, { borderColor: theme.border }]}>
              <Text style={[styles.btnText, { color: theme.textPrimary }]}>إلغاء</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, borderRadius: 20, borderWidth: 1, padding: 20 },
  title: { fontSize: 17, fontWeight: 'bold', textAlign: 'right', marginBottom: 6 },
  label: { fontSize: 13, textAlign: 'right', marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 12, height: 52, fontSize: 24, letterSpacing: 12, textAlign: 'center', direction: 'ltr' },
  error: { fontSize: 12, textAlign: 'right', marginTop: 8 },
  row: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  btnText: { fontSize: 14, fontWeight: 'bold' },
});
