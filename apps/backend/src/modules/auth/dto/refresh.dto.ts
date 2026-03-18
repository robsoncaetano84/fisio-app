// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// R EF RE SH.D TO
// ==========================================
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
