import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
  UploadedFile,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PacienteProfileResponseDto } from './dto/paciente-profile-response.dto';
import { CreatePacienteExameDto } from './dto/create-paciente-exame.dto';
import { PacienteExame } from './entities/paciente-exame.entity';
import { CreateClinicalPhotoDto } from './dto/create-clinical-photo.dto';
import { CompareClinicalPhotosDto } from './dto/compare-clinical-photos.dto';
import { ClinicalPhoto } from './entities/clinical-photo.entity';
import { ClinicalPhotoComparison } from './entities/clinical-photo-comparison.entity';
import {
  PacienteListItemDto,
  PacientePagedResponseDto,
} from './dto/paciente-list-item.dto';
import { buildExameObjectKey, deleteExameFile, persistExameFile, readExameFile } from './exame-storage';

const MAX_EXAME_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_CLINICAL_PHOTO_SIZE_BYTES = 12 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
]);
const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
]);
const MIME_BY_EXTENSION: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

function hasPrefix(buffer: Buffer, bytes: number[]): boolean {
  if (!buffer || buffer.length < bytes.length) return false;
  return bytes.every((value, index) => buffer[index] === value);
}

function hasAsciiAt(buffer: Buffer, offset: number, value: string): boolean {
  if (!buffer || buffer.length < offset + value.length) return false;
  return buffer.subarray(offset, offset + value.length).toString('ascii') === value;
}

function isValidBySignature(extension: string, buffer: Buffer): boolean {
  switch (extension) {
    case '.pdf':
      return hasAsciiAt(buffer, 0, '%PDF-');
    case '.png':
      return hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47]);
    case '.jpg':
    case '.jpeg':
      return hasPrefix(buffer, [0xff, 0xd8, 0xff]);
    case '.webp':
      return hasAsciiAt(buffer, 0, 'RIFF') && hasAsciiAt(buffer, 8, 'WEBP');
    case '.heic':
      return hasAsciiAt(buffer, 4, 'ftypheic') || hasAsciiAt(buffer, 4, 'ftypmif1');
    case '.heif':
      return hasAsciiAt(buffer, 4, 'ftypheif') || hasAsciiAt(buffer, 4, 'ftypmif1');
    default:
      return false;
  }
}

@Controller('pacientes')
@UseGuards(JwtAuthGuard)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  private toExameResponse(pacienteId: string, exame: PacienteExame) {
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

  private toClinicalPhotoResponse(pacienteId: string, photo: ClinicalPhoto) {
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

  private toClinicalPhotoComparisonResponse(
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

  private parseOptionalDate(value?: string): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Data da foto invalida');
    }
    return parsed;
  }

  private parseOptionalPainIntensity(value?: number | string): number | null {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) {
      throw new BadRequestException('Intensidade da dor deve estar entre 0 e 10');
    }
    return Math.round(parsed);
  }

  @Post()
  @Throttle({ default: { ttl: 60, limit: 30 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  create(
    @Body() createPacienteDto: CreatePacienteDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.pacientesService.create(createPacienteDto, usuario.id);
  }

  @Get()
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  findAll(@CurrentUser() usuario: Usuario): Promise<PacienteListItemDto[]> {
    return this.pacientesService.findAll(usuario.id);
  }

  @Get('paged')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  findPaged(
    @CurrentUser() usuario: Usuario,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ): Promise<PacientePagedResponseDto> {
    return this.pacientesService.findPaged(usuario.id, page, limit);
  }

  @Get('attention')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  getAttention(@CurrentUser() usuario: Usuario) {
    return this.pacientesService.getAttentionMap(usuario.id);
  }

  @Get('stats')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  @Roles(UserRole.ADMIN)
  getStats(@CurrentUser() usuario: Usuario) {
    return this.pacientesService.getStats(usuario.id);
  }

  @Get('me')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.PACIENTE)
  getMyPacienteProfile(
    @CurrentUser() usuario: Usuario,
  ): Promise<PacienteProfileResponseDto> {
    return this.pacientesService.getMyPacienteProfile(usuario);
  }

  @Patch('me')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  @Roles(UserRole.PACIENTE)
  updateMyPacienteProfile(
    @CurrentUser() usuario: Usuario,
    @Body() updatePacienteDto: UpdatePacienteDto,
  ) {
    return this.pacientesService.updateMyPacienteProfile(usuario, updatePacienteDto);
  }

  @Post('me/desvincular-profissional')
  @Throttle({ default: { ttl: 60, limit: 10 } })
  @Roles(UserRole.PACIENTE)
  unlinkMyProfessional(@CurrentUser() usuario: Usuario) {
    return this.pacientesService.unlinkMyProfessional(usuario);
  }

  @Get(':id/exames')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  async listExames(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    const exames = await this.pacientesService.listExames(id, usuario);
    return exames.map((item) => this.toExameResponse(id, item));
  }

  @Post(':id/exames')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_EXAME_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        const mimeType = String(file.mimetype || '').toLowerCase();
        const extension = extname(file.originalname || '').toLowerCase();
        const expectedMime = MIME_BY_EXTENSION[extension];
        const isMimeAllowed =
          ALLOWED_MIME_TYPES.has(mimeType) &&
          (!expectedMime || mimeType === expectedMime);
        const isExtensionAllowed = ALLOWED_EXTENSIONS.has(extension);
        if (!isMimeAllowed && !isExtensionAllowed) {
          return cb(new BadRequestException('Tipo de arquivo nao suportado') as unknown as Error, false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadExame(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    @Body() body: CreatePacienteExameDto,
    @CurrentUser() usuario: Usuario,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio');
    }

    const ownerUsuarioId = await this.pacientesService.resolveExameOwnerUsuarioId(
      id,
      usuario,
    );

    const detectedExtension = extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(detectedExtension)) {
      throw new BadRequestException('Extensao de arquivo nao suportada');
    }
    if (!isValidBySignature(detectedExtension, file.buffer)) {
      throw new BadRequestException('Assinatura de arquivo invalida para a extensao informada');
    }

    const safeMimeType =
      MIME_BY_EXTENSION[detectedExtension] ||
      (ALLOWED_MIME_TYPES.has(String(file.mimetype || '').toLowerCase())
        ? file.mimetype
        : 'application/octet-stream');

    const objectKey = buildExameObjectKey(ownerUsuarioId, id, file.originalname || 'arquivo');
    const persisted = await persistExameFile({
      usuarioId: ownerUsuarioId,
      pacienteId: id,
      objectKey,
      mimeType: safeMimeType,
      fileBuffer: file.buffer,
    });

    try {
      const exame = await this.pacientesService.createExame(id, usuario, {
        nomeOriginal: file.originalname,
        nomeArquivo: persisted.nomeArquivo,
        mimeType: safeMimeType,
        tamanhoBytes: file.size,
        caminhoArquivo: persisted.caminhoArquivo,
        tipoExame: body.tipoExame,
        observacao: body.observacao,
        dataExame: body.dataExame ? new Date(body.dataExame) : null,
      });

      return this.toExameResponse(id, exame);
    } catch (error) {
      await deleteExameFile(persisted.caminhoArquivo).catch(() => undefined);
      throw error;
    }
  }

  @Get(':id/exames/:exameId/arquivo')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  async downloadExame(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('exameId', ParseUUIDPipe) exameId: string,
    @CurrentUser() usuario: Usuario,
    @Res() res: Response,
  ) {
    const exame = await this.pacientesService.findExameOrFail(id, exameId, usuario);
    res.setHeader('Content-Type', exame.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${exame.nomeOriginal}"`);
    const fileBuffer = await readExameFile(exame.caminhoArquivo);
    return res.send(fileBuffer);
  }

  @Delete(':id/exames/:exameId')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  async deleteExame(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('exameId', ParseUUIDPipe) exameId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    const exame = await this.pacientesService.removeExame(id, exameId, usuario);
    await deleteExameFile(exame.caminhoArquivo).catch(() => undefined);
    return { success: true };
  }

  @Get(':id/fotos-clinicas')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  async listClinicalPhotos(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    const photos = await this.pacientesService.listClinicalPhotos(id, usuario);
    return photos.map((item) => this.toClinicalPhotoResponse(id, item));
  }

  @Get(':id/fotos-clinicas/comparacoes')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  async listClinicalPhotoComparisons(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    const comparisons = await this.pacientesService.listClinicalPhotoComparisons(
      id,
      usuario,
    );
    return comparisons.map((item) => this.toClinicalPhotoComparisonResponse(item));
  }

  @Post(':id/fotos-clinicas')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_CLINICAL_PHOTO_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        const mimeType = String(file.mimetype || '').toLowerCase();
        const extension = extname(file.originalname || '').toLowerCase();
        const expectedMime = MIME_BY_EXTENSION[extension];
        const isImageExtensionAllowed =
          ALLOWED_EXTENSIONS.has(extension) && extension !== '.pdf';
        const isMimeAllowed =
          mimeType.startsWith('image/') &&
          ALLOWED_MIME_TYPES.has(mimeType) &&
          (!expectedMime || mimeType === expectedMime);
        if (!isImageExtensionAllowed || !isMimeAllowed) {
          return cb(new BadRequestException('Envie apenas imagem clinica') as unknown as Error, false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadClinicalPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    @Body() body: CreateClinicalPhotoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    if (!file) {
      throw new BadRequestException('Foto obrigatoria');
    }

    const ownerUsuarioId = await this.pacientesService.resolveExameOwnerUsuarioId(
      id,
      usuario,
    );

    const detectedExtension = extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(detectedExtension) || detectedExtension === '.pdf') {
      throw new BadRequestException('Extensao de imagem nao suportada');
    }
    if (!isValidBySignature(detectedExtension, file.buffer)) {
      throw new BadRequestException('Assinatura de imagem invalida para a extensao informada');
    }

    const safeMimeType =
      MIME_BY_EXTENSION[detectedExtension] ||
      (ALLOWED_MIME_TYPES.has(String(file.mimetype || '').toLowerCase())
        ? file.mimetype
        : 'application/octet-stream');

    const objectKey = buildExameObjectKey(ownerUsuarioId, id, file.originalname || 'foto');
    const persisted = await persistExameFile({
      usuarioId: ownerUsuarioId,
      pacienteId: id,
      objectKey,
      mimeType: safeMimeType,
      fileBuffer: file.buffer,
    });

    try {
      const photo = await this.pacientesService.createClinicalPhoto(id, usuario, {
        nomeOriginal: file.originalname,
        nomeArquivo: persisted.nomeArquivo,
        mimeType: safeMimeType,
        tamanhoBytes: file.size,
        caminhoArquivo: persisted.caminhoArquivo,
        tipo: body.tipo,
        vista: body.vista,
        regiao: body.regiao,
        lado: body.lado,
        intensidadeDor: this.parseOptionalPainIntensity(body.intensidadeDor),
        observacao: body.observacao,
        dataFoto: this.parseOptionalDate(body.dataFoto),
      });

      return this.toClinicalPhotoResponse(id, photo);
    } catch (error) {
      await deleteExameFile(persisted.caminhoArquivo).catch(() => undefined);
      throw error;
    }
  }

  @Post(':id/fotos-clinicas/:fotoId/analisar')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  async analyzeClinicalPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fotoId', ParseUUIDPipe) fotoId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    const photo = await this.pacientesService.analyzeClinicalPhoto(
      id,
      fotoId,
      usuario,
    );
    return this.toClinicalPhotoResponse(id, photo);
  }

  @Post(':id/fotos-clinicas/comparar')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  async compareClinicalPhotos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CompareClinicalPhotosDto,
    @CurrentUser() usuario: Usuario,
  ) {
    const comparison = await this.pacientesService.compareClinicalPhotos(
      id,
      usuario,
      body,
    );
    return this.toClinicalPhotoComparisonResponse(comparison);
  }

  @Get(':id/fotos-clinicas/:fotoId/arquivo')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  async downloadClinicalPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fotoId', ParseUUIDPipe) fotoId: string,
    @CurrentUser() usuario: Usuario,
    @Res() res: Response,
  ) {
    const photo = await this.pacientesService.findClinicalPhotoOrFail(
      id,
      fotoId,
      usuario,
    );
    res.setHeader('Content-Type', photo.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${photo.nomeOriginal}"`);
    const fileBuffer = await readExameFile(photo.caminhoArquivo);
    return res.send(fileBuffer);
  }

  @Delete(':id/fotos-clinicas/:fotoId')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  async deleteClinicalPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fotoId', ParseUUIDPipe) fotoId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    const photo = await this.pacientesService.removeClinicalPhoto(id, fotoId, usuario);
    await deleteExameFile(photo.caminhoArquivo).catch(() => undefined);
    return { success: true };
  }

  @Get(':id')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.pacientesService.findOne(id, usuario.id);
  }

  @Patch(':id')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePacienteDto: UpdatePacienteDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.pacientesService.update(id, updatePacienteDto, usuario.id);
  }

  @Post(':id/desvincular-acesso')
  @Throttle({ default: { ttl: 60, limit: 10 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  unlinkPacienteUsuario(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.pacientesService.unlinkPacienteUsuarioByProfessional(id, usuario.id);
  }

  @Delete(':id')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.pacientesService.remove(id, usuario.id);
  }
}










