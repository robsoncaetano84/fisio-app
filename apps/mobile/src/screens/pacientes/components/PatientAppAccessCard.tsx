import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, useToast } from "../../../components/ui";
import { BORDER_RADIUS, COLORS, FONTS, SPACING } from "../../../constants/theme";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { api } from "../../../services";
import {
  PacienteAppAccessEvent,
  PacienteInviteCreateResponse,
  PacienteVinculoStatus,
} from "../../../types";
import { parseApiError } from "../../../utils/apiErrors";

type Props = {
  pacienteId: string;
  nome: string;
  email?: string;
  whatsapp?: string;
  pacienteUsuarioId?: string | null;
  vinculoStatus?: PacienteVinculoStatus | null;
  conviteEnviadoEm?: string | null;
  conviteAceitoEm?: string | null;
  appAccessEvents?: PacienteAppAccessEvent[];
  onRefresh?: () => Promise<void> | void;
};

type LoadingAction = "invite" | "copy" | "unlink" | "revoke" | null;

const INVITE_EXPIRATION_DAYS = 7;

function normalizeWhatsappTarget(whatsapp?: string) {
  const digits = String(whatsapp || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length > 11 && digits.startsWith("55")) return digits;
  return `55${digits}`;
}

export function PatientAppAccessCard({
  pacienteId,
  nome,
  email,
  whatsapp,
  pacienteUsuarioId,
  vinculoStatus,
  conviteEnviadoEm,
  conviteAceitoEm,
  appAccessEvents,
  onRefresh,
}: Props) {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const hasAppAccess = !!pacienteUsuarioId;
  const hasPendingInvite =
    !hasAppAccess && vinculoStatus === PacienteVinculoStatus.CONVITE_ENVIADO;
  const visibleEvents = useMemo(
    () => (Array.isArray(appAccessEvents) ? appAccessEvents.slice(0, 4) : []),
    [appAccessEvents],
  );

  const dateLocale =
    language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";

  const formatDate = useCallback(
    (value: string) => {
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

  const getEventLabel = useCallback(
    (type: PacienteAppAccessEvent["type"]) =>
      t(`patientAppAccess.event.${type}`),
    [t],
  );

  const status = useMemo(() => {
    if (hasAppAccess) {
      return {
        icon: "checkmark-circle-outline" as const,
        color: COLORS.success,
        label: t("patientAppAccess.statusActive"),
        description: conviteAceitoEm
          ? t("patientAppAccess.acceptedAt", {
              date: formatDate(conviteAceitoEm),
            })
          : t("patientAppAccess.activeDescription"),
      };
    }

    if (hasPendingInvite) {
      return {
        icon: "time-outline" as const,
        color: COLORS.warning,
        label: t("patientAppAccess.statusInvited"),
        description: conviteEnviadoEm
          ? t("patientAppAccess.sentAt", {
              date: formatDate(conviteEnviadoEm),
            })
          : t("patientAppAccess.pendingDescription"),
      };
    }

    return {
      icon: "phone-portrait-outline" as const,
      color: COLORS.textSecondary,
      label: t("patientAppAccess.statusMissing"),
      description: t("patientAppAccess.missingDescription"),
    };
  }, [
    conviteAceitoEm,
    conviteEnviadoEm,
    formatDate,
    hasAppAccess,
    hasPendingInvite,
    t,
  ]);

  const buildInviteMessage = useCallback(
    (link: string) => {
      const lines = [
        t("patientAppAccess.inviteGreeting", { name: nome }),
        t("patientAppAccess.inviteIntro"),
        email ? t("patientAppAccess.inviteEmailHint", { email }) : null,
        t("patientAppAccess.inviteLink", { link }),
      ].filter(Boolean);
      return lines.join("\n\n");
    },
    [email, nome, t],
  );

  const createInvite = async () => {
    const response = await api.post<PacienteInviteCreateResponse>(
      "/auth/paciente-convite",
      { pacienteId, diasExpiracao: INVITE_EXPIRATION_DAYS },
    );
    setLastInviteLink(response.data.link);
    await onRefresh?.();
    return response.data.link;
  };

  const openInviteInWhatsApp = async (link: string) => {
    const target = normalizeWhatsappTarget(whatsapp);
    const text = encodeURIComponent(buildInviteMessage(link));
    const url = target
      ? `https://wa.me/${target}?text=${text}`
      : `https://wa.me/?text=${text}`;
    await Linking.openURL(url);
  };

  const shareInvite = async () => {
    try {
      setLoadingAction("invite");
      const link = await createInvite();
      if (normalizeWhatsappTarget(whatsapp)) {
        await openInviteInWhatsApp(link);
      } else {
        await Share.share({ message: buildInviteMessage(link) });
      }
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

  const copyInvite = async () => {
    try {
      setLoadingAction("copy");
      const link = lastInviteLink || (await createInvite());
      const message = buildInviteMessage(link);
      if (
        Platform.OS === "web" &&
        typeof navigator !== "undefined" &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(message);
        showToast({
          type: "success",
          message: t("patientAppAccess.linkCopied"),
        });
        return;
      }
      await Share.share({ message });
    } catch (error) {
      const { message } = parseApiError(error);
      showToast({ type: "error", message });
    } finally {
      setLoadingAction(null);
    }
  };

  const openWhatsApp = async () => {
    try {
      setLoadingAction("invite");
      const link = lastInviteLink || (await createInvite());
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

  const unlinkAccess = () => {
    Alert.alert(t("patientAppAccess.unlinkTitle"), t("patientAppAccess.unlinkMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("patientAppAccess.unlinkConfirm"),
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              setLoadingAction("unlink");
              await api.post(`/pacientes/${pacienteId}/desvincular-acesso`);
              showToast({
                type: "success",
                message: t("patientAppAccess.unlinkSuccess"),
              });
              await onRefresh?.();
            } catch (error) {
              const { message } = parseApiError(error);
              showToast({ type: "error", message });
            } finally {
              setLoadingAction(null);
            }
          })();
        },
      },
    ]);
  };

  const revokeInvite = () => {
    Alert.alert(t("patientAppAccess.revokeTitle"), t("patientAppAccess.revokeMessage"), [
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
              await onRefresh?.();
            } catch (error) {
              const { message } = parseApiError(error);
              showToast({ type: "error", message });
            } finally {
              setLoadingAction(null);
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name={status.icon} size={20} color={status.color} />
          <Text style={styles.title}>{t("patientAppAccess.title")}</Text>
        </View>
        <View style={[styles.badge, { borderColor: status.color }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>
      <Text style={styles.description}>{status.description}</Text>

      <View style={styles.actions}>
        {!hasAppAccess ? (
          <>
            <Button
              title={
                hasPendingInvite
                  ? t("patientAppAccess.resendInvite")
                  : t("patientAppAccess.sendInvite")
              }
              onPress={shareInvite}
              loading={loadingAction === "invite"}
              size="sm"
              style={styles.actionButton}
            />
            <TouchableOpacity
              style={styles.iconButton}
              onPress={copyInvite}
              disabled={loadingAction !== null}
              activeOpacity={0.85}
              accessibilityLabel={t("patientAppAccess.copyInvite")}
            >
              <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={openWhatsApp}
              disabled={loadingAction !== null}
              activeOpacity={0.85}
              accessibilityLabel={t("patientAppAccess.sendWhatsapp")}
            >
              <Ionicons name="logo-whatsapp" size={18} color={COLORS.success} />
            </TouchableOpacity>
            {hasPendingInvite ? (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={revokeInvite}
                disabled={loadingAction !== null}
                activeOpacity={0.85}
                accessibilityLabel={t("patientAppAccess.revokeConfirm")}
              >
                <Ionicons name="close-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            ) : null}
          </>
        ) : (
          <Button
            title={t("patientAppAccess.unlinkAction")}
            onPress={unlinkAccess}
            loading={loadingAction === "unlink"}
            variant="outline"
            size="sm"
            fullWidth
          />
        )}
      </View>
      {visibleEvents.length > 0 ? (
        <View style={styles.history}>
          <Text style={styles.historyTitle}>
            {t("patientAppAccess.historyTitle")}
          </Text>
          {visibleEvents.map((event, index) => (
            <View key={`${event.type}-${event.at}-${index}`} style={styles.historyRow}>
              <Ionicons
                name="ellipse"
                size={7}
                color={index === 0 ? COLORS.primary : COLORS.gray400}
              />
              <Text style={styles.historyText}>
                {getEventLabel(event.type)} {"\u2022"} {formatDateTime(event.at)}
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
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
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
