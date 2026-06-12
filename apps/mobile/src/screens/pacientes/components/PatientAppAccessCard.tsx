import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Button, useToast } from "../../../components/ui";
import {
  BORDER_RADIUS,
  COLORS,
  FONTS,
  SPACING,
} from "../../../constants/theme";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { api } from "../../../services";
import {
  PacienteAppAccessEvent,
  PacienteAppAccessState,
  PacienteAppAccessStatusResponse,
  PacienteInviteCreateResponse,
  PacienteVinculoStatus,
  RootStackParamList,
} from "../../../types";
import { parseApiError } from "../../../utils/apiErrors";
import {
  buildPatientInviteMessage,
  createPacienteAppAccessFallback,
  INVITE_EXPIRATION_DAYS,
  normalizeWhatsappTarget,
} from "../patientAppAccessUtils";

type Props = {
  pacienteId: string;
  nome: string;
  email?: string;
  whatsapp?: string;
  pacienteUsuarioId?: string | null;
  vinculoStatus?: PacienteVinculoStatus | null;
  conviteEnviadoEm?: string | null;
  conviteExpiraEm?: string | null;
  conviteAceitoEm?: string | null;
  appAccessEvents?: PacienteAppAccessEvent[];
  onRefresh?: () => Promise<void> | void;
};

type LoadingAction =
  | "invite"
  | "whatsapp"
  | "share"
  | "copy-message"
  | "copy-link"
  | "unlink"
  | "revoke"
  | "refresh"
  | null;

type ActionPillProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
};

function ActionPill({
  icon,
  label,
  onPress,
  disabled,
  danger,
}: ActionPillProps) {
  const color = danger ? COLORS.error : COLORS.primary;

  return (
    <TouchableOpacity
      style={[
        styles.secondaryAction,
        danger ? styles.dangerAction : null,
        disabled ? styles.disabledAction : null,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text
        style={[
          styles.secondaryActionText,
          danger ? styles.dangerActionText : null,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function PatientAppAccessCard({
  pacienteId,
  nome,
  email,
  whatsapp,
  pacienteUsuarioId,
  vinculoStatus,
  conviteEnviadoEm,
  conviteExpiraEm,
  conviteAceitoEm,
  appAccessEvents,
  onRefresh,
}: Props) {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] =
    useState<PacienteAppAccessStatusResponse | null>(null);

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
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [dateLocale, t],
  );

  const fallbackAccessStatus = useMemo<PacienteAppAccessStatusResponse>(() => {
    return createPacienteAppAccessFallback({
      pacienteId,
      pacienteUsuarioId,
      vinculoStatus,
      conviteEnviadoEm,
      conviteExpiraEm,
      conviteAceitoEm,
      appAccessEvents,
    });
  }, [
    appAccessEvents,
    conviteAceitoEm,
    conviteEnviadoEm,
    conviteExpiraEm,
    pacienteId,
    pacienteUsuarioId,
    vinculoStatus,
  ]);

  const appAccess = accessStatus || fallbackAccessStatus;
  const hasAppAccess = appAccess.status === PacienteAppAccessState.ACESSO_ATIVO;
  const hasWhatsappTarget = !!normalizeWhatsappTarget(whatsapp);
  const canCreateInvite =
    !hasAppAccess &&
    appAccess.status !== PacienteAppAccessState.BLOQUEADO_CONFLITO &&
    (appAccess.podeGerarConvite || appAccess.podeReenviarConvite);
  const isBusy = loadingAction !== null;

  const visibleEvents = useMemo(
    () =>
      Array.isArray(appAccess.appAccessEvents)
        ? appAccess.appAccessEvents.slice(0, 4)
        : [],
    [appAccess.appAccessEvents],
  );

  const loadAccessStatus = useCallback(async () => {
    const response = await api.get<PacienteAppAccessStatusResponse>(
      `/pacientes/${pacienteId}/acesso-app`,
    );
    setAccessStatus(response.data);
    return response.data;
  }, [pacienteId]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const response = await api.get<PacienteAppAccessStatusResponse>(
          `/pacientes/${pacienteId}/acesso-app`,
        );
        if (mounted) {
          setAccessStatus(response.data);
        }
      } catch {
        // A tela continua funcional com os dados ja carregados do paciente.
      }
    })();

    return () => {
      mounted = false;
    };
  }, [pacienteId]);

  const refreshAfterMutation = useCallback(async () => {
    await loadAccessStatus();
    await onRefresh?.();
  }, [loadAccessStatus, onRefresh]);

  const refreshManually = async () => {
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

  const getEventLabel = useCallback(
    (type: PacienteAppAccessEvent["type"]) =>
      t(`patientAppAccess.event.${type}`),
    [t],
  );

  const status = useMemo(() => {
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

  const metaItems = useMemo(() => {
    const items: {
      key: string;
      icon: ActionPillProps["icon"];
      text: string;
    }[] = [];

    if (appAccess.conviteEnviadoEm) {
      items.push({
        key: "sent",
        icon: "paper-plane-outline",
        text: t("patientAppAccess.sentAt", {
          date: formatDate(appAccess.conviteEnviadoEm),
        }),
      });
    }

    if (
      appAccess.conviteExpiraEm &&
      appAccess.status !== PacienteAppAccessState.ACESSO_ATIVO
    ) {
      items.push({
        key: "expires",
        icon: "calendar-outline",
        text:
          appAccess.status === PacienteAppAccessState.CONVITE_EXPIRADO
            ? t("patientAppAccess.expiredAt", {
                date: formatDate(appAccess.conviteExpiraEm),
              })
            : t("patientAppAccess.expiresAt", {
                date: formatDate(appAccess.conviteExpiraEm),
              }),
      });
    }

    if (appAccess.conviteAceitoEm) {
      items.push({
        key: "accepted",
        icon: "checkmark-done-outline",
        text: t("patientAppAccess.acceptedAt", {
          date: formatDate(appAccess.conviteAceitoEm),
        }),
      });
    }

    return items;
  }, [appAccess, formatDate, t]);

  const buildInviteMessage = useCallback(
    (link: string) => {
      return buildPatientInviteMessage({ t, nome, email, link });
    },
    [email, nome, t],
  );

  const createInvite = async () => {
    const response = await api.post<PacienteInviteCreateResponse>(
      "/auth/paciente-convite",
      { pacienteId, diasExpiracao: INVITE_EXPIRATION_DAYS },
    );
    setLastInviteLink(response.data.link);
    await refreshAfterMutation();
    return response.data;
  };

  const ensureInviteLink = async () => {
    if (
      lastInviteLink &&
      appAccess.status === PacienteAppAccessState.CONVITE_PENDENTE
    ) {
      return lastInviteLink;
    }
    const invite = await createInvite();
    return invite.link;
  };

  const openInviteInWhatsApp = async (link: string) => {
    const target = normalizeWhatsappTarget(whatsapp);
    const text = encodeURIComponent(buildInviteMessage(link));
    const url = target
      ? `https://wa.me/${target}?text=${text}`
      : `https://wa.me/?text=${text}`;
    await Linking.openURL(url);
  };

  const sendViaWhatsApp = async () => {
    try {
      setLoadingAction("whatsapp");
      const invite = await createInvite();
      await openInviteInWhatsApp(invite.link);
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
      const invite = await createInvite();
      await Share.share({ message: buildInviteMessage(invite.link) });
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
      const message = buildInviteMessage(link);
      await Clipboard.setStringAsync(message);
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
                setLastInviteLink(null);
                showToast({
                  type: "success",
                  message: t("patientAppAccess.unlinkSuccess"),
                });
                await refreshAfterMutation();
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
                setLastInviteLink(null);
                showToast({
                  type: "success",
                  message: t("patientAppAccess.revokeSuccess"),
                });
                await refreshAfterMutation();
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

  const primaryInviteAction = hasWhatsappTarget ? sendViaWhatsApp : shareInvite;
  const primaryInviteTitle = hasWhatsappTarget
    ? t("patientAppAccess.sendWhatsapp")
    : appAccess.status === PacienteAppAccessState.CONVITE_PENDENTE ||
        appAccess.status === PacienteAppAccessState.CONVITE_EXPIRADO
      ? t("patientAppAccess.resendInvite")
      : t("patientAppAccess.sendInvite");

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name={status.icon} size={20} color={status.color} />
          <Text style={styles.title}>{t("patientAppAccess.title")}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshManually}
            disabled={isBusy}
            activeOpacity={0.85}
            accessibilityLabel={t("patientAppAccess.refreshStatus")}
          >
            <Ionicons
              name="refresh-outline"
              size={16}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
          <View style={[styles.badge, { borderColor: status.color }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.description}>{status.description}</Text>

      {metaItems.length > 0 ? (
        <View style={styles.metaList}>
          {metaItems.map((item) => (
            <View key={item.key} style={styles.metaRow}>
              <Ionicons name={item.icon} size={14} color={COLORS.gray500} />
              <Text style={styles.metaText}>{item.text}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        {!hasAppAccess ? (
          <>
            <Button
              title={primaryInviteTitle}
              onPress={primaryInviteAction}
              loading={
                loadingAction === "invite" ||
                loadingAction === "whatsapp" ||
                loadingAction === "share"
              }
              disabled={!canCreateInvite || isBusy}
              size="sm"
              style={styles.actionButton}
            />
            <View style={styles.secondaryActions}>
              <ActionPill
                icon="chatbubble-ellipses-outline"
                label={t("patientAppAccess.copyMessage")}
                onPress={copyInviteMessage}
                disabled={!canCreateInvite || isBusy}
              />
              <ActionPill
                icon="link-outline"
                label={t("patientAppAccess.copyLink")}
                onPress={copyInviteLink}
                disabled={!canCreateInvite || isBusy}
              />
              <ActionPill
                icon="share-social-outline"
                label={t("patientAppAccess.shareInvite")}
                onPress={shareInvite}
                disabled={!canCreateInvite || isBusy}
              />
              <ActionPill
                icon="qr-code-outline"
                label={t("patientAppAccess.manageInvite")}
                onPress={() =>
                  navigation.navigate("PacienteInviteAccess", { pacienteId })
                }
                disabled={isBusy}
              />
              {appAccess.podeRevogarConvite ? (
                <ActionPill
                  icon="close-circle-outline"
                  label={t("patientAppAccess.revokeConfirm")}
                  onPress={revokeInvite}
                  disabled={isBusy}
                  danger
                />
              ) : null}
            </View>
          </>
        ) : (
          <>
            <Button
              title={t("patientAppAccess.unlinkAction")}
              onPress={unlinkAccess}
              loading={loadingAction === "unlink"}
              disabled={isBusy}
              variant="outline"
              size="sm"
              fullWidth
            />
            <View style={styles.secondaryActions}>
              <ActionPill
                icon="qr-code-outline"
                label={t("patientAppAccess.manageInvite")}
                onPress={() =>
                  navigation.navigate("PacienteInviteAccess", { pacienteId })
                }
                disabled={isBusy}
              />
            </View>
          </>
        )}
      </View>

      {visibleEvents.length > 0 ? (
        <View style={styles.history}>
          <Text style={styles.historyTitle}>
            {t("patientAppAccess.historyTitle")}
          </Text>
          {visibleEvents.map((event, index) => (
            <View
              key={`${event.type}-${event.at}-${index}`}
              style={styles.historyRow}
            >
              <Ionicons
                name="ellipse"
                size={7}
                color={index === 0 ? COLORS.primary : COLORS.gray400}
              />
              <Text style={styles.historyText}>
                {getEventLabel(event.type)} {"\u2022"}{" "}
                {formatDateTime(event.at)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    marginTop: SPACING.md,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    flexShrink: 0,
  },
  refreshButton: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  badge: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  metaList: {
    gap: 6,
    marginTop: SPACING.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    flex: 1,
  },
  actions: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionButton: {
    width: "100%",
  },
  secondaryActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  secondaryAction: {
    minHeight: 36,
    maxWidth: "100%",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.white,
  },
  secondaryActionText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    flexShrink: 1,
  },
  dangerAction: {
    borderColor: COLORS.error,
  },
  dangerActionText: {
    color: COLORS.error,
  },
  disabledAction: {
    opacity: 0.55,
  },
  history: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    gap: 6,
  },
  historyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  historyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    flex: 1,
  },
});
