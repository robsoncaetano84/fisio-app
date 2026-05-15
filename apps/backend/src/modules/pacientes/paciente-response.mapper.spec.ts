import {
  ClinicalPhotoType,
  ClinicalPhotoView,
} from './entities/clinical-photo.entity';
import {
  toClinicalPhotoComparisonResponse,
  toClinicalPhotoResponse,
  toExameResponse,
} from './paciente-response.mapper';

describe('paciente-response.mapper', () => {
  const now = new Date('2026-01-02T03:04:05.000Z');

  it('maps paciente exam response with download url', () => {
    const response = toExameResponse('paciente-1', {
      id: 'exame-1',
      pacienteId: 'paciente-1',
      nomeOriginal: 'exame.pdf',
      mimeType: 'application/pdf',
      tamanhoBytes: 123,
      tipoExame: 'RM',
      observacao: 'observacao',
      dataExame: now,
      createdAt: now,
      updatedAt: now,
    } as any);

    expect(response).toMatchObject({
      id: 'exame-1',
      downloadUrl: '/api/pacientes/paciente-1/exames/exame-1/arquivo',
    });
  });

  it('maps clinical photo response with download url and AI fields', () => {
    const response = toClinicalPhotoResponse('paciente-1', {
      id: 'foto-1',
      pacienteId: 'paciente-1',
      nomeOriginal: 'foto.png',
      mimeType: 'image/png',
      tamanhoBytes: 456,
      tipo: ClinicalPhotoType.FOTO_POSTURAL_FRONTAL,
      vista: ClinicalPhotoView.ANTERIOR,
      regiao: 'ombro',
      lado: 'direito',
      intensidadeDor: 4,
      observacao: 'observacao',
      dataFoto: now,
      qualityScore: 92,
      aiAnalise: 'analise',
      aiLimites: 'limites',
      aiRaw: { ok: true },
      confirmadoPorProfissional: false,
      createdAt: now,
      updatedAt: now,
    } as any);

    expect(response).toMatchObject({
      id: 'foto-1',
      qualityScore: 92,
      downloadUrl: '/api/pacientes/paciente-1/fotos-clinicas/foto-1/arquivo',
    });
  });

  it('maps clinical photo comparison response', () => {
    const response = toClinicalPhotoComparisonResponse({
      id: 'comparacao-1',
      pacienteId: 'paciente-1',
      baselinePhotoId: 'foto-1',
      followupPhotoId: 'foto-2',
      regiao: 'joelho',
      vista: 'anterior',
      observacao: 'comparar',
      resumo: 'resumo',
      aiComparacao: 'comparacao',
      aiLimites: 'limites',
      aiRaw: { ok: true },
      confirmadoPorProfissional: true,
      createdAt: now,
      updatedAt: now,
    } as any);

    expect(response).toEqual(
      expect.objectContaining({
        id: 'comparacao-1',
        baselinePhotoId: 'foto-1',
        followupPhotoId: 'foto-2',
        confirmadoPorProfissional: true,
      }),
    );
  });
});
