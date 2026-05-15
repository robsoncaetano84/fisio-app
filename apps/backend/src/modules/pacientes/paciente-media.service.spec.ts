import { NotFoundException } from '@nestjs/common';
import {
  ClinicalPhotoType,
  ClinicalPhotoView,
} from './entities/clinical-photo.entity';
import { PacienteMediaService } from './paciente-media.service';

jest.mock('./exame-storage', () => ({
  readExameFile: jest.fn(async () => Buffer.from('file')),
}));

describe('PacienteMediaService', () => {
  const makeRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((input) => input),
    save: jest.fn(async (input) => input),
    remove: jest.fn(async (input) => input),
  });

  const makeService = () => {
    const pacienteExameRepository = makeRepository();
    const clinicalPhotoRepository = makeRepository();
    const clinicalPhotoComparisonRepository = makeRepository();
    const clinicalPhotoAiService = {
      analyzePhoto: jest.fn(),
      comparePhotos: jest.fn(),
    };
    const service = new PacienteMediaService(
      pacienteExameRepository as any,
      clinicalPhotoRepository as any,
      clinicalPhotoComparisonRepository as any,
      clinicalPhotoAiService as any,
    );

    return {
      service,
      pacienteExameRepository,
      clinicalPhotoRepository,
      clinicalPhotoComparisonRepository,
      clinicalPhotoAiService,
    };
  };

  it('creates exam with trimmed optional fields', async () => {
    const { service, pacienteExameRepository } = makeService();

    await service.createExame('paciente-1', 'owner-1', {
      nomeOriginal: 'exame.pdf',
      nomeArquivo: 'stored.pdf',
      mimeType: 'application/pdf',
      tamanhoBytes: 123,
      caminhoArquivo: 'path/exame.pdf',
      tipoExame: ' RM ',
      observacao: ' observacao ',
      dataExame: null,
    });

    expect(pacienteExameRepository.create).toHaveBeenCalledWith({
      pacienteId: 'paciente-1',
      usuarioId: 'owner-1',
      nomeOriginal: 'exame.pdf',
      nomeArquivo: 'stored.pdf',
      mimeType: 'application/pdf',
      tamanhoBytes: 123,
      caminhoArquivo: 'path/exame.pdf',
      tipoExame: 'RM',
      observacao: 'observacao',
      dataExame: null,
    });
  });

  it('throws when exam is not found', async () => {
    const { service, pacienteExameRepository } = makeService();
    pacienteExameRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findExameOrFail('paciente-1', 'exame-1', 'owner-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates clinical photo with normalized pain intensity', async () => {
    const { service, clinicalPhotoRepository } = makeService();

    await service.createClinicalPhoto('paciente-1', 'owner-1', {
      nomeOriginal: 'foto.png',
      nomeArquivo: 'stored.png',
      mimeType: 'image/png',
      tamanhoBytes: 123,
      caminhoArquivo: 'path/foto.png',
      tipo: ClinicalPhotoType.FOTO_MOVIMENTO_ADM,
      vista: ClinicalPhotoView.MOVIMENTO,
      regiao: ' ombro ',
      lado: ' direito ',
      intensidadeDor: 15,
      observacao: ' elevar braco ',
      dataFoto: null,
    });

    expect(clinicalPhotoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pacienteId: 'paciente-1',
        usuarioId: 'owner-1',
        tipo: ClinicalPhotoType.FOTO_MOVIMENTO_ADM,
        vista: ClinicalPhotoView.MOVIMENTO,
        regiao: 'ombro',
        lado: 'direito',
        intensidadeDor: 10,
        observacao: 'elevar braco',
        qualityScore: null,
        confirmadoPorProfissional: false,
      }),
    );
  });

  it('builds comparison fallback when AI is unavailable', async () => {
    const {
      service,
      clinicalPhotoRepository,
      clinicalPhotoComparisonRepository,
      clinicalPhotoAiService,
    } = makeService();
    clinicalPhotoRepository.findOne
      .mockResolvedValueOnce({
        id: 'base-1',
        pacienteId: 'paciente-1',
        usuarioId: 'owner-1',
        caminhoArquivo: 'base.png',
        mimeType: 'image/png',
        tipo: ClinicalPhotoType.FOTO_EVOLUCAO_BASELINE,
        vista: ClinicalPhotoView.ANTERIOR,
        regiao: 'joelho',
      })
      .mockResolvedValueOnce({
        id: 'follow-1',
        pacienteId: 'paciente-1',
        usuarioId: 'owner-1',
        caminhoArquivo: 'follow.png',
        mimeType: 'image/png',
        tipo: ClinicalPhotoType.FOTO_EVOLUCAO_FOLLOWUP,
        vista: ClinicalPhotoView.ANTERIOR,
        regiao: 'joelho',
      });
    clinicalPhotoAiService.comparePhotos.mockResolvedValue(null);
    clinicalPhotoComparisonRepository.create.mockReturnValue({
      id: 'comparison-1',
    });

    const result = await service.compareClinicalPhotos(
      'paciente-1',
      'owner-1',
      {
        baselinePhotoId: 'base-1',
        followupPhotoId: 'follow-1',
        observacao: ' comparar ',
      },
    );

    expect(result).toEqual({ id: 'comparison-1' });
    expect(clinicalPhotoComparisonRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pacienteId: 'paciente-1',
        usuarioId: 'owner-1',
        regiao: 'joelho',
        vista: ClinicalPhotoView.ANTERIOR,
        observacao: 'comparar',
        resumo:
          'Comparacao registrada. Analise visual por IA indisponivel no momento.',
      }),
    );
  });
});
