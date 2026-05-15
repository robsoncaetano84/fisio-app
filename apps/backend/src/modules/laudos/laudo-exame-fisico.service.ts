import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExameFisicoDto } from './dto/create-exame-fisico.dto';
import { Laudo } from './entities/laudo.entity';
import { LaudoExameFisico } from './entities/laudo-exame-fisico.entity';
import {
  LaudoExameHistorico,
  LaudoExameHistoricoAcao,
  LaudoExameHistoricoOrigem,
} from './entities/laudo-exame-historico.entity';

@Injectable()
export class LaudoExameFisicoService {
  constructor(
    @InjectRepository(Laudo)
    private readonly laudoRepository: Repository<Laudo>,
    @InjectRepository(LaudoExameFisico)
    private readonly laudoExameFisicoRepository: Repository<LaudoExameFisico>,
    @InjectRepository(LaudoExameHistorico)
    private readonly laudoExameHistoricoRepository: Repository<LaudoExameHistorico>,
  ) {}

  async findLatestByPacienteId(
    pacienteId: string,
  ): Promise<LaudoExameFisico | null> {
    return this.laudoExameFisicoRepository.findOne({
      where: { pacienteId },
      order: { createdAt: 'DESC' },
    });
  }

  async findHistoryByLaudoId(
    laudoId: string,
    limit = 20,
  ): Promise<LaudoExameHistorico[]> {
    return this.laudoExameHistoricoRepository.find({
      where: { laudoId },
      order: { revisao: 'DESC' },
      take: this.normalizeLimit(limit, 20, 100),
    });
  }

  async hydrateLaudo(laudo: Laudo): Promise<Laudo> {
    const exame = await this.findLatestByPacienteId(laudo.pacienteId);
    if (exame?.exameFisico) {
      laudo.exameFisico = exame.exameFisico;
    }
    return laudo;
  }

  async registerInitial(
    laudo: Laudo,
    input: CreateExameFisicoDto,
    usuarioId: string | null,
  ): Promise<LaudoExameFisico> {
    const exame = String(input.exameFisico || '').trim();
    if (!exame) {
      throw new BadRequestException('Exame fisico e obrigatorio.');
    }

    const existing = await this.findLatestByPacienteId(input.pacienteId);
    if (existing) return existing;

    const created = this.laudoExameFisicoRepository.create({
      pacienteId: input.pacienteId,
      laudoId: laudo.id,
      exameFisico: input.exameFisico,
      diagnosticoFuncional: input.diagnosticoFuncional || null,
      condutas: input.condutas || null,
      registradoPorUsuarioId: usuarioId,
    });
    const saved = await this.laudoExameFisicoRepository.save(created);

    laudo.exameFisico = input.exameFisico;
    await this.laudoRepository.save(laudo);
    await this.registerHistory(
      laudo,
      usuarioId,
      LaudoExameHistoricoAcao.CREATE,
      LaudoExameHistoricoOrigem.PROFISSIONAL,
    );

    return saved;
  }

  async registerProfessionalUpdate(
    laudo: Laudo,
    usuarioId: string | null,
  ): Promise<void> {
    await this.registerHistory(
      laudo,
      usuarioId,
      LaudoExameHistoricoAcao.UPDATE,
      LaudoExameHistoricoOrigem.PROFISSIONAL,
    );
  }

  private async registerHistory(
    laudo: Laudo,
    usuarioId: string | null,
    acao: LaudoExameHistoricoAcao,
    origem: LaudoExameHistoricoOrigem,
  ): Promise<void> {
    const exame = String(laudo.exameFisico || '').trim();
    if (!exame) return;

    const ultimo = await this.laudoExameHistoricoRepository.findOne({
      where: { laudoId: laudo.id },
      order: { revisao: 'DESC' },
      select: ['id', 'revisao'],
    });

    const payload = {
      laudoId: laudo.id,
      pacienteId: laudo.pacienteId,
      exameFisico: laudo.exameFisico,
      status: laudo.status,
      updatedAt: laudo.updatedAt,
      createdAt: laudo.createdAt,
    };

    const historico = this.laudoExameHistoricoRepository.create({
      laudoId: laudo.id,
      pacienteId: laudo.pacienteId,
      revisao: (ultimo?.revisao || 0) + 1,
      acao,
      origem,
      alteradoPorUsuarioId: usuarioId || null,
      payload,
    });

    await this.laudoExameHistoricoRepository.save(historico);
  }

  private normalizeLimit(value: number, fallback: number, max: number): number {
    if (!Number.isFinite(value)) return fallback;
    const integer = Math.floor(value);
    if (integer < 1) return 1;
    if (integer > max) return max;
    return integer;
  }
}
