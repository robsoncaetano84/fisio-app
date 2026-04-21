// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// MASTER ADMIN
// ==========================================
import { UserRole, type Usuario } from "../types";

export function isMasterAdminUser(usuario: Usuario | null | undefined): boolean {
  if (!usuario || usuario.role !== UserRole.ADMIN) return false;

  const raw = (process.env.EXPO_PUBLIC_MASTER_ADMIN_EMAILS || "").trim();
  if (!raw) return true;

  const allowed = raw
    .split(",")
    .map((item: string) => item.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes((usuario.email || "").trim().toLowerCase());
}
