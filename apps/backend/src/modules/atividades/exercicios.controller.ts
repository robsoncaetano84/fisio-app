import {
  Body,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthRolesGuard } from '../auth/guards/jwt-auth.guard';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { CreateExercicioCatalogDto } from './dto/create-exercicio-catalog.dto';
import { UpdateExercicioCatalogDto } from './dto/update-exercicio-catalog.dto';
import { UpdateExercicioMidiaClinicalReviewDto } from './dto/update-exercicio-midia-clinical-review.dto';
import { UpdateExercicioMidiaStorageDto } from './dto/update-exercicio-midia-storage.dto';
import { ExerciciosCatalogService } from './exercicios-catalog.service';
import type { UploadedExercicioMidiaFile } from './exercicio-midia-storage';

@Controller('exercicios')
@UseGuards(JwtAuthRolesGuard)
export class ExerciciosController {
  constructor(
    private readonly exerciciosCatalogService: ExerciciosCatalogService,
  ) {}

  @Get()
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  findAll(
    @Query('q') q?: string,
    @Query('regiaoCorporal') regiaoCorporal?: string,
    @Query('categoria') categoria?: string,
    @Query('nivel') nivel?: string,
    @Query('tag') tag?: string,
    @Query('includeDrafts') includeDrafts?: string,
    @CurrentUser() usuario?: Usuario,
  ) {
    return this.exerciciosCatalogService.findAll({
      q,
      regiaoCorporal,
      categoria,
      nivel,
      tag,
      includeDrafts:
        usuario?.role === UserRole.ADMIN && includeDrafts === 'true',
    });
  }

  @Get('admin/fila-imagens')
  @Throttle({ default: { ttl: 60, limit: 60 } })
  @Roles(UserRole.ADMIN)
  findImageProductionQueue(
    @Query('q') q?: string,
    @Query('regiaoCorporal') regiaoCorporal?: string,
    @Query('categoria') categoria?: string,
    @Query('nivel') nivel?: string,
    @Query('tag') tag?: string,
    @Query('filaStatus') filaStatus?: string,
    @Query('limit') limit?: string,
  ) {
    return this.exerciciosCatalogService.findImageProductionQueue({
      q,
      regiaoCorporal,
      categoria,
      nivel,
      tag,
      filaStatus,
      limit,
    });
  }

  @Get('admin/briefs-imagens')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  @Roles(UserRole.ADMIN)
  findImageProductionBriefs(
    @Query('q') q?: string,
    @Query('regiaoCorporal') regiaoCorporal?: string,
    @Query('categoria') categoria?: string,
    @Query('nivel') nivel?: string,
    @Query('tag') tag?: string,
    @Query('filaStatus') filaStatus?: string,
    @Query('limit') limit?: string,
  ) {
    return this.exerciciosCatalogService.findImageProductionBriefs({
      q,
      regiaoCorporal,
      categoria,
      nivel,
      tag,
      filaStatus,
      limit,
    });
  }

  @Get('admin/briefs-imagens/markdown')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  @Roles(UserRole.ADMIN)
  async exportImageProductionBriefsMarkdown(
    @Query('q') q?: string,
    @Query('regiaoCorporal') regiaoCorporal?: string,
    @Query('categoria') categoria?: string,
    @Query('nivel') nivel?: string,
    @Query('tag') tag?: string,
    @Query('filaStatus') filaStatus?: string,
    @Query('limit') limit?: string,
  ) {
    const result =
      await this.exerciciosCatalogService.findImageProductionBriefs({
        q,
        regiaoCorporal,
        categoria,
        nivel,
        tag,
        filaStatus,
        limit,
      });
    return result.productionMarkdownBatch;
  }

  @Get('admin/:id/brief-imagem')
  @Throttle({ default: { ttl: 60, limit: 80 } })
  @Roles(UserRole.ADMIN)
  getImageProductionBrief(@Param('id', ParseUUIDPipe) id: string) {
    return this.exerciciosCatalogService.getImageProductionBrief(id);
  }

  @Get(':id')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    const exercicio =
      usuario.role === UserRole.ADMIN
        ? await this.exerciciosCatalogService.findOneForAdmin(id)
        : await this.exerciciosCatalogService.findOne(id);
    if (!exercicio) {
      throw new NotFoundException('Exercicio nao encontrado');
    }
    return exercicio;
  }

  @Post()
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN)
  create(
    @Body() dto: CreateExercicioCatalogDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.exerciciosCatalogService.create(dto, usuario.id);
  }

  @Patch(':id')
  @Throttle({ default: { ttl: 60, limit: 40 } })
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExercicioCatalogDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.exerciciosCatalogService.update(id, dto, usuario.id);
  }

  @Patch(':id/arquivar')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN)
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.exerciciosCatalogService.archive(id, usuario.id);
  }

  @Patch(':id/revisao-clinica-imagem')
  @Throttle({ default: { ttl: 60, limit: 40 } })
  @Roles(UserRole.ADMIN)
  reviewPrimaryMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExercicioMidiaClinicalReviewDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.exerciciosCatalogService.reviewPrimaryMedia(
      id,
      dto,
      usuario.id,
    );
  }

  @Patch(':id/midia-principal-storage')
  @Throttle({ default: { ttl: 60, limit: 40 } })
  @Roles(UserRole.ADMIN)
  updatePrimaryMediaStorage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExercicioMidiaStorageDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.exerciciosCatalogService.updatePrimaryMediaStorage(
      id,
      dto,
      usuario.id,
    );
  }

  // Etapa-38 F3: upload da imagem do exercicio (arquivo passa pelo backend ->
  // Supabase/fallback local). Entra como revisao clinica PENDENTE.
  @Post(':id/midia')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  uploadPrimaryMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedExercicioMidiaFile,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.exerciciosCatalogService.uploadPrimaryMedia(
      id,
      file,
      usuario.id,
    );
  }
}
