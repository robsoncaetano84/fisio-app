// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// L AU DO S.SERVICE
// ==========================================
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Laudo } from './entities/laudo.entity';
import { LaudoStatus } from './entities/laudo.entity';
import { CreateLaudoDto } from './dto/create-laudo.dto';
import { UpdateLaudoDto } from './dto/update-laudo.dto';
import { CreateExameFisicoDto } from './dto/create-exame-fisico.dto';
import { PacientesService } from '../pacientes/pacientes.service';
import { sanitizePartialUpdate } from './laudo-patch.util';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LaudoExameHistorico } from './entities/laudo-exame-historico.entity';
import { LaudoExameFisico } from './entities/laudo-exame-fisico.entity';
import {
  LaudoReferenceSuggestionResponse,
  LaudoReferencesService,
} from './laudo-references.service';
import { LaudoPdfService } from './laudo-pdf.service';
import { LaudoAiSuggestionService } from './laudo-ai-suggestion.service';
import { LaudoExameFisicoService } from './laudo-exame-fisico.service';
import { validateStructuredExameInput } from './laudo-exame-fisico-structured.util';
import {
  buildCreateLaudoDraft,
  buildGenerateLaudoSuggestionInput,
  buildSuggestionPreview,
  LaudoSuggestionContext,
  LaudoSuggestionPreview,
} from './laudo-suggestion-composer.util';
import { LaudoAiGenerationQuotaService } from './laudo-ai-generation-quota.service';
import { LaudoClinicalContextService } from './laudo-clinical-context.service';
import { logOperationalEvent } from '../../common/observability/operational-logging';

@Injectable()
export class LaudosService {
  private readonly logger = new Logger(LaudosService.name);

  constructor(
    @InjectRepository(Laudo)
    private readonly laudoRepository: Repository<Laudo>,
    private readonly pacientesService: PacientesService,
    private readonly usuariosService: UsuariosService,
    private readonly laudoReferencesService: LaudoReferencesService,
    private readonly laudoPdfService: LaudoPdfService,
    private readonly laudoAiSuggestionService: LaudoAiSuggestionService,
    private readonly laudoExameFisicoService: LaudoExameFisicoService,
    private readonly laudoAiGenerationQuotaService: LaudoAiGenerationQuotaService,
    private readonly laudoClinicalContextService: LaudoClinicalContextService,
  ) {}

  async getSuggestedReferences(
    pacienteId: string,
    usuarioId: string,
  ): Promise<LaudoReferenceSuggestionResponse> {
    await this.pacientesService.findOne(pacienteId, usuarioId);
    const latestAnamnese =
      await this.laudoClinicalContextService.findLatestAnamnese(pacienteId);

    return this.laudoReferencesService.getSuggestedReferences(latestAnamnese);
  }

  async create(
    createLaudoDto: CreateLaudoDto,
    usuarioId: string,
  ): Promise<Laudo> {
    await this.pacientesService.findOne(createLaudoDto.pacienteId, usuarioId);
    validateStructuredExameInput(createLaudoDto.exameFisico);

    const existing = await this.laudoRepository.findOne({
      where: { pacienteId: createLaudoDto.pacienteId },
    });
    if (existing) {
      throw new BadRequestException('Ja existe laudo para este paciente');
    }
    const existingExameFisico = createLaudoDto.exameFisico?.trim()
      ? await this.laudoExameFisicoService.findLatestByPacienteId(
          createLaudoDto.pacienteId,
        )
      : null;
    if (
      existingExameFisico &&
      String(existingExameFisico.exameFisico || '').trim() !==
        String(createLaudoDto.exameFisico || '').trim()
    ) {
      throw new BadRequestException(
        'Exame fisico registrado nao pode ser editado. Ele documenta o estado inicial do paciente na avaliacao.',
      );
    }

    const hasSuggestionMeta =
      createLaudoDto.sugestaoSource ||
      typeof createLaudoDto.examesConsiderados === 'number' ||
      typeof createLaudoDto.examesComLeituraIa === 'number';

    const laudo = this.laudoRepository.create({
      ...createLaudoDto,
      status: LaudoStatus.RASCUNHO_IA,
      validadoPorUsuarioId: null,
      validadoEm: null,
      sugestaoGeradaEm: hasSuggestionMeta ? new Date() : null,
    });
    const saved = await this.laudoRepository.save(laudo);
    if (createLaudoDto.exameFisico?.trim()) {
      await this.laudoExameFisicoService.registerInitial(
        saved,
        {
          pacienteId: createLaudoDto.pacienteId,
          exameFisico: createLaudoDto.exameFisico,
          diagnosticoFuncional: createLaudoDto.diagnosticoFuncional,
          condutas: createLaudoDto.condutas,
        },
        usuarioId,
      );
    }
    return saved;
  }

  async createExameFisico(
    createExameFisicoDto: CreateExameFisicoDto,
    usuarioId: string,
  ): Promise<LaudoExameFisico> {
    await this.pacientesService.findOne(
      createExameFisicoDto.pacienteId,
      usuarioId,
    );
    validateStructuredExameInput(createExameFisicoDto.exameFisico);

    const existing = await this.laudoExameFisicoService.findLatestByPacienteId(
      createExameFisicoDto.pacienteId,
    );
    if (existing) {
      throw new BadRequestException(
        'Exame fisico ja registrado para este paciente. O registro inicial nao pode ser editado.',
      );
    }

    let laudo = await this.laudoRepository.findOne({
      where: { pacienteId: createExameFisicoDto.pacienteId },
      order: { createdAt: 'DESC' },
    });

    if (!laudo) {
      laudo = this.laudoRepository.create({
        pacienteId: createExameFisicoDto.pacienteId,
        diagnosticoFuncional:
          createExameFisicoDto.diagnosticoFuncional ||
          'Diagnostico funcional em elaboracao.',
        condutas:
          createExameFisicoDto.condutas || 'Conduta terapeutica em elaboracao.',
        exameFisico: createExameFisicoDto.exameFisico,
        status: LaudoStatus.RASCUNHO_IA,
        validadoPorUsuarioId: null,
        validadoEm: null,
      });
      laudo = await this.laudoRepository.save(laudo);
    } else {
      laudo.exameFisico = createExameFisicoDto.exameFisico;
      if (createExameFisicoDto.diagnosticoFuncional) {
        laudo.diagnosticoFuncional = createExameFisicoDto.diagnosticoFuncional;
      }
      if (createExameFisicoDto.condutas) {
        laudo.condutas = createExameFisicoDto.condutas;
      }
      laudo.status = LaudoStatus.RASCUNHO_IA;
      laudo.validadoPorUsuarioId = null;
      laudo.validadoEm = null;
      laudo = await this.laudoRepository.save(laudo);
    }

    return this.laudoExameFisicoService.registerInitial(
      laudo,
      createExameFisicoDto,
      usuarioId,
    );
  }

  async findByPaciente(
    pacienteId: string,
    usuarioId: string,
    autoGenerate = false,
  ): Promise<Laudo | null> {
    await this.pacientesService.findOne(pacienteId, usuarioId);
    const existing = await this.laudoRepository.findOne({
      where: { pacienteId },
      order: { createdAt: 'DESC' },
    });
    if (existing || !autoGenerate) {
      return existing
        ? this.laudoExameFisicoService.hydrateLaudo(existing)
        : null;
    }
    return this.laudoExameFisicoService.hydrateLaudo(
      await this.generateAndSaveByPaciente(pacienteId, usuarioId),
    );
  }

  async findOne(id: string, usuarioId: string): Promise<Laudo> {
    const laudo = await this.laudoRepository.findOne({
      where: { id },
    });

    if (!laudo) {
      throw new NotFoundException('Laudo nao encontrado');
    }

    await this.pacientesService.findOne(laudo.pacienteId, usuarioId);
    return this.laudoExameFisicoService.hydrateLaudo(laudo);
  }

  async findLatestByPacienteUsuario(usuarioId: string): Promise<Laudo> {
    const laudo = await this.laudoRepository
      .createQueryBuilder('laudo')
      .leftJoinAndSelect('laudo.paciente', 'paciente')
      .where('paciente.paciente_usuario_id = :usuarioId', { usuarioId })
      .andWhere('paciente.ativo = :ativo', { ativo: true })
      .orderBy('laudo.updatedAt', 'DESC')
      .getOne();

    if (!laudo) {
      throw new NotFoundException('Laudo nao encontrado para este paciente');
    }

    return this.laudoExameFisicoService.hydrateLaudo(laudo);
  }

  async findExameFisicoByPaciente(
    pacienteId: string,
    usuarioId: string,
  ): Promise<LaudoExameFisico | null> {
    await this.pacientesService.findOne(pacienteId, usuarioId);
    return this.laudoExameFisicoService.findLatestByPacienteId(pacienteId);
  }

  async findExameFisicoHistory(
    laudoId: string,
    usuarioId: string,
    limit = 20,
  ): Promise<LaudoExameHistorico[]> {
    await this.findOne(laudoId, usuarioId);
    return this.laudoExameFisicoService.findHistoryByLaudoId(laudoId, limit);
  }

  async update(
    id: string,
    updateLaudoDto: UpdateLaudoDto,
    usuarioId: string,
  ): Promise<Laudo> {
    const laudo = await this.findOne(id, usuarioId);
    const { exameFisico, ...patchSemExameFisico } = updateLaudoDto;
    let exameFisicoInicialRegistrado = false;
    const exameFisicoAntes = String(laudo.exameFisico || '').trim();
    const exameFisicoRecebido = String(exameFisico || '').trim();
    if (typeof exameFisico === 'string') {
      validateStructuredExameInput(exameFisico);
      const exameRegistrado =
        await this.laudoExameFisicoService.findLatestByPacienteId(
          laudo.pacienteId,
        );
      if (
        exameRegistrado &&
        exameFisicoRecebido !== String(exameRegistrado.exameFisico || '').trim()
      ) {
        throw new BadRequestException(
          'Exame fisico registrado nao pode ser editado. Ele documenta o estado inicial do paciente na avaliacao.',
        );
      }
      if (!exameRegistrado && exameFisicoRecebido) {
        await this.laudoExameFisicoService.registerInitial(
          laudo,
          {
            pacienteId: laudo.pacienteId,
            exameFisico,
            diagnosticoFuncional: updateLaudoDto.diagnosticoFuncional,
            condutas: updateLaudoDto.condutas,
          },
          usuarioId,
        );
        exameFisicoInicialRegistrado = true;
      }
    }
    const hasSuggestionMetaUpdate =
      updateLaudoDto.sugestaoSource ||
      typeof updateLaudoDto.examesConsiderados === 'number' ||
      typeof updateLaudoDto.examesComLeituraIa === 'number';
    Object.assign(laudo, sanitizePartialUpdate(patchSemExameFisico));
    if (typeof exameFisico === 'string' && exameFisicoRecebido) {
      laudo.exameFisico = exameFisico;
    }
    if (hasSuggestionMetaUpdate) {
      laudo.sugestaoGeradaEm = new Date();
    }
    // Qualquer alteracao apos aprovacao volta para rascunho e exige nova validacao.
    laudo.status = LaudoStatus.RASCUNHO_IA;
    laudo.validadoPorUsuarioId = null;
    laudo.validadoEm = null;
    const saved = await this.laudoRepository.save(laudo);
    const exameFisicoDepois = String(saved.exameFisico || '').trim();
    const exameFisicoMudou =
      !exameFisicoInicialRegistrado &&
      typeof updateLaudoDto.exameFisico === 'string' &&
      exameFisicoDepois.length > 0 &&
      exameFisicoDepois !== exameFisicoAntes;
    if (exameFisicoMudou) {
      await this.laudoExameFisicoService.registerProfessionalUpdate(
        saved,
        usuarioId,
      );
    }
    return saved;
  }

  async remove(id: string, usuarioId: string): Promise<void> {
    const laudo = await this.findOne(id, usuarioId);
    await this.laudoRepository.remove(laudo);
  }

  async validarLaudo(id: string, usuarioId: string): Promise<Laudo> {
    const laudo = await this.findOne(id, usuarioId);
    this.validateClinicalReportBody(laudo);
    laudo.status = LaudoStatus.VALIDADO_PROFISSIONAL;
    laudo.validadoPorUsuarioId = usuarioId;
    laudo.validadoEm = new Date();
    const saved = await this.laudoRepository.save(laudo);
    logOperationalEvent(
      this.logger,
      'laudo.professional_validation.succeeded',
      {
        laudoId: saved.id,
        pacienteId: saved.pacienteId,
        usuarioId,
        status: saved.status,
      },
    );
    return saved;
  }

  async buildPdfBuffer(
    id: string,
    usuarioId: string,
    tipo: 'laudo' | 'plano',
    _options?: {
      consultedReferenceIds?: string[];
    },
  ): Promise<Buffer> {
    void _options;

    const laudo = await this.findOne(id, usuarioId);
    const paciente = await this.pacientesService.findOne(
      laudo.pacienteId,
      usuarioId,
    );
    const profissional = await this.usuariosService.findById(usuarioId);
    return this.laudoPdfService.buildPdfBuffer({
      laudo,
      pacienteNome: paciente.nomeCompleto,
      profissional,
      tipo,
      audience: 'professional',
    });
  }

  async buildPdfBufferByPacienteUsuario(
    usuarioId: string,
    tipo: 'laudo' | 'plano',
  ): Promise<Buffer> {
    const laudo = await this.findLatestByPacienteUsuario(usuarioId);
    const profissional = await this.usuariosService.findById(
      laudo.paciente.usuarioId,
    );

    return this.laudoPdfService.buildPdfBuffer({
      laudo,
      pacienteNome: laudo.paciente.nomeCompleto,
      profissional,
      tipo,
      audience: 'patient',
    });
  }
  async generateAndSaveByPaciente(
    pacienteId: string,
    usuarioId: string,
  ): Promise<Laudo> {
    const startedAt = Date.now();
    try {
      const suggestionContext =
        await this.laudoClinicalContextService.buildSuggestionContext(
          pacienteId,
          usuarioId,
        );
      const existing = await this.laudoRepository.findOne({
        where: { pacienteId },
        order: { createdAt: 'DESC' },
      });
      if (existing) {
        logOperationalEvent(this.logger, 'laudo.generation.skipped', {
          pacienteId,
          usuarioId,
          reason: 'EXISTING_LAUDO',
          laudoId: existing.id,
          durationMs: Date.now() - startedAt,
        });
        return existing;
      }
      const canUseAiToday =
        await this.laudoAiGenerationQuotaService.acquireDailySlot(pacienteId);
      const referenciasClinicas = await this.buildClinicalReferences(
        suggestionContext,
        canUseAiToday,
      );
      const aiSuggestion = canUseAiToday
        ? await this.laudoAiSuggestionService.generateSuggestion(
            buildGenerateLaudoSuggestionInput(
              suggestionContext,
              referenciasClinicas,
            ),
          )
        : {};

      const draft = buildCreateLaudoDraft({
        pacienteId,
        context: suggestionContext,
        aiSuggestion,
        referenciasClinicas,
      });

      const created = this.laudoRepository.create({
        ...draft.payload,
        status: LaudoStatus.RASCUNHO_IA,
        validadoPorUsuarioId: null,
        validadoEm: null,
        sugestaoSource: draft.source,
        examesConsiderados: draft.examesConsiderados,
        examesComLeituraIa: draft.examesComLeituraIa,
        sugestaoGeradaEm: new Date(),
      });
      const saved = await this.laudoRepository.save(created);
      logOperationalEvent(this.logger, 'laudo.generation.succeeded', {
        pacienteId,
        usuarioId,
        laudoId: saved.id,
        source: draft.source,
        canUseAiToday,
        examesConsiderados: draft.examesConsiderados,
        examesComLeituraIa: draft.examesComLeituraIa,
        referencesCount:
          referenciasClinicas.laudoReferences.length +
          referenciasClinicas.planoReferences.length,
        durationMs: Date.now() - startedAt,
      });
      return saved;
    } catch (error) {
      logOperationalEvent(
        this.logger,
        'laudo.generation.failed',
        {
          pacienteId,
          usuarioId,
          durationMs: Date.now() - startedAt,
          reason: error instanceof Error ? error.message : 'UNKNOWN',
        },
        { severity: 'error', captureToSentry: true },
      );
      throw error;
    }
  }

  async generateSuggestionPreview(
    pacienteId: string,
    usuarioId: string,
  ): Promise<LaudoSuggestionPreview> {
    const startedAt = Date.now();
    try {
      const suggestionContext =
        await this.laudoClinicalContextService.buildSuggestionContext(
          pacienteId,
          usuarioId,
        );
      const referenciasClinicas = await this.buildClinicalReferences(
        suggestionContext,
        true,
      );
      const aiSuggestion =
        await this.laudoAiSuggestionService.generateSuggestion(
          buildGenerateLaudoSuggestionInput(
            suggestionContext,
            referenciasClinicas,
          ),
        );

      const preview = buildSuggestionPreview(
        suggestionContext,
        aiSuggestion,
        referenciasClinicas,
      );
      logOperationalEvent(this.logger, 'laudo.preview.succeeded', {
        pacienteId,
        usuarioId,
        source: preview.source,
        durationMs: Date.now() - startedAt,
      });
      return preview;
    } catch (error) {
      logOperationalEvent(
        this.logger,
        'laudo.preview.failed',
        {
          pacienteId,
          usuarioId,
          durationMs: Date.now() - startedAt,
          reason: error instanceof Error ? error.message : 'UNKNOWN',
        },
        { severity: 'error', captureToSentry: true },
      );
      throw error;
    }
  }

  private async buildClinicalReferences(
    suggestionContext: LaudoSuggestionContext,
    includeUpdatedSearch: boolean,
  ): Promise<LaudoReferenceSuggestionResponse> {
    const curatedReferences =
      this.laudoReferencesService.getSuggestedReferences(
        suggestionContext.anamneses[0] ?? null,
      );
    if (!includeUpdatedSearch) {
      return curatedReferences;
    }

    const updatedReferences =
      await this.laudoAiSuggestionService.findUpdatedClinicalReferences(
        buildGenerateLaudoSuggestionInput(suggestionContext, curatedReferences),
      );

    return this.laudoReferencesService.mergeWithUpdatedReferences(
      curatedReferences,
      updatedReferences,
    );
  }

  private validateClinicalReportBody(laudo: Laudo): void {
    const requiredFields = [
      laudo.motivoAvaliacao,
      laudo.achadosClinicos,
      laudo.conclusao,
    ];
    if (requiredFields.every((value) => this.hasText(value))) {
      return;
    }

    throw new BadRequestException(
      'Preencha os campos obrigatorios do corpo do laudo antes de finalizar.',
    );
  }

  private hasText(value?: string | null): boolean {
    return String(value || '').trim().length > 0;
  }
}
