import { CrmInteractionType } from './entities/crm-interaction.entity';
import { CrmLeadChannel, CrmLeadStage } from './entities/crm-lead.entity';
import { CrmTaskStatus } from './entities/crm-task.entity';
import { mapCrmInteraction, mapCrmLead, mapCrmTask } from './crm-entity.mapper';

describe('crm entity mapper', () => {
  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-02T00:00:00.000Z');

  it('maps lead and masks observations by default', () => {
    const lead = {
      id: 'lead-1',
      nome: 'Lead Teste',
      empresa: 'Empresa',
      canal: CrmLeadChannel.SITE,
      stage: CrmLeadStage.NOVO,
      responsavelNome: 'Admin',
      responsavelUsuarioId: 'user-1',
      valorPotencial: '123.45',
      observacoes: 'observacao sensivel',
      ativo: true,
      createdAt,
      updatedAt,
    } as any;

    expect(mapCrmLead(lead)).toMatchObject({
      id: 'lead-1',
      valorPotencial: 123.45,
      observacoes: '[mascarado]',
    });
    expect(mapCrmLead(lead, { includeSensitive: true }).observacoes).toBe(
      'observacao sensivel',
    );
  });

  it('maps task and masks description by default', () => {
    const task = {
      id: 'task-1',
      titulo: 'Ligar',
      descricao: 'descricao sensivel',
      leadId: 'lead-1',
      responsavelNome: 'Admin',
      responsavelUsuarioId: 'user-1',
      dueAt: createdAt,
      status: CrmTaskStatus.PENDENTE,
      ativo: true,
      createdAt,
      updatedAt,
    } as any;

    expect(mapCrmTask(task)).toMatchObject({
      id: 'task-1',
      descricao: '[mascarado]',
    });
  });

  it('maps interaction and masks details by default', () => {
    const interaction = {
      id: 'int-1',
      leadId: 'lead-1',
      tipo: CrmInteractionType.WHATSAPP,
      resumo: 'Contato',
      detalhes: 'detalhe sensivel',
      responsavelNome: 'Admin',
      responsavelUsuarioId: 'user-1',
      occurredAt: createdAt,
      ativo: true,
      createdAt,
      updatedAt,
    } as any;

    expect(mapCrmInteraction(interaction)).toMatchObject({
      id: 'int-1',
      detalhes: '[mascarado]',
    });
  });
});
