import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { APP_CONFIG } from "../constants/theme";
import { LoginResponse, UserRole, Usuario } from "../types";
import { isJsonRecord, parseJsonObject } from "../utils/safeJson";

export type StoredAuthSession = {
  token: string;
  refreshToken: string;
  usuario: Usuario;
};

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const shouldUseSecureStore = Platform.OS !== "web";

const isSecureStoreAvailable = async () => {
  if (!shouldUseSecureStore) return false;
  return SecureStore.isAvailableAsync().catch(() => false);
};

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" &&
  (Object.values(UserRole) as string[]).includes(value);

const isStoredUsuario = (value: unknown): value is Usuario =>
  isJsonRecord(value) &&
  typeof value.id === "string" &&
  typeof value.nome === "string" &&
  typeof value.email === "string" &&
  isUserRole(value.role);

const getSessionItem = async (key: string) => {
  if (await isSecureStoreAvailable()) {
    const secureValue = await SecureStore.getItemAsync(key);
    if (secureValue) return secureValue;
  }

  return AsyncStorage.getItem(key);
};

const setSessionItem = async (key: string, value: string) => {
  if (await isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(key, value, secureStoreOptions);
    await AsyncStorage.removeItem(key).catch(() => undefined);
    return;
  }

  await AsyncStorage.setItem(key, value);
};

const removeSessionItem = async (key: string) => {
  await Promise.allSettled([
    isSecureStoreAvailable().then((available) =>
      available ? SecureStore.deleteItemAsync(key) : undefined,
    ),
    AsyncStorage.removeItem(key),
  ]);
};

export const persistAuthSession = async (session: StoredAuthSession) => {
  await Promise.all([
    setSessionItem(APP_CONFIG.storage.tokenKey, session.token),
    setSessionItem(APP_CONFIG.storage.refreshTokenKey, session.refreshToken),
    setSessionItem(APP_CONFIG.storage.userKey, JSON.stringify(session.usuario)),
  ]);
};

export const persistAuthSessionResponse = async (response: LoginResponse) => {
  await persistAuthSession({
    token: response.token,
    refreshToken: response.refreshToken,
    usuario: response.usuario,
  });
};

export const persistAuthTokens = async (
  token: string,
  refreshToken: string,
) => {
  await Promise.all([
    setSessionItem(APP_CONFIG.storage.tokenKey, token),
    setSessionItem(APP_CONFIG.storage.refreshTokenKey, refreshToken),
  ]);
};

export const readStoredRefreshToken = async () =>
  getSessionItem(APP_CONFIG.storage.refreshTokenKey);

export const readStoredAuthSession =
  async (): Promise<StoredAuthSession | null> => {
    const [token, refreshToken, userJson] = await Promise.all([
      getSessionItem(APP_CONFIG.storage.tokenKey),
      getSessionItem(APP_CONFIG.storage.refreshTokenKey),
      getSessionItem(APP_CONFIG.storage.userKey),
    ]);

    if (!token || !refreshToken || !userJson) return null;

    const usuario = parseJsonObject<Record<string, unknown>>(userJson);
    if (!isStoredUsuario(usuario)) return null;

    const session = { token, refreshToken, usuario };
    await persistAuthSession(session);
    return session;
  };

export const hasStoredAuthSession = async () => {
  const session = await readStoredAuthSession();
  return !!session;
};

export const clearStoredAuthSession = async () => {
  await Promise.all([
    removeSessionItem(APP_CONFIG.storage.tokenKey),
    removeSessionItem(APP_CONFIG.storage.refreshTokenKey),
    removeSessionItem(APP_CONFIG.storage.userKey),
  ]);
};
