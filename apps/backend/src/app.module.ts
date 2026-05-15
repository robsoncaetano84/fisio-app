// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// APP MODULE - CONFIGURACAO PRINCIPAL
// ==========================================

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { PacientesModule } from './modules/pacientes/pacientes.module';
import { AnamnesesModule } from './modules/anamneses/anamneses.module';
import { EvolucoesModule } from './modules/evolucoes/evolucoes.module';
import { LaudosModule } from './modules/laudos/laudos.module';
import { AtividadesModule } from './modules/atividades/atividades.module';
import { NotificacoesModule } from './modules/notificacoes/notificacoes.module';
import { CrmModule } from './modules/crm/crm.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { CharlesModule } from './modules/charles/charles.module';
import { ClinicalGovernanceModule } from './modules/clinical-governance/clinical-governance.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: configService.get<number>('THROTTLE_TTL') ?? 60,
            limit: configService.get<number>('THROTTLE_LIMIT') ?? 60,
          },
        ],
      }),
    }),

    // Modulos da aplicacao
    AuthModule,
    UsuariosModule,
    PacientesModule,
    AnamnesesModule,
    EvolucoesModule,
    LaudosModule,
    AtividadesModule,
    NotificacoesModule,
    CrmModule,
    HealthModule,
    MetricsModule,
    CharlesModule,
    ClinicalGovernanceModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
