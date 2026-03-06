// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// P AC IE NT E U SU AR IO R ES PO NS E.D TO
// ==========================================
import { UserRole } from '../../usuarios/entities/usuario.entity';

export class PacienteUsuarioResponseDto {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
}

