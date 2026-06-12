import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, useToast } from "../../components/ui";
import {
  BORDER_RADIUS,
  COLORS,
  FONTS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { useLanguage } from "../../i18n/LanguageProvider";
import { api } from "../../services";
import { usePacienteStore } from "../../stores/pacienteStore";
import {
  Paciente,
  PacienteAppAccessEvent,
  PacienteAppAccessState,
  PacienteAppAccessStatusResponse,
  PacienteInviteCreateResponse,
  RootStackParamList,
} from "../../types";
import { parseApiError } from "../../utils/apiErrors";
import { isUuid } from "../../utils/uuid";
import {
  buildPatientInviteMessage,
  createPacienteAppAccessFallback,
  INVITE_EXPIRATION_DAYS,
  normalizeWhatsappTarget,
} from "./patientAppAccessUtils";

type Props = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "PacienteInviteAccess"
  >;
  route: RouteProp<RootStackParamList, "PacienteInviteAccess">;
};

type LoadingAction =
  | "generate"
  | "copy-message"
  | "copy-link"
  | "share"
  | "whatsapp"
  | "revoke"
  | "unlink"
  | "refresh"
  | null;

type ActionTileProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  description: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
};

function ActionTile({
  icon,
  label,
  description,
  onPress,
  disabled,
  danger,
}: ActionTileProps) {
  const color = danger ? COLORS.error : COLORS.primary;

  return (
    <TouchableOpacity
      style={[
        styles.actionTile,
        danger ? styles.dangerTile : null,
        disabled ? styles.disabledTile : null,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.86}
      accessibilityLabel={label}
    >
      <View style={[styles.actionIcon, { borderColor: color }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.actionTextWrap}>
        <Text
          style={[styles.actionLabel, danger ? styles.dangerText : null]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text style={styles.actionDescription} numberOfLines={2}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function PacienteInviteAccessScreen({ route }: Props) {
  const { pacienteId } = route.params;
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const fetchPacienteById = usePacienteStore(
    (state) => state.fetchPacienteById,
  );
  const getPacienteById = usePacienteStore((state) => state.getPacienteById);
  const [paciente, setPaciente] = useState<Paciente | null>(
    getPacienteById(pacienteId) || null,
  );
  const [accessStatus, setAccessStatus] =
    useState<PacienteAppAccessStatusResponse | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);

  const dateLocale =
    language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";

  const formatDate = useCallback(
    (value?: string | null) => {
      if (!value) return t("patientDetails.dateUnavailable");
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return t("patientDetails.dateUnavailable");
      }
      return parsed.toLocaleDateString(dateLocale);
    },
    [dateLocale, t],
  );

  const formatDateTime = useCallback(
    (value: string) => {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return t("patientDetails.dateUnavailable");
      }
      return parsed.toLocaleString(dateLocale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [dateLocale, t],
  );

  const loadAccessStatus = useCallback(async () => {
    const response = await api.get<PacienteAppAccessStatusResponse>(
      `/pacientes/${pacienteId}/acesso-app`,
    );
    setAccessStatus(response.data);
    return response.data;
  }, [pacienteId]);

  const loadData = useCallback(async () => {
    if (!isUuid(pacienteId)) {
      setPaciente(null);
      setAccessStatus(null);
      setLoading(false);
      showToast({
        type: "error",
        message: t("patientDetails.notFound"),
      });
      return;
    }

    try {
      setLoading(true);
      const cached = getPacienteById(pacienteId);
      if (cached) {
        setPaciente(cached);
      }

      const [pacienteAtualizado, status] = await Promise.all([
        fetchPacienteById(pacienteId),
        loadAccessStatus(),
      ]);
      setPaciente(pacienteAtualizado);
      setAccessStatus(status);
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [
    fetchPacienteById,
    getPacienteById,
    loadAccessStatus,
    pacienteId,
    showToast,
    t,
  ]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const appAccess = useMemo(() => {
    if (accessStatus) return accessStatus;
    if (!paciente) return null;
    return createPacienteAppAccessFallback({
      pacienteId,
      pacienteUsuarioId: paciente.pacienteUsuarioId,
      vinculoStatus: paciente.vinculoStatus,
      conviteEnviadoEm: paciente.conviteEnviadoEm,
      conviteExpiraEm: paciente.conviteExpiraEm,
      conviteAceitoEm: paciente.conviteAceitoEm,
      appAccessEvents: paciente.appAccessEvents,
    });
  }, [accessStatus, paciente, pacienteId]);

  const canCreateInvite =
    !!appAccess &&
    appAccess.status !== PacienteAppAccessState.ACESSO_ATIVO &&
    appAccess.status !== PacienteAppAccessState.BLOQUEADO_CONFLITO &&
    (appAccess.podeGerarConvite || appAccess.podeReenviarConvite);
  const isBusy = loadingAction !== null;
  const hasWhatsappTarget = !!normalizeWhatsappTarget(
    paciente?.contato.whatsapp,
  );

  const status = useMemo(() => {
    if (!appAccess) {
      return {
        icon: "help-circle-outline" as const,
        color: COLORS.textSecondary,
        label: t("patientAppAccess.statusMissing"),
        description: t("patientAppAccess.missingDescription"),
      };
    }

    if (appAccess.status === PacienteAppAccessState.ACESSO_ATIVO) {
      return {
        icon: "checkmark-circle-outline" as const,
        color: COLORS.success,
        label: t("patientAppAccess.statusActive"),
        description: appAccess.conviteAceitoEm
          ? t("patientAppAccess.acceptedAt", {
              date: formatDate(appAccess.conviteAceitoEm),
            })
          : t("patientAppAccess.activeDescription"),
      };
    }

    if (appAccess.status === PacienteAppAccessState.CONVITE_EXPIRADO) {
      return {
        icon: "alert-circle-outline" as const,
        color: COLORS.error,
        label: t("patientAppAccess.statusExpired"),
        description: appAccess.conviteExpiraEm
          ? t("patientAppAccess.expiredAt", {
              date: formatDate(appAccess.conviteExpiraEm),
            })
          : t("patientAppAccess.expiredDescription"),
      };
    }

    if (appAccess.status === PacienteAppAccessState.CONVITE_PENDENTE) {
      return {
        icon: "time-outline" as const,
        color: COLORS.warning,
        label: t("patientAppAccess.statusInvited"),
        description: appAccess.conviteExpiraEm
          ? t("patientAppAccess.expiresAt", {
              date: formatDate(appAccess.conviteExpiraEm),
            })
          : t("patientAppAccess.pendingDescription"),
      };
    }

    if (appAccess.status === PacienteAppAccessState.BLOQUEADO_CONFLITO) {
      return {
        icon: "ban-outline" as const,
        color: COLORS.error,
        label: t("patientAppAccess.statusConflict"),
        description: t("patientAppAccess.conflictDescription"),
      };
    }

    return {
      icon: "phone-portrait-outline" as const,
      color: COLORS.textSecondary,
      label: t("patientAppAccess.statusMissing"),
      description: t("patientAppAccess.missingDescription"),
    };
  }, [appAccess, formatDate, t]);

  const buildInviteMessage = useCallback(
    (link: string) =>
      buildPatientInviteMessage({
        t,
        nome: paciente?.nomeCompleto || t("patientDetails.notInformed"),
        email: paciente?.contato.email,
        link,
      }),
    [paciente?.contato.email, paciente?.nomeCompleto, t],
  );

  const refreshAfterMutation = useCallback(async () => {
    const [pacienteAtualizado] = await Promise.all([
      fetchPacienteById(pacienteId),
      loadAccessStatus(),
    ]);
    setPaciente(pacienteAtualizado);
  }, [fetchPacienteById, loadAccessStatus, pacienteId]);

  const createInvite = useCallback(async () => {
    const response = await api.post<PacienteInviteCreateResponse>(
      "/auth/paciente-convite",
      { pacienteId, diasExpiracao: INVITE_EXPIRATION_DAYS },
    );
    setInviteLink(response.data.link);
    await refreshAfterMutation();
    return response.data;
  }, [pacienteId, refreshAfterMutation]);

  const generateInvite = async () => {
    try {
      setLoadingAction("generate");
      await createInvite();
      showToast({
        type: "success",
        message: t("patientAppAccess.linkGenerated"),
      });
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ type: "error", message });
    } finally {
      setLoadingAction(null);
    }
  };

  const ensureInviteLink = async () => {
    if (
      inviteLink &&
      appAccess?.status === PacienteAppAccessState.CONVITE_PENDENTE
    ) {
      return inviteLink;
    }
    const invite = await createInvite();
    return invite.link;
  };

  const openInviteInWhatsApp = async (link: string) => {
    const target = normalizeWhatsappTarget(paciente?.contato.whatsapp);
    const text = encodeURIComponent(buildInviteMessage(link));
    const url = target
      ? `https://wa.me/${target}?text=${text}`
      : `https://wa.me/?text=${text}`;
    await Linking.openURL(url);
  };

  const sendViaWhatsApp = async () => {
    try {
      setLoadingAction("whatsapp");
      const link = await ensureInviteLink();
      await openInviteInWhatsApp(link);
      showToast({
        type: "success",
        message: t("patientAppAccess.inviteReady"),
      });
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ type: "error", message });
    } finally {
      setLoadingAction(null);
    }
  };

  const shareInvite = async () => {
    try {
      setLoadingAction("share");
      const link = await ensureInviteLink();
      await Share.share({ message: buildInviteMessage(link) });
      showToast({
        type: "success",
        message: t("patientAppAccess.inviteReady"),
      });
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ type: "error", message });
    } finally {
      setLoadingAction(null);
    }
  };

  const copyInviteMessage = async () => {
    try {
      setLoadingAction("copy-message");
      const link = await ensureInviteLink();
      await Clipboard.setStringAsync(buildInviteMessage(link));
      showToast({
        type: "success",
        message: t("patientAppAccess.messageCopied"),
      });
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ type: "error", message });
    } finally {
      setLoadingAction(null);
    }
  };

  const copyInviteLink = async () => {
    try {
      setLoadingAction("copy-link");
      const link = await ensureInviteLink();
      await Clipboard.setStringAsync(link);
      showToast({
        type: "success",
        message: t("patientAppAccess.rawLinkCopied"),
      });
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ type: "error", message });
    } finally {
      setLoadingAction(null);
    }
  };

  const refreshStatus = async () => {
    try {
      setLoadingAction("refresh");
      await refreshAfterMutation();
      showToast({
        type: "success",
        message: t("patientAppAccess.statusUpdated"),
      });
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ type: "error", message });
    } finally {
      setLoadingAction(null);
    }
  };

  const revokeInvite = () => {
    Alert.alert(
      t("patientAppAccess.revokeTitle"),
      t("patientAppAccess.revokeMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("patientAppAccess.revokeConfirm"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                setLoadingAction("revoke");
                await api.post(`/pacientes/${pacienteId}/revogar-convite`);
                setInviteLink(null);
                await refreshAfterMutation();
                showToast({
                  type: "success",
                  message: t("patientAppAccess.revokeSuccess"),
                });
              } catch (error) {
                const { message } = parseApiError(error);
                showToast({ type: "error", message });
              } finally {
                setLoadingAction(null);
              }
            })();
          },
        },
      ],
    );
  };

  const unlinkAccess = () => {
    Alert.alert(
      t("patientAppAccess.unlinkTitle"),
      t("patientAppAccess.unlinkMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("patientAppAccess.unlinkConfirm"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                setLoadingAction("unlink");
                await api.post(`/pacientes/${pacienteId}/desvincular-acesso`);
                setInviteLink(null);
                await refreshAfterMutation();
                showToast({
                  type: "success",
                  message: t("patientAppAccess.unlinkSuccess"),
                });
              } catch (error) {
                const { message } = parseApiError(error);
                showToast({ type: "error", message });
              } finally {
                setLoadingAction(null);
              }
            })();
          },
        },
      ],
    );
  };

  const events: PacienteAppAccessEvent[] = Array.isArray(
    appAccess?.appAccessEvents,
  )
    ? appAccess.appAccessEvents
    : [];

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!paciente || !appAccess) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons
          name="alert-circle-outline"
          size={36}
          color={COLORS.textSecondary}
        />
        <Text style={styles.emptyTitle}>{t("patientDetails.notFound")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>{t("patientAppAccess.title")}</Text>
            <Text style={styles.title}>{paciente.nomeCompleto}</Text>
            <Text style={styles.subtitle}>
              {t("patientAppAccess.accessCenterDescription")}
            </Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: status.color }]}>
            <Ionicons name={status.icon} size={16} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.statusPanel}>
          <Text style={styles.sectionTitle}>
            {t("patientAppAccess.statusPanelTitle")}
          </Text>
          <Text style={styles.statusDescription}>{status.description}</Text>
          <View style={styles.metaRows}>
            {appAccess.conviteEnviadoEm ? (
              <View style={styles.metaRow}>
                <Ionicons
                  name="paper-plane-outline"
                  size={15}
                  color={COLORS.gray500}
                />
                <Text style={styles.metaText}>
                  {t("patientAppAccess.sentAt", {
                    date: formatDate(appAccess.conviteEnviadoEm),
                  })}
                </Text>
              </View>
            ) : null}
            {appAccess.conviteExpiraEm &&
            appAccess.status !== PacienteAppAccessState.ACESSO_ATIVO ? (
              <View style={styles.metaRow}>
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color={COLORS.gray500}
                />
                <Text style={styles.metaText}>
                  {appAccess.status === PacienteAppAccessState.CONVITE_EXPIRADO
                    ? t("patientAppAccess.expiredAt", {
                        date: formatDate(appAccess.conviteExpiraEm),
                      })
                    : t("patientAppAccess.expiresAt", {
                        date: formatDate(appAccess.conviteExpiraEm),
                      })}
                </Text>
              </View>
            ) : null}
            {appAccess.conviteAceitoEm ? (
              <View style={styles.metaRow}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={15}
                  color={COLORS.gray500}
                />
                <Text style={styles.metaText}>
                  {t("patientAppAccess.acceptedAt", {
                    date: formatDate(appAccess.conviteAceitoEm),
                  })}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.qrPanel}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {t("patientAppAccess.qrTitle")}
              </Text>
              <Text style={styles.sectionDescription}>
                {inviteLink
                  ? t("patientAppAccess.qrHint")
                  : t("patientAppAccess.qrEmptyDescription")}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={refreshStatus}
              disabled={isBusy}
              activeOpacity={0.85}
              accessibilityLabel={t("patientAppAccess.refreshStatus")}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.qrBox}>
            {inviteLink ? (
              <QRCode
                value={inviteLink}
                size={188}
                color={COLORS.textPrimary}
                backgroundColor={COLORS.white}
              />
            ) : (
              <View style={styles.qrEmpty}>
                <Ionicons
                  name="qr-code-outline"
                  size={48}
                  color={COLORS.gray400}
                />
                <Text style={styles.qrEmptyTitle}>
                  {t("patientAppAccess.qrEmptyTitle")}
                </Text>
              </View>
            )}
          </View>

          <Button
            title={
              inviteLink
                ? t("patientAppAccess.resendInvite")
                : t("patientAppAccess.generateLink")
            }
            onPress={generateInvite}
            loading={loadingAction === "generate"}
            disabled={!canCreateInvite || isBusy}
            fullWidth
          />
        </View>

        <View style={styles.actionsPanel}>
          <Text style={styles.sectionTitle}>
            {t("patientAppAccess.deliveryTitle")}
          </Text>
          <View style={styles.actionGrid}>
            <ActionTile
              icon="logo-whatsapp"
              label={t("patientAppAccess.sendWhatsapp")}
              description={
                hasWhatsappTarget
                  ? t("patientAppAccess.whatsappDirectDescription")
                  : t("patientAppAccess.whatsappGenericDescription")
              }
              onPress={sendViaWhatsApp}
              disabled={!canCreateInvite || isBusy}
            />
            <ActionTile
              icon="share-social-outline"
              label={t("patientAppAccess.shareInvite")}
              description={t("patientAppAccess.shareDescription")}
              onPress={shareInvite}
              disabled={!canCreateInvite || isBusy}
            />
            <ActionTile
              icon="chatbubble-ellipses-outline"
              label={t("patientAppAccess.copyMessage")}
              description={t("patientAppAccess.copyMessageDescription")}
              onPress={copyInviteMessage}
              disabled={!canCreateInvite || isBusy}
            />
            <ActionTile
              icon="link-outline"
              label={t("patientAppAccess.copyLink")}
              description={t("patientAppAccess.copyLinkDescription")}
              onPress={copyInviteLink}
              disabled={!canCreateInvite || isBusy}
            />
          </View>
        </View>

        <View style={styles.actionsPanel}>
          <Text style={styles.sectionTitle}>
            {t("patientAppAccess.securityTitle")}
          </Text>
          <View style={styles.actionGrid}>
            <ActionTile
              icon="close-circle-outline"
              label={t("patientAppAccess.revokeConfirm")}
              description={t("patientAppAccess.revokeDescription")}
              onPress={revokeInvite}
              disabled={!appAccess.podeRevogarConvite || isBusy}
              danger
            />
            <ActionTile
              icon="unlink-outline"
              label={t("patientAppAccess.unlinkAction")}
              description={t("patientAppAccess.unlinkDescription")}
              onPress={unlinkAccess}
              disabled={!appAccess.podeDesvincularAcesso || isBusy}
              danger
            />
          </View>
        </View>

        <View style={styles.historyPanel}>
          <Text style={styles.sectionTitle}>
            {t("patientAppAccess.historyTitle")}
          </Text>
          {events.length > 0 ? (
            events.map((event, index) => (
              <View
                key={`${event.type}-${event.at}-${index}`}
                style={styles.historyRow}
              >
                <View style={styles.historyMarker} />
                <View style={styles.historyTextWrap}>
                  <Text style={styles.historyLabel}>
                    {t(`patientAppAccess.event.${event.type}`)}
                  </Text>
                  <Text style={styles.historyDate}>
                    {formatDateTime(event.at)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.sectionDescription}>
              {t("patientAppAccess.noHistory")}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  content: {
    padding: SPACING.base,
    gap: SPACING.md,
    paddingBottom: SPACING["3xl"],
  },
  hero: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  heroText: {
    gap: SPACING.xs,
  },
  kicker: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes["2xl"],
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    lineHeight: 20,
  },
  statusBadge: {
    minHeight: 36,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.white,
  },
  statusText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "800",
  },
  statusPanel: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  statusDescription: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    lineHeight: 20,
  },
  metaRows: {
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    flex: 1,
  },
  qrPanel: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.base,
    fontWeight: "800",
  },
  sectionDescription: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    lineHeight: 18,
    marginTop: 4,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  qrBox: {
    minHeight: 232,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.gray50,
    padding: SPACING.lg,
  },
  qrEmpty: {
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  qrEmptyTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    textAlign: "center",
  },
  actionsPanel: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  actionGrid: {
    gap: SPACING.sm,
  },
  actionTile: {
    minHeight: 74,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  actionTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  actionLabel: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "800",
  },
  actionDescription: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    lineHeight: 15,
  },
  dangerTile: {
    borderColor: COLORS.error,
  },
  dangerText: {
    color: COLORS.error,
  },
  disabledTile: {
    opacity: 0.55,
  },
  historyPanel: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  historyMarker: {
    width: 9,
    height: 9,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    marginTop: 5,
  },
  historyTextWrap: {
    flex: 1,
    gap: 2,
  },
  historyLabel: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  historyDate: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
    textAlign: "center",
  },
});
