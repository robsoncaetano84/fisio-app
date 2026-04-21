// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// EVOLUCAO STORE - ZUSTAND
// ==========================================

import { create } from "zustand";
import axios from "axios";
import { api } from "../services";
import { Evolucao, VariacaoStatus, AdesaoStatus, EvolucaoStatus, CondutaStatus } from "../types";

type EvolucaoPayload = {
  pacienteId?: string;
  data?: string;
  subjetivo?: string;
  objetivo?: string;
  avaliacao: string;
  plano?: string;
  // Compatibilidade legada
  listagens?: string;
  legCheck?: string;
  ajustes?: string;
  orientacoes?: string;
  checkinDor?: number;
  checkinDificuldade?: "FACIL" | "MEDIO" | "DIFICIL";
  checkinObservacao?: string;
  dorStatus?: VariacaoStatus;
  funcaoStatus?: VariacaoStatus;
  adesaoStatus?: AdesaoStatus;
  statusEvolucao?: EvolucaoStatus;
  condutaStatus?: CondutaStatus;
  observacoes?: string;
};

const parseDatePreservingDateOnly = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

const formatDateShort = (dateString: string) => {
  if (!dateString) return "";
  const date = parseDatePreservingDateOnly(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const withDerivedFields = (evolucao: Evolucao): Evolucao => ({
  ...evolucao,
  dataFormatada: evolucao.dataFormatada || formatDateShort(evolucao.data),
  horaFormatada: evolucao.horaFormatada || formatTime(evolucao.data),
});

export const useEvolucaoStore = create<{
  evolucoes: Evolucao[];
  isLoading: boolean;
  fetchEvolucoesByPaciente: (pacienteId: string) => Promise<void>;
  createEvolucao: (payload: EvolucaoPayload) => Promise<Evolucao>;
  updateEvolucao: (id: string, payload: EvolucaoPayload) => Promise<Evolucao>;
  deleteEvolucao: (id: string) => Promise<void>;
  getEvolucaoById: (id: string) => Evolucao | undefined;
}>((set, get) => ({
  evolucoes: [],
  isLoading: false,

  fetchEvolucoesByPaciente: async (pacienteId: string) => {
    try {
      set({ isLoading: true });
      const response = await api.get<Evolucao[]>("/evolucoes", {
        params: { pacienteId },
      });
      const payload: unknown = response.data;
      const list = Array.isArray(payload)
        ? payload
        : (payload as { data?: unknown })?.data;
      const safeList = Array.isArray(list) ? (list as Evolucao[]) : [];
      const nextEvolucoes = safeList.map(withDerivedFields);
      set({ evolucoes: nextEvolucoes, isLoading: false });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        set({ evolucoes: [], isLoading: false });
        return;
      }
      // Para listagem inicial, evita quebrar UX por erros transitórios de API.
      if (__DEV__) {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        console.warn("[evolucaoStore] fetchEvolucoesByPaciente failed", { status });
      }
      set({ evolucoes: [], isLoading: false });
      return;
    }
  },

  createEvolucao: async (payload: EvolucaoPayload) => {
    try {
      set({ isLoading: true });
      const response = await api.post<Evolucao>("/evolucoes", payload);
      const created = withDerivedFields(response.data);
      set((state) => ({
        evolucoes: [created, ...state.evolucoes],
        isLoading: false,
      }));
      return created;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateEvolucao: async (id: string, payload: EvolucaoPayload) => {
    try {
      set({ isLoading: true });
      const response = await api.patch<Evolucao>(`/evolucoes/${id}`, payload);
      const updated = withDerivedFields(response.data);
      set((state) => ({
        evolucoes: state.evolucoes.map((e) =>
          e.id === id ? updated : e,
        ),
        isLoading: false,
      }));
      return updated;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteEvolucao: async (id: string) => {
    try {
      set({ isLoading: true });
      await api.delete(`/evolucoes/${id}`);
      set((state) => ({
        evolucoes: state.evolucoes.filter((e) => e.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  getEvolucaoById: (id: string) => get().evolucoes.find((e) => e.id === id),
}));




