// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// ANAMNESE STORE - ZUSTAND
// ==========================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { api } from "../services";
import {
  Anamnese,
  AreaAfetada,
  MotivoBusca,
  InicioProblema,
  TipoDor,
  MecanismoLesao,
} from "../types";

type AnamnesePayload = {
  pacienteId?: string;
  motivoBusca: MotivoBusca;
  areasAfetadas?: AreaAfetada[];
  intensidadeDor?: number;
  descricaoSintomas?: string;
  tempoProblema?: string;
  horaIntensifica?: string;
  inicioProblema?: InicioProblema;
  eventoEspecifico?: string;
  fatorAlivio?: string;
  mecanismoLesao?: MecanismoLesao;
  fatoresPiora?: string;
  dorRepouso?: boolean;
  dorNoturna?: boolean;
  irradiacao?: boolean;
  localIrradiacao?: string;
  tipoDor?: TipoDor;
  sinaisSensibilizacaoCentral?: string;
  redFlags?: string[];
  yellowFlags?: string[];
  problemaAnterior?: boolean;
  quandoProblemaAnterior?: string;
  tratamentosAnteriores?: string[];
  historicoFamiliar?: string;
  historicoEsportivo?: string;
  lesoesPrevias?: string;
  usoMedicamentos?: string;
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
};

const getAnamnesesCacheKey = (pacienteId: string) =>
  `cache:anamneses:${pacienteId}`;

const formatDateShort = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const withDerivedFields = (anamnese: Anamnese): Anamnese => ({
  ...anamnese,
  createdAtFormatada: formatDateShort(anamnese.createdAt),
});

const safeParseAnamneses = (raw: string | null): Anamnese[] | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Anamnese[];
    return Array.isArray(parsed) ? parsed.map(withDerivedFields) : null;
  } catch {
    return null;
  }
};

const persistAnamneses = async (pacienteId: string, anamneses: Anamnese[]) => {
  try {
    await AsyncStorage.setItem(
      getAnamnesesCacheKey(pacienteId),
      JSON.stringify(anamneses),
    );
  } catch {
    // cache is best-effort
  }
};

const SAVE_ANAMNESE_TIMEOUT_MS = 45000;

export const useAnamneseStore = create<{
  anamneses: Anamnese[];
  isLoading: boolean;
  fetchAnamnesesByPaciente: (pacienteId: string) => Promise<void>;
  createAnamnese: (payload: AnamnesePayload) => Promise<Anamnese>;
  updateAnamnese: (id: string, payload: AnamnesePayload) => Promise<Anamnese>;
  fetchMyLatestAnamnese: () => Promise<Anamnese | null>;
  createMyAnamnese: (payload: AnamnesePayload) => Promise<Anamnese>;
  updateMyAnamnese: (id: string, payload: AnamnesePayload) => Promise<Anamnese>;
  deleteAnamnese: (id: string) => Promise<void>;
  getAnamneseById: (id: string) => Anamnese | undefined;
}>((set, get) => ({
  anamneses: [],
  isLoading: false,

  fetchAnamnesesByPaciente: async (pacienteId: string) => {
    try {
      set({ isLoading: true });
      const cached = safeParseAnamneses(
        await AsyncStorage.getItem(getAnamnesesCacheKey(pacienteId)),
      );
      if (cached) {
        set({ anamneses: cached });
      }
      const response = await api.get<Anamnese[]>("/anamneses", {
        params: { pacienteId },
      });
      const nextAnamneses = response.data.map(withDerivedFields);
      set({ anamneses: nextAnamneses, isLoading: false });
      await persistAnamneses(pacienteId, nextAnamneses);
    } catch (error) {
      set({ isLoading: false });
      const cached = safeParseAnamneses(
        await AsyncStorage.getItem(getAnamnesesCacheKey(pacienteId)),
      );
      if (cached) return;
      throw error;
    }
  },

  createAnamnese: async (payload: AnamnesePayload) => {
    try {
      set({ isLoading: true });
      const response = await api.post<Anamnese>("/anamneses", payload, {
        timeout: SAVE_ANAMNESE_TIMEOUT_MS,
      });
      const nextAnamneses = [withDerivedFields(response.data), ...get().anamneses];
      set({
        anamneses: nextAnamneses,
        isLoading: false,
      });
      if (response.data.pacienteId) {
        await persistAnamneses(response.data.pacienteId, nextAnamneses);
      }
      return withDerivedFields(response.data);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateAnamnese: async (id: string, payload: AnamnesePayload) => {
    try {
      set({ isLoading: true });
      const response = await api.patch<Anamnese>(`/anamneses/${id}`, payload, {
        timeout: SAVE_ANAMNESE_TIMEOUT_MS,
      });
      const updated = withDerivedFields(response.data);
      const nextAnamneses = get().anamneses.map((a) =>
        a.id === id ? updated : a,
      );
      set({
        anamneses: nextAnamneses,
        isLoading: false,
      });
      if (response.data.pacienteId) {
        await persistAnamneses(response.data.pacienteId, nextAnamneses);
      }
      return updated;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchMyLatestAnamnese: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get<Anamnese | null>("/anamneses/me/latest");
      const latest = response.data ? withDerivedFields(response.data) : null;
      if (latest) {
        const existing = get().anamneses.filter((a) => a.id !== latest.id);
        const nextAnamneses = [latest, ...existing];
        set({ anamneses: nextAnamneses, isLoading: false });
        await persistAnamneses(latest.pacienteId, nextAnamneses);
      } else {
        set({ isLoading: false });
      }
      return latest;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createMyAnamnese: async (payload: AnamnesePayload) => {
    try {
      set({ isLoading: true });
      const { pacienteId: _ignoredPacienteId, ...requestPayload } = payload;
      const response = await api.post<Anamnese>("/anamneses/me", requestPayload, {
        timeout: SAVE_ANAMNESE_TIMEOUT_MS,
      });
      const created = withDerivedFields(response.data);
      const nextAnamneses = [created, ...get().anamneses.filter((a) => a.id !== created.id)];
      set({ anamneses: nextAnamneses, isLoading: false });
      await persistAnamneses(created.pacienteId, nextAnamneses);
      return created;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateMyAnamnese: async (id: string, payload: AnamnesePayload) => {
    try {
      set({ isLoading: true });
      const { pacienteId: _ignoredPacienteId, ...requestPayload } = payload;
      const response = await api.patch<Anamnese>(`/anamneses/me/${id}`, requestPayload, {
        timeout: SAVE_ANAMNESE_TIMEOUT_MS,
      });
      const updated = withDerivedFields(response.data);
      const nextAnamneses = get().anamneses.map((a) =>
        a.id === id ? updated : a,
      );
      set({ anamneses: nextAnamneses, isLoading: false });
      await persistAnamneses(updated.pacienteId, nextAnamneses);
      return updated;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteAnamnese: async (id: string) => {
    try {
      set({ isLoading: true });
      const existente = get().anamneses.find((a) => a.id === id);
      await api.delete(`/anamneses/${id}`);
      const nextAnamneses = get().anamneses.filter((a) => a.id !== id);
      set({
        anamneses: nextAnamneses,
        isLoading: false,
      });
      if (existente?.pacienteId) {
        await persistAnamneses(existente.pacienteId, nextAnamneses);
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  getAnamneseById: (id: string) => get().anamneses.find((a) => a.id === id),
}));
