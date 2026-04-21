// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// TIPOS PRINCIPAIS - FISIO APP
// ==========================================

// ------------------------------------------
// ENUMS
// ------------------------------------------

export enum Sexo {
  MASCULINO = "MASCULINO",
  FEMININO = "FEMININO",
  OUTRO = "OUTRO",
}

export enum EstadoCivil {
  SOLTEIRO = "SOLTEIRO",
  CASADO = "CASADO",
  VIUVO = "VIUVO",
  DIVORCIADO = "DIVORCIADO",
  UNIAO_ESTAVEL = "UNIAO_ESTAVEL",
}

export enum MotivoBusca {
  SINTOMA_EXISTENTE = "SINTOMA_EXISTENTE",
  PREVENTIVO = "PREVENTIVO",
}

export enum InicioProblema {
  GRADUAL = "GRADUAL",
  REPENTINO = "REPENTINO",
  APOS_EVENTO = "APOS_EVENTO",
  NAO_SABE = "NAO_SABE",
}

export enum StatusTratamento {
  FINALIZADO = "FINALIZADO",
  EM_ANDAMENTO = "EM_ANDAMENTO",
}

export enum TipoDor {
  MECANICA = "MECANICA",
  INFLAMATORIA = "INFLAMATORIA",
  NEUROPATICA = "NEUROPATICA",
  MISTA = "MISTA",
}

export enum DorClassificacaoPrincipal {
  NOCICEPTIVA = "NOCICEPTIVA",
  NEUROPATICA = "NEUROPATICA",
  NOCIPLASTICA = "NOCIPLASTICA",
  INFLAMATORIA = "INFLAMATORIA",
  VISCERAL = "VISCERAL",
}

export enum DorSubtipoClinico {
  MECANICA = "MECANICA",
  DISCAL = "DISCAL",
  NEURAL = "NEURAL",
  REFERIDA = "REFERIDA",
  INFLAMATORIA = "INFLAMATORIA",
  MIOFASCIAL = "MIOFASCIAL",
  FACETARIA = "FACETARIA",
  NAO_MECANICA = "NAO_MECANICA",
}


export enum VariacaoStatus {
  PIOROU = "PIOROU",
  MANTEVE = "MANTEVE",
  MELHOROU = "MELHOROU",
}

export enum AdesaoStatus {
  BAIXA = "BAIXA",
  MEDIA = "MEDIA",
  ALTA = "ALTA",
}

export enum EvolucaoStatus {
  EVOLUINDO_BEM = "EVOLUINDO_BEM",
  ESTAGNADO = "ESTAGNADO",
  PIORA = "PIORA",
}

export enum CondutaStatus {
  MANTER = "MANTER",
  PROGREDIR = "PROGREDIR",
  REGREDIR = "REGREDIR",
  REAVALIAR = "REAVALIAR",
}

export enum LaudoStatus {
  RASCUNHO_IA = "RASCUNHO_IA",
  VALIDADO_PROFISSIONAL = "VALIDADO_PROFISSIONAL",
}

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
  PACIENTE = "PACIENTE",
}

export enum PacienteCadastroOrigem {
  CADASTRO_ASSISTIDO = "CADASTRO_ASSISTIDO",
  CONVITE_RAPIDO = "CONVITE_RAPIDO",
}

export enum PacienteVinculoStatus {
  SEM_VINCULO = "SEM_VINCULO",
  CONVITE_ENVIADO = "CONVITE_ENVIADO",
  VINCULADO = "VINCULADO",
  VINCULADO_PENDENTE_COMPLEMENTO = "VINCULADO_PENDENTE_COMPLEMENTO",
  BLOQUEADO_CONFLITO = "BLOQUEADO_CONFLITO",
}
// ------------------------------------------
// INTERFACES BASE
// ------------------------------------------

export interface Endereco {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
}

export interface Contato {
  telefone?: string;
  whatsapp: string;
  email?: string;
}

// ------------------------------------------
// PACIENTE
// ------------------------------------------

export interface Paciente {
  id: string;
  nomeCompleto: string;
  cpf: string;
  rg?: string;
  dataNascimento: string;
  dataNascimentoFormatada?: string;
  idade?: number;
  sexo: Sexo;
  estadoCivil?: EstadoCivil;
  endereco: Endereco;
  contato: Contato;
  profissao?: string;
  pacienteUsuarioId?: string;
  anamneseLiberadaPaciente?: boolean;
  anamneseSolicitacaoPendente?: boolean;
  anamneseSolicitacaoEm?: string | null;
  anamneseSolicitacaoUltimaEm?: string | null;
  cadastroOrigem?: PacienteCadastroOrigem;
  vinculoStatus?: PacienteVinculoStatus;
  conviteEnviadoEm?: string;
  conviteAceitoEm?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------
// ANAMNESE
// ------------------------------------------

export interface AreaAfetada {
  regiao: string;
  lado?: "esquerdo" | "direito" | "ambos";
}

export interface Anamnese {
  id: string;
  pacienteId: string;
  motivoBusca: MotivoBusca;
  areasAfetadas: AreaAfetada[];
  intensidadeDor: number;
  descricaoSintomas?: string;
  tempoProblema?: string;
  horaIntensifica?: string;
  inicioProblema: InicioProblema;
  eventoEspecifico?: string;
  fatorAlivio?: string;
  dorRepouso?: boolean | null;
  dorNoturna?: boolean | null;
  irradiacao?: boolean | null;
  localIrradiacao?: string;
  tipoDor?: TipoDor | null;
  sinaisSensibilizacaoCentral?: string;
  redFlags?: string[];
  yellowFlags?: string[];
  problemaAnterior: boolean;
  quandoProblemaAnterior?: string;
  tratamentosAnteriores: string[];
  statusTratamento?: StatusTratamento;
  historicoFamiliar?: string;
  limitacoesFuncionais?: string;
  atividadesQuePioram?: string;
  metaPrincipalPaciente?: string;
  horasSonoMedia?: string;
  qualidadeSono?: number;
  nivelEstresse?: number;
  humorPredominante?: string;
  energiaDiaria?: number;
  atividadeFisicaRegular?: boolean;
  frequenciaAtividadeFisica?: string;
  apoioEmocional?: number;
  observacoesEstiloVida?: string;
  createdAtFormatada?: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------
// Evolução
// ------------------------------------------

export interface Evolucao {
  id: string;
  pacienteId: string;
  data: string;
  dataFormatada?: string;
  horaFormatada?: string;
  subjetivo?: string;
  objetivo?: string;
  avaliacao?: string;
  plano?: string;
  // Compatibilidade com payloads legados
  listagens?: string;
  legCheck?: string;
  ajustes?: string;
  orientacoes?: string;
  dorStatus?: VariacaoStatus;
  funcaoStatus?: VariacaoStatus;
  adesaoStatus?: AdesaoStatus;
  statusEvolucao?: EvolucaoStatus;
  condutaStatus?: CondutaStatus;
  checkinDor?: number;
  checkinDificuldade?: "FACIL" | "MEDIO" | "DIFICIL";
  checkinObservacao?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Laudo {
  id: string;
  pacienteId: string;
  diagnosticoFuncional: string;
  objetivosCurtoPrazo?: string;
  objetivosMedioPrazo?: string;
  frequenciaSemanal?: number;
  duracaoSemanas?: number;
  condutas: string;
  exameFisico?: string;
  planoTratamentoIA?: string;
  rascunhoProfissional?: string;
  observacoes?: string;
  status?: LaudoStatus;
  validadoPorUsuarioId?: string;
  validadoEm?: string;
  criteriosAlta?: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------
// AUTENTICAÇÃO
// ------------------------------------------

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  conselhoSigla?: string;
  conselhoUf?: string;
  conselhoProf?: string;
  registroProf?: string;
  especialidade?: string;
  consentTermsRequired?: boolean;
  consentPrivacyRequired?: boolean;
  consentResearchOptional?: boolean;
  consentAiOptional?: boolean;
  consentAcceptedAt?: string | null;
  consentProfessionalLgpdRequired?: boolean;
  role: UserRole;
}

export interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  identificador: string;
  senha: string;
}

export interface LoginResponse {
  usuario: Usuario;
  token: string;
  refreshToken: string;
}

export interface PacienteUsuarioLookupResponse {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
}

export interface PacienteProfileResumo {
  ultimaEvolucaoEm: string | null;
  ultimoLaudoAtualizadoEm: string | null;
  statusLaudo: LaudoStatus | null;
}

export interface PacienteProfileResponse {
  vinculado: boolean;
  paciente: Paciente | null;
  resumo: PacienteProfileResumo | null;
}

export enum DificuldadeExecucao {
  FACIL = "FACIL",
  MEDIO = "MEDIO",
  DIFICIL = "DIFICIL",
}

export enum MelhoriaSessao {
  MELHOROU = "MELHOROU",
  MANTEVE = "MANTEVE",
  PIOROU = "PIOROU",
}

export interface Atividade {
  id: string;
  pacienteId: string;
  usuarioId: string;
  titulo: string;
  descricao?: string | null;
  dataLimite?: string | null;
  diaPrescricao?: number | null;
  ordemNoDia?: number | null;
  repetirSemanal?: boolean;
  aceiteProfissional?: boolean;
  aceiteProfissionalPorUsuarioId?: string | null;
  aceiteProfissionalEm?: string | null;
  ultimoCheckinEm?: string | null;
  ultimoCheckinConcluiu?: boolean | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AtividadeCheckinTimeline {
  id: string;
  atividadeId: string;
  atividadeTitulo: string;
  concluiu: boolean;
  dorAntes?: number | null;
  dorDepois?: number | null;
  dificuldade?: DificuldadeExecucao | null;
  tempoMinutos?: number | null;
  motivoNaoExecucao?: string | null;
  feedbackLivre?: string | null;
  melhoriaSessao?: MelhoriaSessao | null;
  melhoriaDescricao?: string | null;
  createdAt: string;
}

export interface AtividadeUpdate {
  checkinId: string;
  atividadeId: string;
  atividadeTitulo: string;
  pacienteId: string;
  pacienteNome: string;
  concluiu: boolean;
  dorAntes?: number | null;
  dorDepois?: number | null;
  dificuldade?: DificuldadeExecucao | null;
  tempoMinutos?: number | null;
  motivoNaoExecucao?: string | null;
  melhoriaSessao?: MelhoriaSessao | null;
  melhoriaDescricao?: string | null;
  createdAt: string;
}

export interface PacienteInviteCreateResponse {
  token: string;
  link: string;
  expiraEmDias: number;
}

export interface PacienteInviteRegisterResponse extends LoginResponse {
  vinculadoAutomaticamente: boolean;
  pacienteId: string | null;
  profissionalId: string;
}

export interface PacienteInviteAcceptResponse {
  vinculadoAutomaticamente: boolean;
  pacienteId: string;
  profissionalId: string;
}

export interface PacienteInviteDadosResponse {
  nome: string;
  email: string;
}

export type PacientesListQuickAction = "ANAMNESE" | "EVOLUCAO" | "EXAME_FISICO";
export type PacientesAttentionFocus =
  | "HIGH_RISK"
  | "EMOTIONAL"
  | "FUNCTIONAL"
  | "GOAL";

// ------------------------------------------
// NAVEGAÇÃO
// ------------------------------------------

export type RootStackParamList = {
  // Auth
  Login: { convite?: string } | undefined;
  PublicSettings: undefined;
  SignupProfileSelect: undefined;
  ProfessionalSignup: undefined;
  PacienteInviteSignup: { convite?: string } | undefined;

  // Main
  Home: undefined;
  Settings: undefined;
  AdminHome: undefined;
  AdminCrm: { initialTab?: "PROFISSIONAIS" | "PACIENTES" | "LEADS" | "TAREFAS" | "INTERACOES" } | undefined;
  PacienteHome: undefined;
  PacienteAtividadeCheckin: { atividadeId: string; titulo: string };

  // Pacientes
  PacientesList:
    | {
        attentionOnly?: boolean;
        attentionFocus?: PacientesAttentionFocus;
        quickAction?: PacientesListQuickAction;
        attentionSource?: "HOME_SUMMARY";
      }
    | undefined;
  PacienteForm: { pacienteId?: string };
  PacienteDetails: { pacienteId: string };
  PacienteAdesao: { pacienteId: string };
  AtividadeForm: { pacienteId: string; pacienteNome?: string };

  // Anamnese
  AnamneseForm: { pacienteId: string; anamneseId?: string; selfMode?: boolean; pacienteNome?: string };
  AnamneseList: { pacienteId: string };

  // Evolução
  EvolucaoForm: { pacienteId: string; evolucaoId?: string };
  EvolucaoList: { pacienteId: string };
  LaudoForm: { pacienteId: string };
  ExameFisicoForm: { pacienteId: string };
  PlanoForm: { pacienteId: string };
};





