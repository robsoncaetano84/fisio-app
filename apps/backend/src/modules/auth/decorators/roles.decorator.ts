// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// R OL ES.D EC OR AT OR
// ==========================================
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../usuarios/entities/usuario.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
