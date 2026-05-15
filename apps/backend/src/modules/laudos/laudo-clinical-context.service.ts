import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { PacienteExame } from '../pacientes/entities/paciente-exame.entity';
import { PacientesService } from '../pacientes/pacientes.service';
import { Laudo } from './entities/laudo.entity';
import { LaudoAiSuggestionService } from './laudo-ai-suggestion.service';
import { LaudoExameFisicoService } from './laudo-exame-fisico.service';
import { formatExameFisicoForDisplay } from './laudo-exame-fisico-structured.util';
import { LaudoSuggestionContext } from './laudo-suggestion-composer.util';

@Injectable()
export class LaudoClinicalContextService {
  constructor(
    @InjectRepository(Laudo)
    private readonly laudoRepository: Repository<Laudo>,
    @InjectRepository(Anamnese)
    private readonly anamneseRepository: Repository<Anamnese>,
    @InjectRepository(Evolucao)
    private readonly evolucaoRepository: Repository<Evolucao>,
    @InjectRepository(PacienteExame)
    private readonly pacienteExameRepository: Repository<PacienteExame>,
    private readonly pacientesService: PacientesService,
    private readonly laudoAiSuggestionService: LaudoAiSuggestionService,
    private readonly laudoExameFisicoService: LaudoExameFisicoService,
  ) {}

  async findLatestAnamnese(pacienteId: string): Promise<Anamnese | null> {
    return this.anamneseRepository.findOne({
      where: { pacienteId },
      order: { createdAt: 'DESC' },
    });
  }

  async buildSuggestionContext(
    pacienteId: string,
    usuarioId: string,
  ): Promise<LaudoSuggestionContext> {
    const paciente = await this.pacientesService.findOne(pacienteId, usuarioId);
    const anamneses = await this.anamneseRepository.find({
      where: { pacienteId },
      order: { createdAt: 'DESC' },
    });
    const evolucoes = await this.evolucaoRepository.find({
      where: { pacienteId },
      order: { createdAt: 'DESC' },
    });
    const exames = await this.pacienteExameRepository.find({
      where: { pacienteId, usuarioId },
      order: { createdAt: 'DESC' },
      take: 12,
    });
    const latestLaudo = await this.laudoRepository.findOne({
      where: { pacienteId },
      order: { updatedAt: 'DESC' },
    });
    const examesInterpretados =
      await this.laudoAiSuggestionService.buildExamInsights(exames);
    const exameFisico =
      await this.laudoExameFisicoService.findLatestByPacienteId(pacienteId);
    const rawExameFisico = exameFisico?.exameFisico || latestLaudo?.exameFisico;
    const exameFisicoResumo = rawExameFisico
      ? formatExameFisicoForDisplay(rawExameFisico)
      : null;

    return {
      paciente,
      anamneses,
      evolucoes,
      exames: examesInterpretados,
      exameFisicoResumo,
    };
  }
}
