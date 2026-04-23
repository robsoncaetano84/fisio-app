import { api } from "./api";
import { Anamnese } from "../types";

export type LaudoAiSuggestion = Partial<{
  diagnosticoFuncional: string;
  objetivosCurtoPrazo: string;
  objetivosMedioPrazo: string;
  frequenciaSemanal: number;
  duracaoSemanas: number;
  condutas: string;
  planoTratamentoIA: string;
  criteriosAlta: string;
  source: "ai" | "rules";
  examesConsiderados: number;
  examesComLeituraIa: number;
  sugestaoGeradaEm: string;
  confidence: "BAIXA" | "MODERADA" | "ALTA";
  reason: string;
  evidenceFields: string[];
}>;

const mapMotivoBusca = (motivo?: Anamnese["motivoBusca"]) => {
  if (motivo === "SINTOMA_EXISTENTE") return "Sintoma existente";
  if (motivo === "PREVENTIVO") return "Preventivo";
  return "Nao informado";
};

const mapInicioProblema = (inicio?: Anamnese["inicioProblema"]) => {
  if (inicio === "GRADUAL") return "Inicio gradual";
  if (inicio === "REPENTINO") return "Inicio repentino";
  if (inicio === "APOS_EVENTO") return "Apos evento especifico";
  if (inicio === "NAO_SABE") return "Paciente nao soube informar";
  return "Nao informado";
};

const boolLabel = (value?: boolean | null) => {
  if (value === true) return "Sim";
  if (value === false) return "Nao";
  return "Nao informado";
};

const safeText = (value?: string | null, fallback = "Nao informado") => {
  const parsed = String(value || "").trim();
  return parsed || fallback;
};

export async function getLaudoAiSuggestion(
  pacienteId: string,
): Promise<LaudoAiSuggestion> {
  const response = await api.post<LaudoAiSuggestion>("/laudos/sugestao-ia", {
    pacienteId,
  });
  return response.data || {};
}

export function buildPhysicalExamTemplateFromAnamnese(anamnese?: Anamnese) {
  const areas = anamnese?.areasAfetadas?.map((a) => a.regiao).filter(Boolean) || [];
  const areaPrincipal = areas[0] || "Regiao principal nao definida";
  const areasTexto = areas.length ? areas.join(", ") : "Nao informado";

  const historiaDor = [
    anamnese?.descricaoSintomas ? "Sintomas: " + anamnese.descricaoSintomas : "",
    anamnese?.tempoProblema ? "Tempo de queixa: " + anamnese.tempoProblema : "",
    "Inicio: " + mapInicioProblema(anamnese?.inicioProblema),
    anamnese?.fatorAlivio ? "Fator de alivio: " + anamnese.fatorAlivio : "",
    anamnese?.atividadesQuePioram
      ? "Atividades que pioram: " + anamnese.atividadesQuePioram
      : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const limitacoes = safeText(anamnese?.limitacoesFuncionais);
  const tipoDor = safeText(anamnese?.tipoDor, "Nao classificado");
  const irradiacao = boolLabel(anamnese?.irradiacao);
  const localIrradiacao = safeText(anamnese?.localIrradiacao);
  const intensidadeDor =
    typeof anamnese?.intensidadeDor === "number"
      ? String(anamnese.intensidadeDor) + "/10"
      : "Nao informado";

  const observacaoPostural =
    areas.length > 0
      ? "Avaliacao dirigida para: " + areasTexto + "."
      : "Avaliacao postural global necessaria para definir cadeias envolvidas.";

  return [
    "Avaliacao Inicial",
    "Queixa principal: " + safeText(anamnese?.descricaoSintomas, areaPrincipal),
    "Historia da dor: " + safeText(historiaDor, "Coletar durante exame fisico"),
    "Limitacoes funcionais: " + limitacoes,
    "",
    "Inspecao Postural",
    "Cabeca: A avaliar presencialmente.",
    "Ombros: A avaliar presencialmente.",
    "Coluna: " + observacaoPostural,
    "Pelve: A avaliar alinhamento e controle lombo-pelvico.",
    "Joelhos: A avaliar estabilidade e eixo dinamico.",
    "Pes: A avaliar apoio, descarga e estrategia de equilibrio.",
    "",
    "Amplitude de Movimento (ADM)",
    "Movimento | Ativo | Passivo | Dor",
    "Flexao | Aferir | Aferir | Aferir",
    "Extensao | Aferir | Aferir | Aferir",
    "Rotacao | Aferir | Aferir | Aferir",
    "",
    "Forca Muscular (0-5)",
    "Membro superior: Aferir por grupamentos principais.",
    "Membro inferior: Aferir por grupamentos principais.",
    "Core: Aferir estabilidade e resistencia.",
    "",
    "Testes Especiais",
    "Ortopedicos: Selecionar conforme hipotese funcional.",
    "Neurologicos: Irradiacao " + irradiacao + "; local " + localIrradiacao + ".",
    "Funcionais: Sentar-levantar, agachar, marcha e tarefa especifica.",
    "",
    "Equilibrio e Coordenacao",
    "Estatico: A avaliar.",
    "Dinamico: A avaliar.",
    "Propriocepcao: A avaliar.",
    "",
    "Avaliacao da Marcha",
    "Fases: A observar apoio, medio apoio e balanco.",
    "Alteracoes: A documentar conforme regiao sintomatica.",
    "Compensacoes: A documentar com foco em economia de movimento.",
    "",
    "Diagnostico Funcional",
    "Cadeias musculares envolvidas: Suspeita inicial para " + areasTexto + ".",
    "Disfuncoes: Tipo de dor " + tipoDor + "; intensidade atual " + intensidadeDor + ".",
    "",
    "Plano Terapeutico",
    "Objetivos: " + safeText(anamnese?.metaPrincipalPaciente),
    "Tecnicas: Exercicio terapeutico, terapia manual e educacao em dor conforme resposta.",
    "Frequencia: Definir conforme gravidade funcional e adesao.",
    "",
    "Base da anamnese: Motivo " +
      mapMotivoBusca(anamnese?.motivoBusca) +
      ". Dor noturna: " +
      boolLabel(anamnese?.dorNoturna) +
      ". Dor em repouso: " +
      boolLabel(anamnese?.dorRepouso) +
      ".",
  ].join("\n");
}
