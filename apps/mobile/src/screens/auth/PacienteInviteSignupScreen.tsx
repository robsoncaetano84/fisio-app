import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, useToast } from "../../components/ui";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { api } from "../../services";
import { useAuthStore } from "../../stores/authStore";
import { useLanguage } from "../../i18n/LanguageProvider";
import {
  PacienteInviteAcceptResponse,
  PacienteInviteDadosResponse,
  PacienteInviteRegisterResponse,
  RootStackParamList,
  UserRole,
} from "../../types";
import { parseApiError } from "../../utils/apiErrors";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PacienteInviteSignup">;
  route: RouteProp<RootStackParamList, "PacienteInviteSignup">;
};

type RegistroResponse = {
  message: string;
  usuario: { id: string; nome: string; email: string };
};

const LEGAL_TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL ||
  "https://fisio-frontend.onrender.com/termos";
const LEGAL_PRIVACY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_URL ||
  "https://fisio-frontend.onrender.com/privacidade";
const LEGAL_VERSION = process.env.EXPO_PUBLIC_LEGAL_VERSION || "v2026.04";

export function PacienteInviteSignupScreen({ navigation, route }: Props) {
  const { t } = useLanguage();
  const conviteFromRoute = useMemo(() => {
    const routeToken = (route.params?.convite || "").trim();
    if (routeToken) return routeToken;

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const queryToken = new URLSearchParams(window.location.search)
        .get("convite")
        ?.trim();
      if (queryToken) return queryToken;
    }

    return "";
  }, [route.params?.convite]);
  const [conviteToken, setConviteToken] = useState(conviteFromRoute);
  const {
    applySession,
    isAuthenticated,
    usuario,
    logout,
  } = useAuthStore();
  const { showToast } = useToast();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [consentTermsRequired, setConsentTermsRequired] = useState(false);
  const [consentPrivacyRequired, setConsentPrivacyRequired] = useState(false);
  const [consentResearchOptional, setConsentResearchOptional] = useState(false);
  const [consentAiOptional, setConsentAiOptional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  const [autoAcceptTried, setAutoAcceptTried] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasInviteToken = !!conviteToken.trim();
  const canSubmitWithRequiredConsents =
    consentTermsRequired && consentPrivacyRequired;
  const isAuthenticatedPatient =
    isAuthenticated && usuario?.role === UserRole.PACIENTE;
  const isAuthenticatedNonPatient =
    isAuthenticated && usuario?.role !== UserRole.PACIENTE;
  const showAlreadyLinkedAlert = () => {
    Alert.alert(
      "Vínculo já existente",
      "Este paciente já está vinculado a outro profissional. Para vincular com um novo profissional, primeiro é necessário desvincular do profissional atual.",
    );
  };

  const isExistingEmailError = (message: string) => {
    const normalized = (message || "").toLowerCase();
    return (
      normalized.includes("e-mail ja cadastrado") ||
      normalized.includes("e-mail j? cadastrado") ||
      normalized.includes("ja possui cadastro") ||
      normalized.includes("j? possui cadastro")
    );
  };
  const isAlreadyLinkedError = (message: string) => {
    const normalized = (message || "").toLowerCase();
    return (
      normalized.includes("ja vinculado a outro cadastro") ||
      normalized.includes("j? vinculado a outro cadastro") ||
      normalized.includes("paciente ja possui usuario vinculado") ||
      normalized.includes("paciente j? possui usu?rio vinculado")
    );
  };


  useEffect(() => {
    setConviteToken(conviteFromRoute);
  }, [conviteFromRoute]);

  useEffect(() => {
    if (!hasInviteToken || isAuthenticated) return;

    let mounted = true;
    void (async () => {
      try {
        const response = await api.get<PacienteInviteDadosResponse>(
          "/auth/paciente-convite-dados",
          {
            params: { conviteToken: conviteToken.trim() },
          },
        );
        if (!mounted) return;
        setNome(response.data.nome || "");
        setEmail(response.data.email || "");
      } catch {
        // No-op: manter preenchimento manual quando não for possível buscar dados.
      }
    })();

    return () => {
      mounted = false;
    };
  }, [conviteToken, hasInviteToken, isAuthenticated]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!nome.trim()) next.nome = t("inviteSignup.requiredName");
    if (!email.trim()) next.email = t("inviteSignup.requiredEmail");
    if (!senha) next.senha = t("inviteSignup.requiredPassword");
    if (senha.length < 8) next.senha = t("inviteSignup.minPassword");
    if (!confirmacaoSenha) {
      next.confirmacaoSenha = t("inviteSignup.confirmPasswordRequired");
    }
    if (senha && confirmacaoSenha && senha !== confirmacaoSenha) {
      next.confirmacaoSenha = t("inviteSignup.passwordsMismatch");
    }
    if (!consentTermsRequired) {
      next.consentTermsRequired = t("inviteSignup.requiredTermsConsent");
    }
    if (!consentPrivacyRequired) {
      next.consentPrivacyRequired = t("inviteSignup.requiredPrivacyConsent");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      if (hasInviteToken) {
        const response = await api.post<PacienteInviteRegisterResponse>(
          "/auth/registro-paciente-convite",
          {
            conviteToken: conviteToken.trim(),
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            senha,
            consentTermsRequired,
            consentPrivacyRequired,
            consentResearchOptional,
            consentAiOptional,
          },
        );
        await applySession(response.data);
        showToast({
          message: response.data.vinculadoAutomaticamente
            ? t("inviteSignup.successLinked")
            : t("inviteSignup.successPendingLink"),
          type: "success",
        });
        navigation.reset({
          index: 0,
          routes: [{ name: "PacienteHome" }],
        });
        return;
      }

      await api.post<RegistroResponse>("/auth/registro", {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        role: UserRole.PACIENTE,
        consentTermsRequired,
        consentPrivacyRequired,
        consentResearchOptional,
        consentAiOptional,
      });

      if (isAuthenticated) {
        await logout();
      }
      showToast({
        message: t("inviteSignup.successNoInvite"),
        type: "success",
      });
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      if (Object.keys(fieldErrors).length) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }

      if (isExistingEmailError(message) && hasInviteToken) {
        Alert.alert(
          "Conta ja existente",
          "Este e-mail ja possui cadastro. Faca login para aceitar o convite.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Ir para login", onPress: handleLoginExistingAccount },
          ],
        );
        return;
      }

      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!hasInviteToken) {
      showToast({ message: t("inviteSignup.invalidInvite"), type: "error" });
      return;
    }

    try {
      setAcceptingInvite(true);
      await api.post<PacienteInviteAcceptResponse>(
        "/auth/aceitar-paciente-convite",
        { conviteToken: conviteToken.trim() },
      );
      showToast({ message: t("inviteSignup.acceptSuccess"), type: "success" });
      navigation.navigate("PacienteHome");
    } catch (error) {
      const { message } = parseApiError(error);
      if (isAlreadyLinkedError(message)) {
        showAlreadyLinkedAlert();
        return;
      }
      showToast({ message, type: "error" });
    } finally {
      setAcceptingInvite(false);
    }
  };

  useEffect(() => {
    if (!hasInviteToken || !isAuthenticatedPatient || autoAcceptTried) return;

    setAutoAcceptTried(true);
    void (async () => {
      try {
        setAcceptingInvite(true);
        await api.post<PacienteInviteAcceptResponse>(
          "/auth/aceitar-paciente-convite",
          { conviteToken: conviteToken.trim() },
        );
        showToast({ message: t("inviteSignup.acceptSuccess"), type: "success" });
        navigation.navigate("PacienteHome");
      } catch (error) {
        const { message } = parseApiError(error);
        if (isAlreadyLinkedError(message)) {
          showAlreadyLinkedAlert();
          return;
        }
        showToast({ message, type: "error" });
      } finally {
        setAcceptingInvite(false);
      }
    })();
  }, [
    autoAcceptTried,
    conviteToken,
    hasInviteToken,
    isAuthenticatedPatient,
    navigation,
    showToast,
    t,
  ]);

  const handleLoginExistingAccount = () => {
    navigation.navigate("Login", { convite: conviteToken.trim() });
  };

  const handleSwitchAccount = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: "Login", params: { convite: conviteToken.trim() } }],
      });
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ message, type: "error" });
    }
  };

  const openLegalLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) return;
      await Linking.openURL(url);
    } catch {
      // no-op
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            {hasInviteToken ? t("inviteSignup.title") : t("inviteSignup.noTokenTitle")}
          </Text>
          <Text style={styles.subtitle}>
            {hasInviteToken
              ? t("inviteSignup.withTokenSubtitle")
              : t("inviteSignup.noTokenSubtitle")}
          </Text>

          {hasInviteToken ? (
            <Input
              label={t("inviteSignup.inviteTokenLabel")}
              value={conviteToken}
              onChangeText={setConviteToken}
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="key-outline"
              error={errors.convite}
              editable={false}
              hint={t("inviteSignup.inviteDetected")}
            />
          ) : null}

          {hasInviteToken && isAuthenticatedPatient ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>{t("inviteSignup.acceptTitle")}</Text>
              <Text style={styles.stateText}>
                {t("inviteSignup.acceptSubtitle", { email: usuario?.email || "" })}
              </Text>
              <Button
                title={t("inviteSignup.acceptInvite")}
                onPress={handleAcceptInvite}
                loading={acceptingInvite}
                fullWidth
                size="lg"
              />
            </View>
          ) : null}

          {hasInviteToken && isAuthenticatedNonPatient ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>{t("inviteSignup.nonPatientTitle")}</Text>
              <Text style={styles.stateText}>
                {t("inviteSignup.nonPatientSubtitle")}
              </Text>
              <Button
                title={t("inviteSignup.switchAccount")}
                onPress={handleSwitchAccount}
                variant="outline"
                fullWidth
                size="lg"
              />
            </View>
          ) : null}

          {!isAuthenticated && hasInviteToken ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>{t("inviteSignup.existingAccountTitle")}</Text>
              <Text style={styles.stateText}>
                {t("inviteSignup.existingAccountSubtitle")}
              </Text>
              <Button
                title={t("inviteSignup.loginToAccept")}
                onPress={handleLoginExistingAccount}
                variant="outline"
                fullWidth
                size="lg"
              />
            </View>
          ) : null}

          {!isAuthenticated && (
            <>
              <Input
                label={t("inviteSignup.fullNameLabel")}
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
                leftIcon="person-outline"
                error={errors.nome}
              />
              <Input
                label={t("inviteSignup.emailLabel")}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon="mail-outline"
                error={errors.email}
              />
              <Input
                label={t("inviteSignup.passwordLabel")}
                value={senha}
                onChangeText={setSenha}
                isPassword
                leftIcon="lock-closed-outline"
                error={errors.senha}
              />
              <Input
                label={t("inviteSignup.confirmPasswordLabel")}
                value={confirmacaoSenha}
                onChangeText={setConfirmacaoSenha}
                isPassword
                leftIcon="lock-closed-outline"
                error={errors.confirmacaoSenha}
              />

              <View style={styles.consentCard}>
                <Text style={styles.consentTitle}>
                  {t("inviteSignup.consentTitle")}
                </Text>
                <Text style={styles.consentDescription}>
                  {t("inviteSignup.consentDescription")}
                </Text>
                <Text style={styles.legalText}>
                  Versão dos termos: {LEGAL_VERSION}
                </Text>
                <View style={styles.legalLinksRow}>
                  <Pressable onPress={() => openLegalLink(LEGAL_TERMS_URL)}>
                    <Text style={styles.legalLinkText}>Termos de uso</Text>
                  </Pressable>
                  <Text style={styles.legalSeparator}>•</Text>
                  <Pressable onPress={() => openLegalLink(LEGAL_PRIVACY_URL)}>
                    <Text style={styles.legalLinkText}>Política de privacidade</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={[
                    styles.consentItem,
                    consentTermsRequired && styles.consentItemChecked,
                  ]}
                  onPress={() => setConsentTermsRequired((prev) => !prev)}
                >
                  <Text style={styles.consentCheckbox}>
                    {consentTermsRequired ? "x" : " "}
                  </Text>
                  <Text style={styles.consentLabel}>
                    {t("inviteSignup.consentTermsLabel")}
                  </Text>
                </Pressable>
                {errors.consentTermsRequired ? (
                  <Text style={styles.consentError}>{errors.consentTermsRequired}</Text>
                ) : null}

                <Pressable
                  style={[
                    styles.consentItem,
                    consentPrivacyRequired && styles.consentItemChecked,
                  ]}
                  onPress={() => setConsentPrivacyRequired((prev) => !prev)}
                >
                  <Text style={styles.consentCheckbox}>
                    {consentPrivacyRequired ? "x" : " "}
                  </Text>
                  <Text style={styles.consentLabel}>
                    {t("inviteSignup.consentPrivacyLabel")}
                  </Text>
                </Pressable>
                {errors.consentPrivacyRequired ? (
                  <Text style={styles.consentError}>
                    {errors.consentPrivacyRequired}
                  </Text>
                ) : null}

                <Pressable
                  style={[
                    styles.consentItem,
                    consentResearchOptional && styles.consentItemChecked,
                  ]}
                  onPress={() => setConsentResearchOptional((prev) => !prev)}
                >
                  <Text style={styles.consentCheckbox}>
                    {consentResearchOptional ? "x" : " "}
                  </Text>
                  <Text style={styles.consentLabel}>
                    {t("inviteSignup.consentResearchLabel")}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.consentItem,
                    consentAiOptional && styles.consentItemChecked,
                  ]}
                  onPress={() => setConsentAiOptional((prev) => !prev)}
                >
                  <Text style={styles.consentCheckbox}>
                    {consentAiOptional ? "x" : " "}
                  </Text>
                  <Text style={styles.consentLabel}>
                    {t("inviteSignup.consentAiLabel")}
                  </Text>
                </Pressable>
              </View>

              <Button
                title={t("inviteSignup.submit")}
                onPress={handleSubmit}
                loading={loading}
                disabled={!canSubmitWithRequiredConsents}
                fullWidth
                size="lg"
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  keyboard: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: SPACING.xl,
    justifyContent: "center",
  },
  title: {
    fontSize: FONTS.sizes["2xl"],
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  stateCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  stateTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  stateText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  consentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  consentTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  consentDescription: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  legalText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: -SPACING.xs,
  },
  legalLinksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  legalLinkText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  legalSeparator: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  consentItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.sm,
  },
  consentItemChecked: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  consentCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    color: COLORS.primary,
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "700",
    fontSize: FONTS.sizes.xs,
  },
  consentLabel: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
  },
  consentError: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    marginTop: -SPACING.xs,
  },
});














