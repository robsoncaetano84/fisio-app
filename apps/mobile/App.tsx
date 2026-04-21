// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// APP.TSX - ENTRY POINT
// ==========================================

import React, { useEffect, useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "./src/components/ui";
import { Navigation } from "./src/navigation";
import { LanguageProvider } from "./src/i18n/LanguageProvider";
import { useAuthStore } from "./src/stores/authStore";
import { AdminCrmScreen } from "./src/screens/admin/AdminCrmScreen";
import { COLORS, FONTS, SPACING } from "./src/constants/theme";
import { UserRole } from "./src/types";
import { initSentry, Sentry } from "./src/services/sentry";

const CRM_WEB_SESSION_FLAG = "crm:web:entry";

initSentry();

function detectCrmWebRoute(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") return false;
  const path = window.location.pathname || "";
  const hash = window.location.hash || "";
  const href = window.location.href || "";
  return (
    path.startsWith("/admin/crm") ||
    hash.includes("/admin/crm") ||
    href.includes("/admin/crm") ||
    href.includes("crm=1")
  );
}

function readCrmSessionFlag(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(CRM_WEB_SESSION_FLAG) === "1";
  } catch {
    return false;
  }
}

function writeCrmSessionFlag(enabled: boolean) {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  try {
    if (enabled) {
      window.sessionStorage.setItem(CRM_WEB_SESSION_FLAG, "1");
      return;
    }
    window.sessionStorage.removeItem(CRM_WEB_SESSION_FLAG);
  } catch {
    // ignore storage failures
  }
}

function WebCrmEntry() {
  const [email, setEmail] = useState("master@teste.com");
  const [senha, setSenha] = useState("@Teste1234");
  const [error, setError] = useState("");
  const [bootstrapped, setBootstrapped] = useState(false);
  const { isAuthenticated, isLoading, usuario, login, logout, loadStoredAuth, setLoading } =
    useAuthStore();

  useEffect(() => {
    let mounted = true;
    Promise.race([
      loadStoredAuth().catch(() => undefined),
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]).finally(() => {
      if (!mounted) return;
      setBootstrapped(true);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [loadStoredAuth, setLoading]);

  const isAdmin = usuario?.role === UserRole.ADMIN;
  const title = useMemo(
    () => (isAuthenticated ? "CRM (ADM Master)" : "Login CRM (ADM Master)"),
    [isAuthenticated],
  );

  const handleLogin = async () => {
    setError("");
    try {
      writeCrmSessionFlag(true);
      await login({ identificador: email.trim(), senha });
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha no login");
    }
  };

  if (!bootstrapped) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.bootText}>Carregando CRM...</Text>
      </View>
    );
  }

  if (isAuthenticated && isAdmin) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.crmTopBar}>
          <Text style={styles.crmTopBarTitle}>{title}</Text>
          <View style={styles.crmTopBarRight}>
            <Text style={styles.crmTopBarMeta}>{usuario?.email}</Text>
            <Pressable
              onPress={() => {
                writeCrmSessionFlag(false);
                logout().catch(() => undefined);
              }}
              style={styles.topBtn}
            >
              <Text style={styles.topBtnText}>Sair</Text>
            </Pressable>
          </View>
        </View>
        <SafeAreaProvider>
          <AdminCrmScreen />
        </SafeAreaProvider>
      </View>
    );
  }

  return (
    <View style={styles.loginWrap}>
      <View style={styles.loginCard}>
        <Text style={styles.loginTitle}>{title}</Text>
        <Text style={styles.loginSubtitle}>Acesso exclusivo para administrador master</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          placeholder="E-mail"
          placeholderTextColor={COLORS.gray400}
        />
        <TextInput
          style={styles.input}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          placeholder="Senha"
          placeholderTextColor={COLORS.gray400}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {isAuthenticated && !isAdmin ? (
          <Text style={styles.errorText}>Usuário autenticado sem perfil ADMIN.</Text>
        ) : null}

        <Pressable style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>
            {isLoading ? "Entrando..." : "Entrar no CRM"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function AppRoot() {
  const { usuario, isAuthenticated } = useAuthStore();
  const [isCrmWebRoute, setIsCrmWebRoute] = useState(
    () => detectCrmWebRoute() || readCrmSessionFlag(),
  );

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    document.documentElement.setAttribute("lang", "pt-BR");
    document.documentElement.setAttribute("translate", "no");
    document.documentElement.classList.add("notranslate");
    document.body?.setAttribute("translate", "no");
    document.body?.classList.add("notranslate");

    const selector = 'meta[name="google"][content="notranslate"]';
    if (!document.head.querySelector(selector)) {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "google");
      meta.setAttribute("content", "notranslate");
      document.head.appendChild(meta);
    }
  }, []);

  useEffect(() => {
    const isCrm = detectCrmWebRoute() || readCrmSessionFlag();
    writeCrmSessionFlag(isCrm);
    setIsCrmWebRoute(isCrm);
  }, []);

  useEffect(() => {
    if (isAuthenticated && usuario) {
      Sentry.setUser({
        id: usuario.id,
        email: usuario.email,
        username: usuario.nome,
        role: usuario.role,
      } as any);
      return;
    }
    Sentry.setUser(null);
  }, [isAuthenticated, usuario]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <ToastProvider>
        <LanguageProvider>
          {isCrmWebRoute ? <WebCrmEntry /> : <Navigation />}
        </LanguageProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(AppRoot);

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  bootText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  crmTopBar: {
    minHeight: 48,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.base,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.base,
  },
  crmTopBarTitle: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: FONTS.sizes.base,
  },
  crmTopBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  crmTopBarMeta: {
    color: COLORS.white,
    opacity: 0.95,
    fontSize: FONTS.sizes.xs,
  },
  topBtn: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  topBtnText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  loginWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F5F8",
    padding: SPACING.base,
  },
  loginCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  loginTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: "800",
  },
  loginSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    backgroundColor: "#FBFCFE",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
  },
  errorText: {
    color: "#B52828",
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  loginButton: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  loginButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: FONTS.sizes.sm,
  },
});


