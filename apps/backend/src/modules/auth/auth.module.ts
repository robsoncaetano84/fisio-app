// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// A UT H.M OD UL E
// ==========================================
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthLog } from './entities/auth-log.entity';
import { AuthLogsService } from './auth-logs.service';
import { LockoutService } from './lockout.service';
import { Paciente } from '../pacientes/entities/paciente.entity';

@Module({
  imports: [
    UsuariosModule,
    TypeOrmModule.forFeature([AuthLog, Paciente]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret =
          configService.get<string>('JWT_SECRET') || 'default-secret';
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthLogsService, LockoutService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
