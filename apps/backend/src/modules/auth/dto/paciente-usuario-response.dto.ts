// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// P AC IE NT E U SU AR IO R ES PO NS E.DTO
// ==========================================
import { UserRole } from '../../usuarios/entities/usuario.entity';

export class PacienteUsuarioResponseDto {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
}
