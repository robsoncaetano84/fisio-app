// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// R OL ES.D EC OR AT OR
// ==========================================
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../usuarios/entities/usuario.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
