import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole, Usuario } from '../usuarios/entities/usuario.entity';
import { ActivateProtocolDto } from './dto/activate-protocol.dto';
import { LogAiSuggestionDto } from './dto/log-ai-suggestion.dto';
import { UpsertConsentDto } from './dto/upsert-consent.dto';
import { ClinicalGovernanceService } from './clinical-governance.service';

type ClinicalAuditActionTypeValue = 'READ' | 'EDIT' | 'APPROVAL';

@Controller('clinical-governance')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN, UserRole.USER, UserRole.PACIENTE)
export class ClinicalGovernanceController {
  constructor(
    private readonly governanceService: ClinicalGovernanceService,
  ) {}

  @Get('protocol/active')
  getActiveProtocol(@CurrentUser() usuario: Usuario) {
    return this.governanceService.getActiveProtocol(usuario);
  }

  @Get('protocol/history')
  @Roles(UserRole.ADMIN)
  getProtocolHistory(
    @CurrentUser() usuario: Usuario,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.governanceService.getProtocolHistory(usuario, limit);
  }

  @Post('protocol/activate')
  @Roles(UserRole.ADMIN)
  activateProtocol(
    @CurrentUser() usuario: Usuario,
    @Body() dto: ActivateProtocolDto,
  ) {
    return this.governanceService.activateProtocol(dto, usuario);
  }

  @Get('consent/my')
  getMyConsents(@CurrentUser() usuario: Usuario) {
    return this.governanceService.getMyConsents(usuario);
  }

  @Post('consent/my')
  upsertMyConsent(@CurrentUser() usuario: Usuario, @Body() dto: UpsertConsentDto) {
    return this.governanceService.upsertMyConsent(usuario, dto);
  }

  @Post('ai-suggestions/log')
  @Roles(UserRole.ADMIN, UserRole.USER)
  logAiSuggestion(@CurrentUser() usuario: Usuario, @Body() dto: LogAiSuggestionDto) {
    return this.governanceService.logAiSuggestion(usuario, dto);
  }

  @Get('audit-logs')
  @Roles(UserRole.ADMIN)
  listAuditLogs(
    @CurrentUser() usuario: Usuario,
    @Query('actionType') actionType?: ClinicalAuditActionTypeValue,
    @Query('patientId') patientId?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.governanceService.listAuditLogs(usuario, {
      actionType,
      patientId,
      limit,
    });
  }

  @Get('ai-suggestions/summary')
  @Roles(UserRole.ADMIN)
  getAiSuggestionSummary(
    @CurrentUser() usuario: Usuario,
    @Query('windowDays', new ParseIntPipe({ optional: true })) windowDays?: number,
  ) {
    return this.governanceService.getAiSuggestionSummary(usuario, {
      windowDays,
    });
  }
}
