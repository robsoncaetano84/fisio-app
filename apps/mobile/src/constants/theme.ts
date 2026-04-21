// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// TEMA E CONSTANTES - FISIO APP
// ==========================================

export const COLORS = {
  // Primárias
  primary: "#2E7D5E",
  primaryLight: "#4CAF50",
  primaryDark: "#1B5E40",

  // Secundárias
  secondary: "#5C6BC0",
  secondaryLight: "#8E99C2",
  secondaryDark: "#3F51B5",

  // Accent
  accent: "#FF7043",
  accentLight: "#FFAB91",

  // Status
  success: "#4CAF50",
  warning: "#FFC107",
  error: "#F44336",
  info: "#2196F3",

  // Neutrals
  white: "#FFFFFF",
  black: "#000000",
  background: "#F5F7FA",
  surface: "#FFFFFF",

  // Grays
  gray50: "#FAFAFA",
  gray100: "#F5F5F5",
  gray200: "#EEEEEE",
  gray300: "#E0E0E0",
  gray400: "#BDBDBD",
  gray500: "#9E9E9E",
  gray600: "#757575",
  gray700: "#616161",
  gray800: "#424242",
  gray900: "#212121",

  // Text
  textPrimary: "#212121",
  textSecondary: "#757575",
  textDisabled: "#BDBDBD",
  textInverse: "#FFFFFF",

  // Borders
  border: "#E0E0E0",
  borderLight: "#F5F5F5",
} as const;

export const FONTS = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
} as const;

export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

export const APP_CONFIG = {
  name: "Synap",
  version: "1.0.0",
  storage: {
    tokenKey: "@synap:token",
    refreshTokenKey: "@synap:refreshToken",
    userKey: "@synap:user",
  },
} as const;


