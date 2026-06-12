import {
  PacienteAppAccessEvent,
  PacienteAppAccessState,
  PacienteAppAccessStatusResponse,
  PacienteVinculoStatus,
} from "../../types";

export type InviteTranslator = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export const INVITE_EXPIRATION_DAYS = 7;

export function normalizeWhatsappTarget(whatsapp?: string | null) {
  const digits = String(whatsapp || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length > 11 && digits.startsWith("55")) return digits;
  return `55${digits}`;
}

export function isPacienteInviteExpired(value?: string | null) {
  if (!value) return false;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) && parsed <= Date.now();
}

export function buildPatientInviteMessage({
  t,
  nome,
  email,
  link,
}: {
  t: InviteTranslator;
  nome: string;
  email?: string | null;
  link: string;
}) {
  const lines = [
    t("patientAppAccess.inviteGreeting", { name: nome }),
    t("patientAppAccess.inviteIntro"),
    email ? t("patientAppAccess.inviteEmailHint", { email }) : null,
    t("patientAppAccess.inviteLink", { link }),
  ].filter(Boolean);
  return lines.join("\n\n");
}

export function createPacienteAppAccessFallback({
  pacienteId,
  pacienteUsuarioId,
  vinculoStatus,
  conviteEnviadoEm,
  conviteExpiraEm,
  conviteAceitoEm,
  appAccessEvents,
}: {
  pacienteId: string;
  pacienteUsuarioId?: string | null;
  vinculoStatus?: PacienteVinculoStatus | null;
  conviteEnviadoEm?: string | null;
  conviteExpiraEm?: string | null;
  conviteAceitoEm?: string | null;
  appAccessEvents?: PacienteAppAccessEvent[] | null;
}): PacienteAppAccessStatusResponse {
  const hasAppAccess = !!pacienteUsuarioId;
  const isPendingInvite =
    !hasAppAccess && vinculoStatus === PacienteVinculoStatus.CONVITE_ENVIADO;
  const status = hasAppAccess
    ? PacienteAppAccessState.ACESSO_ATIVO
    : vinculoStatus === PacienteVinculoStatus.BLOQUEADO_CONFLITO
      ? PacienteAppAccessState.BLOQUEADO_CONFLITO
      : isPendingInvite && isPacienteInviteExpired(conviteExpiraEm)
        ? PacienteAppAccessState.CONVITE_EXPIRADO
        : isPendingInvite
          ? PacienteAppAccessState.CONVITE_PENDENTE
          : PacienteAppAccessState.SEM_CONVITE;

  return {
    pacienteId,
    pacienteUsuarioId: pacienteUsuarioId || null,
    vinculoStatus: vinculoStatus || PacienteVinculoStatus.SEM_VINCULO,
    status,
    conviteEnviadoEm: conviteEnviadoEm || null,
    conviteExpiraEm: conviteExpiraEm || null,
    conviteAceitoEm: conviteAceitoEm || null,
    podeGerarConvite:
      !hasAppAccess &&
      vinculoStatus !== PacienteVinculoStatus.BLOQUEADO_CONFLITO,
    podeReenviarConvite: isPendingInvite,
    podeRevogarConvite: isPendingInvite,
    podeDesvincularAcesso: hasAppAccess,
    appAccessEvents: Array.isArray(appAccessEvents) ? appAccessEvents : [],
  };
}
