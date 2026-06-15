import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { ExerciciosCatalogService } from './exercicios-catalog.service';

@Controller('exercicios')
@UseGuards(JwtAuthGuard)
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
  ) {
    return this.exerciciosCatalogService.findAll({
      q,
      regiaoCorporal,
      categoria,
      nivel,
      tag,
    });
  }

  @Get(':id')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  @Roles(UserRole.ADMIN, UserRole.USER)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const exercicio = await this.exerciciosCatalogService.findOne(id);
    if (!exercicio) {
      throw new NotFoundException('Exercicio nao encontrado');
    }
    return exercicio;
  }
}
