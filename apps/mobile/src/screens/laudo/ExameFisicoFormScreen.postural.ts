import type { ExameFisicoStructured } from "../../services/physicalExamModel";

type PosturalAssessment =
  ExameFisicoStructured["observacao"]["avaliacaoPostural"];

export type PosturalValidationField =
  | "posturalAdamsRegion"
  | "posturalAdamsAtr"
  | "posturalAdamsDescription";

export type PosturalValidationIssue = {
  field: PosturalValidationField;
  messageKey: string;
};

type AtrParseResult =
  | { kind: "empty"; value: null }
  | { kind: "invalid"; value: null }
  | { kind: "valid"; value: number };

const NON_INFORMATIVE_VALUES = new Set([
  "",
  "N/A",
  "NA",
  "NAO AVALIADO",
  "NAO INFORMADO",
  "NAO SE APLICA",
  "NAO TESTADO",
]);

const normalizeComparable = (value?: unknown) =>
  String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");

export const isPosturalClinicalValue = (value?: unknown) =>
  !NON_INFORMATIVE_VALUES.has(normalizeComparable(value));

export const parsePosturalAtrDegrees = (value?: unknown): AtrParseResult => {
  const raw = String(value ?? "").trim();
  if (!raw) return { kind: "empty", value: null };

  const parsed = Number(raw.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { kind: "invalid", value: null };
  }

  return { kind: "valid", value: parsed };
};

const hasStructuredAdamsFinding = (postural?: PosturalAssessment) => {
  const adams = postural?.adams;
  if (!adams) return false;

  const resultado = normalizeComparable(adams.resultado);
  const intensidade = normalizeComparable(adams.intensidade);
  const atr = parsePosturalAtrDegrees(adams.atrGraus);

  return (
    resultado.includes("ASSIMETRIA") ||
    intensidade === "MODERADA" ||
    intensidade === "IMPORTANTE" ||
    (atr.kind === "valid" && atr.value >= 5)
  );
};

export const hasRelevantPosturalAdamsFinding = (
  postural?: PosturalAssessment,
) => hasStructuredAdamsFinding(postural);

export const validatePosturalAssessment = (
  postural?: PosturalAssessment,
): PosturalValidationIssue[] => {
  const issues: PosturalValidationIssue[] = [];
  const adams = postural?.adams;
  if (!adams) return issues;

  const atr = parsePosturalAtrDegrees(adams.atrGraus);
  const hasAdamsFinding = hasStructuredAdamsFinding(postural);

  if (hasAdamsFinding && !isPosturalClinicalValue(adams.regiao)) {
    issues.push({
      field: "posturalAdamsRegion",
      messageKey: "clinical.validation.posturalAdamsRegionRequired",
    });
  }

  if (atr.kind === "invalid") {
    issues.push({
      field: "posturalAdamsAtr",
      messageKey: "clinical.validation.posturalAdamsAtrInvalid",
    });
  }

  if (
    atr.kind === "valid" &&
    atr.value >= 5 &&
    !isPosturalClinicalValue(postural?.testeAdams)
  ) {
    issues.push({
      field: "posturalAdamsDescription",
      messageKey: "clinical.validation.posturalAdamsDescriptionRequired",
    });
  }

  return issues;
};
