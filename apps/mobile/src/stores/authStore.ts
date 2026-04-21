import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthState, Usuario, LoginCredentials, LoginResponse } from "../types";
import { APP_CONFIG } from "../constants/theme";
import { api, setOnSessionExpired, setIsLoggingOut } from "../services";

interface AuthStore extends AuthState {
  pendingInviteToken: string | null;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  applySession: (response: LoginResponse) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setPendingInviteToken: (token: string | null) => void;
  clearPendingInviteToken: () => void;
  updateUsuario: (usuario: Usuario) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  usuario: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  pendingInviteToken: null,

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setPendingInviteToken: (token: string | null) => {
    set({ pendingInviteToken: token?.trim() || null });
  },

  clearPendingInviteToken: () => {
    set({ pendingInviteToken: null });
  },

  updateUsuario: async (usuario: Usuario) => {
    const token = useAuthStore.getState().token;
    const refreshToken = useAuthStore.getState().refreshToken;

    await AsyncStorage.setItem(APP_CONFIG.storage.userKey, JSON.stringify(usuario));

    set({
      usuario,
      token,
      refreshToken,
      isAuthenticated: !!token,
    });
  },

  applySession: async (response: LoginResponse) => {
    setIsLoggingOut(false);
    const { token, refreshToken, usuario } = response;

    await AsyncStorage.setItem(APP_CONFIG.storage.tokenKey, token);
    await AsyncStorage.setItem(APP_CONFIG.storage.refreshTokenKey, refreshToken);
    await AsyncStorage.setItem(APP_CONFIG.storage.userKey, JSON.stringify(usuario));

    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    set({
      usuario,
      token,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  login: async (credentials: LoginCredentials) => {
    setIsLoggingOut(false);
    try {
      set({ isLoading: true });

      const response = await api.post<LoginResponse>("/auth/login", credentials);
      const { token, refreshToken, usuario } = response.data;
      await AsyncStorage.setItem(APP_CONFIG.storage.tokenKey, token);
      await AsyncStorage.setItem(APP_CONFIG.storage.refreshTokenKey, refreshToken);
      await AsyncStorage.setItem(APP_CONFIG.storage.userKey, JSON.stringify(usuario));
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      set({
        usuario,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    setIsLoggingOut(true);
    set({ isLoading: true });

    try {
      await Promise.allSettled([
        AsyncStorage.removeItem(APP_CONFIG.storage.tokenKey),
        AsyncStorage.removeItem(APP_CONFIG.storage.refreshTokenKey),
        AsyncStorage.removeItem(APP_CONFIG.storage.userKey),
      ]);
    } finally {
      delete api.defaults.headers.common.Authorization;
      set({
        usuario: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        pendingInviteToken: null,
      });
    }
  },

  loadStoredAuth: async () => {
    try {
      set({ isLoading: true });

      const token = await AsyncStorage.getItem(APP_CONFIG.storage.tokenKey);
      const refreshToken = await AsyncStorage.getItem(
        APP_CONFIG.storage.refreshTokenKey,
      );
      const userJson = await AsyncStorage.getItem(APP_CONFIG.storage.userKey);

      if (token && refreshToken && userJson) {
        const usuario: Usuario = JSON.parse(userJson);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;

        set({
          usuario,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      if (__DEV__) {
        console.warn("[authStore] loadStoredAuth failed");
      }
      set({ isLoading: false });
    }
  },
}));

setOnSessionExpired(async () => {
  const { logout } = useAuthStore.getState();
  await logout();
});
