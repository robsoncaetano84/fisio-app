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

  @Column({ length: 20, nullable: true })
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

  @Column({ length: 100, nullable: true })
  profissao: string;

  @Column({ name: 'endereco_rua', length: 255 })
  enderecoRua: string;

  @Column({ name: 'endereco_numero', length: 20 })
  enderecoNumero: string;

  @Column({ name: 'endereco_complemento', length: 100, nullable: true })
  enderecoComplemento: string;

  @Column({ name: 'endereco_bairro', length: 100 })
  enderecoBairro: string;

  @Column({ name: 'endereco_cep', length: 8 })
  enderecoCep: string;

  @Column({ name: 'endereco_cidade', length: 100 })
  enderecoCidade: string;

  @Column({ name: 'endereco_uf', length: 2 })
  enderecoUf: string;

  @Column({ name: 'contato_whatsapp', length: 11 })
  contatoWhatsapp: string;

  @Column({ name: 'contato_telefone', length: 11, nullable: true })
  contatoTelefone: string;

  @Column({ name: 'contato_email', length: 255, nullable: true })
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

  @Column({ name: 'convite_aceito_em', type: 'timestamp', nullable: true })
  conviteAceitoEm: Date | null;
}
