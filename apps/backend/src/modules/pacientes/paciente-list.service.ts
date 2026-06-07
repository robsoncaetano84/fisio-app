import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Atividade } from '../atividades/entities/atividade.entity';
import { Laudo, LaudoStatus } from '../laudos/entities/laudo.entity';
import { Paciente, PacienteCadastroOrigem } from './entities/paciente.entity';
import {
  PacienteCicloStatus,
  PacienteListItemDto,
} from './dto/paciente-list-item.dto';
import { shouldReplaceQuickInviteName } from './paciente-quick-invite.util';

@Injectable()
export class PacienteListService {
  constructor(
    @InjectRepository(Anamnese)
    private readonly anamneseRepository: Repository<Anamnese>,
    @InjectRepository(Laudo)
    private readonly laudoRepository: Repository<Laudo>,
    @InjectRepository(Atividade)
    private readonly atividadeRepository: Repository<Atividade>,
  ) {}

  applyDisplayNameFallback(paciente: Paciente): Paciente {
    if (
      paciente.cadastroOrigem === PacienteCadastroOrigem.CONVITE_RAPIDO &&
      shouldReplaceQuickInviteName(paciente.nomeCompleto) &&
      paciente.pacienteUsuario?.nome
    ) {
      paciente.nomeCompleto = paciente.pacienteUsuario.nome;
    }
    return paciente;
  }

  addPacienteListSelects(query: SelectQueryBuilder<Paciente>) {
    return query
      .select([
        'p.id',
        'p.nomeCompleto',
        'p.cpf',
        'p.rg',
        'p.dataNascimento',
        'p.sexo',
        'p.estadoCivil',
        'p.profissao',
        'p.enderecoRua',
        'p.enderecoNumero',
        'p.enderecoComplemento',
        'p.enderecoBairro',
        'p.enderecoCep',
        'p.enderecoCidade',
        'p.enderecoUf',
        'p.contatoWhatsapp',
        'p.contatoTelefone',
        'p.contatoEmail',
        'p.ativo',
        'p.usuarioId',
        'p.pacienteUsuarioId',
        'p.anamneseLiberadaPaciente',
        'p.anamneseSolicitacaoPendente',
        'p.anamneseSolicitacaoEm',
        'p.anamneseSolicitacaoUltimaEm',
        'p.cadastroOrigem',
        'p.vinculoStatus',
        'p.conviteEnviadoEm',
        'p.conviteAceitoEm',
        'p.appAccessEvents',
        'p.createdAt',
        'p.updatedAt',
      ])
      .leftJoin('p.pacienteUsuario', 'pacienteUsuario')
      .addSelect(['pacienteUsuario.id', 'pacienteUsuario.nome']);
  }

  toPacienteListItem(
    paciente: Paciente,
    statusCiclo: PacienteCicloStatus = PacienteCicloStatus.AGUARDANDO_ANAMNESE,
  ): PacienteListItemDto {
    return {
      id: paciente.id,
      nomeCompleto: paciente.nomeCompleto,
      cpf: paciente.cpf,
      rg: paciente.rg || null,
      dataNascimento: paciente.dataNascimento,
      sexo: paciente.sexo,
      estadoCivil: paciente.estadoCivil || null,
      profissao: paciente.profissao || null,
      enderecoRua: paciente.enderecoRua || null,
      enderecoNumero: paciente.enderecoNumero || null,
      enderecoComplemento: paciente.enderecoComplemento || null,
      enderecoBairro: paciente.enderecoBairro || null,
      enderecoCep: paciente.enderecoCep || null,
      enderecoCidade: paciente.enderecoCidade || null,
      enderecoUf: paciente.enderecoUf || null,
      contatoWhatsapp: paciente.contatoWhatsapp,
      contatoTelefone: paciente.contatoTelefone || null,
      contatoEmail: paciente.contatoEmail || null,
      ativo: paciente.ativo,
      usuarioId: paciente.usuarioId,
      pacienteUsuarioId: paciente.pacienteUsuarioId || null,
      anamneseLiberadaPaciente: paciente.anamneseLiberadaPaciente,
      anamneseSolicitacaoPendente: paciente.anamneseSolicitacaoPendente,
      anamneseSolicitacaoEm: paciente.anamneseSolicitacaoEm || null,
      anamneseSolicitacaoUltimaEm: paciente.anamneseSolicitacaoUltimaEm || null,
      cadastroOrigem: paciente.cadastroOrigem,
      vinculoStatus: paciente.vinculoStatus,
      statusCiclo,
      conviteEnviadoEm: paciente.conviteEnviadoEm || null,
      conviteAceitoEm: paciente.conviteAceitoEm || null,
      appAccessEvents: Array.isArray(paciente.appAccessEvents)
        ? paciente.appAccessEvents
        : [],
      createdAt: paciente.createdAt,
      updatedAt: paciente.updatedAt,
    };
  }

  async buildCicloStatusByPacienteIds(
    pacienteIds: string[],
  ): Promise<Map<string, PacienteCicloStatus>> {
    const statusByPaciente = new Map<string, PacienteCicloStatus>();
    if (!pacienteIds.length) return statusByPaciente;

    const anamneseRows = await this.anamneseRepository
      .createQueryBuilder('a')
      .select('a.pacienteId', 'pacienteId')
      .where('a.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .groupBy('a.pacienteId')
      .getRawMany<{ pacienteId: string }>();
    const anamnesePacienteIds = new Set(
      anamneseRows.map((row) => row.pacienteId),
    );

    const latestLaudos = await this.laudoRepository
      .createQueryBuilder('l')
      .where('l.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .orderBy('l.pacienteId', 'ASC')
      .addOrderBy('l.updatedAt', 'DESC')
      .getMany();
    const laudoByPaciente = new Map<string, Laudo>();
    latestLaudos.forEach((item) => {
      if (!laudoByPaciente.has(item.pacienteId)) {
        laudoByPaciente.set(item.pacienteId, item);
      }
    });

    const pacientesComAtividadeAtiva = await this.atividadeRepository
      .createQueryBuilder('a')
      .select('a.pacienteId', 'pacienteId')
      .where('a.ativo = :ativo', { ativo: true })
      .andWhere('a.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .groupBy('a.pacienteId')
      .getRawMany<{ pacienteId: string }>();
    const atividadePacienteIds = new Set(
      pacientesComAtividadeAtiva.map((row) => row.pacienteId),
    );

    for (const pacienteId of pacienteIds) {
      const hasAnamnese = anamnesePacienteIds.has(pacienteId);
      const lastLaudo = laudoByPaciente.get(pacienteId);
      const hasAltaDocumento =
        (lastLaudo?.status === LaudoStatus.VALIDADO_PROFISSIONAL ||
          lastLaudo?.status === LaudoStatus.PUBLICADO_PACIENTE) &&
        !!lastLaudo.criteriosAlta;
      const hasActiveActivity = atividadePacienteIds.has(pacienteId);
      const tratamentoConcluido = hasAltaDocumento && !hasActiveActivity;

      if (tratamentoConcluido) {
        statusByPaciente.set(pacienteId, PacienteCicloStatus.ALTA_CONCLUIDA);
      } else if (hasAnamnese) {
        statusByPaciente.set(pacienteId, PacienteCicloStatus.EM_TRATAMENTO);
      } else {
        statusByPaciente.set(
          pacienteId,
          PacienteCicloStatus.AGUARDANDO_ANAMNESE,
        );
      }
    }

    return statusByPaciente;
  }
}
