import { create } from "zustand";
import {
  AuthState,
  Usuario,
  LoginCredentials,
  LoginResponse,
} from "../types";
import {
  api,
  getRuntimeFeatureFlags,
  setOnSessionExpired,
  setOnTokenRefreshed,
  setIsLoggingOut,
} from "../services";
import { applyRuntimeFeatureFlags } from "../constants/featureFlags";
import {
  clearStoredAuthSession,
  persistAuthSession,
  persistAuthSessionResponse,
  readStoredAuthSession,
} from "../services/authSessionStorage";
import {
  authenticateWithBiometrics,
  clearBiometricLoginPreference,
  loadBiometricLoginPreference,
} from "../services/biometricAuth";

interface AuthStore extends AuthState {
  pendingInviteToken: string | null;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  loginWithBiometrics: () => Promise<LoginResponse>;
  applySession: (response: LoginResponse) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setPendingInviteToken: (token: string | null) => void;
  clearPendingInviteToken: () => void;
  updateUsuario: (usuario: Usuario) => Promise<void>;
}

const applyRuntimeFlagsWithFallback = async (featureFlags?: LoginResponse["featureFlags"]) => {
  if (featureFlags) {
    applyRuntimeFeatureFlags(featureFlags);
  }

  try {
    const runtimeFlags = await getRuntimeFeatureFlags();
    applyRuntimeFeatureFlags(runtimeFlags);
  } catch {
    // non-blocking: fallback to local defaults or login response flags
  }
};

export const useAuthStore = create<AuthStore>((set, get) => ({
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
    const token = get().token;
    const refreshToken = get().refreshToken;

    if (token && refreshToken) {
      await persistAuthSession({ token, refreshToken, usuario });
    }

    set({
      usuario,
      token,
      refreshToken,
      isAuthenticated: !!token,
    });
  },

  applySession: async (response: LoginResponse) => {
    setIsLoggingOut(false);
    const { token, refreshToken, usuario, featureFlags } = response;

    await persistAuthSessionResponse(response);
    const preference = await loadBiometricLoginPreference();
    if (preference?.enabled && preference.userId !== usuario.id) {
      await clearBiometricLoginPreference();
    }

    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    await applyRuntimeFlagsWithFallback(featureFlags);

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
      await get().applySession(response.data);
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithBiometrics: async () => {
    setIsLoggingOut(false);
    try {
      set({ isLoading: true });

      const session = await readStoredAuthSession();
      if (!session) {
        throw new Error("Sessão salva não encontrada. Entre com senha.");
      }

      const preference = await loadBiometricLoginPreference();
      if (!preference?.enabled || preference.userId !== session.usuario.id) {
        throw new Error("Entrada biométrica não está habilitada para esta conta.");
      }

      const result = await authenticateWithBiometrics("Entrar no Synap");
      if (!result.success) {
        throw new Error(result.message || "Autenticação não confirmada.");
      }

      api.defaults.headers.common.Authorization = `Bearer ${session.token}`;
      await applyRuntimeFlagsWithFallback();

      set({
        usuario: session.usuario,
        token: session.token,
        refreshToken: session.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      return session;
    } catch (error) {
      delete api.defaults.headers.common.Authorization;
      set({ isLoading: false, isAuthenticated: false });
      throw error;
    }
  },

  logout: async () => {
    setIsLoggingOut(true);
    set({ isLoading: true });

    try {
      await Promise.allSettled([
        clearStoredAuthSession(),
        clearBiometricLoginPreference(),
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

      const session = await readStoredAuthSession();

      if (session) {
        const preference = await loadBiometricLoginPreference();
        if (preference?.enabled && preference.userId !== session.usuario.id) {
          await clearBiometricLoginPreference();
        }

        if (preference?.enabled && preference.userId === session.usuario.id) {
          const result = await authenticateWithBiometrics("Entrar no Synap");
          if (!result.success) {
            delete api.defaults.headers.common.Authorization;
            set({
              usuario: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }
        }

        api.defaults.headers.common.Authorization = `Bearer ${session.token}`;
        await applyRuntimeFlagsWithFallback();

        set({
          usuario: session.usuario,
          token: session.token,
          refreshToken: session.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));

setOnTokenRefreshed(async ({ token, refreshToken }) => {
  const { usuario } = useAuthStore.getState();
  if (usuario) {
    await persistAuthSession({ token, refreshToken, usuario });
  }
  useAuthStore.setState({ token, refreshToken });
});

setOnSessionExpired(async () => {
  const { logout } = useAuthStore.getState();
  await logout();
});
