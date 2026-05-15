import type { CrmPhysicalExamTestsSummary } from "../../services/crm";
import type {
  ExamChartMode,
  ExamConfidenceFilter,
} from "./AdminCrmScreen.models";

export const PHYSICAL_EXAM_CSV_HEADERS = [
  "tipo",
  "modo_ordenacao",
  "base_minima_avaliados",
  "filtro_confianca_amostral",
  "gerado_em",
  "janela_dias",
  "laudos_analisados",
  "laudos_com_exame_estruturado",
  "total_avaliados",
  "total_positivos",
  "taxa_positividade_geral",
  "nome",
  "positivos",
  "avaliados",
  "taxa_positividade",
];

export const buildPhysicalExamSummaryCsvRows = (
  summary: CrmPhysicalExamTestsSummary,
  mode: ExamChartMode,
  minSample: number,
  confidenceFilter: ExamConfidenceFilter,
) => {
  const rows: Array<Record<string, unknown>> = [];
  const minSampleValue = mode === "TAXA" ? minSample : "";
  const confidenceValue = mode === "TAXA" ? confidenceFilter : "";

  rows.push({
    tipo: "resumo",
    modo_ordenacao: mode,
    base_minima_avaliados: minSampleValue,
    filtro_confianca_amostral: confidenceValue,
    gerado_em: new Date().toISOString(),
    janela_dias: summary.windowDays,
    laudos_analisados: summary.laudosAnalisados,
    laudos_com_exame_estruturado: summary.laudosComExameEstruturado,
    total_avaliados: summary.totalAvaliados,
    total_positivos: summary.totalPositivos,
    taxa_positividade_geral: `${Math.round(summary.taxaPositividadeGeral)}%`,
    nome: "",
    positivos: "",
    avaliados: "",
    taxa_positividade: "",
  });

  summary.porRegiao.forEach((item) => {
    rows.push({
      tipo: "regiao",
      modo_ordenacao: mode,
      base_minima_avaliados: minSampleValue,
      filtro_confianca_amostral: confidenceValue,
      gerado_em: "",
      janela_dias: summary.windowDays,
      laudos_analisados: "",
      laudos_com_exame_estruturado: "",
      total_avaliados: "",
      total_positivos: "",
      taxa_positividade_geral: "",
      nome: item.regiao,
      positivos: item.positivos,
      avaliados: item.avaliados,
      taxa_positividade: `${Math.round(item.taxaPositividade)}%`,
    });
  });

  summary.topTestesPositivos.forEach((item) => {
    rows.push({
      tipo: "teste",
      modo_ordenacao: mode,
      base_minima_avaliados: minSampleValue,
      filtro_confianca_amostral: confidenceValue,
      gerado_em: "",
      janela_dias: summary.windowDays,
      laudos_analisados: "",
      laudos_com_exame_estruturado: "",
      total_avaliados: "",
      total_positivos: "",
      taxa_positividade_geral: "",
      nome: item.teste,
      positivos: item.positivos,
      avaliados: item.avaliados,
      taxa_positividade: `${Math.round(item.taxaPositividade)}%`,
    });
  });

  summary.perfisScoring.forEach((item) => {
    rows.push({
      tipo: "perfil_scoring",
      modo_ordenacao: mode,
      base_minima_avaliados: minSampleValue,
      filtro_confianca_amostral: confidenceValue,
      gerado_em: "",
      janela_dias: summary.windowDays,
      laudos_analisados: "",
      laudos_com_exame_estruturado: "",
      total_avaliados: "",
      total_positivos: "",
      taxa_positividade_geral: "",
      nome: item.perfil,
      positivos: item.count,
      avaliados: "",
      taxa_positividade: "",
    });
  });

  return rows;
};
