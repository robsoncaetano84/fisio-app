// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// R EF RE SH.D TO
// ==========================================
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
