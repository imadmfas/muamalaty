import { useAppStore } from '../store/useAppStore';

export const lightTheme = {
  background: '#E3EDF7',
  backgroundSecondary: '#D8E5F1',
  cardMain: '#F5FAFF',
  cardElevated: '#FBFDFF',
  cardSoftTint: '#DCEBFA',
  textPrimary: '#101828',
  textSecondary: '#475467',
  textMuted: '#667085',
  primaryBrand: '#1E63D6',
  secondaryAccent: '#0E9AA7',
  success: '#12B76A',
  warning: '#F79009',
  danger: '#F04438',
  border: '#B8C7D9',
  divider: '#D7E0EA',
};

export const darkTheme = {
  background: '#0A0C10',
  backgroundSecondary: '#12161D',
  cardMain: '#171C24',
  cardElevated: '#202630',
  cardSoftTint: '#232B36',
  textPrimary: '#F9FAFB',
  textSecondary: '#D0D5DD',
  textMuted: '#98A2B3',
  primaryBrand: '#74B7FF',
  secondaryAccent: '#26C6DA',
  success: '#32D583',
  warning: '#FDB022',
  danger: '#F97066',
  border: '#3A4352',
  divider: '#252C36',
};

export const themeConfig = {
  borderRadius: 20,
  borderRadiusSmall: 12,
  borderRadiusLarge: 28,
  shadowLight: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 3,
  },
};

export const useTheme = () => {
  const { isDarkMode, toggleDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;
  return { theme, isDarkMode, toggleDarkMode, themeConfig };
};
