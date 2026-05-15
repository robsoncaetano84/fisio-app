import { ClinicalPhoto } from './entities/clinical-photo.entity';
import { ClinicalPhotoComparison } from './entities/clinical-photo-comparison.entity';
import { PacienteExame } from './entities/paciente-exame.entity';

export function toExameResponse(pacienteId: string, exame: PacienteExame) {
  return {
    id: exame.id,
    pacienteId: exame.pacienteId,
    nomeOriginal: exame.nomeOriginal,
    mimeType: exame.mimeType,
    tamanhoBytes: exame.tamanhoBytes,
    tipoExame: exame.tipoExame,
    observacao: exame.observacao,
    dataExame: exame.dataExame,
    createdAt: exame.createdAt,
    updatedAt: exame.updatedAt,
    downloadUrl: `/api/pacientes/${pacienteId}/exames/${exame.id}/arquivo`,
  };
}

export function toClinicalPhotoResponse(
  pacienteId: string,
  photo: ClinicalPhoto,
) {
  return {
    id: photo.id,
    pacienteId: photo.pacienteId,
    nomeOriginal: photo.nomeOriginal,
    mimeType: photo.mimeType,
    tamanhoBytes: photo.tamanhoBytes,
    tipo: photo.tipo,
    vista: photo.vista,
    regiao: photo.regiao,
    lado: photo.lado,
    intensidadeDor: photo.intensidadeDor,
    observacao: photo.observacao,
    dataFoto: photo.dataFoto,
    qualityScore: photo.qualityScore,
    aiAnalise: photo.aiAnalise,
    aiLimites: photo.aiLimites,
    aiRaw: photo.aiRaw,
    confirmadoPorProfissional: photo.confirmadoPorProfissional,
    createdAt: photo.createdAt,
    updatedAt: photo.updatedAt,
    downloadUrl: `/api/pacientes/${pacienteId}/fotos-clinicas/${photo.id}/arquivo`,
  };
}

export function toClinicalPhotoComparisonResponse(
  comparison: ClinicalPhotoComparison,
) {
  return {
    id: comparison.id,
    pacienteId: comparison.pacienteId,
    baselinePhotoId: comparison.baselinePhotoId,
    followupPhotoId: comparison.followupPhotoId,
    regiao: comparison.regiao,
    vista: comparison.vista,
    observacao: comparison.observacao,
    resumo: comparison.resumo,
    aiComparacao: comparison.aiComparacao,
    aiLimites: comparison.aiLimites,
    aiRaw: comparison.aiRaw,
    confirmadoPorProfissional: comparison.confirmadoPorProfissional,
    createdAt: comparison.createdAt,
    updatedAt: comparison.updatedAt,
  };
}
