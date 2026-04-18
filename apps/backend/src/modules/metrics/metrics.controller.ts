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

  @Get('summary')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  getClinicalFlowSummary(
    @CurrentUser() usuario: Usuario,
    @Query('windowDays', new DefaultValuePipe(7), ParseIntPipe)
    windowDays: number,
  ) {
    return this.metricsService.getClinicalFlowSummary(usuario.id, windowDays);
  }
}

