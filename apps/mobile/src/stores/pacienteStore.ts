// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PACIENTE STORE - ZUSTAND
// ==========================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import axios from "axios";
import { api } from "../services";
import {
  Paciente,
  Endereco,
  Contato,
  Sexo,
  EstadoCivil,
  PacienteCadastroOrigem,
  PacienteCicloStatus,
  PacienteVinculoStatus,
} from "../types";
import { APP_CONFIG } from "../constants/theme";

type PacientePayload = {
  nomeCompleto: string;
  cpf: string;
  rg?: string;
  dataNascimento: string;
  sexo: Sexo;
  estadoCivil?: EstadoCivil;
  profissao?: string;
  endereco: Endereco;
  contato: Contato;
  pacienteUsuarioId?: string;
  anamneseLiberadaPaciente?: boolean;
  cadastroOrigem?: PacienteCadastroOrigem;
};

type ApiPaciente = {
  id: string;
  nomeCompleto: string;
  cpf: string;
  rg?: string | null;
  dataNascimento: string;
  sexo: Sexo;
  estadoCivil?: EstadoCivil | null;
  profissao?: string | null;
  enderecoRua: string;
  enderecoNumero: string;
  enderecoComplemento?: string | null;
  enderecoBairro: string;
  enderecoCep: string;
  enderecoCidade: string;
  enderecoUf: string;
  contatoWhatsapp: string;
  contatoTelefone?: string | null;
  contatoEmail?: string | null;
  pacienteUsuarioId?: string | null;
  anamneseLiberadaPaciente?: boolean | null;
  anamneseSolicitacaoPendente?: boolean | null;
  anamneseSolicitacaoEm?: string | null;
  anamneseSolicitacaoUltimaEm?: string | null;
  cadastroOrigem?: PacienteCadastroOrigem | null;
  vinculoStatus?: PacienteVinculoStatus | null;
  statusCiclo?: PacienteCicloStatus | null;
  conviteEnviadoEm?: string | null;
  conviteAceitoEm?: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiPacientesPaged = {
  data: ApiPaciente[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
};

const PACIENTES_CACHE_KEY_PREFIX = "cache:pacientes";

const parseDateOnlyAsLocal = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

const formatDateBR = (dateString: string) => {
  if (!dateString) return "";
  const date = parseDateOnlyAsLocal(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("pt-BR");
};

const calcularIdade = (dataNascimento: string) => {
  const nascimento = parseDateOnlyAsLocal(dataNascimento);
  if (Number.isNaN(nascimento.getTime())) return undefined;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
};

const withDerivedPaciente = (paciente: Paciente): Paciente => ({
  ...paciente,
  dataNascimentoFormatada:
    paciente.dataNascimentoFormatada || formatDateBR(paciente.dataNascimento),
  idade: paciente.idade ?? calcularIdade(paciente.dataNascimento),
});

const safeParsePacientes = (raw: string | null): Paciente[] | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Paciente[];
    return Array.isArray(parsed) ? parsed.map(withDerivedPaciente) : null;
  } catch {
    return null;
  }
};

const getPacientesCacheKey = async () => {
  try {
    const rawUser = await AsyncStorage.getItem(APP_CONFIG.storage.userKey);
    if (!rawUser) return `${PACIENTES_CACHE_KEY_PREFIX}:anon`;
    const parsed = JSON.parse(rawUser) as { id?: string };
    return `${PACIENTES_CACHE_KEY_PREFIX}:${parsed?.id || "anon"}`;
  } catch {
    return `${PACIENTES_CACHE_KEY_PREFIX}:anon`;
  }
};

const persistPacientes = async (pacientes: Paciente[]) => {
  try {
    const cacheKey = await getPacientesCacheKey();
    await AsyncStorage.setItem(cacheKey, JSON.stringify(pacientes));
  } catch {
    // cache is best-effort
  }
};

const mapApiToPaciente = (p: ApiPaciente): Paciente => ({
  id: p.id,
  nomeCompleto: p.nomeCompleto,
  cpf: p.cpf,
  rg: p.rg || undefined,
  dataNascimento: p.dataNascimento,
  dataNascimentoFormatada: formatDateBR(p.dataNascimento),
  idade: calcularIdade(p.dataNascimento),
  sexo: p.sexo,
  estadoCivil: p.estadoCivil || undefined,
  profissao: p.profissao || undefined,
  endereco: {
    rua: p.enderecoRua,
    numero: p.enderecoNumero,
    complemento: p.enderecoComplemento || undefined,
    bairro: p.enderecoBairro,
    cep: p.enderecoCep,
    cidade: p.enderecoCidade,
    uf: p.enderecoUf,
  },
  contato: {
    whatsapp: p.contatoWhatsapp,
    telefone: p.contatoTelefone || undefined,
    email: p.contatoEmail || undefined,
  },
  ativo: p.ativo,
  pacienteUsuarioId: p.pacienteUsuarioId || undefined,
  anamneseLiberadaPaciente: p.anamneseLiberadaPaciente ?? false,
  anamneseSolicitacaoPendente: p.anamneseSolicitacaoPendente ?? false,
  anamneseSolicitacaoEm: p.anamneseSolicitacaoEm || null,
  anamneseSolicitacaoUltimaEm: p.anamneseSolicitacaoUltimaEm || null,
  cadastroOrigem: p.cadastroOrigem || PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
  vinculoStatus: p.vinculoStatus || PacienteVinculoStatus.SEM_VINCULO,
  statusCiclo: p.statusCiclo || PacienteCicloStatus.AGUARDANDO_ANAMNESE,
  conviteEnviadoEm: p.conviteEnviadoEm || undefined,
  conviteAceitoEm: p.conviteAceitoEm || undefined,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

const mapPayloadToApi = (p: PacientePayload) => ({
  nomeCompleto: p.nomeCompleto,
  cpf: p.cpf,
  rg: p.rg || undefined,
  dataNascimento: p.dataNascimento,
  sexo: p.sexo,
  estadoCivil: p.estadoCivil || undefined,
  profissao: p.profissao || undefined,
  enderecoRua: p.endereco.rua,
  enderecoNumero: p.endereco.numero,
  enderecoComplemento: p.endereco.complemento || undefined,
  enderecoBairro: p.endereco.bairro,
  enderecoCep: p.endereco.cep,
  enderecoCidade: p.endereco.cidade,
  enderecoUf: p.endereco.uf,
  contatoWhatsapp: p.contato.whatsapp,
  contatoTelefone: p.contato.telefone || undefined,
  contatoEmail: p.contato.email || undefined,
  pacienteUsuarioId: p.pacienteUsuarioId || undefined,
  anamneseLiberadaPaciente: p.anamneseLiberadaPaciente ?? false,
  cadastroOrigem: p.cadastroOrigem || PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
});

interface PacienteStore {
  pacientes: Paciente[];
  pacienteAtual: Paciente | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  lastFetchedAt: number | null;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  totalPacientes: number;

  // Actions
  fetchPacientes: (force?: boolean) => Promise<void>;
  fetchPacienteById: (id: string) => Promise<Paciente>;
  fetchNextPacientes: () => Promise<void>;
  createPaciente: (paciente: PacientePayload) => Promise<Paciente>;
  updatePaciente: (id: string, paciente: PacientePayload) => Promise<Paciente>;
  deletePaciente: (id: string) => Promise<void>;
  setPacienteAtual: (paciente: Paciente | null) => void;
  getPacienteById: (id: string) => Paciente | undefined;
  setLoading: (loading: boolean) => void;
}

const PACIENTES_FETCH_TTL_MS = 30 * 1000;
let fetchPacientesInFlight: Promise<void> | null = null;

export const usePacienteStore = create<PacienteStore>((set, get) => ({
  pacientes: [],
  pacienteAtual: null,
  isLoading: false,
  isLoadingMore: false,
  lastFetchedAt: null,
  currentPage: 0,
  pageSize: 30,
  hasNextPage: true,
  totalPacientes: 0,

  setLoading: (loading) => set({ isLoading: loading }),

  fetchPacientes: async (force = false) => {
    const current = get();
    const isFresh =
      !!current.lastFetchedAt &&
      Date.now() - current.lastFetchedAt < PACIENTES_FETCH_TTL_MS;

    if (!force && current.pacientes.length > 0 && isFresh) {
      return;
    }

    if (fetchPacientesInFlight) {
      return fetchPacientesInFlight;
    }

    fetchPacientesInFlight = (async () => {
      try {
        set({ isLoading: true });
        const response = await api.get<ApiPacientesPaged>("/pacientes/paged", {
          params: { page: 1, limit: get().pageSize },
        });
        const pacientes = response.data.data.map(mapApiToPaciente);
        set({
          pacientes,
          isLoading: false,
          lastFetchedAt: Date.now(),
          currentPage: response.data.page,
          hasNextPage: response.data.hasNext,
          totalPacientes: response.data.total,
        });
        await persistPacientes(pacientes);
      } catch (error) {
        const originalError = error;
        set({ isLoading: false });
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (status === 401 || status === 403) {
          const cacheKey = await getPacientesCacheKey();
          await AsyncStorage.removeItem(cacheKey);
          set({
            pacientes: [],
            currentPage: 0,
            hasNextPage: true,
            totalPacientes: 0,
            lastFetchedAt: null,
          });
          throw error;
        }
        try {
          const cacheKey = await getPacientesCacheKey();
          const cached = safeParsePacientes(
            await AsyncStorage.getItem(cacheKey),
          );
          if (cached && !get().pacientes.length) {
            set({
              pacientes: cached,
              currentPage: 1,
              hasNextPage: false,
              totalPacientes: cached.length,
              lastFetchedAt: Date.now(),
            });
            return;
          }
        } catch {
          // cache is best-effort and must not shadow the original API error
        }
        throw originalError;
      } finally {
        fetchPacientesInFlight = null;
      }
    })();

    return fetchPacientesInFlight;
  },

  fetchPacienteById: async (id) => {
    const response = await api.get<ApiPaciente>(`/pacientes/${id}`);
    const pacienteAtualizado = mapApiToPaciente(response.data);
    const current = get().pacientes;
    const exists = current.some((p) => p.id === id);
    const nextPacientes = exists
      ? current.map((p) => (p.id === id ? pacienteAtualizado : p))
      : [pacienteAtualizado, ...current];
    set({
      pacientes: nextPacientes,
      lastFetchedAt: Date.now(),
      totalPacientes: Math.max(get().totalPacientes, nextPacientes.length),
    });
    await persistPacientes(nextPacientes);
    return pacienteAtualizado;
  },

  fetchNextPacientes: async () => {
    const state = get();
    if (state.isLoading || state.isLoadingMore || !state.hasNextPage) {
      return;
    }

    set({ isLoadingMore: true });
    try {
      const nextPage = state.currentPage + 1;
      const response = await api.get<ApiPacientesPaged>("/pacientes/paged", {
        params: { page: nextPage, limit: state.pageSize },
      });
      const nextBatch = response.data.data.map(mapApiToPaciente);
      const mergedMap = new Map(
        [...get().pacientes, ...nextBatch].map((paciente) => [paciente.id, paciente]),
      );
      const merged = Array.from(mergedMap.values()).sort((a, b) =>
        a.nomeCompleto.localeCompare(b.nomeCompleto),
      );

      set({
        pacientes: merged,
        isLoadingMore: false,
        lastFetchedAt: Date.now(),
        currentPage: response.data.page,
        hasNextPage: response.data.hasNext,
        totalPacientes: response.data.total,
      });
      await persistPacientes(merged);
    } catch (error) {
      set({ isLoadingMore: false });
      throw error;
    }
  },

  createPaciente: async (paciente) => {
    try {
      set({ isLoading: true });
      const response = await api.post<ApiPaciente>(
        "/pacientes",
        mapPayloadToApi(paciente),
      );
      const novoPaciente = mapApiToPaciente(response.data);
      const nextPacientes = [novoPaciente, ...get().pacientes];
      set({
        pacientes: nextPacientes,
        isLoading: false,
        lastFetchedAt: Date.now(),
        totalPacientes: Math.max(get().totalPacientes, nextPacientes.length),
      });
      await persistPacientes(nextPacientes);
      return novoPaciente;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updatePaciente: async (id, paciente) => {
    try {
      set({ isLoading: true });
      const response = await api.patch<ApiPaciente>(
        `/pacientes/${id}`,
        mapPayloadToApi(paciente),
      );
      const pacienteAtualizado = mapApiToPaciente(response.data);
      const nextPacientes = get().pacientes.map((p) =>
        p.id === id ? pacienteAtualizado : p,
      );
      set({
        pacientes: nextPacientes,
        isLoading: false,
        lastFetchedAt: Date.now(),
        totalPacientes: Math.max(get().totalPacientes, nextPacientes.length),
      });
      await persistPacientes(nextPacientes);
      return pacienteAtualizado;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deletePaciente: async (id) => {
    try {
      set({ isLoading: true });
      await api.delete(`/pacientes/${id}`);
      set((state) => ({
        pacientes: state.pacientes.filter((p) => p.id !== id),
        isLoading: false,
        lastFetchedAt: Date.now(),
        totalPacientes: Math.max(0, state.totalPacientes - 1),
      }));
      const nextPacientes = get().pacientes.filter((p) => p.id !== id);
      await persistPacientes(nextPacientes);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setPacienteAtual: (paciente) => set({ pacienteAtual: paciente }),

  getPacienteById: (id) => get().pacientes.find((p) => p.id === id),
}));









