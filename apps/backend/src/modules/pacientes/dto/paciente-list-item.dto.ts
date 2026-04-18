import {
  PacienteCadastroOrigem,
  PacienteVinculoStatus,
  Sexo,
  EstadoCivil,
} from '../entities/paciente.entity';

export class PacienteListItemDto {
  id: string;
  nomeCompleto: string;
  cpf: string;
  rg: string | null;
  dataNascimento: Date;
  sexo: Sexo;
  estadoCivil: EstadoCivil | null;
  profissao: string | null;
  enderecoRua: string;
  enderecoNumero: string;
  enderecoComplemento: string | null;
  enderecoBairro: string;
  enderecoCep: string;
  enderecoCidade: string;
  enderecoUf: string;
  contatoWhatsapp: string;
  contatoTelefone: string | null;
  contatoEmail: string | null;
  ativo: boolean;
  usuarioId: string;
  pacienteUsuarioId: string | null;
  anamneseLiberadaPaciente: boolean;
  anamneseSolicitacaoPendente: boolean;
  anamneseSolicitacaoEm: Date | null;
  anamneseSolicitacaoUltimaEm: Date | null;
  cadastroOrigem: PacienteCadastroOrigem;
  vinculoStatus: PacienteVinculoStatus;
  conviteEnviadoEm: Date | null;
  conviteAceitoEm: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PacientePagedResponseDto {
  data: PacienteListItemDto[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}
