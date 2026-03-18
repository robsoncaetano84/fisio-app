// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// R EG IS TE R P US H T OK EN.D TO
// ==========================================
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterPushTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  expoPushToken: string;

  @IsOptional()
  @IsString()
  @IsIn(['android', 'ios', 'web'])
  plataforma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  appVersion?: string;
}

