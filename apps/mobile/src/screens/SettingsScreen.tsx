// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// SETTINGS SCREEN
// ==========================================
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, LanguageSelector } from "../components/ui";
import {
  BORDER_RADIUS,
  COLORS,
  FONTS,
  SHADOWS,
  SPACING,
} from "../constants/theme";
import { useAuthStore } from "../stores/authStore";
import { UserRole, Usuario } from "../types";
import { useToast } from "../components/ui";
import { api } from "../services";
import { isLikelyNetworkError, parseApiError } from "../utils/apiErrors";
import { isMasterAdminUser } from "../utils/masterAdmin";
import { FEATURE_FLAGS } from "../constants/featureFlags";

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

type ProfileForm = {
  nome: string;
  conselhoSigla: string;
  conselhoUf: string;
  registroProf: string;
  especialidade: string;
  outroConselho: string;
};

type SelectorState = {
  visible: boolean;
  title: string;
  options: string[];
  onSelect: (value: string) => void;
};

const buildFormFromUsuario = (usuario: Usuario | null): ProfileForm => {
  const incomingSigla = usuario?.conselhoSigla?.trim().toUpperCase() || "";
  const matched = CONSELHOS.find((c) => c === incomingSigla);
  return {
    nome: usuario?.nome || "",
    conselhoSigla: matched || (incomingSigla ? "OUTRO" : ""),
    conselhoUf: usuario?.conselhoUf?.trim().toUpperCase() || "",
    registroProf: usuario?.registroProf || "",
    especialidade: usuario?.especialidade || "",
    outroConselho: matched ? "" : incomingSigla,
  };
};

export function SettingsScreen() {
  const { usuario, logout, updateUsuario } = useAuthStore();
  const { showToast } = useToast();
  const [unlinkingProfessional, setUnlinkingProfessional] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const [form, setForm] = useState<ProfileForm>(() =>
    buildFormFromUsuario(usuario),
  );
  const [consentResearchOptional, setConsentResearchOptional] = useState(
    !!usuario?.consentResearchOptional,
  );
  const [consentAiOptional, setConsentAiOptional] = useState(
    !!usuario?.consentAiOptional,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selector, setSelector] = useState<SelectorState>({
    visible: false,
    title: "",
    options: [],
    onSelect: () => undefined,
  });

  const canAccessAdminCrm =
    Platform.OS === "web" &&
    FEATURE_FLAGS.crmAdminWeb !== false &&
    isMasterAdminUser(usuario);
  const isProfessional = usuario?.role !== UserRole.PACIENTE;

  useEffect(() => {
    if (!isEditingProfile) {
      setForm(buildFormFromUsuario(usuario));
      setErrors({});
    }
    setConsentResearchOptional(!!usuario?.consentResearchOptional);
    setConsentAiOptional(!!usuario?.consentAiOptional);
  }, [usuario, isEditingProfile]);

  const roleLabel = useMemo(() => {
    switch (usuario?.role) {
      case UserRole.ADMIN:
        return "Administrador";
      case UserRole.PACIENTE:
        return "Paciente";
      case UserRole.USER:
      default:
        return "Profissional";
    }
  }, [usuario?.role]);

  const openSelector = (
    title: string,
    options: string[],
    onSelect: (value: string) => void,
  ) => {
    setSelector({ visible: true, title, options, onSelect });
  };

  const closeSelector = () => {
    setSelector((prev) => ({ ...prev, visible: false }));
  };

  const handleUnlinkProfessional = () => {
    Alert.alert(
      "Desvincular profissional",
      "Ao confirmar, seu acesso a este acompanhamento será removido até que um novo vínculo seja aprovado.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desvincular",
          style: "destructive",
          onPress: async () => {
            try {
              setUnlinkingProfessional(true);
              await api.post("/pacientes/me/desvincular-profissional");
              showToast({
                message: "Vínculo removido com sucesso",
                type: "success",
              });
              await logout();
            } catch {
              showToast({
                message: "Não foi possível remover o vínculo",
                type: "error",
              });
            } finally {
              setUnlinkingProfessional(false);
            }
          },
        },
      ],
    );
  };

  const performLogout = async () => {
    try {
      await logout();
      showToast({ message: "Sessão encerrada", type: "success" });
    } catch {
      showToast({ message: "Não foi possível sair", type: "error" });
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      performLogout();
      return;
    }

    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: performLogout },
    ]);
  };

  const openLegalLink = async (url: string) => {
    try {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        if (url.startsWith("/")) {
          window.location.assign(url);
          return;
        }
      }
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        showToast({ type: "error", message: "Não foi possível abrir o link" });
        return;
      }
      await Linking.openURL(url);
    } catch {
      showToast({ type: "error", message: "Não foi possível abrir o link" });
    }
  };

  const handleUpdateOptionalConsent = async (
    next: Partial<Pick<Usuario, "consentResearchOptional" | "consentAiOptional">>,
  ) => {
    if (!usuario || usuario.role !== UserRole.PACIENTE) return;
    try {
      setSavingConsent(true);
      const response = await api.patch<Usuario>("/auth/me", next, {
        timeout: 30000,
      });
      await updateUsuario(response.data);
      showToast({
        type: "success",
        message: "Consentimentos atualizados com sucesso",
      });
    } catch {
      setConsentResearchOptional(!!usuario?.consentResearchOptional);
      setConsentAiOptional(!!usuario?.consentAiOptional);
      showToast({
        type: "error",
        message: "Não foi possível atualizar os consentimentos",
      });
    } finally {
      setSavingConsent(false);
    }
  };

  const validateProfessionalProfile = () => {
    const next: Record<string, string> = {};

    if (!form.nome.trim()) {
      next.nome = "Nome obrigatório";
    }

    if (isProfessional) {
      if (!form.conselhoSigla.trim()) {
        next.conselhoSigla = "Conselho obrigatório";
      }
      if (form.conselhoSigla === "OUTRO" && !form.outroConselho.trim()) {
        next.outroConselho = "Informe o conselho";
      }
      if (!form.conselhoUf.trim()) {
        next.conselhoUf = "UF obrigatória";
      }
      if (!form.registroProf.trim()) {
        next.registroProf = "Registro profissional obrigatório";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleStartEdit = () => {
    setForm(buildFormFromUsuario(usuario));
    setErrors({});
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setForm(buildFormFromUsuario(usuario));
    setErrors({});
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!validateProfessionalProfile()) return;

    const resolvedConselhoSigla =
      form.conselhoSigla === "OUTRO"
        ? form.outroConselho.trim().toUpperCase()
        : form.conselhoSigla;

    const payload = {
      nome: form.nome.trim(),
      ...(isProfessional
        ? {
            conselhoSigla: resolvedConselhoSigla,
            conselhoUf: form.conselhoUf.trim().toUpperCase(),
            registroProf: form.registroProf.trim(),
            especialidade: form.especialidade.trim(),
          }
        : {}),
    };

    try {
      setSavingProfile(true);

      const response = await api.patch<Usuario>("/auth/me", payload, {
        timeout: 45000,
      });

      await updateUsuario(response.data);
      setIsEditingProfile(false);
      showToast({ type: "success", message: "Conta atualizada com sucesso" });
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      const maybeAxios = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = maybeAxios?.response?.status;
      const backendMessage = String(maybeAxios?.response?.data?.message || "");

      setErrors((prev) => ({ ...prev, ...fieldErrors }));

      if (
        status === 404 &&
        /Cannot PATCH \/api\/auth\/me/i.test(backendMessage)
      ) {
        showToast({
          type: "error",
          message:
            "Backend desatualizado para edicao de perfil. Publique a versao com PATCH /api/auth/me.",
        });
      } else if (isLikelyNetworkError(error)) {
        try {
          const retryResponse = await api.patch<Usuario>("/auth/me", payload, {
            timeout: 90000,
          });
          await updateUsuario(retryResponse.data);
          setIsEditingProfile(false);
          showToast({
            type: "success",
            message: "Conta atualizada com sucesso",
          });
        } catch {
          showToast({
            type: "error",
            message:
              "Servidor demorou para responder. Tente novamente em alguns segundos",
          });
        }
      } else {
        showToast({ type: "error", message });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="settings-outline"
              size={22}
              color={COLORS.primary}
            />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.title}>{"Configurações"}</Text>
            <Text style={styles.subtitle}>
              {"Preferências da conta atual (usuário ou paciente logado)"}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Conta</Text>
            {isProfessional && !isEditingProfile ? (
              <Pressable style={styles.editChip} onPress={handleStartEdit}>
                <Ionicons
                  name="create-outline"
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.editChipText}>Editar</Text>
              </Pressable>
            ) : null}
          </View>

          {isEditingProfile ? (
            <>
              <Input
                label="Nome"
                value={form.nome}
                onChangeText={(v) => setForm((prev) => ({ ...prev, nome: v }))}
                error={errors.nome}
                leftIcon="person-outline"
              />

              <View style={styles.row}>
                <Text style={styles.label}>E-mail</Text>
                <Text style={styles.value}>{usuario?.email || "-"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Perfil</Text>
                <Text style={styles.value}>{roleLabel}</Text>
              </View>

              {isProfessional ? (
                <>
                  <Text style={styles.inputLabel}>Conselho profissional</Text>
                  <Pressable
                    style={styles.comboField}
                    onPress={() =>
                      openSelector(
                        "Conselho profissional",
                        [...CONSELHOS],
                        (value) =>
                          setForm((prev) => ({
                            ...prev,
                            conselhoSigla: value,
                          })),
                      )
                    }
                  >
                    <Text style={styles.comboValue}>
                      {form.conselhoSigla === "OUTRO"
                        ? "Outro"
                        : form.conselhoSigla || "Selecione"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={COLORS.textSecondary}
                    />
                  </Pressable>
                  {errors.conselhoSigla ? (
                    <Text style={styles.errorText}>{errors.conselhoSigla}</Text>
                  ) : null}

                  {form.conselhoSigla === "OUTRO" ? (
                    <Input
                      label="Outro conselho"
                      value={form.outroConselho}
                      onChangeText={(v) =>
                        setForm((prev) => ({ ...prev, outroConselho: v }))
                      }
                      error={errors.outroConselho}
                      leftIcon="shield-checkmark-outline"
                      autoCapitalize="characters"
                    />
                  ) : null}

                  <Text style={styles.inputLabel}>UF do conselho</Text>
                  <Pressable
                    style={styles.comboField}
                    onPress={() =>
                      openSelector("UF do conselho", [...UFS], (value) =>
                        setForm((prev) => ({ ...prev, conselhoUf: value })),
                      )
                    }
                  >
                    <Text style={styles.comboValue}>
                      {form.conselhoUf || "Selecione"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={COLORS.textSecondary}
                    />
                  </Pressable>
                  {errors.conselhoUf ? (
                    <Text style={styles.errorText}>{errors.conselhoUf}</Text>
                  ) : null}

                  <Input
                    label="Registro profissional"
                    value={form.registroProf}
                    onChangeText={(v) =>
                      setForm((prev) => ({ ...prev, registroProf: v }))
                    }
                    error={errors.registroProf}
                    leftIcon="id-card-outline"
                    autoCapitalize="characters"
                  />

                  <Input
                    label="Especialidade (opcional)"
                    value={form.especialidade}
                    onChangeText={(v) =>
                      setForm((prev) => ({ ...prev, especialidade: v }))
                    }
                    leftIcon="medkit-outline"
                  />
                </>
              ) : null}

              <View style={styles.actionsRow}>
                <Button
                  title="Cancelar"
                  variant="outline"
                  onPress={handleCancelEdit}
                  style={styles.halfButton}
                />
                <Button
                  title="Salvar"
                  onPress={handleSaveProfile}
                  loading={savingProfile}
                  style={styles.halfButton}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Nome</Text>
                <Text style={styles.value}>{usuario?.nome || "-"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>E-mail</Text>
                <Text style={styles.value}>{usuario?.email || "-"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Perfil</Text>
                <Text style={styles.value}>{roleLabel}</Text>
              </View>
              {isProfessional ? (
                <>
                  <View style={styles.row}>
                    <Text style={styles.label}>Conselho profissional</Text>
                    <Text style={styles.value}>
                      {usuario?.conselhoProf ||
                        (usuario?.conselhoSigla && usuario?.conselhoUf
                          ? `${usuario.conselhoSigla}-${usuario.conselhoUf}`
                          : "-")}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Registro profissional</Text>
                    <Text style={styles.value}>
                      {usuario?.registroProf || "-"}
                    </Text>
                  </View>
                </>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{"Preferências"}</Text>
          <View style={styles.languageWrap}>
            <LanguageSelector />
          </View>
        </View>

        {usuario?.role === UserRole.PACIENTE ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Consentimentos opcionais</Text>
            <Text style={styles.dangerDescription}>
              Você pode alterar estes consentimentos a qualquer momento.
            </Text>
            <Pressable
              disabled={savingConsent}
              style={[
                styles.toggleRow,
                consentResearchOptional && styles.toggleRowActive,
              ]}
              onPress={() => {
                const next = !consentResearchOptional;
                setConsentResearchOptional(next);
                handleUpdateOptionalConsent({ consentResearchOptional: next });
              }}
            >
              <Ionicons
                name={consentResearchOptional ? "checkbox" : "square-outline"}
                size={18}
                color={consentResearchOptional ? COLORS.primary : COLORS.gray500}
              />
              <Text style={styles.toggleText}>
                Autorizar uso anonimizado para pesquisa e melhoria clínica
              </Text>
            </Pressable>
            <Pressable
              disabled={savingConsent}
              style={[styles.toggleRow, consentAiOptional && styles.toggleRowActive]}
              onPress={() => {
                const next = !consentAiOptional;
                setConsentAiOptional(next);
                handleUpdateOptionalConsent({ consentAiOptional: next });
              }}
            >
              <Ionicons
                name={consentAiOptional ? "checkbox" : "square-outline"}
                size={18}
                color={consentAiOptional ? COLORS.primary : COLORS.gray500}
              />
              <Text style={styles.toggleText}>
                Autorizar uso de dados/exames em sugestões assistidas por IA
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Termos e privacidade</Text>
          <Text style={styles.dangerDescription}>
            Versão atual dos documentos legais: {LEGAL_VERSION}
          </Text>
          <View style={styles.legalLinksRow}>
            <Pressable
              style={styles.legalLink}
              onPress={() => openLegalLink(LEGAL_TERMS_URL)}
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.legalLinkText}>Termos de uso</Text>
            </Pressable>
            <Pressable
              style={styles.legalLink}
              onPress={() => openLegalLink(LEGAL_PRIVACY_URL)}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.legalLinkText}>Política de privacidade</Text>
            </Pressable>
          </View>
        </View>

        {usuario?.role === UserRole.PACIENTE ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{"Vínculo com profissional"}</Text>
            <Text style={styles.dangerDescription}>
              {
                "Remova o vínculo atual somente se quiser encerrar este acompanhamento."
              }
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.dangerAction,
                pressed && styles.dangerActionPressed,
                unlinkingProfessional && styles.dangerActionDisabled,
              ]}
              onPress={handleUnlinkProfessional}
              disabled={unlinkingProfessional}
            >
              <Ionicons name="unlink-outline" size={18} color={COLORS.error} />
              <Text style={styles.dangerActionText}>
                {unlinkingProfessional
                  ? "Desvinculando..."
                  : "Desvincular profissional"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {canAccessAdminCrm ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Admin Master</Text>
            <Pressable
              style={({ pressed }) => [
                styles.adminLink,
                pressed && styles.adminLinkPressed,
              ]}
              onPress={() => openLegalLink("/admin")}
            >
              <View style={styles.adminLinkIcon}>
                <Ionicons
                  name="briefcase-outline"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.adminLinkTextWrap}>
                <Text style={styles.adminLinkTitle}>Console ADM (Web)</Text>
                <Text style={styles.adminLinkSubtitle}>
                  {"Área exclusiva para administração master"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.gray400}
              />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{"Sessão"}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.logoutAction,
              pressed && styles.logoutActionPressed,
            ]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={18} color={COLORS.white} />
            <Text style={styles.logoutActionText}>Sair da conta</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={selector.visible}
        transparent
        animationType="fade"
        onRequestClose={closeSelector}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeSelector}>
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selector.title}</Text>
              <Pressable onPress={closeSelector}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {selector.options.map((item) => (
                <Pressable
                  key={item}
                  style={styles.modalItem}
                  onPress={() => {
                    selector.onSelect(item);
                    closeSelector();
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {item === "OUTRO" ? "Outro" : item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.base,
    paddingBottom: SPACING["2xl"],
    gap: SPACING.md,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary + "14",
    borderWidth: 1,
    borderColor: COLORS.primary + "20",
  },
  heroText: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 2,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.sm,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
  },
  editChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.primary + "14",
  },
  editChipText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  value: {
    flex: 1,
    textAlign: "right",
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  inputLabel: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  comboField: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    marginBottom: SPACING.sm,
  },
  comboValue: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.base,
    fontWeight: "500",
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.xs,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.sm,
  },
  actionsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  halfButton: {
    flex: 1,
  },
  languageWrap: {
    alignItems: "flex-start",
  },
  toggleRow: {
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.gray50,
  },
  toggleRowActive: {
    borderColor: COLORS.primary + "50",
    backgroundColor: COLORS.primary + "0D",
  },
  toggleText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    lineHeight: 18,
  },
  legalLinksRow: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    gap: SPACING.sm,
  },
  legalLink: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.gray50,
  },
  legalLinkText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  adminLink: {
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  adminLinkPressed: {
    opacity: 0.9,
  },
  adminLinkIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary + "12",
  },
  adminLinkTextWrap: {
    flex: 1,
  },
  adminLinkTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  adminLinkSubtitle: {
    marginTop: 2,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  dangerDescription: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  dangerAction: {
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.white,
  },
  dangerActionPressed: {
    opacity: 0.92,
  },
  dangerActionDisabled: {
    opacity: 0.7,
  },
  dangerActionText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  logoutAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
  },
  logoutActionPressed: {
    opacity: 0.9,
  },
  logoutActionText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    maxHeight: "70%",
    ...SHADOWS.sm,
  },
  modalHeader: {
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  modalList: {
    paddingVertical: SPACING.xs,
  },
  modalItem: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  modalItemText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
});
