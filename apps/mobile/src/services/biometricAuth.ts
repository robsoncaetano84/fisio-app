import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { APP_CONFIG } from "../constants/theme";
import { Usuario } from "../types";

export type BiometricAvailability = {
  available: boolean;
  label: string;
  reason?: string;
};

export type BiometricLoginPreference = {
  enabled: boolean;
  userId: string;
  email: string;
  label: string;
  updatedAt: string;
};

const BIOMETRIC_PROMPT_TITLE = "Entrar no Synap";
const DEFAULT_BIOMETRIC_LABEL = "biometria";

const isNative = Platform.OS === "android" || Platform.OS === "ios";

const getPreferenceKey = () => APP_CONFIG.storage.biometricLoginKey;

const getBiometricLabel = (
  types: LocalAuthentication.AuthenticationType[],
) => {
  if (
    types.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    )
  ) {
    return Platform.OS === "ios" ? "Face ID" : "reconhecimento facial";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return Platform.OS === "ios" ? "Touch ID" : "digital";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return "iris";
  }
  return DEFAULT_BIOMETRIC_LABEL;
};

const parsePreference = (
  raw: string | null,
): BiometricLoginPreference | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<BiometricLoginPreference>;
    if (
      parsed.enabled === true &&
      typeof parsed.userId === "string" &&
      typeof parsed.email === "string"
    ) {
      return {
        enabled: true,
        userId: parsed.userId,
        email: parsed.email,
        label: parsed.label || DEFAULT_BIOMETRIC_LABEL,
        updatedAt: parsed.updatedAt || new Date(0).toISOString(),
      };
    }
  } catch {
    return null;
  }
  return null;
};

export const getBiometricAvailability =
  async (): Promise<BiometricAvailability> => {
    if (!isNative) {
      return {
        available: false,
        label: DEFAULT_BIOMETRIC_LABEL,
        reason: "Entrada biométrica disponível apenas no app mobile.",
      };
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync().catch(
      () => false,
    );
    if (!hasHardware) {
      return {
        available: false,
        label: DEFAULT_BIOMETRIC_LABEL,
        reason: "Este aparelho não possui biometria compatível.",
      };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync().catch(
      () => false,
    );
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
      .catch(() => [] as LocalAuthentication.AuthenticationType[]);
    const label = getBiometricLabel(types);

    if (!isEnrolled) {
      return {
        available: false,
        label,
        reason: "Cadastre biometria ou desbloqueio facial no aparelho.",
      };
    }

    return { available: true, label };
  };

export const loadBiometricLoginPreference = async () =>
  parsePreference(await AsyncStorage.getItem(getPreferenceKey()));

export const canUseBiometricLogin = async (userId?: string) => {
  const [availability, preference] = await Promise.all([
    getBiometricAvailability(),
    loadBiometricLoginPreference(),
  ]);

  if (!availability.available || !preference?.enabled) return false;
  if (userId && preference.userId !== userId) return false;
  return true;
};

export const saveBiometricLoginPreference = async (
  usuario: Usuario,
  label: string,
) => {
  const preference: BiometricLoginPreference = {
    enabled: true,
    userId: usuario.id,
    email: usuario.email,
    label: label || DEFAULT_BIOMETRIC_LABEL,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(getPreferenceKey(), JSON.stringify(preference));
  return preference;
};

export const clearBiometricLoginPreference = async () => {
  await AsyncStorage.removeItem(getPreferenceKey());
};

export const authenticateWithBiometrics = async (
  promptMessage = BIOMETRIC_PROMPT_TITLE,
) => {
  const availability = await getBiometricAvailability();
  if (!availability.available) {
    return {
      success: false,
      label: availability.label,
      message: availability.reason || "Biometria indisponível.",
    };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: "Usar senha",
    fallbackLabel: "Usar código do aparelho",
    disableDeviceFallback: false,
    requireConfirmation: false,
  });

  return {
    success: result.success,
    label: availability.label,
    message: result.success ? undefined : "Autenticação não confirmada.",
  };
};

export const enableBiometricLogin = async (usuario: Usuario) => {
  const availability = await getBiometricAvailability();
  if (!availability.available) {
    return {
      success: false,
      preference: null,
      message: availability.reason || "Biometria indisponível.",
    };
  }

  const result = await authenticateWithBiometrics(
    `Confirmar ${availability.label}`,
  );
  if (!result.success) {
    return {
      success: false,
      preference: null,
      message: result.message || "Não foi possível confirmar a biometria.",
    };
  }

  const preference = await saveBiometricLoginPreference(
    usuario,
    availability.label,
  );

  return { success: true, preference, message: undefined };
};
