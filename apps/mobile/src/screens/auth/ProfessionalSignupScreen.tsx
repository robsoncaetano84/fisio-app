// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PROFESSIONAL SIGNUP SCREEN
// ==========================================
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button, Input, useToast } from "../../components/ui";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { api } from "../../services";
import { useAuthStore } from "../../stores/authStore";
import { RootStackParamList } from "../../types";
import { parseApiError } from "../../utils/apiErrors";
import { useLanguage } from "../../i18n/LanguageProvider";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ProfessionalSignup">;
};

type RegisterResponse = {
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

const CONSELHOS = [
  "CREFITO",
  "CRM",
  "COREN",
  "CREFONO",
  "CREF",
  "CRP",
  "CRN",
  "CRO",
  "OUTRO",
] as const;

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export function ProfessionalSignupScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const { login, isLoading } = useAuthStore();
  const { t } = useLanguage();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [conselhoSigla, setConselhoSigla] = useState<(typeof CONSELHOS)[number] | "">("");
  const [outroConselho, setOutroConselho] = useState("");
  const [conselhoUf, setConselhoUf] = useState<(typeof UFS)[number] | "">("");
  const [registroProf, setRegistroProf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [consentProfessionalLgpdRequired, setConsentProfessionalLgpdRequired] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const canSubmitWithConsent = consentProfessionalLgpdRequired;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!nome.trim()) next.nome = t("auth.errorNameRequired");
    if (!email.trim()) next.email = t("auth.errorEmailRequired");
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = t("auth.errorEmailInvalid");
    if (!conselhoSigla) next.conselhoSigla = t("auth.errorConselhoRequired");
    if (conselhoSigla === "OUTRO" && !outroConselho.trim()) {
      next.outroConselho = t("auth.errorConselhoRequired");
    }
    if (!conselhoUf) next.conselhoUf = t("auth.errorConselhoUfRequired");
    if (!registroProf.trim()) next.registroProf = t("auth.errorRegistroRequired");
    if (!senha) next.senha = t("auth.errorPasswordRequired");
    else if (senha.length < 8) next.senha = t("auth.errorPasswordMin");
    if (!confirmacaoSenha) next.confirmacaoSenha = t("auth.errorPasswordConfirmRequired");
    if (senha && confirmacaoSenha && senha !== confirmacaoSenha) {
      next.confirmacaoSenha = t("auth.errorPasswordMismatch");
    }
    if (!consentProfessionalLgpdRequired) {
      next.consentProfessionalLgpdRequired = t(
        "auth.errorProfessionalConsentRequired",
      );
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const resolvedConselhoSigla =
        conselhoSigla === "OUTRO" ? outroConselho.trim().toUpperCase() : conselhoSigla;

      await api.post<RegisterResponse>("/auth/registro", {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        conselhoSigla: resolvedConselhoSigla,
        conselhoUf,
        conselhoProf: `${resolvedConselhoSigla}-${conselhoUf}`,
        registroProf: registroProf.trim(),
        consentProfessionalLgpdRequired,
        senha,
      });

      await login({
        identificador: email.trim().toLowerCase(),
        senha,
      });

      showToast({
        type: "success",
        message: t("auth.signupSuccess"),
      });
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      if (Object.keys(fieldErrors).length) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      showToast({ type: "error", message });
    } finally {
      setSubmitting(false);
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
          <Text style={styles.title}>{t("auth.professionalSignupTitle")}</Text>
          <Text style={styles.subtitle}>{t("auth.professionalSignupSubtitle")}</Text>

          <Input
            label={t("auth.professionalSignupName")}
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
            leftIcon="person-outline"
            error={errors.nome}
          />
          <Input
            label={t("auth.professionalSignupEmail")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon="mail-outline"
            error={errors.email}
          />

          <View style={styles.selectorBlock}>
            <Text style={styles.selectorLabel}>{t("auth.professionalSignupConselho")}</Text>
            <View style={styles.optionsWrap}>
              {CONSELHOS.map((option) => {
                const active = conselhoSigla === option;
                return (
                  <Pressable
                    key={option}
                    style={[styles.optionChip, active && styles.optionChipActive]}
                    onPress={() => setConselhoSigla(option)}
                  >
                    <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                      {option === "OUTRO" ? t("auth.professionalSignupConselhoOther") : option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.conselhoSigla ? <Text style={styles.selectorError}>{errors.conselhoSigla}</Text> : null}
          </View>

          {conselhoSigla === "OUTRO" ? (
            <Input
              label={t("auth.professionalSignupConselhoOther")}
              value={outroConselho}
              onChangeText={setOutroConselho}
              autoCapitalize="characters"
              leftIcon="shield-checkmark-outline"
              error={errors.outroConselho}
              placeholder="Ex.: CRFA"
            />
          ) : null}

          <View style={styles.selectorBlock}>
            <Text style={styles.selectorLabel}>{t("auth.professionalSignupConselhoUf")}</Text>
            <View style={styles.optionsWrap}>
              {UFS.map((uf) => {
                const active = conselhoUf === uf;
                return (
                  <Pressable
                    key={uf}
                    style={[styles.optionChip, active && styles.optionChipActive]}
                    onPress={() => setConselhoUf(uf)}
                  >
                    <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{uf}</Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.conselhoUf ? <Text style={styles.selectorError}>{errors.conselhoUf}</Text> : null}
          </View>

          <Input
            label={t("auth.professionalSignupRegistro")}
            value={registroProf}
            onChangeText={setRegistroProf}
            autoCapitalize="characters"
            leftIcon="id-card-outline"
            error={errors.registroProf}
            placeholder="Ex.: 123456-F"
          />
          <Input
            label={t("auth.professionalSignupPassword")}
            value={senha}
            onChangeText={setSenha}
            isPassword
            leftIcon="lock-closed-outline"
            error={errors.senha}
          />
          <Input
            label={t("auth.professionalSignupPasswordConfirm")}
            value={confirmacaoSenha}
            onChangeText={setConfirmacaoSenha}
            isPassword
            leftIcon="lock-closed-outline"
            error={errors.confirmacaoSenha}
          />

          <View style={styles.selectorBlock}>
            <Text style={styles.selectorLabel}>
              {t("auth.professionalConsentTitle")}
            </Text>
            <Pressable
              style={[
                styles.optionChip,
                styles.checkboxConsent,
                consentProfessionalLgpdRequired && styles.optionChipActive,
              ]}
              onPress={() =>
                setConsentProfessionalLgpdRequired((prev) => !prev)
              }
            >
              <Text
                style={[
                  styles.checkboxMark,
                  consentProfessionalLgpdRequired && styles.checkboxMarkActive,
                ]}
              >
                {consentProfessionalLgpdRequired ? "x" : " "}
              </Text>
              <Text
                style={[
                  styles.optionChipText,
                  styles.checkboxText,
                  consentProfessionalLgpdRequired && styles.optionChipTextActive,
                ]}
              >
                {t("auth.professionalConsentLabel")}
              </Text>
            </Pressable>
            {errors.consentProfessionalLgpdRequired ? (
              <Text style={styles.selectorError}>
                {errors.consentProfessionalLgpdRequired}
              </Text>
            ) : null}
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
          </View>

          <Button
            title={t("auth.professionalSignupSubmit")}
            onPress={handleSubmit}
            loading={submitting || isLoading}
            disabled={!canSubmitWithConsent}
            fullWidth
            size="lg"
          />

          <Button
            title={t("auth.professionalSignupPatientCta")}
            onPress={() => navigation.navigate("PacienteInviteSignup")}
            variant="ghost"
            fullWidth
            style={{ marginTop: SPACING.sm }}
          />
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
  selectorBlock: {
    marginBottom: SPACING.sm,
  },
  selectorLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.white,
  },
  optionChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}1A`,
  },
  optionChipText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  optionChipTextActive: {
    color: COLORS.primary,
  },
  selectorError: {
    marginTop: SPACING.xs,
    color: COLORS.error,
    fontSize: FONTS.sizes.xs,
  },
  checkboxConsent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderRadius: 12,
    paddingVertical: SPACING.sm,
  },
  checkboxMark: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 4,
    textAlign: "center",
    lineHeight: 16,
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: FONTS.sizes.xs,
  },
  checkboxMarkActive: {
    backgroundColor: `${COLORS.primary}20`,
  },
  checkboxText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
  },
  legalText: {
    marginTop: SPACING.xs,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  legalLinksRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
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
});


