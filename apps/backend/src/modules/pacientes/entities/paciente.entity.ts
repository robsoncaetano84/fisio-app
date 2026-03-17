// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// P AC IE NT E.E NT IT Y
// ==========================================
import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
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

@Entity('pacientes')
@Index('IDX_PACIENTE_USUARIO_ATIVO', ['usuarioId', 'ativo'])
@Index('IDX_PACIENTE_USUARIO_NOME', ['usuarioId', 'nomeCompleto'])
@Index('IDX_PACIENTE_PACIENTE_USUARIO', ['pacienteUsuarioId'])
export class Paciente extends BaseEntity {
  @Column({ name: 'nome_completo', length: 255 })
  nomeCompleto: string;

  @Column({ length: 11, unique: true })
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

  @Column({ name: 'paciente_usuario_id', type: 'uuid', nullable: true, unique: true })
  pacienteUsuarioId: string | null;

  @Column({
    name: 'anamnese_liberada_paciente',
    type: 'boolean',
    default: false,
  })
  anamneseLiberadaPaciente: boolean;
}
