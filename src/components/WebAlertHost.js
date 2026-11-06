// On the web, react-native-web's Alert.alert() is a silent no-op, so every message,
// confirmation and error in the app would disappear. This host patches Alert.alert
// on the web and renders the dialogs in-app with the app's own look (RTL, dark mode).
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

let enqueue = null;
const pending = [];

if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons, options) => {
    const dialog = {
      title: title ?? '',
      message: message ?? '',
      buttons: buttons && buttons.length ? buttons : [{ text: 'حسناً' }],
      cancelable: options?.cancelable,
    };
    if (enqueue) enqueue(dialog);
    else pending.push(dialog);
  };
}

export function WebAlertHost() {
  const { theme } = useTheme();
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    enqueue = (d) => setQueue((q) => [...q, d]);
    if (pending.length) setQueue((q) => [...q, ...pending.splice(0)]);
    return () => {
      enqueue = null;
    };
  }, []);

  if (Platform.OS !== 'web' || queue.length === 0) return null;
  const current = queue[0];
  const close = (btn) => {
    setQueue((q) => q.slice(1));
    if (btn && typeof btn.onPress === 'function') setTimeout(() => btn.onPress(), 0);
  };
  const cancelBtn = current.buttons.find((b) => b.style === 'cancel');

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => close(cancelBtn)}>
      <Pressable style={styles.backdrop} onPress={() => cancelBtn && close(cancelBtn)}>
        <Pressable style={[styles.card, { backgroundColor: theme.cardMain || theme.background, borderColor: theme.border }]}>
          {!!current.title && <Text style={[styles.title, { color: theme.textPrimary }]}>{current.title}</Text>}
          {!!current.message && <Text style={[styles.message, { color: theme.textSecondary }]}>{current.message}</Text>}
          <View style={styles.row}>
            {current.buttons.map((b, i) => (
              <Pressable
                key={i}
                onPress={() => close(b)}
                style={[
                  styles.btn,
                  { borderColor: theme.border },
                  b.style !== 'cancel' && b.style !== 'destructive' && { backgroundColor: theme.primaryBrand, borderColor: theme.primaryBrand },
                  b.style === 'destructive' && { backgroundColor: theme.danger, borderColor: theme.danger },
                ]}
              >
                <Text style={[styles.btnText, { color: b.style === 'cancel' ? theme.textPrimary : '#fff' }]}>{b.text || 'حسناً'}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: 20, borderWidth: 1, padding: 20 },
  title: { fontSize: 17, fontWeight: 'bold', textAlign: 'right', marginBottom: 8 },
  message: { fontSize: 14, lineHeight: 22, textAlign: 'right', marginBottom: 18 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' },
  btn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, minWidth: 88, alignItems: 'center' },
  btnText: { fontSize: 14, fontWeight: 'bold' },
});
