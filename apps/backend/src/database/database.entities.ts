import { AnamneseHistorico } from '../modules/anamneses/entities/anamnese-historico.entity';
import { Anamnese } from '../modules/anamneses/entities/anamnese.entity';
import { AtividadeCheckin } from '../modules/atividades/entities/atividade-checkin.entity';
import { Atividade } from '../modules/atividades/entities/atividade.entity';
import { AuthLog } from '../modules/auth/entities/auth-log.entity';
import { ClinicalAuditLog } from '../modules/clinical-governance/entities/clinical-audit-log.entity';
import { ClinicalProtocolVersion } from '../modules/clinical-governance/entities/clinical-protocol-version.entity';
import { ConsentPurposeLog } from '../modules/clinical-governance/entities/consent-purpose-log.entity';
import {
  CommunityAuditLog,
  CommunityBadge,
  CommunityBookmark,
  CommunityCategory,
  CommunityContribution,
  CommunityModerationReport,
  CommunityNotification,
  CommunityPost,
  CommunityPostTag,
  CommunityProfile,
  CommunityProfileBadge,
  CommunityReaction,
  CommunityReply,
  CommunityResource,
  CommunityResourceTag,
  CommunitySsoToken,
  CommunityTag,
} from '../modules/community/entities/community.entities';
import { CrmAdminAuditLog } from '../modules/crm/entities/crm-admin-audit-log.entity';
import { CrmInteraction } from '../modules/crm/entities/crm-interaction.entity';
import { CrmLead } from '../modules/crm/entities/crm-lead.entity';
import { CrmTask } from '../modules/crm/entities/crm-task.entity';
import { Evolucao } from '../modules/evolucoes/entities/evolucao.entity';
import { LaudoAiGeneration } from '../modules/laudos/entities/laudo-ai-generation.entity';
import { LaudoExameFisico } from '../modules/laudos/entities/laudo-exame-fisico.entity';
import { Laudo } from '../modules/laudos/entities/laudo.entity';
import { ClinicalFlowEvent } from '../modules/metrics/entities/clinical-flow-event.entity';
import { PatientCheckClickEvent } from '../modules/metrics/entities/patient-check-click-event.entity';
import { PushToken } from '../modules/notificacoes/entities/push-token.entity';
import { ClinicalPhotoComparison } from '../modules/pacientes/entities/clinical-photo-comparison.entity';
import { ClinicalPhoto } from '../modules/pacientes/entities/clinical-photo.entity';
import { PacienteExame } from '../modules/pacientes/entities/paciente-exame.entity';
import { Paciente } from '../modules/pacientes/entities/paciente.entity';
import { ProfissionalPacienteVinculo } from '../modules/pacientes/entities/profissional-paciente-vinculo.entity';
import { Usuario } from '../modules/usuarios/entities/usuario.entity';

export const DATABASE_ENTITIES = [
  Usuario,
  Paciente,
  Anamnese,
  AnamneseHistorico,
  LaudoExameFisico,
  Evolucao,
  Laudo,
  LaudoAiGeneration,
  AuthLog,
  Atividade,
  AtividadeCheckin,
  PushToken,
  CrmLead,
  CrmTask,
  CrmInteraction,
  CrmAdminAuditLog,
  PacienteExame,
  ClinicalPhoto,
  ClinicalPhotoComparison,
  ProfissionalPacienteVinculo,
  ClinicalFlowEvent,
  PatientCheckClickEvent,
  ClinicalProtocolVersion,
  ConsentPurposeLog,
  ClinicalAuditLog,
  CommunityProfile,
  CommunityCategory,
  CommunityTag,
  CommunityPost,
  CommunityPostTag,
  CommunityReply,
  CommunityResource,
  CommunityResourceTag,
  CommunityReaction,
  CommunityBookmark,
  CommunityModerationReport,
  CommunityNotification,
  CommunityContribution,
  CommunityBadge,
  CommunityProfileBadge,
  CommunityAuditLog,
  CommunitySsoToken,
];
