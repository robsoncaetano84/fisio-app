import { CrmInteraction } from './entities/crm-interaction.entity';
import { CrmLead } from './entities/crm-lead.entity';
import { CrmTask } from './entities/crm-task.entity';
import { maskRichText } from './crm-sensitive-data.util';

type CrmMapperOptions = {
  includeSensitive?: boolean;
};

export function mapCrmLead(lead: CrmLead, options?: CrmMapperOptions) {
  return {
    id: lead.id,
    nome: lead.nome,
    empresa: lead.empresa,
    canal: lead.canal,
    stage: lead.stage,
    responsavelNome: lead.responsavelNome,
    responsavelUsuarioId: lead.responsavelUsuarioId,
    valorPotencial: Number(lead.valorPotencial || 0),
    observacoes: maskRichText(lead.observacoes, options?.includeSensitive),
    ativo: lead.ativo,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

export function mapCrmTask(task: CrmTask, options?: CrmMapperOptions) {
  return {
    id: task.id,
    titulo: task.titulo,
    descricao: maskRichText(task.descricao, options?.includeSensitive),
    leadId: task.leadId,
    responsavelNome: task.responsavelNome,
    responsavelUsuarioId: task.responsavelUsuarioId,
    dueAt: task.dueAt,
    status: task.status,
    ativo: task.ativo,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export function mapCrmInteraction(
  item: CrmInteraction,
  options?: CrmMapperOptions,
) {
  return {
    id: item.id,
    leadId: item.leadId,
    tipo: item.tipo,
    resumo: item.resumo,
    detalhes: maskRichText(item.detalhes, options?.includeSensitive),
    responsavelNome: item.responsavelNome,
    responsavelUsuarioId: item.responsavelUsuarioId,
    occurredAt: item.occurredAt,
    ativo: item.ativo,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
