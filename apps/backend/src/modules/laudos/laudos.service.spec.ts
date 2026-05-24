/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LaudoStatus } from './entities/laudo.entity';
import { LaudosService } from './laudos.service';

describe('LaudosService', () => {
  const makeRepository = () => ({
    findOne: jest.fn(),
    create: jest.fn((input) => input),
    save: jest.fn(async (input) => input),
    remove: jest.fn(),
  });

  const makeSuggestionContext = () => ({
    paciente: {
      nomeCompleto: 'Maria Silva',
      dataNascimento: new Date('1990-01-01T00:00:00.000Z'),
      sexo: 'FEMININO',
      profissao: 'Atleta',
    },
    anamneses: [],
    evolucoes: [],
    exames: [],
    exameFisicoResumo: null,
  });

  const makeService = () => {
    const laudoRepository = makeRepository();
    const pacientesService = {
      findOne: jest.fn().mockResolvedValue({
        id: 'paciente-1',
        usuarioId: 'profissional-1',
        nomeCompleto: 'Maria Silva',
      }),
      isMasterAdminByUsuarioId: jest.fn(),
    };
    const usuariosService = {
      findById: jest.fn(),
    };
    const curatedReferences = {
      profile: 'GERAL',
      disclaimer: 'Validar clinicamente.',
      laudoReferences: [],
      planoReferences: [],
    };
    const laudoReferencesService = {
      getSuggestedReferences: jest.fn().mockReturnValue(curatedReferences),
      mergeWithUpdatedReferences: jest
        .fn()
        .mockImplementation((base, updated) => ({
          ...base,
          laudoReferences: [
            ...(base.laudoReferences || []),
            ...(updated?.laudoReferences || []),
          ],
          planoReferences: [
            ...(base.planoReferences || []),
            ...(updated?.planoReferences || []),
          ],
        })),
    };
    const laudoPdfService = {
      buildPdfBuffer: jest.fn(),
    };
    const laudoAiSuggestionService = {
      generateSuggestion: jest.fn(),
      findUpdatedClinicalReferences: jest.fn(),
    };
    const laudoExameFisicoService = {
      findLatestByPacienteId: jest.fn(),
      registerInitial: jest.fn(),
      registerProfessionalUpdate: jest.fn(),
      hydrateLaudo: jest.fn(async (laudo) => laudo),
      findHistoryByLaudoId: jest.fn(),
    };
    const laudoAiGenerationQuotaService = {
      acquireDailySlot: jest.fn(),
    };
    const laudoClinicalContextService = {
      buildSuggestionContext: jest
        .fn()
        .mockResolvedValue(makeSuggestionContext()),
      findLatestAnamnese: jest.fn(),
    };

    const service = new LaudosService(
      laudoRepository as any,
      pacientesService as any,
      usuariosService as any,
      laudoReferencesService as any,
      laudoPdfService as any,
      laudoAiSuggestionService as any,
      laudoExameFisicoService as any,
      laudoAiGenerationQuotaService as any,
      laudoClinicalContextService as any,
    );

    return {
      service,
      laudoRepository,
      pacientesService,
      laudoReferencesService,
      laudoAiSuggestionService,
      laudoExameFisicoService,
      laudoAiGenerationQuotaService,
      laudoClinicalContextService,
    };
  };

  const makeLaudo = () =>
    ({
      id: 'laudo-1',
      pacienteId: 'paciente-1',
      motivoAvaliacao: 'Dor lombar persistente',
      historicoClinico: 'Sintomas ha 2 semanas',
      achadosClinicos: 'Mobilidade lombar reduzida',
      diagnosticoFuncional: 'Diagnostico anterior',
      conclusao: 'Limitacao funcional atual',
      condutas: 'Conduta anterior',
      exameFisico: 'Exame fisico inicial',
      status: LaudoStatus.VALIDADO_PROFISSIONAL,
      validadoPorUsuarioId: 'profissional-1',
      validadoEm: new Date('2026-01-01T00:00:00.000Z'),
      sugestaoSource: null,
      examesConsiderados: null,
      examesComLeituraIa: null,
      sugestaoGeradaEm: null,
    }) as any;

  it('delegates laudo access scope to pacientes service', async () => {
    const { service, laudoRepository, pacientesService } = makeService();
    const laudo = makeLaudo();
    laudoRepository.findOne.mockResolvedValue(laudo);

    await expect(service.findOne('laudo-1', 'profissional-2')).resolves.toBe(
      laudo,
    );

    expect(laudoRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'laudo-1' },
    });
    expect(pacientesService.findOne).toHaveBeenCalledWith(
      'paciente-1',
      'profissional-2',
    );
    expect(pacientesService.isMasterAdminByUsuarioId).not.toHaveBeenCalled();
  });

  it('hides laudo when paciente scope denies access', async () => {
    const { service, laudoRepository, pacientesService } = makeService();
    laudoRepository.findOne.mockResolvedValue(makeLaudo());
    pacientesService.findOne.mockRejectedValue(
      new NotFoundException('Paciente nao encontrado'),
    );

    await expect(service.findOne('laudo-1', 'profissional-2')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects changes to a registered initial physical exam', async () => {
    const { service, laudoRepository, laudoExameFisicoService } = makeService();
    laudoRepository.findOne.mockResolvedValue(makeLaudo());
    laudoExameFisicoService.findLatestByPacienteId.mockResolvedValue({
      exameFisico: 'Exame fisico inicial',
    });

    await expect(
      service.update(
        'laudo-1',
        { exameFisico: 'Exame fisico alterado' } as any,
        'profissional-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('resets professional validation after a regular update', async () => {
    const { service, laudoRepository, laudoExameFisicoService } = makeService();
    const laudo = makeLaudo();
    laudoRepository.findOne.mockResolvedValue(laudo);
    laudoRepository.save.mockImplementation(async (input) => input);
    laudoExameFisicoService.findLatestByPacienteId.mockResolvedValue({
      exameFisico: 'Exame fisico inicial',
    });

    const result = await service.update(
      'laudo-1',
      { diagnosticoFuncional: 'Diagnostico revisado' } as any,
      'profissional-1',
    );

    expect(result).toMatchObject({
      diagnosticoFuncional: 'Diagnostico revisado',
      status: LaudoStatus.RASCUNHO_IA,
      validadoPorUsuarioId: null,
      validadoEm: null,
    });
    expect(laudoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: LaudoStatus.RASCUNHO_IA,
        validadoPorUsuarioId: null,
        validadoEm: null,
      }),
    );
  });

  it('requires structured clinical body before professional validation', async () => {
    const { service, laudoRepository } = makeService();
    laudoRepository.findOne.mockResolvedValue({
      ...makeLaudo(),
      motivoAvaliacao: '',
      achadosClinicos: '',
      conclusao: '',
    });

    await expect(
      service.validarLaudo('laudo-1', 'profissional-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('validates laudo when required structured body fields are filled', async () => {
    const { service, laudoRepository } = makeService();
    const laudo = { ...makeLaudo(), status: LaudoStatus.RASCUNHO_IA };
    laudoRepository.findOne.mockResolvedValue(laudo);
    laudoRepository.save.mockImplementation(async (input) => input);

    const result = await service.validarLaudo('laudo-1', 'profissional-1');

    expect(result).toMatchObject({
      status: LaudoStatus.VALIDADO_PROFISSIONAL,
      validadoPorUsuarioId: 'profissional-1',
      validadoEm: expect.any(Date),
    });
  });

  it('does not call AI when daily generation quota is unavailable', async () => {
    const {
      service,
      laudoRepository,
      laudoAiSuggestionService,
      laudoAiGenerationQuotaService,
    } = makeService();
    laudoRepository.findOne.mockResolvedValue(null);
    laudoAiGenerationQuotaService.acquireDailySlot.mockResolvedValue(false);

    await service.generateAndSaveByPaciente('paciente-1', 'profissional-1');

    expect(laudoAiSuggestionService.generateSuggestion).not.toHaveBeenCalled();
    expect(
      laudoAiSuggestionService.findUpdatedClinicalReferences,
    ).not.toHaveBeenCalled();
    expect(laudoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pacienteId: 'paciente-1',
        status: LaudoStatus.RASCUNHO_IA,
        sugestaoSource: 'rules',
        examesConsiderados: 0,
        examesComLeituraIa: 0,
        sugestaoGeradaEm: expect.any(Date),
      }),
    );
  });

  it('uses AI suggestion when daily generation quota is available', async () => {
    const {
      service,
      laudoRepository,
      laudoAiSuggestionService,
      laudoAiGenerationQuotaService,
      laudoClinicalContextService,
    } = makeService();
    laudoRepository.findOne.mockResolvedValue(null);
    laudoAiGenerationQuotaService.acquireDailySlot.mockResolvedValue(true);
    laudoAiSuggestionService.findUpdatedClinicalReferences.mockResolvedValue({
      planoReferences: [
        {
          id: 'updated-study',
          title: 'Updated study',
          category: 'ARTIGO',
          source: 'PubMed',
          url: 'https://pubmed.ncbi.nlm.nih.gov/1/',
          rationale: 'Atualiza plano.',
        },
      ],
    });
    laudoAiSuggestionService.generateSuggestion.mockResolvedValue({
      diagnosticoFuncional: 'Diagnostico por IA',
      condutas: 'Condutas por IA',
    });

    await service.generateAndSaveByPaciente('paciente-1', 'profissional-1');

    expect(
      laudoClinicalContextService.buildSuggestionContext,
    ).toHaveBeenCalledWith('paciente-1', 'profissional-1');
    expect(laudoAiSuggestionService.generateSuggestion).toHaveBeenCalledTimes(
      1,
    );
    expect(
      laudoAiSuggestionService.findUpdatedClinicalReferences,
    ).toHaveBeenCalledTimes(1);
    expect(laudoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pacienteId: 'paciente-1',
        diagnosticoFuncional: 'Diagnostico por IA',
        condutas: 'Condutas por IA',
        sugestaoSource: 'ai',
      }),
    );
  });
});
