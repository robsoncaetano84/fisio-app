import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, useToast } from "../../components/ui";
import { useAuthStore } from "../../stores/authStore";
import { api } from "../../services";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { RootStackParamList, UserRole } from "../../types";
import { parseApiError } from "../../utils/apiErrors";
import { useLanguage } from "../../i18n/LanguageProvider";

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
  route: RouteProp<RootStackParamList, "Login">;
};

export function LoginScreen({ navigation, route }: LoginScreenProps) {
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [errors, setErrors] = useState<{
    identificador?: string;
    senha?: string;
  }>({});

  const conviteToken = useMemo(
    () => (route.params?.convite || "").trim(),
    [route.params?.convite],
  );
  const { login, isLoading, setPendingInviteToken, clearPendingInviteToken } =
    useAuthStore();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const validate = (): boolean => {
    const newErrors: { identificador?: string; senha?: string } = {};
    const rawLogin = identificador.trim();
    const cpfDigits = rawLogin.replace(/\D/g, "");
    const isEmail = /\S+@\S+\.\S+/.test(rawLogin);
    const isCpf = cpfDigits.length === 11;

    if (!rawLogin) {
      newErrors.identificador = "E-mail ou CPF é obrigatório";
    } else if (!isEmail && !isCpf) {
      newErrors.identificador = "Digite um e-mail válido ou CPF com 11 dígitos";
    }

    if (!senha) {
      newErrors.senha = t("login.passwordRequired");
    } else if (senha.length < 6) {
      newErrors.senha = t("login.passwordMin");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      const response = await login({
        identificador: identificador.trim(),
        senha,
      });
      if (conviteToken) {
        if (response.usuario.role === UserRole.PACIENTE) {
          setPendingInviteToken(conviteToken);
        } else {
          clearPendingInviteToken();
          showToast({
            message: t("inviteSignup.loginMustBePatient"),
            type: "error",
          });
        }
      }
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      if (Object.keys(fieldErrors).length) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      showToast({ message, type: "error" });
    }
  };

  const handleForgotPassword = async () => {
    const normalizedInput = identificador.trim();
    const normalizedEmail = normalizedInput.toLowerCase();

    if (!normalizedEmail) {
      setErrors((prev) => ({
        ...prev,
        identificador: t("login.recoveryEmailHint"),
      }));
      showToast({ message: t("login.recoveryEmailInfo"), type: "info" });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setErrors((prev) => ({
        ...prev,
        identificador: "Para recuperar senha, informe um e-mail válido",
      }));
      showToast({
        message: "Recuperação de senha funciona apenas com e-mail",
        type: "error",
      });
      return;
    }

    try {
      setIsSendingReset(true);
      await api.post("/auth/forgot-password", { email: normalizedEmail });
      showToast({
        message: t("login.recoverySent"),
        type: "success",
      });
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      if (Object.keys(fieldErrors).length) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      showToast({ message, type: "error" });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => navigation.navigate("PublicSettings")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={COLORS.gray600}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/synap-logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.subtitle}>{t("login.subtitle")}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="E-mail ou CPF"
              placeholder="E-mail ou CPF"
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              value={identificador}
              onChangeText={setIdentificador}
              error={errors.identificador}
              leftIcon="mail-outline"
            />

            <Input
              label={t("login.passwordLabel")}
              placeholder={t("Senha")}
              value={senha}
              onChangeText={setSenha}
              error={errors.senha}
              leftIcon="lock-closed-outline"
              isPassword
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
              disabled={isLoading || isSendingReset}
            >
              <Text style={styles.forgotPasswordText}>
                {t("login.forgotPassword")}
              </Text>
            </TouchableOpacity>

            <Button
              title={t("login.enter")}
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("login.noAccount")}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("SignupProfileSelect")}
            >
              <Text style={styles.registerLink}>{t("login.signup")}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.inviteLinkContainer}
            onPress={() =>
              navigation.navigate(
                "PacienteInviteSignup",
                conviteToken ? { convite: conviteToken } : undefined,
              )
            }
          >
            <Text style={styles.inviteLinkText}>{t("login.inviteSignup")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING["3xl"],
  },
  headerTopRow: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: SPACING.sm,
  },
  settingsButton: {
    padding: SPACING.sm,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  logoContainer: {
    width: 560,
    height: 210,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: FONTS.sizes["3xl"],
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  form: {
    marginBottom: SPACING.xl,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  registerLink: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: "600",
  },
  inviteLinkContainer: {
    marginTop: SPACING.base,
    alignItems: "center",
  },
  inviteLinkText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
