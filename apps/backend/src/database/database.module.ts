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

        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          ssl: dbSsl ? { rejectUnauthorized } : false,
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
