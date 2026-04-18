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
import { buildExameObjectKey, deleteExameFile, persistExameFile, readExameFile } from './exame-storage';

const MAX_EXAME_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
  'application/octet-stream',
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
  findAll(@CurrentUser() usuario: Usuario) {
    return this.pacientesService.findAll(usuario.id);
  }

  @Get('paged')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  findPaged(
    @CurrentUser() usuario: Usuario,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
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
        const isMimeAllowed = ALLOWED_MIME_TYPES.has(mimeType);
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
    const safeMimeType = ALLOWED_MIME_TYPES.has(String(file.mimetype || '').toLowerCase())
      ? file.mimetype
      : (MIME_BY_EXTENSION[detectedExtension] || 'application/octet-stream');

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














