// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// U SU AR IO.E NT IT Y
// ==========================================
import { Entity, Column, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  PACIENTE = 'PACIENTE',
}

@Entity('usuarios')
export class Usuario extends BaseEntity {
  @Column({ length: 255 })
  nome: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column()
  @Exclude()
  senha: string;

  @Column({ name: 'conselho_sigla', length: 20, nullable: true })
  conselhoSigla: string;

  @Column({ name: 'conselho_uf', length: 2, nullable: true })
  conselhoUf: string;

  @Column({ name: 'conselho_prof', length: 50, nullable: true })
  conselhoProf: string;

  @Column({ name: 'registro_prof', length: 50, nullable: true })
  registroProf: string;

  @Column({ length: 100, nullable: true })
  especialidade: string;

  @Column({ default: true })
  ativo: boolean;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;
}


