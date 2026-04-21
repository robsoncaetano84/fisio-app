// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// C RM.M OD UL E
// ==========================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmLead } from './entities/crm-lead.entity';
import { CrmInteraction } from './entities/crm-interaction.entity';
import { CrmTask } from './entities/crm-task.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Atividade } from '../atividades/entities/atividade.entity';
import { AtividadeCheckin } from '../atividades/entities/atividade-checkin.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { ClinicalFlowEvent } from '../metrics/entities/clinical-flow-event.entity';
import { CrmAdminAuditLog } from './entities/crm-admin-audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CrmLead,
      CrmTask,
      CrmInteraction,
      Paciente,
      Usuario,
      Anamnese,
      Evolucao,
      Atividade,
      AtividadeCheckin,
      Laudo,
      ClinicalFlowEvent,
      CrmAdminAuditLog,
    ]),
  ],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
