// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// LAUDO STORE
// ==========================================
import axios from "axios";
import { create } from "zustand";
import { api } from "../services";
import { Laudo } from "../types";

type CreateLaudoPayload = {
  pacienteId?: string;
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
  criteriosAlta?: string;
  sugestaoSource?: "ai" | "rules";
  examesConsiderados?: number;
  examesComLeituraIa?: number;
};

export const useLaudoStore = create<{
  laudoAtual: Laudo | null;
  isLoading: boolean;
  fetchLaudoByPaciente: (
    pacienteId: string,
    autoGenerate?: boolean,
  ) => Promise<Laudo | null>;
  createLaudo: (payload: CreateLaudoPayload) => Promise<Laudo>;
  updateLaudo: (id: string, payload: Partial<CreateLaudoPayload>) => Promise<Laudo>;
    validarLaudo: (id: string) => Promise<Laudo>;
}>((set) => ({
  laudoAtual: null,
  isLoading: false,

  fetchLaudoByPaciente: async (pacienteId: string, autoGenerate = false) => {
    try {
      set({ isLoading: true });
      const response = await api.get<Laudo | null>("/laudos", {
        params: { pacienteId, autoGenerate },
      });
      const laudo = response.data || null;
      set({ laudoAtual: laudo, isLoading: false });
      return laudo;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        set({ laudoAtual: null, isLoading: false });
        return null;
      }
      set({ isLoading: false });
      throw error;
    }
  },

  createLaudo: async (payload: CreateLaudoPayload) => {
    try {
      set({ isLoading: true });
      const response = await api.post<Laudo>("/laudos", payload);
      set({ laudoAtual: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateLaudo: async (id: string, payload: Partial<CreateLaudoPayload>) => {
    try {
      set({ isLoading: true });
      const response = await api.patch<Laudo>(`/laudos/${id}`, payload);
      set({ laudoAtual: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  validarLaudo: async (id: string) => {
    try {
      set({ isLoading: true });
      const response = await api.post<Laudo>(`/laudos/${id}/validar`);
      set({ laudoAtual: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));



