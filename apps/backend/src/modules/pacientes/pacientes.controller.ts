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
  UploadedFile,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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
import { CreateClinicalPhotoDto } from './dto/create-clinical-photo.dto';
import { CompareClinicalPhotosDto } from './dto/compare-clinical-photos.dto';
import {
  PacienteListItemDto,
  PacientePagedResponseDto,
} from './dto/paciente-list-item.dto';
import {
  buildExameObjectKey,
  deleteExameFile,
  persistExameFile,
  readExameFile,
} from './exame-storage';
import {
  assertUploadedFile,
  assertValidUploadedClinicalPhotoFile,
  assertValidUploadedExameFile,
  clinicalPhotoFileFilter,
  exameFileFilter,
  MAX_CLINICAL_PHOTO_SIZE_BYTES,
  MAX_EXAME_SIZE_BYTES,
  parseOptionalDate,
  parseOptionalPainIntensity,
  resolveSafeMimeType,
  UploadedPacienteFile,
} from './paciente-upload.util';
import {
  toClinicalPhotoComparisonResponse,
  toClinicalPhotoResponse,
  toExameResponse,
} from './paciente-response.mapper';

@Controller('pacientes')
@UseGuards(JwtAuthGuard)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

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
    return this.pacientesService.updateMyPacienteProfile(
      usuario,
      updatePacienteDto,
    );
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
    return exames.map((item) => toExameResponse(id, item));
  }

  @Post(':id/exames')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_EXAME_SIZE_BYTES },
      fileFilter: exameFileFilter,
    }),
  )
  async uploadExame(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedPacienteFile | undefined,
    @Body() body: CreatePacienteExameDto,
    @CurrentUser() usuario: Usuario,
  ) {
    assertUploadedFile(file, 'Arquivo obrigatorio');

    const ownerUsuarioId =
      await this.pacientesService.resolveExameOwnerUsuarioId(id, usuario);

    const detectedExtension = assertValidUploadedExameFile(file);
    const safeMimeType = resolveSafeMimeType(detectedExtension, file.mimetype);

    const objectKey = buildExameObjectKey(
      ownerUsuarioId,
      id,
      file.originalname || 'arquivo',
    );
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

      return toExameResponse(id, exame);
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
    const exame = await this.pacientesService.findExameOrFail(
      id,
      exameId,
      usuario,
    );
    res.setHeader('Content-Type', exame.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${exame.nomeOriginal}"`,
    );
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
    return photos.map((item) => toClinicalPhotoResponse(id, item));
  }

  @Get(':id/fotos-clinicas/comparacoes')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  async listClinicalPhotoComparisons(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    const comparisons =
      await this.pacientesService.listClinicalPhotoComparisons(id, usuario);
    return comparisons.map((item) => toClinicalPhotoComparisonResponse(item));
  }

  @Post(':id/fotos-clinicas')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_CLINICAL_PHOTO_SIZE_BYTES },
      fileFilter: clinicalPhotoFileFilter,
    }),
  )
  async uploadClinicalPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedPacienteFile | undefined,
    @Body() body: CreateClinicalPhotoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    assertUploadedFile(file, 'Foto obrigatoria');

    const ownerUsuarioId =
      await this.pacientesService.resolveExameOwnerUsuarioId(id, usuario);

    const detectedExtension = assertValidUploadedClinicalPhotoFile(file);
    const safeMimeType = resolveSafeMimeType(detectedExtension, file.mimetype);

    const objectKey = buildExameObjectKey(
      ownerUsuarioId,
      id,
      file.originalname || 'foto',
    );
    const persisted = await persistExameFile({
      usuarioId: ownerUsuarioId,
      pacienteId: id,
      objectKey,
      mimeType: safeMimeType,
      fileBuffer: file.buffer,
    });

    try {
      const photo = await this.pacientesService.createClinicalPhoto(
        id,
        usuario,
        {
          nomeOriginal: file.originalname,
          nomeArquivo: persisted.nomeArquivo,
          mimeType: safeMimeType,
          tamanhoBytes: file.size,
          caminhoArquivo: persisted.caminhoArquivo,
          tipo: body.tipo,
          vista: body.vista,
          regiao: body.regiao,
          lado: body.lado,
          intensidadeDor: parseOptionalPainIntensity(body.intensidadeDor),
          observacao: body.observacao,
          dataFoto: parseOptionalDate(body.dataFoto),
        },
      );

      return toClinicalPhotoResponse(id, photo);
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
    return toClinicalPhotoResponse(id, photo);
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
    return toClinicalPhotoComparisonResponse(comparison);
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
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${photo.nomeOriginal}"`,
    );
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
    const photo = await this.pacientesService.removeClinicalPhoto(
      id,
      fotoId,
      usuario,
    );
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
    return this.pacientesService.unlinkPacienteUsuarioByProfessional(
      id,
      usuario.id,
    );
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
