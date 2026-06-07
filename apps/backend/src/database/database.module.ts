import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DATABASE_ENTITIES } from './database.entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbSsl = configService.get<string>('DB_SSL') === 'true';
        const rejectUnauthorized =
          configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED') !== 'false';
        const isDevelopment = configService.get('NODE_ENV') === 'development';
        const poolMax = configService.get<number>('DB_POOL_MAX') ?? 10;
        const poolMin = configService.get<number>('DB_POOL_MIN') ?? 0;
        const idleTimeoutMillis =
          configService.get<number>('DB_POOL_IDLE_TIMEOUT_MS') ?? 10000;
        const connectionTimeoutMillis =
          configService.get<number>('DB_POOL_CONNECTION_TIMEOUT_MS') ?? 10000;
        const statementTimeout =
          configService.get<number>('DB_STATEMENT_TIMEOUT_MS') ?? 30000;

        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          ssl: dbSsl ? { rejectUnauthorized } : false,
          extra: {
            max: poolMax,
            min: poolMin,
            idleTimeoutMillis,
            connectionTimeoutMillis,
            statement_timeout: statementTimeout,
            query_timeout: statementTimeout,
          },
          entities: DATABASE_ENTITIES,
          migrations: [__dirname + '/../migrations/*{.ts,.js}'],
          synchronize: isDevelopment,
          logging: isDevelopment,
          migrationsRun: configService.get('DB_MIGRATIONS_RUN') === 'true',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
