import {
  ClinicalPhoto,
  ClinicalPhotoType,
  ClinicalPhotoView,
} from './entities/clinical-photo.entity';
import { ClinicalPhotoAiService } from './clinical-photo-ai.service';

describe('ClinicalPhotoAiService', () => {
  const createOpenAiService = () =>
    ({
      isConfigured: jest.fn(),
      resolveModel: jest.fn().mockReturnValue('test-model'),
      getPositiveIntegerEnv: jest.fn().mockReturnValue(15000),
      createJsonResponse: jest.fn(),
    }) as any;

  const photo = {
    id: 'photo-1',
    tipo: ClinicalPhotoType.FOTO_POSTURAL_FRONTAL,
    vista: ClinicalPhotoView.ANTERIOR,
    regiao: 'ombro',
    lado: 'direito',
    intensidadeDor: 4,
    observacao: 'dor ao elevar o braco',
    mimeType: 'image/png',
  } as ClinicalPhoto;

  afterEach(() => {
    delete process.env.OPENAI_EXAM_AI_ENABLED;
  });

  it('returns null when OpenAI is not configured', async () => {
    const openAiService = createOpenAiService();
    openAiService.isConfigured.mockReturnValue(false);
    const service = new ClinicalPhotoAiService(openAiService);

    await expect(
      service.analyzePhoto({ photo, fileBuffer: Buffer.from('image') }),
    ).resolves.toBeNull();
    expect(openAiService.createJsonResponse).not.toHaveBeenCalled();
  });

  it('maps clinical photo analysis response to summary fields', async () => {
    const openAiService = createOpenAiService();
    openAiService.isConfigured.mockReturnValue(true);
    openAiService.createJsonResponse.mockResolvedValue({
      parsed: {
        qualidadeImagemScore: 87.4,
        qualidadeImagem: 'boa',
        observacoesVisuais: ['ombro direito elevado'],
        assimetriasProvaveis: ['assimetria escapular'],
        sugestoesExameFisico: ['avaliar ADM de ombro'],
        redFlagsVisuais: [''],
        limitacoes: 'foto unica, sem escala objetiva',
      },
    });
    const service = new ClinicalPhotoAiService(openAiService);

    const result = await service.analyzePhoto({
      photo,
      fileBuffer: Buffer.from('image'),
    });

    expect(result).toMatchObject({
      qualityScore: 87,
      limitations: 'foto unica, sem escala objetiva',
      raw: expect.any(Object),
    });
    expect(result?.summary).toContain('Qualidade: boa');
    expect(result?.summary).toContain('Validar no exame fisico');
  });

  it('maps clinical photo comparison response', async () => {
    const openAiService = createOpenAiService();
    openAiService.isConfigured.mockReturnValue(true);
    openAiService.createJsonResponse.mockResolvedValue({
      parsed: {
        comparabilidade: 'boa',
        mudancasVisuais: ['menor inclinacao lateral'],
        melhoraPioraSemMudanca: 'melhora discreta',
        sugestaoSoapObjetivo: 'registrar melhora postural',
        limitacoes: '',
        recomendacaoRepetirFoto: 'repetir com mesma distancia',
      },
    });
    const service = new ClinicalPhotoAiService(openAiService);

    const result = await service.comparePhotos({
      baseline: photo,
      followup: { ...photo, id: 'photo-2' } as ClinicalPhoto,
      baselineBuffer: Buffer.from('baseline'),
      followupBuffer: Buffer.from('followup'),
      observacao: 'comparar postura',
    });

    expect(result?.summary).toContain('Comparabilidade: boa');
    expect(result?.comparison).toBe('menor inclinacao lateral');
    expect(result?.limitations).toBe('repetir com mesma distancia');
  });
});
