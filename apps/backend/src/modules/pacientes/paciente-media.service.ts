import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readExameFile } from './exame-storage';
import { ClinicalPhotoAiService } from './clinical-photo-ai.service';
import { PacienteExame } from './entities/paciente-exame.entity';
import {
  ClinicalPhoto,
  ClinicalPhotoType,
  ClinicalPhotoView,
} from './entities/clinical-photo.entity';
import { ClinicalPhotoComparison } from './entities/clinical-photo-comparison.entity';

type CreatePacienteExameInput = {
  nomeOriginal: string;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  caminhoArquivo: string;
  tipoExame?: string;
  observacao?: string;
  dataExame?: Date | null;
};

type CreateClinicalPhotoInput = {
  nomeOriginal: string;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  caminhoArquivo: string;
  tipo?: ClinicalPhotoType;
  vista?: ClinicalPhotoView;
  regiao?: string;
  lado?: string;
  intensidadeDor?: number | null;
  observacao?: string;
  dataFoto?: Date | null;
};

type CompareClinicalPhotosInput = {
  baselinePhotoId: string;
  followupPhotoId: string;
  regiao?: string;
  vista?: string;
  observacao?: string;
};

@Injectable()
export class PacienteMediaService {
  constructor(
    @InjectRepository(PacienteExame)
    private readonly pacienteExameRepository: Repository<PacienteExame>,
    @InjectRepository(ClinicalPhoto)
    private readonly clinicalPhotoRepository: Repository<ClinicalPhoto>,
    @InjectRepository(ClinicalPhotoComparison)
    private readonly clinicalPhotoComparisonRepository: Repository<ClinicalPhotoComparison>,
    private readonly clinicalPhotoAiService: ClinicalPhotoAiService,
  ) {}

  listExames(
    pacienteId: string,
    ownerUsuarioId: string,
  ): Promise<PacienteExame[]> {
    return this.pacienteExameRepository.find({
      where: { pacienteId, usuarioId: ownerUsuarioId },
      order: { createdAt: 'DESC' },
    });
  }

  createExame(
    pacienteId: string,
    ownerUsuarioId: string,
    payload: CreatePacienteExameInput,
  ): Promise<PacienteExame> {
    const exame = this.pacienteExameRepository.create({
      pacienteId,
      usuarioId: ownerUsuarioId,
      nomeOriginal: payload.nomeOriginal,
      nomeArquivo: payload.nomeArquivo,
      mimeType: payload.mimeType,
      tamanhoBytes: payload.tamanhoBytes,
      caminhoArquivo: payload.caminhoArquivo,
      tipoExame: payload.tipoExame?.trim() || null,
      observacao: payload.observacao?.trim() || null,
      dataExame: payload.dataExame || null,
    });
    return this.pacienteExameRepository.save(exame);
  }

  async findExameOrFail(
    pacienteId: string,
    exameId: string,
    ownerUsuarioId: string,
  ): Promise<PacienteExame> {
    const exame = await this.pacienteExameRepository.findOne({
      where: { id: exameId, pacienteId, usuarioId: ownerUsuarioId },
    });
    if (!exame) {
      throw new NotFoundException('Exame nao encontrado');
    }
    return exame;
  }

  async removeExame(
    pacienteId: string,
    exameId: string,
    ownerUsuarioId: string,
  ): Promise<PacienteExame> {
    const exame = await this.findExameOrFail(
      pacienteId,
      exameId,
      ownerUsuarioId,
    );
    await this.pacienteExameRepository.remove(exame);
    return exame;
  }

  listClinicalPhotos(
    pacienteId: string,
    ownerUsuarioId: string,
  ): Promise<ClinicalPhoto[]> {
    return this.clinicalPhotoRepository.find({
      where: { pacienteId, usuarioId: ownerUsuarioId },
      order: { createdAt: 'DESC' },
    });
  }

  listClinicalPhotoComparisons(
    pacienteId: string,
    ownerUsuarioId: string,
  ): Promise<ClinicalPhotoComparison[]> {
    return this.clinicalPhotoComparisonRepository.find({
      where: { pacienteId, usuarioId: ownerUsuarioId },
      order: { createdAt: 'DESC' },
    });
  }

  createClinicalPhoto(
    pacienteId: string,
    ownerUsuarioId: string,
    payload: CreateClinicalPhotoInput,
  ): Promise<ClinicalPhoto> {
    const photo = this.clinicalPhotoRepository.create({
      pacienteId,
      usuarioId: ownerUsuarioId,
      nomeOriginal: payload.nomeOriginal,
      nomeArquivo: payload.nomeArquivo,
      mimeType: payload.mimeType,
      tamanhoBytes: payload.tamanhoBytes,
      caminhoArquivo: payload.caminhoArquivo,
      tipo: payload.tipo || ClinicalPhotoType.FOTO_POSTURAL_FRONTAL,
      vista: payload.vista || null,
      regiao: payload.regiao?.trim() || null,
      lado: payload.lado?.trim() || null,
      intensidadeDor:
        typeof payload.intensidadeDor === 'number'
          ? Math.max(0, Math.min(10, payload.intensidadeDor))
          : null,
      observacao: payload.observacao?.trim() || null,
      dataFoto: payload.dataFoto || null,
      qualityScore: null,
      aiAnalise: null,
      aiLimites: null,
      aiRaw: null,
      confirmadoPorProfissional: false,
    });
    return this.clinicalPhotoRepository.save(photo);
  }

  async findClinicalPhotoOrFail(
    pacienteId: string,
    photoId: string,
    ownerUsuarioId: string,
  ): Promise<ClinicalPhoto> {
    const photo = await this.clinicalPhotoRepository.findOne({
      where: { id: photoId, pacienteId, usuarioId: ownerUsuarioId },
    });
    if (!photo) {
      throw new NotFoundException('Foto clinica nao encontrada');
    }
    return photo;
  }

  async removeClinicalPhoto(
    pacienteId: string,
    photoId: string,
    ownerUsuarioId: string,
  ): Promise<ClinicalPhoto> {
    const photo = await this.findClinicalPhotoOrFail(
      pacienteId,
      photoId,
      ownerUsuarioId,
    );
    await this.clinicalPhotoRepository.remove(photo);
    return photo;
  }

  async analyzeClinicalPhoto(
    pacienteId: string,
    photoId: string,
    ownerUsuarioId: string,
  ): Promise<ClinicalPhoto> {
    const photo = await this.findClinicalPhotoOrFail(
      pacienteId,
      photoId,
      ownerUsuarioId,
    );
    const fileBuffer = await readExameFile(photo.caminhoArquivo);
    const analysis = await this.clinicalPhotoAiService.analyzePhoto({
      photo,
      fileBuffer,
    });

    if (!analysis) {
      photo.aiLimites =
        'Analise visual por IA indisponivel. Use a foto apenas como registro clinico.';
      return this.clinicalPhotoRepository.save(photo);
    }

    photo.qualityScore = analysis.qualityScore;
    photo.aiAnalise = analysis.summary;
    photo.aiLimites = analysis.limitations;
    photo.aiRaw = analysis.raw;
    return this.clinicalPhotoRepository.save(photo);
  }

  async compareClinicalPhotos(
    pacienteId: string,
    ownerUsuarioId: string,
    payload: CompareClinicalPhotosInput,
  ): Promise<ClinicalPhotoComparison> {
    const baseline = await this.findClinicalPhotoOrFail(
      pacienteId,
      payload.baselinePhotoId,
      ownerUsuarioId,
    );
    const followup = await this.findClinicalPhotoOrFail(
      pacienteId,
      payload.followupPhotoId,
      ownerUsuarioId,
    );

    const [baselineBuffer, followupBuffer] = await Promise.all([
      readExameFile(baseline.caminhoArquivo),
      readExameFile(followup.caminhoArquivo),
    ]);
    const analysis = await this.clinicalPhotoAiService.comparePhotos({
      baseline,
      followup,
      baselineBuffer,
      followupBuffer,
      observacao: payload.observacao || '',
    });

    const comparison = this.clinicalPhotoComparisonRepository.create({
      pacienteId,
      usuarioId: baseline.usuarioId,
      baselinePhotoId: baseline.id,
      followupPhotoId: followup.id,
      regiao:
        payload.regiao?.trim() || baseline.regiao || followup.regiao || null,
      vista: payload.vista?.trim() || baseline.vista || followup.vista || null,
      observacao: payload.observacao?.trim() || null,
      resumo:
        analysis?.summary ||
        'Comparacao registrada. Analise visual por IA indisponivel no momento.',
      aiComparacao: analysis?.comparison || null,
      aiLimites:
        analysis?.limitations ||
        'Compare apenas fotos com mesma vista, distancia e iluminacao semelhantes.',
      aiRaw: analysis?.raw || null,
      confirmadoPorProfissional: false,
    });
    return this.clinicalPhotoComparisonRepository.save(comparison);
  }
}
