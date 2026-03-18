// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// R EM OV E P US H T OK EN.D TO
// ==========================================
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RemovePushTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  expoPushToken: string;
}

