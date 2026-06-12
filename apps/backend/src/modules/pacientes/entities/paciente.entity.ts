// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// P AC IE NT E.ENTITY
// ==========================================
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum Sexo {
  MASCULINO = 'MASCULINO',
  FEMININO = 'FEMININO',
  OUTRO = 'OUTRO',
}

export enum EstadoCivil {
  SOLTEIRO = 'SOLTEIRO',
  CASADO = 'CASADO',
  VIUVO = 'VIUVO',
  DIVORCIADO = 'DIVORCIADO',
  UNIAO_ESTAVEL = 'UNIAO_ESTAVEL',
}

export enum PacienteCadastroOrigem {
  CADASTRO_ASSISTIDO = 'CADASTRO_ASSISTIDO',
  CONVITE_RAPIDO = 'CONVITE_RAPIDO',
}

export enum PacienteVinculoStatus {
  SEM_VINCULO = 'SEM_VINCULO',
  CONVITE_ENVIADO = 'CONVITE_ENVIADO',
  VINCULADO = 'VINCULADO',
  VINCULADO_PENDENTE_COMPLEMENTO = 'VINCULADO_PENDENTE_COMPLEMENTO',
  BLOQUEADO_CONFLITO = 'BLOQUEADO_CONFLITO',
}

export enum PacienteAppAccessEventType {
  INVITE_SENT = 'INVITE_SENT',
  INVITE_RESENT = 'INVITE_RESENT',
  INVITE_ACCEPTED = 'INVITE_ACCEPTED',
  INVITE_REVOKED = 'INVITE_REVOKED',
  ACCESS_UNLINKED = 'ACCESS_UNLINKED',
}

export type PacienteAppAccessEvent = {
  type: PacienteAppAccessEventType;
  at: string;
  actorUsuarioId?: string | null;
};

export const appendPacienteAppAccessEvent = (
  paciente: Paciente,
  type: PacienteAppAccessEventType,
  actorUsuarioId?: string | null,
) => {
  const previous = Array.isArray(paciente.appAccessEvents)
    ? paciente.appAccessEvents
    : [];
  paciente.appAccessEvents = [
    {
      type,
      at: new Date().toISOString(),
      actorUsuarioId: actorUsuarioId || null,
    },
    ...previous,
  ].slice(0, 30);
};

@Entity('pacientes')
@Index('IDX_PACIENTE_USUARIO_ATIVO', ['usuarioId', 'ativo'])
@Index('IDX_PACIENTE_USUARIO_NOME', ['usuarioId', 'nomeCompleto'])
@Index('IDX_PACIENTE_PACIENTE_USUARIO', ['pacienteUsuarioId'])
@Index('UQ_PACIENTE_USUARIO_CPF', ['usuarioId', 'cpf'], { unique: true })
export class Paciente extends BaseEntity {
  @Column({ name: 'nome_completo', length: 255 })
  nomeCompleto: string;

  @Column({ length: 11 })
  cpf: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  rg: string;

  @Column({ name: 'data_nascimento', type: 'date' })
  dataNascimento: Date;

  @Column({ type: 'enum', enum: Sexo })
  sexo: Sexo;

  @Column({
    name: 'estado_civil',
    type: 'enum',
    enum: EstadoCivil,
    nullable: true,
  })
  estadoCivil: EstadoCivil;

  @Column({ type: 'varchar', length: 100, nullable: true })
  profissao: string;

  @Column({
    name: 'endereco_rua',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  enderecoRua: string | null;

  @Column({
    name: 'endereco_numero',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  enderecoNumero: string | null;

  @Column({
    name: 'endereco_complemento',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  enderecoComplemento: string | null;

  @Column({
    name: 'endereco_bairro',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  enderecoBairro: string | null;

  @Column({ name: 'endereco_cep', type: 'varchar', length: 8, nullable: true })
  enderecoCep: string | null;

  @Column({
    name: 'endereco_cidade',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  enderecoCidade: string | null;

  @Column({ name: 'endereco_uf', type: 'varchar', length: 2, nullable: true })
  enderecoUf: string | null;

  @Column({ name: 'contato_whatsapp', length: 11 })
  contatoWhatsapp: string;

  @Column({
    name: 'contato_telefone',
    type: 'varchar',
    length: 11,
    nullable: true,
  })
  contatoTelefone: string;

  @Column({
    name: 'contato_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  contatoEmail: string;

  @Column({ default: true })
  ativo: boolean;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'paciente_usuario_id' })
  pacienteUsuario: Usuario | null;

  @Column({
    name: 'paciente_usuario_id',
    type: 'uuid',
    nullable: true,
    unique: true,
  })
  pacienteUsuarioId: string | null;

  @Column({
    name: 'anamnese_liberada_paciente',
    type: 'boolean',
    default: false,
  })
  anamneseLiberadaPaciente: boolean;

  @Column({
    name: 'anamnese_solicitacao_pendente',
    type: 'boolean',
    default: false,
  })
  anamneseSolicitacaoPendente: boolean;

  @Column({
    name: 'anamnese_solicitacao_em',
    type: 'timestamp',
    nullable: true,
  })
  anamneseSolicitacaoEm: Date | null;

  @Column({
    name: 'anamnese_solicitacao_ultima_em',
    type: 'timestamp',
    nullable: true,
  })
  anamneseSolicitacaoUltimaEm: Date | null;

  @Column({
    name: 'cadastro_origem',
    type: 'enum',
    enum: PacienteCadastroOrigem,
    default: PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
  })
  cadastroOrigem: PacienteCadastroOrigem;

  @Column({
    name: 'vinculo_status',
    type: 'enum',
    enum: PacienteVinculoStatus,
    default: PacienteVinculoStatus.SEM_VINCULO,
  })
  vinculoStatus: PacienteVinculoStatus;

  @Column({ name: 'convite_enviado_em', type: 'timestamp', nullable: true })
  conviteEnviadoEm: Date | null;

  @Column({ name: 'convite_expira_em', type: 'timestamp', nullable: true })
  conviteExpiraEm: Date | null;

  @Column({ name: 'convite_aceito_em', type: 'timestamp', nullable: true })
  conviteAceitoEm: Date | null;

  @Column({ name: 'app_access_events', type: 'jsonb', default: [] })
  appAccessEvents: PacienteAppAccessEvent[];
}
