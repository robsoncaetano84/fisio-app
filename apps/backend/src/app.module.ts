// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// APP MODULE - CONFIGURACAO PRINCIPAL
// ==========================================

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { Usuario } from './modules/usuarios/entities/usuario.entity';
import { Paciente } from './modules/pacientes/entities/paciente.entity';
import { Anamnese } from './modules/anamneses/entities/anamnese.entity';
import { Evolucao } from './modules/evolucoes/entities/evolucao.entity';
import { Laudo } from './modules/laudos/entities/laudo.entity';
import { LaudoAiGeneration } from './modules/laudos/entities/laudo-ai-generation.entity';
import { AuthLog } from './modules/auth/entities/auth-log.entity';
import { Atividade } from './modules/atividades/entities/atividade.entity';
import { AtividadeCheckin } from './modules/atividades/entities/atividade-checkin.entity';
import { PushToken } from './modules/notificacoes/entities/push-token.entity';
import { CrmLead } from './modules/crm/entities/crm-lead.entity';
import { CrmTask } from './modules/crm/entities/crm-task.entity';
import { CrmInteraction } from './modules/crm/entities/crm-interaction.entity';
import { PacienteExame } from './modules/pacientes/entities/paciente-exame.entity';

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

@Module({
  imports: [
    // Configuracao de variaveis de ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('7d'),
        REFRESH_SECRET: Joi.string().required(),
        REFRESH_EXPIRES_IN: Joi.string().default('30d'),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string().default('development'),
        CORS_ORIGIN: Joi.string().allow('').optional(),
        HTTPS_KEY_PATH: Joi.string().allow('').optional(),
        HTTPS_CERT_PATH: Joi.string().allow('').optional(),
        DB_MIGRATIONS_RUN: Joi.string().valid('true', 'false').default('false'),
        DB_SSL: Joi.string().valid('true', 'false').default('false'),
        DB_SSL_REJECT_UNAUTHORIZED: Joi.string().valid('true', 'false').default('true'),
        THROTTLE_TTL: Joi.number().default(60),
        THROTTLE_LIMIT: Joi.number().default(60),
        LOCKOUT_MAX_ATTEMPTS: Joi.number().default(5),
        LOCKOUT_WINDOW_MIN: Joi.number().default(15),
        LOCKOUT_DURATION_MIN: Joi.number().default(30),
        REDIS_URL: Joi.string().allow('').optional(),
        ALLOW_ADMIN_REGISTRATION: Joi.string().valid('true', 'false').default('false'),
        MASTER_ADMIN_EMAILS: Joi.string().allow('').optional(),
        OPENAI_API_KEY: Joi.string().allow('').optional(),
        OPENAI_MODEL: Joi.string().allow('').optional(),
        EXPO_ACCESS_TOKEN: Joi.string().allow('').optional(),
        TRUST_PROXY: Joi.string().valid('true', 'false').default('false'),
        APP_VERSION: Joi.string().allow('').optional(),
        SENTRY_DSN: Joi.string().allow('').optional(),
      }),
    }),

    // Configuracao do TypeORM com PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbSsl = configService.get<string>('DB_SSL') === 'true';
        const rejectUnauthorized =
          configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED') !== 'false';

        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          ssl: dbSsl ? { rejectUnauthorized } : false,
          entities: [
            Usuario,
            Paciente,
            Anamnese,
            Evolucao,
            Laudo,
            LaudoAiGeneration,
            AuthLog,
            Atividade,
            AtividadeCheckin,
            PushToken,
            CrmLead,
            CrmTask,
            CrmInteraction,
            PacienteExame,
          ],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') === 'development',
          logging: configService.get('NODE_ENV') === 'development',
          migrationsRun: configService.get('DB_MIGRATIONS_RUN') === 'true',
        };
      },
    }),

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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}


