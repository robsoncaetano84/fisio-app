import { AnamneseHistorico } from '../modules/anamneses/entities/anamnese-historico.entity';
import { Anamnese } from '../modules/anamneses/entities/anamnese.entity';
import { AtividadeCheckin } from '../modules/atividades/entities/atividade-checkin.entity';
import { Atividade } from '../modules/atividades/entities/atividade.entity';
import { ExercicioMidia } from '../modules/atividades/entities/exercicio-midia.entity';
import { Exercicio } from '../modules/atividades/entities/exercicio.entity';
import { AuthLog } from '../modules/auth/entities/auth-log.entity';
import { ClinicalAuditLog } from '../modules/clinical-governance/entities/clinical-audit-log.entity';
import { ClinicalProtocolVersion } from '../modules/clinical-governance/entities/clinical-protocol-version.entity';
import { ConsentPurposeLog } from '../modules/clinical-governance/entities/consent-purpose-log.entity';
import { CrmAdminAuditLog } from '../modules/crm/entities/crm-admin-audit-log.entity';
import { CrmAutomationAction } from '../modules/crm/entities/crm-automation-action.entity';
import { CrmInteraction } from '../modules/crm/entities/crm-interaction.entity';
import { CrmLead } from '../modules/crm/entities/crm-lead.entity';
import { CrmTask } from '../modules/crm/entities/crm-task.entity';
import { Evolucao } from '../modules/evolucoes/entities/evolucao.entity';
import { LaudoAiGeneration } from '../modules/laudos/entities/laudo-ai-generation.entity';
import { LaudoExameFisico } from '../modules/laudos/entities/laudo-exame-fisico.entity';
import { LaudoExameHistorico } from '../modules/laudos/entities/laudo-exame-historico.entity';
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
  LaudoExameHistorico,
  Evolucao,
  Laudo,
  LaudoAiGeneration,
  AuthLog,
  Exercicio,
  ExercicioMidia,
  Atividade,
  AtividadeCheckin,
  PushToken,
  CrmLead,
  CrmTask,
  CrmInteraction,
  CrmAdminAuditLog,
  CrmAutomationAction,
  PacienteExame,
  ClinicalPhoto,
  ClinicalPhotoComparison,
  ProfissionalPacienteVinculo,
  ClinicalFlowEvent,
  PatientCheckClickEvent,
  ClinicalProtocolVersion,
  ConsentPurposeLog,
  ClinicalAuditLog,
];
