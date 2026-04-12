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
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
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

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'paciente-exames');
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

const ensureUploadsDir = () => {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
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

  @Post('me/solicitar-liberacao-anamnese')
  @Throttle({ default: { ttl: 60, limit: 5 } })
  @Roles(UserRole.PACIENTE)
  requestAnamneseUnlock(@CurrentUser() usuario: Usuario) {
    return this.pacientesService.requestAnamneseUnlock(usuario);
  }
  @Post('anamnese/liberar-todas')
  @Throttle({ default: { ttl: 60, limit: 10 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  releaseAllAnamneseRequests(@CurrentUser() usuario: Usuario) {
    return this.pacientesService.releaseAllAnamneseRequestsForProfessional(usuario.id);
  }
  @Get(':id/exames')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  async listExames(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    const exames = await this.pacientesService.listExames(id, usuario.id);
    return exames.map((item) => this.toExameResponse(id, item));
  }

  @Post(':id/exames')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureUploadsDir();
          cb(null, UPLOADS_DIR);
        },
        filename: (_req, file, cb) => {
          const extension = extname(file.originalname || '').toLowerCase();
          const safeExt = extension || '.bin';
          const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
          cb(null, fileName);
        },
      }),
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
    @UploadedFile() file: { originalname: string; filename: string; mimetype: string; size: number; path: string },
    @Body() body: CreatePacienteExameDto,
    @CurrentUser() usuario: Usuario,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio');
    }

    const detectedExtension = extname(file.originalname || '').toLowerCase();
    const safeMimeType = ALLOWED_MIME_TYPES.has(String(file.mimetype || '').toLowerCase())
      ? file.mimetype
      : (MIME_BY_EXTENSION[detectedExtension] || 'application/octet-stream');

    const exame = await this.pacientesService.createExame(id, usuario.id, {
      nomeOriginal: file.originalname,
      nomeArquivo: file.filename,
      mimeType: safeMimeType,
      tamanhoBytes: file.size,
      caminhoArquivo: file.path,
      tipoExame: body.tipoExame,
      observacao: body.observacao,
      dataExame: body.dataExame ? new Date(body.dataExame) : null,
    });

    return this.toExameResponse(id, exame);
  }

  @Get(':id/exames/:exameId/arquivo')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  async downloadExame(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('exameId', ParseUUIDPipe) exameId: string,
    @CurrentUser() usuario: Usuario,
    @Res() res: Response,
  ) {
    const exame = await this.pacientesService.findExameOrFail(id, exameId, usuario.id);
    res.setHeader('Content-Type', exame.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${exame.nomeOriginal}"`);
    return res.sendFile(exame.caminhoArquivo);
  }

  @Delete(':id/exames/:exameId')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  async deleteExame(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('exameId', ParseUUIDPipe) exameId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    await this.pacientesService.removeExame(id, exameId, usuario.id);
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









