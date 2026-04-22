import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole, Usuario } from '../usuarios/entities/usuario.entity';
import { CreateClinicalFlowEventDto } from './dto/create-clinical-flow-event.dto';
import { CreatePatientCheckClickDto } from './dto/create-patient-check-click.dto';
import { MetricsService } from './metrics.service';

@Controller('metrics/clinical-flow')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN, UserRole.USER)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Post()
  @Throttle({ default: { ttl: 60, limit: 200 } })
  trackClinicalFlowEvent(
    @CurrentUser() usuario: Usuario,
    @Body() dto: CreateClinicalFlowEventDto,
  ) {
    return this.metricsService.trackClinicalFlowEvent(usuario.id, dto);
  }

  @Post('check-click')
  @Throttle({ default: { ttl: 60, limit: 300 } })
  trackPatientCheckClick(
    @CurrentUser() usuario: Usuario,
    @Body() dto: CreatePatientCheckClickDto,
  ) {
    return this.metricsService.trackPatientCheckClick(usuario.id, dto);
  }

  @Get('summary')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  getClinicalFlowSummary(
    @CurrentUser() usuario: Usuario,
    @Query('windowDays', new DefaultValuePipe(7), ParseIntPipe)
    windowDays: number,
  ) {
    return this.metricsService.getClinicalFlowSummary(usuario.id, windowDays);
  }

  @Get('check-engagement-summary')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  getPatientCheckEngagementSummary(
    @CurrentUser() usuario: Usuario,
    @Query('windowDays', new DefaultValuePipe(7), ParseIntPipe)
    windowDays: number,
  ) {
    return this.metricsService.getPatientCheckEngagementSummary(
      usuario.id,
      windowDays,
    );
  }

  @Get('physical-exam-tests-summary')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  getPhysicalExamTestsSummary(
    @CurrentUser() usuario: Usuario,
    @Query('windowDays', new DefaultValuePipe(30), ParseIntPipe)
    windowDays: number,
  ) {
    return this.metricsService.getPhysicalExamTestsSummary(
      usuario.id,
      windowDays,
    );
  }
}
