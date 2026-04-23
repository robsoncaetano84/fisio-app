import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole, Usuario } from '../usuarios/entities/usuario.entity';
import {
  CharlesExameFisicoDorSuggestionResponse,
  CharlesNextActionResponse,
  CharlesService,
} from './charles.service';
import { GetCharlesNextActionDto } from './dto/get-charles-next-action.dto';

@Controller(['clinical-orchestrator', 'charles'])
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN, UserRole.USER)
export class CharlesController {
  constructor(private readonly charlesService: CharlesService) {}

  @Get('patients/:pacienteId/next-action')
  getNextAction(
    @CurrentUser() usuario: Usuario,
    @Param() params: GetCharlesNextActionDto,
  ): Promise<CharlesNextActionResponse> {
    return this.charlesService.getNextAction(params.pacienteId, usuario);
  }

  @Get('patients/:pacienteId/suggestions/exame-fisico/dor-classification')
  getExameFisicoDorSuggestion(
    @CurrentUser() usuario: Usuario,
    @Param() params: GetCharlesNextActionDto,
  ): Promise<CharlesExameFisicoDorSuggestionResponse> {
    return this.charlesService.getExameFisicoDorSuggestion(
      params.pacienteId,
      usuario,
    );
  }
}
